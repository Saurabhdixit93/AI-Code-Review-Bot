import { Worker, Job } from "bullmq";
import { redis } from "../config/redis";
import { Repository } from "../models/Repository";
import { getInstallationRepositories } from "../config/github";
import { logger } from "../utils/logger";
import { createAuditLog } from "../middleware/audit";

interface RepoSyncJobData {
  orgId: string;
  installationId: number;
}

const syncWorker = new Worker<RepoSyncJobData>(
  "repo-sync-jobs",
  async (job: Job<RepoSyncJobData>) => {
    const { orgId, installationId } = job.data;

    logger.info(
      { orgId, installationId, jobId: job.id },
      "Starting repository sync"
    );

    try {
      // Fetch repos from GitHub
      const githubRepos = await getInstallationRepositories(installationId);

      const githubIds = new Set(githubRepos.map((r: { id: number }) => r.id));

      let added = 0;
      let updated = 0;
      let removed = 0;

      // Add/update repos
      for (const repo of githubRepos) {
        const updateData = {
          orgId,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || null,
          defaultBranch: repo.default_branch,
          language: repo.language || null,
          isPrivate: repo.private,
          lastSyncedAt: new Date(),
        };

        const result = await Repository.findOneAndUpdate(
          { githubRepoId: repo.id },
          updateData,
          { upsert: true, new: true, includeResultMetadata: true }
        );

        if (result?.lastErrorObject?.updatedExisting) {
          updated++;
        } else {
          added++;
        }
      }

      // Remove repos no longer in installation
      const deleteResult = await Repository.deleteMany({
        orgId,
        githubRepoId: { $nin: Array.from(githubIds) },
      });
      removed = deleteResult.deletedCount || 0;

      logger.info(
        { orgId, added, updated, removed, total: githubRepos.length },
        "Repository sync completed"
      );

      // Audit log
      await createAuditLog(undefined as any, orgId, {
        action: "repo.sync" as any,
        entityType: "organization" as any,
        entityId: orgId,
        metadata: { added, updated, removed, total: githubRepos.length },
      });

      return { added, updated, removed, total: githubRepos.length };
    } catch (error) {
      logger.error({ error, orgId }, "Repository sync failed");
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 2,
  }
);

syncWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Sync job completed");
});

syncWorker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, error: error.message }, "Sync job failed");
});

export { syncWorker };
