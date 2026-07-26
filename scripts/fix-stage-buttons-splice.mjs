/**
 * Fix broken stageButtons splice + side region labels; verify parse.
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

const spliceMarker = `    .join("");
}): string {
  const vaultLeft = opts?.equipWeekly
    ? equipVaultRemaining(syncEquipVaultWeek(save))
    : null;
  return list
    .map((s) => {
      const label = stageUnlockLabel(save, s);
      const locked =
        !isStageUnlocked(save, s.id) ||
        (vaultLeft !== null && vaultLeft <= 0);
      const done = save.clearedStages.includes(s.id);
      const cost =
        s.energyCost > 0 ? \`에너지 \${s.energyCost}\` : "에너지 0";
      const extra =
        s.gloryReward != null
          ? \` · 영광 \${s.gloryReward}\`
          : s.jinmunReward != null
            ? \` · 진문석 \${s.jinmunReward}\`
            : "";
      const weekly =
        vaultLeft !== null ? \` · 주간 \${vaultLeft}/\${EQUIP_VAULT_WEEKLY_LIMIT}\` : "";
      return \`<button type="button" class="stage-card\${done ? " is-cleared" : ""}" data-stage-open="\${s.id}" \${locked ? "disabled" : ""}>
        <span class="stage-card-mark" aria-hidden="true">\${done ? "?" : s.boardSize}</span>
        <span class="stage-card-body">
          <strong>\${label} ? \${s.nameKo}</strong>
          <small>\${s.boardSize}×\${s.boardSize} · 웨이브 \${s.waves} · \${cost}\${extra}\${weekly}</small>
        </span>
      </button>\`;
    })
    .join("");
}`;

if (!cur.includes(`}): string {\n  const vaultLeft = opts?.equipWeekly`)) {
  console.error("duplicate remnant marker not found");
  process.exit(1);
}

// Safer: cut from `}): string {` after first stageButtons join through next `type StagesRegion`
const badStart = cur.indexOf(`}): string {\n  const vaultLeft = opts?.equipWeekly`);
const typeStart = cur.indexOf("\ntype StagesRegion = {", badStart);
if (badStart < 0 || typeStart < 0) {
  console.error("cut points missing", { badStart, typeStart });
  process.exit(1);
}
cur = cur.slice(0, badStart) + "}" + cur.slice(typeStart);
console.log("removed duplicate stageButtons remnant");

// Fix side meta labels (ASCII-anchored replacements)
const sideFixes = [
  [
    `depth: { name: "`,
    `depth: { name: "심연 던전", blurb: "끝없는 층 도전", stages: DEPTH_STAGES },`,
  ],
  [
    `arena: { name: "`,
    `arena: { name: "아레나", blurb: "시즌 대전", stages: ARENA_STAGES },`,
  ],
  [
    `cadence: {\n      name: "`,
    `cadence: {\n      name: "카덴스 · 시련",\n      blurb: "요일·시련 스테이지",\n      stages: [...WEEKDAY_STAGES, ...TRIAL_STAGES],\n    },`,
  ],
  [
    `equip: {\n      name: "`,
    `equip: {\n      name: "장비 던전",\n      blurb: "주간 장비 파밍",\n      stages: EQUIP_STAGES,\n      equipWeekly: true,\n    },`,
  ],
  [
    `warena: {\n      name: "`,
    `warena: {\n      name: "월드 아레나",\n      blurb: "밴픽 시즌 대전",\n      stages: WORLD_ARENA_STAGES,\n      warena: true,\n    },`,
  ],
  [
    `guild: {\n      name: "`,
    `guild: {\n      name: "길드 레이드",\n      blurb: "길드 레이드 보스",\n      stages: GUILD_RAID_STAGES,\n      guild: true,\n    },`,
  ],
];

// Replace whole sideMeta object body by finding unique start/end
const sideStart = cur.indexOf("  > = {\n    depth:");
const sideEnd = cur.indexOf("\n  };\n  const sideRegions:", sideStart);
if (sideStart < 0 || sideEnd < 0) {
  console.error("sideMeta block missing");
  process.exit(1);
}
const newSide = `  > = {
    depth: { name: "심연 던전", blurb: "끝없는 층 도전", stages: DEPTH_STAGES },
    arena: { name: "아레나", blurb: "시즌 대전", stages: ARENA_STAGES },
    cadence: {
      name: "카덴스 · 시련",
      blurb: "요일·시련 스테이지",
      stages: [...WEEKDAY_STAGES, ...TRIAL_STAGES],
    },
    equip: {
      name: "장비 던전",
      blurb: "주간 장비 파밍",
      stages: EQUIP_STAGES,
      equipWeekly: true,
    },
    warena: {
      name: "월드 아레나",
      blurb: "밴픽 시즌 대전",
      stages: WORLD_ARENA_STAGES,
      warena: true,
    },
    guild: {
      name: "길드 레이드",
      blurb: "길드 레이드 보스",
      stages: GUILD_RAID_STAGES,
      guild: true,
    },
  }`;
cur = cur.slice(0, sideStart) + newSide + cur.slice(sideEnd);
console.log("fixed sideMeta labels");

// Fix blurb separator corruption
cur = cur.replace(
  "blurb: `${meta.blurb} � ${pin.landmarkKo}`",
  "blurb: `${meta.blurb} · ${pin.landmarkKo}`",
);
// also if already different corruption
cur = cur.replace(
  /blurb: `\$\{meta\.blurb\} [^$\{]+ \$\{pin\.landmarkKo\}`/,
  "blurb: `${meta.blurb} · ${pin.landmarkKo}`",
);

// Locked region flash
cur = cur.replace(
  'flash("이전 스테이지를 먼저 클리어하세요.");',
  'flash("아직 해금되지 않은 지역입니다.");',
);

fs.writeFileSync(mainPath, cur, "utf8");
try {
  transformSync(cur, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const hangul = (cur.match(/[\uac00-\ud7a3]/g) || []).length;
console.log("hangul", hangul);
console.log({
  stageOpen: cur.includes("data-stage-open"),
  stageDirect: /data-stage="\$\{s\.id\}"/.test(cur),
  remant: cur.includes("}): string {"),
});
