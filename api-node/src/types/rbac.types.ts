// ===========================================
// Node.js API - RBAC Types (Local Copy)
// ===========================================

// Import MemberRole from express.types for local use
import { MemberRole } from "./express.types";

export const ROLE_HIERARCHY: Record<MemberRole, number> = {
  owner: 4,
  maintainer: 3,
  reviewer: 2,
  viewer: 1,
};

export interface Permission {
  action: string;
  resource: string;
}

export const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  owner: [{ action: "*", resource: "*" }],
  maintainer: [
    { action: "read", resource: "*" },
    { action: "write", resource: "repository" },
    { action: "write", resource: "repo_config" },
    { action: "read", resource: "member" },
    { action: "read", resource: "audit_log" },
  ],
  reviewer: [
    { action: "read", resource: "repository" },
    { action: "read", resource: "pull_request" },
    { action: "read", resource: "run" },
    { action: "read", resource: "finding" },
  ],
  viewer: [
    { action: "read", resource: "repository" },
    { action: "read", resource: "run" },
  ],
};

export function hasRole(
  userRole: MemberRole,
  requiredRole: MemberRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function hasPermission(
  userRole: MemberRole,
  action: string,
  resource: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.some(
    (p) =>
      (p.action === "*" || p.action === action) &&
      (p.resource === "*" || p.resource === resource)
  );
}

// Import AuthenticatedUser from express.types for local use
import { AuthenticatedUser } from "./express.types";

export interface OrganizationMembership {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: MemberRole;
}

export interface AuthContext {
  user: AuthenticatedUser;
  memberships: OrganizationMembership[];
  currentOrgId?: string;
  currentRole?: MemberRole;
}
