/**
 * Install staged skill PNGs from Cursor assets root into ship WebP.
 *
 * Usage:
 *   node scripts/install-cursor-skill-batch.mjs --kind summoner fire_amp fire_nova
 *   node scripts/install-cursor-skill-batch.mjs --kind monster --queue docs/art/skill/regen-queue-stone_golem.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const kind = argVal("--kind") ?? "monster";
const queuePath = argVal("--queue");
const cursorAssets =
  process.env.CURSOR_ASSETS ||
  path.join(
    process.env.USERPROFILE || "",
    ".cursor/projects/c-Project-StoneSummoners/assets",
  );
const staging = path.join(root, "apps/web/public/art/_staging", kind, "skill");
fs.mkdirSync(staging, { recursive: true });

let stems = args.filter((a) => !a.startsWith("--") && a !== kind);
if (queuePath) {
  const queue = JSON.parse(
    fs.readFileSync(path.join(root, queuePath), "utf8"),
  );
  stems = queue.queue.map((row) => row.stem);
}

let copied = 0;
for (const stem of stems) {
  const src = path.join(cursorAssets, `${stem}.png`);
  if (!fs.existsSync(src)) {
    console.warn(`missing source: ${src}`);
    continue;
  }
  fs.copyFileSync(src, path.join(staging, `${stem}.png`));
  copied += 1;
}

console.log(`staged ${copied}/${stems.length} -> ${path.relative(root, staging)}`);
if (!copied) process.exit(1);

for (const stem of stems) {
  const r = spawnSync(
    process.execPath,
    [
      path.join(root, "scripts/install-skill-art.mjs"),
      "--kind",
      kind,
      "--file",
      stem,
      "--force",
    ],
    { stdio: "inherit", cwd: root },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}
