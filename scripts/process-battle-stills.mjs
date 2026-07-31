import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pngToDematteWebp } from "./lib/dematte-webp.mjs";
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../apps/web/public/art/monster/battle");
let n = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".png"))) {
  const png = path.join(dir, f);
  const webp = path.join(dir, f.replace(/\.png$/i, ".webp"));
  await pngToDematteWebp(png, webp, { size: 768 });
  n++;
  console.log("wrote", path.basename(webp));
}
console.log("processed", n);
