import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { Repository } from "../models/Repository";
import { PullRequest } from "../models/PullRequest";
import { Run } from "../models/Run";
import { authenticateToken } from "../middleware/auth";
import {
  requireOrgMember,
  requireRepoAccess,
  RBACRequest,
} from "../middleware/rbac";
import { createAuditLog } from "../middleware/audit";
import { NotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";
import { RunMode } from "../types/enums";

const router = Router();

// List repositories for an organization
router.get(
  "/org/:orgId",
  authenticateToken,
  requireOrgMember(),
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const { enabled, search, page = "1", limit = "20" } = req.query;

      const query: any = { orgId: req.params.orgId };

      if (enabled !== undefined) {
        query.isEnabled = enabled === "true";
      }

      if (search) {
        query.name = { $regex: search as string, $options: "i" };
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const repos = await Repository.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Repository.countDocuments(query);

      res.json({
        data: repos.map((r) => ({
          id: r._id,
          githubRepoId: r.githubRepoId,
          name: r.name,
          fullName: r.fullName,
          description: r.description,
          language: r.language,
          isPrivate: r.isPrivate,
          isEnabled: r.isEnabled,
          runMode: r.config.runMode,
          lastSyncedAt: r.lastSyncedAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get repository details with config
router.get(
  "/:repoId",
  authenticateToken,
  requireRepoAccess(),
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const repo = await Repository.findById(req.params.repoId);

      if (!repo) {
        throw new NotFoundError("Repository");
      }

      // Get recent runs stats
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const prs = await PullRequest.find({ repoId: repo._id }).select("_id");
      const prIds = prs.map((p) => p._id);

      const stats = await Run.aggregate([
        {
          $match: {
            prId: { $in: prIds },
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            totalRuns: { $sum: 1 },
            completedRuns: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            totalFindings: { $sum: "$findingsTotal" },
            avgDurationMs: { $avg: "$durationMs" },
          },
        },
      ]);

      const stat = stats[0] || {
        totalRuns: 0,
        completedRuns: 0,
        totalFindings: 0,
        avgDurationMs: 0,
      };

      res.json({
        id: repo._id,
        orgId: repo.orgId,
        githubRepoId: repo.githubRepoId,
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        defaultBranch: repo.defaultBranch,
        language: repo.language,
        isPrivate: repo.isPrivate,
        isEnabled: repo.isEnabled,
        lastSyncedAt: repo.lastSyncedAt,
        createdAt: repo.createdAt,
        config: {
          maxComments: repo.config.maxComments,
          minSeverity: repo.config.minSeverity,
          shadowMode: repo.config.shadowMode,
          runMode: repo.config.runMode,
          enableStatic: repo.config.enableStatic,
          enableAi: repo.config.enableAi,
          aiMode: repo.config.aiMode,
          excludedPaths: repo.config.excludedPaths,
          excludedFilePatterns: repo.config.excludedFilePatterns,
        },
        stats: {
          totalRuns: stat.totalRuns,
          completedRuns: stat.completedRuns,
          totalFindings: stat.totalFindings,
          avgDurationMs: Math.round(stat.avgDurationMs || 0),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Enable/disable repository
router.patch(
  "/:repoId/enable",
  authenticateToken,
  requireRepoAccess(true),
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);

      const repo = await Repository.findById(req.params.repoId);
      if (!repo) {
        throw new NotFoundError("Repository");
      }

      const beforeEnabled = repo.isEnabled;
      repo.isEnabled = enabled;
      await repo.save();

      await createAuditLog(req.userId, req.orgId, {
        action: (enabled ? "repo.enable" : "repo.disable") as any,
        entityType: "repository" as any,
        entityId: req.params.repoId,
        before: { isEnabled: beforeEnabled },
        after: { isEnabled: enabled },
      });

      logger.info(
        { repoId: req.params.repoId, enabled },
        "Repository enable status changed"
      );

      res.json({ success: true, isEnabled: enabled });
    } catch (error) {
      next(error);
    }
  }
);

// Update repository config
const updateConfigSchema = z.object({
  maxComments: z.number().int().min(0).max(50).optional(),
  minSeverity: z.enum(["block", "high", "medium", "low"]).optional(),
  shadowMode: z.boolean().optional(),
  runMode: z.enum(["active", "shadow", "disabled"]).optional(),
  enableStatic: z.boolean().optional(),
  enableAi: z.boolean().optional(),
  aiMode: z.enum(["balanced", "strict", "security", "performance"]).optional(),
  excludedPaths: z.array(z.string()).optional(),
  excludedFilePatterns: z.array(z.string()).optional(),
});

router.patch(
  "/:repoId/config",
  authenticateToken,
  requireRepoAccess(true),
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const updates = updateConfigSchema.parse(req.body);

      const repo = await Repository.findById(req.params.repoId);
      if (!repo) {
        throw new NotFoundError("Repository");
      }

      const beforeConfig = { ...repo.config };

      // Apply updates to nested config
      if (updates.maxComments !== undefined)
        repo.config.maxComments = updates.maxComments;
      if (updates.minSeverity !== undefined)
        repo.config.minSeverity = updates.minSeverity;
      if (updates.shadowMode !== undefined)
        repo.config.shadowMode = updates.shadowMode;
      if (updates.runMode !== undefined)
        repo.config.runMode = updates.runMode as RunMode;
      if (updates.enableStatic !== undefined)
        repo.config.enableStatic = updates.enableStatic;
      if (updates.enableAi !== undefined)
        repo.config.enableAi = updates.enableAi;
      if (updates.aiMode !== undefined)
        repo.config.aiMode = updates.aiMode as any;
      if (updates.excludedPaths !== undefined)
        repo.config.excludedPaths = updates.excludedPaths;
      if (updates.excludedFilePatterns !== undefined)
        repo.config.excludedFilePatterns = updates.excludedFilePatterns;

      await repo.save();

      await createAuditLog(req.userId, req.orgId, {
        action: "repo.config.update" as any,
        entityType: "repository" as any,
        entityId: req.params.repoId,
        before: beforeConfig,
        after: repo.config,
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
