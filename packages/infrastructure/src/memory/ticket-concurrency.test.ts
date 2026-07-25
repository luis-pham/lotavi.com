import { describe, expect, it } from "vitest";
import { createMemoryDb, createMemoryRepos } from "./store.js";
import { transitionTicket } from "@lotiva/application";

describe("ticket concurrency + transition history", () => {
  it("rejects stale version updates and records transitions", async () => {
    const db = createMemoryDb();
    const repos = createMemoryRepos(db);
    const created = await repos.tickets.create({
      tenantId: db.seedMeta.tenantId,
      propertyId: db.seedMeta.propertyId,
      guestSessionId: "gs-1",
      roomId: db.seedMeta.roomId,
      category: "housekeeping",
      description: "Towels",
      department: "HK",
      idempotencyKey: "idem-concurrency-1",
    });

    await transitionTicket({
      tickets: repos.tickets,
      tenantId: db.seedMeta.tenantId,
      ticketId: created.id,
      to: "acknowledged",
      actorType: "staff",
    });

    const ticket = await repos.tickets.get(created.id, db.seedMeta.tenantId);
    expect(ticket?.status).toBe("acknowledged");
    expect(ticket?.version).toBe(2);
    expect(db.ticketTransitions).toHaveLength(1);

    await expect(
      repos.tickets.transition({
        id: created.id,
        tenantId: db.seedMeta.tenantId,
        fromStatus: "submitted",
        toStatus: "in_progress",
        expectedVersion: 1,
        actorType: "staff",
      }),
    ).rejects.toMatchObject({ code: "CONCURRENCY_CONFLICT" });
  });

  it("idempotent create with same key", async () => {
    const db = createMemoryDb();
    const repos = createMemoryRepos(db);
    const a = await repos.tickets.create({
      tenantId: db.seedMeta.tenantId,
      propertyId: db.seedMeta.propertyId,
      guestSessionId: "gs-1",
      roomId: db.seedMeta.roomId,
      category: "housekeeping",
      description: "Towels",
      department: "HK",
      idempotencyKey: "idem-dup-1",
    });
    const b = await repos.tickets.create({
      tenantId: db.seedMeta.tenantId,
      propertyId: db.seedMeta.propertyId,
      guestSessionId: "gs-1",
      roomId: db.seedMeta.roomId,
      category: "housekeeping",
      description: "Towels",
      department: "HK",
      idempotencyKey: "idem-dup-1",
    });
    expect(a.id).toBe(b.id);
    expect(b.created).toBe(false);
  });
});
