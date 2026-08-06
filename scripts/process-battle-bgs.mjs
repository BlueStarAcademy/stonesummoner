/**
 * Convert battle BG PNGs in apps/web/public/art/battle/_src or assets/
 * into /art/battle/bg/{id}.webp + {id}-720.webp
 *
 * Usage: node scripts/process-battle-bgs.mjs [srcDir]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "apps/web/public/art/battle/bg");
const srcDir = path.resolve(
  process.argv[2] || path.join(root, "apps/web/public/art/battle/_src"),
);

fs.mkdirSync(outDir, { recursive: true });

const files = fs.existsSync(srcDir)
  ? fs.readdirSync(srcDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  : [];

if (!files.length) {
  console.error("No source images in", srcDir);
  process.exit(1);
}

for (const f of files) {
  const id = path.basename(f).replace(/\.(png|jpe?g|webp)$/i, "");
  const src = path.join(srcDir, f);
  const full = path.join(outDir, `${id}.webp`);
  const half = path.join(outDir, `${id}-720.webp`);
  await sharp(src)
    .resize(1080, 1920, { fit: "cover", position: "bottom" })
    .webp({ quality: 82 })
    .toFile(full);
  await sharp(src)
    .resize(720, 1280, { fit: "cover", position: "bottom" })
    .webp({ quality: 78 })
    .toFile(half);
  console.log("wrote", id);
}
console.log("done", files.length);
