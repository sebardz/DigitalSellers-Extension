/**
 * Empaqueta el `dist/` en un .zip listo para subir al Chrome Web Store.
 *
 * Uso: `npm run pack` (corre build primero).
 */

import { existsSync, createWriteStream, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const RELEASES = resolve(ROOT, "releases");

if (!existsSync(DIST)) {
  console.error('No existe "dist/". Correr `npm run build` primero.');
  process.exit(1);
}
if (!existsSync(RELEASES)) mkdirSync(RELEASES);

const pkg = JSON.parse(await readFile(resolve(ROOT, "package.json"), "utf8"));
const outFile = resolve(RELEASES, `digitalsellers-hub-v${pkg.version}.zip`);

// Usamos PowerShell Compress-Archive en Windows (built-in, sin deps)
console.log(`Empaquetando ${DIST} → ${outFile}`);
execSync(
  `powershell -Command "Compress-Archive -Path '${DIST}/*' -DestinationPath '${outFile}' -Force"`,
  { stdio: "inherit" },
);
console.log(`✓ Listo: ${outFile}`);
