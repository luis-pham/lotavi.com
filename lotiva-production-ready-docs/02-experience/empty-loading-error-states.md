---
title: "Empty Loading Error States"
document_id: "UX-004"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["state UX"]
implemented_by: []
reviewed_by: []
---


# Shared states

## Loading
- Skeleton cho list/card.
- Progress rõ cho upload, processing, publish.
- Không khóa toàn màn hình nếu chỉ một panel đang tải.

## Empty
- Nói lý do trống.
- Đề xuất hành động phù hợp quyền.
- Không dùng minh họa che mất thông tin chính.

## Error
- Mã lỗi nội bộ không hiển thị cho user.
- Nêu việc gì thất bại.
- Có retry nếu an toàn.
- Có fallback text/handoff cho voice.
- Có link support hoặc correlation ID cho admin.
