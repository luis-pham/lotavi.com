---
title: "Phase 0 Staff Screen Contracts"
document_id: "UX-P0-STAFF"
version: "1.0.0"
status: "approved"
last_updated: "2026-07-26"
---

# Phase 0 Staff screen contracts

Task-first shell. No system configuration nav.

| Route | Purpose | Primary actions |
|-------|---------|-----------------|
| `/staff/my-work` | Urgent / Due / Next / Waiting / Completed | Accept, Start, Waiting, Complete, Escalate, Note |
| `/staff/department-queue` | Dept unassigned + queue | Accept, open drawer |
| `/staff/lookup` | Guest/cabin search | Open related requests |
| `/staff/shift-activity` | Shift event feed | Read-only timeline |
| `/staff/handover` | Handover notes | Create, acknowledge, resolve |
| `/staff/notifications` | Unread request alerts | Open request |
| `/staff/profile` | Identity + dept | View / change password via reset |

Mobile: list-first, sticky action row, drawer becomes full-width under 768px.
