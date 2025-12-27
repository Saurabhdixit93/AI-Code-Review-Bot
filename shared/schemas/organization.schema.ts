import { z } from "zod";

// ===========================================
// Shared Schemas - Organization
// ===========================================

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  githubOrgId: z.number(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  avatarUrl: z.string().url().optional(),
  installationId: z.number().optional(),
  installationStatus: z
    .enum(["pending", "active", "suspended", "deleted"])
    .default("pending"),
  settings: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const CreateOrganizationSchema = OrganizationSchema.pick({
  githubOrgId: true,
  name: true,
  slug: true,
  avatarUrl: true,
  installationId: true,
});

export type CreateOrganization = z.infer<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = OrganizationSchema.pick({
  name: true,
  avatarUrl: true,
  installationId: true,
  installationStatus: true,
  settings: true,
}).partial();

export type UpdateOrganization = z.infer<typeof UpdateOrganizationSchema>;
