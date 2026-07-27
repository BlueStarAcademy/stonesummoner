/**
 * Fix bare t('ui...') inside template literals that should be ${t('ui...')}
 */
import fs from "node:fs";
import { transformSync } from "esbuild";

let c = fs.readFileSync("apps/web/src/main.ts", "utf8");

// Find bare t('ui...') that are NOT already preceded by ${
const re = /(?<!\$\{)t\('ui\.[a-f0-9]+'\)/g;
const hits = [];
let m;
while ((m = re.exec(c))) {
  const before = c.slice(Math.max(0, m.index - 5), m.index);
  // skip if in non-template JS like flash(t(...)) or const x = t(...)
  // Heuristic: if inside a template (odd backtick count before), wrap it
  const head = c.slice(0, m.index);
  const ticks = (head.match(/`/g) || []).length;
  const inTemplate = ticks % 2 === 1;
  if (!inTemplate) continue;
  hits.push({ idx: m.index, text: m[0], before });
}

console.log("bare t() in templates:", hits.length);
hits.slice(0, 20).forEach((h) => {
  const line = c.slice(0, h.idx).split("\n").length;
  console.log(line, h.before + h.text);
});

// Replace from end so indices stay valid
for (let i = hits.length - 1; i >= 0; i--) {
  const h = hits[i];
  c = c.slice(0, h.idx) + "${" + h.text + "}" + c.slice(h.idx + h.text.length);
}

fs.writeFileSync("apps/web/src/main.ts", c, "utf8");
transformSync(c, { loader: "ts", target: "es2022" });
console.log("fixed + esbuild OK");

// re-count
const left = [];
const re2 = /(?<!\$\{)t\('ui\.[a-f0-9]+'\)/g;
while ((m = re2.exec(c))) {
  const ticks = (c.slice(0, m.index).match(/`/g) || []).length;
  if (ticks % 2 === 1) left.push(m.index);
}
console.log("remaining bare in templates:", left.length);
