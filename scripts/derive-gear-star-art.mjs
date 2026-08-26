/**
 * Derive missing ★ grades from painted anchor PNGs (s3 or s5) per family.
 * Family = weapon-{element} or {slot}-{material}
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  GEAR_COMMON_SLOTS,
  GEAR_ELEMENTS,
  GEAR_MATERIALS,
  GEAR_STAR_LEVELS,
} from "./lib/gear-art-roster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const gearPng = path.join(root, "assets/gear");

function anchorPath(family) {
  for (const s of [5, 4, 3, 2, 1]) {
    const p = path.join(gearPng, `${family}-s${s}.png`);
    if (fs.existsSync(p)) return { path: p, star: s };
  }
  return null;
}

function starMod(target, anchorStar) {
  const delta = target - anchorStar;
  return {
    brightness: 1 + delta * 0.04,
    saturation: 1 + delta * 0.05,
  };
}

async function deriveFamily(family) {
  const anchor = anchorPath(family);
  if (!anchor) return 0;
  let n = 0;
  for (const star of GEAR_STAR_LEVELS) {
    const dst = path.join(gearPng, `${family}-s${star}.png`);
    if (fs.existsSync(dst)) continue;
    const mod = starMod(star, anchor.star);
    await sharp(anchor.path)
      .resize(512, 512, {
        fit: "contain",
        background: { r: 10, g: 10, b: 10, alpha: 1 },
      })
      .modulate({ brightness: mod.brightness, saturation: mod.saturation })
      .png()
      .toFile(dst);
    n += 1;
    console.log(`derive ${family}-s${star}.png`);
  }
  return n;
}

let total = 0;
for (const el of GEAR_ELEMENTS) {
  total += await deriveFamily(`weapon-${el}`);
}
for (const slot of GEAR_COMMON_SLOTS) {
  for (const mat of GEAR_MATERIALS) {
    total += await deriveFamily(`${slot}-${mat}`);
  }
}
console.log(`derive-gear-star-art: wrote=${total}`);
