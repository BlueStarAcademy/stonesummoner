/**
 * Dematte painted circle PNGs → WebP.
 * Input: apps/web/public/art/battle/circle/_src/{id}.png
 * Output: apps/web/public/art/battle/circle/{id}.webp
 *
 * Usage: node scripts/process-battle-circles.mjs [srcDir]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pngToDematteWebp } from "./lib/dematte-webp.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "apps/web/public/art/battle/circle");
const srcDir = path.resolve(
  process.argv[2] || path.join(outDir, "_src"),
);

fs.mkdirSync(outDir, { recursive: true });
const files = fs.existsSync(srcDir)
  ? fs.readdirSync(srcDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  : [];

if (!files.length) {
  console.error("No source images in", srcDir);
  process.exit(1);
}

let n = 0;
for (const f of files) {
  const id = path.basename(f).replace(/\.(png|jpe?g|webp)$/i, "");
  const src = path.join(srcDir, f);
  const dst = path.join(outDir, `${id}.webp`);
  await pngToDematteWebp(src, dst, {
    size: 1024,
    lim: 40,
    fit: "contain",
    quality: 90,
  });
  n += 1;
  console.log("wrote", id);
}
console.log("processed", n, "circles");
