# F7 Baseline (2026-07-25)

## Starting classification

```text
PILOT READY
```

## Baseline evidence

- `pnpm test` with `RUN_PG_TESTS=1`: **26/26 PASS**
- Embedding service: SHA-256 stub only (`apps/embedding-service/app/main.py`)
- Retrieval: in-process lexical scoring; no SQL pgvector hybrid
- Playwright: skeleton gated by `RUN_E2E`; no playwright.config
- Password reset: absent
- Restore: dump/verify scripts only; no clean-DB drill automation
- Staging TLS: Caddy `auto_https off`; no executed DNS evidence
- Load: health/ready k6 only
- Voice: disabled; Gemini Live not verified

## Target

```text
CONDITIONAL PRODUCTION READY — TEXT EXPERIENCE ONLY
```

Requires closing F7.1–F7.13. Voice remains optional (F7.14).
