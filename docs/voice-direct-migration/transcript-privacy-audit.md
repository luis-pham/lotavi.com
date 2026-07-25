# A9 — Transcript, audio, privacy audit

## Currently collected (voice)

| Item | Collected? | Where | Stored | Retention / ACL / consent |
|------|------------|-------|--------|---------------------------|
| Input audio | No (bytes discarded in `sendAudio`) | — | — | — |
| Output audio | No | — | — | — |
| Input transcript | No | — | — | — |
| Output transcript | No | — | — | — |
| Partial/final transcript | Event types only | contracts | — | — |
| Tool events | No | — | — | — |
| Provider usage | No | — | — | — |
| Latency | No voice-specific | — | — | — |
| Model errors | Minimal protocol error on WS | ephemeral WS JSON | — | — |

Text chat messages **are** persisted (`conversations` / `messages` with optional grounding) — **not** via voice adapter.

## Direct-mode implications (forward-looking)

| Question | Answer |
|----------|--------|
| Does product require raw audio replay today? | **No evidence** in code/product flags. |
| Is transcript sufficient for analytics/QA? | Product intent suggests yes; **not implemented for voice**. |
| New consent/upload for direct mode? | If client uploads audio/transcript → **yes, new pipeline + consent review** (not documented legally here). |
| Code assume VPS always sees raw audio? | WS protocol assumes server *may* receive `audioBase64`; adapter does not persist it. **No hard product dependency** on VPS hearing audio yet. |

## Trust

Client-reported transcripts/usage in direct mode are **less trustworthy** for billing/compliance than server-observed relay or provider-reconciled usage — must be treated as telemetry, not sole source of truth.
