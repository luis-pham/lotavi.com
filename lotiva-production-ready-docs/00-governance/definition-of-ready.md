---
title: "Definition of Ready"
document_id: "GOV-004"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["điều kiện bắt đầu phase"]
implemented_by: []
reviewed_by: []
---


# Definition of Ready

Một phase chỉ được bắt đầu khi:
- scope rõ;
- ngoài scope rõ;
- domain rules approved;
- UX screen spec có đủ loading/empty/error;
- API hoặc event contract có draft ổn định;
- migration impact được xác định;
- security review sơ bộ xong;
- acceptance criteria và test matrix tồn tại;
- dependency phase trước đã PASS hoặc CONDITIONAL PASS có mitigation.
