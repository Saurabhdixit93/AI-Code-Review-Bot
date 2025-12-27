// ===========================================
// Node.js API - GitHub Service
// ===========================================

import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { GitHubError } from "../utils/errors";

export async function syncRepositories(
  installationId: number,
  orgId: string
): Promise<{ added: number; updated: number; removed: number }> {
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.GITHUB_APP_ID,
      privateKey: env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
      installationId,
    },
  });

  try {
    const { data } =
      await octokit.apps.listInstallationReposForAuthenticatedUser({
        installation_id: installationId,
        per_page: 100,
      });

    logger.info(
      {
        installationId,
        repoCount: data.total_count,
      },
      "Fetched repositories from GitHub"
    );

    // Sync logic would be implemented here
    return { added: 0, updated: data.total_count, removed: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new GitHubError(`Failed to sync repositories: ${message}`);
  }
}

export async function verifyWebhookInstallation(
  installationId: number
): Promise<boolean> {
  try {
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: env.GITHUB_APP_ID,
        privateKey: env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
        installationId,
      },
    });

    const { data } = await octokit.apps.getInstallation({
      installation_id: installationId,
    });
    return data.suspended_at === null;
  } catch {
    return false;
  }
}
