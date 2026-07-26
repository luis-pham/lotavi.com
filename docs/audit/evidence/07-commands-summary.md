# Audit command evidence summary

**Audit date:** 2026-07-27  
**Repo:** `/Users/huypq/Documents/Projects/lotavi` @ `1d2ae69`

| Command | Result | Evidence file |
|---------|--------|---------------|
| `pnpm -r typecheck` | **PASS** (EXIT:0) | `01-typecheck.txt` |
| `pnpm -r lint` | **PASS** (EXIT:0; lint ≡ tsc --noEmit) | `03-lint.txt` |
| `pnpm -r test` | **FAIL** — `@lotiva/domain` package script runs vitest with wrong include when cwd is package | `02-unit-tests.txt` |
| `pnpm test` (root vitest) | **PASS** — 18 files, 81 passed, 2 skipped (postgres RLS) | `02b-root-vitest.txt` |
| `pnpm build` / turbo | **PASS** — 10/10 tasks | `04-build.txt` |
| Playwright `RUN_E2E=1` | **NOT RUN** in this audit | — |
| `curl https://api.lotavi.com/health` | `{"status":"ok",...}` | `05-prod-health.txt` |
| `curl https://api.lotavi.com/ready` | `store:postgres`, `voiceEnabled:false` | `05-prod-health.txt` |

Screenshots copied from `docs/phase0-evidence/` (memory-stack capture 2026-07-26).
