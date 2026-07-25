import "./style.css";
import {
  Battle,
  makeUnit,
  type SummonerState,
  type Unit,
} from "stonesummoner-combat";
import {
  CHAPTER1_STAGES,
  getMonster,
  type StageDef,
} from "stonesummoner-data";
import {
  collectMana,
  createStarterIsland,
  tickProduction,
  type IslandState,
} from "stonesummoner-home";
import type { Point } from "stonesummoner-board";

type View = "home" | "stages" | "battle";

const app = document.querySelector<HTMLDivElement>("#app")!;
const SAVE_KEY = "stonesummoner.island.v1";

let island: IslandState = loadIsland();
let view: View = "home";
let battle: Battle | null = null;
let currentStage: StageDef | null = null;
let legalHints: Point[] = [];

function loadIsland(): IslandState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as IslandState;
      return tickProduction(parsed);
    }
  } catch {
    /* ignore */
  }
  return createStarterIsland();
}

function saveIsland(): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(island));
}

function summonerState(unitId: string, mana = 20): SummonerState {
  return {
    unitId,
    mana,
    manaMax: 100,
    manaRegenPerTick: 0.8,
    boardSense: 0.1,
  };
}

function unitFromMonster(
  id: string,
  team: "ally" | "enemy",
  uid: string,
): Unit {
  const m = getMonster(id)!;
  return makeUnit({
    id: uid,
    name: m.nameKo,
    team,
    kind: "monster",
    element: m.element,
    stats: {
      hp: m.baseStats.hp,
      atk: m.baseStats.atk,
      def: m.baseStats.def,
      spd: m.baseStats.spd,
      critRate: m.baseStats.critRate,
      critDmg: m.baseStats.critDmg,
    },
    skillCoeff: m.skillCoeff,
  });
}

function startBattle(stage: StageDef): void {
  if (island.energy < stage.energyCost) {
    alert("에너지가 부족합니다.");
    return;
  }
  island = { ...island, energy: island.energy - stage.energyCost };
  saveIsland();
  currentStage = stage;

  const allyIds = ["fire_fang", "dew_healer", "gale_scout", "seal_scholar"];
  const units: Unit[] = [
    makeUnit({
      id: "a-sum",
      name: "서머너",
      team: "ally",
      kind: "summoner",
      element: "light",
      stats: { hp: 520, atk: 90, def: 45, spd: 100, critRate: 15, critDmg: 50 },
      skillCoeff: 1,
    }),
    ...allyIds.map((id, i) => unitFromMonster(id, "ally", `a-${i}`)),
    makeUnit({
      id: "e-sum",
      name: "적 서머너",
      team: "enemy",
      kind: "summoner",
      element: "dark",
      stats: { hp: 480, atk: 80, def: 42, spd: 88, critRate: 12, critDmg: 50 },
      skillCoeff: 1,
    }),
    ...stage.enemyMonsterIds.map((id, i) =>
      unitFromMonster(id, "enemy", `e-${i}`),
    ),
  ];

  battle = new Battle({
    boardSize: stage.boardSize,
    units,
    allySummoner: summonerState("a-sum"),
    enemySummoner: summonerState("e-sum"),
  });
  battle.tickUntilReady();
  refreshLegal();
  view = "battle";
  render();
}

function refreshLegal(): void {
  legalHints = [];
  if (!battle || battle.phase !== "await_stone" || !battle.activeUnitId) return;
  const unit = battle.getUnit(battle.activeUnitId);
  if (!unit) return;
  const color = unit.team === "ally" ? "black" : "white";
  legalHints = battle.board.legalMoves(color);
}

function onCellClick(x: number, y: number): void {
  if (!battle || battle.phase !== "await_stone") return;
  const unit = battle.activeUnitId
    ? battle.getUnit(battle.activeUnitId)
    : null;
  if (!unit || unit.team !== "ally") return;
  if (!battle.playStone({ x, y })) return;
  battle.useSkill({
    useSummonerSkill: battle.canUseSummonerSkill(unit),
  });
  afterPlayerAction();
}

