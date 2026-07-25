---
title: "pgvector Strategy"
document_id: "DATA-004"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["vector search"]
implemented_by: []
reviewed_by: []
---


# Embeddings

Phase 0: EmbeddingGemma, dimension 768.
Columns:
embedding vector(768), embedding_model, embedding_version, content_hash.

Index:
HNSW cosine.
Hybrid retrieval dùng vector + FTS + pg_trgm + RRF.

Theo dõi recall khi filter tenant/property chặt. Khi cần: iterative scan, partial index cho tenant lớn, partitioning hoặc dedicated DB.
