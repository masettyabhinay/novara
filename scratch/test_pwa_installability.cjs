const fs = require('fs');
const path = require('path');

function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ PWA Test Failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function run() {
  console.log('================================================================');
  console.log('📱 TESTING NOVARA v1.0 INSTALLABLE ANDROID / PWA SPECIFICATIONS');
  console.log('================================================================\n');

  // 1. Manifest Existence and Content
  console.log('[1] Verifying Web App Manifest...');
  const manifestPath = path.resolve('public', 'manifest.json');
  assert(fs.existsSync(manifestPath), 'public/manifest.json exists');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.name === 'NOVARA — Placement Preparation', 'Manifest name is exact');
  assert(manifest.short_name === 'NOVARA', 'Manifest short_name is exact');
  assert(manifest.display === 'standalone', 'Display mode is standalone');
  assert(manifest.orientation === 'portrait-primary', 'Orientation is portrait-primary');
  assert(manifest.start_url === '/', 'Start URL is root (/)');
  assert(manifest.scope === '/', 'Scope is root (/)');
  assert(manifest.theme_color === '#C85A32', 'Theme color is NOVARA Terracotta (#C85A32)');
  assert(manifest.background_color === '#FAF7F2', 'Background color is NOVARA Warm Cream (#FAF7F2)');
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 4, 'Manifest contains all required icons');

  // 2. Icon Assets Verification
  console.log('\n[2] Verifying PWA Icon Assets (192x192, 512x512, Maskable)...');
  const icon192 = path.resolve('public', 'icons', 'icon-192.png');
  const icon512 = path.resolve('public', 'icons', 'icon-512.png');
  const iconMask192 = path.resolve('public', 'icons', 'icon-maskable-192.png');
  const iconMask512 = path.resolve('public', 'icons', 'icon-maskable-512.png');
  const iconSvg = path.resolve('public', 'icons', 'icon.svg');

  assert(fs.existsSync(icon192), '192x192 standard icon exists');
  assert(fs.existsSync(icon512), '512x512 standard icon exists');
  assert(fs.existsSync(iconMask192), '192x192 maskable icon exists');
  assert(fs.existsSync(iconMask512), '512x512 maskable icon exists');
  assert(fs.existsSync(iconSvg), 'Brand SVG icon exists');

  // 3. Service Worker Verification
  console.log('\n[3] Verifying Service Worker & Caching Rules...');
  const swPath = path.resolve('public', 'sw.js');
  assert(fs.existsSync(swPath), 'public/sw.js exists');
  const swContent = fs.readFileSync(swPath, 'utf8');

  assert(swContent.includes('novara-app-shell'), 'Service worker specifies versioned cache name');
  assert(swContent.includes('/api/'), 'Service worker explicitly skips /api/ routes (preserves private data security)');
  assert(swContent.includes('SKIP_WAITING'), 'Service worker handles SKIP_WAITING for seamless version upgrades');

  // 4. HTML Meta Tags Verification
  console.log('\n[4] Verifying index.html PWA tags & Viewport...');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert(htmlContent.includes('rel="manifest"'), 'index.html links to manifest.json');
  assert(htmlContent.includes('viewport-fit=cover'), 'index.html includes viewport-fit=cover for safe-area insets');
  assert(htmlContent.includes('apple-mobile-web-app-capable'), 'index.html includes apple mobile standalone capability');
  assert(htmlContent.includes('theme-color'), 'index.html includes theme-color meta tag');

  // 5. CSS Safe Area & Touch Action Rules
  console.log('\n[5] Verifying Safe Area Insets in index.css...');
  const cssContent = fs.readFileSync(path.resolve('src', 'index.css'), 'utf8');
  assert(cssContent.includes('safe-area-inset-top'), 'index.css defines safe-area-inset-top');
  assert(cssContent.includes('safe-area-inset-bottom'), 'index.css defines safe-area-inset-bottom');
  assert(cssContent.includes('touch-action: manipulation'), 'index.css optimizes touch-action for mobile tap responsiveness');

  console.log('\n================================================================');
  console.log('🎉 ALL PWA & ANDROID INSTALLABILITY TESTS PASSED!');
  console.log('================================================================');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
