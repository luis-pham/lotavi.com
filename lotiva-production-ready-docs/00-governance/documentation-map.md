---
title: "Documentation Map"
document_id: "GOV-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["quy tắc tìm và ưu tiên tài liệu"]
implemented_by: []
reviewed_by: []
---


# Documentation map

## Thứ tự ưu tiên khi có mâu thuẫn

1. ADR `approved`.
2. Security và tenant isolation.
3. Domain specification.
4. API, WebSocket và database contracts.
5. UX specification.
6. Implementation phase.
7. Code hiện tại.

Code không được xem là nguồn sự thật nếu trái với tài liệu approved.

## Bản đồ đọc theo loại công việc

### Thay đổi UI
Đọc:
- `02-experience/`
- `03-design-system/`
- API contract liên quan
- accessibility
- test matrix

### Thay đổi database
Đọc:
- `05-domain/`
- `06-data/`
- multi-tenancy
- RLS
- migration rules
- backup/restore

### Thay đổi voice
Đọc:
- `04-architecture/voice-provider-architecture.md`
- `05-domain/voice-session.md`
- `07-contracts/voice-events.md`
- `08-ai/gemini-live-adapter.md`
- `10-testing/contract-tests.md`

### Thay đổi AI/RAG
Đọc:
- `08-ai/`
- `06-data/pgvector-strategy.md`
- caching architecture
- hallucination/handoff
- prompt governance

### Thay đổi ticket
Đọc:
- `05-domain/tickets.md`
- staff UX
- guest request UX
- API contract
- security tests

## Trạng thái tài liệu

- `draft`: chưa được dùng làm nguồn sự thật.
- `approved`: được phép triển khai.
- `implemented`: đã được code và kiểm chứng.
- `superseded`: bị thay thế, chỉ dùng tham khảo lịch sử.
