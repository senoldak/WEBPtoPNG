const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function generateMinimalIconPNG(width, height) {
  const rawPixels = Buffer.alloc(width * height * 4);
  const cornerRadius = width * 0.24;
  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Squircle Distance
      const dx = Math.max(0, Math.abs(x - cx) - (width / 2 - cornerRadius));
      const dy = Math.max(0, Math.abs(y - cy) - (height / 2 - cornerRadius));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > cornerRadius) {
        // Anti-aliased outer background edge
        const alpha = Math.max(0, 1 - (dist - cornerRadius));
        rawPixels[idx] = 0;
        rawPixels[idx + 1] = 0;
        rawPixels[idx + 2] = 0;
        rawPixels[idx + 3] = Math.floor(alpha * 255);
        continue;
      }

      // Sleek Dark Premium Background (#0F172A to #1E1B4B gradient)
      const ny = y / height;
      let r = Math.floor(15 * (1 - ny) + 30 * ny);
      let g = Math.floor(23 * (1 - ny) + 27 * ny);
      let b = Math.floor(42 * (1 - ny) + 75 * ny);

      // Border glow (Subtle stroke border)
      if (dist >= cornerRadius - 1.2) {
        r = Math.floor(r * 0.4 + 99 * 0.6);
        g = Math.floor(g * 0.4 + 102 * 0.6);
        b = Math.floor(b * 0.4 + 241 * 0.6);
      }

      // Minimalist Geometry: Two clean offset picture frame rectangles with a sleek arrow
      const nx = x / width;

      // Frame 1 (WebP - Left/Top) - Subtle outline
      const f1Left = 0.22, f1Right = 0.62, f1Top = 0.22, f1Bottom = 0.62;
      const borderW = 0.045;

      const isF1Border = (
        (nx >= f1Left && nx <= f1Right && Math.abs(ny - f1Top) <= borderW) ||
        (nx >= f1Left && nx <= f1Right && Math.abs(ny - f1Bottom) <= borderW) ||
        (ny >= f1Top && ny <= f1Bottom && Math.abs(nx - f1Left) <= borderW) ||
        (ny >= f1Top && ny <= f1Bottom && Math.abs(nx - f1Right) <= borderW)
      );

      // Frame 2 (PNG - Right/Bottom) - Accent Indigo fill/outline
      const f2Left = 0.38, f2Right = 0.78, f2Top = 0.38, f2Bottom = 0.78;

      const isF2Border = (
        (nx >= f2Left && nx <= f2Right && Math.abs(ny - f2Top) <= borderW) ||
        (nx >= f2Left && nx <= f2Right && Math.abs(ny - f2Bottom) <= borderW) ||
        (ny >= f2Top && ny <= f2Bottom && Math.abs(nx - f2Left) <= borderW) ||
        (ny >= f2Top && ny <= f2Bottom && Math.abs(nx - f2Right) <= borderW)
      );

      // Minimal Dot (Sun/Focus indicator in top-right of PNG frame)
      const dotDist = Math.sqrt(Math.pow(nx - 0.68, 2) + Math.pow(ny - 0.48, 2));

      if (isF2Border) {
        r = 168; g = 85; b = 247; // Violet accent
      } else if (isF1Border) {
        r = 99; g = 102; b = 241; // Indigo accent
      } else if (dotDist <= 0.055) {
        r = 52; g = 211; b = 153; // Emerald Dot
      }

      rawPixels[idx] = r;
      rawPixels[idx + 1] = g;
      rawPixels[idx + 2] = b;
      rawPixels[idx + 3] = 255;
    }
  }

  return createPNG(rawPixels, width, height);
}

function createPNG(pixels, width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdr);

  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0;
    const srcRowOffset = y * width * 4;
    pixels.copy(rawData, rowOffset + 1, srcRowOffset, srcRowOffset + width * 4);
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(4 + 4 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcVal = crc32(chunk.slice(4, 8 + length));
  chunk.writeUInt32BE(crcVal, 8 + length);
  return chunk;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

const iconsDir = path.join(__dirname, '..', 'icons');

[128, 48, 16].forEach(size => {
  const pngBuf = generateMinimalIconPNG(size, size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), pngBuf);
  console.log(`✔ Generated minimal vector icon: icon${size}.png`);
});

console.log('Minimal icons generated successfully!');
