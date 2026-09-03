import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { ELEMENTS } from "./lib/monster-art-roster.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const families = (argVal("--families") || "forest_sprite,stone_golem,dragon_knight")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const output = path.resolve(
  root,
  argVal("--output") ||
    "docs/art/monster/battle-identity-pilot-sheet.webp",
);
const tile = 256;
const gap = 8;
const columns = 6;
const rows = families.length * ELEMENTS.length;
const width = columns * tile + (columns + 1) * gap;
const height = rows * tile + (rows + 1) * gap;
const monsterDir = path.join(root, "apps/web/public/art/monster");

const inputs = [];
let row = 0;
for (const family of families) {
  for (const element of ELEMENTS) {
    const artKey = `${family}_${element}`;
    const files = [
      path.join(monsterDir, `${artKey}.webp`),
      path.join(monsterDir, "battle", `${artKey}-front.webp`),
      path.join(monsterDir, "battle", `${artKey}-back.webp`),
      path.join(monsterDir, `${artKey}_awaken.webp`),
      path.join(monsterDir, "battle", `${artKey}-awaken-front.webp`),
      path.join(monsterDir, "battle", `${artKey}-awaken-back.webp`),
    ];
    for (const [column, file] of files.entries()) {
      if (!fs.existsSync(file)) throw new Error(`missing: ${file}`);
      const image = await sharp(file)
        .resize(tile, tile, { fit: "contain" })
        .flatten({ background: "#25202f" })
        .webp({ quality: 90 })
        .toBuffer();
      inputs.push({
        input: image,
        left: gap + column * (tile + gap),
        top: gap + row * (tile + gap),
      });
    }
    row += 1;
  }
}

await sharp({
  create: {
    width,
    height,
    channels: 3,
    background: "#110d18",
  },
})
  .composite(inputs)
  .webp({ quality: 88 })
  .toFile(output);

console.log(`wrote ${path.relative(root, output).replace(/\\/g, "/")}`);
