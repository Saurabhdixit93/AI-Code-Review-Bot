import { Router, Response, NextFunction } from "express";
import { Repository } from "../models/Repository";
import { Organization } from "../models/Organization";
import { PullRequest } from "../models/PullRequest";
import { Run } from "../models/Run";
import { User } from "../models/User";
import { Member } from "../models/Member";
import { addAnalysisJob, addRepoSyncJob } from "../config/redis";
import {
  captureRawBody,
  verifyWebhookSignature,
  logWebhook,
  WebhookRequest,
} from "../middleware/webhook";
import { logger } from "../utils/logger";
import {
  GitHubPullRequestWebhookPayload,
  GitHubInstallationWebhookPayload,
} from "../types";
import { RunMode } from "../types/enums";

const router = Router();

// Webhook endpoint - raw body parsing
router.post(
  "/github",
  captureRawBody,
  verifyWebhookSignature,
  logWebhook,
  async (req: WebhookRequest, res: Response, next: NextFunction) => {
    try {
      const event = req.webhookEvent;
      const delivery = req.webhookDelivery;

      // Acknowledge receipt immediately
      res.status(202).json({ received: true, delivery });

      // Process event asynchronously
      switch (event) {
        case "pull_request":
          await handlePullRequestEvent(
            req.body as GitHubPullRequestWebhookPayload
          );
          break;

        case "installation":
          await handleInstallationEvent(
            req.body as GitHubInstallationWebhookPayload
          );
          break;

        case "installation_repositories":
          await handleInstallationReposEvent(req.body);
          break;

        default:
          logger.debug({ event }, "Unhandled webhook event");
      }
    } catch (error) {
      // Log but don't fail - we already sent 202
      logger.error(
        { error, event: req.webhookEvent },
        "Error processing webhook"
      );
    }
  }
);

async function handlePullRequestEvent(
  payload: GitHubPullRequestWebhookPayload
): Promise<void> {
  const { action, pull_request: pr, repository } = payload;

  // Only process relevant actions
  if (
    !["opened", "synchronize", "reopened", "ready_for_review"].includes(action)
  ) {
    logger.debug({ action }, "Ignoring PR action");
    return;
  }

  // Skip draft PRs
  if (pr.draft) {
    logger.debug({ prNumber: pr.number }, "Skipping draft PR");
    return;
  }

  // Find repository in database
  const repo = await Repository.findOne({ githubRepoId: repository!.id });

  if (!repo) {
    logger.debug(
      { repoId: repository!.id },
      "Repository not found in database"
    );
    return;
  }

  if (!repo.isEnabled) {
    logger.debug({ repoId: repo._id }, "Repository not enabled");
    return;
  }

  // Get or create PR record
  let pullRequest = await PullRequest.findOneAndUpdate(
    { repoId: repo._id, prNumber: pr.number },
    {
      githubPrId: pr.id,
      title: pr.title,
      headSha: pr.head.sha,
      headRef: pr.head.ref,
      baseSha: pr.base.sha,
      baseRef: pr.base.ref,
      authorLogin: pr.user.login,
      authorId: pr.user.id,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      state: pr.state as any,
      isDraft: pr.draft,
      isFromFork: pr.head.repo?.id !== repository!.id,
      lastWebhookAt: new Date(),
    },
    { upsert: true, new: true }
  );

  if (!pullRequest) {
    throw new Error("Failed to upsert pull request");
  }

  // Check eligibility
  if (repo.config.runMode === RunMode.DISABLED) {
    logger.info({ prId: pullRequest._id }, "Run mode is disabled");
    return;
  }

  // Check PR size limits
  if (pr.changed_files > repo.config.maxPrFiles) {
    await createSkippedRun(
      pullRequest._id,
      "PR_TOO_LARGE",
      "Too many files changed"
    );
    return;
  }

  if (pr.additions + pr.deletions > repo.config.maxPrLines) {
    await createSkippedRun(
      pullRequest._id,
      "PR_TOO_LARGE",
      "Too many lines changed"
    );
    return;
  }

  // Create run and queue job
  const run = await Run.create({
    prId: pullRequest._id,
    status: "pending",
    runMode: repo.config.runMode,
    triggeredBy: "webhook",
    triggerEvent: { action, delivery: payload.action },
  });

  await addAnalysisJob({
    prId: pullRequest._id.toString(),
    repoId: repo._id.toString(),
    orgId: repo.orgId.toString(),
    prNumber: pr.number,
    headSha: pr.head.sha,
    baseSha: pr.base.sha,
    runMode: repo.config.runMode as any,
    triggeredBy: "webhook",
  });

  logger.info(
    {
      prId: pullRequest._id,
      runId: run._id,
      prNumber: pr.number,
      action,
    },
    "Analysis job queued"
  );
}

