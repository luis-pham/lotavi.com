# Proposed test matrix (future — not implemented)

## Security
- [ ] No API key in web bundle
- [ ] Valid guest required for mint
- [ ] Revoked QR denied
- [ ] Tenant key isolation (when BYOK)
- [ ] Modified tenant/property ignored
- [ ] Tool allowlist only
- [ ] Token not logged
- [ ] Replay protection / idempotency
- [ ] WS requires ownership (gap today)

## Voice
- [ ] Microphone denied UX
- [ ] Direct connect (if enabled)
- [ ] Audio input/output
- [ ] Interruption
- [ ] Reconnect / GoAway / timeout
- [ ] Browser refresh
- [ ] Background tab
- [ ] Unstable network
- [ ] Text fallback

## RAG
- [ ] Approved-only
- [ ] Wrong-property trap
- [ ] No-answer
- [ ] Critical exact values
- [ ] Knowledge prompt injection

## Tools
- [ ] Read-only tool
- [ ] Prepare action
- [ ] Explicit confirmation
- [ ] Exactly one ticket
- [ ] Reconnect replay
- [ ] Unauthorized write denied

## Telemetry
- [ ] Transcript ordering
- [ ] Event dedupe
- [ ] Heartbeat expiry
- [ ] Provider error mapping
- [ ] Missing end event handling
- [ ] Untrusted client usage ignored for billing

## Compatibility (Green Ruby)
- [ ] Chrome Android
- [ ] Safari iPhone
- [ ] Desktop Chrome
- [ ] Property Wi-Fi
- [ ] Starlink / poor network under load

## Existing automated coverage (today)
- `apps/api/src/voice-contract.test.ts` — canonical `session.ready`, VOICE_DISABLED
- `packages/contracts/src/voice-events.test.ts` — schema
