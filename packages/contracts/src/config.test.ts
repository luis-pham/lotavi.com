import { describe, expect, it } from "vitest";
import { parseLotivaEnv } from "./config.js";

const prodBase = {
  NODE_ENV: "production" as const,
  LOTIVA_STORE: "postgres" as const,
  DATABASE_URL: "postgres://lotiva:lotiva@localhost:5432/lotiva",
  SESSION_SECRET: "x".repeat(32),
  REQUIRE_REDIS_RATE_LIMIT: "true",
  EMBEDDING_BACKEND: "model" as const,
  EMBEDDING_MODEL_ID: "google/embeddinggemma-300m",
};

describe("LotivaEnvSchema", () => {
  it("allows memory in development", () => {
    const env = parseLotivaEnv({
      NODE_ENV: "development",
      LOTIVA_STORE: "memory",
      ALLOW_MEMORY_STORE: "true",
    });
    expect(env.LOTIVA_STORE).toBe("memory");
  });

  it("refuses memory in production", () => {
    expect(() =>
      parseLotivaEnv({
        ...prodBase,
        LOTIVA_STORE: "memory",
      }),
    ).toThrow(/LOTIVA_STORE=memory is forbidden/);
  });

  it("requires DATABASE_URL for postgres", () => {
    expect(() =>
      parseLotivaEnv({
        NODE_ENV: "development",
        LOTIVA_STORE: "postgres",
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it("requires SESSION_SECRET in staging", () => {
    expect(() =>
      parseLotivaEnv({
        NODE_ENV: "staging",
        LOTIVA_STORE: "postgres",
        DATABASE_URL: "postgres://lotiva:lotiva@localhost:5432/lotiva",
        REQUIRE_REDIS_RATE_LIMIT: "true",
        EMBEDDING_BACKEND: "model",
      }),
    ).toThrow(/SESSION_SECRET/);
  });

  it("forbids VOICE_ENABLED without GEMINI_API_KEY in production", () => {
    expect(() =>
      parseLotivaEnv({
        ...prodBase,
        VOICE_ENABLED: "true",
      }),
    ).toThrow(/GEMINI_API_KEY/);
  });

  it("forbids stub embeddings in production without break-glass", () => {
    expect(() =>
      parseLotivaEnv({
        ...prodBase,
        EMBEDDING_BACKEND: "stub",
        EMBEDDING_ALLOW_STUB: "false",
      }),
    ).toThrow(/EMBEDDING_BACKEND=stub is forbidden/);
  });

  it("requires Redis rate limit in production", () => {
    expect(() =>
      parseLotivaEnv({
        ...prodBase,
        REQUIRE_REDIS_RATE_LIMIT: "false",
      }),
    ).toThrow(/REQUIRE_REDIS_RATE_LIMIT/);
  });

  it("accepts production-safe config", () => {
    const env = parseLotivaEnv(prodBase);
    expect(env.EMBEDDING_BACKEND).toBe("model");
    expect(env.REQUIRE_REDIS_RATE_LIMIT).toBe(true);
  });
});
