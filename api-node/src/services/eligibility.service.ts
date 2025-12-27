import { Repository } from "../models/Repository";
import { Run } from "../models/Run";
import { PullRequest } from "../models/PullRequest";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { RunMode } from "../types/enums";

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  skipReason?: string;
}

export interface PRContext {
  prId: string;
  repoId: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  isDraft: boolean;
  isFromFork: boolean;
  authorLogin: string;
}

export async function checkEligibility(
  context: PRContext
): Promise<EligibilityResult> {
  // Check draft status
  if (context.isDraft) {
    return { eligible: false, skipReason: "Draft PR - skipping analysis" };
  }

  // Check fork PRs (security concern)
  if (context.isFromFork) {
    logger.warn(
      { prId: context.prId },
      "Fork PR detected - running in shadow mode"
    );
  }

  // Get repo config
  const repo = await Repository.findById(context.repoId);

  if (!repo) {
    return { eligible: false, skipReason: "Repository not found" };
  }

  // Check if repo is enabled
  if (!repo.isEnabled) {
    return { eligible: false, skipReason: "Repository not enabled" };
  }

  // Check run mode
  if (repo.config.runMode === RunMode.DISABLED) {
    return { eligible: false, skipReason: "Run mode disabled" };
  }

  // Check PR size limits
  const maxFiles = repo.config.maxPrFiles || env.MAX_PR_FILES;
  const maxLines = repo.config.maxPrLines || env.MAX_PR_LINES;

  if (context.changedFiles > maxFiles) {
    return {
      eligible: false,
      skipReason: `PR too large: ${context.changedFiles} files exceeds limit of ${maxFiles}`,
    };
  }

  const totalLines = context.additions + context.deletions;
  if (totalLines > maxLines) {
    return {
      eligible: false,
      skipReason: `PR too large: ${totalLines} lines exceeds limit of ${maxLines}`,
    };
  }

  // Check for recent runs to avoid duplicates
  const fiveMinutesAgo = new Date();
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

  const recentRun = await Run.findOne({
    prId: context.prId,
    status: { $in: ["pending", "running"] },
    createdAt: { $gt: fiveMinutesAgo },
  });

  if (recentRun) {
    return { eligible: false, skipReason: "Recent run already in progress" };
  }

  return { eligible: true, reason: "All eligibility checks passed" };
}

export async function shouldRunAI(
  repoId: string,
  totalLines: number
): Promise<boolean> {
  const repo = await Repository.findById(repoId);

  if (!repo) {
    return true; // Default to enabled
  }

  if (!repo.config.enableAi) {
    return false;
  }

  // For very small diffs, skip AI to save cost
  if (totalLines < 5) {
    logger.debug({ repoId, totalLines }, "Skipping AI for trivial diff");
    return false;
  }

  return true;
}
