# Retrieval evaluation (F7.3)

Corpus: `packages/infrastructure/src/retrieval/eval-corpus.json`  
Runner: `packages/infrastructure/src/retrieval/eval.test.ts`

## Gates (CI)

- wrong-property retrieval: **0**
- unapproved retrieval: **0**
- Recall@3 on answerable cases: **≥ 0.90**
- no-answer correctness: **≥ 0.95**
- critical unanswerable must not invent answers

## Evidence

`pnpm test` includes the eval suite (PASS 2026-07-25).