function afterPlayerAction(): void {
  if (!battle) return;
  // Enemy auto turns until ally ready or finished
  for (let i = 0; i < 12 && !battle.finishReason; i++) {
    const u = battle.tickUntilReady();
    if (!u) break;
    if (u.team === "ally") {
      refreshLegal();
      render();
      return;
    }
    battle.autoStone();
    battle.useSkill({ useSummonerSkill: battle.canUseSummonerSkill(u) });
  }
  if (battle.finishReason === "ally_win" && currentStage) {
    island = {
      ...island,
      mana: island.mana + 200 + currentStage.stage * 50,
    };
    saveIsland();
  }
  refreshLegal();
  render();
}

function autoAllyTurn(): void {
  if (!battle || battle.finishReason) return;
  if (battle.phase === "idle" || battle.phase === "resolved") {
    battle.tickUntilReady();
  }
  const unit = battle.activeUnitId
    ? battle.getUnit(battle.activeUnitId)
    : null;
  if (!unit) {
    render();
    return;
  }
  if (unit.team === "enemy") {
    afterPlayerAction();
    return;
  }
  if (battle.phase === "await_stone") battle.autoStone();
  if (battle.phase === "await_skill") {
    battle.useSkill({ useSummonerSkill: battle.canUseSummonerSkill(unit) });
  }
  afterPlayerAction();
}

function renderUnit(u: Unit): string {
  const active = battle?.activeUnitId === u.id ? " active" : "";
  const hpPct = Math.round((u.hp / u.stats.hp) * 100);
  const atbPct = Math.min(100, Math.round(u.atb));
  return `<div class="unit-card${active}">
    <div class="name">${u.name}</div>
    <div class="bar hp"><i style="width:${hpPct}%"></i></div>
    <div class="bar atb"><i style="width:${atbPct}%"></i></div>
  </div>`;
}

function renderBoard(): string {
  if (!battle) return "";
  const size = battle.board.size;
  const grid = battle.board.getBoard();
  const legalSet = new Set(legalHints.map((p) => `${p.x},${p.y}`));
  const canClick =
    battle.phase === "await_stone" &&
    !!battle.activeUnitId &&
    battle.getUnit(battle.activeUnitId!)?.team === "ally";

  let cells = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const stone = grid[y]![x];
      const legal = legalSet.has(`${x},${y}`);
      const stoneHtml = stone
        ? `<span class="stone ${stone}"></span>`
        : "";
      cells += `<button type="button" class="cell${legal && canClick ? " legal" : ""}" data-x="${x}" data-y="${y}" ${canClick && !stone ? "" : "disabled"}>${stoneHtml}</button>`;
    }
  }
  return `<div class="board size-${size}" style="grid-template-columns:repeat(${size},auto)">${cells}</div>`;
}

function render(): void {
  island = tickProduction(island);
  const allyMana = battle?.allySummoner;
  const manaPct = allyMana
    ? Math.round((allyMana.mana / allyMana.manaMax) * 100)
    : 0;

  app.innerHTML = `
    <header class="app-bar">
      <h1>StoneSummoner</h1>
      <div class="resources">
        <span>마나 ${Math.floor(island.mana)}</span>
        <span>크리스탈 ${island.crystal}</span>
        <span>에너지 ${island.energy}</span>
      </div>
    </header>
    <nav class="tabs">
      <button type="button" data-nav="home" class="${view === "home" ? "active" : ""}">홈</button>
      <button type="button" data-nav="stages" class="${view === "stages" || view === "battle" ? "active" : ""}">출정</button>
      <button type="button" data-nav="home" id="collect-nav">수집</button>
    </nav>
    <main>${view === "home" ? renderHome() : view === "stages" ? renderStages() : renderBattle(manaPct)}</main>
    <p class="install-hint">브라우저 메뉴에서 「홈 화면에 추가」로 PWA 설치 가능</p>
  `;

  bind();
}

