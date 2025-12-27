# GitHub App Setup Guide

Complete step-by-step guide to create and configure a GitHub App for the AI Code Review Platform.

---

## 📋 Prerequisites

- GitHub account with organization admin access (or personal account)
- Your deployed API URL (e.g., `https://api.yourdomain.com`)
- Your deployed Web URL (e.g., `https://app.yourdomain.com`)

---

## 🚀 Step 1: Create GitHub App

1. Go to **GitHub Settings**:

   - For organization: `https://github.com/organizations/YOUR_ORG/settings/apps/new`
   - For personal: `https://github.com/settings/apps/new`

2. Fill in the **Basic Information**:

   | Field               | Value                                              |
   | ------------------- | -------------------------------------------------- |
   | **GitHub App name** | `AI Code Review Bot` (must be unique)              |
   | **Homepage URL**    | `https://app.yourdomain.com`                       |
   | **Description**     | AI-powered code review assistant for pull requests |

---

## 🔗 Step 2: Configure Callbacks & URLs

| Field                    | Value                                                              |
| ------------------------ | ------------------------------------------------------------------ |
| **Callback URL**         | `https://app.yourdomain.com/api/auth/callback/github`              |
| **Setup URL** (optional) | `https://app.yourdomain.com/setup`                                 |
| **Webhook URL**          | `https://api.yourdomain.com/api/webhooks/github`                   |
| **Webhook secret**       | Generate a random string (save this → `GITHUB_APP_WEBHOOK_SECRET`) |

```bash
# Generate webhook secret
openssl rand -hex 32
```

---

## 🔐 Step 3: Set Permissions

### Repository Permissions

| Permission          | Access       | Purpose                               |
| ------------------- | ------------ | ------------------------------------- |
| **Contents**        | Read         | Fetch file contents for context       |
| **Metadata**        | Read         | Access repo info                      |
| **Pull requests**   | Read & Write | Read PR details, post review comments |
| **Checks**          | Read & Write | (Optional) Create check runs          |
| **Commit statuses** | Read & Write | (Optional) Post status updates        |

### Organization Permissions

| Permission  | Access | Purpose                   |
| ----------- | ------ | ------------------------- |
| **Members** | Read   | Sync organization members |

### Account Permissions

| Permission          | Access | Purpose             |
| ------------------- | ------ | ------------------- |
| **Email addresses** | Read   | User identification |

---

## 📢 Step 4: Subscribe to Events

Check these webhook events:

| Event                              | Purpose                            |
| ---------------------------------- | ---------------------------------- |
| ✅ **Pull request**                | Trigger analysis on PR open/update |
| ✅ **Pull request review**         | Track human reviews                |
| ✅ **Pull request review comment** | Track comments                     |
| ✅ **Push**                        | (Optional) Detect new commits      |
| ✅ **Installation**                | Track app installations            |
| ✅ **Installation repositories**   | Track repo selection changes       |

---

## 🏢 Step 5: Installation Options

| Option                               | Value                                                  |
| ------------------------------------ | ------------------------------------------------------ |
| **Where can this app be installed?** | `Any account` (or `Only this account` for private use) |

---

## ✅ Step 6: Create the App

1. Click **"Create GitHub App"**
2. You'll be redirected to the app settings page
3. Note the **App ID** → `GITHUB_APP_ID`

---

## 🔑 Step 7: Generate Private Key

1. Scroll to **"Private keys"** section
2. Click **"Generate a private key"**
3. A `.pem` file will download
4. Convert to single-line format:

```bash
# Option A: Keep newlines escaped
cat your-app.private-key.pem | tr '\n' '\\n' | sed 's/\\n$//'

# Option B: Base64 encode
cat your-app.private-key.pem | base64
```

5. Save as → `GITHUB_APP_PRIVATE_KEY`

---

## 🔄 Step 8: Create OAuth Credentials

1. In app settings, go to **"OAuth credentials"** section (left sidebar)
2. Or click **"Optional features"** → **"User-to-server tokens"**
3. Note:
   - **Client ID** → `GITHUB_CLIENT_ID`
   - Click **"Generate a new client secret"** → `GITHUB_CLIENT_SECRET`

⚠️ **Save the client secret immediately** - it won't be shown again!

---

## 📝 Step 9: Environment Variables Summary

Add these to your `.env` file:

```bash
# From Step 6 - App Settings page
GITHUB_APP_ID=123456

# From Step 7 - Private key file (escaped newlines)
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"

# From Step 2 - Webhook secret you generated
GITHUB_APP_WEBHOOK_SECRET=your_generated_webhook_secret

# From Step 8 - OAuth credentials
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=your_client_secret_here
```

---

## 🧪 Step 10: Install the App

1. Go to your app's public page:
   `https://github.com/apps/YOUR_APP_NAME`

2. Click **"Install"**

3. Select:

   - **Organization** or **Personal account**
   - **All repositories** or **Select repositories**

4. Click **"Install"**

5. You'll be redirected to your callback URL

---

## ✅ Verification Checklist

| Check                   | How to Verify                         |
| ----------------------- | ------------------------------------- |
| App ID correct          | Shows in GitHub app settings          |
| Private key works       | App can authenticate to GitHub API    |
| Webhook secret matches  | Webhook signature verification passes |
| OAuth flow works        | Users can log in via GitHub           |
| Webhook events received | Check your API logs                   |

### Test Webhook Delivery

1. Go to your app's **Advanced** settings
2. Check **Recent Deliveries**
3. Verify payloads are being sent and receiving `200` responses

---

## 🔧 Troubleshooting

### "Signature verification failed"

- Check `GITHUB_APP_WEBHOOK_SECRET` matches exactly
- Ensure raw body is used for signature verification

### "Bad credentials" when calling GitHub API

- Check `GITHUB_APP_PRIVATE_KEY` format (escaped newlines)
- Verify `GITHUB_APP_ID` is correct
- Check installation ID is valid

### OAuth callback errors

- Verify `Callback URL` matches exactly
- Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

### "Resource not accessible by integration"

- Check repository permissions are set correctly
- Ensure app is installed on the repository
- Verify the installation has access to the specific repo

---

## 📚 Additional Resources

- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [Authenticating as a GitHub App](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app)
- [Webhook Events](https://docs.github.com/en/webhooks/webhook-events-and-payloads)
