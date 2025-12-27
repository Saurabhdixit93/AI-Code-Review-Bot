// ===========================================
// Node.js API - Redis Configuration
// ===========================================

import Redis from "ioredis";
import { Queue, Worker, QueueEvents } from "bullmq";
import { env } from "./env";
import { logger } from "../utils/logger";

// Redis connection
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    if (times > 10) {
      logger.error("Redis: max retries exceeded");
      return null;
    }
    return Math.min(times * 100, 3000);
  },
});

redis.on("connect", () => {
  logger.info("Redis: connected");
});

redis.on("error", (err) => {
  logger.error({ err }, "Redis: error");
});

// Queue names
export const QUEUE_NAMES = {
  ANALYSIS: "analysis-jobs",
  REPO_SYNC: "repo-sync-jobs",
  CLEANUP: "cleanup-jobs",
} as const;

// BullMQ connection options
const connectionOptions = {
  connection: redis,
};

// Analysis job queue
export const analysisQueue = new Queue(QUEUE_NAMES.ANALYSIS, {
  ...connectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 60 * 60, // 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60, // 7 days
    },
  },
});

// Repository sync queue
export const repoSyncQueue = new Queue(QUEUE_NAMES.REPO_SYNC, {
  ...connectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
  },
});

// Queue events for monitoring
export const analysisQueueEvents = new QueueEvents(
  QUEUE_NAMES.ANALYSIS,
  connectionOptions
);

analysisQueueEvents.on("completed", ({ jobId }) => {
  logger.info({ jobId }, "Analysis job completed");
});

analysisQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error({ jobId, failedReason }, "Analysis job failed");
});

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch (error) {
    logger.error({ error }, "Redis health check failed");
    return false;
  }
}

// Graceful shutdown
export async function closeRedisConnections(): Promise<void> {
  await analysisQueue.close();
  await repoSyncQueue.close();
  await analysisQueueEvents.close();
  await redis.quit();
  logger.info("Redis connections closed");
}

// Job data types
export interface AnalysisJobData {
  prId: string;
  repoId: string;
  orgId: string;
  prNumber: number;
  headSha: string;
  baseSha?: string;
  runMode: "active" | "shadow" | "disabled";
  triggeredBy: string;
}

export interface RepoSyncJobData {
  orgId: string;
  installationId: number;
}

// Add analysis job
export async function addAnalysisJob(data: AnalysisJobData): Promise<string> {
  const job = await analysisQueue.add("analyze-pr", data, {
    jobId: `pr-${data.prId}-${data.headSha}`,
  });
  logger.info({ jobId: job.id, prId: data.prId }, "Analysis job added");
  return job.id!;
}

// Add repo sync job
export async function addRepoSyncJob(data: RepoSyncJobData): Promise<string> {
  const job = await repoSyncQueue.add("sync-repos", data, {
    jobId: `sync-${data.orgId}-${Date.now()}`,
  });
  return job.id!;
}
