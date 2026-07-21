/**
 * Generates the default Open Graph image (1200×630) and apple-touch-icon
 * from inline SVG, using sharp. Run once (npm run og); outputs are committed,
 * so the production build doesn't need sharp.
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, '..', 'public');
mkdirSync(join(pub, 'og'), { recursive: true });

const SITE = 'Billowatt';
const TAGLINE = 'What every plug in your home really costs';
const SUB = 'Current rates for all 50 states · 140+ appliances · free calculators';

const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b111a"/>
      <stop offset="0.6" stop-color="#141d29"/>
      <stop offset="1" stop-color="#1e2a3a"/>
    </linearGradient>
    <linearGradient id="bolt" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbbf24"/>
      <stop offset="1" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(80,120)">
    <rect width="120" height="120" rx="26" fill="url(#bolt)"/>
    <path d="M66 15 L26 68 H56 L48 105 L94 49 H62 L66 15 Z" fill="#0b111a" opacity="0.92"/>
  </g>
  <text x="230" y="205" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="800" fill="#ffffff">${SITE}</text>
  <text x="82" y="360" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700" fill="#fbbf24">${TAGLINE}</text>
  <text x="82" y="430" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#a8b3c2">${SUB}</text>
  <g transform="translate(82,485)">
    <rect x="0" y="0" width="560" height="14" rx="7" fill="#2b3a4d"/>
    <rect x="0" y="0" width="410" height="14" rx="7" fill="url(#bolt)"/>
    <rect x="0" y="34" width="560" height="14" rx="7" fill="#2b3a4d"/>
    <rect x="0" y="34" width="240" height="14" rx="7" fill="url(#bolt)"/>
    <rect x="0" y="68" width="560" height="14" rx="7" fill="#2b3a4d"/>
    <rect x="0" y="68" width="120" height="14" rx="7" fill="url(#bolt)"/>
  </g>
</svg>`;

const icon = `
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbbf24"/>
      <stop offset="1" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="40" fill="url(#g)"/>
  <path d="M98 22 L39 101 H84 L73 158 L141 73 H93 L98 22 Z" fill="#0b111a" opacity="0.92"/>
</svg>`;

await sharp(Buffer.from(og)).png().toFile(join(pub, 'og', 'default.png'));
await sharp(Buffer.from(icon)).png().toFile(join(pub, 'apple-touch-icon.png'));
console.log('Generated public/og/default.png and public/apple-touch-icon.png');
