/**
 * Bounded staging voice diagnostics. Labels are low-cardinality only.
 * Never include guest tokens, transcripts, room numbers, or session IDs.
 */

type VoiceMetricKey =
  | "voice_session_created_total"
  | "voice_token_mint_total"
  | "voice_token_mint_failed_total"
  | "voice_connection_attempt_total"
  | "voice_connection_active_total"
  | "voice_connection_failed_total"
  | "voice_session_ended_total"
  | "voice_session_abandoned_total"
  | "voice_input_transcript_received_total"
  | "voice_output_transcript_received_total"
  | "voice_interruption_total"
  | "voice_text_fallback_total"
  | "voice_heartbeat_total";

const counters = new Map<string, number>();
const latencySamples: number[] = [];
const LATENCY_CAP = 64;

function key(name: VoiceMetricKey, labels: Record<string, string> = {}): string {
  const parts = Object.keys(labels)
    .sort()
    .map((k) => `${k}=${labels[k]}`)
    .join(",");
  return parts ? `${name}{${parts}}` : name;
}

export function bumpVoiceMetric(
  name: VoiceMetricKey,
  labels: Record<string, string> = {},
  by = 1,
) {
  const k = key(name, labels);
  counters.set(k, (counters.get(k) ?? 0) + by);
}

export function observeFirstAudioLatencyMs(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return;
  latencySamples.push(Math.min(ms, 120_000));
  if (latencySamples.length > LATENCY_CAP) latencySamples.shift();
}

export function renderVoiceMetrics(): string[] {
  const lines: string[] = [
    "# HELP lotiva_voice_metric Voice diagnostic counters (staging)",
    "# TYPE lotiva_voice_metric counter",
  ];
  for (const [k, v] of counters) {
    lines.push(`lotiva_${k} ${v}`);
  }
  if (latencySamples.length) {
    const sum = latencySamples.reduce((a, b) => a + b, 0);
    const avg = sum / latencySamples.length;
    lines.push("# HELP lotiva_voice_first_audio_latency_ms_avg Average first-audio latency samples");
    lines.push("# TYPE lotiva_voice_first_audio_latency_ms_avg gauge");
    lines.push(`lotiva_voice_first_audio_latency_ms_avg ${avg.toFixed(1)}`);
    lines.push(`lotiva_voice_first_audio_latency_samples ${latencySamples.length}`);
  }
  return lines;
}
