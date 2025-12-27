// ===========================================
// Node.js API - Queue Service
// ===========================================

import { analysisQueue, repoSyncQueue } from "../config/redis";
import { logger } from "../utils/logger";

export interface AnalysisJobData {
  prId: string;
  repoId: string;
  orgId: string;
  prNumber: number;
  headSha: string;
  baseSha: string;
  runMode: "active" | "shadow" | "disabled";
  triggeredBy: string;
}

export interface RepoSyncJobData {
  orgId: string;
  installationId: number;
}

export async function queueAnalysisJob(data: AnalysisJobData): Promise<string> {
  const job = await analysisQueue.add("analysis", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  });

  logger.info({ jobId: job.id, prId: data.prId }, "Analysis job queued");
  return job.id!;
}

export async function queueRepoSyncJob(data: RepoSyncJobData): Promise<string> {
  const job = await repoSyncQueue.add("sync", data, {
    attempts: 2,
    removeOnComplete: 10,
  });

  logger.info({ jobId: job.id, orgId: data.orgId }, "Repo sync job queued");
  return job.id!;
}

export async function getJobStatus(
  queueName: string,
  jobId: string
): Promise<{
  status: string;
  progress?: number;
  error?: string;
}> {
  const queue = queueName === "analysis" ? analysisQueue : repoSyncQueue;
  const job = await queue.getJob(jobId);

  if (!job) {
    return { status: "not_found" };
  }

  const state = await job.getState();
  const failedReason = job.failedReason;

  return {
    status: state,
    progress: job.progress as number,
    error: failedReason,
  };
}

export async function cancelJob(
  queueName: string,
  jobId: string
): Promise<boolean> {
  const queue = queueName === "analysis" ? analysisQueue : repoSyncQueue;
  const job = await queue.getJob(jobId);

  if (!job) {
    return false;
  }

  await job.remove();
  return true;
}
