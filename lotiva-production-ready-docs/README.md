# Lotiva Production-Ready Documentation Pack

Bộ tài liệu Phase 0 (internal package name `lotiva`). Public brand: **Lotavi**.

> **Voice architecture note.**  
> Many files in this pack predate the direct Gemini browser decision and may describe a server media relay.  
> **Voice source of truth:** [`docs/voice/README.md`](../docs/voice/README.md) and [`docs/architecture/adr/ADR-direct-gemini-live-browser.md`](../docs/architecture/adr/ADR-direct-gemini-live-browser.md).  
> Voice is **disabled**; provider/device verification is **not** complete. Do not treat this pack as authorizing production voice.

## Mục tiêu sản phẩm

Lotavi là web app đa ngôn ngữ mở bằng QR trong phòng/cabin. **Hiện tại (pilot):** text + knowledge + tickets. **Voice** là hướng tới (direct browser ↔ Gemini Live, Lotavi control plane) — chưa bật production:
- nói chuyện realtime với trợ lý AI bằng Gemini Live Native Audio (**planned / staging spike only**);
- chat bằng text;
- tìm thông tin từ knowledge base đã phê duyệt;
- xem lịch trình, thông báo;
- gửi yêu cầu dịch vụ;
- theo dõi ticket;
- xác nhận vấn đề đã được giải quyết.

Nhân viên có thể:
- nhận ticket realtime;
- xem bản gốc và bản dịch;
- nhận việc, chuyển bộ phận, trả lời khách;
- cập nhật trạng thái;
- hoàn thành hoặc xử lý ticket mở lại.

Admin có thể:
- quản lý nội dung, knowledge, lịch trình, thông báo;
- cấu hình AI, prompt, voice;
- quản lý thương hiệu Guest Portal;
- chỉnh logo, cover, màu sắc, kiểu chữ, assistant avatar;
- preview theo thiết bị/ngôn ngữ/ngữ cảnh;
- publish, rollback và audit mọi thay đổi.

## Cách AI coding agent phải sử dụng bộ tài liệu

1. Đọc `00-governance/documentation-map.md`.
2. Đọc `00-governance/ai-implementation-rules.md`.
3. Đọc ADR liên quan.
4. Đọc tài liệu domain, API, UX, security và testing của phase.
5. Chỉ code theo `12-delivery/implementation-phases.md`.
6. Sau mỗi phase, tạo completion report theo template trong governance.
7. Không tự thay đổi quyết định approved mà không tạo ADR mới.

## Quyết định nền tảng đã chốt

- Thương hiệu và domain production: **Lotiva** / `lotiva.vn`.
- Modular monolith.
- Next.js + React + TypeScript.
- Fastify backend.
- PostgreSQL + pgvector + FTS + pg_trgm.
- Redis + BullMQ.
- Shared-schema multi-tenant + tenant_id + PostgreSQL RLS.
- Gemini Live Native Audio qua provider abstraction.
- EmbeddingGemma self-host riêng.
- Prompt tách khỏi code, versioned trong database.
- Design system riêng, schema-driven white-label.
- Docker Compose trên VPS riêng.
- Cloudflare R2 cho object storage.
- Không microservices, Kubernetes, Kafka, Elasticsearch hoặc vector DB riêng ở Phase 0.

## Thứ tự triển khai

Xem `12-delivery/implementation-phases.md`.

## Nguồn tham chiếu

Bản PDF Phase 0 gốc được lưu trong thư mục `sources/`.
