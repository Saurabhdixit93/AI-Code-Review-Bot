# Environment Variables by Service

This document lists all environment variables used by each service in the AI Code Review Bot platform.

---

## API Node (`api-node`)

The Node.js API service uses the following environment variables:

### Server Configuration

| Variable   | Required | Default       | Description                                            |
| ---------- | -------- | ------------- | ------------------------------------------------------ |
| `NODE_ENV` | No       | `development` | Environment mode (`development`, `production`, `test`) |
| `API_PORT` | No       | `3001`        | Port for the API server                                |
| `API_HOST` | No       | `0.0.0.0`     | Host for the API server                                |

### Database

| Variable          | Required | Default           | Description            |
| ----------------- | -------- | ----------------- | ---------------------- |
| `MONGODB_URI`     | **Yes**  | -                 | MongoDB connection URL |
| `MONGODB_DB_NAME` | No       | `code_review_bot` | MongoDB database name  |

### Redis

| Variable    | Required | Default | Description                     |
| ----------- | -------- | ------- | ------------------------------- |
| `REDIS_URL` | **Yes**  | -       | Redis connection URL            |
| `REDIS_TLS` | No       | `false` | Enable TLS for Redis connection |

### GitHub App

| Variable                    | Required | Default | Description                         |
| --------------------------- | -------- | ------- | ----------------------------------- |
| `GITHUB_APP_ID`             | **Yes**  | -       | GitHub App ID                       |
| `GITHUB_APP_PRIVATE_KEY`    | **Yes**  | -       | GitHub App private key (PEM format) |
| `GITHUB_APP_WEBHOOK_SECRET` | **Yes**  | -       | Webhook secret for GitHub App       |
| `GITHUB_CLIENT_ID`          | **Yes**  | -       | GitHub OAuth Client ID              |
| `GITHUB_CLIENT_SECRET`      | **Yes**  | -       | GitHub OAuth Client Secret          |

### AI Configuration

| Variable         | Required | Default                        | Description              |
| ---------------- | -------- | ------------------------------ | ------------------------ |
| `AI_BASE_URL`    | No       | `https://openrouter.ai/api/v1` | AI API base URL          |
| `AI_API_KEY`     | **Yes**  | -                              | AI service API key       |
| `AI_MODEL_TIER1` | No       | `openai/gpt-3.5-turbo`         | Model for tier 1 reviews |
| `AI_MODEL_TIER2` | No       | `openai/gpt-4-turbo`           | Model for tier 2 reviews |

### Security

| Variable         | Required | Default | Description                                      |
| ---------------- | -------- | ------- | ------------------------------------------------ |
| `JWT_SECRET`     | **Yes**  | -       | Secret for JWT signing (min 32 chars)            |
| `JWT_EXPIRES_IN` | No       | `7d`    | JWT token expiration time                        |
| `ENCRYPTION_KEY` | **Yes**  | -       | Encryption key for sensitive data (min 32 chars) |

### Rate Limiting

| Variable                  | Required | Default | Description                       |
| ------------------------- | -------- | ------- | --------------------------------- |
| `RATE_LIMIT_WINDOW_MS`    | No       | `60000` | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | No       | `100`   | Maximum requests per window       |

### Analysis Configuration

| Variable              | Required | Default | Description                     |
| --------------------- | -------- | ------- | ------------------------------- |
| `MAX_PR_FILES`        | No       | `100`   | Maximum files per PR to analyze |
| `MAX_PR_LINES`        | No       | `5000`  | Maximum lines per PR to analyze |
| `MAX_COMMENTS_PER_PR` | No       | `10`    | Maximum comments per PR         |
| `SHADOW_MODE_DEFAULT` | No       | `true`  | Default shadow mode setting     |

### Frontend URL & CORS

