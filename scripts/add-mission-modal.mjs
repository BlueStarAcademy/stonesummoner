/**
 * Add mission modal (daily / achievements) — Hangul only in ui-extra.json.
 */
import fs from "node:fs";
import { execSync } from "node:child_process";
import { transformSync } from "esbuild";

const extraPath = "apps/web/src/i18n/ui-extra.json";
const mainPath = "apps/web/src/main.ts";
const cssPath = "apps/web/src/style.css";

const extra = JSON.parse(fs.readFileSync(extraPath, "utf8"));
const missionKeys = {
  "mission.title": { ko: "미션", en: "Missions" },
  "mission.close": { ko: "미션 닫기", en: "Close missions" },
  "mission.tabDaily": { ko: "일일미션", en: "Daily" },
  "mission.tabAchieve": { ko: "업적", en: "Achievements" },
  "mission.progress": { ko: "{cur}/{max}", en: "{cur}/{max}" },
  "mission.done": { ko: "완료", en: "Done" },
  "mission.inProgress": { ko: "진행중", en: "In progress" },
  "mission.go": { ko: "바로가기", en: "Go" },
  "mission.daily.wish.title": { ko: "일일 소원", en: "Daily wish" },
  "mission.daily.wish.desc": {
    ko: "소원의 사당에서 오늘 소원을 빌으세요",
    en: "Make today's wish at the temple",
  },
  "mission.daily.dojo.title": { ko: "도장 수련", en: "Dojo drill" },
  "mission.daily.dojo.desc": {
    ko: "마법진 도장에서 수련을 진행하세요",
    en: "Train at the magic circle dojo",
  },
  "mission.daily.collect.title": { ko: "재화 수집", en: "Collect resources" },
  "mission.daily.collect.desc": {
    ko: "연못·광맥에 쌓인 골드/크리스탈을 수령하세요",
    en: "Collect stored gold/crystal from buildings",
  },
  "mission.daily.sortie.title": { ko: "출정 도전", en: "Sortie" },
  "mission.daily.sortie.desc": {
    ko: "출정문으로 전투에 한 번 나서세요",
    en: "Fight once through the gate",
  },
  "mission.ach.lv5.title": { ko: "소환사 Lv.5", en: "Summoner Lv.5" },
  "mission.ach.lv5.desc": { ko: "소환사를 레벨 5까지 성장", en: "Reach summoner level 5" },
  "mission.ach.lv10.title": { ko: "소환사 Lv.10", en: "Summoner Lv.10" },
  "mission.ach.lv10.desc": { ko: "소환사를 레벨 10까지 성장", en: "Reach summoner level 10" },
  "mission.ach.clear5.title": { ko: "스테이지 5클리어", en: "Clear 5 stages" },
  "mission.ach.clear5.desc": { ko: "시나리오 스테이지 5개 클리어", en: "Clear 5 scenario stages" },
  "mission.ach.clear15.title": { ko: "스테이지 15클리어", en: "Clear 15 stages" },
  "mission.ach.clear15.desc": { ko: "시나리오 스테이지 15개 클리어", en: "Clear 15 scenario stages" },
  "mission.ach.roster4.title": { ko: "동료 4마리", en: "4 allies" },
  "mission.ach.roster4.desc": { ko: "소환수 4마리를 보유", en: "Own 4 monsters" },
  "mission.ach.glory.title": { ko: "영광의 첫걸음", en: "First glory" },
  "mission.ach.glory.desc": { ko: "영광 건물을 1회 이상 강화", en: "Upgrade any glory building once" },
  "mission.ach.guild.title": { ko: "길드 가입", en: "Join a guild" },
  "mission.ach.guild.desc": { ko: "길드에 소속되기", en: "Belong to a guild" },
};
Object.assign(extra, missionKeys);
fs.writeFileSync(extraPath, JSON.stringify(extra, null, 2), "utf8");
console.log("keys added", Object.keys(missionKeys).length);

