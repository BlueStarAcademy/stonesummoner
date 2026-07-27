/**
 * Smoke: encoding gate + i18n key resolution for keys used in main.ts
 */
import fs from "node:fs";
import { transformSync } from "esbuild";
import { execSync } from "node:child_process";

execSync("node scripts/check-hangul.mjs", { stdio: "inherit" });

const main = fs.readFileSync("apps/web/src/main.ts", "utf8");
transformSync(main, { loader: "ts", target: "es2022" });
console.log("esbuild main.ts: OK");

const koSrc = fs.readFileSync("apps/web/src/i18n/messages/ko.ts", "utf8");
const m = koSrc.match(/const messages: MessageDict = ({[\s\S]*?});\s*\n\s*export default/);
if (!m) {
  console.error("could not parse ko.ts");
  process.exit(1);
}
const ko = JSON.parse(m[1]);

const keys = [
  ...main.matchAll(/t\('((?:ui|[a-z]+)\.[^']+)'\)/g),
  ...main.matchAll(/t\("((?:ui|[a-z]+)\.[^"]+)"\)/g),
].map((x) => x[1]);
const uniq = [...new Set(keys)];
const missing = uniq.filter((k) => !(k in ko));
console.log("t() keys used:", uniq.length, "missing:", missing.length);
if (missing.length) {
  console.error(missing.slice(0, 40));
  process.exit(1);
}

const mustHangul = uniq.filter((k) => k.startsWith("ui.") || k.startsWith("settings.")).slice(0, 20);
let bad = 0;
for (const k of mustHangul) {
  if (!/[\uac00-\ud7a3]/.test(ko[k])) {
    console.error("no hangul for", k, ko[k]);
    bad++;
  }
}
if (bad) process.exit(1);

console.log("sample", {
  settings: ko["settings.title"],
  normal: ko["ui.aef1a1e70e"],
  hard: ko["ui.3dfdef02ab"],
  hell: ko["ui.173366486b"],
  layout: Object.entries(ko).find(([k, v]) => v.includes("배치 편집"))?.[1],
});
console.log("SMOKE OK");
