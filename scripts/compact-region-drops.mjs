/**
 * Compact region modal: difficulty select beside title; per-stage drop icons.
 * UTF-8 safe (unicode escapes for Korean).
 */
import fs from "fs";
import { transformSync } from "esbuild";

const p = "apps/web/src/main.ts";
let c = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

function replaceFn(name, next) {
  const start = c.indexOf(`function ${name}(`);
  if (start < 0) return false;
  // Brace match ignoring template strings roughly: track depth outside backticks
  let i = c.indexOf("{", start);
  let depth = 0;
  let inTick = false;
  let inStr = null;
  let esc = false;
  for (; i < c.length; i++) {
    const ch = c[i];
    if (inTick) {
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === "\\") {
        esc = true;
        continue;
      }
      if (ch === "`") {
        inTick = false;
        continue;
      }
      // nested ${ } — still count braces for simplicity when inside ${}
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          c = c.slice(0, start) + next + c.slice(i + 1);
          return true;
        }
      }
      continue;
    }
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === "\\") {
        esc = true;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "`") {
      inTick = true;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        c = c.slice(0, start) + next + c.slice(i + 1);
        return true;
      }
    }
  }
  return false;
}

const stageButtonsFn = `function stageDropSlots(stage: StageDef): Array<1 | 2 | 3 | 4 | 5 | 6> {
  if (stage.mode === "scenario") {
    if (stage.stage >= 1 && stage.stage <= 6) {
      return [stage.stage as 1 | 2 | 3 | 4 | 5 | 6];
    }
    return [1, 2, 3, 4, 5, 6];
  }
  const n = ((((stage.stage - 1) % 6) + 6) % 6) + 1;
  return [n as 1 | 2 | 3 | 4 | 5 | 6];
}

function stageDropPreview(stage: StageDef, opts?: { equipWeekly?: boolean }): string {
  const def = SYMBOL_SETS.find((x) => x.id === stage.dropSetId);
  const name = def?.nameKo ?? stage.dropSetId;
  const slots = stageDropSlots(stage);
  const chips = slots
    .map((slot) => {
      const label = \`\${name}\${slot}\`;
      return \`<span class="stage-drop-piece" title="\${label}">
        <img class="stage-drop-piece-ico" src="/art/ui/symbol/\${stage.dropSetId}-\${slot}.svg" width="28" height="28" alt="\${label}" draggable="false" />
        <span class="stage-drop-piece-label">\${label}</span>
      </span>\`;
    })
    .join("");
  const hasGear =
    !!opts?.equipWeekly || (stage.gearDropChance ?? 0) > 0 || stage.mode === "equip";
  const gear = hasGear
    ? \`<span class="stage-drop-piece stage-drop-piece--gear" title="\uC7A5\uBE44">
        <img class="stage-drop-piece-ico" src="/art/ui/symbol/gear.svg" width="28" height="28" alt="\uC7A5\uBE44" draggable="false" />
        <span class="stage-drop-piece-label">\uC7A5\uBE44</span>
      </span>\`
    : "";
  return \`<span class="stage-card-drops">\${chips}\${gear}</span>\`;
}

function stageButtons(list: StageDef[], opts?: { equipWeekly?: boolean }): string {
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
          ? \` · \uC601\uAD11 \${s.gloryReward}\`
          : s.jinmunReward != null
            ? \` · \uC9C4\uBB38\uC11D \${s.jinmunReward}\`
            : "";
      const weekly =
        vaultLeft !== null ? \` · \uC8FC\uAC04 \${vaultLeft}/\${EQUIP_VAULT_WEEKLY_LIMIT}\` : "";
      const costHint = !diffOpen
        ? "\uB09C\uC774\uB3C4 \uBBF8\uD574\uAE08"
        : cost <= 0
          ? "\uD589\uB3D9\uB825 0"
          : \`\uD589\uB3D9\uB825 \${cost}\`;
      const mark = done
        ? "\\u2713"
        : s.mode === "scenario"
          ? \`\${s.map}-\${s.stage}\`
          : String(s.boardSize);
      return \`<button type="button" class="stage-card stage-card--sortie\${done ? " is-cleared" : ""}\${!canFight ? " is-disabled" : ""}" data-stage="\${s.id}" \${canFight ? "" : "disabled"}>
        <span class="stage-card-mark" aria-hidden="true">\${mark}</span>
        <span class="stage-card-body">
          <strong>\${label} \\u00B7 \${s.nameKo}</strong>
          <small>\${s.boardSize}\\u00D7\${s.boardSize} \\u00B7 \uC6E8\uC774\uBE0C \${s.waves}\${extra}\${weekly}</small>
          \${stageDropPreview(s, opts)}
        </span>
        <span class="stage-card-cost\${cost > energyNow && diffOpen ? " is-short" : ""}">
          <strong>\${costHint}</strong>
        </span>
      </button>\`;
    })
    .join("");
}`;

