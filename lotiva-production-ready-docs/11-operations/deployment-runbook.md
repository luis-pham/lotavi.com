---
title: "Deployment Runbook"
document_id: "OPS-003"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["deployment runbook"]
implemented_by: []
reviewed_by: []
---


# Deploy
backup → pull immutable images → migration precheck → migrate → start new containers → health checks → smoke tests → monitor → finalize.

Nếu fail: rollback image, disable feature flag, restore DB chỉ khi migration destructive và theo runbook.
