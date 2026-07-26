import fs from "node:fs";

const path = "apps/web/src/main.ts";
let s = fs.readFileSync(path, "utf8");

/**
 * Replace Hangul regex literals with \u string keys + includes().
 * Encoding corruption used to turn /스톤.../ into /?????|.../ and crash
 * with "Nothing to repeat".
 */
const tickerFn = [
  "function renderBattleTicker(): string {",
  '  if (!battle) return "";',
  "  // ASCII-safe keyword list (\\u escapes) — do not use Hangul regex literals here.",
  "  const keys = [",
  '    "\\uC2A4\\uD1A4\\uD328\\uC2DC\\uBE0C",',
  '    "\\uD68D\\uB4DD",',
  '    "\\uC2A4\\uD3F0",',
  '    "\\uC6E8\\uC774\\uBE0C",',
  '    "\\uAC15\\uD654 \\uC9C4\\uBB38",',
  '    "\\uC9C4\\uBB38 \\uBD95\\uAD34",',
  '    "\\uD3EC\\uC11D \\uBCF4\\uB108\\uC2A4",',
  '    "defeated",',
  '    "\\uD68C\\uBCF5",',
  '    "\\uC9C4\\uBB38\\uAC1C\\uBC29",',
  '    "\\uC99D\\uD3ED\\uC120\\uC5B8",',
  '    "\\uC30D\\uCC29\\uC218",',
  '    "\\uC9C4\\uBB38\\uCCAD\\uC18C",',
  '    "\\uC9C4\\uBB38\\uC218\\uD638",',
  '    "\\uD615\\uC0C1",',
  '    "\\uC774\\uBCA4\\uD2B8",',
  '    "\\uC0AC\\uC11D\\uC0C1\\uC810",',
  '    "\\uC18D\\uC131",',
  '    "\\uD544\\uC2B9",',
  '    "\\uBD09\\uC778",',
  '    "\\uB3CC\\uD761\\uC218",',
  '    "\\uC9C4\\uD615\\uD30C\\uAD34",',
  '    "\\uC11C\\uBA38\\uB108 \\uCC29\\uC218",',
  '    "\\uBB18\\uC218",',
  '    "\\uB9DE\\uB9C8\\uB098",',
  '    "\\uC774\\uC911\\uCE35",',
  "  ];",
  "  const lines = battle.log",
  "    .filter((l) => keys.some((k) => l.includes(k)))",
  "    .slice(-3);",
  "  if (!lines.length) {",
  '    return `<div class="battle-ticker muted">${"\\uC804\\uD22C \\uC54C\\uB9BC \\u2014 \\uB530\\uB0C4\\u00B7\\uC544\\uC774\\uD15C\\u00B7\\uD328\\uC2DC\\uBE0C\\uAC00 \\uC5EC\\uAE30 \\uD45C\\uC2DC\\uB429\\uB2C8\\uB2E4"}</div>`;',
  "  }",
  "  return `<div class=\"battle-ticker\" aria-live=\"polite\">${lines",
  '    .map((l) => `<span>${l}</span>`)',
  '    .join("")}</div>`;',
  "}",
].join("\n");

if (!/function renderBattleTicker\(\): string \{/.test(s)) {
  console.error("missing renderBattleTicker");
  process.exit(1);
}

s = s.replace(/function renderBattleTicker\(\): string \{[\s\S]*?\n\}/, tickerFn);

// Wish: avoid /^??:/ crash
s = s.replace(
  /if \(r\.message\.startsWith\([^)]+\)\) \{\s*wishReveal = r\.message\.replace\([^;]+;\s*\}/,
  [
    'if (r.message.startsWith("\\uC18C\\uC6D0:")) {',
    '      wishReveal = r.message.replace(/^\\uC18C\\uC6D0:\\s*/, "");',
    "    }",
  ].join("\n"),
);

fs.writeFileSync(path, s, "utf8");

const check = fs.readFileSync(path, "utf8");
if (/\/\?\?\?\?\?\|/.test(check)) {
  console.error("still has broken ????? regex literal");
  process.exit(1);
}
if (!check.includes("keys.some((k) => l.includes(k))")) {
  console.error("ticker rewrite missing");
  process.exit(1);
}
if (/\/\uC2A4\uD1A4/.test(check) === false && !check.includes('"\\uC2A4\\uD1A4')) {
  // In file we expect the backslash-u form as source text
}

// Confirm no regex starting with ?
const bad = check.match(/\/\?[^/\n]*\/\.test/);
if (bad) {
  console.error("still has /?.../ regex:", bad[0].slice(0, 60));
  process.exit(1);
}

console.log("OK: ticker uses includes() + \\u escapes (no Hangul regex)");
console.log(
  "wish ok",
  check.includes('"\\uC18C\\uC6D0:"') || check.includes("startsWith(\"\\uC18C\\uC6D0:\")"),
);
