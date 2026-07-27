import fs from "node:fs";
import { transformSync } from "esbuild";

const c = fs.readFileSync("apps/web/src/main.ts", "utf8");
console.log("hangul", (c.match(/[\uac00-\ud7a3]/g) || []).length);
console.log("t(ui", (c.match(/t\("ui\./g) || []).length);
const q = c
  .split(/\n/)
  .map((l, i) => [i + 1, l])
  .filter(([, l]) => /\?\?\?/.test(l));
console.log("??? lines", q.length);
q.slice(0, 20).forEach(([n, l]) => console.log(n, l.trim().slice(0, 160)));

try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("esbuild: OK");
} catch (e) {
  console.log("esbuild FAIL:", e.message.slice(0, 800));
}
