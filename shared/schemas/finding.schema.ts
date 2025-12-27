import { z } from "zod";

// ===========================================
// Shared Schemas - Finding
// ===========================================

export const FindingSeveritySchema = z.enum(["block", "high", "medium", "low"]);
export const FindingConfidenceSchema = z.enum(["high", "medium", "low"]);
export const FindingCategorySchema = z.enum([
  "bug",
  "security",
  "perf",
  "style",
  "maintainability",
]);
export const FindingSourceSchema = z.enum(["static", "ai"]);

export const FindingSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  filePath: z.string().min(1),
  lineStart: z.number().int().positive().optional(),
  lineEnd: z.number().int().positive().optional(),
  columnStart: z.number().int().positive().optional(),
  columnEnd: z.number().int().positive().optional(),
  source: FindingSourceSchema,
  category: FindingCategorySchema,
  severity: FindingSeveritySchema,
  confidence: FindingConfidenceSchema,
  title: z.string().min(1).max(500),
  message: z.string().min(1),
  suggestion: z.string().optional(),
  codeSnippet: z.string().optional(),
  ruleId: z.string().optional(),
  ruleName: z.string().optional(),
  aiReasoning: z.string().optional(),
  aiModel: z.string().optional(),
  suppressed: z.boolean().default(false),
  suppressionReason: z.string().optional(),
  fingerprint: z.string().optional(),
  duplicateOf: z.string().uuid().optional(),
  githubCommentId: z.number().optional(),
  postedAt: z.date().optional(),
  createdAt: z.date(),
});

export type Finding = z.infer<typeof FindingSchema>;

export const CreateFindingSchema = FindingSchema.omit({
  id: true,
  createdAt: true,
  fingerprint: true,
  githubCommentId: true,
  postedAt: true,
});

export type CreateFinding = z.infer<typeof CreateFindingSchema>;

export const RunStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
]);

export const RunSchema = z.object({
  id: z.string().uuid(),
  prId: z.string().uuid(),
  status: RunStatusSchema,
  reason: z.string().optional(),
  error: z.string().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  durationMs: z.number().int().optional(),
  tokenCountInput: z.number().int().default(0),
  tokenCountOutput: z.number().int().default(0),
  tokenCost: z.number().default(0),
  filesAnalyzed: z.number().int().default(0),
  linesAnalyzed: z.number().int().default(0),
  hunksAnalyzed: z.number().int().default(0),
  findingsTotal: z.number().int().default(0),
  findingsStatic: z.number().int().default(0),
  findingsAi: z.number().int().default(0),
  findingsSuppressed: z.number().int().default(0),
  aiModelUsed: z.string().optional(),
  aiTier: z.string().optional(),
  runMode: z.enum(["active", "shadow", "disabled"]),
  triggeredBy: z.string().optional(),
  triggerEvent: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Run = z.infer<typeof RunSchema>;
