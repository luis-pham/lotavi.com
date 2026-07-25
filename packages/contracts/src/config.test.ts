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
    expect(env.VOICE_TRANSPORT).toBe("off");
    expect(env.DIRECT_GEMINI_ENABLED).toBe(false);
  });

  it("forbids DIRECT_GEMINI_ENABLED in production", () => {
    expect(() =>
      parseLotivaEnv({
        ...prodBase,
        VOICE_ENABLED: "true",
        VOICE_TRANSPORT: "direct",
        DIRECT_GEMINI_ENABLED: "true",
        GEMINI_API_KEY: "test-key",
      }),
    ).toThrow(/DIRECT_GEMINI_ENABLED is forbidden/);
  });

  it("allows direct spike flags in development", () => {
    const env = parseLotivaEnv({
      NODE_ENV: "development",
      LOTIVA_STORE: "memory",
      ALLOW_MEMORY_STORE: "true",
      VOICE_ENABLED: "true",
      VOICE_TRANSPORT: "direct",
      DIRECT_GEMINI_ENABLED: "true",
      DIRECT_GEMINI_PROPERTY_ALLOWLIST: "prop-1",
      GEMINI_API_KEY: "dev-key",
    });
    expect(env.DIRECT_GEMINI_ENABLED).toBe(true);
    expect(env.VOICE_TRANSPORT).toBe("direct");
  });

  const stagingBase = {
    NODE_ENV: "staging" as const,
    LOTIVA_STORE: "postgres" as const,
    DATABASE_URL: "postgres://lotiva:lotiva@localhost:5432/lotiva",
    SESSION_SECRET: "x".repeat(32),
    REQUIRE_REDIS_RATE_LIMIT: "true",
    EMBEDDING_BACKEND: "model" as const,
    EMBEDDING_MODEL_ID: "google/embeddinggemma-300m",
  };

  it("requires staging acknowledgement for direct mode", () => {
    expect(() =>
      parseLotivaEnv({
        ...stagingBase,
        VOICE_ENABLED: "true",
        VOICE_TRANSPORT: "direct",
        DIRECT_GEMINI_ENABLED: "true",
        GEMINI_API_KEY: "staging-key",
        DIRECT_GEMINI_PROPERTY_ALLOWLIST: "prop-1",
        PUBLIC_WEB_URL: "https://staging.example.com",
        PUBLIC_API_URL: "https://api.staging.example.com",
      }),
    ).toThrow(/DIRECT_GEMINI_STAGING_ACKNOWLEDGED/);
  });

  it("requires HTTPS public URLs for staging direct mode", () => {
    expect(() =>
      parseLotivaEnv({
        ...stagingBase,
        VOICE_ENABLED: "true",
        VOICE_TRANSPORT: "direct",
        DIRECT_GEMINI_ENABLED: "true",
        DIRECT_GEMINI_STAGING_ACKNOWLEDGED: "true",
        GEMINI_API_KEY: "staging-key",
        DIRECT_GEMINI_PROPERTY_ALLOWLIST: "prop-1",
        PUBLIC_WEB_URL: "http://staging.example.com",
        PUBLIC_API_URL: "https://api.staging.example.com",
      }),
    ).toThrow(/PUBLIC_WEB_URL/);
  });

  it("accepts staging direct mode when all safety gates are set", () => {
    const env = parseLotivaEnv({
      ...stagingBase,
      VOICE_ENABLED: "true",
      VOICE_TRANSPORT: "direct",
      DIRECT_GEMINI_ENABLED: "true",
      DIRECT_GEMINI_STAGING_ACKNOWLEDGED: "true",
      GEMINI_API_KEY: "staging-key",
      DIRECT_GEMINI_PROPERTY_ALLOWLIST: "prop-1",
      PUBLIC_WEB_URL: "https://staging.example.com",
      PUBLIC_API_URL: "https://api.staging.example.com",
      VOICE_WRITE_TOOLS_ENABLED: "false",
      VOICE_RAG_TOOLS_ENABLED: "false",
    });
    expect(env.DIRECT_GEMINI_ENABLED).toBe(true);
    expect(env.DIRECT_GEMINI_STAGING_ACKNOWLEDGED).toBe(true);
  });

  it("forbids write/RAG tools flags when enabled", () => {
    expect(() =>
      parseLotivaEnv({
        NODE_ENV: "development",
        LOTIVA_STORE: "memory",
        ALLOW_MEMORY_STORE: "true",
        VOICE_WRITE_TOOLS_ENABLED: "true",
      }),
    ).toThrow(/VOICE_WRITE_TOOLS_ENABLED/);
    expect(() =>
      parseLotivaEnv({
        NODE_ENV: "development",
        LOTIVA_STORE: "memory",
        ALLOW_MEMORY_STORE: "true",
        VOICE_RAG_TOOLS_ENABLED: "true",
      }),
    ).toThrow(/VOICE_RAG_TOOLS_ENABLED/);
  });
});
