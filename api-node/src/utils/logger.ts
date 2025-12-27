// ===========================================
// Node.js API - Logger Utility
// ===========================================

import pino from "pino";
import { env, isDevelopment } from "../config/env";

export const logger = pino({
  level: isDevelopment ? "debug" : "info",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    service: "api-node",
    env: env.NODE_ENV,
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.accessToken",
      "*.refreshToken",
      "*.privateKey",
    ],
    censor: "[REDACTED]",
  },
});

export function createChildLogger(
  name: string,
  bindings?: Record<string, unknown>
) {
  return logger.child({ module: name, ...bindings });
}
