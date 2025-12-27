export enum MemberRole {
  OWNER = "owner",
  MAINTAINER = "maintainer",
  REVIEWER = "reviewer",
  VIEWER = "viewer",
}

export enum RunMode {
  ACTIVE = "active",
  SHADOW = "shadow",
  DISABLED = "disabled",
}

export enum RunStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  SKIPPED = "skipped",
}

export enum FindingSource {
  STATIC = "static",
  AI = "ai",
}

export enum FindingCategory {
  BUG = "bug",
  SECURITY = "security",
  PERF = "perf",
  STYLE = "style",
  MAINTAINABILITY = "maintainability",
}

export enum FindingSeverity {
  BLOCK = "block",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum FindingConfidence {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum AiMode {
  BALANCED = "balanced",
  STRICT = "strict",
  SECURITY = "security",
  PERFORMANCE = "performance",
}
