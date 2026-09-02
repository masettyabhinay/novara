# NOVARA v1.0 — Supabase + Render Production Deployment Guide

This step-by-step guide walks you through deploying NOVARA to **Render** (Application Hosting) backed by **Supabase** (PostgreSQL Database & S3-Compatible Object Storage).

---

## Architecture Overview

```
[ User Browser / Android PWA ]
               │ (HTTPS)
               ▼
[ Render Web Service ] ── (Static Vite Bundle + Node.js API)
       │                 │
       ▼ (Port 6543/5432)│ (S3 API)
[ Supabase PostgreSQL ]   ▼
                 [ Supabase Storage Bucket ]
```

---

## 17-Step Production Deployment Walkthrough

### Step 1: Create Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Click **New Project**.
3. Choose an Organization, name the project (e.g. `novara-production`), enter a strong Database Password (store safely in your password manager), and choose a region close to your primary audience (e.g. `US East (North Virginia)`).
4. Wait for the database provisioning to complete (takes ~1-2 minutes).

### Step 2: Obtain PostgreSQL Connection String
1. In your Supabase project dashboard, navigate to **Project Settings** (gear icon) > **Database**.
2. Scroll to the **Connection parameters** section.
3. Under **Connection string**, select **URI**.
4. Choose the **Transaction Pooler** (recommended for serverless/PaaS compute) on port `6543`, or Direct Connection on port `5432`.
5. Copy the connection string format:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password. This is your `DATABASE_URL`.
7. In the same **Database** settings page, scroll to **SSL Certificate** and click **Download Certificate** (`prod-ca-2021.crt`). Open it in any text editor to copy its contents for the `DATABASE_SSL_CA` variable on Render.

### Step 3: Run Database Schema Initialization
1. In the Supabase dashboard, go to the **SQL Editor** (left navigation).
2. Click **New query**.
3. Paste the complete contents of `server/db/schema.sql` from this repository.
4. Click **Run**.
5. Verify in the **Table Editor** that all 22 tables (`users`, `sessions`, `roadmaps`, `tasks`, `streaks`, `applications`, `focus_sessions`, etc.) are created with primary keys and indexes.

### Step 4: Create Supabase Storage Bucket & Configure Private Access
1. In the Supabase dashboard, navigate to **Storage**.
2. Click **New Bucket**.
3. Name the bucket: `novara-user-roadmaps`.
4. **IMPORTANT:** Keep **Public bucket** toggled **OFF** (Private).
5. Set file size limit to `10 MB`.
6. Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`, `text/markdown`.
7. Click **Create bucket**.

### Step 5: Obtain Supabase S3-Compatible Storage Credentials
1. Go to **Project Settings** > **Storage**.
2. Under **S3 Access Keys**, click **Generate new key**.
3. Note the following values:
   - **Endpoint:** `https://<project-ref>.supabase.co/storage/v1/s3`
   - **Access Key ID:** `[YOUR-S3-ACCESS-KEY-ID]`
   - **Secret Access Key:** `[YOUR-S3-SECRET-ACCESS-KEY]`
   - **Region:** `us-east-1` (or your Supabase region)

