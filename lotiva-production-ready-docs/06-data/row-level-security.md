---
title: "Row Level Security"
document_id: "DATA-003"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["RLS"]
implemented_by: []
reviewed_by: []
---


# RLS requirements

Bật RLS cho bảng tenant-owned nhạy cảm.
Policy dùng `current_setting('app.tenant_id', true)`.

Mọi query chạy trong transaction với `SET LOCAL`/`set_config(..., true)`.
Integration test phải chứng minh:
- tenant A không đọc/ghi tenant B;
- connection reuse không giữ tenant context;
- rollback không rò context;
- background worker set đúng tenant trước mỗi job.
