import { z } from "zod";

// ===========================================
// Shared Schemas - Repository
// ===========================================

export const RepositorySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  githubRepoId: z.number(),
  name: z.string().min(1).max(255),
  fullName: z.string().min(1).max(512),
  description: z.string().optional(),
  defaultBranch: z.string().default("main"),
  language: z.string().optional(),
  isPrivate: z.boolean().default(false),
  isEnabled: z.boolean().default(false),
  webhookId: z.number().optional(),
  lastSyncedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Repository = z.infer<typeof RepositorySchema>;

export const RepoConfigSchema = z.object({
  repoId: z.string().uuid(),
  maxComments: z.number().int().min(0).max(50).default(10),
  minSeverity: z.enum(["block", "high", "medium", "low"]).default("low"),
  shadowMode: z.boolean().default(true),
  runMode: z.enum(["active", "shadow", "disabled"]).default("shadow"),
  enableStatic: z.boolean().default(true),
  enableAi: z.boolean().default(true),
  aiMode: z
    .enum(["balanced", "strict", "security", "performance"])
    .default("balanced"),
  aiModelOverride: z.string().optional(),
  excludedPaths: z.array(z.string()).default([]),
  excludedFilePatterns: z
    .array(z.string())
    .default([
      "*.lock",
      "*.min.js",
      "*.min.css",
      "package-lock.json",
      "yarn.lock",
    ]),
  maxFileSizeKb: z.number().int().min(1).max(10000).default(500),
  maxPrFiles: z.number().int().min(1).max(500).default(100),
  maxPrLines: z.number().int().min(1).max(50000).default(5000),
  enabledRules: z.array(z.string()).default([]),
  disabledRules: z.array(z.string()).default([]),
  customRules: z.array(z.record(z.unknown())).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RepoConfig = z.infer<typeof RepoConfigSchema>;

export const UpdateRepoConfigSchema = RepoConfigSchema.omit({
  repoId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type UpdateRepoConfig = z.infer<typeof UpdateRepoConfigSchema>;
