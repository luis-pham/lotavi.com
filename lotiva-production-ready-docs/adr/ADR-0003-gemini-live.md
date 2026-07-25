---
title: "Gemini Live Native Audio"
document_id: "ADR-0003-gemini-live"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-26"
depends_on: []
source_of_truth_for: ["Gemini Live Native Audio — provider choice; media plane superseded"]
implemented_by: []
reviewed_by: []
---

> **Historical architecture note.**  
> Provider choice (Gemini Live) remains directionally valid.  
> The **media transport** decision is superseded by [ADR-direct-gemini-live-browser](../../docs/architecture/adr/ADR-direct-gemini-live-browser.md) (direct browser media + Lotavi control plane).  
> **Current source of truth:** [docs/voice/README.md](../../docs/voice/README.md).

# Status
Approved as **provider selection** only — **not** production voice approval.  
Media-plane follow-on: **Accepted for staged capability verification** (see superseding ADR).

# Context
Phase 0 needed a default voice provider without over-engineering. Early docs assumed a server relay that was never verified as a working media path.

# Decision
Gemini Live is the default voice **provider** for Lotavi.

**Addendum (2026-07-26):** Realtime media is intended to travel **browser ↔ Gemini Live** via ephemeral credentials. Lotavi retains authentication, minting, quota, persistence, audit, and future tools. Voice remains disabled until verification gates pass.

# Consequences
- Positive: single provider focus; aligns with Gemini Live native audio.
- Negative: direct-browser security surface; verification still blocked; no working media relay exists to fall back to today.
- Revisit when: provider/device gates pass, or direct path is proven non-viable.