let main = fs.readFileSync(mainPath, "utf8").replace(/\r\n/g, "\n");

// 1) State vars
if (!main.includes("let missionOpen")) {
  main = main.replace(
    "let summonerPickerOpen = false;",
    `let summonerPickerOpen = false;
let missionOpen = false;
type MissionTab = "daily" | "achievements";
let missionTab: MissionTab = "daily";`,
  );
  console.log("ok state");
}

// 2) applyMissionOpen after applyNotifOpen
if (!main.includes("function applyMissionOpen")) {
  const notifFn = main.match(
    /\/\*\* Toggle notification modal without a full screen re-render\. \*\/\nfunction applyNotifOpen\(\): void \{[\s\S]*?\n\}\n/,
  );
  if (!notifFn) throw new Error("applyNotifOpen not found");
  const insert = `${notifFn[0]}
/** Toggle mission modal without a full screen re-render. */
function applyMissionOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-mission");
  const layer = app.querySelector<HTMLElement>("#mission-layer");
  if (btn) {
    btn.classList.toggle("active", missionOpen);
    btn.setAttribute("aria-expanded", missionOpen ? "true" : "false");
  }
  if (layer) {
    layer.hidden = !missionOpen;
    layer.setAttribute("aria-hidden", missionOpen ? "false" : "true");
    if (missionOpen) replayModalPop(layer);
  }
}

`;
  main = main.replace(notifFn[0], insert);
  console.log("ok applyMissionOpen");
}

