import { afterAll, describe, expect, it } from "vitest";
import { newId } from "@lotiva/domain";
import { closeDb, withBypassRls, withTenant } from "./client.js";
import { createPostgresRepos, pingPostgres } from "./postgres-repos.js";
import * as t from "./schema.js";

const hasDb = process.env.LOTIVA_STORE === "postgres" || process.env.RUN_PG_TESTS === "1";

describe.skipIf(!hasDb)("Postgres RLS isolation", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("pings database", async () => {
    expect(await pingPostgres()).toBe(true);
  });

  it("tenant A cannot read tenant B tickets under RLS", async () => {
    const ok = await pingPostgres();
    if (!ok) return;

    const tenantA = newId();
    const tenantB = newId();
    const propertyA = newId();
    const propertyB = newId();
    const roomA = newId();
    const roomB = newId();
    const qrA = newId();
    const qrB = newId();
    const gsA = newId();
    const gsB = newId();
    const ticketB = newId();

    await withBypassRls(async (db) => {
      await db.insert(t.tenants).values([
        { id: tenantA, name: "A", slug: `a-${tenantA.slice(0, 8)}` },
        { id: tenantB, name: "B", slug: `b-${tenantB.slice(0, 8)}` },
      ]);
      await db.insert(t.properties).values([
        { id: propertyA, tenantId: tenantA, name: "Prop A" },
        { id: propertyB, tenantId: tenantB, name: "Prop B" },
      ]);
      await db.insert(t.rooms).values([
        { id: roomA, tenantId: tenantA, propertyId: propertyA, label: "1" },
        { id: roomB, tenantId: tenantB, propertyId: propertyB, label: "2" },
      ]);
      await db.insert(t.qrContexts).values([
        {
          id: qrA,
          tenantId: tenantA,
          propertyId: propertyA,
          roomId: roomA,
          tokenHash: `hash-a-${tenantA}`,
          activeFrom: new Date(),
        },
        {
          id: qrB,
          tenantId: tenantB,
          propertyId: propertyB,
          roomId: roomB,
          tokenHash: `hash-b-${tenantB}`,
          activeFrom: new Date(),
        },
      ]);
      await db.insert(t.guestSessions).values([
        {
          id: gsA,
          tenantId: tenantA,
          propertyId: propertyA,
          qrContextId: qrA,
          roomId: roomA,
          locale: "vi-VN",
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: gsB,
          tenantId: tenantB,
          propertyId: propertyB,
          qrContextId: qrB,
          roomId: roomB,
          locale: "en-US",
          expiresAt: new Date(Date.now() + 86400000),
        },
      ]);
      await db.insert(t.tickets).values({
        id: ticketB,
        tenantId: tenantB,
        propertyId: propertyB,
        guestSessionId: gsB,
        roomId: roomB,
        category: "secret",
        description: "tenant B only",
        status: "new",
        idempotencyKey: `idem-${ticketB}`,
      });
    });

    const repos = createPostgresRepos();
    const leaked = await repos.tickets.get(ticketB, tenantA);
    expect(leaked).toBeNull();

    const listedA = await repos.tickets.listForProperty(propertyA, tenantA);
    expect(listedA.find((x) => x.id === ticketB)).toBeUndefined();

    // Positive control: tenant B can read own ticket
    const own = await withTenant(tenantB, async () => repos.tickets.get(ticketB, tenantB));
    expect(own?.description).toBe("tenant B only");
  });
});
