import type { FastifyInstance } from "fastify";
import { CanonicalVoiceEventSchema } from "@lotiva/contracts";
import { newId } from "@lotiva/domain";
import {
  buildGeminiLiveWsUrl,
  mintGeminiLiveEphemeralToken,
  propertyAllowlisted,
} from "@lotiva/infrastructure";
import { getAppContext, getConfig } from "../app-context.js";
import { requireActiveGuest } from "../lib/guest-auth.js";
import { bumpVoiceMetric, observeFirstAudioLatencyMs } from "../lib/voice-metrics.js";
import { sendError } from "../plugins/observability.js";

const SPIKE_SYSTEM_INSTRUCTION =
  "You are Lotavi guest assistant for a hospitality property. " +
  "Answer briefly about property amenities using only information the guest already knows from staff. " +
  "Do not create service tickets, reservations, or any write actions. " +
  "If unsure, tell the guest to use text chat or contact the front desk.";

const TERMINAL = new Set(["ended", "failed", "expired", "abandoned"]);

function noStore(reply: { header: (k: string, v: string) => unknown }) {
  reply.header("Cache-Control", "no-store");
  reply.header("Pragma", "no-cache");
}

async function sweepAbandoned() {
  const ctx = getAppContext();
  const env = getConfig();
  const olderThan = new Date(Date.now() - env.VOICE_HEARTBEAT_TTL_SECONDS * 1000);
  const n = await ctx.repos.voiceSessions.abandonStale(olderThan);
  if (n > 0) {
    bumpVoiceMetric("voice_session_abandoned_total", {
      environment: env.NODE_ENV,
      provider: "gemini_live",
      result: "timeout",
    }, n);
  }
}

