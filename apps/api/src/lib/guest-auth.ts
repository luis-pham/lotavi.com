import { getAppContext } from "../app-context.js";

export type GuestCookie = {
  sessionId: string;
  tenantId: string;
  propertyId: string;
  roomId: string;
};

type CookieReq = {
  cookies?: Partial<Record<string, string>>;
  unsignCookie?: (value: string) => { valid: boolean; value: string | null };
};

export function readGuestCookie(req: CookieReq, cookieName: string): GuestCookie | null {
  const raw = req.cookies?.[cookieName];
  if (!raw) return null;
  try {
    let payload = raw;
    if (typeof req.unsignCookie === "function") {
      const unsigned = req.unsignCookie(raw);
      if (!unsigned.valid || !unsigned.value) return null;
      payload = unsigned.value;
    }
    const parsed = JSON.parse(payload) as GuestCookie;
    if (!parsed.sessionId || !parsed.tenantId || !parsed.propertyId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function requireActiveGuest(
  req: CookieReq,
  cookieName: string,
): Promise<
  | {
      ok: true;
      cookie: GuestCookie;
      session: NonNullable<
        Awaited<ReturnType<ReturnType<typeof getAppContext>["repos"]["sessions"]["get"]>>
      >;
    }
  | { ok: false; status: number; code: string; message: string }
> {
  const cookie = readGuestCookie(req, cookieName);
  if (!cookie) {
    return { ok: false, status: 401, code: "GUEST_UNAUTHORIZED", message: "No guest session" };
  }
  const ctx = getAppContext();
  const session = await ctx.repos.sessions.get(cookie.sessionId);
  if (!session) {
    return { ok: false, status: 401, code: "GUEST_UNAUTHORIZED", message: "Session expired" };
  }
  if (session.tenantId !== cookie.tenantId || session.propertyId !== cookie.propertyId) {
    return { ok: false, status: 401, code: "GUEST_UNAUTHORIZED", message: "Session mismatch" };
  }
  if (session.expiresAt.getTime() < Date.now()) {
    return { ok: false, status: 401, code: "GUEST_EXPIRED", message: "Guest session expired" };
  }
  const qrOk = await ctx.repos.qr.isActive(session.qrContextId, session.tenantId);
  if (!qrOk) {
    return {
      ok: false,
      status: 401,
      code: "QR_REVOKED",
      message: "Guest access token revoked or expired",
    };
  }
  return { ok: true, cookie, session };
}
