---
title: "QR Security"
document_id: "SEC-003"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["QR security"]
implemented_by: []
reviewed_by: []
---


# QR
Opaque random token.
DB lưu hash.
Có active_from, active_until, revoked_at.
Không chứa PII.
Scan tạo guest session cookie/token scope hẹp.
Rate limit QR/IP/session.
Không cho URL params override room/property.

## URL shape

Production QR trỏ tới host Lotiva, ví dụ:
`https://lotiva.vn/g/{opaqueToken}`

Token chỉ là opaque id; room/property resolve từ DB sau khi scan.
Staging dùng `https://staging.lotiva.vn/g/{opaqueToken}`.
Cookie guest session gắn domain environment tương ứng (không dùng wildcard rộng hơn cần thiết).
