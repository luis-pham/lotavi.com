---
title: "Guest Voice"
document_id: "UX-GUEST-GUE"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-26"
depends_on: []
source_of_truth_for: ["UX Guest voice — target UX"]
implemented_by: []
reviewed_by: []
---

> **Historical architecture note.**  
> This UX spec describes the **planned** guest voice experience.  
> It is **not** production-ready and **not** provider/device verified.  
> **Current source of truth:** [docs/voice/current-status.md](../../../docs/voice/current-status.md), [docs/voice/README.md](../../../docs/voice/README.md).

# Screen: Guest Voice (planned UX)

**Current reality:** Voice is disabled by default. A development/staging **experimental** direct-Gemini spike may appear when flags allow; it is not a production surface. No voice RAG, write tools, or ticket confirmation from voice exist yet.

## Elements (target)
Assistant identity, waveform, state label, live transcript, microphone, mute, interrupt, text fallback, end session.
## Voice labels
Đang kết nối; Sẵn sàng; Đang nghe; Đang hiểu; Đang tìm thông tin; Đang trả lời; Đang chờ xác nhận; Kết nối yếu; Đang kết nối lại.
## Rules
Không hiển thị provider/tool/RAG internals. Barge-in must clear old playback (provider-verified — **not yet verified**). Confirmation card for consequential actions appears outside transcript — **not implemented for voice**.
