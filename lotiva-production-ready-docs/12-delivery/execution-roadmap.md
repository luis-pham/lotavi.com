---
title: "Execution Roadmap"
document_id: "DEL-004"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: ["DEL-001", "DEL-002", "DEL-003"]
source_of_truth_for: ["execution status and delivery order"]
implemented_by: []
reviewed_by: []
---

# Execution Roadmap — Lotiva Phase 0

Nguồn sự thật phase: `implementation-phases.md`. Domain: `lotiva.vn` / `app.lotiva.vn` / `api.lotiva.vn` (+ staging).

Giả định: 1–2 eng, modular monolith, Docker Compose trên VPS, không microservices/K8s.

## Mục tiêu ship

Guest mở QR → portal white-label → chat/voice AI (Gemini Live) trên knowledge đã duyệt → tạo ticket có xác nhận → staff xử lý realtime → admin quản trị content/brand/prompt/AI.

## Hosting (đã chốt)

| Env | Web | API |
|-----|-----|-----|
| production | `lotiva.vn`, `app.lotiva.vn` | `api.lotiva.vn` |
| staging | `staging.lotiva.vn` | `api.staging.lotiva.vn` |
| local | `localhost:3000` | `localhost:4000` |

QR production: `https://lotiva.vn/g/{opaqueToken}`.

## Status board

| Phase | Status | DoD |
|-------|--------|-----|
| F0 Foundation | done | compose + Postgres repos wired (`LOTIVA_STORE=postgres`); RLS suite when DB up |
| F1 Guest shell + branding | done | QR → themed portal; Brand Studio publish/rollback |
| F2 Inform | done | text chat từ KB; schedules + announcements |
| F3 Voice | done | Gemini Live adapter + fallback; contract tests |
| F4 Service | done | ticket confirm flow + staff inbox |
| F5 Admin + ops | done | admin surfaces + compose/prometheus + host docs |

Reports: `f0-completion-report.md`, `f1-f5-completion-report.md`.

## F0 slices

| Slice | Deliverable | Status |
|-------|-------------|--------|
| F0.1 | governance/docs sync | done |
| F0.2 | monorepo + CI | done |
| F0.3 | design tokens + Storybook scaffold | done |
| F0.4 | database + migrations | done |
| F0.5 | auth + tenant context | done |
| F0.6 | RLS + isolation tests | done |
| F0.7 | Redis + BullMQ worker | done |
| F0.8 | observability basics | done |

## F1–F5 (tóm tắt)

- **F1:** QR context, guest session, portal shell, runtime theme, Brand Studio preview/publish/rollback.
- **F2:** knowledge, embedding, hybrid retrieval, text chat, schedules, announcements.
- **F3:** canonical WS, Voice Gateway, Gemini adapter, tools, transcripts, reconnect/fallback.
- **F4:** tickets, quick request, prepare/confirm, staff inbox, translation, complete/reopen.
- **F5:** content, AI settings, prompt versioning, analytics, team/roles, audit, harden prod.

## Repo layout

```text
apps/web
apps/api
apps/worker
apps/embedding-service
packages/domain
packages/application
packages/infrastructure
packages/contracts
packages/design-tokens
packages/design-system
packages/ui
infra/compose
lotiva-production-ready-docs/
```

## Quy tắc

Theo `00-governance/ai-implementation-rules.md`. Mỗi slice: tests + completion report theo `vertical-slice-template.md`. Không mở F1+ trước khi F0 DoD đạt trong lần triển khai đầu; sau khi scaffold xong có thể ship slice liên tiếp trong cùng monorepo.

## Ước lượng (solo)

F0 1.5–2w · F1 1.5–2w · F2 2–2.5w · F3 2.5–3.5w · F4 2–2.5w · F5 1.5–2w · **Tổng ~11–14 tuần**.

Demo nội bộ: sau F1. Pilot khách: sau F3+F4 trên staging.
