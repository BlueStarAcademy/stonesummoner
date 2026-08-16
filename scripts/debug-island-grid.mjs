/**
 * Debug helper: overlay a percentage grid on the hub map, plus the landing pads
 * and land zones parsed out of main.ts, so placement can be checked against the
 * painted hex terraces.
 * Usage: node scripts/debug-island-grid.mjs [outPath]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "apps/web/public/art/home/home-island-tri@2x.webp");
const out = process.argv[2] ?? path.join(root, "tmp-island-grid.png");

const W = 900;
const H = 1350;

const main = fs.readFileSync(path.join(root, "apps/web/src/main.ts"), "utf8");

function section(name) {
  const start = main.indexOf(`const ${name} = [`);
  if (start < 0) throw new Error(`${name} not found in main.ts`);
  return main.slice(start, main.indexOf("] as const;", start));
}

const pads = [...section("ISLAND_LANDING_PADS").matchAll(/x:\s*([\d.]+),\s*y:\s*([\d.]+)/g)].map(
  (m) => ({ x: Number(m[1]), y: Number(m[2]) }),
);
const zones = [
  ...section("ISLAND_LAND_ZONES").matchAll(
    /cx:\s*([\d.]+),\s*cy:\s*([\d.]+),\s*rx:\s*([\d.]+),\s*ry:\s*([\d.]+)/g,
  ),
].map((m) => ({ cx: +m[1], cy: +m[2], rx: +m[3], ry: +m[4] }));

const lines = [];
for (let p = 5; p < 100; p += 5) {
  const x = Math.round((W * p) / 100);
  const y = Math.round((H * p) / 100);
  const major = p % 10 === 0;
  const w = major ? 3 : 1;
  lines.push(
    `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#ff2020" stroke-width="${w}" opacity="0.9"/>`,
    `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#2040ff" stroke-width="${w}" opacity="0.9"/>`,
  );
  if (major) {
    lines.push(
      `<text x="${x + 4}" y="30" font-size="26" font-family="Arial" font-weight="bold" fill="#ff2020">${p}</text>`,
      `<text x="6" y="${y - 6}" font-size="26" font-family="Arial" font-weight="bold" fill="#2040ff">${p}</text>`,
    );
  }
}

for (const z of zones) {
  lines.push(
    `<ellipse cx="${(W * z.cx) / 100}" cy="${(H * z.cy) / 100}" rx="${(W * z.rx) / 100}" ry="${(H * z.ry) / 100}" fill="#00ff9020" stroke="#00ff88" stroke-width="4" stroke-dasharray="12 8"/>`,
  );
}
for (const p of pads) {
  lines.push(
    `<circle cx="${(W * p.x) / 100}" cy="${(H * p.y) / 100}" r="16" fill="#ff00d080" stroke="#ffffff" stroke-width="4"/>`,
  );
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${lines.join("")}</svg>`;

await sharp(src)
  .resize(W, H, { fit: "fill" })
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .png()
  .toFile(out);

console.log(`wrote ${out}`);
