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

### Step 2: Obtain PostgreSQL Connection String from Supabase

There are two easy ways to access your connection parameters in the Supabase Dashboard:

#### Method A: The Supabase "Connect" Panel (Recommended)
1. At the top of your Supabase Dashboard, click the green **Connect** button in the header bar.
2. In the modal that opens, select:
   - **Type:** `Transaction pooler` (Port `6543`) or `Session pooler` (Port `5432`). Both connect via Supabase's high-performance connection pooler (Supavisor) over IPv4, which is required for reliable connectivity from Render.
   - **Mode:** `URI`.
3. You will see a connection string formatted as:
   ```text
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   > [!NOTE]
   > Supabase automatically populates `[YOUR-PROJECT-REF]` (your project's unique 20-character alphanumeric ID) and `[REGION]`. The only value you need to supply is your actual database password!

#### Method B: Project Settings > Database
1. Navigate to **Project Settings** (gear icon) > **Database**.
2. Scroll down to the **Connection parameters** section.
3. Under **Connection string**, select the **URI** tab.
4. Select **Transaction Pooler** (port `6543`, recommended) or **Session Pooler** (port `5432`).

#### Critical Connection String Rules:
- **Tenant Username Structure:** In the pooler URI, the username is `postgres.[project-ref]` (e.g. `postgres.vbyqxzabcdefghijklmn`). The suffix after `postgres.` tells the pooler which project to connect to.
  > [!CAUTION]
  > **DO NOT** leave the literal string `yourprojectref` or `[project-ref]` in your `DATABASE_URL`. If you do, the Supabase pooler will reject the connection with:
  > `[DatabaseAdapter] CRITICAL: PostgreSQL connection failed in production: (ENOTFOUND) tenant/user postgres.yourprojectref not found`
  > Note that despite the `(ENOTFOUND)` text, this is a **Supabase pooler tenant lookup error**, NOT a DNS hostname resolution failure.
- **Password URL-Encoding:** If your database password contains special characters (such as `@`, `#`, `%`, `&`, `?`, `/`, etc.), you **MUST** URL-encode (percent-encode) them. For example, `#` becomes `%23`, `@` becomes `%40`, `%` becomes `%25`.
- **SSL Mode:** You may append `?sslmode=require` to the URI, but NOVARA's `dbAdapter.js` automatically enforces strict TLS encryption and CA certificate verification in production regardless.
- **Direct Connection Caveat:** While Direct Connection (`db.[project-ref].supabase.co:5432`) is supported by NOVARA, Supabase free-tier direct domains resolve exclusively to IPv6. Render web services operate on IPv4, so using Direct Connection may result in timeouts. Always use the **Transaction Pooler** or **Session Pooler** on Render.

#### Download the SSL CA Certificate:
1. In the same **Database** settings page (**Project Settings > Database**), scroll down to the **SSL Certificate** section.
2. Click **Download Certificate** to save `prod-ca-2021.crt`.
3. Open `prod-ca-2021.crt` in any text editor. You will need this entire PEM text (including `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`) for the `DATABASE_SSL_CA` variable on Render.

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
| `DATABASE_URL` | Server | Supabase Transaction Pooler URI (`postgresql://postgres.[PROJECT-REF]:[ENCODED-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`) |
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

### Step 12: Configure Google OAuth 2.0 Web Application Credentials

Production Google Sign-In requires an **OAuth 2.0 Web Application Client ID** configured with your exact Render domain.

#### 1. Open Google Cloud Console
1. Navigate to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Ensure you have selected your project (e.g. `NOVARA` or your placement prep project).

#### 2. Verify or Create Web Application OAuth Client
1. Under **OAuth 2.0 Client IDs**, check if you have an entry with **Application type: Web application**.
   > [!IMPORTANT]
   > The Client ID **must** be created as a **Web application** (not Android, iOS, or Desktop app).
2. If creating a new one: Click **Create Credentials** > **OAuth client ID** > Select **Web application** as the application type. Name it (e.g. `NOVARA Production Web`).
3. Click into your Web client ID to view its settings.

#### 3. Add Authorized JavaScript Origins
Under **Authorized JavaScript origins**, click **+ Add URI** and add:
- `https://novara-qzce.onrender.com` (Your live Render HTTPS URL)
- `http://localhost:3000` (For local development)

> [!CAUTION]
> **Zero Trailing Slash Rule:** Google Cloud strictly requires origins without trailing slashes. Use `https://novara-qzce.onrender.com` (NOT `https://novara-qzce.onrender.com/`).

#### 4. Add Authorized Redirect URIs
Under **Authorized redirect URIs**, click **+ Add URI** and add:
- `https://novara-qzce.onrender.com`
- `https://novara-qzce.onrender.com/api/auth/google`
- `http://localhost:3000`
- `http://localhost:3000/api/auth/google`