// Fix checkmark - I used \\u2713 in template which would literally write \u2713 in output string when in a regular string... 
// Actually stageButtonsFn is a regular JS template literal (backticks). So \u2713 needs to be actual char or ${"\u2713"}
// I wrote "\\u2713" which becomes literal \u2713 in the source file - BAD.
// And "\\u00B7" same issue.

const stageButtonsFnFixed = stageButtonsFn
  .replace('"\\u2713"', '"\u2713"')
  .replaceAll("\\u00B7", "\u00B7")
  .replaceAll("\\u00D7", "\u00D7");

if (!replaceFn("stageButtons", stageButtonsFnFixed)) {
  // maybe stageDropSlots already exists - replace from stageDropSlots or stageButtons
  console.error("stageButtons replace failed, trying insert before type StagesRegion");
  process.exit(1);
}
console.log("replaced stageButtons (+ helpers)");

// Remove old regionDropIcons if present
if (c.includes("function regionDropIcons")) {
  if (!replaceFn("regionDropIcons", "function __drop_removed(){return \"\";}")) {
    console.error("regionDropIcons remove failed");
    process.exit(1);
  }
  c = c.replace(/function __drop_removed\(\)\{return "";\}\n?/, "");
  console.log("removed regionDropIcons");
}

const regionSheetFn = `function regionDifficultyOpen(region: StagesRegion, diff: StageDifficulty): boolean {
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
    const label = open ? d.labelKo : \`\${d.labelKo} (\uBBF8\uD574\uAE08)\`;
    return \`<option value="\${d.id}" \${selected} \${open ? "" : "disabled"}>\${label}</option>\`;
  }).join("");

  let extras = "";
  if (region.equipWeekly) {
    extras = \`<p class="stages-note">\uC8FC\uAC04 \${equipVaultRemaining(syncEquipVaultWeek(save))}/\${EQUIP_VAULT_WEEKLY_LIMIT} \u00B7 \uAC00\uBC29 \uBCF4\uAD00 \uD6C4 \uAC15\uD654\uC9C4\uC5D0\uC11C \uC7A5\uCC29/\uD310\uB9E4</p>\`;
  }
  if (region.guild) {
    extras = \`<p class="stages-note">\uAE30\uC5EC \${save.guildContribution ?? 0} \u00B7 \uCD5C\uACE0 +\${save.guildRaidBest ?? 0}</p>\`;
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
          <span class="ban-chip-mark" aria-hidden="true">\${on ? "\u7981" : "\u53EF"}</span>
          <span class="ban-chip-body">
            <strong>\${m?.nameKo ?? id}</strong>
            <small>\${on ? "\uBC94 \uD574\uC81C" : "\uBC94 \uC9C0\uC815"}</small>
          </span>
        </button>\`;
      })
      .join("");
    extras = \`<div class="season-panel">
        <p class="season-panel-title">\uC2DC\uC98C \uBCF4\uC0C1 \u00B7 \uC2B9 \${seasonWins}</p>
        <p class="muted stages-note">\uB2E4\uC74C \uD2F0\uC5B4 \${nextTierAt}\uC2B9 \u00B7 \uD604\uC7AC \uD2F0\uC5B4 \${claimed}</p>
        <button type="button" class="auth-btn-primary full" id="btn-season-claim">\uC2DC\uC98C \uBCF4\uC0C1 \uC218\uB839</button>
      </div>
      <p class="stages-note">\uBC94 \${bans.length ? bans.map((id) => getMonster(id)?.nameKo ?? id).join(", ") : "\uC5C6\uC74C"} \u00B7 \uCD5C\uB300 2</p>
      <div class="ban-row">\${banRow}</div>\`;
  }

  return \`<div class="stages-region-layer" id="stages-region-layer">
    <button type="button" class="stages-region-backdrop" id="btn-region-close" aria-label="\uC9C0\uC5ED \uB2EB\uAE30"></button>
    <div class="stages-region-sheet stages-region-sheet--card stages-region-sheet--\${region.tone}" role="dialog" aria-modal="true" aria-labelledby="stages-region-title">
      <header class="stages-region-head">
        <div class="stages-region-head-main">
          <p class="stages-region-kicker">\${region.blurb}</p>
          <div class="stages-region-title-row">
            <h2 class="stages-region-title" id="stages-region-title">\${region.name}</h2>
            <label class="stages-region-diff-inline">
              <span class="visually-hidden">\uB09C\uC774\uB3C4</span>
              <select class="stages-region-diff-select" id="region-diff-select" aria-label="\uC2DC\uB098\uB9AC\uC624 \uB09C\uC774\uB3C4" title="\${diffMeta.blurb}">
                \${diffOptions}
              </select>
            </label>
          </div>
          <p class="stages-meta">\uD074\uB9AC\uC5B4 \${prog.cleared}/\${prog.total}\${prog.unlocked ? "" : " \u00B7 \uBBF8\uD574\uAE08"} \u00B7 \uD589\uB3D9\uB825 \${energyNow}/\${energyMax}</p>
        </div>
        <button type="button" class="secondary stages-region-x" id="btn-region-close-x" aria-label="\uB2EB\uAE30">\uB2EB\uAE30</button>
      </header>
      \${extras}
      <div class="stage-list stage-list--expedition">\${stageButtons(region.stages, { equipWeekly: region.equipWeekly })}</div>
    </div>
  </div>\`;
}`;

