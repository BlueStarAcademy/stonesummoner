import fs from "node:fs";
import { transformSync } from "esbuild";

const c = fs.readFileSync("apps/web/src/main.ts", "utf8");
console.log({
  hangul: (c.match(/[\uac00-\ud7a3]/g) || []).length,
  tUi: (c.match(/t\('ui\./g) || []).length,
  brokenAria: (c.match(/aria-label=t\(/g) || []).length,
});

// show a few sample t() usages and SCROLL_KIND
const i = c.indexOf("SCROLL_KIND_LABEL");
console.log(c.slice(i, i + 250));

try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.log("FAIL", e.errors?.[0]);
}
