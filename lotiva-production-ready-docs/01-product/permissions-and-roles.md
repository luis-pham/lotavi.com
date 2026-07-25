---
title: "Permissions and Roles"
document_id: "PROD-003"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["RBAC"]
implemented_by: []
reviewed_by: []
---


# Roles

## Platform Admin
Toàn quyền nền tảng.

## Tenant Owner
Quản lý tenant, billing future, property, team, publish.

## Property Admin
Quản lý nội dung, portal, schedules, announcements, AI settings trong property.

## Manager
Xem và điều phối ticket, analytics vận hành.

## Staff
Xem ticket theo department, nhận việc, cập nhật trạng thái, trả lời khách.

## Content Editor
Quản lý knowledge, lịch trình, thông báo nhưng không quản lý user hoặc security.

## Viewer
Chỉ đọc báo cáo và cấu hình được cấp quyền.

Mọi permission phải được kiểm tra ở application layer và database boundary.
