const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to write an uncompressed/deflated raw RGBA PNG
function createPng(width, height, pixelShader) {
  const rowBytes = width * 4 + 1; // 1 filter byte per row
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = pixelShader(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc >>> 0, 8 + len);
  return chunk;
}

// CRC32 implementation for PNG
function crc32(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[n]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

// --- Shader Functions for NarraTV Brand Identity ---
// Palette: Obsidian #0B0E14, Surface #151A23, Amber #F59E0B, Narration Cobalt #3B82F6, Dialogue Emerald #10B981

// 512x512 Icon
function iconShader(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background gradient: Obsidian center (#151A23) to deep (#0B0E14)
  let r = 11 + Math.floor((1 - dist) * 10);
  let g = 14 + Math.floor((1 - dist) * 12);
  let b = 20 + Math.floor((1 - dist) * 15);

  // Rounded squircle boundary
  if (Math.abs(dx) > 0.88 || Math.abs(dy) > 0.88) {
    const rx = Math.max(0, Math.abs(dx) - 0.7);
    const ry = Math.max(0, Math.abs(dy) - 0.7);
    if (rx * rx + ry * ry > 0.035) {
      return [0, 0, 0, 0]; // Transparent outside
    }
  }

  // Glowing Outer Ring (Amber Focus)
  const ringDist = Math.abs(dist - 0.75);
  if (ringDist < 0.05) {
    const intensity = 1 - ringDist / 0.05;
    r = Math.min(255, r + Math.floor(245 * intensity * 0.9));
    g = Math.min(255, g + Math.floor(158 * intensity * 0.9));
    b = Math.min(255, b + Math.floor(11 * intensity * 0.9));
  }

  // Central Eye / Soundwave Icon
  // Stylized Audio Waveform Bars
  const nx = (x - cx) / (w * 0.35); // -1 to 1
  const ny = (y - cy) / (h * 0.35);
  
  if (Math.abs(nx) < 0.8) {
    // 5 soundwave bars
    const barIndex = Math.floor((nx + 0.8) / 0.32);
    const barCenterX = -0.8 + barIndex * 0.32 + 0.16;
    const barDistX = Math.abs(nx - barCenterX);
    
    // Heights for the 5 bars (AD visual wave)
    const heights = [0.35, 0.75, 0.95, 0.65, 0.40];
    const barHeight = heights[Math.min(4, Math.max(0, barIndex))] || 0.4;
    
    if (barDistX < 0.08 && Math.abs(ny) < barHeight) {
      // Golden Amber Wave Bar
      return [245, 158, 11, 255];
    }
  }

  return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b)), 255];
}

// 320x180 Fire TV Leanback Banner
function bannerShader(x, y, w, h) {
  const dx = x / w;
  const dy = y / h;

  // Obsidian gradient background
  let r = 11 + Math.floor(dy * 10);
  let g = 14 + Math.floor(dy * 12);
  let b = 20 + Math.floor(dx * 18);

  // Ambient Cobalt glow on right
  const glowDist = Math.hypot(dx - 0.8, dy - 0.5);
  if (glowDist < 0.6) {
    const factor = (1 - glowDist / 0.6);
    r += Math.floor(59 * factor * 0.4);
    g += Math.floor(130 * factor * 0.4);
    b += Math.floor(246 * factor * 0.6);
  }

  // Left Soundwave icon (scaled)
  const icx = 0.25;
  const icy = 0.5;
  const inx = (dx - icx) / 0.15;
  const iny = (dy - icy) / 0.35;

  if (Math.abs(inx) < 0.8) {
    const barIdx = Math.floor((inx + 0.8) / 0.32);
    const barCenterX = -0.8 + barIdx * 0.32 + 0.16;
    const barDistX = Math.abs(inx - barCenterX);
    const heights = [0.35, 0.75, 0.95, 0.65, 0.40];
    const barH = heights[Math.min(4, Math.max(0, barIdx))] || 0.4;
    if (barDistX < 0.08 && Math.abs(iny) < barH) {
      return [245, 158, 11, 255]; // Amber bars
    }
  }

  // Subtle Border
  if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
    return [36, 46, 62, 255];
  }

  return [Math.min(255, r), Math.min(255, g), Math.min(255, b), 255];
}

// 1920x1080 Splash Screen (Downscaled shader or 480x270 upscaled)
function splashShader(x, y, w, h) {
  const dx = (x - w / 2) / (w / 2);
  const dy = (y - h / 2) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  let r = 11;
  let g = 14;
  let b = 20;

  // Center subtle Amber vignette
  if (dist < 0.8) {
    const factor = (1 - dist / 0.8);
    r += Math.floor(245 * factor * 0.12);
    g += Math.floor(158 * factor * 0.08);
    b += Math.floor(11 * factor * 0.02);
  }

  // Central Icon
  const inx = dx / 0.12;
  const iny = dy / 0.22;
  if (Math.abs(inx) < 0.8) {
    const barIdx = Math.floor((inx + 0.8) / 0.32);
    const barCenterX = -0.8 + barIdx * 0.32 + 0.16;
    const barDistX = Math.abs(inx - barCenterX);
    const heights = [0.35, 0.75, 0.95, 0.65, 0.40];
    const barH = heights[Math.min(4, Math.max(0, barIdx))] || 0.4;
    if (barDistX < 0.08 && Math.abs(iny) < barH) {
      return [245, 158, 11, 255];
    }
  }

  return [Math.min(255, r), Math.min(255, g), Math.min(255, b), 255];
}

// Write assets
const assetsDir = path.resolve(__dirname, '../apps/firetv/assets');
fs.mkdirSync(assetsDir, { recursive: true });

console.log('Generating NarraTV Branded Assets...');

const iconPng = createPng(512, 512, iconShader);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconPng);
console.log('-> Created icon.png (512x512)');

fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), iconPng);
console.log('-> Created adaptive-icon.png (512x512)');

const bannerPng = createPng(320, 180, bannerShader);
fs.writeFileSync(path.join(assetsDir, 'tv-banner.png'), bannerPng);
console.log('-> Created tv-banner.png (320x180)');

const splashPng = createPng(1280, 720, splashShader);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), splashPng);
console.log('-> Created splash.png (1280x720)');

console.log('Asset generation complete!');
