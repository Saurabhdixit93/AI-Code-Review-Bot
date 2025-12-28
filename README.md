# Enterprise AI Code Review Platform

> **Hybrid static-analysis + AI reasoning platform for GitHub Pull Requests**

A production-grade, multi-service platform featuring GitHub App integration, PR-scoped analysis, async worker pipeline, enterprise RBAC, and full execution traceability.

## 🧩 Architecture

The platform follows an event-driven microservices architecture:

```mermaid
graph TD
    User[User / Developer] -->|UI Interaction| NextJS[Next.js Dashboard]
    User -->|Git Push| GitHub[GitHub]

    GitHub -->|Webhook| API[Node.js API]

    NextJS -->|REST API| API

    API -->|Auth & Data| Mongo[(MongoDB)]
    API -->|Queue Jobs| Redis[(Redis)]

    Redis -->|Consume Analysis Jobs| PythonWorker[Python AI Worker]
    Redis -->|Consume Sync Jobs| NodeWorker[Node.js Sync Worker]

    PythonWorker -->|Fetch Diff / Post Comment| GitHub
    PythonWorker -->|LLM Inference| AI_Provider[OpenAI / Gemini]

    NodeWorker -->|Fetch Metadata| GitHub
    NodeWorker -->|Update Data| Mongo
```

### Components

| Component           | Tech Stack                     | Role                                                                   |
| ------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| **Dashboard**       | Next.js, React Query, Tailwind | Admin UI for managing orgs, repos, and viewing run insights.           |
| **Control Plane**   | Node.js, Express, BullMQ       | Handles Auth, Webhooks, API requests, and job dispatching.             |
| **Analysis Engine** | Python, LangChain, Pydantic    | Executes static analysis and AI reasoning on code diffs.               |
| **Data Store**      | MongoDB                        | System of record for users, organizations, repositories, and findings. |
| **Message Broker**  | Redis                          | Async job queues for scalability and reliability.                      |

---

## 🌊 Detailed Workflows

### 1. Installation & Onboarding

1.  **User installs GitHub App** on their Organization/Account.
2.  GitHub sends `installation.created` webhook to **Node.js API**.
3.  API creates the `Organization` record and the initial `Owner` member.
4.  API dispatches a `repo-sync` job to the **Node.js Worker**.
    - _Fallback:_ If webhook fails, the Frontend triggers a "Claim" API call (`/api/organizations/claim`) to sync the installation manually.
5.  **Node.js Worker** fetches all repositories, storing them in MongoDB.

### 2. Repository Sync

1.  Scheduled or manual trigger via Dashboard.
2.  `repo-sync` job added to `repo-sync-jobs` queue.
3.  **Node.js Worker** processes the job:
    - Fetches latest repo list from GitHub.
    - Updates local DB (names, descriptions, visibility).
    - Removes deleted repositories.

### 3. PR Analysis Flow

1.  Developer opens or updates a Pull Request.
2.  GitHub sends `pull_request` webhook to **Node.js API**.
3.  API validates the request:
    - Is the repo enabled?
    - Does the org have active plan limits?
    - Is the file count within limits?
4.  API creates a `Run` record and adds a job to `analysis-jobs` queue.
5.  **Python Worker** picks up the job:
    - **Clones/Fetches** the specific PR diff (shallow clone).
    - **Static Analysis**: Runs tools like `ruff` (Python) or `eslint` (JS/TS) on modified files.
    - **AI Analysis**: Sends complex diff chunks to LLM (OpenAI/Gemini) with context.
    - **Deduplication**: Checks against previous runs to avoid spamming.
    - **Posting**: Publishes review comments to GitHub PR.

---

## 🚀 Setup & Configuration

### Prerequisites

- Node.js >= 18
- Python >= 3.10
- Docker & Docker Compose (for local DBs)
- MongoDB & Redis (if not using Docker)

### 1. GitHub App Configuration

You must create a GitHub App to use this platform.

1.  Go to **Developer Settings** -> **GitHub Apps** -> **New GitHub App**.
2.  **Webhook URL**: `https://your-api-url.com/api/webhooks/github` (Use `ngrok` for local dev).
3.  **Webhook Secret**: Generate a random string (e.g., `openssl rand -hex 32`).
4.  **Permissions**:
    - **Repository permissions**:
      - Contents: `Read-only` (to read code)
      - Pull Requests: `Read & Write` (to post comments)
      - Metadata: `Read-only`
    - **Organization permissions**:
      - Members: `Read-only`
5.  **Subscribe to events**:
    - `Pull request`
    - `Installation`
    - `Installation repositories`
6.  **Download Private Key** and note the **App ID** and **Client ID**.

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
# Core
NODE_ENV=development
API_PORT=3001
WEB_PORT=3000

# Databases
MONGODB_URI=mongodb://localhost:27017/ai-review
REDIS_URL=redis://localhost:6379

# GitHub App credentials
GITHUB_APP_ID=12345
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."
GITHUB_CLIENT_ID=lv1...
GITHUB_CLIENT_SECRET=...
GITHUB_APP_WEBHOOK_SECRET=your_webhook_secret

# AI Provider
AI_API_KEY=sk-...

# Security
JWT_SECRET=super_secret_jwt_key
ENCRYPTION_KEY=32_byte_hex_string_...
```

### 3. Local Development

**Option A: Quick Start (All-in-One)**

```bash
# Install dependencies for all services
npm run install:all

# Start local databases (Docker)
npm run docker:dev

# Start API, Frontend, and Worker
npm run dev
```

**Option B: Manual Start**

1.  **Databases**: Ensure MongoDB and Redis are running.
2.  **API Node**:
    ```bash
    cd api-node
    npm install
    npm run dev
    ```
3.  **Worker Python**:
    ```bash
    cd worker-python
    pip install -r requirements.txt
    python src/main.py
    ```
4.  **Web Next.js**:
    ```bash
    cd web-nextjs
    npm install
    npm run dev
    ```

---

## 📦 Deployment

### Docker

The project includes `Dockerfile` for each service.

1.  **Build Images**:

    ```bash
    docker build -t api-node ./api-node
    docker build -t worker-python ./worker-python
    docker build -t web-nextjs ./web-nextjs
    ```

2.  **Run with Compose**:
    Use `infra/docker/docker-compose.yml` to orchestrate the stack in production.

### Cloud Providers (e.g., Render/Heroku)

- **API Node**: Deploy as a Web Service. Set `npm start` as start command.
- **Web Next.js**: Deploy as a Web Service. Set `npm start` as start command.
- **Worker Python**: Deploy as a **Background Worker**. Set `python src/main.py` as start command.
- **Databases**: Use managed MongoDB Atlas and Redis Cloud.

---

## 🛡️ Security & Compliance

- **RBAC**: Strict separation of duties. Only Org Owners can change settings.
- **Encryption**: GitHub Tokens are encrypted at rest using AES-256-GCM.
- **Audit Logging**: Critical actions (Org creation, Policy changes, Manual syncs) are logged.
- **Stateless**: The worker is stateless; it clones, analyzes, and cleans up.

## 📄 License

Private - All rights reserved.
