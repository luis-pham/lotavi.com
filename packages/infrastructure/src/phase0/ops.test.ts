import { describe, expect, it } from "vitest";
import { createMemoryDb } from "../memory/store.js";
import { createPhase0Ops } from "./ops.js";

describe("phase0 ops memory", () => {
  it("seeds departments/categories and supports request assign + note + handover", async () => {
    const db = createMemoryDb();
    const ops = createPhase0Ops({ store: "memory", db });
    const tenantId = db.seedMeta.tenantId;
    const propertyId = db.seedMeta.propertyId;
    const scope = { tenantId, propertyId };
    const admin = db.users.find((u) => u.role === "property_admin")!;
    const staff = db.users.find((u) => u.role === "staff")!;

    await ops.seedPhase0Extras(tenantId, propertyId, [db.seedMeta.roomId], admin.id, staff.id);
    const departments = await ops.listDepartments(scope);
    const categories = await ops.listCategories(scope);
    expect(departments.length).toBeGreaterThanOrEqual(2);
    expect(categories.length).toBeGreaterThanOrEqual(2);

    const ticket = {
      id: "ticket-1",
      tenantId,
      propertyId,
      guestSessionId: "gs-1",
      roomId: db.seedMeta.roomId,
      category: "Housekeeping",
      description: "Towels",
      department: "Housekeeping",
      status: "submitted" as const,
      version: 1,
      priority: "normal",
      assigneeId: null,
      escalated: false,
      source: "guest_portal",
      unreadStaff: true,
      createdAt: new Date(),
      idempotencyKey: "k1",
    };
    db.tickets.push(ticket);

    const updated = await ops.updateTicket(
      tenantId,
      ticket.id,
      { assigneeId: staff.id, status: "acknowledged" },
      admin.id,
    );
    expect(updated?.assigneeId).toBe(staff.id);
    expect(updated?.status).toBe("acknowledged");

    const note = await ops.addTicketNote(tenantId, ticket.id, {
      authorId: staff.id,
      visibility: "internal",
      body: "On my way",
    });
    expect(note.body).toBe("On my way");

    const detail = await ops.getTicket(tenantId, ticket.id);
    expect(detail?.notes?.length).toBeGreaterThanOrEqual(1);

    const handover = await ops.createHandover(scope, {
      authorId: staff.id,
      departmentId: departments[0]!.id,
      body: "Pending towels for 1208",
    });
    expect(handover.status).toBe("open");
    const list = await ops.listHandovers(scope);
    expect(list.some((h) => h.id === handover.id)).toBe(true);
  });

  it("forbids invalid ticket transitions", async () => {
    const db = createMemoryDb();
    const ops = createPhase0Ops({ store: "memory", db });
    const ticket = {
      id: "t-bad",
      tenantId: db.seedMeta.tenantId,
      propertyId: db.seedMeta.propertyId,
      guestSessionId: "gs",
      roomId: db.seedMeta.roomId,
      category: "x",
      description: "y",
      department: null,
      status: "resolved" as const,
      version: 1,
      priority: "normal",
      assigneeId: null,
      escalated: false,
      source: "guest_portal",
      unreadStaff: false,
      createdAt: new Date(),
      idempotencyKey: "k2",
    };
    db.tickets.push(ticket);
    await expect(
      ops.updateTicket(db.seedMeta.tenantId, ticket.id, { status: "submitted" }, null),
    ).rejects.toThrow(/Invalid ticket transition/i);
  });
});