// If regionDifficultyOpen exists, replace from it; else from renderStagesRegionSheet
if (c.includes("function regionDifficultyOpen")) {
  if (!replaceFn("regionDifficultyOpen", "function __rd_tmp(){return true;}")) {
    console.error("rd remove fail");
    process.exit(1);
  }
  c = c.replace(/function __rd_tmp\(\)\{return true;\}\n?/, "");
}
if (!replaceFn("renderStagesRegionSheet", regionSheetFn)) {
  console.error("region sheet replace failed");
  process.exit(1);
}
console.log("replaced region sheet");

// Fix sideMeta warena/guild names
c = c.replace(
  /warena: \{\n      name: "[^"]*",\n      blurb: "[^"]*",\n      stages: WORLD_ARENA_STAGES,\n      warena: true,\n    \},/,
  `warena: {\n      name: "\uC6D4\uB4DC \uC544\uB808\uB098",\n      blurb: "\uBC94\uD53D \uC2DC\uC98C \uB300\uC804",\n      stages: WORLD_ARENA_STAGES,\n      warena: true,\n    },`,
);
c = c.replace(
  /guild: \{\n      name: "[^"]*",\n      blurb: "[^"]*",\n      stages: GUILD_RAID_STAGES,\n      guild: true,\n    \},/,
  `guild: {\n      name: "\uAE38\uB4DC \uB808\uC774\uB4DC",\n      blurb: "\uAE38\uB4DC \uB808\uC774\uB4DC \uBCF4\uC2A4",\n      stages: GUILD_RAID_STAGES,\n      guild: true,\n    },`,
);
c = c.replace(
  /blurb: `\$\{meta\.blurb\} [^$\{]* \$\{pin\.landmarkKo\}`/,
  "blurb: `${meta.blurb} \u00B7 ${pin.landmarkKo}`",
);

// Bind: region-diff select instead of buttons
const oldBind = `  app.querySelectorAll<HTMLButtonElement>("[data-region-diff]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.regionDiff as StageDifficulty;
      if (v === "normal" || v === "hard" || v === "hell") {
        stageEntryDiff = v;
        render();
      }
    });
  });`;

const newBind = `  app.querySelector("#region-diff-select")?.addEventListener("change", (ev) => {
    const v = (ev.target as HTMLSelectElement).value as StageDifficulty;
    if (v === "normal" || v === "hard" || v === "hell") {
      stageEntryDiff = v;
      render();
    }
  });`;

if (c.includes(oldBind)) {
  c = c.replace(oldBind, newBind);
  console.log("updated bind");
} else if (!c.includes('app.querySelector("#region-diff-select")')) {
  // insert before data-stage bind
  const marker = `  app.querySelectorAll<HTMLButtonElement>("[data-stage]").forEach((btn) => {`;
  if (!c.includes(marker)) {
    console.error("bind marker missing");
    process.exit(1);
  }
  c = c.replace(marker, `${newBind}\n\n${marker}`);
  // remove old data-region-diff if any
  c = c.replace(
    /app\.querySelectorAll<HTMLButtonElement>\("\[data-region-diff\]"\)\.forEach\(\(btn\) => \{\n    btn\.addEventListener\("click", \(\) => \{\n      const v = btn\.dataset\.regionDiff as StageDifficulty;\n      if \(v === "normal" \|\| v === "hard" \|\| v === "hell"\) \{\n        stageEntryDiff = v;\n        render\(\);\n      \}\n    \}\);\n  \}\);\n\n/,
    "",
  );
  console.log("inserted select bind");
}

fs.writeFileSync(p, c, "utf8");
try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

console.log({
  hangul: (c.match(/[\uac00-\ud7a3]/g) || []).length,
  drops: c.includes("stageDropPreview"),
  select: c.includes("region-diff-select"),
  dropRow: c.includes("regionDropIcons"),
  qmarks: c.split("\n").filter((l) => /\?\?\?/.test(l)).length,
});
