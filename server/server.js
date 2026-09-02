/**
 * Standalone Production HTTP Server for NOVARA v1.0
 * Serves optimized Vite static bundle from dist/ and handles all /api/ REST endpoints.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { apiMiddlewareHandler } from './apiMiddleware.js';
import { dbAdapter } from './db/dbAdapter.js';
import { logger } from './logger.js';
import { isValidGoogleClientId } from './authGoogle.js';

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function serveIndexHtml(res) {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    res.statusCode = 404;
    return res.end('Index Not Found');
  }

  const rawClientId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  let html = fs.readFileSync(indexPath, 'utf8');

  // If a valid Google Client ID is configured on the server, inject it at runtime
  if (isValidGoogleClientId(rawClientId)) {
    const scriptTag = `<script>window.NOVARA_GOOGLE_CLIENT_ID = ${JSON.stringify(rawClientId)};</script>\n  </head>`;
    html = html.replace('</head>', scriptTag);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.end(html);
}

async function startServer() {
  await dbAdapter.init();

  const server = http.createServer(async (req, res) => {
    const rawUrl = req.url || '/';
    const pathname = rawUrl.split('?')[0];

    // 1. Route API requests
    if (pathname.startsWith('/api/')) {
      return apiMiddlewareHandler(req, res, () => {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      });
    }

    // 2. Route Static Assets from dist/
    if (fs.existsSync(DIST_DIR)) {
      if (pathname === '/' || pathname === '/index.html') {
        return serveIndexHtml(res);
      }

      let filePath = path.join(DIST_DIR, pathname);

      // Path traversal security check
      if (!filePath.startsWith(DIST_DIR)) {
        res.statusCode = 403;
        return res.end('Access Denied');
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        // Cache control headers
        if (pathname.startsWith('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (pathname === '/sw.js' || pathname === '/manifest.json') {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }

        const stream = fs.createReadStream(filePath);
        return stream.pipe(res);
      }

      // SPA Fallback: Serve index.html for non-asset GET requests
      if (req.method === 'GET') {
        return serveIndexHtml(res);
      }
    }

    res.statusCode = 404;
    res.end('File Not Found');
  });

  server.listen(PORT, () => {
    logger.info(`NOVARA Production Server listening on port ${PORT}`, {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      distExists: fs.existsSync(DIST_DIR)
    });
  });

  return server;
}

// Start if run directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer().catch((err) => {
    logger.error('GENERAL_ERROR', 'Failed to launch production server', err);
    process.exit(1);
  });
}

export { startServer };
