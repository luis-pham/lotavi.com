import { createHash, randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { hashPassword, isLegacySha256Hash } from "@lotiva/domain";
import { getAppContext, getConfig } from "../app-context.js";
import { isDevLike } from "../config.js";
import { sendError } from "../plugins/observability.js";

type StaffCookie = {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
};

export async function registerAuthRoutes(app: FastifyInstance) {
  const cookieName = () => getConfig().STAFF_COOKIE_NAME;

  app.post("/api/v1/auth/login", async (req, reply) => {
    const ctx = getAppContext();
    const env = getConfig();
    const body = req.body as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return sendError(reply, req, 400, "VALIDATION", "email and password required");
    }

    const rl = await Promise.resolve(ctx.rateLimit.take(`login:${req.ip}:${body.email}`));
    if (!rl.allowed) {
      reply.header("retry-after", Math.ceil(rl.retryAfterMs / 1000));
      return sendError(reply, req, 429, "RATE_LIMITED", "Too many login attempts");
    }

    const user = await ctx.repos.identity.findByEmail(body.email);
    if (!user || !ctx.verifyPassword(body.password, user.passwordHash)) {
      return sendError(reply, req, 401, "AUTH_FAILED", "Invalid credentials");
    }

    if (!isDevLike(env) && isLegacySha256Hash(user.passwordHash)) {
      return sendError(
        reply,
        req,
        403,
        "PASSWORD_UPGRADE_REQUIRED",
        "Legacy password hash not allowed outside development",
      );
    }

    const cookie: StaffCookie = {
      userId: user.id,
      tenantId: user.tenantId ?? "",
      role: user.role,
      email: user.email,
    };
    reply.setCookie(cookieName(), JSON.stringify(cookie), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production" || env.NODE_ENV === "staging",
      signed: true,
      maxAge: 60 * 60 * 12,
    });
    await ctx.repos.audit.append({
      tenantId: user.tenantId,
      actorId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
    });
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      tenantId: user.tenantId,
    };
  });

  app.post("/api/v1/auth/logout", async (req, reply) => {
    reply.clearCookie(cookieName(), { path: "/" });
    return { ok: true };
  });

  app.get("/api/v1/auth/me", async (req, reply) => {
    const ctx = getAppContext();
    const staff = readStaff(req);
    if (!staff) return sendError(reply, req, 401, "UNAUTHORIZED", "Not logged in");
    const user = await ctx.repos.identity.findById(staff.userId);
    if (!user) return sendError(reply, req, 401, "UNAUTHORIZED", "User missing");
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      tenantId: user.tenantId,
    };
  });

  /** Always returns generic success — no account enumeration. */
  app.post("/api/v1/auth/password-reset/request", async (req, reply) => {
    const ctx = getAppContext();
    const body = req.body as { email?: string };
    const rl = await Promise.resolve(ctx.rateLimit.take(`pwreset:${req.ip}`));
    if (!rl.allowed) {
      reply.header("retry-after", Math.ceil(rl.retryAfterMs / 1000));
      return sendError(reply, req, 429, "RATE_LIMITED", "Too many reset attempts");
    }
    const generic = {
      ok: true,
      message: "If an account exists for that email, a reset token was issued.",
    };
    if (!body.email) return generic;
    const user = await ctx.repos.identity.findByEmail(body.email);
    if (!user) return generic;
    const raw = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(raw).digest("hex");
    await ctx.repos.passwordReset.createToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      requestIp: req.ip,
    });
    await ctx.repos.audit.append({
      tenantId: user.tenantId,
      actorId: user.id,
      action: "auth.password_reset_request",
      entityType: "user",
      entityId: user.id,
    });
    // Controlled alternative when email is unavailable: return token only in development.
    if (isDevLike(getConfig())) {
      return { ...generic, devResetToken: raw };
    }
    return generic;
  });

  app.post("/api/v1/auth/password-reset/confirm", async (req, reply) => {
    const ctx = getAppContext();
    const body = req.body as { token?: string; password?: string };
    if (!body.token || !body.password || body.password.length < 10) {
      return sendError(reply, req, 400, "VALIDATION", "token and password (>=10) required");
    }
    const tokenHash = createHash("sha256").update(body.token).digest("hex");
    const consumed = await ctx.repos.passwordReset.consumeToken(tokenHash);
    if (!consumed) {
      return sendError(reply, req, 400, "RESET_INVALID", "Invalid or expired reset token");
    }
    await ctx.repos.passwordReset.updatePassword(consumed.userId, hashPassword(body.password));
    await ctx.repos.audit.append({
      tenantId: null,
      actorId: consumed.userId,
      action: "auth.password_reset_confirm",
      entityType: "user",
      entityId: consumed.userId,
    });
    reply.clearCookie(cookieName(), { path: "/" });
    return { ok: true };
  });
}

export function readStaff(req: {
  cookies?: Partial<Record<string, string>>;
  unsignCookie?: (value: string) => { valid: boolean; value: string | null };
}): StaffCookie | null {
  const name = getConfig().STAFF_COOKIE_NAME;
  const raw = req.cookies?.[name];
  if (!raw) return null;
  try {
    let json = raw;
    if (req.unsignCookie) {
      const unsigned = req.unsignCookie(raw);
      if (!unsigned.valid || !unsigned.value) return null;
      json = unsigned.value;
    }
    return JSON.parse(json) as StaffCookie;
  } catch {
    return null;
  }
}
