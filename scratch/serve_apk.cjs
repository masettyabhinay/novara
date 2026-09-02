const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8888;
const APK_PATH = path.resolve(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk');

if (!fs.existsSync(APK_PATH)) {
  console.error('APK file not found at:', APK_PATH);
  process.exit(1);
}

const stats = fs.statSync(APK_PATH);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

const server = http.createServer((req, res) => {
  if (req.url === '/download' || req.url === '/app-debug.apk') {
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="novara-debug.apk"',
      'Content-Length': stats.size
    });
    fs.createReadStream(APK_PATH).pipe(res);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Download NOVARA Android APK</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0B0F19;
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #151A28;
      border: 1px solid #232B3E;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 12px 36px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      background: rgba(45, 212, 191, 0.15);
      color: #2DD4BF;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 16px;
      letter-spacing: 0.05em;
    }
    h1 { margin: 0 0 8px 0; font-size: 26px; font-weight: 800; }
    p { color: #94A3B8; font-size: 14px; margin: 0 0 24px 0; line-height: 1.5; }
    .btn {
      display: block;
      background: #2DD4BF;
      color: #0B0F19;
      font-size: 16px;
      font-weight: 700;
      padding: 16px;
      border-radius: 12px;
      text-decoration: none;
      transition: transform 0.1s;
      box-shadow: 0 6px 20px rgba(45, 212, 191, 0.3);
    }
    .btn:active { transform: scale(0.98); }
    .meta { color: #64748B; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">ANDROID DEBUG APK</div>
    <h1>NOVARA</h1>
    <p>Placement Preparation & Career Acceleration Platform</p>
    <a class="btn" href="/download">Download APK (${sizeMb} MB)</a>
    <div class="meta">Package: com.novara.placement<br>Built from main branch</div>
  </div>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`APK transfer server running on port ${PORT}`);
  console.log(`Local Download URL: http://192.168.1.11:${PORT}`);
});
