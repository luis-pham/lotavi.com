# A14 — Migration feasibility

## FINAL AUDIT CLASSIFICATION

```text
INSUFFICIENT EVIDENCE
```

### Why this classification (not the others)

| Option | Why rejected / accepted |
|--------|-------------------------|
| DIRECT MIGRATION FEASIBLE | No working media relay or Gemini Live session to migrate; provider ephemeral/browser Live unverified |
| DIRECT MIGRATION FEASIBLE WITH MAJOR REWORK | Tempting, but overstates certainty on provider token/tool locking |
| RELAY SHOULD REMAIN PRIMARY | Reasonable **interim product** stance (`VOICE_ENABLED=false` until Live is real), but “remain primary” assumes a real relay exists — it does not |
| **INSUFFICIENT EVIDENCE** | **Selected** — cannot certify direct-client safety or impossibility until (1) real Live integration exists or is scoped, and (2) Google ephemeral/browser Live capabilities are verified from current provider docs/SDK |

## Dimension scores (1–10)

| Dimension | Score | Brief reason |
|-----------|------:|--------------|
| Reusable frontend audio stack | 1 | No capture/playback/WS client |
| Backend separation of concerns | 5 | Port + adapter boundary exists; placeholder inside |
| Tool safety | 2 | No voice tools; WS auth gap |
| RAG portability | 6 | Text RAG solid; not connected to voice |
| Session-state portability | 2 | Memory-only; DB schema unused |
| Telemetry portability | 2 | Almost none for voice |
| Provider support | 1 | No SDK; ephemeral/browser Live unverified |
| Rollback safety | 8 | `VOICE_ENABLED=false` already default; flags easy |
| **Total migration risk** | **9** | Building voice + choosing transport + security simultaneously |

Interpretation: high risk / low evidence — **do not migrate**; first prove Live (either transport) behind flag.
