import fs from "node:fs";
import { transformSync } from "esbuild";

let c = fs.readFileSync("apps/web/src/main.ts", "utf8");
const lines = c
  .split(/\n/)
  .map((l, i) => [i + 1, l])
  .filter(([, l]) => /aria-label=t\(/.test(l));
console.log("broken aria count", lines.length);
lines.forEach(([n, l]) => console.log(n, l.trim().slice(0, 200)));

// Fix: aria-label=t('ui.xxx') → aria-label="${t('ui.xxx')}"
c = c.replace(/aria-label=t\('ui\.([a-f0-9]+)'\)/g, 'aria-label="${t(\'ui.$1\')}"');

fs.writeFileSync("apps/web/src/main.ts", c, "utf8");
try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.log("FAIL", e.errors?.[0]);
}
console.log(
  "broken left",
  (c.match(/aria-label=t\(/g) || []).length,
);
