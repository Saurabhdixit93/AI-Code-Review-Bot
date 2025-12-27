// ===========================================
// Node.js API - Environment Configuration
// ===========================================

import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env from monorepo root (where npm run dev is executed from)
// Try monorepo root first, then fallback to local .env
const monorepoEnvPath = path.join(process.cwd(), ".env");
const localEnvPath = path.resolve(__dirname, "../../../.env");

if (fs.existsSync(monorepoEnvPath)) {
  dotenv.config({ path: monorepoEnvPath });
} else if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config(); // fallback to default behavior
}

const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default("0.0.0.0"),

  // Database
  MONGODB_URI: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),
  REDIS_TLS: z.coerce.boolean().default(false),

  // GitHub App
  GITHUB_APP_ID: z.string(),
  GITHUB_APP_PRIVATE_KEY: z.string(),
  GITHUB_APP_WEBHOOK_SECRET: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),

  // AI Configuration
  AI_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  AI_API_KEY: z.string(),
  AI_MODEL_TIER1: z.string().default("openai/gpt-3.5-turbo"),
  AI_MODEL_TIER2: z.string().default("openai/gpt-4-turbo"),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // Analysis Limits
  MAX_PR_FILES: z.coerce.number().default(100),
  MAX_PR_LINES: z.coerce.number().default(5000),
  MAX_COMMENTS_PER_PR: z.coerce.number().default(10),
  SHADOW_MODE_DEFAULT: z.coerce.boolean().default(true),

  // Frontend URL
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),

  // CORS - comma-separated list of allowed origins
  CORS_ORIGINS: z
    .string()
    .default(
      "http://localhost:3000,http://localhost:3001,http://localhost:8000"
    ),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();

export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
