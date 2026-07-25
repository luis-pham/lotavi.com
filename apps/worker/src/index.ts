import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { EmbeddingClient } from "@lotiva/infrastructure";
import { parseLotivaEnv } from "@lotiva/contracts";

const env = parseLotivaEnv(process.env);
const redisUrl = env.REDIS_URL;
const useMemory = env.LOTIVA_STORE === "memory";

if ((env.NODE_ENV === "production" || env.NODE_ENV === "staging") && useMemory) {
  console.error("[lotiva-worker] memory store forbidden in production/staging");
  process.exit(1);
}

async function runMemoryLoop() {
  if (!env.ALLOW_MEMORY_STORE && env.NODE_ENV !== "test") {
    throw new Error("Worker memory mode requires ALLOW_MEMORY_STORE=true");
  }
  const embedding = new EmbeddingClient(env.EMBEDDING_SERVICE_URL, "memory");
  console.log("[lotiva-worker] memory mode — hello-job only (dev/test)");
  const vectors = await embedding.embed(["lotiva hello job"]);
  console.log("[lotiva-worker] hello-job done", { dims: vectors[0]?.length });
}

async function runBullMq() {
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const queue = new Queue("lotiva-jobs", { connection });
  await queue.add(
    "hello-job",
    { at: new Date().toISOString() },
    { removeOnComplete: 100, attempts: 3, backoff: { type: "exponential", delay: 1000 } },
  );

  const embedding = new EmbeddingClient(env.EMBEDDING_SERVICE_URL, env.LOTIVA_STORE);
  const worker = new Worker(
    "lotiva-jobs",
    async (job) => {
      if (job.name === "hello-job" || job.name === "embed-chunk") {
        const texts = (job.data.texts as string[] | undefined) ?? ["hello"];
        const vectors = await embedding.embed(texts);
        return { dims: vectors[0]?.length ?? 0, jobId: job.id };
      }
      return { ok: true };
    },
    { connection },
  );

  worker.on("completed", (job) => {
    console.log("[lotiva-worker] completed", job.name, job.id);
  });
  worker.on("failed", (job, err) => {
    console.error("[lotiva-worker] failed", job?.name, err.message);
  });

  const shutdown = async () => {
    console.log("[lotiva-worker] graceful shutdown");
    await worker.close();
    await queue.close();
    await connection.quit();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());

  console.log("[lotiva-worker] BullMQ listening on lotiva-jobs");
}

if (useMemory) {
  void runMemoryLoop().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  void runBullMq().catch((err) => {
    console.error("[lotiva-worker] Redis/BullMQ failed — refusing memory fallback in non-dev", err);
    if (env.NODE_ENV === "development" && env.ALLOW_MEMORY_STORE) {
      console.warn("[lotiva-worker] explicit ALLOW_MEMORY_STORE — falling back for local only");
      void runMemoryLoop();
      return;
    }
    process.exit(1);
  });
}