| Variable       | Required | Default                     | Description                          |
| -------------- | -------- | --------------------------- | ------------------------------------ |
| `NEXTAUTH_URL` | No       | `http://localhost:3000`     | Frontend URL for NextAuth            |
| `CORS_ORIGINS` | No       | `http://localhost:3000,...` | Comma-separated allowed CORS origins |

---

## Web Dashboard (`web-nextjs`)

The Next.js web dashboard uses the following environment variables:

### Server Configuration

| Variable   | Required | Default       | Description      |
| ---------- | -------- | ------------- | ---------------- |
| `NODE_ENV` | No       | `development` | Environment mode |

### API & Authentication

| Variable              | Required | Default                 | Description                            |
| --------------------- | -------- | ----------------------- | -------------------------------------- |
| `NEXT_PUBLIC_API_URL` | No       | `http://localhost:3001` | API server URL (public)                |
| `NEXTAUTH_URL`        | **Yes**  | -                       | NextAuth callback URL                  |
| `NEXTAUTH_SECRET`     | **Yes**  | -                       | Secret for NextAuth session encryption |

### GitHub OAuth

| Variable               | Required | Default | Description                |
| ---------------------- | -------- | ------- | -------------------------- |
| `GITHUB_CLIENT_ID`     | **Yes**  | -       | GitHub OAuth Client ID     |
| `GITHUB_CLIENT_SECRET` | **Yes**  | -       | GitHub OAuth Client Secret |

### GitHub App

| Variable                      | Required | Default          | Description                            |
| ----------------------------- | -------- | ---------------- | -------------------------------------- |
| `NEXT_PUBLIC_GITHUB_APP_SLUG` | No       | `ai-code-review` | GitHub App slug for installation links |

---

## Worker Python (`worker-python`)

The Python worker service uses the following environment variables:

### Application

| Variable   | Required | Default       | Description      |
| ---------- | -------- | ------------- | ---------------- |
| `NODE_ENV` | No       | `development` | Environment mode |

### Database

| Variable          | Required | Default           | Description            |
| ----------------- | -------- | ----------------- | ---------------------- |
| `MONGODB_URI`     | **Yes**  | -                 | MongoDB connection URL |
| `MONGODB_DB_NAME` | No       | `code_review_bot` | MongoDB database name  |

### Redis

| Variable    | Required | Default | Description          |
| ----------- | -------- | ------- | -------------------- |
| `REDIS_URL` | **Yes**  | -       | Redis connection URL |

### GitHub App

| Variable                 | Required | Default | Description                         |
| ------------------------ | -------- | ------- | ----------------------------------- |
| `GITHUB_APP_ID`          | **Yes**  | -       | GitHub App ID                       |
| `GITHUB_APP_PRIVATE_KEY` | **Yes**  | -       | GitHub App private key (PEM format) |

### AI Configuration

| Variable         | Required | Default                        | Description                    |
| ---------------- | -------- | ------------------------------ | ------------------------------ |
| `AI_PROVIDER`    | No       | `openrouter`                   | AI provider name               |
| `AI_BASE_URL`    | No       | `https://openrouter.ai/api/v1` | AI API base URL                |
| `AI_API_KEY`     | **Yes**  | -                              | AI service API key             |
| `AI_MODEL_TIER1` | No       | `openai/gpt-3.5-turbo`         | Model for tier 1 reviews       |
| `AI_MODEL_TIER2` | No       | `openai/gpt-4-turbo`           | Model for tier 2 reviews       |
| `AI_MAX_TOKENS`  | No       | `4096`                         | Maximum tokens for AI response |
| `AI_TEMPERATURE` | No       | `0.3`                          | AI temperature setting         |

### Security

| Variable         | Required | Default | Description                       |
| ---------------- | -------- | ------- | --------------------------------- |
| `ENCRYPTION_KEY` | **Yes**  | -       | Encryption key for sensitive data |

### Analysis Configuration

