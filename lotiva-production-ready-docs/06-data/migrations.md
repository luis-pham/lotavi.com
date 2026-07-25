---
title: "Migration Rules"
document_id: "DATA-005"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["migrations"]
implemented_by: []
reviewed_by: []
---


# Migration rules

- Append-only migrations.
- Không sửa migration đã chạy.
- Mọi destructive change theo expand → backfill → switch → contract.
- Migration phải chạy được trên staging snapshot.
- Có backup trước migration production.
- CI chạy migrate fresh và migrate từ previous release.
