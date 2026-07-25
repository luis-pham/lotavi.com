/**
 * Canonical service-request state machine (Lotiva Service).
 * API clients must not set arbitrary states — transitions validated here.
 */
export type TicketStatus =
  | "draft"
  | "awaiting_guest_confirmation"
  | "submitted"
  | "acknowledged"
  | "assigned"
  | "in_progress"
  | "needs_info"
  | "resolved"
  | "guest_confirmed"
  | "reopened"
  | "cancelled"
  // Legacy aliases kept for existing seed/UI during migration
  | "new"
  | "accepted"
  | "completed";

export const TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  draft: ["awaiting_guest_confirmation", "cancelled"],
  awaiting_guest_confirmation: ["submitted", "cancelled"],
  submitted: ["acknowledged", "assigned", "cancelled", "accepted", "in_progress"],
  acknowledged: ["assigned", "in_progress", "needs_info", "cancelled"],
  assigned: ["in_progress", "needs_info", "cancelled"],
  in_progress: ["needs_info", "resolved", "completed", "cancelled"],
  needs_info: ["in_progress", "assigned", "cancelled"],
  resolved: ["guest_confirmed", "reopened"],
  guest_confirmed: ["reopened"],
  reopened: ["acknowledged", "assigned", "in_progress", "cancelled"],
  cancelled: ["reopened"],
  // legacy
  new: ["accepted", "acknowledged", "assigned", "in_progress", "cancelled"],
  accepted: ["in_progress", "assigned", "needs_info", "cancelled"],
  completed: ["guest_confirmed", "reopened"],
};

export const TERMINAL_TICKET_STATES: TicketStatus[] = ["guest_confirmed", "cancelled"];

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return (TICKET_TRANSITIONS[from] ?? []).includes(to);
}

export function assertTicketTransition(from: TicketStatus, to: TicketStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid ticket transition: ${from} → ${to}`);
  }
}

/** Tickets must not be created until the guest confirms a pending action. */
export function assertGuestConfirmed(confirmed: boolean): void {
  if (!confirmed) {
    throw new Error("Ticket creation requires guest confirmation");
  }
}

const CANONICAL_STATUSES = new Set<string>([
  "draft",
  "awaiting_guest_confirmation",
  "submitted",
  "acknowledged",
  "assigned",
  "in_progress",
  "needs_info",
  "resolved",
  "guest_confirmed",
  "reopened",
  "cancelled",
  "new",
  "accepted",
  "completed",
]);

/** Map legacy UI statuses to canonical statuses. Rejects unknown values. */
export function normalizeTicketStatus(status: string): TicketStatus {
  const map: Record<string, TicketStatus> = {
    new: "submitted",
    accepted: "acknowledged",
    completed: "resolved",
  };
  const mapped = map[status] ?? status;
  if (!CANONICAL_STATUSES.has(mapped)) {
    throw Object.assign(new Error(`Unknown ticket status: ${status}`), {
      code: "INVALID_TICKET_STATUS",
    });
  }
  return mapped as TicketStatus;
}
