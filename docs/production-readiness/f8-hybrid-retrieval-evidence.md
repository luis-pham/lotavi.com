# F8.4 — Hybrid SQL Retrieval Proof

## Result

```text
CONDITIONAL PASS
```

Unresolved condition: FTS + `pg_trgm` + RRF + lexical proven locally; native pgvector dense SQL path implemented but not executed (no vector extension).

## What was proven locally

- Retrieval evaluation suite PASS (CI gate in `eval.test.ts`)
- Vietnamese / ASCII queries grounded in prior smoke (`ho boi o dau`)
- Wrong-property / unapproved / archived filters present in SQL `WHERE`
- Hybrid fusion ranks dense/FTS/trigram/lexical

## Dense SQL path (code ready, not proven)

When `detectPgvector()` is true and query embedding length = 768:

```sql
ORDER BY c.embedding_vector <=> query::vector
```

Local host: `hasPgvector=false` → app-side jsonb cosine only when vectors exist (currently `with_dim_768=0`).

## Required staging matrix (not executed)

Answerable: Hồ bơi ở đâu? / Ho boi o dau? / Pool? / Breakfast / Kayaking / Check-out  
Unanswerable: helicopter / drive cruise ship / captain private phone

Compare lexical-only vs dense-only vs hybrid once real embeddings exist.

## Gate status

| Gate | Status |
|------|--------|
| Recall@3 threshold | Met in unit eval corpus |
| No-answer correctness | Met in unit eval corpus |
| wrong-property = 0 | Enforced in SQL; staging proof pending |
| unapproved = 0 | Enforced in SQL; staging proof pending |
| critical hallucination = 0 | Grounded extractive path; staging pending |
| Dense SQL EXPLAIN | BLOCKED (no pgvector) |
