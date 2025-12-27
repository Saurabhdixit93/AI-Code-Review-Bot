# Deployment Configuration

This directory contains deployment configurations for various platforms.

## Files

| File                      | Description                                                      |
| ------------------------- | ---------------------------------------------------------------- |
| `kubernetes.yaml`         | Kubernetes manifests (namespace, deployments, services, ingress) |
| `docker-compose.prod.yml` | Production Docker Compose with Nginx, MongoDB, Redis             |
| `render.yaml`             | Render.com blueprint deployment                                  |
| `railway.toml`            | Railway.app configuration                                        |
| `github-actions.yml`      | CI/CD pipeline (copy to `.github/workflows/`)                    |
| `nginx.conf`              | Nginx reverse proxy configuration                                |

## Quick Start

### Option 1: Docker Compose (Self-hosted)

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your values

# Deploy
cd infra/deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Render.com

```bash
# Push this repo to GitHub
# Connect to Render.com
# Import render.yaml blueprint
```

### Option 3: Railway.app

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Option 4: Kubernetes

```bash
# Create namespace and secrets
kubectl apply -f kubernetes.yaml

# Update image tags and deploy
kubectl set image deployment/api api=your-registry/api:v1.0.0
kubectl set image deployment/worker worker=your-registry/worker:v1.0.0
kubectl set image deployment/web web=your-registry/web:v1.0.0
```

## CI/CD Setup

1. Copy `github-actions.yml` to `.github/workflows/ci.yml`
2. Add secrets to GitHub repository settings:
   - `RAILWAY_TOKEN` (if using Railway)
   - `RENDER_DEPLOY_HOOK` (if using Render)
   - `SLACK_WEBHOOK_URL` (optional notifications)

## Environment Variables

See `.env.example` in the root directory for all required variables.

**Required for all deployments:**

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `REDIS_URL`
- `GITHUB_APP_*` credentials
- `AI_API_KEY`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
