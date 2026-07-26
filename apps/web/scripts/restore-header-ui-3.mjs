import fs from 'node:fs';

const FILE = 'apps/web/src/main.ts';
let s = fs.readFileSync(FILE, 'utf8');

function replaceOnce(label, oldStr, newStr) {
  const occurrences = s.split(oldStr).length - 1;
  if (occurrences !== 1) {
    throw new Error(`[${label}] expected 1 occurrence, found ${occurrences}`);
  }
  s = s.replace(oldStr, newStr);
  console.log(`[ok] ${label}`);
}

// --- renderHome(): home-hud summoner panel ---
const homeHudStart = s.indexOf('  return `<div class="home-island">');
if (homeHudStart < 0) throw new Error('home-hud start not found');
const viewportIdx = s.indexOf('<div class="island-viewport" id="island-viewport">', homeHudStart);
if (viewportIdx < 0) throw new Error('island-viewport marker not found');
const oldHomeHud = s.slice(homeHudStart, viewportIdx);
fs.writeFileSync('apps/web/scripts/_extracted_old_homehud.txt', oldHomeHud, 'utf8');
console.log('extracted old home-hud length', oldHomeHud.length);

const newHomeHud = `  const activeEl = save.activeSummoner ?? "light";
  const activeSum = getActiveSummoner(save);
  return \`<div class="home-island">
    <div class="home-hud">
      <div class="home-summoner-portrait home-summoner-portrait--\${activeEl}" aria-label="\${SUMMONER_ELEMENT_LABEL[activeEl]} 서머너 Lv.\${activeSum.level}">
        <img src="/art/summoner/\${activeEl}.svg" width="64" height="64" alt="" draggable="false" />
        <span class="home-summoner-tag">\${SUMMONER_ELEMENT_LABEL[activeEl]}\${activeSum.awaken > 0 ? \` ·\${activeSum.awaken}\` : ""}</span>
        <div class="home-summoner-foot">
          <span class="home-summoner-lv">Lv.\${activeSum.level}</span>
          <div class="home-summoner-exp" role="progressbar" aria-valuenow="\${exp}" aria-valuemin="0" aria-valuemax="100" aria-label="경험치 \${exp}/100">
            <div class="home-summoner-exp-fill" style="width:\${Math.min(100, exp)}%"></div>
          </div>
        </div>
      </div>
      <button type="button" class="home-summoner-change" id="btn-summoner-picker" aria-expanded="\${summonerPickerOpen ? "true" : "false"}" aria-controls="summoner-picker-layer">
        변경
      </button>
    </div>
    `;

replaceOnce('renderHome home-hud swap', oldHomeHud, newHomeHud);

// --- bind(): add settings/res-more/summoner-picker bindings ---
const bindStart = s.indexOf('function bind(): void {');
if (bindStart < 0) throw new Error('bind() not found');
const dataCollectIdx = s.indexOf('data-collect', bindStart);
if (dataCollectIdx < 0) throw new Error('data-collect marker not found');
const dataCollectLineStart = s.lastIndexOf('\n  app.querySelectorAll', dataCollectIdx) + 1;
const oldBind = s.slice(bindStart, dataCollectLineStart);
fs.writeFileSync('apps/web/scripts/_extracted_old_bind.txt', oldBind, 'utf8');
console.log('extracted old bind length', oldBind.length);

const newBind = `function bind(): void {
  if (view === "auth") {
    bindAuth();
    return;
  }

  if (view === "home") {
    bindIslandPan();
    app.querySelector("#btn-summoner-picker")?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      summonerPickerOpen = !summonerPickerOpen;
      if (summonerPickerOpen && resMoreOpen) {
        resMoreOpen = false;
        applyResMoreOpen();
      }
      if (summonerPickerOpen && settingsOpen) {
        settingsOpen = false;
        const settings = app.querySelector("#settings-layer");
        settings?.remove();
        app.querySelector("#btn-settings")?.classList.remove("active");
        app.querySelector("#btn-settings")?.setAttribute("aria-expanded", "false");
      }
      applySummonerPickerOpen();
    });
    app
      .querySelector("#btn-summoner-picker-close")
      ?.addEventListener("click", () => {
        summonerPickerOpen = false;
        applySummonerPickerOpen();
      });
    app.querySelectorAll<HTMLButtonElement>("[data-summoner]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const el = btn.dataset.summoner as SummonerElement | undefined;
        if (!el || el === (save.activeSummoner ?? "light")) return;
        save = setActiveSummoner(save, el);
        summonerPickerOpen = false;
        persist();
        flash(\`\${SUMMONER_ELEMENT_LABEL[el]} 서머너로 전환\`);
        render();
      });
    });
  }
  if (view === "stages") {
    bindStagesPan();
  }

  app.querySelector("#btn-res-more")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    resMoreOpen = !resMoreOpen;
    if (resMoreOpen && summonerPickerOpen) {
      summonerPickerOpen = false;
      applySummonerPickerOpen();
    }
    applyResMoreOpen();
  });

  app.querySelector("#btn-settings")?.addEventListener("click", () => {
    settingsOpen = !settingsOpen;
    if (summonerPickerOpen) {
      summonerPickerOpen = false;
      applySummonerPickerOpen();
    }
    if (resMoreOpen) {
      resMoreOpen = false;
      applyResMoreOpen();
    }
    render();
  });

  app.querySelector("#btn-settings-close")?.addEventListener("click", () => {
    settingsOpen = false;
    render();
  });

  app.querySelector("#btn-logout")?.addEventListener("click", () => {
    settingsOpen = false;
    void logout();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      settingsOpen = false;
      summonerPickerOpen = false;
      resMoreOpen = false;
      const nav = btn.dataset.nav;
      if (view === "result" || view === "battle") {
        autoMode = false;
        clearAutoTimer();
        if (nav !== "battle" && nav !== "result") {
          battle = null;
          dmgFloats = [];
          if (nav === "home" || nav === "enhance" || nav === "shop" || nav === "party") {
            if (nav === "home") {
              currentStage = null;
              lastReward = null;
              lastScrollGain = 0;
            }
          }
        }
      }
      if (nav === "collect") {
        const now = Date.now();
        save.island = {
          ...save.island,
          buildings: save.island.buildings.map((b) =>
            b.id === "mana_pond"
              ? { ...b, lastUpdatedAt: now - 30 * 60 * 1000 }
              : b,
          ),
        };
        const island = collectMana(save.island, "mana_pond", now);
        save = { ...save, island };
        persist();
        flash(\`진액 수집 · 마나 \${Math.floor(island.mana)}\`);
        view = "home";
        partyDraft = null;
        render();
        return;
      }
      if (nav === "party") {
        partyDraft = new Set(save.party);
      } else if (view === "party" && nav !== "party") {
        partyDraft = null;
      }
      if (nav !== "stages") {
        stagesRegion = null;
      }
      view = nav as View;
      render();
    });
  });

`;

replaceOnce('bind() additions', oldBind, newBind);

fs.writeFileSync(FILE, s, 'utf8');
console.log('wrote stage 3, new file length', s.length);
