import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pngToDematteWebp } from "./lib/dematte-webp.mjs";
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../apps/web/public/art/monster");
const assets = process.argv[2];
const names = process.argv.slice(3);
let n = 0;
for (const f of names) {
  const srcPng = path.join(assets, `${f}.png`);
  const destPng = path.join(dir, `${f}.png`);
  const webp = path.join(dir, `${f}.webp`);
  const tmp = path.join(dir, `${f}.tmp.webp`);
  if (!fs.existsSync(srcPng) && !fs.existsSync(destPng)) continue;
  const png = fs.existsSync(srcPng) ? srcPng : destPng;
  try {
    await pngToDematteWebp(png, tmp, { size: 512 });
    fs.renameSync(tmp, webp);
    if (fs.existsSync(destPng)) fs.unlinkSync(destPng);
    n++;
    console.log("ok", f);
  } catch (e) {
    console.error("fail", f, e.message);
    try { fs.unlinkSync(tmp); } catch {}
  }
}
console.log("processed", n);
