# Lotavi voice — canonical documentation

**Public brand:** Lotavi  
**Status entry point:** [current-status.md](./current-status.md)  
**Architecture ADR:** [ADR-direct-gemini-live-browser](../architecture/adr/ADR-direct-gemini-live-browser.md)

This folder is the **source of truth** for voice architecture and status. Prefer these documents over older production-readiness or `lotiva-production-ready-docs` voice pages unless those pages carry an explicit historical banner linking here.

## Safe defaults (current)

```text
VOICE_ENABLED=false
VOICE_TRANSPORT=off
DIRECT_GEMINI_ENABLED=false
DIRECT_GEMINI_STAGING_ACKNOWLEDGED=false
```

Voice remains **disabled**. No production voice rollout is allowed.

## Product context

| Surface | Status |
|---------|--------|
| Text experience | PILOT READY |
| Voice | Disabled; capability spike only |
| Voice RAG / write tools / ticket-from-voice | Not implemented |

## Canonical reading order

1. [current-status.md](./current-status.md) — verified vs planned vs blocked  
2. [architecture.md](./architecture.md) — diagrams and boundaries  
3. [ADR-direct-gemini-live-browser](../architecture/adr/ADR-direct-gemini-live-browser.md) — decision record  
4. [security-boundary.md](./security-boundary.md) — threats and invariants  
5. [production-gates.md](./production-gates.md) — what must pass before enablement  

## Implementation history (evidence packages)

| Package | Role |
|---------|------|
| [../voice-direct-migration/v0-v1-implementation.md](../voice-direct-migration/v0-v1-implementation.md) | V0 safety + V1 spike notes |
| [../voice-direct-migration/v1-5-final-verification-report.md](../voice-direct-migration/v1-5-final-verification-report.md) | V1.5 classification (**BLOCKED** for provider/device) |
| [../voice-direct-migration/v1-5-provider-smoke.md](../voice-direct-migration/v1-5-provider-smoke.md) | Real provider smoke guide |
| [../voice-direct-migration/v1-5-device-matrix.md](../voice-direct-migration/v1-5-device-matrix.md) | Device matrix |
| [../voice-direct-migration/v1-5-green-ruby-network.md](../voice-direct-migration/v1-5-green-ruby-network.md) | Green Ruby network guide |
| [../voice-direct-migration/security-threat-model.md](../voice-direct-migration/security-threat-model.md) | Voice migration threat model |
| [../voice-direct-migration/test-matrix.md](../voice-direct-migration/test-matrix.md) | Test matrix |
| [documentation-reconciliation-report.md](./documentation-reconciliation-report.md) | Doc audit after V0/V1/V1.5 |

## Future plan (not started)

V2 is **gated** on at least CONDITIONAL PASS for real provider audio + required security controls:

1. Transcript/event ingestion  
2. Read-only `search_property_knowledge`  
3. Grounded no-answer policy  
4. Heartbeat/quota hardening  
5. Prepare service request  
6. Explicit guest confirmation  
7. Exactly-once ticket creation  

Do not treat V2 items as implemented.

## Distinctions used everywhere

| Label | Meaning |
|-------|---------|
| **Current implemented** | Code exists in the repository |
| **Current verified** | Proven with real provider/device/network evidence |
| **Planned target** | Intended architecture; not claimed done |
| **Blocked** | External dependency prevents verification |
| **Not implemented** | Explicitly absent |
