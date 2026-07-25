---
title: "RAG Architecture"
document_id: "ARCH-006"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["RAG"]
implemented_by: []
reviewed_by: []
---


# Retrieval pipeline

Query normalization → exact FAQ cache → semantic cache → EmbeddingGemma → pgvector + FTS + pg_trgm song song → RRF → top chunks → structured tool result.

Phase 0 không rerank realtime.

Metadata filters:
tenant, property, voyage/stay, language, publication status, effective dates.
