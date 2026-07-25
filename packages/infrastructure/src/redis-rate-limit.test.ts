import { describe, expect, it } from "vitest";
import {
  AsyncMemoryRateLimiter,
  FailClosedRateLimiter,
  RedisRateLimiter,
} from "./redis-rate-limit.js";

describe("rate limiters", () => {
  it("memory limiter eventually blocks", () => {
    const rl = new AsyncMemoryRateLimiter(2, 0.000001);
    expect(rl.take("a").allowed).toBe(true);
    expect(rl.take("a").allowed).toBe(true);
    expect(rl.take("a").allowed).toBe(false);
  });

  it("fail-closed always denies", () => {
    const rl = new FailClosedRateLimiter();
    expect(rl.take("login:1").allowed).toBe(false);
  });

  it("redis limiter shape is stable when redis mock increments", async () => {
    const store = new Map<string, number>();
    const redis = {
      async incrby(key: string, n: number) {
        const v = (store.get(key) ?? 0) + n;
        store.set(key, v);
        return v;
      },
      async expire() {
        return 1;
      },
      async pttl() {
        return 1000;
      },
    };
    const rl = new RedisRateLimiter(redis as never, 2, 60_000);
    expect((await rl.take("k")).allowed).toBe(true);
    expect((await rl.take("k")).allowed).toBe(true);
    expect((await rl.take("k")).allowed).toBe(false);
  });
});
