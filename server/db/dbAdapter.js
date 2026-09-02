/**
 * Production Unified Database Adapter for NOVARA
 * Connects to managed PostgreSQL (Supabase / RDS / Neon) via DATABASE_URL
 * Enforces SSL certificate and hostname verification in production with custom CA support.
 * Local JSON document store is permitted ONLY in non-production development/test environments.
 */

import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;
import { parse as parseConnectionString } from 'pg-connection-string';
import * as localDb from '../db.js';

/**
 * Parses a CA certificate provided via environment variable, file path, or base64 string.
 * @param {string} rawCa - The raw CA input
 * @returns {string|null} The normalized PEM certificate string
 */
export function parseSslCa(rawCa) {
  if (!rawCa || typeof rawCa !== 'string') return null;
  const trimmed = rawCa.trim();
  if (!trimmed) return null;

  // 1. If it refers to an existing file path (e.g. Render Secret File mount)
  if (fs.existsSync(trimmed)) {
    try {
      const content = fs.readFileSync(trimmed, 'utf8').trim();
      if (content) return content;
    } catch {
      // Not readable or not a valid file path, proceed
    }
  }

  // 2. If it contains escaped newlines "\n", unescape them
  let normalized = trimmed;
  if (normalized.includes('\\n')) {
    normalized = normalized.replace(/\\n/g, '\n');
  }

  // 3. If it looks like raw PEM certificate
  if (normalized.includes('-----BEGIN CERTIFICATE-----')) {
    return normalized;
  }

  // 4. Try base64 decoding
  try {
    const decoded = Buffer.from(normalized, 'base64').toString('utf8');
    if (decoded.includes('-----BEGIN CERTIFICATE-----')) {
      return decoded;
    }
  } catch {
    // Not base64, proceed
  }

  return normalized;
}

