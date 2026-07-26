import fs from 'node:fs';

const FILE = 'apps/web/src/main.ts';
let s = fs.readFileSync(FILE, 'utf8');
const originalLength = s.length;

function mustReplace(label, oldStr, newStr) {
  const count = s.split(oldStr).length - 1;
  if (count !== 1) {
    throw new Error(`[${label}] expected exactly 1 match, found ${count}`);
  }
  s = s.replace(oldStr, newStr);
  console.log(`[ok] ${label}`);
}

// 1) Imports: add createSummonerRoster, getActiveSummoner, setActiveSummoner,
//    SUMMONER_ELEMENTS, totalScrollCount to the stonesummoner-loop import block.
mustReplace(
  'import createSummonerRoster',
  '  createNewSave,\r\n  createStageBattle,\r\n',
  '  createNewSave,\r\n  createStageBattle,\r\n  createSummonerRoster,\r\n',
);
mustReplace(
  'import getActiveSummoner',
  '  runGuildCheckIn,\r\n  guildLeaderboard,\r\n',
  '  runGuildCheckIn,\r\n  getActiveSummoner,\r\n  guildLeaderboard,\r\n',
);
mustReplace(
  'import setActiveSummoner',
  '  runSummon,\r\n  runUpgradeBuilding,\r\n',
  '  runSummon,\r\n  runUpgradeBuilding,\r\n  setActiveSummoner,\r\n',
);
mustReplace(
  'import SUMMONER_ELEMENTS',
  '  SUMMON_SCROLL_COST,\r\n  SUMMONER_ELEMENT_LABEL,\r\n',
  '  SUMMON_SCROLL_COST,\r\n  SUMMONER_ELEMENTS,\r\n  SUMMONER_ELEMENT_LABEL,\r\n',
);
mustReplace(
  'import totalScrollCount',
  '  scrollCount,\r\n  SUMMON_MULTI_COUNT,\r\n',
  '  scrollCount,\r\n  totalScrollCount,\r\n  SUMMON_MULTI_COUNT,\r\n',
);

// 2) State declarations for the header drawers / sheets.
mustReplace(
  'state: resMoreOpen/settingsOpen/summonerPickerOpen',
  'let boardRekindleFx = false;\r\n\r\ntype StagesRegionId =',
  'let boardRekindleFx = false;\r\n\r\n/** Extra currencies drawer under app-bar resources. */\r\nlet resMoreOpen = false;\r\nlet settingsOpen = false;\r\nlet summonerPickerOpen = false;\r\n\r\ntype StagesRegionId =',
);

// 3) Helper functions inserted right before render().
const helperBlock = `/** Compact display for wallet amounts in the app bar. */
function fmtRes(n: number): string {
  const v = Math.floor(n);
  if (v >= 1_000_000) return \`\${(v / 1_000_000).toFixed(1)}M\`;
  if (v >= 10_000) return \`\${(Math.round(v / 100) / 10).toFixed(1)}K\`;
  return v.toLocaleString("ko-KR");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Short display name for profile overlays. */
function displayNickname(): string {
  const email = sessionUser?.email?.trim();
  if (email) {
    const local = email.split("@")[0] || email;
    return local.length > 10 ? \`\${local.slice(0, 10)}…\` : local;
  }
  if (sessionUser?.kind === "demo") return "데모모험가";
  if (sessionUser?.kind === "guest") return "게스트";
  return "모험가";
}

/** Toggle currency drawer without a full screen re-render. */
function applyResMoreOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-res-more");
  const panel = app.querySelector<HTMLElement>("#res-more-panel");
  if (btn) {
    btn.classList.toggle("is-open", resMoreOpen);
    btn.setAttribute("aria-expanded", resMoreOpen ? "true" : "false");
    const label = resMoreOpen ? "재화 접기" : "다른 재화 보기";
    btn.title = label;
    btn.setAttribute("aria-label", label);
  }
  if (panel) {
    panel.classList.toggle("is-open", resMoreOpen);
    if (resMoreOpen) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "");
  }
}

/** Toggle summoner picker sheet without a full screen re-render. */
function applySummonerPickerOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-summoner-picker");
  const layer = app.querySelector<HTMLElement>("#summoner-picker-layer");
  if (btn) {
    btn.setAttribute("aria-expanded", summonerPickerOpen ? "true" : "false");
  }
  if (layer) {
    layer.hidden = !summonerPickerOpen;
    layer.setAttribute("aria-hidden", summonerPickerOpen ? "false" : "true");
  }
}

/** One-line notice board lines under the app bar. */
function tickerMessages(): string[] {
  const active = getActiveSummoner(save);
  const el = save.activeSummoner ?? "light";
  const energy = Math.floor(save.island.energy);
  const energyMax = save.island.energyMax ?? 100;
  const lines = [
    "신비의마법석 · 섬을 드래그해 시설을 둘러보세요",
    \`\${SUMMONER_ELEMENT_LABEL[el]} 서머너 Lv.\${active.level} 육성 중\`,
    \`행동력 \${energy}/\${energyMax} · 출정문으로 전투에 나서세요\`,
    \`소환서 \${totalScrollCount(save)}장 · 소환진에서 동료를 불러내세요\`,
  ];
  if ((save.gloryPoints ?? 0) > 0) {
    lines.push(\`영광 \${save.gloryPoints} · 영광 건물에서 보너스를 강화하세요\`);
  }
  if (save.island.summonerLevel < 7) {
    lines.push("서머너 Lv.7에 소원의 사당이 해금됩니다");
  } else if (save.island.summonerLevel < 8) {
    lines.push("서머너 Lv.8에 마법진 도장이 해금됩니다");
  }
  return lines;
}

function renderTicker(): string {
  const items = tickerMessages().map((m) => escapeHtml(m));
  const joined = items.join("　　·　　");
  return \`<div class="ticker" role="marquee" aria-label="공지 전광판">
    <div class="ticker-fade" aria-hidden="true"></div>
    <div class="ticker-track">
      <span class="ticker-text">\${joined}</span>
      <span class="ticker-text" aria-hidden="true">\${joined}</span>
    </div>
  </div>\`;
}

`;
mustReplace(
  'insert helper functions before render()',
  'function render(): void {',
  helperBlock + 'function render(): void {',
);

console.log('total length before header/nav swap:', s.length, '(delta so far', s.length - originalLength, ')');
fs.writeFileSync(FILE, s, 'utf8');
console.log('wrote stage 1');
