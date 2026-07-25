---
title: "Environments"
document_id: "OPS-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-26"
depends_on: []
source_of_truth_for: ["environments"]
implemented_by: []
reviewed_by: []
---

> **Historical hostname note.** Public brand hosts are **lotavi.com** (see domain localization docs).  
> “Voice Gateway” column means the **API control plane**, not a Gemini media relay. Voice defaults off — [docs/voice/production-gates.md](../../docs/voice/production-gates.md).

# Environments
local, test, staging, production.
Separate DB, Redis, buckets, provider keys.
Staging mirrors production topology.

## Hostnames

| Environment | Web | API (voice control plane) |
|-------------|-----|---------------------------|
| production | `https://lotavi.com`, `https://app.lotavi.com` (legacy lotiva.* may redirect) | `https://api.lotavi.com` |
| staging | `https://staging.lotavi.com` | `https://api.staging.lotavi.com` |
| local | `http://localhost:3000` | `http://localhost:4000` |

Guest Portal QR và cookie session dùng domain production/staging tương ứng.
