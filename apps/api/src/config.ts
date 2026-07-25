import { parseLotivaEnv, type LotivaEnv } from "@lotiva/contracts";

let cached: LotivaEnv | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): LotivaEnv {
  cached = parseLotivaEnv(env);
  return cached;
}

export function getConfig(): LotivaEnv {
  if (!cached) return loadConfig();
  return cached;
}

export function isDevLike(env: LotivaEnv = getConfig()): boolean {
  return env.NODE_ENV === "development" || env.NODE_ENV === "test";
}
