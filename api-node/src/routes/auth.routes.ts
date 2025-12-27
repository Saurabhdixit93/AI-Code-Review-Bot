import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { Organization } from "../models/Organization";
import { Member } from "../models/Member";
import {
  exchangeCodeForToken,
  getAuthenticatedUser,
  getUserInstallations,
} from "../config/github";
import {
  generateToken,
  authenticateToken,
  AuthenticatedRequest,
} from "../middleware/auth";
import { createAuditLog } from "../middleware/audit";
import { encrypt } from "../utils/crypto";
import { logger } from "../utils/logger";

const router = Router();

// OAuth callback schema
const callbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
});

// GitHub OAuth callback
router.post(
  "/callback",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = callbackSchema.parse(req.body);

      // Exchange code for access token
      const { accessToken, refreshToken } = await exchangeCodeForToken(code);

      // Get user info from GitHub
      const githubUser = await getAuthenticatedUser(accessToken);

      // Get user's installations
      const installations = await getUserInstallations(accessToken);

      // Upsert user in database
      const user = await User.findOneAndUpdate(
        { githubUserId: githubUser.id },
        {
          username: githubUser.login,
          name: githubUser.name || null,
          email: githubUser.email || null,
          avatarUrl: githubUser.avatar_url,
          accessTokenEncrypted: encrypt(accessToken),
          refreshTokenEncrypted: refreshToken
            ? encrypt(refreshToken)
            : undefined,
        },
        { upsert: true, new: true }
      );

      if (!user) {
        throw new Error("Failed to upsert user");
      }

      const userId = user._id.toString();

      // Generate JWT
      const token = generateToken({
        userId,
        githubUserId: githubUser.id,
        username: githubUser.login,
      });

      // Create audit log
      await createAuditLog(userId, undefined, {
        action: "auth.login" as any,
        entityType: "user" as any,
        entityId: userId,
        metadata: {
          installations: installations.map((i: { id: number }) => i.id),
        },
      });

      logger.info({ userId, username: githubUser.login }, "User authenticated");

      res.json({
        token,
        user: {
          id: userId,
          githubUserId: githubUser.id,
          username: githubUser.login,
          name: githubUser.name || null,
          email: githubUser.email,
          avatarUrl: githubUser.avatar_url,
        },
        installations: installations
          .filter((i: any) => i.account)
          .map((i: any) => ({
            id: i.id,
            account: {
              id: i.account.id,
              login: i.account.login,
              type: i.account.type,
              avatarUrl: i.account.avatar_url,
            },
          })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user
router.get(
  "/me",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.userId).select(
        "githubUserId username name email avatarUrl createdAt"
      );

      if (!user) {
        return res
          .status(404)
          .json({ error: { code: "NOT_FOUND", message: "User not found" } });
      }

      res.json({
        id: user._id,
        githubUserId: user.githubUserId,
        username: user.username,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's organizations with roles
router.get(
  "/me/organizations",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const memberships = await Member.find({ userId: req.userId })
        .populate("orgId")
        .sort({ "orgId.name": 1 });

      res.json(
        memberships.map((m: any) => ({
          id: m.orgId._id,
          name: m.orgId.name,
          slug: m.orgId.slug,
          avatarUrl: m.orgId.avatarUrl,
          role: m.role,
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

// Logout (invalidate token - client side)
router.post(
  "/logout",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await createAuditLog(req.userId, undefined, {
        action: "auth.logout" as any,
        entityType: "user" as any,
        entityId: req.userId,
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
