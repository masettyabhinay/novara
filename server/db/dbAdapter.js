/**
 * Production Unified Database Adapter for NOVARA
 * Connects to managed PostgreSQL (Supabase / RDS / Neon) via DATABASE_URL
 * In production, fails loudly if PostgreSQL is unavailable (NO silent fallback).
 * Local JSON document store is permitted ONLY in non-production development/test environments.
 */

import pg from 'pg';
const { Pool } = pg;
import * as localDb from '../db.js';

class DatabaseAdapter {
  constructor() {
    this.databaseUrl = process.env.DATABASE_URL || '';
    this.isPostgresConfigured = Boolean(this.databaseUrl && this.databaseUrl.startsWith('postgres'));
    this.pool = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    this.databaseUrl = process.env.DATABASE_URL || '';
    this.isPostgresConfigured = Boolean(this.databaseUrl && this.databaseUrl.startsWith('postgres'));
    const isProduction = process.env.NODE_ENV === 'production';

    // In production, DATABASE_URL must be provided
    if (isProduction && !this.isPostgresConfigured) {
      console.error('[DatabaseAdapter] CRITICAL: DATABASE_URL is missing or invalid in production.');
      throw new Error('PRODUCTION_DATABASE_URL_MISSING: process.env.DATABASE_URL must be configured in production.');
    }

    if (this.isPostgresConfigured) {
      try {
        const isSslNeeded = isProduction || 
                            this.databaseUrl.includes('supabase') || 
                            this.databaseUrl.includes('sslmode=require');

        this.pool = new Pool({
          connectionString: this.databaseUrl,
          ssl: isSslNeeded ? { rejectUnauthorized: false } : false,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000
        });

        // Verify connectivity
        const client = await this.pool.connect();
        client.release();
        console.log('[DatabaseAdapter] Successfully connected to PostgreSQL database.');
      } catch (err) {
        if (isProduction) {
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
