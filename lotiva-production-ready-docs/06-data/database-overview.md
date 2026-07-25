---
title: "Database Overview"
document_id: "DATA-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["database"]
implemented_by: []
reviewed_by: []
---


# PostgreSQL extensions
pgvector, pg_trgm, unaccent, pg_stat_statements.

Schemas/modules may remain public schema in Phase 0; table naming prefixes optional.
All timestamps timestamptz.
IDs UUIDv7 generated application-side where supported.
