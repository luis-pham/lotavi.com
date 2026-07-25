---
title: "AI Implementation Rules"
document_id: "GOV-002"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["quy tắc AI coding agent"]
implemented_by: []
reviewed_by: []
---


# AI implementation rules

## Trước khi code

AI bắt buộc:
1. Xác định phase và vertical slice.
2. Đọc tất cả tài liệu `depends_on`.
3. Liệt kê acceptance criteria.
4. Xác định migrations, API contracts và security impact.
5. Viết hoặc cập nhật test trước hoặc cùng lúc với code.
6. Không mở rộng scope ngoài phase.

## Không được làm

- Không hard-code tenant, property, model ID, provider, prompt hoặc màu thương hiệu.
- Không query bảng tenant-owned ngoài transaction có tenant context.
- Không dùng `any` trừ boundary bất khả kháng và phải có comment.
- Không deep-import module nội bộ.
- Không sửa migration đã chạy production.
- Không bỏ test chỉ để CI xanh.
- Không swallow error.
- Không log secrets, API key, QR token, audio raw, transcript nhạy cảm hoặc PII.
- Không cho model ghi database trực tiếp.
- Không tạo ticket trước khi khách xác nhận.
- Không đưa arbitrary HTML/CSS/JS vào Brand Studio.
- Không thêm dependency lớn nếu chưa có ADR.

## Chuẩn báo cáo sau mỗi task

```md
## Summary
## Files changed
## Contracts changed
## Migrations
## Security impact
## Tests added
## Tests run
## Known limitations
## Documentation updated
## Completion status
```

## Chuẩn code

- TypeScript strict.
- Domain không phụ thuộc Fastify, Drizzle, Redis hoặc Gemini SDK.
- Validation bằng Zod tại boundary.
- Error typed.
- Hàm ngắn, tên rõ nghĩa.
- Không dùng tên chung chung như `Utils`, `Helpers`, `Manager` nếu có thể dùng tên domain.
- Mỗi module chỉ export qua `index.ts`.
