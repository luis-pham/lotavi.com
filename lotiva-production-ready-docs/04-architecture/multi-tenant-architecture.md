---
title: "Multi-Tenant Architecture"
document_id: "ARCH-004"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["multi-tenancy"]
implemented_by: []
reviewed_by: []
---


# Multi-tenancy

Phase 0:
- shared database;
- shared schema;
- mọi bảng tenant-owned có `tenant_id`;
- property-owned có `property_id`;
- unique/index luôn cân nhắc tenant scope;
- RLS là lớp phòng thủ thứ hai.

Mọi query tenant-owned:
```ts
db.transaction(async tx => {
  await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
  return repositoryOperation(tx);
});
```

Không cho repository tenant-owned nhận database client ngoài tenant transaction wrapper.
