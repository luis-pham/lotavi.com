---
title: "Implementation Phases"
document_id: "DEL-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-26"
depends_on: []
source_of_truth_for: ["delivery plan"]
implemented_by: []
reviewed_by: []
---

> **Historical architecture note (voice).**  
> Phase wording that assumes a Lotavi media Voice Gateway is superseded by direct browser ↔ Gemini Live + Lotavi control plane.  
> **Current source of truth:** [docs/voice/README.md](../../docs/voice/README.md).

# Implementation phases

## F0 Foundation
F0.1 governance/docs
F0.2 monorepo
F0.3 design tokens + Storybook
F0.4 database
F0.5 auth + tenant context
F0.6 RLS
F0.7 queue/worker
F0.8 observability

## F1 Guest shell and branding
F1.1 QR context
F1.2 guest session
F1.3 portal shell
F1.4 runtime theme
F1.5 Brand Studio preview
F1.6 publish/rollback

## F2 Inform
F2.1 knowledge management
F2.2 embedding
F2.3 hybrid retrieval
F2.4 text chat
F2.5 schedules
F2.6 announcements

## F3 Voice
F3.1 canonical contracts
F3.2 Voice Gateway
F3.3 state synchronization
F3.4 Gemini adapter
F3.5 tool dispatcher
F3.6 transcripts
F3.7 reconnect/fallback

## F4 Service
F4.1 ticket domain
F4.2 quick request
F4.3 prepare/confirm action
F4.4 staff inbox
F4.5 ticket conversation
F4.6 translation
F4.7 completion/reopen

## F5 Admin and operations
F5.1 content
F5.2 AI settings
F5.3 prompt editor/versioning
F5.4 analytics
F5.5 team/roles
F5.6 audit
