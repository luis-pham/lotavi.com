---
title: "Canonical Voice Events"
document_id: "API-003"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["voice events"]
implemented_by: []
reviewed_by: []
---


# Canonical events

session.started
input.speech.started
input.speech.stopped
input.transcript.delta
input.transcript.completed
assistant.audio.delta
assistant.transcript.delta
assistant.turn.completed
tool.call.requested
tool.call.cancelled
session.interrupted
usage.updated
provider.reconnecting
session.error
session.ended

Provider adapter map event riêng sang danh sách canonical event.
