/**
 * Fail if apps/web/src/main.ts Hangul was corrupted to '?'.
 * Run: node scripts/check-hangul.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const mainPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/src/main.ts",
);
const cur = fs.readFileSync(mainPath, "utf8");
const hangul = (cur.match(/[\uac00-\ud7a3]/g) || []).length;
const bad = cur
  .split(/\r?\n/)
  .map((l, i) => [i + 1, l])
  .filter(
    ([, l]) =>
      /\?\?\?/.test(l) &&
      !/localStorage|\?\? [A-Za-z_(]/.test(l) &&
      /["'`]/.test(l),
  );

console.log("hangul chars:", hangul);
console.log("suspicious ??? UI lines:", bad.length);
if (hangul < 1500) {
  console.error("FAIL: Hangul count too low — file encoding likely corrupted");
  process.exit(1);
}
if (bad.length > 30) {
  console.error("FAIL: too many ??? string literals");
  bad.slice(0, 20).forEach(([n, l]) => console.error(n + ":", l.trim().slice(0, 100)));
  process.exit(1);
}
console.log("OK");
