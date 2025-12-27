// ===========================================
// Node.js API - GitHub Types (Local Copy)
// ===========================================

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  email?: string;
  name?: string;
}

export interface GitHubOrganization {
  id: number;
  login: string;
  avatar_url: string;
  description?: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description?: string;
  default_branch: string;
  language?: string;
  owner: GitHubUser | GitHubOrganization;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: "open" | "closed";
  draft: boolean;
  head: {
    sha: string;
    ref: string;
    repo: GitHubRepository;
  };
  base: {
    sha: string;
    ref: string;
    repo: GitHubRepository;
  };
  user: GitHubUser;
  additions: number;
  deletions: number;
  changed_files: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
}

export interface GitHubFileDiff {
  filename: string;
  status:
    | "added"
    | "removed"
    | "modified"
    | "renamed"
    | "copied"
    | "changed"
    | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  hunks: GitHubDiffHunk[];
  previousFilename?: string;
}

export interface GitHubInstallation {
  id: number;
  account: GitHubUser | GitHubOrganization;
  repository_selection: "all" | "selected";
  permissions: Record<string, string>;
  events: string[];
}

export interface GitHubWebhookPayload {
  action: string;
  sender: GitHubUser;
  repository?: GitHubRepository;
  organization?: GitHubOrganization;
  installation?: { id: number };
}

export interface GitHubPullRequestWebhookPayload extends GitHubWebhookPayload {
  action:
    | "opened"
    | "synchronize"
    | "reopened"
    | "closed"
    | "edited"
    | "ready_for_review";
  number: number;
  pull_request: GitHubPullRequest;
}

export interface GitHubInstallationWebhookPayload extends GitHubWebhookPayload {
  action:
    | "created"
    | "deleted"
    | "suspend"
    | "unsuspend"
    | "new_permissions_accepted";
  installation: GitHubInstallation;
  repositories?: GitHubRepository[];
}
