import { randomUUID } from "node:crypto";

/** Application-side UUID (v4 for broad runtime support; migrate to v7 when available). */
export function newId(): string {
  return randomUUID();
}