### Step 6: Create Render Web Service
1. Log in to [Render](https://render.com).
2. Click **New +** > **Web Service**.

### Step 7: Connect Git Repository
1. Connect your GitHub/GitLab repository containing the NOVARA source code.
2. Select the repository and `main` branch.

### Step 8: Configure Build & Runtime Commands
In the Render Web Service configuration page:
- **Name:** `novara-app` (or your preferred name)
- **Runtime:** `Node`
- **Region:** `Oregon` (or matching your Supabase region)
- **Build Command:**
  ```bash
  npm ci && npm run build
  ```
- **Start Command:**
  ```bash
  npm run start
  ```
- **Health Check Path:** `/api/health`

### Step 9: Add Environment Variables in Render
Under the **Environment Variables** tab in Render, add the following key-value pairs:

| Variable Name | Type | Value / Source |
| :--- | :--- | :--- |
| `NODE_ENV` | Server | `production` |
| `DATABASE_URL` | Server | Your Supabase PostgreSQL Connection String |
| `DATABASE_SSL_CA` | Server | Supabase CA Certificate contents (`prod-ca-2021.crt`) |
| `JWT_SECRET` | Server | Generate a 64+ character random hex string |
| `AI_API_KEY` | Server | Your Google Gemini API Key |
| `GOOGLE_CLIENT_ID` | Server | Your Google OAuth 2.0 Client ID |
| `VITE_GOOGLE_CLIENT_ID` | Public | Your Google OAuth 2.0 Client ID (Matches above) |
| `STORAGE_ENDPOINT` | Server | `https://<project-ref>.supabase.co/storage/v1/s3` |
| `STORAGE_BUCKET` | Server | `novara-user-roadmaps` |
| `STORAGE_REGION` | Server | `us-east-1` |
| `STORAGE_ACCESS_KEY` | Server | Supabase S3 Access Key ID |
| `STORAGE_SECRET_KEY` | Server | Supabase S3 Secret Access Key |
| `APP_BASE_URL` | Server | `https://<your-render-name>.onrender.com` |
| `API_BASE_URL` | Server | `https://<your-render-name>.onrender.com/api` |
| `ALLOWED_ORIGINS` | Server | `https://<your-render-name>.onrender.com` |

### Step 10: Trigger Deployment
1. Click **Create Web Service**.
2. Render will clone the repository, run `npm ci && npm run build`, and launch `server/server.js`.
3. Monitor the build logs to confirm Vite build completes with 0 errors.

### Step 11: Obtain Render HTTPS URL
1. Once deployed, note your service URL at the top of the Render dashboard:
   ```
   https://novara-app.onrender.com
   ```
2. If using a custom domain (e.g. `https://novara.app`), add the domain in Render **Custom Domains** and configure DNS CNAME/A records.

### Step 12: Configure Google OAuth Production Origin
1. Open the [Google Cloud Console](https://console.cloud.google.com).
2. Navigate to **APIs & Services** > **Credentials**.
3. Select your **OAuth 2.0 Client ID**.
4. Under **Authorized JavaScript origins**, add:
   - `https://novara-app.onrender.com` (and your custom domain if applicable)
   - Keep `http://localhost:3000` for local development.
5. Under **Authorized redirect URIs**, add:
   - `https://novara-app.onrender.com`
6. Click **Save**.

### Step 13: Verify and Update ALLOWED_ORIGINS & APP_BASE_URL
Ensure the `ALLOWED_ORIGINS` and `APP_BASE_URL` in the Render Environment Variables match your exact Render HTTPS URL or custom domain.

### Step 14: Test Health Endpoint
Open a terminal and run:
```bash
curl -i https://your-service-name.onrender.com/api/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "server": "online",
    "database": "connected",
    "storage": "available"
  }
}
```

### Step 15: Perform Live Authentication Smoke Test
1. Visit `https://your-service-name.onrender.com` in your browser.
2. Test **Email Sign Up** with a real email.
3. Test **Google One Tap / Sign-In** button.
4. Verify user avatar, profile persistence, and successful session cookie/token generation.

### Step 16: Test Roadmap Document Upload
1. Go to **Roadmap** > Click **Upload Roadmap**.
2. Upload a valid PDF or image file.
3. Verify AI extraction, phase breakdown, and daily mission generation.
4. Verify file is securely persisted to the private Supabase storage bucket under `users/{userId}/roadmaps/`.

### Step 17: Test Multi-Device Synchronization & PWA Installation
1. Install NOVARA as a PWA on an Android/iOS device or Chrome desktop.
2. Complete a task or focus study session on mobile.
3. Refresh the desktop browser and verify the streak and completed task sync in real time.
4. Disconnect network, complete an offline action, reconnect, and verify automated sync reconciliation.

---

## Production Security & Maintenance Checklist

- [x] Database password stored only in Render environment variables.
- [x] Private credentials excluded from client-side bundle.
- [x] Supabase Storage bucket is marked **Private** with authenticated RLS / S3 signature authorization.
- [x] Strict CORS origin validation enabled (`ALLOWED_ORIGINS`).
- [x] Rate limiting active on authentication and AI endpoints.
- [x] Automated daily PostgreSQL backups enabled in Supabase.
