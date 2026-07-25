# F8.3 — Re-embed Approved Knowledge

## Result

```text
CONDITIONAL PASS
```

Unresolved condition: workflow and dry-run executed; live re-embed against real EmbeddingGemma not executed (F8.1 BLOCKED).

## Implemented

`packages/infrastructure/scripts/reembed-knowledge.ts` via:

```bash
pnpm knowledge:reembed -- --dry-run
pnpm knowledge:reembed -- --tenant <uuid> --property <uuid>
pnpm knowledge:reembed -- --force --batch-size 16
pnpm knowledge:reembed -- --resume-after <chunk-uuid>
```

Behavior:

- published + non-archived only
- tenant/property scoped
- content-hash + model/dimension skip (idempotent)
- `--force` re-embed
- batch controlled + resume-after failure
- writes jsonb embedding + metadata; best-effort `embedding_vector` sync when pgvector present
- does not invent vectors when service unavailable (non-dry-run exits)

## Dry-run evidence

Executed against local Postgres with `--dry-run` (embedding `/ready` unavailable → warned; dry-run continued).

## Remaining for PASS

1. Real model backend ready
2. Non-dry-run complete with counts:
   - every approved active chunk dimension = 768
   - archived excluded from retrieval
   - model revision consistent
