# Enterprise AI Code Review Platform

> **Hybrid static-analysis + AI reasoning platform for GitHub Pull Requests**

A production-grade, multi-service platform featuring GitHub App integration, PR-scoped analysis, async worker pipeline, enterprise RBAC, and full execution traceability.

## 🚀 Quick Start

```bash
# 1. Install all dependencies
npm run install:all

# 2. Copy environment config
cp .env.example .env
# Edit .env with your credentials

# 3. Start databases (Docker)
npm run docker:dev

# 4. Run migrations
npm run db:migrate

# 5. Start all services
npm run dev
```

This starts:

- **Node.js API** (port 3001) - Control plane
- **Next.js Dashboard** (port 3000) - Admin UI
- **Python Worker** - Analysis engine

## 📦 Project Structure

```
ai-code-review-platform/
├── api-node/           # Node.js Control Plane + Webhooks
├── worker-python/      # Analysis + AI Pipeline Engine
├── web-nextjs/         # Enterprise Admin Dashboard
├── shared/             # Types, Schemas, Prompts
│   ├── schemas/        # Zod validation schemas
│   ├── types/          # TypeScript types
│   └── prompts/        # AI prompt templates
└── infra/              # Infrastructure
    ├── docker/         # Docker Compose + Dockerfiles
    └── migrations/     # PostgreSQL migrations
```

## 🧩 Architecture

| Component         | Role                                                          |
| ----------------- | ------------------------------------------------------------- |
| **Next.js**       | Web UI, onboarding, org & repo management, run insights       |
| **Node.js API**   | Auth, RBAC, GitHub webhooks, job dispatch, policy enforcement |
| **Python Worker** | Diff processing, static rules, AI reasoning, comment posting  |
| **PostgreSQL**    | System of record (orgs, repos, runs, findings, audit)         |
| **Redis Queue**   | Async job queue & retry                                       |
| **GitHub App**    | Repo + PR integration & permissions                           |

## 🔧 Available Scripts

| Command              | Description                            |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Start all services in development mode |
| `npm run start`      | Start all services in production mode  |
| `npm run build`      | Build all packages                     |
| `npm run test`       | Run all tests                          |
| `npm run docker:dev` | Start Postgres + Redis, then run dev   |
| `npm run docker:up`  | Start all Docker services              |
| `npm run db:migrate` | Run database migrations                |

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

**Required:**

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `GITHUB_APP_ID` - GitHub App ID
- `GITHUB_APP_PRIVATE_KEY` - GitHub App private key
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - OAuth credentials
- `GITHUB_APP_WEBHOOK_SECRET` - Webhook signature secret
- `AI_API_KEY` - OpenRouter / OpenAI API key
- `JWT_SECRET` - JWT signing secret
- `ENCRYPTION_KEY` - Token encryption key

## 🔐 GitHub App Permissions

**Read:** metadata, repos, pull requests, contents  
**Write:** pull request comments, pull request reviews, checks

## 📊 Database Schema

- **organizations** - GitHub org/user account mapping
- **repositories** - Repos with enable/disable status
- **members** - RBAC (owner, maintainer, reviewer, viewer)
- **pull_requests** - PR tracking with run modes
- **runs** - Execution instances with metrics
- **findings** - Normalized review results
- **repo_config** - Per-repo settings
- **audit_log** - Full traceability

## 🛡️ Core Principles

1. **Control plane & execution separated** - Node.js decides WHAT, Python decides HOW
2. **Static rules run before AI** - Deterministic first, AI for complex cases
3. **Only analyze modified hunks** - Efficient & focused
4. **Never spam PR comments** - Max limits & deduplication
5. **Strong safety & cost limits** - Token budgets & rate limiting
6. **Full execution traceability** - Every decision logged
7. **Enterprise-grade RBAC** - Role-based access control
8. **Shadow-mode support** - Test without posting

## 📄 License

Private - All rights reserved
