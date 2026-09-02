/**
 * Production Structured Logger for NOVARA
 * Outputs structured, sanitized log events without leaking passwords, tokens, API keys, or raw files.
 */

export const ERROR_CATEGORIES = {
  AUTH_ERROR: 'AUTH_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SYNC_ERROR: 'SYNC_ERROR',
  AI_ERROR: 'AI_ERROR',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  GENERAL_ERROR: 'GENERAL_ERROR'
};

const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'apikey',
  'ai_api_key',
  'jwt_secret',
  'storage_secret_key'
];

function sanitizeLogData(data) {
  if (!data) return data;
  if (typeof data === 'string') {
    // Redact Bearer tokens and passwords in raw strings
    return data
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]')
      .replace(/password[:=]\s*["']?[^"'\s,]+/gi, 'password=[REDACTED]');
  }
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeLogData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export class Logger {
  constructor(service = 'novara-server') {
    this.service = service;
    this.isProd = process.env.NODE_ENV === 'production';
  }

  info(message, meta = {}) {
    this._log('INFO', message, meta);
  }

  warn(message, meta = {}) {
    this._log('WARN', message, meta);
  }

  error(category, message, error = null, meta = {}) {
    const cat = ERROR_CATEGORIES[category] || ERROR_CATEGORIES.GENERAL_ERROR;
    const errorDetails = error
      ? {
          errorMessage: error.message || String(error),
          errorCategory: cat
        }
      : { errorCategory: cat };

    this._log('ERROR', message, { ...meta, ...errorDetails });
  }

  _log(level, message, meta) {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = sanitizeLogData(meta);

    if (this.isProd) {
      // JSON format for cloud log aggregators (Datadog, CloudWatch, GCP Logging)
      const payload = {
        timestamp,
        level,
        service: this.service,
        message,
        ...sanitizedMeta
      };
      console.log(JSON.stringify(payload));
    } else {
      // Readable format for local development
      const metaStr = Object.keys(sanitizedMeta).length > 0 ? ` ${JSON.stringify(sanitizedMeta)}` : '';
      if (level === 'ERROR') {
        console.error(`[${timestamp}] [${level}] ${message}${metaStr}`);
      } else if (level === 'WARN') {
        console.warn(`[${timestamp}] [${level}] ${message}${metaStr}`);
      } else {
        console.log(`[${timestamp}] [${level}] ${message}${metaStr}`);
      }
    }
  }
}

export const logger = new Logger();
