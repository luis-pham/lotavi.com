import { describe, expect, it } from "vitest";
import { assertGuestConfirmed, canTransition, normalizeTicketStatus } from "./ticket.js";

describe("ticket domain", () => {
  it("allows submitted → acknowledged", () => {
    expect(canTransition("submitted", "acknowledged")).toBe(true);
  });

  it("allows resolved → guest_confirmed", () => {
    expect(canTransition("resolved", "guest_confirmed")).toBe(true);
  });

  it("blocks guest_confirmed → in_progress", () => {
    expect(canTransition("guest_confirmed", "in_progress")).toBe(false);
  });

  it("requires confirmation", () => {
    expect(() => assertGuestConfirmed(false)).toThrow(/confirmation/);
    expect(() => assertGuestConfirmed(true)).not.toThrow();
  });

  it("normalizes legacy statuses", () => {
    expect(normalizeTicketStatus("new")).toBe("submitted");
    expect(normalizeTicketStatus("completed")).toBe("resolved");
  });
});
