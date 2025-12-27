// ===========================================
// Node.js API - Error Handler Middleware
// ===========================================

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError, isAppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { isProduction } from "../config/env";

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error(
    {
      err,
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
    },
    "Request error"
  );

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    };
    res.status(400).json(response);
    return;
  }

  // Handle known application errors
  if (isAppError(err)) {
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    error: {
      code: "INTERNAL_ERROR",
      message: isProduction ? "An unexpected error occurred" : err.message,
      stack: isProduction ? undefined : err.stack,
    },
  };

  res.status(500).json(response);
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  };
  res.status(404).json(response);
}
