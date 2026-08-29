/** Copy painted PNGs from Cursor assets into skill staging dirs. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const cursorAssets =
  process.env.CURSOR_ASSETS ||
  path.join(
    process.env.USERPROFILE || "",
    ".cursor/projects/c-Project-StoneSummoners/assets",
  );

const kinds = ["monster", "summoner", "ui"];
let copied = 0;

for (const kind of kinds) {
  const srcDir = path.join(cursorAssets, kind, "skill");
  const destDir = path.join(root, "apps/web/public/art/_staging", kind, "skill");
  fs.mkdirSync(destDir, { recursive: true });
  if (!fs.existsSync(srcDir)) continue;
  for (const name of fs.readdirSync(srcDir)) {
    if (!/\.(png|webp)$/i.test(name)) continue;
    fs.copyFileSync(path.join(srcDir, name), path.join(destDir, name));
    copied += 1;
  }
}

console.log(`sync-cursor-skill-pngs: copied=${copied}`);
