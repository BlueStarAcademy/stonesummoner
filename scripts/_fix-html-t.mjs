import fs from "node:fs";
import { transformSync } from "esbuild";

let c = fs.readFileSync("apps/web/src/main.ts", "utf8");

// HTML text: >t('ui…') → >${t('ui…')}
c = c.replace(/>(t\('ui\.[a-f0-9]+'\))/g, ">${$1}");
// Also between tags with only whitespace: > t('ui') 
c = c.replace(/>\s+(t\('ui\.[a-f0-9]+'\))/g, ">${$1}");

fs.writeFileSync("apps/web/src/main.ts", c, "utf8");
transformSync(c, { loader: "ts", target: "es2022" });
console.log("esbuild OK");
console.log(
  "bare HTML left",
  (c.match(/>t\('ui\./g) || []).length,
);
