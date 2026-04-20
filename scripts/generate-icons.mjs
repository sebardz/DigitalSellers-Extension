/**
 * Genera iconos PNG en 16/32/48/128 desde un SVG base.
 * Uso: `npm run generate:icons`
 *
 * Requiere `sharp` (devDependency).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ICONS_DIR = resolve(ROOT, "src/assets/icons");

if (!existsSync(ICONS_DIR)) mkdirSync(ICONS_DIR, { recursive: true });

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2968ff"/>
      <stop offset="100%" stop-color="#6a3dff"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="128" height="128" rx="28" fill="url(#g)"/>
  <text
    x="50%" y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    font-family="-apple-system, Segoe UI, Roboto, sans-serif"
    font-size="58"
    font-weight="800"
    fill="white"
    letter-spacing="-2"
  >DS</text>
</svg>
`.trim();

const sizes = [16, 32, 48, 128];

await Promise.all(
  sizes.map(async (size) => {
    const out = resolve(ICONS_DIR, `icon-${size}.png`);
    await sharp(Buffer.from(SVG))
      .resize(size, size, { fit: "contain" })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`  ✓ ${out}`);
  }),
);

// Guardamos también el SVG base para referencia / Chrome Web Store
writeFileSync(resolve(ICONS_DIR, "icon-source.svg"), SVG);
console.log("Done.");
