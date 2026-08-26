/**
 * Bootstrap ★1–5 + material gear icons from legacy set/element WebP.
 * Upscale 512² with subtle per-star grade modulation until painted stems land.
 *
 * Usage: node scripts/bootstrap-gear-star-art.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { GEAR_ART_STEMS } from "./lib/gear-art-roster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const gearDir = path.join(root, "apps/web/public/art/ui/gear");

const MATERIAL_SET = {
  cloth: "mana",
  leather: "tempo",
  chain: "guardian",
  plate: "assault",
};

function legacySrc(stem) {
  const weapon = stem.match(/^weapon-(fire|water|wind|light|dark)-s[1-5]$/);
  if (weapon) {
    const p = path.join(gearDir, `weapon-${weapon[1]}.webp`);
    if (fs.existsSync(p)) return p;
    return path.join(gearDir, `weapon-${weapon[1]}.svg`);
  }
  const common = stem.match(
    /^(top|bottom|shoes|ring|necklace)-(cloth|leather|chain|plate)-s[1-5]$/,
  );
  if (!common) return null;
  const set = MATERIAL_SET[common[2]];
  const slot = common[1];
  const setPath = path.join(gearDir, `${slot}-${set}.webp`);
  if (fs.existsSync(setPath)) return setPath;
  const slotPath = path.join(gearDir, `${slot}.webp`);
  if (fs.existsSync(slotPath)) return slotPath;
  return path.join(gearDir, `${slot}.svg`);
}

function starMod(stem) {
  const star = Number(stem.match(/s([1-5])$/)?.[1] ?? 3);
  return {
    brightness: 0.9 + (star - 1) * 0.035,
    saturation: 0.95 + (star - 1) * 0.04,
  };
}

let wrote = 0;
let skipped = 0;
let failed = 0;

for (const stem of GEAR_ART_STEMS) {
  const dst = path.join(gearDir, `${stem}.webp`);
  if (fs.existsSync(dst)) {
    skipped += 1;
    continue;
  }
  const src = legacySrc(stem);
  if (!src || !fs.existsSync(src)) {
    failed += 1;
    console.warn(`no legacy source for ${stem}`);
    continue;
  }
  const mod = starMod(stem);
  const isSvg = src.endsWith(".svg");
  let pipeline = isSvg ? sharp(src, { density: 300 }) : sharp(src);
  pipeline = pipeline
    .resize(512, 512, {
      fit: "contain",
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    })
    .modulate({ brightness: mod.brightness, saturation: mod.saturation })
    .webp({ quality: 92, alphaQuality: 100 });
  await pipeline.toFile(dst);
  wrote += 1;
  console.log(`bootstrap ${stem}.webp`);
}

console.log(`bootstrap-gear-star-art: wrote=${wrote} skipped=${skipped} failed=${failed}`);