class DatabaseAdapter {
  constructor() {
    this.databaseUrl = process.env.DATABASE_URL || '';
    this.isPostgresConfigured = Boolean(this.databaseUrl && this.databaseUrl.startsWith('postgres'));
    this.pool = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    let rawUrl = (process.env.DATABASE_URL || '').trim();
    // Strip surrounding quotes if accidentally included in environment variable
    if ((rawUrl.startsWith('"') && rawUrl.endsWith('"')) || (rawUrl.startsWith("'") && rawUrl.endsWith("'"))) {
      rawUrl = rawUrl.slice(1, -1).trim();
    }
    this.databaseUrl = rawUrl;
    this.isPostgresConfigured = Boolean(this.databaseUrl && this.databaseUrl.startsWith('postgres'));
    const isProduction = process.env.NODE_ENV === 'production';

    // In production, DATABASE_URL must be provided
    if (isProduction && !this.isPostgresConfigured) {
      console.error('[DatabaseAdapter] CRITICAL: DATABASE_URL is missing or invalid in production.');
      throw new Error('PRODUCTION_DATABASE_URL_MISSING: process.env.DATABASE_URL must be configured in production.');
    }

    if (this.isPostgresConfigured) {
      // Check for unreplaced placeholder strings in production
      const placeholderPatterns = [
        'yourprojectref',
        '[project-ref]',
        '<project-ref>',
        'your_secure_password',
        '[YOUR-PASSWORD]',
        '<YOUR-PASSWORD>',
        'aws-0-[region]',
        'aws-0-<region>'
      ];
      const detectedPlaceholder = placeholderPatterns.find(placeholder => 
        this.databaseUrl.toLowerCase().includes(placeholder.toLowerCase())
      );

      if (detectedPlaceholder && isProduction) {
        console.error(`[DatabaseAdapter] CRITICAL: DATABASE_URL contains unreplaced placeholder token: "${detectedPlaceholder}".`);
        console.error('[DatabaseAdapter] ACTION: In your Render Dashboard under Environment Variables, update DATABASE_URL with your actual Supabase project reference and password.');
        throw new Error(`PRODUCTION_DATABASE_CONNECTION_FAILED: process.env.DATABASE_URL contains placeholder token "${detectedPlaceholder}". Please configure your actual Supabase connection string in Render.`);
      }

      let parsed = null;
      try {
        const isSslNeeded = isProduction || 
                            this.databaseUrl.includes('supabase') || 
                            this.databaseUrl.includes('sslmode=') ||
                            Boolean(process.env.DATABASE_SSL_CA);

        // Strip sslmode query param so pg-connection-string does not override our ssl config with empty object
        const cleanUrl = this.databaseUrl.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
        parsed = parseConnectionString(cleanUrl);
        delete parsed.ssl;
        delete parsed.sslmode;

        let sslConfig = false;
        if (isSslNeeded) {
          const caCert = parseSslCa(process.env.DATABASE_SSL_CA);
          if (caCert) {
            sslConfig = {
              ca: caCert,
              rejectUnauthorized: true,
              servername: parsed.host || undefined
            };
            console.log('[DatabaseAdapter] SSL configured with supplied CA certificate and strict verification.');
          } else {
            // Proper secure TLS verification using standard root trust store
            sslConfig = {
              rejectUnauthorized: true,
              servername: parsed.host || undefined
            };
            if (isProduction) {
              console.log('[DatabaseAdapter] SSL configured with system root CA verification (rejectUnauthorized: true).');
            }
          }
        }

        const poolConfig = {
          ...parsed,
          port: parsed.port ? parseInt(parsed.port, 10) : 5432,
          ssl: sslConfig,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000
        };

        this.pool = new Pool(poolConfig);

        // Verify connectivity
        const client = await this.pool.connect();
        client.release();
        console.log('[DatabaseAdapter] Successfully connected to PostgreSQL database.');
      } catch (err) {
        if (isProduction) {
          if (err.message.includes('self-signed certificate') || err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
            console.error('[DatabaseAdapter] CRITICAL: Supabase SSL certificate verification failed.');
            console.error('[DatabaseAdapter] ACTION: Set the DATABASE_SSL_CA environment variable on Render with the Supabase CA certificate (from Supabase Dashboard > Project Settings > Database).');
          } else if (err.message.includes('tenant/user') && err.message.includes('not found')) {
            console.error('[DatabaseAdapter] CRITICAL: Supabase connection pooler could not find the specified tenant/project reference.');
            console.error('[DatabaseAdapter] CAUSE: The database username in DATABASE_URL has an invalid or placeholder Supabase project reference (e.g. postgres.yourprojectref).');
            console.error('[DatabaseAdapter] ACTION: In Render Dashboard > Environment, update DATABASE_URL with your actual Supabase connection string from Supabase Dashboard > Connect > Transaction pooler (or Session pooler / Direct connection). Ensure postgres.[project-ref] uses your real Supabase project reference ID, not a placeholder.');
          } else if (err.code === 'ENOTFOUND' && err.syscall === 'getaddrinfo') {
            console.error('[DatabaseAdapter] CRITICAL: DNS hostname resolution failed for database host:', parsed?.host || 'unknown');
            console.error('[DatabaseAdapter] ACTION: Ensure the database hostname in DATABASE_URL on Render is correct and resolvable.');
          } else if (err.code === 'ERR_INVALID_URL') {
            console.error('[DatabaseAdapter] CRITICAL: Malformed DATABASE_URL connection string.');
            console.error('[DatabaseAdapter] ACTION: If your database password contains special characters (e.g. #, @, %, &, ?), they must be URL-encoded (percent-encoded) in DATABASE_URL.');
          }
          console.error('[DatabaseAdapter] CRITICAL: PostgreSQL connection failed in production:', err.message);
          throw new Error(`PRODUCTION_DATABASE_CONNECTION_FAILED: ${err.message}`);
        }
        console.warn('[DatabaseAdapter] PostgreSQL connection failed. Falling back to local document store (development only):', err.message);
        this.isPostgresConfigured = false;
        this.pool = null;
      }
    } else {
      // Local development document store
      console.log('[DatabaseAdapter] Initialized with local persistent document store (server/data/novara_db.json).');
    }

    this.initialized = true;
  }

  async query(text, params = []) {
    if (this.isPostgresConfigured && this.pool) {
      const start = Date.now();
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.DEBUG_SQL) {
        console.log('[SQL Query]', { text, duration, rows: res.rowCount });
      }
      return res;
    }
    throw new Error('DATABASE_NOT_CONFIGURED');
  }

  async healthCheck() {
    if (this.isPostgresConfigured && this.pool) {
      try {
        const res = await this.pool.query('SELECT 1 AS ok');
        return {
          status: 'healthy',
          provider: 'postgresql',
          connected: res.rows?.[0]?.ok === 1
        };
      } catch (err) {
        return {
          status: 'degraded',
          provider: 'postgresql',
          connected: false,
          error: err.message
        };
      }
    }
    return {
      status: 'healthy',
      provider: 'local_document_store',
      connected: true
    };
  }

  // Proxied database functions (abstracting underlying storage)
  get local() {
    return localDb;
  }
}

export const dbAdapter = new DatabaseAdapter();