// 3) renderMissionModal function before render()
const missionFn = `
function missionItemHtml(opts: {
  title: string;
  desc: string;
  cur: number;
  max: number;
  goNav?: string;
}): string {
  const done = opts.cur >= opts.max;
  const pct = opts.max > 0 ? Math.min(100, Math.round((opts.cur / opts.max) * 100)) : 0;
  const go = opts.goNav
    ? \`<button type="button" class="mission-item-go" data-mission-go="\${opts.goNav}">\${t("mission.go")}</button>\`
    : "";
  return \`<article class="mission-item\${done ? " is-done" : ""}">
    <div class="mission-item-top">
      <div class="mission-item-copy">
        <strong class="mission-item-title">\${opts.title}</strong>
        <p class="mission-item-desc">\${opts.desc}</p>
      </div>
      <span class="mission-item-status">\${done ? t("mission.done") : t("mission.inProgress")}</span>
    </div>
    <div class="mission-item-bar" role="progressbar" aria-valuenow="\${opts.cur}" aria-valuemin="0" aria-valuemax="\${opts.max}">
      <i style="width:\${pct}%"></i>
    </div>
    <div class="mission-item-foot">
      <span class="mission-item-prog">\${t("mission.progress", { cur: Math.min(opts.cur, opts.max), max: opts.max })}</span>
      \${go}
    </div>
  </article>\`;
}

function renderMissionDailyList(): string {
  const day = todayKey();
  const wishDone = (save.island.lastWishDay ?? null) === day;
  const drills = save.dojoDrills ?? 0;
  const dojoCur = drills % 3;
  const pond = save.island.buildings.find((b) => b.id === "mana_pond");
  const mine = save.island.buildings.find((b) => b.id === "crystal_mine");
  const stored =
    Math.floor(pond?.storedMana ?? 0) + Math.floor(mine?.storedCrystal ?? 0);
  const collectDone = stored <= 0;
  const sortieDone = (save.clearedStages?.length ?? 0) > 0 && Math.floor(save.island.energy) < (save.island.energyMax ?? 100);
  return [
    missionItemHtml({
      title: t("mission.daily.wish.title"),
      desc: t("mission.daily.wish.desc"),
      cur: wishDone ? 1 : 0,
      max: 1,
      goNav: "wish",
    }),
    missionItemHtml({
      title: t("mission.daily.dojo.title"),
      desc: t("mission.daily.dojo.desc"),
      cur: dojoCur === 0 && drills > 0 ? 3 : dojoCur,
      max: 3,
      goNav: "dojo",
    }),
    missionItemHtml({
      title: t("mission.daily.collect.title"),
      desc: t("mission.daily.collect.desc"),
      cur: collectDone ? 1 : 0,
      max: 1,
      goNav: "home",
    }),
    missionItemHtml({
      title: t("mission.daily.sortie.title"),
      desc: t("mission.daily.sortie.desc"),
      cur: sortieDone ? 1 : 0,
      max: 1,
      goNav: "stages",
    }),
  ].join("");
}

function renderMissionAchieveList(): string {
  const lv = save.island.summonerLevel ?? 1;
  const cleared = save.clearedStages?.length ?? 0;
  const roster = save.roster?.length ?? 0;
  const gloryLv = Object.values(save.gloryLevels ?? {}).reduce(
    (n, v) => n + (typeof v === "number" ? v : 0),
    0,
  );
  const guildOk = Boolean(save.guildName);
  return [
    missionItemHtml({
      title: t("mission.ach.lv5.title"),
      desc: t("mission.ach.lv5.desc"),
      cur: lv,
      max: 5,
    }),
    missionItemHtml({
      title: t("mission.ach.lv10.title"),
      desc: t("mission.ach.lv10.desc"),
      cur: lv,
      max: 10,
    }),
    missionItemHtml({
      title: t("mission.ach.clear5.title"),
      desc: t("mission.ach.clear5.desc"),
      cur: cleared,
      max: 5,
      goNav: "stages",
    }),
    missionItemHtml({
      title: t("mission.ach.clear15.title"),
      desc: t("mission.ach.clear15.desc"),
      cur: cleared,
      max: 15,
      goNav: "stages",
    }),
    missionItemHtml({
      title: t("mission.ach.roster4.title"),
      desc: t("mission.ach.roster4.desc"),
      cur: roster,
      max: 4,
      goNav: "summon",
    }),
    missionItemHtml({
      title: t("mission.ach.glory.title"),
      desc: t("mission.ach.glory.desc"),
      cur: gloryLv > 0 ? 1 : 0,
      max: 1,
      goNav: "glory",
    }),
    missionItemHtml({
      title: t("mission.ach.guild.title"),
      desc: t("mission.ach.guild.desc"),
      cur: guildOk ? 1 : 0,
      max: 1,
      goNav: "guild",
    }),
  ].join("");
}

function renderMissionModal(): string {
  const daily = missionTab === "daily";
  return \`<div class="settings-layer mission-layer" id="mission-layer" \${missionOpen ? "" : "hidden"} aria-hidden="\${missionOpen ? "false" : "true"}">
  <button type="button" class="settings-backdrop" id="btn-mission-close" aria-label="\${escapeHtml(t("mission.close"))}"></button>
  <div class="settings-sheet mission-sheet" role="dialog" aria-modal="true" aria-labelledby="mission-title">
    <div class="settings-sheet-handle" aria-hidden="true"></div>
    <h2 class="settings-title" id="mission-title">\${escapeHtml(t("mission.title"))}</h2>
    <div class="mission-tabs" role="tablist" aria-label="\${escapeHtml(t("mission.title"))}">
      <button type="button" class="mission-tab\${daily ? " is-active" : ""}" role="tab" aria-selected="\${daily ? "true" : "false"}" data-mission-tab="daily">\${escapeHtml(t("mission.tabDaily"))}</button>
      <button type="button" class="mission-tab\${!daily ? " is-active" : ""}" role="tab" aria-selected="\${!daily ? "true" : "false"}" data-mission-tab="achievements">\${escapeHtml(t("mission.tabAchieve"))}</button>
    </div>
    <div class="mission-list" role="tabpanel">
      \${daily ? renderMissionDailyList() : renderMissionAchieveList()}
    </div>
  </div>
</div>\`;
}

`;

