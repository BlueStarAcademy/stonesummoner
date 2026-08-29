/**
 * Audit painted skill icons for ship compliance:
 * - UI frame / heavy border (edge luminance)
 * - Portrait-style center mass (character bust vs effect emblem)
 * - Undersized WebP (likely upscaled legacy)
 *
 * Usage:
 *   node scripts/audit-skill-art.mjs
 *   node scripts/audit-skill-art.mjs --json docs/art/skill/skill-art-audit.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const jsonOut = argVal("--json");
const kinds = [
  { kind: "monster", dir: "apps/web/public/art/monster/skill" },
  { kind: "summoner", dir: "apps/web/public/art/summoner/skill" },
  { kind: "ui", dir: "apps/web/public/art/ui/skill" },
];

async function inspectIcon(full) {
  const name = path.basename(full);
  const meta = await sharp(full).metadata();
  const { data, info } = await sharp(full)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let edgeBright = 0;
  let edge = 0;
  let centerBright = 0;
  let center = 0;
  let opaque = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a < 20) continue;
      opaque += 1;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const onEdge = x < 10 || y < 10 || x >= w - 10 || y >= h - 10;
      const inCenter =
        x > w * 0.22 && x < w * 0.78 && y > h * 0.18 && y < h * 0.82;
      if (onEdge) {
        edge += 1;
        if (lum > 42) edgeBright += 1;
      }
      if (inCenter) {
        center += 1;
        if (lum > 78) centerBright += 1;
      }
    }
  }
  const edgeRatio = edge ? edgeBright / edge : 0;
  const centerRatio = center ? centerBright / center : 0;
  const stat = fs.statSync(full);
  const issues = [];
  if (meta.width !== 256 || meta.height !== 256) {
    issues.push(`size ${meta.width}x${meta.height}`);
  }
  if (stat.size < 12_000) issues.push("small-file");
  if (edgeRatio > 0.34) issues.push("ui-frame");
  if (centerRatio > 0.58 && edgeRatio > 0.22) issues.push("portrait");
  return {
    name,
    bytes: stat.size,
    edgeRatio: +edgeRatio.toFixed(3),
    centerRatio: +centerRatio.toFixed(3),
    issues,
    needsRegen: issues.length > 0,
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  totals: { files: 0, needsRegen: 0 },
  byKind: {},
  needsRegen: [],
};

for (const { kind, dir } of kinds) {
  const fullDir = path.join(root, dir);
  const files = fs
    .readdirSync(fullDir)
    .filter((f) => f.endsWith(".webp"))
    .sort();
  const rows = [];
  for (const f of files) {
    rows.push(await inspectIcon(path.join(fullDir, f)));
  }
  const needs = rows.filter((r) => r.needsRegen);
  report.byKind[kind] = {
    files: rows.length,
    needsRegen: needs.length,
    issueCounts: needs.reduce((acc, row) => {
      for (const issue of row.issues) acc[issue] = (acc[issue] ?? 0) + 1;
      return acc;
    }, {}),
  };
  report.totals.files += rows.length;
  report.totals.needsRegen += needs.length;
  for (const row of needs) {
    report.needsRegen.push({ kind, ...row });
  }
}

console.log(
  `skill art audit: ${report.totals.needsRegen}/${report.totals.files} need regen`,
);
for (const [kind, stats] of Object.entries(report.byKind)) {
  console.log(
    `  ${kind}: ${stats.needsRegen}/${stats.files} ${JSON.stringify(stats.issueCounts)}`,
  );
}

if (jsonOut) {
  const outPath = path.join(root, jsonOut);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`wrote ${path.relative(root, outPath)}`);
}
