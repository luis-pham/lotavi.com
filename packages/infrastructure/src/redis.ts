import { Redis } from "ioredis";

export function createRedis(url = process.env.REDIS_URL ?? "redis://localhost:6379") {
  if (process.env.LOTIVA_STORE === "memory" || process.env.REDIS_URL === "memory") {
    return null;
  }
  return new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
}

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterMs: number };

/** Simple in-process token bucket when Redis is unavailable. */
export class MemoryRateLimiter {
  private buckets = new Map<string, { tokens: number; updatedAt: number }>();

  constructor(
    private readonly capacity: number,
    private readonly refillPerMs: number,
  ) {}

  take(key: string, cost = 1): RateLimitResult {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, updatedAt: now };
    const elapsed = now - bucket.updatedAt;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillPerMs);
    bucket.updatedAt = now;
    if (bucket.tokens < cost) {
      this.buckets.set(key, bucket);
      return {
        allowed: false,
        remaining: Math.floor(bucket.tokens),
        retryAfterMs:
          this.refillPerMs > 0
            ? Math.ceil((cost - bucket.tokens) / this.refillPerMs)
            : 60_000,
      };
    }
    bucket.tokens -= cost;
    this.buckets.set(key, bucket);
    return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterMs: 0 };
  }
}
