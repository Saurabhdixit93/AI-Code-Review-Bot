// ===========================================
// Node.js API - Auth Middleware
// ===========================================

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError } from "../utils/errors";
import { logger } from "../utils/logger";

export interface JWTPayload {
  userId: string;
  githubUserId: number;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  userId?: string;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(new UnauthorizedError("No token provided"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    req.user = payload;
    req.userId = payload.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError("Token expired"));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError("Invalid token"));
    }
    next(error);
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    req.user = payload;
    req.userId = payload.userId;
  } catch (error) {
    // Ignore invalid tokens for optional auth
    logger.debug({ error }, "Optional auth: invalid token ignored");
  }

  next();
}

export function generateToken(payload: JWTPayload): string {
  // Parse expiresIn string to seconds (e.g., "7d" -> seconds)
  const expiresIn = env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
}
