/**
 * Pass 5: fix remaining real UI ??? and broken attributes with curated Hangul → t().
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { transformSync } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = path.join(root, "apps/web/src/main.ts");
const extraPath = path.join(root, "apps/web/src/i18n/ui-extra.json");

let cur = fs.readFileSync(mainPath, "utf8").replace(/\r\n/g, "\n");
const extra = JSON.parse(fs.readFileSync(extraPath, "utf8"));

function keyFor(ko) {
  return `ui.${crypto.createHash("sha1").update(ko).digest("hex").slice(0, 10)}`;
}
function ensureKey(ko, en = ko) {
  const key = keyFor(ko);
  extra[key] = { ko, en };
  return key;
}
function tExpr(ko, en) {
  return `t('${ensureKey(ko, en)}')`;
}

const patches = [
  // broken aria-label without quotes
  [
    /aria-label=t\('ui\.[a-f0-9]+'\)>(\?\?|\$\{t\('ui\.[a-f0-9]+'\)\})?<\/button>/g,
    `aria-label="\${${tExpr("닫기", "Close")}}">\${${tExpr("닫기", "Close")}}</button>`,
  ],
  [
    /id="btn-region-close-x" aria-label=t\('ui\.[a-f0-9]+'\)>\?\?<\/button>/g,
    `id="btn-region-close-x" aria-label="\${${tExpr("닫기", "Close")}}">\${${tExpr("닫기", "Close")}}</button>`,
  ],
  // hell blurb
  [
    /id: "hell", labelKo: t\('ui\.[a-f0-9]+'\), blurb: "\? \?\? \+4 \? \?\?\? \?\? \?\?"/,
    `id: "hell", labelKo: ${tExpr("지옥", "Hell")}, blurb: ${tExpr("적 강화 +4 · 보상 대폭 증가", "Enemy +4 · much better rewards")}`,
  ],
  // hard blurb if still broken
  [
    /id: "hard", labelKo: t\('ui\.[a-f0-9]+'\), blurb: "\? \?\? \+2 \? \?\?\? \?\?"/,
    `id: "hard", labelKo: ${tExpr("어려움", "Hard")}, blurb: ${tExpr("적 강화 +2 · 보상 증가", "Enemy +2 · better rewards")}`,
  ],
  // normal label
  [
    /id: "normal", labelKo: t\('ui\.[a-f0-9]+'\)/,
    `id: "normal", labelKo: ${tExpr("일반", "Normal")}`,
  ],
  // equip vault note
  [
    /extras = `<p class="stages-note">\?\? \$\{equipVaultRemaining\(syncEquipVaultWeek\(save\)\)\}\/\$\{EQUIP_VAULT_WEEKLY_LIMIT\} \? \?\? \?\? \? \?\?\?\?\? \?\?\/\?\?<\/p>`;/,
    `extras = \`<p class="stages-note">\${${tExpr("주간 금고", "Weekly vault")}} \${equipVaultRemaining(syncEquipVaultWeek(save))}/\${EQUIP_VAULT_WEEKLY_LIMIT} · \${${tExpr("장비 드롭은 주간 한도까지", "Gear drops until weekly cap")}}</p>\`;`,
  ],
  // arena bans line
  [
    /<p class="stages-note">\? \$\{bans\.length \? bans\.map\(\(id\) => getMonster\(id\)\?\.nameKo \?\? id\)\.join\(", "\) : t\('ui\.[a-f0-9]+'\)\} \? \?\? 2<\/p>/,
    `<p class="stages-note">\${${tExpr("밴", "Bans")}} \${bans.length ? bans.map((id) => getMonster(id)?.nameKo ?? id).join(", ") : ${tExpr("없음", "None")}} · \${${tExpr("최대", "Max")}} 2</p>`,
  ],
  // summon idle kicker/title/copy — fix if still ???
  [
    /<p class="summon-idle-kicker">\?\? \?\?<\/p>/,
    `<p class="summon-idle-kicker">\${${tExpr("소환 대기", "Awaiting summon")}}</p>`,
  ],
  [
    /<p class="summon-idle-title">[^<]*<\/p>\s*<p class="summon-idle-copy">[^<]*<\/p>/,
    `<p class="summon-idle-title">\${${tExpr("소환진이 고요합니다", "The circle is quiet")}}</p>
        <p class="summon-idle-copy">\${${tExpr("소환서를 사용해 동료를 불러내세요", "Use scrolls to call allies")}}</p>`,
  ],
  // mana label
  [
    /<span class="mana-label">\?\?<\/span>/,
    `<span class="mana-label">\${${tExpr("서머너 마나", "Summoner mana")}}</span>`,
  ],
  [
    /<span class="mana-label">\$\{t\('ui\.[a-f0-9]+'\)\}<\/span>/,
    `<span class="mana-label">\${${tExpr("서머너 마나", "Summoner mana")}}</span>`,
  ],
  // season claim button leftover ??
  [
    /id="btn-season-claim">\?\? \?\? \?\?<\/button>/,
    `id="btn-season-claim">\${${tExpr("시즌 보상 수령", "Claim season reward")}}</button>`,
  ],
  // party empty "??" that became wrong key — find party-specific
  [
    /const emptyLabel = t\('ui\.[a-f0-9]+'\);|^\s*"\?\?",\s*$/m,
    null, // handle below
  ],
  // multi summon aria
  [
    /aria-label="\$\{SCROLL_KIND_LABEL\[kind\]\} \$\{SUMMON_MULTI_COUNT\}\? \?\?"/,
    `aria-label="\${SCROLL_KIND_LABEL[kind]} \${SUMMON_MULTI_COUNT}\${${tExpr("회 소환", "× summon")}}"`,
  ],
  // seasons muted note if broken
  [
    /<p class="muted stages-note">\$\{t\('ui\.[a-f0-9]+'\)\} \$\{nextTierAt\}.*?\$\{claimed\}<\/p>/,
    `<p class="muted stages-note">\${${tExpr("다음 보상", "Next reward")}} \${nextTierAt}\${${tExpr("승", " wins")}} · \${${tExpr("수령", "Claimed")}} \${claimed}</p>`,
  ],
];

for (const [re, to] of patches) {
  if (to == null) continue;
  const before = cur;
  cur = cur.replace(re, to);
  if (cur !== before) console.log("ok", String(re).slice(0, 50));
  else console.log("MISS", String(re).slice(0, 50));
}

// Fix party empty slot string near party-slot
cur = cur.replace(
  /(function renderParty[\s\S]*?party-slot[\s\S]{0,400}?)t\('ui\.[a-f0-9]+'\)/,
  (_m, pre) => `${pre}${tExpr("빈칸", "Empty")}`,
);

// SCROLL_KIND_LABEL object values if still ??
cur = cur.replace(
  /SCROLL_KIND_LABEL[^=]*=\s*\{[^}]*\}/,
  `SCROLL_KIND_LABEL = {
    normal: ${tExpr("일반", "Normal")},
    premium: ${tExpr("고급", "Premium")},
    mystic: ${tExpr("신성/심연", "Mystic")},
  }`,
);

// Fix shop strings that remain as ??? in HTML - read section
const shopFixes = [
  [/>\?\?\?\?<\/strong>/g, `>\${${tExpr("구매", "Buy")}}</strong>`],
  [/>\?\? \?\?<\/p>/g, `>\${${tExpr("소환 대기", "Awaiting summon")}}</p>`],
];
for (const [re, to] of shopFixes) {
  cur = cur.replace(re, to);
}

// Stages region close button full line
cur = cur.replace(
  /<button type="button" class="secondary stages-region-x" id="btn-region-close-x"[^>]*>[^<]*<\/button>/,
  `<button type="button" class="secondary stages-region-x" id="btn-region-close-x" aria-label="\${${tExpr("닫기", "Close")}}">\${${tExpr("닫기", "Close")}}</button>`,
);

// Gear drop label span
cur = cur.replace(
  /<span class="stage-drop-piece-label">\?\?<\/span>/g,
  `<span class="stage-drop-piece-label">\${${tExpr("장비", "Gear")}}</span>`,
);
cur = cur.replace(
  /title="\?\?"/g,
  `title="\${${tExpr("장비", "Gear")}}"`,
);
cur = cur.replace(
  /alt="\?\?"/g,
  `alt="\${${tExpr("장비", "Gear")}}"`,
);

// skill tree element headers
cur = cur.replace(
  /<span>\?\?<\/span><span><\/span><span>\?\?<\/span><span><\/span><span>\?\?<\/span>/,
  `<span>\${${tExpr("화", "F")}}</span><span></span><span>\${${tExpr("수", "W")}}</span><span></span><span>\${${tExpr("풍", "A")}}</span>`,
);

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 2), "utf8");
fs.writeFileSync(mainPath, cur, "utf8");

try {
  transformSync(cur, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.log("FAIL", e.errors?.[0]);
  const loc = e.errors?.[0]?.location;
  if (loc) {
    const ls = cur.split("\n");
    for (let i = loc.line - 2; i <= loc.line + 1; i++)
      console.log(i + ":", ls[i - 1]);
  }
}

const bad = cur
  .split(/\n/)
  .map((l, i) => [i + 1, l])
  .filter(([, l]) => {
    if (/["'`][^"'`]*\?{2,}[^"'`]*["'`]/.test(l) && !/\?\? [A-Za-z_(]/.test(l) && !/ \?\? /.test(l) === false) {
      // filter nullish: exclude lines where ?? is only operator
      const stripped = l.replace(/\?\?/g, "");
      // if removing ?? leaves no lone ? in strings...
    }
    // count ? inside quotes that aren't ??
    const strs = l.match(/(["'`])(?:\\.|(?!\1).)*\1/g) || [];
    return strs.some((s) => /\?{2,}/.test(s) && !/^["'`]—["'`]$/.test(s));
  })
  .filter(([, l]) => {
    // exclude pure nullish coalescing in code
    const onlyNullish =
      !/(["'`])[^"'`]*\?{2,}[^"'`]*\1/.test(l.replace(/\?\?/g, "\u0000"));
    return true;
  });

// simpler filter
const realBad = cur
  .split(/\n/)
  .map((l, i) => [i + 1, l])
  .filter(([, l]) => {
    if (/>[^<>{}\n]*\?{2,}[^<>{}\n]*</.test(l)) return true;
    if (/blurb:\s*"[^"]*\?/.test(l)) return true;
    if (/labelKo:\s*"\?/.test(l)) return true;
    if (/"(?:\?{2,}(?:\s|\?)*)+"/.test(l)) return true;
    if (/`[^`]*\?{2,}[^`]*`/.test(l) && !/\$\{/.test(l.split("?")[0])) {
      // template with ???
      if (/\?{2,}/.test(l.replace(/\$\{[^}]*\}/g, ""))) return true;
    }
    if (/\?{2,}/.test(l.replace(/\$\{[^}]*\}/g, "").replace(/\?\?/g, ""))) {
      // has ??? beyond nullish - rough
    }
    return /stages-note">\?|idle-kicker">\?|mana-label">\?|claim">\?|label">\?|blurb: "\?/.test(
      l,
    );
  });

console.log("realBad", realBad.length);
realBad.forEach(([n, l]) => console.log(n, l.trim().slice(0, 160)));
console.log("hangul", (cur.match(/[\uac00-\ud7a3]/g) || []).length);
