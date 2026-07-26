/**
 * Restore stageButtons body between unique markers (no brace matching).
 */
import fs from "fs";
import { transformSync } from "esbuild";

const p = "apps/web/src/main.ts";
let c = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

const start = c.indexOf(
  "function stageButtons(list: StageDef[], opts?: { equipWeekly?: boolean }",
);
const end = c.indexOf("\ntype StagesRegion = {", start);
if (start < 0 || end < 0) {
  console.error("markers", { start, end });
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
          ? \` · \uC601\uAD11 \${s.gloryReward}\`
          : s.jinmunReward != null
            ? \` · \uC9C4\uBB38\uC11D \${s.jinmunReward}\`
            : "";
      const weekly =
        vaultLeft !== null
          ? \` · \uC8FC\uAC04 \${vaultLeft}/\${EQUIP_VAULT_WEEKLY_LIMIT}\`
          : "";
      const costHint = !diffOpen
        ? "\uB09C\uC774\uB3C4 \uBBF8\uD574\uAE08"
        : cost <= 0
          ? "\uD589\uB3D9\uB825 0"
          : \`\uD589\uB3D9\uB825 \${cost}\`;
      const mark = done
        ? "\u2713"
        : s.mode === "scenario"
          ? \`\${s.map}-\${s.stage}\`
          : String(s.boardSize);
      return \`<button type="button" class="stage-card stage-card--sortie\${done ? " is-cleared" : ""}\${!canFight ? " is-disabled" : ""}" data-stage="\${s.id}" \${canFight ? "" : "disabled"}>
        <span class="stage-card-mark" aria-hidden="true">\${mark}</span>
        <span class="stage-card-body">
          <strong>\${label} \u00B7 \${s.nameKo}</strong>
          <small>\${s.boardSize}\u00D7\${s.boardSize} \u00B7 \uC6E8\uC774\uBE0C \${s.waves}\${extra}\${weekly}</small>
          \${stageDropPreview(s, opts)}
        </span>
        <span class="stage-card-cost\${cost > energyNow && diffOpen ? " is-short" : ""}">
          <strong>\${costHint}</strong>
        </span>
      </button>\`;
    })
    .join("");
}
`;

c = c.slice(0, start) + fn + c.slice(end + 1);
c = c.replace('blurb: "\uBC94\uD53D \uC2DC\uC98C \uB300\uC804"', 'blurb: "\uBC94\uD53D \uC2DC\uC98C \uB300\uC804"');
// fix 범픽 -> 밴픽 if present
c = c.replace('blurb: "범픽 시즌 대전"', 'blurb: "밴픽 시즌 대전"');

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
  preview: c.includes("stageDropPreview(s, opts)"),
  select: c.includes("region-diff-select"),
  sheet: c.includes("stages-region-title-row"),
});
