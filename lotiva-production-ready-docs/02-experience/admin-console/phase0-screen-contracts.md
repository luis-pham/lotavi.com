---
title: "Phase 0 Admin Screen Contracts"
document_id: "UX-P0-ADMIN"
version: "1.0.0"
status: "approved"
last_updated: "2026-07-26"
---

# Phase 0 Admin screen contracts

Shared shell: fixed sidebar 248/72, workspace gutters 24px, sticky toolbar, right drawer 560–640px for request detail, ⌘K command palette, loading/empty/error/forbidden states.

| Route | Purpose | Primary actions | States |
|-------|---------|-----------------|--------|
| `/admin/overview` | What needs attention now | Deep-link filters, create request | loading/empty |
| `/admin/requests` | Board + list ops | filter/sort/bulk/assign/status/notes | board columns, drawer |
| `/admin/guests` | Guest registry | search, assign cabin | empty/error |
| `/admin/cabins` | Cabin inventory | edit deck/zone, open QR | empty |
| `/admin/journeys` | Journey admin | create/edit/status | empty |
| `/admin/announcements` | Publish announcements | create/publish/expire | draft/published |
| `/admin/portal-content` | Portal CMS sections | upsert/enable | draft/published |
| `/admin/categories` | Request categories | CRUD/reorder/enable | active/disabled |
| `/admin/qr-access` | QR list | generate/revoke/copy | active/revoked |
| `/admin/staff` | Staff admin | create/activate/dept/role | active/inactive |
| `/admin/departments` | Departments | CRUD/manager/SLA | active |
| `/admin/settings` | Property settings | save brand/timezone/SLA | success/error |

Keyboard: Escape closes drawer/command; focus rings on controls.
