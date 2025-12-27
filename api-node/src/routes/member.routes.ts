import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { Member } from "../models/Member";
import { User } from "../models/User";
import { authenticateToken } from "../middleware/auth";
import { requireOrgMember, requireRole, RBACRequest } from "../middleware/rbac";
import { createAuditLog } from "../middleware/audit";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { MemberRole } from "../types/enums";

const router = Router();

// List organization members
router.get(
  "/org/:orgId",
  authenticateToken,
  requireOrgMember(),
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const members = await Member.find({ orgId: req.params.orgId })
        .populate("userId")
        .sort({ role: 1 }); // Mongoose sort by string role might need a custom weight if specific order is needed

      // Custom weight sorting for roles
      const roleWeights: Record<string, number> = {
        [MemberRole.OWNER]: 1,
        [MemberRole.MAINTAINER]: 2,
        [MemberRole.REVIEWER]: 3,
        [MemberRole.VIEWER]: 4,
      };

      const sortedMembers = members.sort((a: any, b: any) => {
        const weightA = roleWeights[a.role] || 99;
        const weightB = roleWeights[b.role] || 99;
        if (weightA !== weightB) return weightA - weightB;
        return (a.userId?.username || "").localeCompare(
          b.userId?.username || ""
        );
      });

      res.json(
        sortedMembers.map((m: any) => ({
          id: m._id,
          userId: m.userId?._id,
          username: m.userId?.username,
          email: m.userId?.email,
          avatarUrl: m.userId?.avatarUrl,
          role: m.role,
          createdAt: m.createdAt,
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

// Update member role
const updateRoleSchema = z.object({
  role: z.nativeEnum(MemberRole),
});

router.patch(
  "/:memberId/role",
  authenticateToken,
  requireRole(MemberRole.OWNER),
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const { role: newRole } = updateRoleSchema.parse(req.body);

      const member = await Member.findById(req.params.memberId);

      if (!member) {
        throw new NotFoundError("Member");
      }

      // Can't change own role
      if (member.userId.toString() === req.userId) {
        throw new BadRequestError("Cannot change your own role");
      }

      // If demoting an owner, ensure there's at least one other owner
      if (member.role === MemberRole.OWNER && newRole !== MemberRole.OWNER) {
        const ownerCount = await Member.countDocuments({
          orgId: member.orgId,
          role: MemberRole.OWNER,
        });

        if (ownerCount <= 1) {
          throw new BadRequestError(
            "Organization must have at least one owner"
          );
        }
      }

      const beforeRole = member.role;
      member.role = newRole as MemberRole;
      await member.save();

      await createAuditLog(req.userId, member.orgId.toString(), {
        action: "member.update_role" as any,
        entityType: "member" as any,
        entityId: req.params.memberId,
        before: { role: beforeRole },
        after: { role: newRole },
      });

      res.json({ success: true, role: newRole });
    } catch (error) {
      next(error);
    }
  }
);

// Remove member
router.delete(
  "/:memberId",
  authenticateToken,
  requireRole(MemberRole.OWNER),
  async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const member = await Member.findById(req.params.memberId);

      if (!member) {
        throw new NotFoundError("Member");
      }

      // Can't remove yourself
      if (member.userId.toString() === req.userId) {
        throw new BadRequestError("Cannot remove yourself from organization");
      }

      // Can't remove the last owner
      if (member.role === MemberRole.OWNER) {
        const ownerCount = await Member.countDocuments({
          orgId: member.orgId,
          role: MemberRole.OWNER,
        });

        if (ownerCount <= 1) {
          throw new BadRequestError("Cannot remove the last owner");
        }
      }

      const orgId = member.orgId.toString();
      const userId = member.userId.toString();
      const role = member.role;

      await Member.deleteOne({ _id: member._id });

      await createAuditLog(req.userId, orgId, {
        action: "member.remove" as any,
        entityType: "member" as any,
        entityId: req.params.memberId,
        before: { userId, role },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
