import type { Redis } from "ioredis";
import type { RateLimitResult } from "./redis.js";
import { MemoryRateLimiter } from "./redis.js";

export type RateLimiter = {
  take(key: string, cost?: number): Promise<RateLimitResult> | RateLimitResult;
  backend: "redis" | "memory" | "fail-closed";
};

/**
 * Redis sliding-window rate limiter (multi-replica safe).
 * Script is atomic: INCR + EXPIRE on first hit.
 */
export class RedisRateLimiter implements RateLimiter {
  readonly backend = "redis" as const;

  constructor(
    private readonly redis: Redis,
    private readonly capacity: number,
    private readonly windowMs: number,
    private readonly prefix = "lotiva:rl:",
  ) {}

  async take(key: string, cost = 1): Promise<RateLimitResult> {
    const redisKey = `${this.prefix}${key}`;
    const ttlSec = Math.max(1, Math.ceil(this.windowMs / 1000));
    const count = await this.redis.incrby(redisKey, cost);
    if (count === cost) {
      await this.redis.expire(redisKey, ttlSec);
    }
    const ttl = await this.redis.pttl(redisKey);
    if (count > this.capacity) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: ttl > 0 ? ttl : this.windowMs,
      };
    }
    return {
      allowed: true,
      remaining: Math.max(0, this.capacity - count),
      retryAfterMs: 0,
    };
  }
}

/** Production-safe: deny when Redis is required but unavailable. */
export class FailClosedRateLimiter implements RateLimiter {
  readonly backend = "fail-closed" as const;
  take(_key: string, _cost = 1): RateLimitResult {
    return { allowed: false, remaining: 0, retryAfterMs: 5_000 };
  }
}

export class AsyncMemoryRateLimiter implements RateLimiter {
  readonly backend = "memory" as const;
  private readonly inner: MemoryRateLimiter;
  constructor(capacity: number, refillPerMs: number) {
    this.inner = new MemoryRateLimiter(capacity, refillPerMs);
  }
  take(key: string, cost = 1): RateLimitResult {
    return this.inner.take(key, cost);
  }
}

export async function createRateLimiter(opts: {
  redisUrl: string;
  requireRedis: boolean;
  capacity: number;
  windowMs: number;
  store: string;
}): Promise<RateLimiter> {
  if (opts.store === "memory") {
    return new AsyncMemoryRateLimiter(opts.capacity, opts.capacity / opts.windowMs);
  }

  try {
    const { Redis } = await import("ioredis");
    const redis = new Redis(opts.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    await redis.connect();
    await redis.ping();
    return new RedisRateLimiter(redis, opts.capacity, opts.windowMs);
  } catch {
    if (opts.requireRedis) {
      return new FailClosedRateLimiter();
    }
    return new AsyncMemoryRateLimiter(opts.capacity, opts.capacity / opts.windowMs);
  }
}
