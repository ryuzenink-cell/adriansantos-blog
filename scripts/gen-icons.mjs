// Gera ícones PWA placeholder (PNG) sem dependências externas.
// Desenha um "A" branco sobre fundo azul. Rode com: node scripts/gen-icons.mjs
//
// >>> Estes são PLACEHOLDERS. Substitua por ícones reais quando tiver a arte. <<<

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const BG = [26, 86, 219]; // #1a56db (azul)
const FG = [255, 255, 255]; // branco

// ---- CRC32 ----
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// Distância de ponto a segmento (para desenhar traços do "A").
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function makePng(size) {
  const N = size;
  // Geometria do "A".
  const apex = [N * 0.5, N * 0.24];
  const left = [N * 0.3, N * 0.76];
  const right = [N * 0.7, N * 0.76];
  const barY = N * 0.6;
  const barL = [N * 0.38, barY];
  const barR = [N * 0.62, barY];
  const w = N * 0.045; // meia-largura do traço

  const raw = Buffer.alloc((N * 4 + 1) * N);
  let o = 0;
  for (let y = 0; y < N; y++) {
    raw[o++] = 0; // filtro none
    for (let x = 0; x < N; x++) {
      const isA =
        distToSeg(x, y, apex[0], apex[1], left[0], left[1]) <= w ||
        distToSeg(x, y, apex[0], apex[1], right[0], right[1]) <= w ||
        distToSeg(x, y, barL[0], barL[1], barR[0], barR[1]) <= w;
      const [r, g, b] = isA ? FG : BG;
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
      raw[o++] = 255;
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(N, 0);
  ihdr.writeUInt32BE(N, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(resolve(root, 'public/icons'), { recursive: true });

const targets = [
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['public/apple-touch-icon.png', 180],
];

for (const [rel, size] of targets) {
  writeFileSync(resolve(root, rel), makePng(size));
  console.log(`wrote ${rel} (${size}x${size})`);
}
