// ===========================================
// Node.js API - Audit Middleware
// ===========================================

import { Response, NextFunction } from "express";
import { RBACRequest } from "./rbac";
import { AuditLog } from "../models/AuditLog";
import { logger } from "../utils/logger";
import { AuditAction, AuditEntityType } from "../types";

export interface AuditContext {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Create audit log entry
export async function createAuditLog(
  userId: string | undefined,
  orgId: string | undefined,
  context: AuditContext,
  request?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }
): Promise<void> {
  try {
    await AuditLog.create({
      userId: userId || undefined,
      orgId: orgId || undefined,
      action: context.action,
      resourceType: context.entityType,
      resourceId: context.entityId,
      metadata: {
        ...context.metadata,
        before: context.before,
        after: context.after,
        requestId: request?.requestId,
      },
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
    });

    logger.debug(
      {
        userId,
        orgId,
        action: context.action,
        entityType: context.entityType,
        entityId: context.entityId,
      },
      "Audit log created"
    );
  } catch (error) {
    // Don't fail the request if audit logging fails
    logger.error({ error, context }, "Failed to create audit log");
  }
}

// Middleware factory for automatic audit logging
export function auditLog(action: AuditAction, entityType: AuditEntityType) {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to capture response
    res.json = function (data: unknown) {
      // Log after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        createAuditLog(
          req.userId,
          req.orgId,
          {
            action,
            entityType,
            entityId: req.params.id || req.params.repoId || req.params.orgId,
            after:
              typeof data === "object"
                ? (data as Record<string, unknown>)
                : undefined,
            metadata: {
              method: req.method,
              path: req.path,
            },
          },
          {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            requestId: req.headers["x-request-id"] as string,
          }
        );
      }
      return originalJson(data);
    };

    next();
  };
}
