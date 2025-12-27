// ===========================================
// Node.js API - GitHub App Configuration
// ===========================================

import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";
import { env } from "./env";
import { logger } from "../utils/logger";

// Parse private key (handle both inline and file-based)
function parsePrivateKey(key: string): string {
  // Replace escaped newlines with actual newlines
  return key.replace(/\\n/g, "\n");
}

/**
 * Check if a string is a GitHub access token (user or app)
 * User tokens usually start with ghu_
 * OAuth tokens usually start with gho_
 */
export function isGitHubToken(code: string): boolean {
  return code.startsWith("ghu_") || code.startsWith("gho_");
}

// GitHub App instance
export const githubApp = new App({
  appId: env.GITHUB_APP_ID,
  privateKey: parsePrivateKey(env.GITHUB_APP_PRIVATE_KEY),
  webhooks: {
    secret: env.GITHUB_APP_WEBHOOK_SECRET,
  },
  oauth: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  },
});

// Get authenticated Octokit client for an installation
export async function getInstallationOctokit(installationId: number) {
  try {
    const octokit = await githubApp.getInstallationOctokit(installationId);
    return octokit;
  } catch (error) {
    logger.error(
      { error, installationId },
      "Failed to get installation Octokit"
    );
    throw error;
  }
}

// Get user Octokit with access token (for user-authenticated API calls)
export function getUserOctokit(
  accessToken: string
): InstanceType<typeof Octokit> {
  return new Octokit({
    auth: accessToken,
  });
}

// Exchange code for user access token
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}> {
  // If it's already a token, just return it
  if (isGitHubToken(code)) {
    logger.debug("Provided code is already a GitHub token, skipping exchange");
    return { accessToken: code };
  }

  const response = await githubApp.oauth.createToken({
    code,
  });

  return {
    accessToken: response.authentication.token,
    refreshToken: (response.authentication as any).refreshToken,
    expiresAt: (response.authentication as any).expiresAt
      ? new Date((response.authentication as any).expiresAt)
      : undefined,
  };
}

// Refresh user access token
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}> {
  const response = await githubApp.oauth.refreshToken({
    refreshToken,
  });

  return {
    accessToken: response.authentication.token,
    refreshToken: (response.authentication as any).refreshToken,
    expiresAt: (response.authentication as any).expiresAt
      ? new Date((response.authentication as any).expiresAt)
      : undefined,
  };
}

// Get authenticated user info
export async function getAuthenticatedUser(accessToken: string) {
  const octokit = getUserOctokit(accessToken);
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

// Get user's installations
export async function getUserInstallations(accessToken: string) {
  const octokit = getUserOctokit(accessToken);
  const { data } = await octokit.apps.listInstallationsForAuthenticatedUser();
  return data.installations;
}

// Get installation repositories
export async function getInstallationRepositories(installationId: number) {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await (
    octokit as any
  ).rest.apps.listReposAccessibleToInstallation();
  return data.repositories;
}

// Get pull request details
export async function getPullRequest(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number
) {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await (octokit as any).rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });
  return data;
}

// Get pull request diff
export async function getPullRequestDiff(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<string> {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await (octokit as any).rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
    mediaType: {
      format: "diff",
    },
  });
  return data as unknown as string;
}

// Post PR comment
export async function createPRComment(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
  commitId: string,
  path: string,
  line: number
) {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await (octokit as any).rest.pulls.createReviewComment({
    owner,
    repo,
    pull_number: pullNumber,
    body,
    commit_id: commitId,
    path,
    line,
    side: "RIGHT",
  });
  return data;
}

// Create PR review with comments
export async function createPRReview(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
  comments: Array<{
    path: string;
    line: number;
    body: string;
  }>,
  body?: string
) {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await (octokit as any).rest.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    event: "COMMENT",
    body,
    comments: comments.map((c) => ({
      ...c,
      side: "RIGHT" as const,
    })),
  });
  return data;
}
