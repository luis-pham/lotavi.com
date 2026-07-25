# Security threat model (pilot)

| Threat | Mitigation | Residual |
|--------|------------|----------|
| Memory store in prod | Config fail-fast | Operator mis-set env still caught at boot |
| Public seed / default passwords | `ALLOW_DEMO_SEED` forbidden staging/prod; seed route gated | Local README still documents demo password for dev |
| QR brute force | IP rate limit + opaque tokens | In-process limiter not multi-replica |
| QR leakage in logs | Redact `body.token`; store hash only | Access logs of URL path `/g/{token}` must be stripped at edge |
| Cross-tenant data | RLS + tenant txn context | Not all tables have RLS; some bypass paths |
| Guest cookie forgery | Signed cookies + SESSION_SECRET | No server-side session revocation store for staff |
| Arbitrary ticket status | Domain transition + normalize reject | — |
| Prompt injection via knowledge | Approved-only retrieval; grounded concat | No LLM sanitizer yet (retrieval is extractive) |
| Voice session hijack | Voice disabled by default | WS auth incomplete when voice enabled |
| Staff privilege escalation | Role checks on staff/admin routes | Cookie role not reloaded every request for mutations |
| XSS | React defaults; API JSON | Admin content should remain trusted-operator only |
| SSRF via ingestion | No remote crawl in pilot | Future ingestion needs allowlist |

No formal compliance certification claimed.
