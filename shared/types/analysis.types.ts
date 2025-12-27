// ===========================================
// Shared Types - Analysis Types
// ===========================================

export type RunMode = "active" | "shadow" | "disabled";
export type RunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";
export type FindingSource = "static" | "ai";
export type FindingCategory =
  | "bug"
  | "security"
  | "perf"
  | "style"
  | "maintainability";
export type FindingSeverity = "block" | "high" | "medium" | "low";
export type FindingConfidence = "high" | "medium" | "low";
export type AIMode = "balanced" | "strict" | "security" | "performance";

export interface AnalysisJob {
  id: string;
  prId: string;
  repoId: string;
  orgId: string;
  prNumber: number;
  headSha: string;
  baseSha?: string;
  runMode: RunMode;
  config: RepoAnalysisConfig;
  createdAt: Date;
}

export interface RepoAnalysisConfig {
  maxComments: number;
  minSeverity: FindingSeverity;
  shadowMode: boolean;
  enableStatic: boolean;
  enableAi: boolean;
  aiMode: AIMode;
  aiModelOverride?: string;
  excludedPaths: string[];
  excludedFilePatterns: string[];
  maxFileSizeKb: number;
  maxPrFiles: number;
  maxPrLines: number;
  enabledRules: string[];
  disabledRules: string[];
}

export interface ParsedHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  additions: string[];
  deletions: string[];
  context: string[];
  rawContent: string;
}

export interface AnalyzedFile {
  path: string;
  language: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
  hunks: ParsedHunk[];
  content?: string;
  context?: string;
}

export interface Finding {
  id?: string;
  runId: string;
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  columnStart?: number;
  columnEnd?: number;
  source: FindingSource;
  category: FindingCategory;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  title: string;
  message: string;
  suggestion?: string;
  codeSnippet?: string;
  ruleId?: string;
  ruleName?: string;
  aiReasoning?: string;
  aiModel?: string;
  suppressed: boolean;
  suppressionReason?: string;
  fingerprint?: string;
}

export interface RunMetrics {
  filesAnalyzed: number;
  linesAnalyzed: number;
  hunksAnalyzed: number;
  findingsTotal: number;
  findingsStatic: number;
  findingsAi: number;
  findingsSuppressed: number;
  tokenCountInput: number;
  tokenCountOutput: number;
  tokenCost: number;
  durationMs: number;
}

export interface RunResult {
  id: string;
  prId: string;
  status: RunStatus;
  reason?: string;
  error?: string;
  findings: Finding[];
  metrics: RunMetrics;
  aiModelUsed?: string;
  aiTier?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface SkipReason {
  code: string;
  message: string;
}

export const SKIP_REASONS: Record<string, SkipReason> = {
  PR_TOO_LARGE: {
    code: "PR_TOO_LARGE",
    message: "Pull request exceeds maximum allowed files or lines",
  },
  ONLY_EXCLUDED_FILES: {
    code: "ONLY_EXCLUDED_FILES",
    message:
      "All changed files are in excluded paths or match excluded patterns",
  },
  BINARY_ONLY: {
    code: "BINARY_ONLY",
    message: "Pull request only contains binary file changes",
  },
  DRAFT_PR: {
    code: "DRAFT_PR",
    message: "Pull request is in draft state",
  },
  REPO_DISABLED: {
    code: "REPO_DISABLED",
    message: "Repository analysis is disabled",
  },
  BOT_PR: {
    code: "BOT_PR",
    message: "Pull request was created by a bot",
  },
  RATE_LIMITED: {
    code: "RATE_LIMITED",
    message: "Analysis rate limit exceeded",
  },
};
