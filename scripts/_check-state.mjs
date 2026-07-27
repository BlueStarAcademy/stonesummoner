import fs from "fs";
import { transformSync } from "esbuild";

const c = fs.readFileSync("apps/web/src/main.ts", "utf8");
const m = c.match(/filter\(\s*\(l\)\s*=>\s*\/([^/]+)\//);
console.log({
  hangul: (c.match(/[\uac00-\ud7a3]/g) || []).length,
  regionDrop: c.includes("regionDropIcons"),
  regionDiff: c.includes("data-region-diff"),
  stageDirect: c.includes('data-stage="${s.id}"'),
  stageOpen: c.includes("data-stage-open"),
  entryModal: c.includes("function renderStageEntryModal"),
  badTicker: /\/\?\?\?\?\?\|/.test(c),
  suspicious: c.split("\n").filter((l) => /\?\?\?/.test(l)).length,
});
if (m) {
  try {
    new RegExp(m[1]);
    console.log("ticker regex OK");
  } catch (e) {
    console.log("ticker regex BAD", e.message);
  }
}
try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.log("esbuild BAD", e.message);
}

// print remaining ??? lines
for (const [i, l] of c.split("\n").entries()) {
  if (/\?\?\?/.test(l)) console.log(i + 1, l.slice(0, 140));
}
