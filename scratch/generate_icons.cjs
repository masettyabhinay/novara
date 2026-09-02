const fs = require('fs');
const path = require('path');

const iconsDir = path.resolve('public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Standard SVG Icon (192x192 / 512x512)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="terracottaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D6653C" />
      <stop offset="100%" stop-color="#B34C25" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#7A2D12" flood-opacity="0.25"/>
    </filter>
  </defs>
  
  <!-- Background Card -->
  <rect width="512" height="512" rx="128" fill="url(#terracottaGrad)" />
  
  <!-- Outer Compass Ring -->
  <circle cx="256" cy="256" r="150" fill="none" stroke="#FFFFFF" stroke-width="16" stroke-opacity="0.35" />
  
  <!-- Compass Cardinal Markers -->
  <circle cx="256" cy="94" r="7" fill="#FFFFFF" />
  <circle cx="256" cy="418" r="7" fill="#FFFFFF" fill-opacity="0.6" />
  <circle cx="94" cy="256" r="7" fill="#FFFFFF" fill-opacity="0.6" />
  <circle cx="418" cy="256" r="7" fill="#FFFFFF" fill-opacity="0.6" />
  
  <!-- Dynamic Compass Pointer / Needle -->
  <g filter="url(#subtleShadow)">
    <!-- North Arrow (Solid Crisp White) -->
    <polygon points="256,118 296,256 256,228" fill="#FFFFFF" />
    <polygon points="256,118 216,256 256,228" fill="#E8ECEF" />
    
    <!-- South Arrow (Muted Off-White / Charcoal-tint) -->
    <polygon points="256,394 296,256 256,284" fill="#EFE8DF" />
    <polygon points="256,394 216,256 256,284" fill="#DCD2C3" />
    
    <!-- Center Pivot -->
    <circle cx="256" cy="256" r="22" fill="#FAF7F2" />
    <circle cx="256" cy="256" r="10" fill="#C85A32" />
  </g>
</svg>`;

// 2. Maskable SVG Icon (Safe zone margin for adaptive Android launcher icons)
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="terracottaGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D6653C" />
      <stop offset="100%" stop-color="#B34C25" />
    </linearGradient>
  </defs>
  
  <!-- Full Bleed Background for Maskable Icon -->
  <rect width="512" height="512" fill="url(#terracottaGradMask)" />
  
  <!-- Centered Scaled Emblem within 80% Safe Zone -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <circle cx="256" cy="256" r="150" fill="none" stroke="#FFFFFF" stroke-width="16" stroke-opacity="0.35" />
    
    <circle cx="256" cy="94" r="7" fill="#FFFFFF" />
    <circle cx="256" cy="418" r="7" fill="#FFFFFF" fill-opacity="0.6" />
    <circle cx="94" cy="256" r="7" fill="#FFFFFF" fill-opacity="0.6" />
    <circle cx="418" cy="256" r="7" fill="#FFFFFF" fill-opacity="0.6" />
    
    <polygon points="256,118 296,256 256,228" fill="#FFFFFF" />
    <polygon points="256,118 216,256 256,228" fill="#E8ECEF" />
    
    <polygon points="256,394 296,256 256,284" fill="#EFE8DF" />
    <polygon points="256,394 216,256 256,284" fill="#DCD2C3" />
    
    <circle cx="256" cy="256" r="22" fill="#FAF7F2" />
    <circle cx="256" cy="256" r="10" fill="#C85A32" />
  </g>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon, 'utf8');
fs.writeFileSync(path.join(iconsDir, 'icon-maskable.svg'), svgMaskable, 'utf8');
fs.writeFileSync(path.join('public', 'favicon.svg'), svgIcon, 'utf8');

console.log('✅ Generated official SVG icons in public/icons/');
