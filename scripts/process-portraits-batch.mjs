import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pngToDematteWebp } from "./lib/dematte-webp.mjs";
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../apps/web/public/art/monster");
const names = process.argv.slice(2);
let n = 0;
for (const f of names) {
  const png = path.join(dir, `${f}.png`);
  if (!fs.existsSync(png)) continue;
  await pngToDematteWebp(png, path.join(dir, `${f}.webp`), { size: 512 });
  fs.unlinkSync(png);
  n++;
  console.log("wrote", f);
}
console.log("processed", n);