function renderHome(): string {
  const pond = island.buildings.find((b) => b.id === "mana_pond");
  return `<div class="panel">
    <p class="muted">거점 섬 · 건물을 탭하세요</p>
    <div class="island-grid">
      <button type="button" class="building" data-b="summon_hearth"><strong>소환진</strong><small>몬스터 소환 (스텁)</small></button>
      <button type="button" class="building" data-b="power_circle"><strong>강화진</strong><small>강화·진화 (스텁)</small></button>
      <button type="button" class="building" data-b="gateway"><strong>출정문</strong><small>시나리오 진입</small></button>
      <button type="button" class="building" data-b="mana_pond"><strong>진액 연못</strong><small>대기 ${Math.floor(pond?.storedMana ?? 0)} / 4000</small></button>
    </div>
  </div>`;
}

function renderStages(): string {
  return `<div class="panel">
    <p class="muted">가렌숲 1챕터 · 보드 5×5 → 7×7</p>
    <div class="stage-list">
      ${CHAPTER1_STAGES.map(
        (s) =>
          `<button type="button" data-stage="${s.id}"><strong>${s.nameKo}</strong><br/><small class="muted">${s.boardSize}×${s.boardSize} · 에너지 ${s.energyCost} · ${s.waves}웨이브</small></button>`,
      ).join("")}
    </div>
  </div>`;
}

function renderBattle(manaPct: number): string {
  if (!battle || !currentStage) return "";
  const allies = battle.units.filter((u) => u.team === "ally");
  const enemies = battle.units.filter((u) => u.team === "enemy");
  const status = battle.finishReason
    ? battle.finishReason === "ally_win"
      ? "승리!"
      : "패배..."
    : `phase: ${battle.phase} · amp ${battle.currentAmplify().toFixed(2)} · 진문 ${battle.circle.boardPhase}`;

  return `<div class="battle-layout panel">
    <div class="muted">${currentStage.nameKo} · ${status}</div>
    <div class="team-row">${enemies.map(renderUnit).join("")}</div>
    <div class="board-wrap">
      ${renderBoard()}
      <div style="width:100%">
        <div class="muted">서머너 마나</div>
        <div class="bar mana"><i style="width:${manaPct}%"></i></div>
      </div>
    </div>
    <div class="team-row">${allies.map(renderUnit).join("")}</div>
    <div class="battle-actions">
      <button type="button" id="btn-auto">자동 1턴</button>
      <button type="button" class="secondary" id="btn-auto5">자동 ×5</button>
      <button type="button" class="secondary" id="btn-back">출정 목록</button>
    </div>
    <div class="log">${battle.log.slice(-8).map((l) => `<div>${l}</div>`).join("")}</div>
  </div>`;
}

function bind(): void {
  app.querySelectorAll<HTMLButtonElement>("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.nav as View;
      if (btn.id === "collect-nav") {
        island = collectMana(island);
        saveIsland();
        view = "home";
        render();
        return;
      }
      view = v;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-b]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.b;
      if (id === "gateway") {
        view = "stages";
        render();
      } else if (id === "mana_pond") {
        island = collectMana(island);
        saveIsland();
        render();
      } else {
        alert("Phase 1 스텁: 소환/강화 UI는 곧 연결됩니다.");
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-stage]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stage = CHAPTER1_STAGES.find((s) => s.id === btn.dataset.stage);
      if (stage) startBattle(stage);
    });
  });

  app.querySelectorAll<HTMLButtonElement>(".board .cell").forEach((btn) => {
    btn.addEventListener("click", () => {
      onCellClick(Number(btn.dataset.x), Number(btn.dataset.y));
    });
  });

  app.querySelector("#btn-auto")?.addEventListener("click", () => autoAllyTurn());
  app.querySelector("#btn-auto5")?.addEventListener("click", () => {
    for (let i = 0; i < 5 && battle && !battle.finishReason; i++) autoAllyTurn();
  });
  app.querySelector("#btn-back")?.addEventListener("click", () => {
    battle = null;
    view = "stages";
    render();
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // vite-plugin-pwa injects registration in production build
  });
}

render();
