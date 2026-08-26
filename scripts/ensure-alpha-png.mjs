/**
 * Ensure monster battle source has real alpha (transparent or chroma-keyed PNG).
 *
 * Usage:
 *   node scripts/ensure-alpha-png.mjs assets/monster/battle/wolf_fighter_fire-awaken-front.png
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  chromaKeyRgba,
  detectChromaPlate,
  detectPreAlpha,
  finishDematteRgba,
  zeroClearRgb,
} from "./lib/dematte-webp.mjs";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/ensure-alpha-png.mjs <png-or-webp>");
  process.exit(1);
}

const abs = path.resolve(src);
if (!fs.existsSync(abs)) {
  console.error("missing", abs);
  process.exit(1);
}

const { data, info } = await sharp(abs)
  .resize(1024, 1024, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    kernel: sharp.kernel?.lanczos3,
  })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const rgba = new Uint8ClampedArray(data);
let mode = "opaque";
if (await detectPreAlpha(abs)) {
  mode = "pre-alpha";
} else if (await detectChromaPlate(abs)) {
  chromaKeyRgba(rgba);
  mode = "chroma";
} else {
  console.error("no alpha or chroma plate — paint on transparency or magenta #FF00FF");
  process.exit(2);
}

await finishDematteRgba(rgba, info.width, info.height, {
  defringe: true,
  defringeLim: 28,
  defringeSilhouette: true,
  fillHoles: true,
  fillHolePasses: 3,
});
zeroClearRgb(rgba);

const out = abs.replace(/\.(webp|png|jpg|jpeg)$/i, "") + ".png";
await sharp(Buffer.from(rgba), {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png({ compressionLevel: 6 })
  .toFile(out);

console.log("wrote", out, "mode", mode);
