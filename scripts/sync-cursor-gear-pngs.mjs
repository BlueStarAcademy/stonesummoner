/** Copy painted PNGs from Cursor assets root into assets/gear. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GEAR_ART_STEMS } from "./lib/gear-art-roster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const cursorAssets =
  process.env.CURSOR_ASSETS ||
  path.join(process.env.USERPROFILE || "", ".cursor/projects/c-project-StoneSummoner/assets");
const dest = path.join(root, "assets/gear");
fs.mkdirSync(dest, { recursive: true });

let copied = 0;
for (const stem of GEAR_ART_STEMS) {
  const src = path.join(cursorAssets, `${stem}.png`);
  if (!fs.existsSync(src)) continue;
  fs.copyFileSync(src, path.join(dest, `${stem}.png`));
  copied += 1;
}
console.log(`sync-cursor-gear-pngs: copied=${copied} -> ${dest}`);
