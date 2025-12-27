import { z } from "zod";

// ===========================================
// Shared Schemas - Audit Log
// ===========================================

export const AuditActionSchema = z.enum([
  // Organization actions
  "org.create",
  "org.update",
  "org.delete",

  // Repository actions
  "repo.enable",
  "repo.disable",
  "repo.config.update",
  "repo.sync",

  // Member actions
  "member.invite",
  "member.accept",
  "member.update_role",
  "member.remove",

  // Run actions
  "run.start",
  "run.complete",
  "run.fail",
  "run.skip",

  // Finding actions
  "finding.suppress",
  "finding.unsuppress",

  // Auth actions
  "auth.login",
  "auth.logout",

  // Installation actions
  "installation.create",
  "installation.suspend",
  "installation.unsuspend",
  "installation.delete",
]);

export type AuditAction = z.infer<typeof AuditActionSchema>;

export const AuditEntityTypeSchema = z.enum([
  "organization",
  "repository",
  "member",
  "user",
  "run",
  "finding",
  "repo_config",
  "installation",
]);

export type AuditEntityType = z.infer<typeof AuditEntityTypeSchema>;

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  actorUserId: z.string().uuid().optional(),
  actorType: z.enum(["user", "system", "webhook"]).default("user"),
  orgId: z.string().uuid().optional(),
  action: AuditActionSchema,
  entityType: AuditEntityTypeSchema,
  entityId: z.string().uuid().optional(),
  before: z.record(z.unknown()).optional(),
  after: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).default({}),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  requestId: z.string().optional(),
  createdAt: z.date(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export const CreateAuditLogSchema = AuditLogSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateAuditLog = z.infer<typeof CreateAuditLogSchema>;

export const AuditLogQuerySchema = z.object({
  orgId: z.string().uuid().optional(),
  actorUserId: z.string().uuid().optional(),
  action: AuditActionSchema.optional(),
  entityType: AuditEntityTypeSchema.optional(),
  entityId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;
