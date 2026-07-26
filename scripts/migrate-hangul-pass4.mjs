/**
 * Curated restore for remaining ??? UI strings that asciiKey could not match,
 * then migrate Hangul to t().
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { transformSync } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = path.join(root, "apps/web/src/main.ts");
const extraPath = path.join(root, "apps/web/src/i18n/ui-extra.json");

let cur = fs.readFileSync(mainPath, "utf8").replace(/\r\n/g, "\n");
const extra = JSON.parse(fs.readFileSync(extraPath, "utf8"));
const head = execSync("git show HEAD:apps/web/src/main.ts", {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
  cwd: root,
}).replace(/\r\n/g, "\n");

function keyFor(ko) {
  return `ui.${crypto.createHash("sha1").update(ko).digest("hex").slice(0, 10)}`;
}
function ensureKey(ko, en = ko) {
  const key = keyFor(ko);
  if (!extra[key]) extra[key] = { ko, en };
  return key;
}
function T(ko, en) {
  return `t('${ensureKey(ko, en)}')`;
}

// Pull useful snippets from HEAD for reference in curated replacements
function headHas(s) {
  return head.includes(s);
}

// --- Curated literal replacements (corrupted -> Hangul, then t() in next step) ---
const LITERALS = [
  // party empty slot label
  ['"??"', T("빈칸", "Empty")],
  // scroll kinds
  ['normal: "??"', `normal: ${T("일반", "Normal")}`],
  ['premium: "??"', `premium: ${T("고급", "Premium")}`],
  ['mystic: "??"', `mystic: ${T("신성/심연", "Mystic")}`],
  // summon CTAs
  [': "??"}', `: ${T("부족", "Need more")}}`],
  // skill tree row headers — fire/water/wind style; HEAD often had 화/수/풍 or similar
  ["<span>??</span><span></span><span>??</span><span></span><span>??</span>",
    `<span>\${${T("화", "Fire")}}</span><span></span><span>\${${T("수", "Water")}}</span><span></span><span>\${${T("풍", "Wind")}}</span>`],
  // difficulties
  ['labelKo: "??", blurb: t(\'ui.2387a8e0b0\')',
    `labelKo: ${T("일반", "Normal")}, blurb: t('ui.2387a8e0b0')`],
  ['labelKo: "??", blurb: "? ?? +4 ? ??? ?? ??"',
    `labelKo: ${T("지옥", "Hell")}, blurb: ${T("적 강화 +4 · 보상 대폭 증가", "Enemy +4 · much better rewards")}`],
  ['blurb: "? ?? +2 ? ??? ??"',
    `blurb: ${T("적 강화 +2 · 보상 증가", "Enemy +2 · better rewards")}`],
  // gear drop
  ['title="??"', `title="\${${T("장비", "Gear")}}"`],
  ['alt="??"', `alt="\${${T("장비", "Gear")}}"`],
  [">??</span>", `>\${${T("장비", "Gear")}}</span>`],
  // locked pin
  [': "??"}', `: ${T("잠김", "Locked")}}`],
  // mana label
  [">??</span>\n", `>\${${T("마나", "Mana")}}</span>\n`],
  // close
  ['aria-label="??">??</button>',
    `aria-label="\${${T("닫기", "Close")}}">\${${T("닫기", "Close")}}</button>`],
  ['aria-label="??"', `aria-label="\${${T("닫기", "Close")}}"`],
  // sr-only
  [">???</span>", `>\${${T("닫기", "Close")}}</span>`],
  // summon idle
  [">?? ??</p>", `>\${${T("소환 대기", "Summon ready")}}</p>`],
  // season
  ['>?? ?? ??</button>', `>\${${T("시즌 보상 수령", "Claim season reward")}}</button>`],
];

let applied = 0;
for (const [from, to] of LITERALS) {
  if (cur.includes(from)) {
    cur = cur.split(from).join(to);
    applied++;
  }
}
console.log("literal patches applied:", applied);

// Broader regex fixes for template leftovers
const REGEX_FIXES = [
  [
    /<p class="summon-idle-kicker">\?\? \?\?<\/p>/g,
    () => `<p class="summon-idle-kicker">\${${T("소환 대기", "Summon ready")}}</p>`,
  ],
  [
    /aria-label="\$\{SCROLL_KIND_LABEL\[kind\]\} 1\? \?\?"/g,
    () =>
      `aria-label="\${SCROLL_KIND_LABEL[kind]} \${${T("1회 소환", "Summon ×1")}}"`,
  ],
  [
    /\$\{ready10 \? `\$\{SUMMON_MULTI_COUNT\}\?` : "\?\?"\}/g,
    () =>
      `\${ready10 ? \`\${SUMMON_MULTI_COUNT}\${${T("회", "×")}}\` : ${T("부족", "Need more")}}`,
  ],
  [
    /\$\{ready1 \? t\('ui\.[a-f0-9]+'\) : "\?\?"\}/g,
    () => `\${ready1 ? ${T("소환", "Summon")} : ${T("부족", "Need more")}}`,
  ],
  [
    /monsterElementLabel\(revEl\)\} \? \?\$\{/g,
    () => `monsterElementLabel(revEl)} · ★\${`,
  ],
  [
    /naturalStars \?\? 0\}\?">/g,
    () => `naturalStars ?? 0}★">`,
  ],
  [
    /` \? \?\? \$\{vaultLeft\}\/\$\{EQUIP_VAULT_WEEKLY_LIMIT\}`/g,
    () =>
      ` \` · \${${T("주간", "Weekly")}} \${vaultLeft}/\${EQUIP_VAULT_WEEKLY_LIMIT}\``,
  ],
  [
    /: `\$\{\?\?\?\} \$\{cost\}`|: `\?\?\? \$\{cost\}`/g,
    () => `: \`\${${T("행동력", "Energy")}} \${cost}\``,
  ],
  [
    /\$\{s\.boardSize\}\?\$\{s\.boardSize\} \? \?\?\? \$\{s\.waves\}/g,
    () =>
      `\${s.boardSize}×\${s.boardSize} · \${${T("웨이브", "Waves")}} \${s.waves}`,
  ],
  [
    /blurb: `\?\?\?\? \? \$\{pin\.areaKo\}`/g,
    () => `blurb: \`\${${T("메인 퀘스트", "Main quest")}} · \${pin.areaKo}\``,
  ],
  [
    /`\$\{d\.labelKo\} \(\?\?\?\)`/g,
    () => `\`\${d.labelKo} (\${${T("잠김", "Locked")}})\``,
  ],
  [
    /<small>\$\{on \? "\? \?\?" : "\? \?\?"\}<\/small>/g,
    () =>
      `<small>\${on ? ${T("밴 중", "Banned")} : ${T("밴 가능", "Can ban")}}</small>`,
  ],
  [
    /: "\?\?"\} \? \?\? 2/g,
    () => `: ${T("없음", "None")}} · ${T("최대", "Max")} 2`,
  ],
  [
    /\$\{prog\.unlocked \? "" : " \? \?\?\?"\} \? \?\?\? \$\{energyNow\}/g,
    () =>
      `\${prog.unlocked ? "" : \` · \${${T("잠김", "Locked")}}\`} · \${${T("행동력", "Energy")}} \${energyNow}`,
  ],
  [
    /\$\{prog\.unlocked \? sub : "\?\?"\}/g,
    () => `\${prog.unlocked ? sub : ${T("잠김", "Locked")}}`,
  ],
  [
    /<span class="mana-label">\?\?<\/span>/g,
    () => `<span class="mana-label">\${${T("마나", "Mana")}}</span>`,
  ],
  [
    /<p class="season-panel-title">\?\? \?\? \? \? \$\{seasonWins\}<\/p>/g,
    () =>
      `<p class="season-panel-title">\${${T("시즌 아레나 승", "Season arena wins")}} \${seasonWins}</p>`,
  ],
  [
    /<p class="muted stages-note">\?\? \?\? \$\{nextTierAt\}\? \? \?\? \?\? \$\{claimed\}<\/p>/g,
    () =>
      `<p class="muted stages-note">\${${T("다음 보상", "Next reward")}} \${nextTierAt}${T("승", " wins").includes("wins") ? "" : ""} · \${${T("수령", "Claimed")}} \${claimed}</p>`,
  ],
  [
    /<button type="button" class="auth-btn-primary full" id="btn-season-claim">\?\? \?\? \?\?<\/button>/g,
    () =>
      `<button type="button" class="auth-btn-primary full" id="btn-season-claim">\${${T("시즌 보상 수령", "Claim season reward")}}</button>`,
  ],
  [
    /<p class="stages-meta">\?\?\? \$\{prog\.cleared\}\/\$\{prog\.total\}/g,
    () =>
      `<p class="stages-meta">\${${T("클리어", "Cleared")}} \${prog.cleared}/\${prog.total}`,
  ],
];

for (const [re, fn] of REGEX_FIXES) {
  const before = cur;
  cur = cur.replace(re, fn);
  if (cur !== before) console.log("regex ok", re.source.slice(0, 40));
}

// Fix seasons note more carefully
if (cur.includes("stages-note") && /\?\?/.test(cur)) {
  // equip vault note
  cur = cur.replace(
    /extras = `<p class="stages-note">\?\? \$\{equipVaultRemaining\([^)]+\)\}\/\$\{EQUIP_VAULT_WEEKLY_LIMIT\} \? \?\? \?\? \? \?\?\?\?\? \?\?\/\?\?<\/p>`;/,
    `extras = \`<p class="stages-note">\${${T("주간 금고", "Weekly vault")}} \${equipVaultRemaining(syncEquipVaultWeek(save))}/\${EQUIP_VAULT_WEEKLY_LIMIT} · \${${T("장비 드롭은 주간 한도까지", "Gear drops until weekly cap")}}</p>\`;`,
  );
  cur = cur.replace(
    /extras = `<p class="stages-note">\?\? \$\{save\.guildContribution \?\? 0\} \? \?\? \+\$\{save\.guildRaidBest \?\? 0\}<\/p>`;/,
    `extras = \`<p class="stages-note">\${${T("기여", "Contribution")}} \${save.guildContribution ?? 0} · \${${T("레이드", "Raid")}} +\${save.guildRaidBest ?? 0}</p>\`;`,
  );
}

// Shop / enhance section ??? that ascii missed — pull from HEAD by searching unique anchors
function replaceFnBodyHint(anchor, hangulSnippets) {
  // no-op placeholder
}

// Migrate any remaining Hangul from curated patches
const PHRASE_RE =
  /[\uac00-\ud7a3][\uac00-\ud7a3A-Za-z0-9\s·./+\-%°I×〜~、，★]*[\uac00-\ud7a3]|[\uac00-\ud7a3]+/g;
const phrases = new Set();
let mm;
const re2 = new RegExp(PHRASE_RE.source, "g");
while ((mm = re2.exec(cur))) phrases.add(mm[0]);
for (const phrase of [...phrases].sort((a, b) => b.length - a.length)) {
  let idx = 0;
  while ((idx = cur.indexOf(phrase, idx)) !== -1) {
    const slice = cur.slice(Math.max(0, idx - 24), idx);
    if (/t\('ui\.[a-f0-9]*$/.test(slice)) {
      idx += phrase.length;
      continue;
    }
    const key = ensureKey(phrase.trim());
    const headCount = ((cur.slice(0, idx).match(/`/g) || []).length) % 2;
    const prev = cur[idx - 1] || "";
    const next = cur[idx + phrase.length] || "";
    let repl;
    if (headCount === 1) repl = `\${t('${key}')}`;
    else if ((prev === '"' && next === '"') || (prev === "'" && next === "'")) {
      repl = `t('${key}')`;
      cur = cur.slice(0, idx - 1) + repl + cur.slice(idx + phrase.length + 1);
      idx += repl.length;
      continue;
    } else repl = `t('${key}')`;
    cur = cur.slice(0, idx) + repl + cur.slice(idx + phrase.length);
    idx += repl.length;
  }
}

cur = cur.replace(/\$\{\$\{t\('ui\.([a-f0-9]+)'\)\}\}/g, "${t('ui.$1')}");
cur = cur.replace(/t\(t\('ui\.([a-f0-9]+)'\)\)/g, "t('ui.$1')");

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 2), "utf8");
fs.writeFileSync(mainPath, cur, "utf8");

try {
  transformSync(cur, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.log("esbuild FAIL", e.errors?.[0]);
}

function suspicious(src) {
  return src
    .split(/\n/)
    .map((l, i) => [i + 1, l])
    .filter(([, l]) => {
      if (/["'`][^"'`]*\?{2,}[^"'`]*["'`]/.test(l)) return true;
      if (/>[^<]*\?{2,}[^<]*</.test(l)) return true;
      return false;
    });
}

const bad = suspicious(cur);
console.log("suspicious left", bad.length);
bad.slice(0, 40).forEach(([n, l]) => console.log(n, l.trim().slice(0, 160)));
console.log("hangul", (cur.match(/[\uac00-\ud7a3]/g) || []).length);
console.log("extras", Object.keys(extra).length);