5. Click **Save** at the bottom of the page.
   *(Note: Google changes propagate within 1–5 minutes across Google's distributed authentication network).*

#### 5. Configure Environment Variables on Render
1. Copy the **Client ID** from Google Cloud Console. It follows the format:
   ```text
   <NUMERIC-PROJECT-ID>-<ALPHANUMERIC-HASH>.apps.googleusercontent.com
   ```
   *(Example: `939390230171-qnrmttdtha9e52hc0v6kebiaede68ssc.apps.googleusercontent.com`)*
2. In your **Render Dashboard** > **NOVARA Web Service** > **Environment** tab:
   - Set `GOOGLE_CLIENT_ID` to your copied Client ID.
   - Set `VITE_GOOGLE_CLIENT_ID` to your copied Client ID.
   - Set `APP_BASE_URL` to `https://novara-qzce.onrender.com`
   - Set `API_BASE_URL` to `https://novara-qzce.onrender.com/api`
   - Set `ALLOWED_ORIGINS` to `https://novara-qzce.onrender.com`
3. Click **Save Changes**. Render will automatically redeploy the service.

### Step 13: Verify Environment Variables
Ensure all frontend and backend URLs in Render Environment Variables match your live URL `https://novara-qzce.onrender.com`.

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

---

## Troubleshooting Production Database Connections

### 1. Error: `(ENOTFOUND) tenant/user postgres.yourprojectref not found`
- **Cause:** The database username in your `DATABASE_URL` contains an unreplaced placeholder (`yourprojectref` or `[project-ref]`).
- **Explanation:** In Supabase's pooler architecture, all connections go through `aws-0-[region].pooler.supabase.com`. Supavisor inspects the username `postgres.[project-ref]` to look up your tenant. If it does not recognize the project ref, it returns this error. Note: **This is NOT a DNS error**, despite the `(ENOTFOUND)` text.
- **Fix:** In Render Dashboard > Environment, edit `DATABASE_URL`. Replace `postgres.yourprojectref` with `postgres.<YOUR_ACTUAL_20_CHAR_PROJECT_REF>` (from Supabase Dashboard > Connect).

### 2. Error: `PRODUCTION_DATABASE_CONNECTION_FAILED: process.env.DATABASE_URL contains placeholder token ...`
- **Cause:** One of the documentation placeholder strings (e.g. `[YOUR-PASSWORD]`, `your_secure_password`, `aws-0-[region]`, `yourprojectref`) was pasted literally into Render.
- **Fix:** Double check all segments of `DATABASE_URL` in the Render Environment Variables tab and ensure each placeholder has been replaced with your actual values.

### 3. Error: `self-signed certificate` or `DEPTH_ZERO_SELF_SIGNED_CERT`
- **Cause:** The Supabase SSL CA certificate is missing or invalid on Render.
- **Fix:** In Supabase Dashboard > Project Settings > Database > SSL Certificate, download `prod-ca-2021.crt`. Copy the entire PEM text into the `DATABASE_SSL_CA` environment variable on Render.

### 4. Error: `ERR_INVALID_URL` or connection fails with authentication error
- **Cause:** The database password contains special characters like `#`, `@`, `%`, `&`, `?`, `/`, which breaks URI parsing if not URL-encoded.
- **Fix:** URL-encode the password. For example, if your password is `Secret#123@!`, encode it as `Secret%23123%40!`.

### 5. Connection Timeout with Direct Connection (`db.[project-ref].supabase.co`)
- **Cause:** Supabase free-tier direct domains resolve to IPv6 only. Render web services communicate over IPv4.
- **Fix:** Use the Supabase Connection Pooler (`aws-0-[region].pooler.supabase.com:6543`), which provides native IPv4 support.

---

## Troubleshooting Production Google OAuth

### 6. Error: `Error 401: invalid_client / The OAuth client was not found`
- **Cause:** The Google Client ID configured in Render is either a placeholder (e.g. `your_google_oauth_client_id.apps.googleusercontent.com`), has an invalid/malformed format, is from a deleted project, or was created as the wrong application type (e.g. Android instead of Web application).
- **Explanation:** Google's OAuth server checks the `client_id` query parameter against all registered client IDs. If it does not find an exact match in Google Cloud, it responds with `401: invalid_client`.
- **Fix:** 
  1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
  2. Verify you have a client under **OAuth 2.0 Client IDs** with type **Web application**.
  3. Copy the full Client ID (`<numbers>-<hash>.apps.googleusercontent.com`).
  4. In Render Dashboard > Environment, paste this value into both `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.
  5. Click **Save Changes**.

### 7. Error: `Error 400: redirect_uri_mismatch`
- **Cause:** `https://novara-qzce.onrender.com` is missing from the client's Authorized origins or redirect URIs in Google Cloud Console.
- **Fix:**
  1. In Google Cloud Console, click your Web Client ID to edit it.
  2. Under **Authorized JavaScript origins**, add `https://novara-qzce.onrender.com` (no trailing slash).
  3. Under **Authorized redirect URIs**, add `https://novara-qzce.onrender.com` and `https://novara-qzce.onrender.com/api/auth/google`.
  4. Click **Save**. Wait 1–3 minutes for Google's servers to sync.
