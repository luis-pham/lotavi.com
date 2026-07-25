# Voice documentation reconciliation report

**Date:** 2026-07-26  
**Scope:** Documentation only — no production code, schema, config, or test behavior changes.  
**Public brand:** Lotavi  

## Contradiction inventory (pre-edit)

| Claim found in docs | Reality | Disposition |
|---------------------|---------|-------------|
| Server Voice Gateway relays realtime audio to Gemini | No working media relay | Corrected / historical banner |
| `GeminiLiveAdapter` opens Live WS / maps audio/tools | Placeholder adapter | Corrected |
| Browser mic / barge-in / transcripts production-ready | Spike code only; unverified | Corrected |
| Provider smoke / device PASS | BLOCKED / NOT STARTED | Preserved as blocked |
| Voice RAG / write tools / tickets-from-voice exist | Not implemented | Stated explicitly |
| BYOK / billing-quality voice usage | Not implemented | Stated explicitly |
| Green Ruby network tested | BLOCKED | Stated explicitly |
| Voice WS unauthenticated (old audit) | Ownership added in V0 | Threat model updated |
| Product pack presents voice as Phase 0 guest capability | Text pilot; voice off | Pack README + UX bannered |
| `lotiva.vn` as public brand in older docs | Lotavi / lotavi.com | Updated in touched entry points |

## Documents audited (primary set)

- `docs/voice-direct-migration/*`
- `docs/production-readiness/*` (voice-related)
- `lotiva-production-ready-docs/04-architecture/voice-provider-architecture.md`
- `lotiva-production-ready-docs/08-ai/gemini-live-adapter.md`
- `lotiva-production-ready-docs/adr/ADR-0003-gemini-live.md`
- `lotiva-production-ready-docs/02-experience/guest-portal/guest-voice.md`
- `lotiva-production-ready-docs/05-domain/voice-session.md`
- `lotiva-production-ready-docs/07-contracts/websocket-protocol.md`
- `lotiva-production-ready-docs/07-contracts/voice-events.md`
- `lotiva-production-ready-docs/04-architecture/system-context.md`
- `lotiva-production-ready-docs/09-security/threat-model.md`
- `lotiva-production-ready-docs/11-operations/monitoring-runbook.md`
- `lotiva-production-ready-docs/README.md`
- `lotiva-production-ready-docs/00-governance/documentation-map.md`
- `README.md`

## New canonical documents

| File | Role |
|------|------|
| `docs/voice/README.md` | Entry point |
| `docs/voice/current-status.md` | Status table + distinctions |
| `docs/voice/architecture.md` | Canonical architecture + Mermaid |
| `docs/voice/security-boundary.md` | Threats + invariants |
| `docs/voice/production-gates.md` | Enablement / rollback |
| `docs/architecture/adr/ADR-direct-gemini-live-browser.md` | ADR (staged verification) |
| `docs/voice/documentation-reconciliation-report.md` | This report |

## Documents updated (selected)

- Production readiness: voice-reliability, architecture, security-threat-model, configuration-matrix, pilot-runbook, executive-status, f8-gemini-live-evidence  
- Voice-direct-migration: security-threat-model, target-architecture, final-audit-report, current-voice-flow, gemini-integration-audit, server-relay-responsibilities, frontend-audio-audit, observability-audit  
- Product pack historical files bannered as listed above  
- Root `README.md` points to `docs/voice/`

## Remaining documents describing server relay

| Document | Category |
|----------|----------|
| `lotiva-production-ready-docs/04-architecture/voice-provider-architecture.md` | historical with warning |
| `lotiva-production-ready-docs/07-contracts/websocket-protocol.md` | historical with warning |
| `lotiva-production-ready-docs/08-ai/gemini-live-adapter.md` | historical with warning |
| `docs/voice-direct-migration/server-relay-responsibilities.md` | intentionally retained (states relay is **not** real) |
| `docs/voice-direct-migration/incremental-migration-plan.md` | historical audit plan — may mention optional relay; treat as non-canonical |
| `docs/voice/architecture.md` | intentionally retained (mentions optional future relay as alternative, clearly labeled) |
| ADR alternatives section | intentionally retained |
| `lotiva-production-ready-docs/12-delivery/execution-roadmap.md` | historical with warning |
| `lotiva-production-ready-docs/12-delivery/implementation-phases.md` | historical with warning |
| `lotiva-production-ready-docs/12-delivery/f1-f5-completion-report.md` | historical with warning + F3 wording corrected |
| `lotiva-production-ready-docs/11-operations/environments.md` | historical with warning (API ≠ media relay) |

## Unresolved / low priority

- Prompt packs under `lotiva-production-ready-docs/prompts/voice/*` still describe target voice UX/policies — **planned**, not claimed implemented. No full rewrite this pass; they are experience prompts, not architecture SoT.

## Link checks (relative)

Verified by construction that canonical README links to:

- ADR, current-status, architecture, security, production-gates  
- V0/V1 notes, V1.5 final/smoke/device/green-ruby, security/test matrix  

If a path moves, update `docs/voice/README.md` first.

## Search commands executed

```bash
rg -l 'Gemini Live|voice relay|media relay|…' --glob '*.md'
rg 'relays? (real )?audio|media relay|production-ready|BYOK|billing' --glob '*.md'
```

## Confirmation

- No production source code modified in this reconciliation task.  
- No schema changes.  
- No configuration changes.  
- Voice remains documented as disabled.  
- No document claims provider/device PASS for real Gemini smoke or required devices.
