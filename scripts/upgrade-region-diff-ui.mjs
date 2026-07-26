/**
 * Upgrade region difficulty to segment buttons + energy flash wording.
 */
import fs from "fs";
import { transformSync } from "esbuild";

const p = "apps/web/src/main.ts";
let c = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

const oldDiffBlock = `  const diffOptions = STAGE_DIFFICULTIES.map((d) => {
    const open = regionDifficultyOpen(region, d.id);
    const selected = d.id === stageEntryDiff ? "selected" : "";
    const label = open ? d.labelKo : \`\${d.labelKo} (미해금)\`;
    return \`<option value="\${d.id}" \${selected} \${open ? "" : "disabled"}>\${label}</option>\`;
  }).join("");`;

const newDiffBlock = `  const diffSeg = STAGE_DIFFICULTIES.map((d) => {
    const open = regionDifficultyOpen(region, d.id);
    const active = d.id === stageEntryDiff ? " is-active" : "";
    const locked = open ? "" : " is-locked";
    return \`<button type="button" class="stages-diff-btn stages-diff-btn--\${d.id}\${active}\${locked}" data-region-diff="\${d.id}" \${open ? "" : "disabled"} aria-pressed="\${d.id === stageEntryDiff ? "true" : "false"}">\${d.labelKo}</button>\`;
  }).join("");`;

if (!c.includes(oldDiffBlock)) {
  console.error("diffOptions block missing");
  process.exit(1);
}
c = c.replace(oldDiffBlock, newDiffBlock);

const oldDiffUi = `      <div class="stages-region-diff">
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
      </div>`;

const newDiffUi = `      <div class="stages-region-diff">
        <div class="stages-region-diff-top">
          <p class="stages-region-diff-label">난이도</p>
          <div class="stages-diff-seg" role="group" aria-label="시나리오 난이도">\${diffSeg}</div>
        </div>
        <p class="stages-region-diff-blurb">\${diffMeta.blurb}</p>
        <div class="stages-region-energy">
          <img src="/art/ui/res/energy.svg" width="16" height="16" alt="" draggable="false" />
          <span>보유 행동력 <strong>\${energyNow}</strong>/\${energyMax}</span>
        </div>
      </div>`;

if (!c.includes(oldDiffUi)) {
  console.error("diff UI block missing");
  process.exit(1);
}
c = c.replace(oldDiffUi, newDiffUi);

const oldBind = `  app.querySelector("#region-diff-select")?.addEventListener("change", (ev) => {
    const v = (ev.target as HTMLSelectElement).value as StageDifficulty;
    if (v === "normal" || v === "hard" || v === "hell") {
      stageEntryDiff = v;
      render();
    }
  });`;

const newBind = `  app.querySelectorAll<HTMLButtonElement>("[data-region-diff]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.regionDiff as StageDifficulty;
      if (v === "normal" || v === "hard" || v === "hell") {
        stageEntryDiff = v;
        render();
      }
    });
  });`;

if (!c.includes(oldBind)) {
  console.error("bind missing");
  process.exit(1);
}
c = c.replace(oldBind, newBind);

c = c.replace(
  'flash("에너지가 부족합니다.");',
  'flash("행동력이 부족합니다.");',
);

fs.writeFileSync(p, c, "utf8");
try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
console.log("hangul", (c.match(/[\uac00-\ud7a3]/g) || []).length);
