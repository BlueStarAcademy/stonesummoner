/**
 * Dematte battle still PNGs → WebP (safer lim), then asymmetric pad.
 *
 * Usage:
 *   node scripts/process-battle-stills.mjs
 *   node scripts/process-battle-stills.mjs --dir apps/web/public/art/summoner/battle
 *   node scripts/process-battle-stills.mjs --dir apps/web/public/art/monster/battle --staging outDir
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { pngToDematteWebp, BATTLE_STILL_DEMATTE } from "./lib/dematte-webp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const rel = argVal("--dir") || "apps/web/public/art/monster/battle";
const dir = path.resolve(root, rel);
const stagingArg = argVal("--staging");

if (!fs.existsSync(dir)) {
  console.error("missing dir", dir);
  process.exit(1);
}

// Separate dematte vs pad dirs so pad never overwrites its own input (Win EPERM).
const workRoot = stagingArg
  ? path.resolve(root, stagingArg)
  : path.join(
      root,
      "apps/web/public/art/_staging",
      rel.replace(/[\\/]+/g, "__") + "-process",
    );
const dematteDir = path.join(workRoot, "dematte");
const paddedDir = path.join(workRoot, "padded");
fs.mkdirSync(dematteDir, { recursive: true });
fs.mkdirSync(paddedDir, { recursive: true });

const pngs = fs.readdirSync(dir).filter((x) => x.endsWith(".png"));
let n = 0;
for (const f of pngs) {
  const png = path.join(dir, f);
  const webpName = f.replace(/\.png$/i, ".webp");
  await pngToDematteWebp(png, path.join(dematteDir, webpName), BATTLE_STILL_DEMATTE);
  n++;
  console.log("dematte", webpName);
}
console.log("dematted", n);

const dematteRel = path.relative(root, dematteDir).replace(/\\/g, "/");
const paddedRel = path.relative(root, paddedDir).replace(/\\/g, "/");
const r = spawnSync(
  process.execPath,
  [
    path.join(root, "scripts/pad-battle-stills.mjs"),
    "--dir",
    dematteRel,
    "--staging",
    paddedRel,
    "--force",
  ],
  { cwd: root, stdio: "inherit" },
);
if ((r.status ?? 1) !== 0) process.exit(r.status ?? 1);

for (const f of fs.readdirSync(paddedDir).filter((x) => x.endsWith(".webp") && !x.startsWith("_"))) {
  const dest = path.join(dir, f);
  const src = path.join(paddedDir, f);
  let ok = false;
  for (let i = 0; i < 10 && !ok; i++) {
    try {
      await fs.promises.copyFile(src, dest);
      ok = true;
    } catch {
      await new Promise((res) => setTimeout(res, 200 * (i + 1)));
    }
  }
  if (!ok) console.error("copy fail", f);
}
console.log("copied", n, "webps to", rel);
