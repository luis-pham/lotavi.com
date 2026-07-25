import { describe, expect, it, vi } from "vitest";
import { confirmTicketAction, prepareTicketAction } from "./use-cases/tickets.js";

describe("ticket use cases", () => {
  it("prepare then confirm creates ticket", async () => {
    const pending = {
      create: vi.fn(async () => ({ id: "pa-1" })),
      get: vi.fn(async () => ({
        id: "pa-1",
        guestSessionId: "gs-1",
        category: "housekeeping",
        description: "Extra towels",
        department: "HK",
        status: "pending" as const,
        expiresAt: new Date(Date.now() + 60_000),
      })),
      mark: vi.fn(async () => undefined),
    };
    const tickets = {
      create: vi.fn(async () => ({ id: "t-1", created: true })),
      listForProperty: vi.fn(),
      listForGuestSession: vi.fn(),
      updateStatus: vi.fn(),
      transition: vi.fn(),
      get: vi.fn(),
    };

    const prepared = await prepareTicketAction({
      pending,
      tenantId: "ten-1",
      guestSessionId: "gs-1",
      category: "housekeeping",
      description: "Extra towels",
    });
    expect(prepared.pendingActionId).toBe("pa-1");

    const result = await confirmTicketAction({
      pending,
      tickets,
      tenantId: "ten-1",
      propertyId: "prop-1",
      roomId: "room-1",
      guestSessionId: "gs-1",
      pendingActionId: "pa-1",
      confirmed: true,
      idempotencyKey: "idem-12345678",
    });
    expect(result).toEqual({ cancelled: false, ticketId: "t-1", created: true });
  });
});
