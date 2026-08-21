/**
 * Rebuild monster portrait icons from opaque battle still PNGs.
 * Dematte was punching dark armor/cloth to alpha, so icons looked unfinished.
 *
 * Usage: node scripts/rebuild-portrait-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const battleDir = path.join(root, "apps/web/public/art/monster/battle");
const outDir = path.join(root, "apps/web/public/art/monster");

const ALIAS = {
  fire_fang: "wolf_fighter",
  ash_archer: "magic_archer",
  gale_scout: "scout_sniper",
  shield_tortoise: "steel_armor",
  mist_shaman: "lotus_dancer",
  seal_scholar: "seal_elder",
  thunder_lancer: "thunder_spear",
};

const ZOOM = 0.6;
const SIZE = 512;

async function bustCrop(srcPng, destWebp) {
  const meta = await sharp(srcPng).metadata();
  const w = meta.width ?? SIZE;
  const h = meta.height ?? SIZE;
  const crop = Math.round(Math.min(w, h) * ZOOM);
  const left = Math.max(0, Math.round((w - crop) / 2));
  const top = Math.max(0, Math.min(Math.round(h * 0.04), h - crop));
  const tmp = `${destWebp}.${process.pid}.tmp`;
  await sharp(srcPng)
    .extract({ left, top, width: crop, height: crop })
    .resize(SIZE, SIZE, { fit: "fill" })
    .flatten({ background: { r: 10, g: 8, b: 16 } })
    .webp({ quality: 90 })
    .toFile(tmp);
  await fs.promises.copyFile(tmp, destWebp);
  await fs.promises.unlink(tmp).catch(() => {});
}

const pngs = fs
  .readdirSync(battleDir)
  .filter((f) => f.endsWith("-front.png"))
  .sort();

let n = 0;
for (const f of pngs) {
  const key = f.replace(/-front\.png$/i, "");
  const dest = path.join(outDir, `${key}.webp`);
  await bustCrop(path.join(battleDir, f), dest);
  n += 1;
  console.log("portrait", key);
}

for (const [alias, family] of Object.entries(ALIAS)) {
  const src = path.join(outDir, `${family}.webp`);
  const dest = path.join(outDir, `${alias}.webp`);
  if (!fs.existsSync(src)) continue;
  await fs.promises.copyFile(src, dest);
  n += 1;
  console.log("alias", alias, "<-", family);
}

console.log("rebuilt", n);
