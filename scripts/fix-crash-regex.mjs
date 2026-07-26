import fs from "node:fs";

const path = "apps/web/src/main.ts";
let s = fs.readFileSync(path, "utf8");

// Crash: /?????|.../ — "?" is a quantifier with nothing to repeat.
// Build pattern with \u escapes so this script file stays ASCII-safe.
const tickerPat = [
  "\uC2A4\uD1A4\uD328\uC2DC\uBE0C", // 스톤패시브
  "\uD68D\uB4DD", // 획득
  "\uC2A4\uD3F0", // 스폰
  "\uC6E8\uC774\uBE0C", // 웨이브
  "\uAC15\uD654 \uC9C4\uBB38", // 강화 진문
  "\uC9C4\uBB38 \uBD95\uAD34", // 진문 붕괴
  "\uD3EC\uC11D \uBCF4\uB108\uC2A4", // 포석 보너스
  "defeated",
  "\uD68C\uBCF5", // 회복
  "\uC9C4\uBB38\uAC1C\uBC29", // 진문개방
  "\uC99D\uD3ED\uC120\uC5B8", // 증폭선언
  "\uC30D\uCC29\uC218", // 쌍착수
  "\uC9C4\uBB38\uCCAD\uC18C", // 진문청소
  "\uC9C4\uBB38\uC218\uD638", // 진문수호
  "\uD615\uC0C1", // 형상
  "\uC774\uBCA4\uD2B8", // 이벤트
  "\uC0AC\uC11D\uC0C1\uC810", // 사석상점
  "\uC18D\uC131", // 속성
  "\uD544\uC2B9", // 필승
  "\uBD09\uC778", // 봉인
  "\uB3CC\uD761\uC218", // 돌흡수
  "\uC9C4\uD615\uD30C\uAD34", // 진형파괴
  "\uC11C\uBA38\uB108 \uCC29\uC218", // 서머너 착수
  "\uBC18\uB9C8\uB098", // 맞마나 — wait 묘수 first
].join("|");

// Fix order to match original: include 묘수 before 맞마나
const tickerSource =
  "/\uC2A4\uD1A4\uD328\uC2DC\uBE0C|\uD68D\uB4DD|\uC2A4\uD3F0|\uC6E8\uC774\uBE0C|\uAC15\uD654 \uC9C4\uBB38|\uC9C4\uBB38 \uBD95\uAD34|\uD3EC\uC11D \uBCF4\uB108\uC2A4|defeated|\uD68C\uBCF5|\uC9C4\uBB38\uAC1C\uBC29|\uC99D\uD3ED\uC120\uC5B8|\uC30D\uCC29\uC218|\uC9C4\uBB38\uCCAD\uC18C|\uC9C4\uBB38\uC218\uD638|\uD615\uC0C1|\uC774\uBCA4\uD2B8|\uC0AC\uC11D\uC0C1\uC810|\uC18D\uC131|\uD544\uC2B9|\uBD09\uC778|\uB3CC\uD761\uC218|\uC9C4\uD615\uD30C\uAD34|\uC11C\uBA38\uB108 \uCC29\uC218|\uBB18\uC218|\uB9DE\uB9C8\uB098|\uC774\uC911\uCE35/";

const muted =
  '<div class="battle-ticker muted">\uC804\uD22C \uC54C\uB9BC \u2014 \uB530\uB0C4\u00B7\uC544\uC774\uD15C\u00B7\uD328\uC2DC\uBE0C\uAC00 \uC5EC\uAE30 \uD45C\uC2DC\uB429\uB2C8\uB2E4</div>';

const goodTicker = `function renderBattleTicker(): string {
  if (!battle) return "";
  const lines = battle.log
    .filter(
      (l) =>
        ${tickerSource}.test(l),
    )
    .slice(-3);
  if (!lines.length) {
    return \`${muted}\`;
  }
  return \`<div class="battle-ticker" aria-live="polite">\${lines
    .map((l) => \`<span>\${l}</span>\`)
    .join("")}</div>\`;
}`;

if (!/function renderBattleTicker\(\): string \{/.test(s)) {
  console.error("missing renderBattleTicker");
  process.exit(1);
}

s = s.replace(
  /function renderBattleTicker\(\): string \{[\s\S]*?\n\}/,
  goodTicker,
);

// Wish reveal: /^??:/ crashes the same way ("Nothing to repeat")
const wishOld =
  /if \(r\.message\.startsWith\("[^"]*"\)\) \{\s*wishReveal = r\.message\.replace\(\/\^[^/]*\/,\s*""\);\s*\}/;
const wishNew = `if (r.message.startsWith("\uC18C\uC6D0:")) {
      wishReveal = r.message.replace(/^\uC18C\uC6D0:\\s*/, "");
    }`;

if (!wishOld.test(s)) {
  console.warn("wish block pattern not found — trying loose replace");
  s = s.replace(
    /r\.message\.startsWith\("\?\?:"\)/,
    'r.message.startsWith("\uC18C\uC6D0:")',
  );
  s = s.replace(
    /r\.message\.replace\(\/\^\?\?:\\s\*\/,\s*""\)/,
    'r.message.replace(/^\uC18C\uC6D0:\\s*/, "")',
  );
} else {
  s = s.replace(wishOld, wishNew);
}

fs.writeFileSync(path, s, "utf8");

// Verify
const check = fs.readFileSync(path, "utf8");
const m = check.match(
  /filter\(\s*\(l\)\s*=>\s*\/([^/]+)\/\.test/,
);
if (!m) {
  console.error("ticker regex not found after write");
  process.exit(1);
}
try {
  new RegExp(m[1]);
  console.log("ticker regex OK:", m[1].slice(0, 40) + "...");
} catch (e) {
  console.error("ticker still bad:", e.message);
  process.exit(1);
}

const wishRe = check.match(/replace\(\/(\^[^/]+)\/,/);
if (wishRe) {
  try {
    new RegExp(wishRe[1]);
    console.log("wish regex OK:", wishRe[1]);
  } catch (e) {
    console.error("wish still bad:", e.message);
    process.exit(1);
  }
} else {
  console.warn("wish replace not found");
}

console.log("has ????? ticker", /\/\?\?\?\?\?\|/.test(check));
console.log("written", path, check.length);