| Variable              | Required | Default | Description                     |
| --------------------- | -------- | ------- | ------------------------------- |
| `MAX_PR_FILES`        | No       | `100`   | Maximum files per PR to analyze |
| `MAX_PR_LINES`        | No       | `5000`  | Maximum lines per PR to analyze |
| `MAX_COMMENTS_PER_PR` | No       | `10`    | Maximum comments per PR         |
| `MAX_FILE_SIZE_KB`    | No       | `500`   | Maximum file size in KB         |

### Worker Configuration

| Variable              | Required | Default | Description                  |
| --------------------- | -------- | ------- | ---------------------------- |
| `WORKER_CONCURRENCY`  | No       | `4`     | Number of concurrent workers |
| `JOB_TIMEOUT_SECONDS` | No       | `300`   | Job timeout in seconds       |

### Paths

| Variable      | Required | Default               | Description                    |
| ------------- | -------- | --------------------- | ------------------------------ |
| `PROMPTS_DIR` | No       | `/app/shared/prompts` | Directory for prompt templates |

---

## Quick Reference: Variables by Service

| Variable                      | API Node | Web | Worker |
| ----------------------------- | :------: | :-: | :----: |
| `NODE_ENV`                    |    ✅    | ✅  |   ✅   |
| `API_PORT`                    |    ✅    |     |        |
| `API_HOST`                    |    ✅    |     |        |
| `MONGODB_URI`                 |    ✅    |     |   ✅   |
| `MONGODB_DB_NAME`             |    ✅    |     |   ✅   |
| `REDIS_URL`                   |    ✅    |     |   ✅   |
| `REDIS_TLS`                   |    ✅    |     |        |
| `GITHUB_APP_ID`               |    ✅    |     |   ✅   |
| `GITHUB_APP_PRIVATE_KEY`      |    ✅    |     |   ✅   |
| `GITHUB_APP_WEBHOOK_SECRET`   |    ✅    |     |        |
| `GITHUB_CLIENT_ID`            |    ✅    | ✅  |        |
| `GITHUB_CLIENT_SECRET`        |    ✅    | ✅  |        |
| `AI_PROVIDER`                 |          |     |   ✅   |
| `AI_BASE_URL`                 |    ✅    |     |   ✅   |
| `AI_API_KEY`                  |    ✅    |     |   ✅   |
| `AI_MODEL_TIER1`              |    ✅    |     |   ✅   |
| `AI_MODEL_TIER2`              |    ✅    |     |   ✅   |
| `AI_MAX_TOKENS`               |          |     |   ✅   |
| `AI_TEMPERATURE`              |          |     |   ✅   |
| `JWT_SECRET`                  |    ✅    |     |        |
| `JWT_EXPIRES_IN`              |    ✅    |     |        |
| `ENCRYPTION_KEY`              |    ✅    |     |   ✅   |
| `RATE_LIMIT_WINDOW_MS`        |    ✅    |     |        |
| `RATE_LIMIT_MAX_REQUESTS`     |    ✅    |     |        |
| `MAX_PR_FILES`                |    ✅    |     |   ✅   |
| `MAX_PR_LINES`                |    ✅    |     |   ✅   |
| `MAX_COMMENTS_PER_PR`         |    ✅    |     |   ✅   |
| `MAX_FILE_SIZE_KB`            |          |     |   ✅   |
| `SHADOW_MODE_DEFAULT`         |    ✅    |     |        |
| `NEXTAUTH_URL`                |    ✅    | ✅  |        |
| `NEXTAUTH_SECRET`             |          | ✅  |        |
| `CORS_ORIGINS`                |    ✅    |     |        |
| `NEXT_PUBLIC_API_URL`         |          | ✅  |        |
| `NEXT_PUBLIC_GITHUB_APP_SLUG` |          | ✅  |        |
| `WORKER_CONCURRENCY`          |          |     |   ✅   |
| `JOB_TIMEOUT_SECONDS`         |          |     |   ✅   |
| `PROMPTS_DIR`                 |          |     |   ✅   |
