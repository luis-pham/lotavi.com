import type { FastifyInstance } from "fastify";
import { CanonicalVoiceEventSchema } from "@lotiva/contracts";
import { newId } from "@lotiva/domain";
import { getAppContext } from "../app-context.js";
import { sendError } from "../plugins/observability.js";

export async function registerVoiceRoutes(app: FastifyInstance) {
  app.post("/api/v1/voice/sessions", async (req, reply) => {
    const ctx = getAppContext();
    if (!ctx.voiceEnabled) {
      return sendError(reply, req, 503, "VOICE_DISABLED", "Voice is disabled by configuration");
    }
    const cookieName = process.env.GUEST_COOKIE_NAME ?? "lotiva_guest";
    const raw = req.cookies?.[cookieName];
    if (!raw) return sendError(reply, req, 401, "GUEST_UNAUTHORIZED", "No guest session");
    let guest: { sessionId: string; tenantId: string };
    try {
      const unsigned = req.unsignCookie(raw);
      guest = JSON.parse(unsigned.valid && unsigned.value ? unsigned.value : raw) as {
        sessionId: string;
        tenantId: string;
      };
    } catch {
      return sendError(reply, req, 401, "GUEST_UNAUTHORIZED", "Invalid guest session");
    }
    const conversation = await ctx.repos.conversations.getOrCreate(guest.sessionId, guest.tenantId);
    const sessionId = newId();
    try {
      await ctx.voice.connect(sessionId, { conversationId: conversation.id });
    } catch (err) {
      const code = (err as { code?: string }).code ?? "VOICE_CONNECT_FAILED";
      return sendError(reply, req, 503, code, (err as Error).message);
    }
    const ready = ctx.voice.toCanonicalReady(sessionId);
    const parsed = CanonicalVoiceEventSchema.parse(ready);
    return {
      voiceSessionId: sessionId,
      conversationId: conversation.id,
      event: parsed,
      providerBound: ctx.voice.isLiveProviderBound(),
      wsPath: `/api/v1/voice/ws?sessionId=${sessionId}`,
    };
  });

  app.get("/api/v1/voice/sessions/:id/state", async (req, reply) => {
    const ctx = getAppContext();
    const { id } = req.params as { id: string };
    const state = ctx.voice.getState(id);
    if (!state) return sendError(reply, req, 404, "VOICE_NOT_FOUND", "Session not found");
    return { state };
  });

  app.register(async (wsApp) => {
    wsApp.get("/api/v1/voice/ws", { websocket: true }, (socket, req) => {
      const ctx = getAppContext();
      if (!ctx.voiceEnabled) {
        socket.close();
        return;
      }
      const sessionId = (req.query as { sessionId?: string }).sessionId;
      if (!sessionId) {
        socket.close();
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
