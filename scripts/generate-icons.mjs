import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const svg = readFileSync(join(root, 'public/favicon.svg'));
const outDir = join(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

const targets = [
  { name: 'icon-192.png', size: 192, padding: 0 },
  { name: 'icon-512.png', size: 512, padding: 0 },
  { name: 'icon-maskable-512.png', size: 512, padding: 64 },
];

for (const t of targets) {
  const inner = t.size - t.padding * 2;
  const buf = await sharp(svg, { density: 400 })
    .resize(inner, inner, { fit: 'contain', background: { r: 13, g: 11, b: 8, alpha: 1 } })
    .extend({
      top: t.padding,
      bottom: t.padding,
      left: t.padding,
      right: t.padding,
      background: { r: 13, g: 11, b: 8, alpha: 1 },
    })
    .png()
    .toBuffer();
  writeFileSync(join(outDir, t.name), buf);
  console.log('wrote', t.name);
}
