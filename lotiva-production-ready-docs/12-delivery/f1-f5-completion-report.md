---
title: "F1–F5 Vertical Slice Completion Report"
document_id: "DEL-F1F5-001"
version: "1.0.0"
status: "approved"
owners: ["Engineering"]
last_updated: "2026-07-25"
---

## Summary
Implemented end-to-end vertical slices for F1–F5 on the monorepo foundation using memory store + API/Web UI, with Postgres schema/RLS ready for staging.

## F1 Guest shell + branding
- QR `/g/{token}` → guest session cookie
- Runtime theme from published Brand Studio version
- Admin Brand Studio draft / publish / rollback APIs + UI

## F2 Inform
- Knowledge publish + hybrid-ish text search
- Guest text chat grounded on approved chunks
- Schedules + announcements APIs + Guest tabs

## F3 Voice
- Canonical voice events (`@lotiva/contracts`)
- Voice Gateway REST + WebSocket
- Gemini Live adapter boundary (fallback text without API key)
- Contract test: no provider SDK leak

## F4 Service
- Prepare → confirm ticket (no create without confirm)
- Idempotency-Key support
- Staff inbox + status transitions + translation stub

## F5 Admin + ops
- Admin home, knowledge, AI settings, prompts, team, audit, analytics
- Compose + Caddy + Prometheus scrape
- Production hostnames documented for lotiva.vn

## Known limitations
- EmbeddingGemma is stub vectors until model weights mounted
- Translation is demo marker, not production MT
- Full Playwright/K6/load suites deferred to hardening pass
- Postgres repos wired via migrate/seed; API default `LOTIVA_STORE=memory`

## Completion status
Phase 0 vertical slices runnable locally; staging harden against `production-readiness-checklist.md`.