if (!main.includes("function renderMissionModal")) {
  if (!main.includes("function render(): void")) {
    throw new Error("render() not found");
  }
  main = main.replace("function render(): void {", missionFn + "function render(): void {");
  console.log("ok renderMissionModal");
}

// 4) Inject modal HTML before </nav> or after mailbox - after settings-layer close, before tabs
if (!main.includes('id="mission-layer"')) {
  // insert after notif-layer block end - find tabs nav
  const tabsAnchor = `      <button type="button" data-nav="stages"`;
  if (!main.includes(tabsAnchor)) throw new Error("tabs anchor missing");
  main = main.replace(
    tabsAnchor,
    `${"    "}${"${view !== \"auth\" ? renderMissionModal() : \"\"}"}\n${tabsAnchor}`,
  );
  // That produced broken template - fix properly
}

// Fix botched inject if any
main = main.replace(
  /    \$\{view !== "auth" \? renderMissionModal\(\) : ""\}\n      <button type="button" data-nav="stages"/,
  `    \${view !== "auth" ? renderMissionModal() : ""}
      <button type="button" data-nav="stages"`,
);

if (!main.includes("renderMissionModal()")) {
  // place before <nav class="tabs"
  const navRe = /(\$\{toast \? `<p class="toast">\$\{toast\}<\/p>` : ""\}\n    <\/header>\n    <main>\$\{mainContent\(manaPct\)\}<\/main>\n)/;
  // Better: after notif layer, before tabs
  const idx = main.indexOf('<nav class="tabs"');
  if (idx < 0) throw new Error("nav tabs missing");
  // find line start
  const insertAt = main.lastIndexOf("\n", idx) + 1;
  main =
    main.slice(0, insertAt) +
    `    \${view !== "auth" ? renderMissionModal() : ""}\n` +
    main.slice(insertAt);
  console.log("ok modal inject");
} else {
  console.log("modal inject already present");
}

// 5) Change mission tab button
const oldTab =
  /<button type="button" data-nav="dojo" class="\$\{tabMission \? "active" : ""\}"><span class="tab-ico tab-ico--mission"/;
if (oldTab.test(main)) {
  main = main.replace(
    oldTab,
    `<button type="button" id="btn-mission" class="\${missionOpen ? "active" : ""}" aria-expanded="\${missionOpen ? "true" : "false"}" aria-controls="mission-layer" title="\${escapeHtml(t("nav.mission"))}"><span class="tab-ico tab-ico--mission"`,
  );
  // also remove unused tabMission or keep for nothing - update tabMission line
  main = main.replace(
    /const tabMission = view === "wish" \|\| view === "glory" \|\| view === "dojo";/,
    `const tabMission = missionOpen;`,
  );
  console.log("ok mission tab button");
} else if (main.includes('id="btn-mission"')) {
  console.log("mission tab already updated");
} else {
  console.error("mission tab button pattern not found");
}

// 6) Bind handlers - after settings close
if (!main.includes("btn-mission-close")) {
  const settingsCloseBind = `  app.querySelector("#btn-settings-close")?.addEventListener("click", () => {
    settingsOpen = false;
    applySettingsOpen();
  });`;
  if (!main.includes(settingsCloseBind)) throw new Error("settings close bind missing");
  main = main.replace(
    settingsCloseBind,
    settingsCloseBind +
      `
  app.querySelector("#btn-mission")?.addEventListener("click", () => {
    missionOpen = !missionOpen;
    if (missionOpen) {
      settingsOpen = false;
      mailboxOpen = false;
      notifOpen = false;
      summonerPickerOpen = false;
      resMoreOpen = false;
      applySettingsOpen();
      applyMailboxOpen();
      applyNotifOpen();
      applySummonerPickerOpen();
      applyResMoreOpen();
    }
    render();
  });
  app.querySelector("#btn-mission-close")?.addEventListener("click", () => {
    missionOpen = false;
    applyMissionOpen();
  });
  app.querySelectorAll<HTMLButtonElement>("[data-mission-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.missionTab;
      if (tab !== "daily" && tab !== "achievements") return;
      missionTab = tab;
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-mission-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nav = btn.dataset.missionGo;
      if (!nav) return;
      missionOpen = false;
      if (nav === "home") {
        view = "home";
      } else {
        view = nav as View;
      }
      render();
    });
  });`,
  );
  console.log("ok binds");
}

