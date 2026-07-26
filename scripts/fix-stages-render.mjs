import fs from "fs";

const path = "apps/web/src/main.ts";
let s = fs.readFileSync(path, "utf8");

const goodTicker = `function renderBattleTicker(): string {
  if (!battle) return "";
  const lines = battle.log
    .filter(
      (l) =>
        /스톤패시브|획득|스폰|웨이브|강화 진문|진문 붕괴|포석 보너스|defeated|회복|진문개방|증폭선언|쌍착수|진문청소|진문수호|형상|이벤트|사석상점|속성|필승|봉인|돌흡수|진형파괴|서머너 착수|묘수|맞마나|이중층/.test(l),
    )
    .slice(-3);
  if (!lines.length) {
    return \`<div class="battle-ticker muted">전투 알림 — 따냄·아이템·패시브가 여기 표시됩니다</div>\`;
  }
  return \`<div class="battle-ticker" aria-live="polite">\${lines
    .map((l) => \`<span>\${l}</span>\`)
    .join("")}</div>\`;
}`;

if (!s.includes("function renderBattleTicker")) {
  console.error("missing renderBattleTicker");
  process.exit(1);
}

s = s.replace(
  /function renderBattleTicker\(\): string \{[\s\S]*?\n\}/,
  goodTicker,
);

// Fix renderStages return block: remove bad zones/hint, add nodes + clean HUD
const stagesStart = s.indexOf("function renderStages(): string {");
const stagesEnd = s.indexOf("\nfunction renderBattleTicker");
if (stagesStart < 0 || stagesEnd < 0) {
  console.error("cannot find renderStages bounds", stagesStart, stagesEnd);
  process.exit(1);
}

const before = s.slice(0, stagesStart);
const after = s.slice(stagesEnd);

const renderStages = `function renderStages(): string {
  const cleared = save.clearedStages.length;
  const seasonWins = save.arenaSeasonWins ?? 0;
  const regions = stagesRegions();
  const selected = stagesRegion
    ? regions.find((r) => r.id === stagesRegion) ?? null
    : null;
  const mqTotal = MAIN_QUEST_STAGES.length;
  const mqCleared = MAIN_QUEST_STAGES.filter((st) =>
    save.clearedStages.includes(st.id),
  ).length;
  const mqPathD = stagesMqPathD();
  const mqNodes = MAIN_QUEST_PIN_LAYOUT.map(
    (p) =>
      \`<span class="stages-mq-node" style="left:\${p.x}%;top:\${p.y}%" aria-hidden="true"><span class="stages-mq-node-core"></span></span>\`,
  ).join("");
  const pins = regions
    .map((r) => {
      const prog = regionProgress(r.stages);
      const active = selected?.id === r.id;
      const mq = isMainQuestRegion(r.id);
      const pinLayout = mq
        ? MAIN_QUEST_PIN_LAYOUT.find((p) => p.id === r.id)
        : null;
      const mark = mq ? String(pinLayout?.map ?? "") : "";
      const sub = mq
        ? \`\${prog.cleared}/\${STAGES_PER_AREA}\`
        : \`\${prog.cleared}/\${prog.total}\`;
      return \`<button type="button" class="stages-pin \${mq ? "stages-pin--mq" : "stages-pin--side"} stages-pin--\${r.tone}\${prog.unlocked ? "" : " is-locked"}\${active ? " is-active" : ""}\${prog.cleared === prog.total && prog.total > 0 ? " is-cleared" : ""}" style="left:\${r.x}%;top:\${r.y}%" data-region="\${r.id}" aria-label="\${r.name}\${prog.unlocked ? "" : " · 미해금"}" \${prog.unlocked ? "" : 'data-locked="1"'}>
        <span class="stages-pin-dot" aria-hidden="true">\${mq ? \`<span class="stages-pin-mark">\${mark}</span>\` : ""}</span>
        <span class="stages-pin-label">
          <strong>\${r.name}</strong>
          <small>\${mq && pinLayout ? pinLayout.areaKo + " · " : ""}\${sub}</small>
        </span>
      </button>\`;
    })
    .join("");
  return \`<div class="stages-hub stages-hub--map">
    <div class="stages-viewport" id="stages-viewport">
      <div class="stages-world" id="stages-world" style="transform:translate(\${stagesPan.x}px,\${stagesPan.y}px)">
        <img
          class="stages-map-img"
          src="/art/stages/stages-world-map.png"
          width="1080"
          height="1920"
          alt=""
          decoding="async"
          draggable="false"
        />
        <div class="stages-map-veil" aria-hidden="true"></div>
        <svg class="stages-mq-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="mq-path-soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.55" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="mq-path-grad" x1="8%" y1="92%" x2="62%" y2="18%">
              <stop offset="0%" stop-color="#8a6a1e" />
              <stop offset="35%" stop-color="#c9a227" />
              <stop offset="70%" stop-color="#f0e0a0" />
              <stop offset="100%" stop-color="#e8d9a8" />
            </linearGradient>
          </defs>
          <path class="stages-mq-path-glow" d="\${mqPathD}" fill="none" />
          <path class="stages-mq-path-rail" d="\${mqPathD}" fill="none" />
          <path class="stages-mq-path-core" d="\${mqPathD}" fill="none" />
          <path class="stages-mq-path-sheen" d="\${mqPathD}" fill="none" />
        </svg>
        <div class="stages-mq-nodes">\${mqNodes}</div>
        <div class="stages-map-pins">\${pins}</div>
      </div>
    </div>
    <header class="stages-map-hud">
      <div>
        <p class="stages-title">대륙 지도</p>
        <p class="stages-meta">메인 \${mqCleared}/\${mqTotal} · 전체 클리어 \${cleared} · 시즌승 \${seasonWins}</p>
      </div>
      <button type="button" class="secondary stages-map-back" data-nav="home">섬으로</button>
    </header>
    \${selected ? renderStagesRegionSheet(selected) : ""}
  </div>\`;
}
`;

s = before + renderStages + after;
fs.writeFileSync(path, s, "utf8");

// verify
const check = fs.readFileSync(path, "utf8");
const i = check.indexOf("renderBattleTicker");
console.log(JSON.stringify(check.slice(i, i + 220)));
console.log("has mq-nodes", check.includes("stages-mq-nodes"));
console.log("has 대륙", check.includes("대륙 지도"));
try {
  const esbuild = await import("esbuild");
  esbuild.transformSync(check, { loader: "ts" });
  console.log("esbuild OK");
} catch (e) {
  console.error(e.message);
}
