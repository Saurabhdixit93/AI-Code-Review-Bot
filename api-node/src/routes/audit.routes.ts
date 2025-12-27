import { Router, Response, NextFunction } from "express";
import { AuditLog } from "../models/AuditLog";
import { authenticateToken } from "../middleware/auth";
import { requireRole, RBACRequest } from "../middleware/rbac";
import { MemberRole } from "../types/enums";

const router = Router();

// List audit logs for an organization
router.get(
  "/org/:orgId",
  authenticateToken,
  requireRole(MemberRole.MAINTAINER),
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const {
        action,
        entityType,
        actorUserId,
        startDate,
        endDate,
        page = "1",
        limit = "50",
      } = req.query;

      const query: any = { orgId: req.params.orgId };

      if (action) query.action = action;
      if (entityType) query.entityType = entityType;
      if (actorUserId) query.actorUserId = actorUserId;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const logs = await AuditLog.find(query)
        .populate("actorUserId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await AuditLog.countDocuments(query);

      res.json({
        data: logs.map((a: any) => ({
          id: a._id,
          actorUserId: a.actorUserId?._id,
          actorUsername: a.actorUserId?.username,
          actorType: a.actorType,
          action: a.action,
          entityType: a.entityType,
          entityId: a.entityId,
          before: a.before,
          after: a.after,
          metadata: a.metadata,
          ipAddress: a.ipAddress,
          createdAt: a.createdAt,
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

// Get available audit actions for filtering
router.get("/actions", authenticateToken, (req: RBACRequest, res: Response) => {
  res.json([
    "org.create",
    "org.update",
    "org.delete",
    "repo.enable",
    "repo.disable",
    "repo.config.update",
    "repo.sync",
    "member.invite",
    "member.accept",
    "member.update_role",
    "member.remove",
    "run.start",
    "run.complete",
    "run.fail",
    "run.skip",
    "finding.suppress",
    "finding.unsuppress",
    "auth.login",
    "auth.logout",
    "installation.create",
    "installation.suspend",
    "installation.unsuspend",
    "installation.delete",
  ]);
});

export default router;
