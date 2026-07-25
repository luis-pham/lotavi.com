---
title: "Monitoring Runbook"
document_id: "OPS-004"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-26"
depends_on: []
source_of_truth_for: ["monitoring"]
implemented_by: []
reviewed_by: []
---

> **Voice observability note.**  
> Canonical voice metrics classes: [docs/voice/architecture.md](../../docs/voice/architecture.md) (Implemented / Client-reported / Provider-verified / Billing-authoritative).  
> Browser-reported duration and transcript events are **not** billing data. Details: [docs/voice-direct-migration/v1-5-observability.md](../../docs/voice-direct-migration/v1-5-observability.md).

# Metrics

**Core (implemented / ops):** HTTP latency/error, DB pool, queue depth, job failures, ticket delivery latency, cache hit, pgvector latency (when enabled).

**Voice — implemented diagnostic (not billing):** session created, token mint success/fail, connection attempt/active/failed, session ended/abandoned, heartbeat, text fallback counters, sampled first-audio latency average.

**Voice — client-reported (diagnostic only):** first-audio latency samples, transcript-received flags, interruption flags.

**Voice — planned / not provider-verified:** end-to-end Live success rate on real devices, provider usage reconciliation.

**Voice — billing-authoritative:** **not implemented** (do not use browser events).

Structured logs may include correlationId, tenantId, propertyId, sessionId but never secrets, ephemeral tokens, or transcript bodies in production logging policy.
