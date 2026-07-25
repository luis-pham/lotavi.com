---
title: "Entity Relationship Model"
document_id: "DATA-002"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["ER model"]
implemented_by: []
reviewed_by: []
---


# Core entities

Tenant 1—N Property
Property 1—N Room/Cabin
Property 1—N Voyage/StayContext
QRContext → Property + Room/Cabin + Voyage/StayContext
GuestSession → QRContext
Conversation → GuestSession
VoiceSession → Conversation
Message → Conversation
Ticket → GuestSession + Room + Department
TicketEvent → Ticket
KnowledgeDocument → Versions → Chunks
PortalTheme → Versions → Publications
PromptProfile → Components → Versions → Publications
