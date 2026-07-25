---
title: "Backup and Restore"
document_id: "DATA-006"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["backup"]
implemented_by: []
reviewed_by: []
---


# Backup

- Daily logical backup.
- WAL/pgBackRest nếu khả thi.
- Encrypt và upload R2.
- Retention: 7 daily, 4 weekly, 3 monthly.
- Restore drill định kỳ.
- Redis không là source of truth.
- RPO pilot 15–60 phút; RTO pilot 2–4 giờ.
