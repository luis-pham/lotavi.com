---
title: "Embedding Service"
document_id: "AI-005"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["embedding service"]
implemented_by: []
reviewed_by: []
---


# Embedding service

Python FastAPI + EmbeddingGemma.
Internal Docker network only.
Load once, warm model, batch support, concurrency limit, readiness probe.
API:
POST /v1/embed {texts, modelVersion}
Response vectors + dimensions + modelVersion.
No raw content logging.
