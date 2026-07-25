# ADR — Direct Gemini Live browser media with Lotavi control plane

| Field | Value |
|-------|-------|
| Status | **Accepted for staged capability verification** |
| Date | 2026-07-26 |
| Brand | Lotavi |
| Supersedes (media plane) | Historical server WebSocket media-relay diagrams in older docs |
| Does not approve | Production voice enablement |

> This ADR is **not** “Production approved”.  
> Production voice remains disabled until gates in [docs/voice/production-gates.md](../../voice/production-gates.md) pass.

## Context

Lotavi needs guest voice for hospitality properties (including constrained networks such as Green Ruby). Early documentation described a Lotavi-hosted Gemini Live **media relay**. Repository audits (voice-direct-migration + V0/V1/V1.5) showed:

- There is **no working server media relay** to Gemini today.  
- `GeminiLiveAdapter` does not open a verified Gemini Live media session.  
- A safer target is browser↔Gemini **direct media** with Lotavi as **control plane**.  
- Real provider and device verification are still **blocked**.

## Decision

1. **Realtime voice media** travels directly between the guest browser and Gemini Live using a short-lived ephemeral credential minted by Lotavi.  
2. **Lotavi remains the control plane** for guest authentication, QR/session validation, tenant/property resolution, ephemeral minting, allowlist, quota/concurrency, session persistence, heartbeat, audit, telemetry, and (future) RAG tools and confirmed business actions.  
3. **Text chat** continues through the Lotavi backend (RAG / Gemini server-mediated).  
4. **PostgreSQL** remains the source of truth for business actions.  
5. The browser is untrusted for tenant/property scope and for billing-quality usage.

## Current implementation state

- Voice safety foundation: implemented.  
- Voice sessions persisted + ownership-checked: implemented.  
- Direct mint + browser spike code: implemented (dev/staging flags).  
- Real Gemini smoke / device matrix / Green Ruby: **blocked / not started**.  
- Voice RAG / write tools / tickets-from-voice: **not implemented**.  
- Defaults: `VOICE_ENABLED=false`, `VOICE_TRANSPORT=off`, `DIRECT_GEMINI_ENABLED=false`.

## Target architecture

See [docs/voice/architecture.md](../../voice/architecture.md).

- Media: Browser ↔ Gemini Live  
- Control: Browser ↔ Lotavi API  
- Text: Browser ↔ Lotavi API ↔ RAG/Gemini  
- Actions: Gemini proposes → Lotavi validates → guest confirms → Postgres

## Why direct media is preferred

- Avoids Lotavi VPS becoming a realtime audio relay (CPU/bandwidth/latency).  
- Matches Gemini ephemeral-token guidance for client-to-server Live.  
- Keeps long-lived keys off the browser while still enabling low-latency audio.

## Why text remains server-mediated

- Grounded RAG, prompt governance, tenant isolation, and ticket confirmation already exist on the server path.  
- Text is the operational fallback when voice is disabled or fails.

## Security boundary

See [docs/voice/security-boundary.md](../../voice/security-boundary.md).

- Long-lived keys server-side only.  
- Ephemeral credentials not persisted.  
- No client-authoritative tenant/property.  
- Production direct mode forbidden until gates pass.

## Ephemeral credential handling

- Minted only for active, non-revoked guests on allowlisted properties.  
- Server derives model, modalities, tools policy, expiry.  
- Response is `no-store`; token never logged.  
- Runtime token reuse/expiry behavior still requires provider smoke evidence.

## Tool execution boundary

- **Not implemented for voice today.**  
- Planned: Gemini function-call proposals only; Lotavi executes after authz.

## RAG boundary

- **Not implemented for voice today.**  
- Planned: read-only property knowledge search with grounded no-answer policy.  
- Text RAG remains the current grounded path.

## Confirmation boundary

- Consequential actions require server validation and explicit guest confirmation.  
- Gemini cannot persist tickets directly.  
- Voice ticket creation is **not implemented**.

## Transcript and audio policy

- Diagnostic in-memory transcripts may appear in staging/dev panels only.  
- No production transcript retention commitment yet.  
- Raw audio recording remains disabled by default.  
- Transcripts are not billing evidence.

## Quota limitations

- Concurrent sessions per property and mint rate limits exist.  
- Provider usage reconciliation / BYOK are **not implemented**.  
- Client metrics are not billing-authoritative.

## Fallback strategy

```text
direct voice failure → close session → release mic/audio → mark session failed/ended → offer text chat
```

No automatic switch to a server media relay. No infinite retry loops.

## Alternatives considered

### Server media relay

- Pros: server observes all audio; simpler historical docs.  
- Cons: costly on VPS; not implemented today; higher ops burden.  
- Retention: optional future rollback path only if direct fails permanently — **not** current product claim.

### Browser API key

- Rejected. Long-lived keys must never ship to the browser.

### Full client-side business logic

- Rejected. Tenant scope, RAG writes, and tickets must stay server-side with confirmation.

## Consequences

### Positive

- Clear control-plane vs media-plane split.  
- Aligns docs with actual code.  
- Enables staging verification without pretending a relay exists.

### Negative

- Browser security surface (token theft, CSP, device quirks).  
- Client telemetry is weaker for billing until provider reconciliation exists.  
- Historical docs must be banner-marked to avoid confusion.

## Rollback

```text
VOICE_ENABLED=false
VOICE_TRANSPORT=off
DIRECT_GEMINI_ENABLED=false
DIRECT_GEMINI_STAGING_ACKNOWLEDGED=false
```

## Verification gates

See [docs/voice/production-gates.md](../../voice/production-gates.md) and [docs/voice/current-status.md](../../voice/current-status.md).

## Production enablement gates

Production voice is **not approved** by this ADR. Enablement requires provider + device gates, security review, and explicit ops sign-off. Until then voice remains disabled.
