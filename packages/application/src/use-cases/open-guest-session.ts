import { newId } from "@lotiva/domain";
import type { GuestSessionRepository, QrRepository, ThemeRepository } from "../ports.js";

export async function openGuestSession(deps: {
  qr: QrRepository;
  sessions: GuestSessionRepository;
  themes: ThemeRepository;
  token: string;
  locale?: string;
}) {
  const resolved = await deps.qr.resolveByToken(deps.token);
  if (!resolved) {
    throw Object.assign(new Error("QR invalid or expired"), { code: "QR_INVALID" });
  }

  const published = await deps.themes.getPublished(resolved.propertyId);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const session = await deps.sessions.create({
    tenantId: resolved.tenantId,
    propertyId: resolved.propertyId,
    qrContextId: resolved.qrContextId,
    roomId: resolved.roomId,
    locale: deps.locale ?? "vi-VN",
    themeVersionId: published?.versionId ?? null,
    expiresAt,
  });

  return {
    sessionId: session.id,
    propertyId: resolved.propertyId,
    roomLabel: resolved.roomLabel,
    locale: deps.locale ?? "vi-VN",
    themeVersionId: published?.versionId ?? null,
    theme: published,
    expiresAt: expiresAt.toISOString(),
    correlationId: newId(),
  };
}
