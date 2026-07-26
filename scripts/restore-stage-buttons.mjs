/**
 * Restore stageButtons function body (UTF-8).
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

const start = cur.indexOf(
  "function stageButtons(list: StageDef[], opts?: { equipWeekly?: boolean }",
);
const typeStart = cur.indexOf("\ntype StagesRegion = {", start);
if (start < 0 || typeStart < 0) {
  console.error("markers missing", { start, typeStart });
  process.exit(1);
}

const fn = `function stageButtons(list: StageDef[], opts?: { equipWeekly?: boolean }): string {
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
}
`;

cur = cur.slice(0, start) + fn + cur.slice(typeStart + 1);
fs.writeFileSync(mainPath, cur, "utf8");
try {
  transformSync(cur, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
console.log("hangul", (cur.match(/[\uac00-\ud7a3]/g) || []).length);
console.log({
  stageOpen: cur.includes("data-stage-open"),
  stageDirect: cur.includes('data-stage="${s.id}"'),
  drop: cur.includes("regionDropIcons"),
  regionDiff: cur.includes("region-diff-select"),
});