// Close mission on other nav
main = main.replace(
  `      settingsOpen = false;
      mailboxOpen = false;
      notifOpen = false;
      summonerPickerOpen = false;
      resMoreOpen = false;
      const nav = btn.dataset.nav;`,
  `      settingsOpen = false;
      mailboxOpen = false;
      notifOpen = false;
      summonerPickerOpen = false;
      resMoreOpen = false;
      missionOpen = false;
      const nav = btn.dataset.nav;`,
);

// replayModalPop include mission-sheet
main = main.replace(
  '.settings-sheet, .stages-region-sheet, .stage-entry-modal',
  '.settings-sheet, .mission-sheet, .stages-region-sheet, .stage-entry-modal',
);

fs.writeFileSync(mainPath, main, "utf8");

// CSS
let css = fs.readFileSync(cssPath, "utf8");
if (!css.includes(".mission-sheet")) {
  css += `

/* Mission modal (centered, daily / achievements) */
.mission-sheet {
  width: min(100%, 380px);
  max-height: min(78dvh, 640px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 14px;
}

.mission-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--modal-line-soft);
  background: #0a0906aa;
}

.mission-tab {
  margin: 0;
  min-height: 36px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--modal-muted);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.mission-tab.is-active {
  background: linear-gradient(165deg, #3a3018ee, #1a140acc);
  color: #f5e6b8;
  box-shadow: inset 0 1px 0 #fff8e820, 0 2px 8px #0006;
  border: 1px solid #c9a22766;
}

.mission-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  max-height: min(52dvh, 420px);
  padding-right: 2px;
}

.mission-item {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--modal-line-soft);
  background: linear-gradient(165deg, #221c14ee, #12100ce8);
}

.mission-item.is-done {
  border-color: #c9a22766;
  background: linear-gradient(165deg, #2a2416f0, #16120cee);
}

.mission-item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.mission-item-title {
  display: block;
  font-size: 0.86rem;
  font-weight: 800;
  color: #f5edd8;
}

.mission-item-desc {
  margin: 3px 0 0;
  font-size: 0.7rem;
  line-height: 1.35;
  color: var(--modal-muted);
}

.mission-item-status {
  flex: 0 0 auto;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #c4b8d4;
  padding: 3px 7px;
  border-radius: 999px;
  border: 1px solid #8a7e9a44;
  background: #0a081288;
}

.mission-item.is-done .mission-item-status {
  color: #f0e0a0;
  border-color: #c9a22766;
  background: #2a221688;
}

.mission-item-bar {
  margin-top: 8px;
  height: 6px;
  border-radius: 999px;
  background: #0a0812cc;
  overflow: hidden;
  border: 1px solid #c9a22733;
}

.mission-item-bar > i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #c9a227, #f0e0a0);
}

.mission-item-foot {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mission-item-prog {
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: #e8d9a8;
}

.mission-item-go {
  margin: 0;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #c9a22766;
  background: linear-gradient(165deg, #2a2216ee, #14110cf2);
  color: #f5e6b8;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}

.mission-item-go:active {
  transform: scale(0.97);
}
`;
  fs.writeFileSync(cssPath, css, "utf8");
  console.log("ok css");
}

try {
  transformSync(main, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.error("esbuild FAIL", e.errors?.[0]);
  process.exit(1);
}

execSync("node apps/web/scripts/gen-i18n-packs.mjs", { stdio: "inherit" });
execSync("node scripts/check-hangul.mjs", { stdio: "inherit" });
console.log("done");
