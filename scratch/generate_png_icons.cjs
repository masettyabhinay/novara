const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal pure Node PNG builder
function createPngBuffer(width, height, getRgbaAt) {
  // RGBA buffer with filter byte 0 at each scanline
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getRgbaAt(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calculateCrc32(body), 0);

  return Buffer.concat([len, body, crc]);
}

function calculateCrc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xEDB88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

// Color generator for NOVARA emblem
function getNovaraPixel(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const normX = x / w;
  const normY = y / h;

  // Background Terracotta Gradient: #D6653C -> #B34C25
  const bgR = Math.round(214 - (214 - 179) * ((normX + normY) / 2));
  const bgG = Math.round(101 - (101 - 76) * ((normX + normY) / 2));
  const bgB = Math.round(60 - (60 - 37) * ((normX + normY) / 2));

  // Rounded squircle radius check for non-maskable
  if (!isMaskable) {
    const cornerR = w * 0.25;
    const qx = Math.max(0, Math.abs(x - cx) - (cx - cornerR));
    const qy = Math.max(0, Math.abs(y - cy) - (cy - cornerR));
    const cornerDist = Math.sqrt(qx * qx + qy * qy);
    if (cornerDist > cornerR) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }
  }

  // Compass Outer Ring: radius ~ 30% of width
  const ringR = w * 0.30;
  const ringThickness = w * 0.032;
  if (Math.abs(dist - ringR) < ringThickness / 2) {
    return [255, 255, 255, 120]; // Semi-transparent white ring
  }

  // Center Pivot: radius ~ 4.5% of width
  const pivotR = w * 0.045;
  if (dist < pivotR) {
    if (dist < pivotR * 0.45) {
      return [200, 90, 50, 255]; // Center terracotta dot
    }
    return [250, 247, 242, 255]; // Cream pivot ring
  }

  // Compass Needle Arrow
  // North needle: pointing up (-Y)
  const needleW = w * 0.08;
  const needleLen = w * 0.28;
  if (dy < 0 && dy > -needleLen && Math.abs(dx) < needleW * (1 + dy / needleLen)) {
    if (dx < 0) {
      return [255, 255, 255, 255]; // Crisp white North side
    } else {
      return [232, 236, 239, 255]; // Light silver North side
    }
  }

  // South needle: pointing down (+Y)
  if (dy > 0 && dy < needleLen && Math.abs(dx) < needleW * (1 - dy / needleLen)) {
    if (dx < 0) {
      return [239, 232, 223, 255]; // Cream South side
    } else {
      return [220, 210, 195, 255]; // Darker cream South side
    }
  }

  // 4 Cardinal Dots
  const dotR = w * 0.015;
  const markers = [
    [cx, cy - ringR * 1.05],
    [cx, cy + ringR * 1.05],
    [cx - ringR * 1.05, cy],
    [cx + ringR * 1.05, cy]
  ];
  for (const [mx, my] of markers) {
    const mdist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
    if (mdist < dotR) {
      return [255, 255, 255, 200];
    }
  }

  return [bgR, bgG, bgB, 255];
}

const iconsDir = path.resolve('public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Generate 192x192
const png192 = createPngBuffer(192, 192, (x, y, w, h) => getNovaraPixel(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);

// Generate 512x512
const png512 = createPngBuffer(512, 512, (x, y, w, h) => getNovaraPixel(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);

// Generate Maskable 192x192
const pngMaskable192 = createPngBuffer(192, 192, (x, y, w, h) => getNovaraPixel(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192.png'), pngMaskable192);

// Generate Maskable 512x512
const pngMaskable512 = createPngBuffer(512, 512, (x, y, w, h) => getNovaraPixel(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), pngMaskable512);

console.log('✅ Generated genuine 192x192, 512x512, and maskable PNG icons in public/icons/');
