// ===========================================
// Node.js API - Audit Types (Local Copy)
// ===========================================

export type AuditAction =
  // Organization actions
  | "org.create"
  | "org.update"
  | "org.delete"
  // Repository actions
  | "repo.enable"
  | "repo.disable"
  | "repo.config.update"
  | "repo.sync"
  // Member actions
  | "member.invite"
  | "member.accept"
  | "member.update_role"
  | "member.remove"
  // Run actions
  | "run.start"
  | "run.complete"
  | "run.fail"
  | "run.skip"
  // Finding actions
  | "finding.suppress"
  | "finding.unsuppress"
  // Auth actions
  | "auth.login"
  | "auth.logout"
  // Installation actions
  | "installation.create"
  | "installation.suspend"
  | "installation.unsuspend"
  | "installation.delete";

export type AuditEntityType =
  | "organization"
  | "repository"
  | "member"
  | "user"
  | "run"
  | "finding"
  | "repo_config"
  | "installation";
