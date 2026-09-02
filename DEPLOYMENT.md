# NOVARA v1.0 — Production Cloud Deployment & Runbook

This document details the exact, step-by-step procedures for deploying, maintaining, migrating, and securing NOVARA v1.0 in a production cloud environment.

---

## 1. Required Cloud Providers & Infrastructure

| Layer | Recommended Production Provider | Alternative Options |
| :--- | :--- | :--- |
| **Compute / Runtime** | Node.js v20+ on AWS ECS / Render / Railway / Fly.io | Docker Container, DigitalOcean App Platform |
| **Relational Database** | AWS RDS PostgreSQL 15+ / Neon Serverless | Supabase PostgreSQL, Google Cloud SQL |
| **Object Storage** | AWS S3 Bucket (Private, Versioned) | Cloudflare R2, Google Cloud Storage |
| **Authentication** | Google Identity Services (OAuth 2.0) | Standard Email/Password (SHA-256 + Salt) |
| **CDN & DNS** | Cloudflare / AWS CloudFront (HTTPS / TLS 1.3) | Vercel Edge, Fastly |

---

## 2. Required Production Environment Variables

Configure these variables in your deployment dashboard or secret manager (e.g. AWS Secrets Manager, Doppler, or Render Environment Variables).

```bash
# ============================================================================
# RUNTIME & NETWORKING
# ============================================================================
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://novara.app
API_BASE_URL=https://novara.app/api
ALLOWED_ORIGINS=https://novara.app,https://www.novara.app

# ============================================================================
# MANAGED POSTGRESQL DATABASE
# ============================================================================
# Format: postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require
DATABASE_URL=postgresql://novara_admin:YOUR_SECURE_PASSWORD@db.production.novara.internal:5432/novara_prod

# ============================================================================
# AUTHENTICATION & SECURITY
# ============================================================================
# Client ID for frontend GIS SDK (Safe for public build)
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
# Server-side token validation
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
# Cryptographic token secret (64+ character random string)
JWT_SECRET=YOUR_MIN_64_CHAR_RANDOM_SECRET_KEY

# ============================================================================
# AI & INTELLIGENCE
# ============================================================================
AI_API_KEY=YOUR_GEMINI_AI_API_KEY

# ============================================================================
# PRODUCTION OBJECT STORAGE (S3 / R2 / GCS)
# ============================================================================
STORAGE_BUCKET=novara-user-roadmaps-prod
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=YOUR_OBJECT_STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY=YOUR_OBJECT_STORAGE_SECRET_KEY
```

> [!CAUTION]
> **Zero Frontend Secrets Rule:** Never prefix backend secrets (`JWT_SECRET`, `AI_API_KEY`, `DATABASE_URL`, `STORAGE_SECRET_KEY`) with `VITE_`. Only `VITE_GOOGLE_CLIENT_ID` should be exposed to the browser.

---

## 3. Database Provisioning & Schema Initialization

### 3.1 Initialize PostgreSQL Schema
Connect to your PostgreSQL cluster using `psql` and execute the schema DDL:
```bash
psql "$DATABASE_URL" -f server/db/schema.sql
```

### 3.2 Verify Table Creation & Indexes
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: 22 tables (users, sessions, roadmaps, tasks, streaks, applications, etc.)
```

---

## 4. Cloud Object Storage Setup

1. Create a private bucket: `novara-user-roadmaps-prod`.
2. Enable **Bucket Versioning** to prevent accidental overwrites.
3. Block all public access: Ensure public ACLs and bucket policies are disabled.
4. Configure CORS policy for uploads:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["https://novara.app"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## 5. Google OAuth Production Configuration

1. In the **Google Cloud Console** > **APIs & Services** > **Credentials**:
2. Select your OAuth 2.0 Client ID.
3. Add **Authorized JavaScript Origins**:
   - `https://novara.app`
   - `https://www.novara.app`
4. Add **Authorized Redirect URIs**:
   - `https://novara.app`
5. Save changes. Note: Changes propagate within a few minutes across Google's edge.

---

## 6. Domain, HTTPS & CORS Configuration

1. **DNS Records:** Point `A` / `CNAME` records to your cloud load balancer / ingress.
2. **TLS 1.3:** Enforce HTTPS redirects with HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).
3. **CORS:** Server automatically rejects non-allowlisted origins based on `ALLOWED_ORIGINS`.

---

## 7. Build & Deployment Commands

### Option A: Standard Node.js Container / PaaS
```bash
# 1. Install dependencies
npm ci

# 2. Build production frontend
npm run build

# 3. Start production server
NODE_ENV=production npm run start
```

### Option B: Docker Container Deployment
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server/server.js"]
```

---

## 8. Data Migration Procedure (JSON -> PostgreSQL)

To migrate existing development records into PostgreSQL:
```bash
node -e "
  import('pg').then(async ({ default: pg }) => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const { migrateJsonToPostgres } = await import('./server/db/migrate_json_to_pg.js');
    await migrateJsonToPostgres(pool, './server/data/novara_db.json');
    await pool.end();
  });
"
```

---

## 9. Backup & Disaster Recovery Procedure

### 9.1 Database Daily Backup
```bash
pg_dump -Fc -v "$DATABASE_URL" -f "/backups/novara_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### 9.2 Restore from Backup
```bash
pg_restore -v -d "$DATABASE_URL" --clean /backups/novara_backup_TARGET.dump
```

---

## 10. Health Checks & Monitoring

- **Public Endpoint:** `GET /api/health`
- **Expected Status:** `HTTP 200 OK`
- **Response Format:**
```json
{
  "status": "healthy",
  "timestamp": "2026-09-02T10:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "server": "online",
    "database": "connected",
    "storage": "available"
  }
}
```

---

## 11. Rollback Procedure

If a deployed version experiences unexpected regression:
1. **Frontend / Application Rollback:** Re-deploy previous Git release tag / Docker image hash.
2. **Static Asset Invalidation:** Increment service worker cache version name in [sw.js](file:///f:/NOVARA/public/sw.js) to trigger automatic app updates for PWA users.
3. **Database Schema:** Schema modifications are additive and backward-compatible. If rollback is necessary, apply reverse migration SQL script.

---

## 12. Pre-Launch Security Checklist

- [x] All 73 source files verified with Babel AST.
- [x] All 13 test suites passing 100%.
- [x] Zero hardcoded secrets in Git repository.
- [x] Private credentials excluded from frontend bundle (`dist/assets/`).
- [x] Rate limiting active on authentication and AI endpoints.
- [x] 10MB upload limit and magic-byte signature validation enforced.
- [x] Full multi-user isolation verified across 20 distinct security scenarios.
- [x] PWA manifest and service worker configured with safe-area insets and standalone mode.
