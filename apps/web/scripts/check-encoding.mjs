/**
 * Guard: apps/web/src/main.ts must not contain Hangul (or U+FFFD).
 * Put Korean UI copy in apps/web/src/i18n/ui-extra.json and use t("ui…").
 * Windows tooling often corrupts literal Hangul in main.ts into "??".
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mainPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/main.ts",
);
const s = fs.readFileSync(mainPath, "utf8");

const hangul = s.match(/[\uAC00-\uD7A3]/g) || [];
const fffd = s.match(/\uFFFD/g) || [];
const badLabels = [
  ...s.matchAll(/label:\s*"\?\?"/g),
  ...s.matchAll(/data-mon-detail-tab="[^"]+"[^>]*>\?\?</g),
  ...s.matchAll(/data-sym-detail-(?:unequip|equip|imprint|enhance)[^>]*>\?\?</g),
];

const errors = [];
if (hangul.length) {
  errors.push(`main.ts contains ${hangul.length} Hangul codepoint(s) — move to ui-extra.json + t()`);
}
if (fffd.length) {
  errors.push(`main.ts contains ${fffd.length} U+FFFD replacement char(s)`);
}
if (badLabels.length) {
  errors.push(`main.ts has ${badLabels.length} corrupted "??" UI label(s)`);
}

if (errors.length) {
  console.error("check-encoding FAILED:");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}

console.log("check-encoding OK: main.ts is Hangul-free");
