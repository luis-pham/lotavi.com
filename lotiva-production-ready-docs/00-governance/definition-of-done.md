---
title: "Definition of Done"
document_id: "GOV-005"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["điều kiện hoàn thành"]
implemented_by: []
reviewed_by: []
---


# Definition of Done

Một phase chỉ DONE khi:
- code strict typecheck;
- lint sạch;
- unit/integration/contract/E2E theo test matrix đều pass;
- tenant isolation test pass;
- migration forward và rollback strategy được kiểm tra;
- observability có log, metric, trace phù hợp;
- UX đủ responsive, accessibility, localization;
- docs cập nhật;
- không còn security blocker mức high/critical;
- completion report ghi PASS, CONDITIONAL PASS hoặc NO-GO.
