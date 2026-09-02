/**
 * Server-Side Security, Rate Limiting, and Defensive Controls for NOVARA
 */

const RATE_LIMIT_WINDOWS = {
  AUTH: { windowMs: 60 * 1000, max: 30 },     // 30 auth requests per minute per IP
  AI: { windowMs: 60 * 1000, max: 40 },       // 40 AI analysis requests per minute per IP
  GENERAL: { windowMs: 60 * 1000, max: 200 }  // 200 general API requests per minute per IP
};

const rateLimitStore = new Map();

// Periodic cleanup of expired rate limit buckets (every 5 minutes)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (cleanupTimer.unref) cleanupTimer.unref();

/**
 * Check and apply rate limiting for a request
 */
export function checkRateLimit(req, category = 'GENERAL') {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const key = `${category}:${ip}`;
  const config = RATE_LIMIT_WINDOWS[category] || RATE_LIMIT_WINDOWS.GENERAL;
  const now = Date.now();

  let record = rateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + config.windowMs };
    rateLimitStore.set(key, record);
    return { allowed: true, remaining: config.max - 1 };
  }

  record.count++;
  if (record.count > config.max) {
    return { 
      allowed: false, 
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000) 
    };
  }

  return { allowed: true, remaining: config.max - record.count };
}

/**
 * Apply defensive security headers to HTTP responses
 */
export function applySecurityHeaders(res, req = null) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // CSP: safe policy allowing local app assets, Google SSO Identity services, Google Fonts, and data URIs
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://googleapis.com; frame-src 'self' https://accounts.google.com; object-src 'none'; base-uri 'self';"
  );

  // Controlled CORS handling (Strict origin matching - no wildcard in production)
  if (req) {
    const origin = req.headers['origin'];
    const envOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
      : [];
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://localhost', // Capacitor Android secure default HTTPS origin
      'capacitor://localhost', // Capacitor legacy / fallback origin
      ...envOrigins
    ];
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-File-Name, X-Target-Role');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }
  }
}

/**
 * Validate and sanitize external URLs (prevents javascript: and XSS vectors)
 */
export function sanitizeExternalUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  if (!trimmed) return '';

  // Prevent dangerous protocol injection
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return '';
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch (e) {
    // If not a full URL, check if it starts with safe https:// or http://
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      return trimmed;
    }
  }
  return '';
}

/**
 * Validate file signature (magic bytes) for uploaded roadmap documents
 */
export function validateFileSignature(buffer, declaredMimeType = '') {
  if (!buffer || buffer.length < 4) return false;

  // PDF: %PDF (25 50 44 46)
  const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  
  // PNG: \x89PNG (89 50 4E 47)
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

  // JPEG: \xFF\xD8\xFF
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

  // DOCX / ZIP: PK\x03\x04 (50 4B 03 04)
  const isDocxOrZip = buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;

  // Plain Text / Markdown: check if characters are printable ASCII/UTF-8
  const isText = buffer.slice(0, Math.min(buffer.length, 512)).every((byte) => (
    byte === 0x09 || byte === 0x0A || byte === 0x0D || (byte >= 0x20 && byte <= 0x7E) || byte >= 0x80
  ));

  if (isPdf || isPng || isJpeg || isDocxOrZip || isText) {
    return true;
  }

  return false;
}
