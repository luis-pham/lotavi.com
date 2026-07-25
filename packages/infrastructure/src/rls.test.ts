import { describe, expect, it } from "vitest";
import { createMemoryDb, createMemoryRepos } from "./memory/store.js";

/**
 * Memory-store isolation analogue of Postgres RLS tests.
 * Full SQL RLS tests run in CI when DATABASE_URL points at Postgres.
 */
describe("tenant isolation (memory)", () => {
  it("tenant A cannot see tenant B tickets", async () => {
    const db = createMemoryDb();
    const repos = createMemoryRepos(db);
    const tenantA = db.seedMeta.tenantId;
    const propertyA = db.seedMeta.propertyId;

    const tenantB = "00000000-0000-4000-8000-0000000000bb";
    const propertyB = "00000000-0000-4000-8000-0000000000bp";
    db.tenants.push({ id: tenantB, name: "Other", slug: "other" });
    db.properties.push({ id: propertyB, tenantId: tenantB, name: "Other Hotel" });
    db.rooms.push({
      id: "00000000-0000-4000-8000-0000000000br",
      tenantId: tenantB,
      propertyId: propertyB,
      label: "101",
    });
    db.guestSessions.push({
      id: "00000000-0000-4000-8000-0000000000bg",
      tenantId: tenantB,
      propertyId: propertyB,
      qrContextId: db.qr[0]!.id,
      roomId: "00000000-0000-4000-8000-0000000000br",
      locale: "en-US",
      themeVersionId: null,
      expiresAt: new Date(Date.now() + 86400000),
    });
    db.tickets.push({
      id: "00000000-0000-4000-8000-0000000000bt",
      tenantId: tenantB,
      propertyId: propertyB,
      guestSessionId: "00000000-0000-4000-8000-0000000000bg",
      roomId: "00000000-0000-4000-8000-0000000000br",
      category: "x",
      description: "secret",
      department: null,
      status: "new",
      version: 1,
      idempotencyKey: "b-key",
      createdAt: new Date(),
    });

    const listed = await repos.tickets.listForProperty(propertyA, tenantA);
    expect(listed.every((t) => t.id !== "00000000-0000-4000-8000-0000000000bt")).toBe(true);
    const leaked = await repos.tickets.get("00000000-0000-4000-8000-0000000000bt", tenantA);
    expect(leaked).toBeNull();
  });
});