async function handleInstallationEvent(
  payload: GitHubInstallationWebhookPayload
): Promise<void> {
  const { action, installation } = payload;

  switch (action) {
    case "created":
      try {
        const { sender } = payload;
        const { account } = installation;
        const isOrg = (account as any).type === "Organization";

        // Create or update Organization
        const org = await Organization.findOneAndUpdate(
          { githubOrgId: account.id },
          {
            name: account.login, // GitHub API uses login as name often, or name if available. account in webhook is usually stripped. Use login as name/slug.
            slug: account.login,
            avatarUrl: account.avatar_url,
            installationId: installation.id,
            installationStatus: "active",
          },
          { upsert: true, new: true }
        );

        // Find user who installed it
        const user = await User.findOne({ githubUserId: sender.id });

        if (user) {
          // Add as owner
          await Member.findOneAndUpdate(
            { orgId: org._id, userId: user._id },
            { role: "owner", acceptedAt: new Date() },
            { upsert: true }
          );
        }

        // Queue sync
        await addRepoSyncJob({
          orgId: org._id.toString(),
          installationId: installation.id,
        });

        logger.info(
          {
            installationId: installation.id,
            orgId: org._id,
            userId: user?._id,
          },
          "GitHub App installed & Org created"
        );
      } catch (error) {
        logger.error(
          { error, installationId: installation.id },
          "Failed to create org on installation"
        );
      }
      break;

    case "deleted":
      // Mark organization as uninstalled
      await Organization.updateMany(
        { installationId: installation.id },
        { installationStatus: "deleted" }
      );
      logger.info(
        { installationId: installation.id },
        "GitHub App uninstalled"
      );
      break;

    case "suspend":
      await Organization.updateMany(
        { installationId: installation.id },
        { installationStatus: "suspended" }
      );
      break;

    case "unsuspend":
      await Organization.updateMany(
        { installationId: installation.id },
        { installationStatus: "active" }
      );
      break;
  }
}

async function handleInstallationReposEvent(payload: any): Promise<void> {
  const { action, installation, repositories_added, repositories_removed } =
    payload;

  const org = await Organization.findOne({
    installationId: installation.id,
  });

  if (!org) {
    return;
  }

  const orgId = org._id;

  if (repositories_added?.length > 0) {
    for (const repo of repositories_added) {
      await Repository.findOneAndUpdate(
        { githubRepoId: repo.id },
        {
          orgId,
          name: repo.name,
          fullName: repo.full_name,
          isPrivate: repo.private,
        },
        { upsert: true }
      );
    }
  }

  if (repositories_removed?.length > 0) {
    for (const repo of repositories_removed) {
      await Repository.deleteOne({ githubRepoId: repo.id });
    }
  }
}

async function createSkippedRun(
  prId: any,
  reason: string,
  message: string
): Promise<void> {
  await Run.create({
    prId,
    status: "skipped",
    reason: `${reason}: ${message}`,
    triggeredBy: "webhook",
  });
}

export default router;
