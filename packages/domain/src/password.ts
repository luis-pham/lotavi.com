import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

/** Production-safe password hashing (scrypt). Format: scrypt$N$r$p$salt$hash */
export function hashPassword(password: string): string {
  const N = 16384;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, KEYLEN, { N, r, p }).toString("base64url");
  return `scrypt$${N}$${r}$${p}$${salt}$${hash}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  // Legacy demo SHA-256 (64 hex) — only for migration of local seeds; reject in prod via config.
  if (/^[a-f0-9]{64}$/i.test(encoded)) {
    const legacy = createHash("sha256").update(password).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(legacy), Buffer.from(encoded.toLowerCase()));
    } catch {
      return false;
    }
  }

  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = parts[4]!;
  const expected = parts[5]!;
  const actual = scryptSync(password, salt, KEYLEN, { N, r, p }).toString("base64url");
  try {
    return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function isLegacySha256Hash(encoded: string): boolean {
  return /^[a-f0-9]{64}$/i.test(encoded);
}