export async function registerVoiceRoutes(app: FastifyInstance) {
  const cookieName = () => process.env.GUEST_COOKIE_NAME ?? "lotiva_guest";

  /** Capability probe — no secrets; used to hide voice UI when disabled. */
  app.get("/api/v1/voice/capabilities", async (req, reply) => {
    const env = getConfig();
    const ctx = getAppContext();
    noStore(reply);
    const diagnostics =
      env.NODE_ENV !== "production" &&
      env.DIRECT_GEMINI_ENABLED &&
      (env.NODE_ENV === "development" || env.DIRECT_GEMINI_STAGING_ACKNOWLEDGED);
    return {
      voiceEnabled: ctx.voiceEnabled && env.VOICE_TRANSPORT !== "off",
      transport: env.VOICE_TRANSPORT,
      directEnabled: env.DIRECT_GEMINI_ENABLED && env.VOICE_TRANSPORT === "direct",
      writeToolsEnabled: false,
      ragToolsEnabled: false,
      textFallbackEnabled: env.VOICE_TEXT_FALLBACK_ENABLED,
      diagnosticsEnabled: diagnostics,
      experimental: true,
      environment: env.NODE_ENV,
    };
  });

  app.post("/api/v1/voice/sessions", async (req, reply) => {
    const ctx = getAppContext();
    const env = getConfig();
    noStore(reply);
    if (!ctx.voiceEnabled || env.VOICE_TRANSPORT === "off") {
      return sendError(reply, req, 503, "VOICE_DISABLED", "Voice is disabled by configuration");
    }

    const guest = await requireActiveGuest(req, cookieName());
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);

    await sweepAbandoned();

    const rl = await Promise.resolve(
      ctx.rateLimit.take(`voice-session:${guest.cookie.tenantId}:${req.ip}`),
    );
    if (!rl.allowed) {
      reply.header("retry-after", Math.ceil(rl.retryAfterMs / 1000));
      return sendError(reply, req, 429, "RATE_LIMITED", "Too many voice sessions");
    }

    const open = await ctx.repos.voiceSessions.countOpenForProperty(
      guest.cookie.propertyId,
      guest.cookie.tenantId,
    );
    if (open >= env.VOICE_MAX_CONCURRENT_PER_PROPERTY) {
      return sendError(
        reply,
        req,
        429,
        "VOICE_CONCURRENCY",
        "Too many concurrent voice sessions for this property",
      );
    }

    // Ignore any client-supplied tenant/property/model/tools — cookie is source of truth.
    const transport = env.VOICE_TRANSPORT === "direct" ? "direct" : "relay";
    if (transport === "direct") {
      if (!env.DIRECT_GEMINI_ENABLED) {
        return sendError(reply, req, 503, "DIRECT_GEMINI_DISABLED", "Direct Gemini is disabled");
      }
      if (!propertyAllowlisted(env.DIRECT_GEMINI_PROPERTY_ALLOWLIST, guest.cookie.propertyId)) {
        return sendError(
          reply,
          req,
          403,
          "PROPERTY_NOT_ALLOWLISTED",
          "Property not allowlisted for direct voice",
        );
      }
    }

    const conversation = await ctx.repos.conversations.getOrCreate(
      guest.cookie.sessionId,
      guest.cookie.tenantId,
    );
    const sessionId = newId();

    try {
      await ctx.voice.connect(sessionId, {
        conversationId: conversation.id,
        tenantId: guest.cookie.tenantId,
        propertyId: guest.cookie.propertyId,
        guestSessionId: guest.cookie.sessionId,
        transport,
      });
    } catch (err) {
      const code = (err as { code?: string }).code ?? "VOICE_CONNECT_FAILED";
      return sendError(reply, req, 503, code, (err as Error).message);
    }

    await ctx.repos.voiceSessions.create({
      id: sessionId,
      tenantId: guest.cookie.tenantId,
      propertyId: guest.cookie.propertyId,
      guestSessionId: guest.cookie.sessionId,
      conversationId: conversation.id,
      transport,
      status: "created",
    });

    bumpVoiceMetric("voice_session_created_total", {
      environment: env.NODE_ENV,
      provider: "gemini_live",
      result: "ok",
    });

    const ready = ctx.voice.toCanonicalReady(sessionId);
    const parsed = CanonicalVoiceEventSchema.parse(ready);
    return {
      voiceSessionId: sessionId,
      conversationId: conversation.id,
      event: parsed,
      providerBound: ctx.voice.isLiveProviderBound(),
      transport,
      wsPath: transport === "relay" ? `/api/v1/voice/ws?sessionId=${sessionId}` : null,
      directMintPath: transport === "direct" ? "/api/v1/voice/direct/ephemeral" : null,
      maxSessionSeconds: env.VOICE_MAX_SESSION_SECONDS,
      textFallbackEnabled: env.VOICE_TEXT_FALLBACK_ENABLED,
      experimental: transport === "direct",
    };
  });

  /**
   * Mint short-lived Gemini Live credential for browser direct connect.
   * Browser body may only supply voiceSessionId — all other fields ignored.
   */
  app.post("/api/v1/voice/direct/ephemeral", async (req, reply) => {
    const ctx = getAppContext();
    const env = getConfig();
    noStore(reply);

    if (!ctx.voiceEnabled || !env.DIRECT_GEMINI_ENABLED || env.VOICE_TRANSPORT !== "direct") {
      return sendError(reply, req, 503, "DIRECT_GEMINI_DISABLED", "Direct Gemini spike is disabled");
    }
    if (env.NODE_ENV === "production") {
      return sendError(reply, req, 503, "DIRECT_GEMINI_DISABLED", "Direct mode forbidden in production");
    }
    if (env.NODE_ENV === "staging" && !env.DIRECT_GEMINI_STAGING_ACKNOWLEDGED) {
      return sendError(
        reply,
        req,
        503,
        "STAGING_ACK_REQUIRED",
        "Staging direct mode requires operator acknowledgement",
      );
    }
    if (env.VOICE_WRITE_TOOLS_ENABLED || env.VOICE_RAG_TOOLS_ENABLED) {
      return sendError(reply, req, 503, "VOICE_TOOLS_FORBIDDEN", "Voice tools must remain disabled");
    }
    if (!env.GEMINI_API_KEY) {
      return sendError(reply, req, 503, "VOICE_PROVIDER_MISCONFIGURED", "GEMINI_API_KEY required");
    }

    const guest = await requireActiveGuest(req, cookieName());
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);

    if (!propertyAllowlisted(env.DIRECT_GEMINI_PROPERTY_ALLOWLIST, guest.cookie.propertyId)) {
      return sendError(
        reply,
        req,
        403,
        "PROPERTY_NOT_ALLOWLISTED",
        "Property not allowlisted for direct Gemini spike",
      );
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    // Explicitly ignore client attempts to control provider policy.
    void body.model;
    void body.tools;
    void body.systemInstruction;
    void body.responseModalities;
    void body.tenantId;
    void body.propertyId;
    void body.apiKey;
    void body.expiresAt;
    void body.providerUrl;

    const voiceSessionId =
      typeof body.voiceSessionId === "string" ? body.voiceSessionId : undefined;
    if (!voiceSessionId) {
      return sendError(reply, req, 400, "VALIDATION", "voiceSessionId required");
    }

    const owned = await ctx.repos.voiceSessions.assertOwnedByGuest(
      voiceSessionId,
      guest.cookie.sessionId,
      guest.cookie.tenantId,
    );
    if (!owned || owned.transport !== "direct") {
      return sendError(reply, req, 404, "VOICE_NOT_FOUND", "Voice session not found for guest");
    }
    if (TERMINAL.has(owned.status)) {
      return sendError(reply, req, 409, "VOICE_SESSION_CLOSED", "Voice session already ended");
    }

    const rl = await Promise.resolve(
      ctx.rateLimit.take(`voice-mint:${guest.cookie.tenantId}:${req.ip}`),
    );
    if (!rl.allowed) {
      bumpVoiceMetric("voice_token_mint_failed_total", {
        environment: env.NODE_ENV,
        provider: "gemini_live",
        result: "rate_limited",
      });
      reply.header("retry-after", Math.ceil(rl.retryAfterMs / 1000));
      return sendError(reply, req, 429, "RATE_LIMITED", "Too many mint attempts");
    }

    try {
      const minted = await mintGeminiLiveEphemeralToken({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_LIVE_MODEL,
        systemInstruction: SPIKE_SYSTEM_INSTRUCTION,
        expireMinutes: Math.min(30, Math.ceil(env.VOICE_MAX_SESSION_SECONDS / 60)),
        newSessionExpireSeconds: 60,
      });

      await ctx.repos.voiceSessions.updateStatus({
        id: voiceSessionId,
        tenantId: guest.cookie.tenantId,
        status: "token_issued",
        lastHeartbeatAt: new Date(),
      });

      bumpVoiceMetric("voice_token_mint_total", {
        environment: env.NODE_ENV,
        provider: "gemini_live",
        model: env.GEMINI_LIVE_MODEL,
        result: "ok",
      });

      // Never log minted.token — return minimal browser-required shape only.
      return {
        voiceSessionId,
        ephemeralToken: minted.token,
        providerEndpoint: minted.providerEndpoint,
        model: minted.model,
        expiresAt: minted.expireTime,
        locale: guest.session.locale ?? "en",
        responseModalities: minted.responseModalities,
        transcription: minted.transcription,
        // Convenience for browser (token already in query by provider requirement)
        wsUrl: buildGeminiLiveWsUrl(minted.token),
        apiVersion: minted.apiVersion,
        newSessionExpireTime: minted.newSessionExpireTime,
      };
    } catch (err) {
      const status = (err as { status?: number }).status;
      bumpVoiceMetric("voice_token_mint_failed_total", {
        environment: env.NODE_ENV,
        provider: "gemini_live",
        result: status === 429 ? "quota" : "error",
      });
      const code =
        status === 429
          ? "PROVIDER_QUOTA"
          : ((err as { code?: string }).code ?? "EPHEMERAL_MINT_FAILED");
      // Never include err.message if it might contain token material.
      return sendError(reply, req, 502, code, "Failed to mint ephemeral credential");
    }
  });

  app.post("/api/v1/voice/sessions/:id/heartbeat", async (req, reply) => {
    const ctx = getAppContext();
    const env = getConfig();
    noStore(reply);
    const guest = await requireActiveGuest(req, cookieName());
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);

    const rl = await Promise.resolve(
      ctx.rateLimit.take(`voice-hb:${guest.cookie.tenantId}:${guest.cookie.sessionId}`),
    );
    if (!rl.allowed) {
      reply.header("retry-after", Math.ceil(rl.retryAfterMs / 1000));
      return sendError(reply, req, 429, "RATE_LIMITED", "Heartbeat rate limited");
    }

    const { id } = req.params as { id: string };
    // Ignore client body tenant/property — ownership from cookie only.
    const ok = await ctx.repos.voiceSessions.heartbeat(
      id,
      guest.cookie.tenantId,
      guest.cookie.sessionId,
    );
    if (!ok) return sendError(reply, req, 404, "VOICE_NOT_FOUND", "Session not found");

    bumpVoiceMetric("voice_heartbeat_total", {
      environment: env.NODE_ENV,
      provider: "gemini_live",
      result: "ok",
    });
    return { ok: true, serverTimestamp: new Date().toISOString() };
  });

  /** Diagnostic lifecycle ack from browser (not billing-quality truth). */
  app.post("/api/v1/voice/sessions/:id/lifecycle", async (req, reply) => {
    const ctx = getAppContext();
    const env = getConfig();
    noStore(reply);
    const guest = await requireActiveGuest(req, cookieName());
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as {
      status?: string;
      terminationReason?: string;
      firstAudioLatencyMs?: number;
      event?: string;
    };
    const owned = await ctx.repos.voiceSessions.assertOwnedByGuest(
      id,
      guest.cookie.sessionId,
      guest.cookie.tenantId,
    );
    if (!owned) return sendError(reply, req, 404, "VOICE_NOT_FOUND", "Session not found");

    const allowed = new Set([
      "connecting",
      "active",
      "disconnecting",
      "failed",
      "ended",
    ]);
    const status = typeof body.status === "string" && allowed.has(body.status)
      ? body.status
      : null;
    if (!status) {
      return sendError(reply, req, 400, "VALIDATION", "Invalid lifecycle status");
    }

    const ended = status === "ended" || status === "failed";
    await ctx.repos.voiceSessions.updateStatus({
      id,
      tenantId: guest.cookie.tenantId,
      status,
      lastHeartbeatAt: new Date(),
      ...(ended
        ? {
            endedAt: new Date(),
            terminationReason: body.terminationReason?.slice(0, 64) ?? status,
          }
        : {}),
    });

    if (status === "connecting") {
      bumpVoiceMetric("voice_connection_attempt_total", {
        environment: env.NODE_ENV,
        provider: "gemini_live",
        result: "attempt",
      });
    }
    if (status === "active") {
      bumpVoiceMetric("voice_connection_active_total", {
        environment: env.NODE_ENV,
        provider: "gemini_live",
        result: "ok",
      });
    }
    if (status === "failed") {
      bumpVoiceMetric("voice_connection_failed_total", {
        environment: env.NODE_ENV,
        provider: "gemini_live",
        result: body.terminationReason?.slice(0, 32) ?? "failed",
      });
      bumpVoiceMetric("voice_text_fallback_total", {
        environment: env.NODE_ENV,
        provider: "gemini_live",
        result: "fallback",
      });
    }
    if (status === "ended") {
      bumpVoiceMetric("voice_session_ended_total", {
        environment: env.NODE_ENV,
        provider: "gemini_live",
        termination_reason: body.terminationReason?.slice(0, 32) ?? "ended",
      });
    }
    if (body.event === "input_transcript") {
      bumpVoiceMetric("voice_input_transcript_received_total", {
        environment: env.NODE_ENV,
        provider: "gemini_live",
        result: "ok",
      });
    }
    if (body.event === "output_transcript") {
      bumpVoiceMetric("voice_output_transcript_received_total", {
        environment: env.NODE_ENV,
        provider: "gemini_live",
        result: "ok",
      });
    }
    if (body.event === "interruption") {
      bumpVoiceMetric("voice_interruption_total", {
        environment: env.NODE_ENV,
        provider: "gemini_live",
        result: "ok",
      });
    }
    if (typeof body.firstAudioLatencyMs === "number") {
      observeFirstAudioLatencyMs(body.firstAudioLatencyMs);
    }

    return { ok: true, diagnosticOnly: true };
  });

  app.get("/api/v1/voice/sessions/:id/state", async (req, reply) => {
    const ctx = getAppContext();
    noStore(reply);
    const guest = await requireActiveGuest(req, cookieName());
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const { id } = req.params as { id: string };
    const owned = await ctx.repos.voiceSessions.assertOwnedByGuest(
      id,
      guest.cookie.sessionId,
      guest.cookie.tenantId,
    );
    if (!owned) return sendError(reply, req, 404, "VOICE_NOT_FOUND", "Session not found");
    const state = ctx.voice.getState(id);
    return { state, record: owned };
  });

  app.post("/api/v1/voice/sessions/:id/end", async (req, reply) => {
    const ctx = getAppContext();
    const env = getConfig();
    noStore(reply);
    const guest = await requireActiveGuest(req, cookieName());
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { reason?: string };
    const owned = await ctx.repos.voiceSessions.assertOwnedByGuest(
      id,
      guest.cookie.sessionId,
      guest.cookie.tenantId,
    );
    if (!owned) return sendError(reply, req, 404, "VOICE_NOT_FOUND", "Session not found");
    await ctx.voice.close(id);
    await ctx.repos.voiceSessions.updateStatus({
      id,
      tenantId: guest.cookie.tenantId,
      status: "ended",
      endedAt: new Date(),
      terminationReason: typeof body.reason === "string" ? body.reason.slice(0, 64) : "guest_stop",
    });
    bumpVoiceMetric("voice_session_ended_total", {
      environment: env.NODE_ENV,
      provider: "gemini_live",
      termination_reason: "guest_stop",
    });
    return { ok: true };
  });

  app.register(async (wsApp) => {
    wsApp.get("/api/v1/voice/ws", { websocket: true }, async (socket, req) => {
      const ctx = getAppContext();
      const env = getConfig();
      if (!ctx.voiceEnabled || env.VOICE_TRANSPORT === "off") {
        socket.close(4403, "voice_disabled");
        return;
      }
      if (env.VOICE_TRANSPORT === "direct") {
        socket.close(4403, "use_direct_transport");
        return;
      }

      const sessionId = (req.query as { sessionId?: string }).sessionId;
      if (!sessionId) {
        socket.close(4400, "session_required");
        return;
      }

      const guest = await requireActiveGuest(req, cookieName());
      if (!guest.ok) {
        socket.close(4401, "unauthorized");
        return;
      }

      const owned = await ctx.repos.voiceSessions.assertOwnedByGuest(
        sessionId,
        guest.cookie.sessionId,
        guest.cookie.tenantId,
      );
      if (!owned) {
        socket.close(4403, "forbidden");
        return;
      }

      const ready = ctx.voice.toCanonicalReady(sessionId);
      socket.send(JSON.stringify(ready));

      socket.on("message", async (raw: Buffer | ArrayBuffer | Buffer[]) => {
        try {
          const msg = JSON.parse(String(raw)) as {
            type?: string;
            audioBase64?: string;
          };
          if (msg.type === "input.audio" && msg.audioBase64) {
            await ctx.voice.sendAudio(sessionId, Buffer.from(msg.audioBase64, "base64"));
            const state = ctx.voice.getState(sessionId);
            socket.send(
              JSON.stringify({
                type: "input.speech_started",
                sessionId,
                revision: state?.revision ?? 0,
                payload: {},
                serverTimestamp: new Date().toISOString(),
              }),
            );
          }
          if (msg.type === "session.close") {
            await ctx.voice.close(sessionId);
            await ctx.repos.voiceSessions.updateStatus({
              id: sessionId,
              tenantId: guest.cookie.tenantId,
              status: "ended",
              endedAt: new Date(),
              terminationReason: "ws_close",
            });
            socket.send(
              JSON.stringify({
                type: "session.ended",
                sessionId,
                revision: (ctx.voice.getState(sessionId)?.revision ?? 0) + 1,
                payload: {},
                serverTimestamp: new Date().toISOString(),
              }),
            );
            socket.close();
          }
        } catch {
          socket.send(
            JSON.stringify({
              type: "session.error",
              sessionId,
              revision: 0,
              payload: { code: "VOICE_PROTOCOL_ERROR" },
              serverTimestamp: new Date().toISOString(),
            }),
          );
        }
      });
    });
  });
}
