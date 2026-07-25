import { createHash, randomBytes } from "node:crypto";

export function generateOpaqueQrToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashQrToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function guestPortalPath(token: string): string {
  return `/g/${token}`;
}
