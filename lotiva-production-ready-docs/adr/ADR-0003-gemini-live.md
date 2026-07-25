---
title: "Gemini Live Native Audio"
document_id: "ADR-0003-gemini-live"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["Gemini Live Native Audio"]
implemented_by: []
reviewed_by: []
---


# Status
Approved

# Context
Phase 0 cần production-ready nhưng tránh over-engineering.

# Decision
Gemini Live là provider voice mặc định Phase 0.

# Consequences
- Positive: đơn giản, dễ vận hành, dễ test.
- Negative: có giới hạn scale hoặc abstraction cost cần theo dõi.
- Revisit when: có tenant lớn, tải cao, provider requirements thay đổi hoặc pilot chứng minh nhu cầu.
