const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPngBuffer(width, height, r = 99, g = 102, b = 241) {
  // Color type 2 (RGB), 8 bit
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw pixel data: each scanline starts with filter byte 0, then width * 3 bytes (RGB)
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      const factor = (x + y) / (width + height);
      rawData[pxOffset] = Math.min(255, Math.floor(r * (1 - factor * 0.3)));
      rawData[pxOffset + 1] = Math.min(255, Math.floor(g * (1 - factor * 0.2)));
      rawData[pxOffset + 2] = Math.min(255, Math.floor(b + (255 - b) * factor));
    }
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
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon16.png'), createPngBuffer(16, 16));
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), createPngBuffer(48, 48));
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), createPngBuffer(128, 128));

console.log('Icons generated successfully.');
