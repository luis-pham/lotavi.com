import { assertGuestConfirmed, assertTicketTransition, type TicketStatus } from "@lotiva/domain";
import type { PendingActionRepository, TicketRepository } from "../ports.js";

export async function prepareTicketAction(deps: {
  pending: PendingActionRepository;
  tenantId: string;
  guestSessionId: string;
  category: string;
  description: string;
  department?: string;
}) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
  const action = await deps.pending.create({
    tenantId: deps.tenantId,
    guestSessionId: deps.guestSessionId,
    category: deps.category,
    description: deps.description,
    department: deps.department ?? null,
    expiresAt,
  });
  return { pendingActionId: action.id, expiresAt: expiresAt.toISOString() };
}

export async function confirmTicketAction(deps: {
  pending: PendingActionRepository;
  tickets: TicketRepository;
  tenantId: string;
  propertyId: string;
  roomId: string;
  guestSessionId: string;
  pendingActionId: string;
  confirmed: boolean;
  idempotencyKey: string;
}) {
  const action = await deps.pending.get(deps.pendingActionId, deps.tenantId);
  if (!action || action.guestSessionId !== deps.guestSessionId) {
    throw Object.assign(new Error("Pending action not found"), { code: "PENDING_NOT_FOUND" });
  }
  if (action.status !== "pending") {
    throw Object.assign(new Error("Pending action already resolved"), { code: "PENDING_RESOLVED" });
  }
  if ("expiresAt" in action && action.expiresAt && new Date(action.expiresAt as Date) < new Date()) {
    await deps.pending.mark(deps.pendingActionId, deps.tenantId, "cancelled");
    throw Object.assign(new Error("Pending action expired"), { code: "PENDING_EXPIRED" });
  }

  if (!deps.confirmed) {
    await deps.pending.mark(deps.pendingActionId, deps.tenantId, "cancelled");
    return { cancelled: true as const };
  }

  assertGuestConfirmed(true);
  await deps.pending.mark(deps.pendingActionId, deps.tenantId, "confirmed");

  const ticket = await deps.tickets.create({
    tenantId: deps.tenantId,
    propertyId: deps.propertyId,
    guestSessionId: deps.guestSessionId,
    roomId: deps.roomId,
    category: action.category,
    description: action.description,
    department: action.department,
    idempotencyKey: deps.idempotencyKey,
  });

  return { cancelled: false as const, ticketId: ticket.id, created: ticket.created };
}

export async function transitionTicket(deps: {
  tickets: TicketRepository;
  tenantId: string;
  ticketId: string;
  to: TicketStatus;
  actorId?: string | null;
  actorType?: "guest" | "staff" | "system";
  reason?: string;
  correlationId?: string;
}) {
  const ticket = await deps.tickets.get(deps.ticketId, deps.tenantId);
  if (!ticket) {
    throw Object.assign(new Error("Ticket not found"), { code: "TICKET_NOT_FOUND" });
  }
  assertTicketTransition(ticket.status, deps.to);
  try {
    await deps.tickets.transition({
      id: deps.ticketId,
      tenantId: deps.tenantId,
      fromStatus: ticket.status,
      toStatus: deps.to,
      expectedVersion: ticket.version,
      actorId: deps.actorId ?? null,
      actorType: deps.actorType ?? "system",
      reason: deps.reason,
      correlationId: deps.correlationId,
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "CONCURRENCY_CONFLICT") throw err;
    // Fallback for older repos that only implement updateStatus
    await deps.tickets.updateStatus(deps.ticketId, deps.tenantId, deps.to);
  }
  return { id: ticket.id, status: deps.to };
}
