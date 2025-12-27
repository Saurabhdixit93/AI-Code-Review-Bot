// ===========================================
// Node.js API - RBAC Middleware
// ===========================================

import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { MemberRole, hasRole, hasPermission } from "../types";
import { Member } from "../models/Member";
import { Repository } from "../models/Repository";

export interface RBACRequest extends AuthenticatedRequest {
  orgId?: string;
  repoId?: string;
  memberRole?: MemberRole;
}

// Get user's role in an organization
async function getUserOrgRole(
  userId: string,
  orgId: string
): Promise<MemberRole | null> {
  const member = await Member.findOne({ userId, orgId });
  return member?.role || null;
}

// Require organization membership
export function requireOrgMember() {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const orgId = req.params.orgId || req.body.orgId;

    if (!userId) {
      return next(new ForbiddenError("Authentication required"));
    }

    if (!orgId) {
      return next(new ForbiddenError("Organization ID required"));
    }

    const role = await getUserOrgRole(userId, orgId);

    if (!role) {
      return next(new ForbiddenError("Not a member of this organization"));
    }

    req.orgId = orgId;
    req.memberRole = role;
    next();
  };
}

// Require minimum role in organization
export function requireRole(minimumRole: MemberRole) {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const orgId = req.params.orgId || req.body.orgId || req.orgId;

    if (!userId) {
      return next(new ForbiddenError("Authentication required"));
    }

    if (!orgId) {
      return next(new ForbiddenError("Organization ID required"));
    }

    const role = req.memberRole || (await getUserOrgRole(userId, orgId));

    if (!role) {
      return next(new ForbiddenError("Not a member of this organization"));
    }

    if (!hasRole(role, minimumRole)) {
      return next(new ForbiddenError(`Requires ${minimumRole} role or higher`));
    }

    req.orgId = orgId;
    req.memberRole = role;
    next();
  };
}

// Require permission for specific action and resource
export function requirePermission(action: string, resource: string) {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    const role = req.memberRole;

    if (!role) {
      return next(new ForbiddenError("Role not determined"));
    }

    if (!hasPermission(role, action, resource)) {
      return next(
        new ForbiddenError(`Permission denied: ${action} on ${resource}`)
      );
    }

    next();
  };
}

// Load repository and verify access
export function requireRepoAccess(writeAccess: boolean = false) {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const repoId = req.params.repoId || req.body.repoId;

    if (!userId || !repoId) {
      return next(new ForbiddenError("Missing required parameters"));
    }

    // Get repo and check org membership
    const repo = await Repository.findById(repoId);

    if (!repo) {
      return next(new NotFoundError("Repository"));
    }

    const orgId = repo.orgId.toString();
    const role = await getUserOrgRole(userId, orgId);

    if (!role) {
      return next(
        new ForbiddenError("Not a member of repository organization")
      );
    }

    if (writeAccess && !hasRole(role, "maintainer")) {
      return next(new ForbiddenError("Write access requires maintainer role"));
    }

    req.orgId = orgId;
    req.repoId = repoId;
    req.memberRole = role;
    next();
  };
}
