---
title: "Model Profiles"
document_id: "AI-003"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["provider/model config"]
implemented_by: []
reviewed_by: []
---


# Voice model profile

provider, provider_model_id, capabilities, voice preset, VAD settings, limits, enabled.

Secrets không nằm DB.
Model ID không hard-code.
Resolve: property override → tenant default → platform default.
