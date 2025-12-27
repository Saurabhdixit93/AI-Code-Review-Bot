// ===========================================
// Next.js - API Client
// ===========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.error?.message || "Request failed",
      response.status,
      error.error?.code || "UNKNOWN_ERROR"
    );
  }
  return response.json();
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  console.log(
    `apiClient: Calling ${options.method || "GET"} ${API_BASE_URL}${endpoint}`
  );

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return handleResponse<T>(response);
}

// Auth API
export const authApi = {
  callback: (code: string) =>
    apiClient<{ token: string; user: User; installations: Installation[] }>(
      "/api/auth/callback",
      { method: "POST", body: JSON.stringify({ code }) }
    ),

  me: (token: string) => apiClient<User>("/api/auth/me", {}, token),

  organizations: (token: string) =>
    apiClient<Organization[]>("/api/auth/me/organizations", {}, token),
};

// Organizations API
export const orgsApi = {
  list: (token: string) =>
    apiClient<Organization[]>("/api/organizations", {}, token),

  get: (token: string, orgId: string) =>
    apiClient<OrganizationDetails>(`/api/organizations/${orgId}`, {}, token),

  create: (token: string, data: CreateOrgData) =>
    apiClient<{ id: string }>(
      "/api/organizations",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),

  sync: (token: string, orgId: string) =>
    apiClient<{ status: string }>(
      `/api/organizations/${orgId}/sync`,
      {
        method: "POST",
      },
      token
    ),
};

// Repositories API
export const reposApi = {
  list: (token: string, orgId: string, params?: RepoListParams) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<PaginatedResponse<Repository>>(
      `/api/repositories/org/${orgId}?${query}`,
      {},
      token
    );
  },

  get: (token: string, repoId: string) =>
    apiClient<RepositoryDetails>(`/api/repositories/${repoId}`, {}, token),

  enable: (token: string, repoId: string, enabled: boolean) =>
    apiClient<{ success: boolean; isEnabled: boolean }>(
      `/api/repositories/${repoId}/enable`,
      { method: "PATCH", body: JSON.stringify({ enabled }) },
      token
    ),

  updateConfig: (token: string, repoId: string, config: Partial<RepoConfig>) =>
    apiClient<{ success: boolean }>(
      `/api/repositories/${repoId}/config`,
      { method: "PATCH", body: JSON.stringify(config) },
      token
    ),
};

// Runs API
export const runsApi = {
  list: (token: string, orgId: string, params?: RunListParams) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<PaginatedResponse<Run>>(
      `/api/runs/org/${orgId}?${query}`,
      {},
      token
    );
  },

  get: (token: string, runId: string) =>
    apiClient<RunDetails>(`/api/runs/${runId}`, {}, token),

  findings: (token: string, runId: string, params?: FindingListParams) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<PaginatedResponse<Finding>>(
      `/api/runs/${runId}/findings?${query}`,
      {},
      token
    );
  },
};

// Members API
export const membersApi = {
  list: (token: string, orgId: string) =>
    apiClient<Member[]>(`/api/members/org/${orgId}`, {}, token),

  updateRole: (token: string, memberId: string, role: string) =>
    apiClient<{ success: boolean; role: string }>(
      `/api/members/${memberId}/role`,
      { method: "PATCH", body: JSON.stringify({ role }) },
      token
    ),

  remove: (token: string, memberId: string) =>
    apiClient<{ success: boolean }>(
      `/api/members/${memberId}`,
      { method: "DELETE" },
      token
    ),
};

// Audit API
export const auditApi = {
  list: (token: string, orgId: string, params?: AuditListParams) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<PaginatedResponse<AuditLog>>(
      `/api/audit/org/${orgId}?${query}`,
      {},
      token
    );
  },
};

// Types
export interface User {
  id: string;
  githubUserId: number;
  username: string;
  email?: string;
  avatarUrl?: string;
}

export interface Installation {
  id: number;
  account: {
    id: number;
    login: string;
    type: string;
    avatarUrl: string;
  };
}

export interface Organization {
  id: string;
  githubOrgId: number;
  name: string;
  slug: string;
  avatarUrl?: string;
  role: string;
  repoCount?: number;
}

export interface OrganizationDetails extends Organization {
  installationId: number;
  installationStatus: string;
  stats: {
    repoCount: number;
    enabledRepoCount: number;
    memberCount: number;
    runCount: number;
  };
}

export interface CreateOrgData {
  installationId: number;
  githubOrgId: number;
  name: string;
  slug: string;
  avatarUrl?: string;
}

export interface Repository {
  id: string;
  githubRepoId: number;
  name: string;
  fullName: string;
  description?: string;
  language?: string;
  isPrivate: boolean;
  isEnabled: boolean;
  runMode: string;
}

export interface RepositoryDetails extends Repository {
  config: RepoConfig;
  stats: {
    totalRuns: number;
    completedRuns: number;
    totalFindings: number;
  };
}

export interface RepoConfig {
  maxComments: number;
  minSeverity: string;
  shadowMode: boolean;
  runMode: string;
  enableStatic: boolean;
  enableAi: boolean;
  aiMode: string;
  excludedPaths: string[];
}

export interface Run {
  id: string;
  prId: string;
  prNumber: number;
  prTitle: string;
  repoName: string;
  repoFullName: string;
  orgId: string;
  status: string;
  runMode: string;
  findingsTotal: number;
  durationMs?: number;
  createdAt: string;
}

export interface RunDetails extends Run {
  filesAnalyzed?: number;
  error?: string;
  reason?: string;
  metrics: {
    filesAnalyzed: number;
    linesAnalyzed: number;
    tokenCost: number;
  };
  findings: {
    total: number;
    static: number;
    ai: number;
    suppressed: number;
  };
}

export interface Finding {
  id: string;
  filePath: string;
  lineStart?: number;
  source: string;
  category: string;
  severity: string;
  confidence: string;
  title: string;
  message: string;
  suggestion?: string;
  codeSnippet?: string;
  ruleId?: string;
  aiModel?: string;
  suppressed: boolean;
}

export interface Member {
  id: string;
  userId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  role: string;
}

export interface AuditLog {
  id: string;
  actorUsername?: string;
  actorAvatarUrl?: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RepoListParams {
  enabled?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export interface RunListParams {
  status?: string;
  repoId?: string;
  page?: string;
  limit?: string;
}

export interface FindingListParams {
  severity?: string;
  category?: string;
  source?: string;
  suppressed?: string;
  page?: string;
  limit?: string;
}

export interface AuditListParams {
  action?: string;
  entityType?: string;
  page?: string;
  limit?: string;
}
