import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { Run } from "../models/Run";
import { PullRequest } from "../models/PullRequest";
import { Repository } from "../models/Repository";
import { Finding } from "../models/Finding";
import { authenticateToken } from "../middleware/auth";
import { requireOrgMember, RBACRequest } from "../middleware/rbac";
import { NotFoundError } from "../utils/errors";

const router = Router();

// List runs for an organization
router.get(
  "/org/:orgId",
  authenticateToken,
  requireOrgMember(),
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const { status, repoId, page = "1", limit = "20" } = req.query;

      // Find all repos for this org to filter PRs
      const repos = await Repository.find({ orgId: req.params.orgId }).select(
        "_id"
      );
      const repoIds = repos.map((r) => r._id);

      // Find all PRs for these repos
      const prQuery: any = { repoId: { $in: repoIds } };
      if (repoId) {
        prQuery.repoId = repoId;
      }
      const prs = await PullRequest.find(prQuery).select("_id");
      const prIds = prs.map((p) => p._id);

      const runQuery: any = { prId: { $in: prIds } };
      if (status) {
        runQuery.status = status;
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const runs = await Run.find(runQuery)
        .populate({
          path: "prId",
          populate: { path: "repoId" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Run.countDocuments(runQuery);

      res.json({
        data: runs.map((r: any) => ({
          id: r._id,
          prId: r.prId._id,
          prNumber: r.prId.prNumber,
          prTitle: r.prId.title,
          repoName: r.prId.repoId.name,
          repoId: r.prId.repoId._id,
          status: r.status,
          runMode: r.runMode,
          findingsTotal: r.findingsTotal,
          durationMs: r.durationMs,
          createdAt: r.createdAt,
          completedAt: r.completedAt,
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

// Get run details
router.get(
  "/:runId",
  authenticateToken,
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const run = await Run.findById(req.params.runId).populate({
        path: "prId",
        populate: { path: "repoId" },
      });

      if (!run) {
        throw new NotFoundError("Run");
      }

      const r = run as any;

      res.json({
        id: r._id,
        prId: r.prId._id,
        prNumber: r.prId.prNumber,
        prTitle: r.prId.title,
        repoId: r.prId.repoId._id,
        repoName: r.prId.repoId.name,
        orgId: r.prId.repoId.orgId,
        status: r.status,
        reason: r.reason,
        error: r.error,
        runMode: r.runMode,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        durationMs: r.durationMs,
        metrics: {
          tokenCountInput: r.tokenCountInput,
          tokenCountOutput: r.tokenCountOutput,
          tokenCost: r.tokenCost,
          filesAnalyzed: r.filesAnalyzed,
          linesAnalyzed: r.linesAnalyzed,
          hunksAnalyzed: r.hunksAnalyzed,
        },
        findings: {
          total: r.findingsTotal,
          static: r.findingsStatic,
          ai: r.findingsAi,
          suppressed: r.findingsSuppressed,
        },
        aiModelUsed: r.aiModelUsed,
        createdAt: r.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get findings for a run
router.get(
  "/:runId/findings",
  authenticateToken,
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const {
        severity,
        category,
        source,
        suppressed,
        page = "1",
        limit = "50",
      } = req.query;

      const query: any = { runId: req.params.runId };

      if (severity) query.severity = severity;
      if (category) query.category = category;
      if (source) query.source = source;
      if (suppressed !== undefined) query.suppressed = suppressed === "true";

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Severity weights for sorting
      const severityOrder = { block: 1, high: 2, medium: 3, low: 4 };

      const findings = await Finding.find(query)
        .sort({ severity: 1, filePath: 1, lineStart: 1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Finding.countDocuments(query);

      res.json({
        data: findings.map((f) => ({
          id: f._id,
          filePath: f.filePath,
          lineStart: f.lineStart,
          lineEnd: f.lineEnd,
          source: f.source,
          category: f.category,
          severity: f.severity,
          confidence: f.confidence,
          title: f.title,
          message: f.message,
          suggestion: f.suggestion,
          ruleId: f.ruleId,
          suppressed: f.suppressed,
          createdAt: f.createdAt,
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

export default router;
