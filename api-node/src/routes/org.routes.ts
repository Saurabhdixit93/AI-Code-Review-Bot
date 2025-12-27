import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { Organization } from "../models/Organization";
import { Member } from "../models/Member";
import { Repository } from "../models/Repository";
import { PullRequest } from "../models/PullRequest";
import { Run } from "../models/Run";
import { addRepoSyncJob } from "../config/redis";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { requireOrgMember, requireRole, RBACRequest } from "../middleware/rbac";
import { createAuditLog } from "../middleware/audit";
import { NotFoundError, ConflictError } from "../utils/errors";
import { logger } from "../utils/logger";
import { MemberRole } from "../types/enums";

const router = Router();

// Create organization from GitHub installation
const createOrgSchema = z.object({
  installationId: z.number(),
  githubOrgId: z.number(),
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/),
  avatarUrl: z.string().url().optional(),
});

router.post(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = createOrgSchema.parse(req.body);

      // Check if org already exists
      const existing = await Organization.findOne({
        githubOrgId: data.githubOrgId,
      });

      if (existing) {
        throw new ConflictError("Organization already exists");
      }

      // Create org and add user as owner
      const org = await Organization.create({
        githubOrgId: data.githubOrgId,
        name: data.name,
        slug: data.slug,
        avatarUrl: data.avatarUrl,
        installationId: data.installationId,
        installationStatus: "active",
      });

      const orgId = org._id;

      // Add creator as owner
      await Member.create({
        orgId,
        userId: req.userId,
        role: MemberRole.OWNER,
        acceptedAt: new Date(),
      });

      // Queue repository sync
      await addRepoSyncJob({
        orgId: orgId.toString(),
        installationId: data.installationId,
      });

      await createAuditLog(req.userId, orgId.toString(), {
        action: "org.create" as any,
        entityType: "organization" as any,
        entityId: orgId.toString(),
        after: { name: data.name, slug: data.slug },
      });

      logger.info(
        { orgId: orgId.toString(), userId: req.userId },
        "Organization created"
      );

      res.status(201).json({ id: orgId });
    } catch (error) {
      next(error);
    }
  }
);

// List organizations for current user
router.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const memberships = await Member.find({ userId: req.userId })
        .populate("orgId")
        .sort({ "orgId.name": 1 });

      const orgsWithStats = await Promise.all(
        memberships.map(async (m: any) => {
          const repoCount = await Repository.countDocuments({
            orgId: m.orgId._id,
          });
          return {
            id: m.orgId._id,
            githubOrgId: m.orgId.githubOrgId,
            name: m.orgId.name,
            slug: m.orgId.slug,
            avatarUrl: m.orgId.avatarUrl,
            installationStatus: m.orgId.installationStatus,
            role: m.role,
            repoCount,
          };
        })
      );

      res.json(orgsWithStats);
    } catch (error) {
      next(error);
    }
  }
);

// Get organization details
router.get(
  "/:orgId",
  authenticateToken,
  requireOrgMember(),
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const org = await Organization.findById(req.params.orgId);

      if (!org) {
        throw new NotFoundError("Organization");
      }

      // Get stats
      const repoCount = await Repository.countDocuments({ orgId: org._id });
      const enabledRepoCount = await Repository.countDocuments({
        orgId: org._id,
        isEnabled: true,
      });
      const memberCount = await Member.countDocuments({ orgId: org._id });

      // Count runs across all repositories of this org
      const repos = await Repository.find({ orgId: org._id }).select("_id");
      const repoIds = repos.map((r) => r._id);

      const prs = await PullRequest.find({ repoId: { $in: repoIds } }).select(
        "_id"
      );
      const prIds = prs.map((p) => p._id);

      const runCount = await Run.countDocuments({ prId: { $in: prIds } });

      res.json({
        id: org._id,
        githubOrgId: org.githubOrgId,
        name: org.name,
        slug: org.slug,
        avatarUrl: org.avatarUrl,
        installationId: org.installationId,
        installationStatus: org.installationStatus,
        settings: org.settings,
        createdAt: org.createdAt,
        role: req.memberRole,
        stats: {
          repoCount,
          enabledRepoCount,
          memberCount,
          runCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Sync repositories from GitHub
router.post(
  "/:orgId/sync",
  authenticateToken,
  requireRole("maintainer"),
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const org = await Organization.findById(req.params.orgId);

      if (!org || !org.installationId) {
        throw new NotFoundError("Organization or installation");
      }

      await addRepoSyncJob({
        orgId: req.params.orgId,
        installationId: org.installationId,
      });

      await createAuditLog(req.userId, req.orgId, {
        action: "repo.sync" as any,
        entityType: "organization" as any,
        entityId: req.params.orgId,
      });

      res.json({ status: "queued" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
