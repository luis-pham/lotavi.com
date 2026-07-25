---
title: "Environments"
document_id: "OPS-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["environments"]
implemented_by: []
reviewed_by: []
---


# Environments
local, test, staging, production.
Separate DB, Redis, buckets, provider keys.
Staging mirrors production topology.

## Hostnames (lotiva.vn)

| Environment | Web | API / Voice Gateway |
|-------------|-----|---------------------|
| production | `https://lotiva.vn`, `https://app.lotiva.vn` | `https://api.lotiva.vn` |
| staging | `https://staging.lotiva.vn` | `https://api.staging.lotiva.vn` |
| local | `http://localhost:3000` | `http://localhost:4000` |

Guest Portal QR và cookie session dùng domain production/staging tương ứng.
Transactional email dùng `noreply@lotiva.vn` (hoặc subdomain mail đã cấu hình).
