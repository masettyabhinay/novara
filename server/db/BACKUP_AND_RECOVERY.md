# NOVARA Production Backup, Restore & Disaster Recovery Runbook

---

## 1. PostgreSQL Database Backup Architecture

### 1.1 Automated Snapshot Schedule
- **Managed Provider Automated Backups:** Continuous Write-Ahead Logging (WAL) with 30-day point-in-time recovery (PITR) on AWS RDS / Supabase / Neon / GCP Cloud SQL.
- **Automated Daily Logical Dumps:** Compressed logical snapshots generated nightly at `02:00 UTC` via `cron`:
```bash
pg_dump -Fc -v "$DATABASE_URL" -f "/backups/novara_backup_$(date +%Y%m%d_%H%M%S).dump"
```
- **Backup Retention Policy:**
  - Hourly WAL segments retained for 7 days
  - Daily snapshots retained for 30 days
  - Weekly snapshots retained for 90 days
  - Monthly snapshots retained for 365 days

### 1.2 Local Document Store Backup Fallback (Single Node)
- Server-side atomic writes retain an automatic fallback file `server/data/novara_db.json.bak` on every modification.
- Automatic self-healing on boot if JSON corruption is detected.

---

## 2. PostgreSQL Restore & Verification Runbook

### Step 1: Prepare Clean Target Database
```bash
createdb -h "$DB_HOST" -U "$DB_USER" novara_restored
```

### Step 2: Restore Logical Snapshot
```bash
pg_restore -v -h "$DB_HOST" -U "$DB_USER" -d novara_restored /backups/novara_backup_TIMESTAMP.dump
```

### Step 3: Run Integrity Assertions
```sql
SELECT count(*) FROM users;
SELECT count(*) FROM roadmaps;
SELECT count(*) FROM tasks;
SELECT count(*) FROM applications;
SELECT count(*) FROM calendar_events;
```

### Step 4: Promote and Update Connection String
Update `DATABASE_URL` in production container environment and perform zero-downtime rolling restart.

---

## 3. Object Storage (Roadmap Documents) Backup Strategy

1. **S3 / R2 Bucket Versioning:** Enabled on `STORAGE_BUCKET` to prevent accidental deletion or file overwrites.
2. **Cross-Region Replication (CRR):** Real-time replication to secondary disaster-recovery region (`STORAGE_REGION=us-west-2`).
3. **Lifecycle Rule:** Move uploaded documents older than 180 days to Infrequent Access (IA) tier.

---

## 4. Disaster Recovery Metrics
- **Recovery Point Objective (RPO):** `< 5 minutes` (via WAL stream)
- **Recovery Time Objective (RTO):** `< 15 minutes` (automated standby failover)
