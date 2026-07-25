"use client";

/**
 * V1.5 experimental spike — browser ↔ Gemini Live via ephemeral token.
 * Staging/development only. No write tools. No RAG tools.
 * Not a production voice product surface.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type Props = {
  voiceSessionId: string;
  mintPath: string;
  diagnosticsEnabled?: boolean;
  onFallbackToText?: (reason: string) => void;
  onStopped?: () => void;
};

type MintResponse = {
  voiceSessionId: string;
  ephemeralToken: string;
  providerEndpoint: string;
  model: string;
  expiresAt: string;
  locale: string;
  responseModalities: string[];
  transcription: { input: boolean; output: boolean };
  wsUrl: string;
  apiVersion: string;
};

type TranscriptLine = {
  id: number;
  role: "input" | "output";
  text: string;
  partial: boolean;
  at: number;
};

type GuestError =
  | "microphone_denied"
  | "no_microphone"
  | "mint_denied"
  | "token_expired"
  | "token_invalid"
  | "property_not_allowed"
  | "provider_unavailable"
  | "provider_quota"
  | "ws_failed"
  | "connection_lost"
  | "malformed_event"
  | "unsupported_browser"
  | "audio_context_failed"
  | "playback_failed"
  | "session_cap"
  | "unknown";

const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;
const MAX_QUEUE_CHUNKS = 48;

function mapApiError(message: string): GuestError {
  const m = message.toLowerCase();
  if (m.includes("allowlist") || m.includes("property_not")) return "property_not_allowed";
  if (m.includes("rate_limited") || m.includes("concurrency") || m.includes("cap")) {
    return "session_cap";
  }
  if (m.includes("quota")) return "provider_quota";
  if (m.includes("mint") || m.includes("ephemeral")) return "mint_denied";
  if (m.includes("expired")) return "token_expired";
  return "unknown";
}

function guestErrorCopy(code: GuestError): string {
  switch (code) {
    case "microphone_denied":
      return "Microphone permission denied. Continue in text chat.";
    case "no_microphone":
      return "No microphone found. Continue in text chat.";
    case "mint_denied":
      return "Voice credential unavailable. Continue in text chat.";
    case "token_expired":
    case "token_invalid":
      return "Voice session expired. Continue in text chat.";
    case "property_not_allowed":
      return "Voice is not enabled for this property.";
    case "provider_unavailable":
    case "ws_failed":
    case "connection_lost":
      return "Voice connection failed. Continue in text chat.";
    case "provider_quota":
      return "Voice temporarily unavailable. Continue in text chat.";
    case "unsupported_browser":
      return "This browser does not support experimental voice.";
    case "audio_context_failed":
    case "playback_failed":
      return "Audio playback failed. Continue in text chat.";
    case "session_cap":
      return "Too many voice sessions. Try again later or use text.";
    default:
      return "Voice failed. Continue in text chat.";
  }
}

export function VoiceDirectSpike({
  voiceSessionId,
  mintPath,
  diagnosticsEnabled = false,
  onFallbackToText,
  onStopped,
}: Props) {
  const [status, setStatus] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<GuestError | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [metrics, setMetrics] = useState<{
    firstAudioMs: number | null;
    interruptClearMs: number | null;
    queueDepth: number;
  }>({ firstAudioMs: null, interruptClearMs: null, queueDepth: 0 });

  const startingRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playQueueRef = useRef<AudioBuffer[]>([]);
  const playingSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playNextAtRef = useRef(0);
  const mutedRef = useRef(false);
  const speechEndedAtRef = useRef<number | null>(null);
  const firstAudioSeenRef = useRef(false);
  const seqRef = useRef(0);
  const cleanedRef = useRef(false);

  const releaseAudio = useCallback(() => {
    try {
      workletNodeRef.current?.port.close();
      workletNodeRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    workletNodeRef.current = null;
    try {
      sourceRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void captureCtxRef.current?.close();
    captureCtxRef.current = null;
    try {
      playingSourceRef.current?.stop();
    } catch {
      /* ignore */
    }
    playingSourceRef.current = null;
    playQueueRef.current = [];
    playNextAtRef.current = 0;
    void playbackCtxRef.current?.close();
    playbackCtxRef.current = null;
    setRecording(false);
    setPlaying(false);
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
  }, []);

  const fail = useCallback(
    async (code: GuestError, detail?: string) => {
      if (cleanedRef.current) return;
      cleanedRef.current = true;
      startingRef.current = false;
      clearHeartbeat();
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
      releaseAudio();
      setErrorCode(code);
      setError(guestErrorCopy(code) + (detail && diagnosticsEnabled ? ` (${detail})` : ""));
      setStatus("failed");
      try {
        await api(`/api/v1/voice/sessions/${voiceSessionId}/lifecycle`, {
          method: "POST",
          json: { status: "failed", terminationReason: code },
        });
      } catch {
        /* ignore */
      }
      try {
        await api(`/api/v1/voice/sessions/${voiceSessionId}/end`, {
          method: "POST",
          json: { reason: code },
        });
      } catch {
        /* ignore */
      }
      onFallbackToText?.(code);
    },
    [clearHeartbeat, diagnosticsEnabled, onFallbackToText, releaseAudio, voiceSessionId],
  );

  const clearPlaybackQueue = useCallback(() => {
    const t0 = performance.now();
    try {
      playingSourceRef.current?.stop();
    } catch {
      /* ignore */
    }
    playingSourceRef.current = null;
    playQueueRef.current = [];
    playNextAtRef.current = 0;
    setPlaying(false);
    setMetrics((m) => ({
      ...m,
      interruptClearMs: Math.round(performance.now() - t0),
      queueDepth: 0,
    }));
  }, []);

  const ensurePlaybackCtx = useCallback(async () => {
    if (!playbackCtxRef.current) {
      playbackCtxRef.current = new AudioContext({ sampleRate: OUTPUT_RATE });
    }
    if (playbackCtxRef.current.state === "suspended") {
      await playbackCtxRef.current.resume();
    }
    return playbackCtxRef.current;
  }, []);

  const drainPlayback = useCallback(async () => {
    const ctx = await ensurePlaybackCtx();
    if (playingSourceRef.current) return;
    const next = playQueueRef.current.shift();
    setMetrics((m) => ({ ...m, queueDepth: playQueueRef.current.length }));
    if (!next) {
      setPlaying(false);
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = next;
    src.connect(ctx.destination);
    const startAt = Math.max(ctx.currentTime, playNextAtRef.current);
    src.start(startAt);
    playNextAtRef.current = startAt + next.duration;
    playingSourceRef.current = src;
    setPlaying(true);
    src.onended = () => {
      playingSourceRef.current = null;
      void drainPlayback();
    };
  }, [ensurePlaybackCtx]);

  const enqueuePcm16 = useCallback(
    async (b64: string) => {
      if (mutedRef.current) return;
      try {
        const ctx = await ensurePlaybackCtx();
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const frameCount = Math.floor(bytes.length / 2);
        if (frameCount <= 0) return;
        const audioBuffer = ctx.createBuffer(1, frameCount, OUTPUT_RATE);
        const channel = audioBuffer.getChannelData(0);
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        for (let i = 0; i < frameCount; i++) {
          channel[i] = view.getInt16(i * 2, true) / 0x8000;
        }
        if (playQueueRef.current.length >= MAX_QUEUE_CHUNKS) {
          playQueueRef.current.shift();
        }
        playQueueRef.current.push(audioBuffer);
        setMetrics((m) => ({ ...m, queueDepth: playQueueRef.current.length }));
        if (!firstAudioSeenRef.current) {
          firstAudioSeenRef.current = true;
          const latency =
            speechEndedAtRef.current != null
              ? Math.round(performance.now() - speechEndedAtRef.current)
              : null;
          setMetrics((m) => ({ ...m, firstAudioMs: latency }));
          if (latency != null) {
            void api(`/api/v1/voice/sessions/${voiceSessionId}/lifecycle`, {
              method: "POST",
              json: { status: "active", firstAudioLatencyMs: latency },
            }).catch(() => undefined);
          }
        }
        await drainPlayback();
      } catch {
        await fail("playback_failed");
      }
    },
    [drainPlayback, ensurePlaybackCtx, fail, voiceSessionId],
  );

  const startMic = useCallback(
    async (ws: WebSocket) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        await fail("unsupported_browser");
        return;
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
      } catch (e) {
        const name = (e as DOMException).name;
        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          await fail("no_microphone");
        } else {
          await fail("microphone_denied");
        }
        return;
      }
      streamRef.current = stream;

      let ctx: AudioContext;
      try {
        ctx = new AudioContext({ sampleRate: INPUT_RATE });
        if (ctx.state === "suspended") await ctx.resume();
        captureCtxRef.current = ctx;
      } catch {
        stream.getTracks().forEach((t) => t.stop());
        await fail("audio_context_failed");
        return;
      }

      const workletSource = `
        class LotaviPcmProcessor extends AudioWorkletProcessor {
          process(inputs) {
            const input = inputs[0] && inputs[0][0];
            if (input && input.length) {
              // Copy — transferable Float32Array
              this.port.postMessage(input.slice(0));
            }
            return true;
          }
        }
        registerProcessor('lotavi-pcm', LotaviPcmProcessor);
      `;
      const blobUrl = URL.createObjectURL(
        new Blob([workletSource], { type: "application/javascript" }),
      );
      try {
        await ctx.audioWorklet.addModule(blobUrl);
      } catch {
        URL.revokeObjectURL(blobUrl);
        // Fallback: ScriptProcessor only if AudioWorklet unavailable
        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (ev) => {
          if (mutedRef.current || ws.readyState !== WebSocket.OPEN) return;
          const input = ev.inputBuffer.getChannelData(0);
          sendPcm(ws, input);
        };
        const silent = ctx.createGain();
        silent.gain.value = 0;
        source.connect(processor);
        processor.connect(silent);
        silent.connect(ctx.destination);
        sourceRef.current = source;
        (processor as ScriptProcessorNode & { __lotavi?: true }).__lotavi = true;
        workletNodeRef.current = processor as unknown as AudioWorkletNode;
        setRecording(true);
        setStatus("capturing");
        return;
      } finally {
        URL.revokeObjectURL(blobUrl);
      }

      const source = ctx.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(ctx, "lotavi-pcm");
      node.port.onmessage = (ev) => {
        if (mutedRef.current || ws.readyState !== WebSocket.OPEN) return;
        sendPcm(ws, ev.data as Float32Array);
      };
      source.connect(node);
      // Do not connect worklet to destination (avoids mic monitor feedback).
      sourceRef.current = source;
      workletNodeRef.current = node;
      setRecording(true);
      setStatus("capturing");
    },
    [fail],
  );

  const runSpike = useCallback(async () => {
    if (startingRef.current || wsRef.current || busy) return;
    startingRef.current = true;
    setBusy(true);
    cleanedRef.current = false;
    setError(null);
    setErrorCode(null);
    setTranscripts([]);
    firstAudioSeenRef.current = false;
    setStatus("minting");

    try {
      const minted = await api<MintResponse>(mintPath, {
        method: "POST",
        json: { voiceSessionId },
      });
      // Never log minted.ephemeralToken
      if (!minted.wsUrl || !minted.ephemeralToken) {
        await fail("mint_denied", "empty mint");
        return;
      }
      if (minted.responseModalities?.includes("AUDIO") !== true) {
        await fail("mint_denied", "modality");
        return;
      }

      setStatus("connecting");
      await api(`/api/v1/voice/sessions/${voiceSessionId}/lifecycle`, {
        method: "POST",
        json: { status: "connecting" },
      }).catch(() => undefined);

      const ws = new WebSocket(minted.wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("setup");
        // Setup must align with server-locked constraints (no tools).
        ws.send(
          JSON.stringify({
            setup: {
              model: minted.model.startsWith("models/")
                ? minted.model
                : `models/${minted.model}`,
              generationConfig: {
                responseModalities: ["AUDIO"],
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
          }),
        );
      };

      ws.onmessage = (ev) => {
        void (async () => {
          let msg: Record<string, unknown>;
          try {
            msg = JSON.parse(String(ev.data)) as Record<string, unknown>;
          } catch {
            await fail("malformed_event");
            return;
          }

          if (msg.setupComplete) {
            setStatus("live");
            await api(`/api/v1/voice/sessions/${voiceSessionId}/lifecycle`, {
              method: "POST",
              json: { status: "active" },
            }).catch(() => undefined);
            await startMic(ws);
            return;
          }

          if (msg.goAway) {
            setStatus("provider_goaway");
            return;
          }

          const serverContent = msg.serverContent as
            | {
                interrupted?: boolean;
                turnComplete?: boolean;
                generationComplete?: boolean;
                inputTranscription?: { text?: string; finished?: boolean };
                outputTranscription?: { text?: string; finished?: boolean };
                modelTurn?: {
                  parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
                };
              }
            | undefined;

          if (serverContent?.interrupted) {
            clearPlaybackQueue();
            void api(`/api/v1/voice/sessions/${voiceSessionId}/lifecycle`, {
              method: "POST",
              json: { status: "active", event: "interruption" },
            }).catch(() => undefined);
          }

          if (serverContent?.inputTranscription?.text) {
            const text = serverContent.inputTranscription.text;
            const finished = Boolean(serverContent.inputTranscription.finished);
            seqRef.current += 1;
            setTranscripts((t) => [
              ...t.slice(-40),
              {
                id: seqRef.current,
                role: "input",
                text,
                partial: !finished,
                at: Date.now(),
              },
            ]);
            if (finished) speechEndedAtRef.current = performance.now();
            void api(`/api/v1/voice/sessions/${voiceSessionId}/lifecycle`, {
              method: "POST",
              json: { status: "active", event: "input_transcript" },
            }).catch(() => undefined);
          }

          if (serverContent?.outputTranscription?.text) {
            const text = serverContent.outputTranscription.text;
            const finished = Boolean(serverContent.outputTranscription.finished);
            seqRef.current += 1;
            setTranscripts((t) => [
              ...t.slice(-40),
              {
                id: seqRef.current,
                role: "output",
                text,
                partial: !finished,
                at: Date.now(),
              },
            ]);
            void api(`/api/v1/voice/sessions/${voiceSessionId}/lifecycle`, {
              method: "POST",
              json: { status: "active", event: "output_transcript" },
            }).catch(() => undefined);
          }

          const parts = serverContent?.modelTurn?.parts ?? [];
          for (const part of parts) {
            if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("audio/")) {
              await enqueuePcm16(part.inlineData.data);
            }
          }
        })();
      };

      ws.onerror = () => {
        void fail("ws_failed");
      };
      ws.onclose = () => {
        if (!cleanedRef.current) {
          void fail("connection_lost");
        }
      };

      heartbeatRef.current = setInterval(() => {
        void api(`/api/v1/voice/sessions/${voiceSessionId}/heartbeat`, {
          method: "POST",
          json: {},
        }).catch(() => undefined);
      }, 25_000);
    } catch (e) {
      const msg = (e as Error).message ?? "";
      await fail(mapApiError(msg), msg.slice(0, 80));
    } finally {
      startingRef.current = false;
      setBusy(false);
    }
  }, [
    busy,
    clearPlaybackQueue,
    enqueuePcm16,
    fail,
    mintPath,
    startMic,
    voiceSessionId,
  ]);

  async function endSpike() {
    if (cleanedRef.current && status === "ended") return;
    cleanedRef.current = true;
    startingRef.current = false;
    clearHeartbeat();
    clearPlaybackQueue();
    try {
      wsRef.current?.close();
    } catch {
      /* ignore */
    }
    wsRef.current = null;
    releaseAudio();
    try {
      await api(`/api/v1/voice/sessions/${voiceSessionId}/end`, {
        method: "POST",
        json: { reason: "guest_stop" },
      });
    } catch {
      /* ignore */
    }
    setStatus("ended");
    onStopped?.();
  }

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    return () => {
      cleanedRef.current = true;
      clearHeartbeat();
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }
      releaseAudio();
    };
  }, [clearHeartbeat, releaseAudio]);

  useEffect(() => {
    const onPageHide = () => {
      releaseAudio();
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [releaseAudio]);

  return (
    <div className="card-free" style={{ marginTop: 12, border: "1px dashed #b45309" }}>
      <p className="muted" style={{ fontWeight: 600 }}>
        Experimental voice (direct Gemini) — not production
      </p>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          disabled={busy || recording || status === "capturing" || status === "live" || status === "setup"}
          onClick={() => void runSpike()}
        >
          Start experimental voice
        </button>
        <button type="button" onClick={() => void endSpike()}>
          Stop
        </button>
        <button type="button" onClick={() => setMuted((m) => !m)}>
          {muted ? "Unmute mic" : "Mute mic"}
        </button>
        <span className="muted">
          {status}
          {recording ? " · recording" : ""}
          {playing ? " · playing" : ""}
          {muted ? " · muted" : ""}
        </span>
      </div>
      {error ? (
        <div style={{ marginTop: 8 }}>
          <p style={{ color: "crimson", margin: 0 }}>{error}</p>
          <p className="muted" style={{ marginTop: 4 }}>
            Use the text chat below — voice will not auto-retry.
          </p>
        </div>
      ) : null}
      {diagnosticsEnabled ? (
        <div style={{ marginTop: 10, fontSize: 12 }}>
          <p className="muted">Diagnostic panel (staging/dev only)</p>
          <p className="muted">
            firstAudioMs={metrics.firstAudioMs ?? "—"} · interruptClearMs=
            {metrics.interruptClearMs ?? "—"} · queue={metrics.queueDepth}
          </p>
          <ul style={{ margin: 0, paddingLeft: 16, maxHeight: 160, overflow: "auto" }}>
            {transcripts.map((t) => (
              <li key={t.id}>
                [{t.role}
                {t.partial ? "~" : ""}] {t.text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {errorCode ? null : null}
    </div>
  );
}

function sendPcm(ws: WebSocket, float32: Float32Array) {
  const pcm = floatTo16BitPCM(float32);
  const b64 = bufferToBase64(pcm);
  // Prefer non-deprecated `audio` field (mediaChunks deprecated in Live API).
  ws.send(
    JSON.stringify({
      realtimeInput: {
        audio: {
          mimeType: `audio/pcm;rate=${INPUT_RATE}`,
          data: b64,
        },
      },
    }),
  );
}

function floatTo16BitPCM(float32: Float32Array): ArrayBuffer {
  const buf = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buf);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]!));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
