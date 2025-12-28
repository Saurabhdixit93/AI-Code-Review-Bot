// ===========================================
// Node.js API - Express Server Entry Point
// ===========================================

import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

import {
  env,
  connectDatabase,
  checkDatabaseHealth,
  closeDatabasePool,
  checkRedisHealth,
  closeRedisConnections,
} from "./config";
import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/error";
import {
  authRoutes,
  orgRoutes,
  repoRoutes,
  webhookRoutes,
  runRoutes,
  memberRoutes,
  auditRoutes,
} from "./routes";
import { syncWorker } from "./workers";

const app: Express = express();

// Security middleware
app.set("trust proxy", 1); // Trust first proxy (required for Render/Heroku/etc)
app.use(helmet());

// CORS Configuration - supports multiple origins from env
const allowedOrigins = env.CORS_ORIGINS.split(",").map((origin) =>
  origin.trim()
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-GitHub-Event",
      "X-GitHub-Delivery",
      "X-Hub-Signature-256",
    ],
    exposedHeaders: ["X-Total-Count", "X-Page", "X-Per-Page"],
    maxAge: 86400, // 24 hours preflight cache
  })
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMIT", message: "Too many requests" } },
  })
);

// Request logging
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === "/health",
    },
  })
);

// Body parsing (except for webhooks which need raw body)
app.use((req, res, next) => {
  if (req.path === "/api/webhooks/github") {
    return next();
  }
  express.json({ limit: "10mb" })(req, res, next);
});

// Health check
app.get("/health", async (req: Request, res: Response) => {
  const dbHealthy = await checkDatabaseHealth();
  const redisHealthy = await checkRedisHealth();

  const status = dbHealthy && redisHealthy ? "healthy" : "unhealthy";
  const statusCode = status === "healthy" ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? "connected" : "disconnected",
      redis: redisHealthy ? "connected" : "disconnected",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/organizations", orgRoutes);
app.use("/api/repositories", repoRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/runs", runRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/audit", auditRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info({ signal }, "Shutdown signal received");

  try {
    await closeDatabasePool();
    await closeRedisConnections();
    await syncWorker.close();
    logger.info("Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Start server
connectDatabase().then(() => {
  app.listen(env.API_PORT, env.API_HOST, () => {
    logger.info(
      {
        host: env.API_HOST,
        port: env.API_PORT,
        env: env.NODE_ENV,
      },
      "🚀 API server started successfully"
    );
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Promise Rejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught Exception");
  process.exit(1);
});

export default app;
