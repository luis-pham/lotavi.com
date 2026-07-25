---
title: "WebSocket Protocol"
document_id: "API-002"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["canonical websocket"]
implemented_by: []
reviewed_by: []
---


# Client messages
session.start, session.resume, audio.append, text.submit, assistant.interrupt, tool.confirm, session.end, connection.ping.

# Server messages
session.ready, state.snapshot, input.speech_started, input.transcript.delta, input.transcript.completed, assistant.audio.delta, assistant.transcript.delta, action.confirmation_required, connection.reconnecting, session.error, session.ended.

Mọi message có protocolVersion, sessionId, messageId, timestamp.
