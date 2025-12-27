// ===========================================
// Node.js API - Webhook Middleware
// ===========================================

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { env } from "../config/env";
import { UnauthorizedError, BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";

export interface WebhookRequest extends Request {
  webhookId?: string;
  webhookEvent?: string;
  webhookDelivery?: string;
  rawBody?: Buffer;
}

// Capture raw body for signature verification
export function captureRawBody(
  req: WebhookRequest,
  res: Response,
  next: NextFunction
): void {
  const chunks: Buffer[] = [];

  req.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });

  req.on("end", () => {
    req.rawBody = Buffer.concat(chunks);
    next();
  });
}

// Verify GitHub webhook signature
export function verifyWebhookSignature(
  req: WebhookRequest,
  res: Response,
  next: NextFunction
): void {
  const signature = req.headers["x-hub-signature-256"] as string;
  const event = req.headers["x-github-event"] as string;
  const delivery = req.headers["x-github-delivery"] as string;

  if (!signature) {
    return next(new UnauthorizedError("Missing webhook signature"));
  }

  if (!event) {
    return next(new BadRequestError("Missing webhook event header"));
  }

  if (!req.rawBody) {
    return next(new BadRequestError("Missing request body"));
  }

  // Calculate expected signature
  const hmac = crypto.createHmac("sha256", env.GITHUB_APP_WEBHOOK_SECRET);
  hmac.update(req.rawBody);
  const expectedSignature = `sha256=${hmac.digest("hex")}`;

  // Constant-time comparison
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    logger.warn({ delivery }, "Invalid webhook signature");
    return next(new UnauthorizedError("Invalid webhook signature"));
  }

  // Parse the body
  try {
    req.body = JSON.parse(req.rawBody.toString());
  } catch (error) {
    return next(new BadRequestError("Invalid JSON body"));
  }

  req.webhookEvent = event;
  req.webhookDelivery = delivery;

  logger.info({ event, delivery }, "Webhook signature verified");
  next();
}

// Log webhook details
export function logWebhook(
  req: WebhookRequest,
  res: Response,
  next: NextFunction
): void {
  const event = req.webhookEvent;
  const delivery = req.webhookDelivery;
  const action = req.body?.action;

  logger.info(
    {
      event,
      action,
      delivery,
      sender: req.body?.sender?.login,
      repository: req.body?.repository?.full_name,
    },
    "Processing webhook"
  );

  next();
}
