# Grounded answering (F7.4)

- Knowledge answers are **extractive citations** of approved chunks only.
- Retrieved knowledge is treated as **untrusted data** (`context_role: untrusted_approved_knowledge`).
- Grounding stored on messages: chunk IDs, scores, confidence, fallback reason.
- Critical content threshold: 0.35; normal: 0.15.
- Low confidence → locale-aware fallback + staff handoff offer.
