/**
 * Flatten stage entry: difficulty on region modal, direct battle on stage click.
 * Show energy costs + drop icons. UTF-8 safe.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { transformSync } from "esbuild";

const mainPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/src/main.ts",
);
let cur = fs.readFileSync(mainPath, "utf8").replace(/\r\n/g, "\n");
const hangulBefore = (cur.match(/[\uac00-\ud7a3]/g) || []).length;

// Import SYMBOL_SETS
if (!cur.includes("SYMBOL_SETS,")) {
  cur = cur.replace(
    "  SKILL_TREE_NODES,\n",
    "  SKILL_TREE_NODES,\n  SYMBOL_SETS,\n",
  );
  console.log("imported SYMBOL_SETS");
}

function replaceFn(name, next) {
  const start = cur.indexOf(`function ${name}(`);
  if (start < 0) return false;
  let i = cur.indexOf("{", start);
  let depth = 0;
  for (; i < cur.length; i++) {
    if (cur[i] === "{") depth++;
    else if (cur[i] === "}") {
      depth--;
      if (depth === 0) {
        cur = cur.slice(0, start) + next + cur.slice(i + 1);
        return true;
      }
    }
  }
  return false;
}

const stageButtonsFn = `function stageButtons(list: StageDef[], opts?: { equipWeekly?: boolean }): string {
  const vaultLeft = opts?.equipWeekly
    ? equipVaultRemaining(syncEquipVaultWeek(save))
    : null;
  const energyNow = Math.floor(save.island.energy);
  return list
    .map((s) => {
      const label = stageUnlockLabel(save, s);
      const locked =
        !isStageUnlocked(save, s.id) ||
        (vaultLeft !== null && vaultLeft <= 0);
      const done = save.clearedStages.includes(s.id);
      const diffOpen = isDifficultyOpen(s, stageEntryDiff);
      const cost = stageEnergyCost(s, stageEntryDiff);
      const canFight = !locked && diffOpen && (cost <= 0 || energyNow >= cost);
      const extra =
        s.gloryReward != null
          ? \` · 영광 \${s.gloryReward}\`
          : s.jinmunReward != null
            ? \` · 진문석 \${s.jinmunReward}\`
            : "";
      const weekly =
        vaultLeft !== null ? \` · 주간 \${vaultLeft}/\${EQUIP_VAULT_WEEKLY_LIMIT}\` : "";
      const costHint = !diffOpen
        ? "난이도 미해금"
        : cost <= 0
          ? "행동력 0"
          : \`행동력 \${cost}\`;
      const mark = done
        ? "✓"
        : s.mode === "scenario"
          ? \`\${s.map}-\${s.stage}\`
          : String(s.boardSize);
      return \`<button type="button" class="stage-card stage-card--sortie\${done ? " is-cleared" : ""}\${!canFight ? " is-disabled" : ""}" data-stage="\${s.id}" \${canFight ? "" : "disabled"}>
        <span class="stage-card-mark" aria-hidden="true">\${mark}</span>
        <span class="stage-card-body">
          <strong>\${label} · \${s.nameKo}</strong>
          <small>\${s.boardSize}×\${s.boardSize} · 웨이브 \${s.waves}\${extra}\${weekly}</small>
        </span>
        <span class="stage-card-cost\${cost > energyNow && diffOpen ? " is-short" : ""}">
          <img class="stage-card-cost-ico" src="/art/ui/res/energy.svg" width="14" height="14" alt="" draggable="false" />
          <strong>\${costHint}</strong>
        </span>
      </button>\`;
    })
    .join("");
}`;

const regionSheetFn = `function regionDropIcons(region: StagesRegion): string {
  const setIds = [...new Set(region.stages.map((s) => s.dropSetId))];
  const hasGear = region.equipWeekly || region.stages.some((s) => (s.gearDropChance ?? 0) > 0);
  const chips: string[] = [];
  for (const id of setIds) {
    const def = SYMBOL_SETS.find((x) => x.id === id);
    const name = def?.nameKo ?? id;
    const effect = def?.effectKo ?? "";
    chips.push(\`<span class="stage-drop-chip" title="\${name}\${effect ? \` · \${effect}\` : ""}">
      <img class="stage-drop-ico" src="/art/ui/symbol/\${id}.svg" width="28" height="28" alt="" draggable="false" />
      <span class="stage-drop-label">\${name}</span>
    </span>\`);
  }
  if (hasGear) {
    chips.push(\`<span class="stage-drop-chip" title="장비 드롭">
      <img class="stage-drop-ico" src="/art/ui/symbol/gear.svg" width="28" height="28" alt="" draggable="false" />
      <span class="stage-drop-label">장비</span>
    </span>\`);
  }
  if (!chips.length) return "";
  return \`<div class="stage-drop-row" aria-label="획득 가능">
    <p class="stage-drop-caption">획득</p>
    <div class="stage-drop-list">\${chips.join("")}</div>
  </div>\`;
}

function regionDifficultyOpen(region: StagesRegion, diff: StageDifficulty): boolean {
  if (diff === "normal") return true;
  return region.stages.some((s) => isDifficultyOpen(s, diff));
}

function renderStagesRegionSheet(region: StagesRegion): string {
  const prog = regionProgress(region.stages);
  const bans = save.arenaBanIds ?? [];
  const seasonWins = save.arenaSeasonWins ?? 0;
  const claimed = save.seasonRewardsClaimed ?? 0;
  const nextTierAt = (claimed + 1) * SEASON_REWARD_WINS;
  const energyNow = Math.floor(save.island.energy);
  const energyMax = save.island.energyMax ?? 100;
  const diffMeta =
    STAGE_DIFFICULTIES.find((d) => d.id === stageEntryDiff) ??
    STAGE_DIFFICULTIES[0]!;

  const diffOptions = STAGE_DIFFICULTIES.map((d) => {
    const open = regionDifficultyOpen(region, d.id);
    const selected = d.id === stageEntryDiff ? "selected" : "";
    const label = open ? d.labelKo : \`\${d.labelKo} (미해금)\`;
    return \`<option value="\${d.id}" \${selected} \${open ? "" : "disabled"}>\${label}</option>\`;
  }).join("");

  let extras = "";
  if (region.equipWeekly) {
    extras = \`<p class="stages-note">주간 \${equipVaultRemaining(syncEquipVaultWeek(save))}/\${EQUIP_VAULT_WEEKLY_LIMIT} · 가방 보관 후 강화진에서 장착/판매</p>\`;
  }
  if (region.guild) {
    extras = \`<p class="stages-note">기여 \${save.guildContribution ?? 0} · 최고 +\${save.guildRaidBest ?? 0}</p>\`;
  }
  if (region.warena) {
    const banPool = [
      ...new Set(WORLD_ARENA_STAGES.flatMap((s) => s.enemyMonsterIds)),
    ];
    const banRow = banPool
      .map((id) => {
        const m = getMonster(id);
        const on = bans.includes(id);
        return \`<button type="button" class="ban-chip\${on ? " active" : ""}" data-ban-toggle="\${id}">
          <span class="ban-chip-mark" aria-hidden="true">\${on ? "禁" : "可"}</span>
          <span class="ban-chip-body">
            <strong>\${m?.nameKo ?? id}</strong>
            <small>\${on ? "밴 해제" : "밴 지정"}</small>
          </span>
        </button>\`;
      })
      .join("");
    extras = \`<div class="season-panel">
        <p class="season-panel-title">시즌 보상 · 승 \${seasonWins}</p>
        <p class="muted stages-note">다음 티어 \${nextTierAt}승 · 현재 티어 \${claimed}</p>
        <button type="button" class="auth-btn-primary full" id="btn-season-claim">시즌 보상 수령</button>
      </div>
      <p class="stages-note">밴 \${bans.length ? bans.map((id) => getMonster(id)?.nameKo ?? id).join(", ") : "없음"} · 최대 2</p>
      <div class="ban-row">\${banRow}</div>\`;
  }

  return \`<div class="stages-region-layer" id="stages-region-layer">
    <button type="button" class="stages-region-backdrop" id="btn-region-close" aria-label="지역 닫기"></button>
    <div class="stages-region-sheet stages-region-sheet--card stages-region-sheet--\${region.tone}" role="dialog" aria-modal="true" aria-labelledby="stages-region-title">
      <header class="stages-region-head">
        <div>
          <p class="stages-region-kicker">\${region.blurb}</p>
          <h2 class="stages-region-title" id="stages-region-title">\${region.name}</h2>
          <p class="stages-meta">클리어 \${prog.cleared}/\${prog.total}\${prog.unlocked ? "" : " · 미해금"}</p>
        </div>
        <button type="button" class="secondary stages-region-x" id="btn-region-close-x" aria-label="닫기">닫기</button>
      </header>
      \${regionDropIcons(region)}
      <div class="stages-region-diff">
        <label class="stages-region-diff-label" for="region-diff-select">난이도</label>
        <div class="stage-entry-select-wrap stages-region-diff-select">
          <select class="stage-entry-select" id="region-diff-select" aria-label="시나리오 난이도">
            \${diffOptions}
          </select>
        </div>
        <p class="stages-region-diff-blurb">\${diffMeta.blurb}</p>
        <div class="stages-region-energy">
          <img src="/art/ui/res/energy.svg" width="16" height="16" alt="" draggable="false" />
          <span>보유 행동력 <strong>\${energyNow}</strong>/\${energyMax}</span>
        </div>
      </div>
      \${extras}
      <div class="stage-list stage-list--expedition">\${stageButtons(region.stages, { equipWeekly: region.equipWeekly })}</div>
    </div>
  </div>\`;
}`;

if (!replaceFn("stageButtons", stageButtonsFn)) {
  console.error("stageButtons replace failed");
  process.exit(1);
}
console.log("replaced stageButtons");

// Remove renderStageEntryModal if present
if (cur.includes("function renderStageEntryModal")) {
  replaceFn("renderStageEntryModal", "function __removed_entry_modal() { return \"\"; }");
  cur = cur.replace(
    /function __removed_entry_modal\(\) \{ return ""; \}\n?/,
    "",
  );
  console.log("removed renderStageEntryModal");
}

// Replace region sheet (and helpers before it)
if (cur.includes("function regionDropIcons")) {
  replaceFn("regionDropIcons", "function __tmp_drop(){return \"\";}");
  cur = cur.replace(/function __tmp_drop\(\)\{return "";\}\n?/, "");
}
if (cur.includes("function regionDifficultyOpen")) {
  replaceFn("regionDifficultyOpen", "function __tmp_diff(){return true;}");
  cur = cur.replace(/function __tmp_diff\(\)\{return true;\}\n?/, "");
}

const sheetStart = cur.indexOf("function renderStagesRegionSheet");
if (sheetStart < 0) {
  console.error("region sheet missing");
  process.exit(1);
}
// delete old function then insert new block (helpers + sheet)
let i = cur.indexOf("{", sheetStart);
let depth = 0;
for (; i < cur.length; i++) {
  if (cur[i] === "{") depth++;
  else if (cur[i] === "}") {
    depth--;
    if (depth === 0) {
      cur = cur.slice(0, sheetStart) + regionSheetFn + cur.slice(i + 1);
      break;
    }
  }
}
console.log("replaced region sheet + drop helpers");

// Remove entry modal injection from renderStages
cur = cur.replace(
  /\n\s*\$\{\(\(\) => \{\n\s*const entry = stageEntryId \? getStage\(stageEntryId\) : null;\n\s*return entry \? renderStageEntryModal\(entry\) : "";\n\s*\}\)\(\)\}/,
  "",
);

// Fix pin "잠김" if corrupted
cur = cur.replace(
  /<small>\$\{prog\.unlocked \? sub : "[^"]*"\}<\/small>/g,
  '<small>${prog.unlocked ? sub : "잠김"}</small>',
);

// Bind: region difficulty select; stage-open -> stage direct battle
cur = cur.replace(
  /app\.querySelectorAll<HTMLButtonElement>\("\[data-stage-open\]"\)[\s\S]*?app\.querySelectorAll<HTMLButtonElement>\("\[data-stage\]"\)\.forEach\(\(btn\) => \{\n    btn\.addEventListener\("click", \(\) => \{\n      const stage = getStage\(btn\.dataset\.stage!\);\n      if \(stage\) startBattle\(stage\);\n    \}\);\n  \}\);/,
  `app.querySelector("#region-diff-select")?.addEventListener("change", (ev) => {
    const v = (ev.target as HTMLSelectElement).value as StageDifficulty;
    if (v === "normal" || v === "hard" || v === "hell") {
      stageEntryDiff = v;
      render();
    }
  });

  app.querySelectorAll<HTMLButtonElement>("[data-stage]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stage = getStage(btn.dataset.stage!);
      if (stage) startBattle(stage, stageEntryDiff);
    });
  });`,
);

// Also clear stageEntryId usages when closing region (keep var for compatibility)
cur = cur.replace(/stageEntryId = null;\n/g, "stageEntryId = null;\n");

fs.writeFileSync(mainPath, cur, "utf8");
try {
  transformSync(cur, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const hangulAfter = (cur.match(/[\uac00-\ud7a3]/g) || []).length;
console.log("hangul", hangulBefore, "->", hangulAfter);
console.log({
  drop: cur.includes("regionDropIcons"),
  regionDiff: cur.includes("region-diff-select"),
  entryModal: cur.includes("function renderStageEntryModal"),
  stageOpen: cur.includes("data-stage-open"),
  stageDirect: cur.includes('data-stage="${s.id}"'),
});
