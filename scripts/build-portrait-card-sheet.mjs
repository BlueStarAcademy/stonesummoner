import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

const families = (
  argVal("--families") ?? "forest_sprite,stone_golem,dragon_knight"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const elements = ["fire", "water", "wind", "light", "dark"];
const cell = Number(argVal("--cell") ?? 256);
const output = path.resolve(
  root,
  argVal("--output") ?? "docs/art/monster/portrait-card-pilot-sheet.webp",
);
const portraitDir = path.join(root, "apps/web/public/art/monster");

const width = elements.length * cell;
const height = families.length * 2 * cell;
const composites = [];

for (let familyIndex = 0; familyIndex < families.length; familyIndex += 1) {
  const family = families[familyIndex];
  for (let awakenIndex = 0; awakenIndex < 2; awakenIndex += 1) {
    for (let elementIndex = 0; elementIndex < elements.length; elementIndex += 1) {
      const element = elements[elementIndex];
      const name = `${family}_${element}${awakenIndex ? "_awaken" : ""}`;
      const source = path.join(portraitDir, `${name}.webp`);
      if (!fs.existsSync(source)) {
        throw new Error(`missing portrait-card: ${source}`);
      }
      const image = await sharp(source)
        .resize(cell, cell, { fit: "cover", position: "centre" })
        .webp({ quality: 92 })
        .toBuffer();
      const label = Buffer.from(
        `<svg width="${cell}" height="${cell}" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="${cell - 26}" width="${cell}" height="26" fill="#07050ccc"/>
          <text x="8" y="${cell - 8}" fill="#fff8e8" font-family="Arial,sans-serif" font-size="13" font-weight="700">${name}</text>
        </svg>`,
      );
      const left = elementIndex * cell;
      const top = (familyIndex * 2 + awakenIndex) * cell;
      composites.push({ input: image, left, top });
      composites.push({ input: label, left, top });
    }
  }
}

await fs.promises.mkdir(path.dirname(output), { recursive: true });
await sharp({
  create: {
    width,
    height,
    channels: 3,
    background: "#17131f",
  },
})
  .composite(composites)
  .webp({ quality: 92, effort: 6 })
  .toFile(output);

console.log(`portrait-card sheet: ${output} (${width}x${height})`);
