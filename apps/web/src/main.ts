import "./style.css";
import type { Battle, SkillResult, StoneSuggestion, Unit } from "stonesummoner-combat";
import {
  CHAPTER1_STAGES,
  describeGear,
  describeSymbol,
  gearEnhanceManaCost,
  getMonster,
  MAX_GEAR_ENHANCE,
  MAX_SYMBOL_ENHANCE,
  symbolEnhanceManaCost,
  type StageDef,
} from "stonesummoner-data";
import { collectMana, tickProduction } from "stonesummoner-home";
import {
  applyRewards,
  createNewSave,
  createStageBattle,
  describeOwned,
  enhanceManaCost,
  isStageUnlocked,
  MAX_MONSTER_LEVEL,
  runEnhance,
  runEnhanceGear,
  runEnhanceSymbol,
  runEquipSymbol,
  runSetParty,
  runSummon,
  stageUnlockLabel,
  type PlayerSave,
} from "stonesummoner-loop";
import type { Point } from "stonesummoner-board";

type View = "home" | "summon" | "enhance" | "party" | "stages" | "battle";

const app = document.querySelector<HTMLDivElement>("#app")!;
const SAVE_KEY = "stonesummoner.save.v5";

let save: PlayerSave = loadSave();
let view: View = "home";
let battle: Battle | null = null;
let currentStage: StageDef | null = null;
let legalHints: Point[] = [];
let stoneSuggestions: StoneSuggestion[] = [];
let selectedTargetId: string | null = null;
let lastRewardMsg = "";
let toast = "";
let battleSpeed: 1 | 2 | 3 = 1;
let autoMode = false;
let autoTimer: ReturnType<typeof setTimeout> | null = null;
let dmgFloats: { id: number; text: string; crit: boolean; ult: boolean }[] = [];
let floatSeq = 0;

function migrateSave(raw: unknown): PlayerSave | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<PlayerSave>;
  if (!p.island) return null;
  const base = createNewSave();
  const roster = (p.roster?.length ? p.roster : base.roster).map((m) => ({
    ...m,
    symbolSlots: m.symbolSlots ?? [null, null, null, null, null, null],
  }));
  const island = tickProduction({
    ...base.island,
    ...p.island,
    summonerExp: p.island.summonerExp ?? 0,
    energyMax: p.island.energyMax ?? 100,
    energyUpdatedAt: p.island.energyUpdatedAt ?? Date.now(),
  });
  return {
    ...base,
    island,
    symbols: p.symbols?.length ? p.symbols : base.symbols,
    clearedStages: p.clearedStages ?? [],
    roster,
    party: p.party?.length ? p.party : base.party,
    scrolls: typeof p.scrolls === "number" ? p.scrolls : base.scrolls,
    gear: p.gear ?? base.gear,
  };
}

function loadSave(): PlayerSave {
  try {
    const raw =
      localStorage.getItem(SAVE_KEY) ??
      localStorage.getItem("stonesummoner.save.v4") ??
      localStorage.getItem("stonesummoner.save.v3") ??
      localStorage.getItem("stonesummoner.save.v2");
    if (raw) {
      const migrated = migrateSave(JSON.parse(raw));
      if (migrated) return migrated;
    }
  } catch {
    /* ignore */
  }
  return createNewSave();
}

function persist(): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function flash(msg: string): void {
  toast = msg;
}

function startBattle(stage: StageDef): void {
  if (!isStageUnlocked(save, stage.id)) {
    flash("이전 스테이지를 먼저 클리어하세요.");
    render();
    return;
  }
  if (Math.floor(save.island.energy) < stage.energyCost) {
    flash("에너지가 부족합니다.");
    render();
    return;
  }
  save = {
    ...save,
    island: {
      ...save.island,
      energy: Math.floor(save.island.energy) - stage.energyCost,
      energyUpdatedAt: Date.now(),
    },
  };
  persist();
  currentStage = stage;
  lastRewardMsg = "";
  autoMode = false;
  clearAutoTimer();
  dmgFloats = [];
  selectedTargetId = null;
  battle = createStageBattle(stage, save);
  battle.tickUntilReady();
  refreshLegal();
  ensureTarget();
  view = "battle";
  render();
}

function refreshLegal(): void {
  legalHints = [];
  stoneSuggestions = [];
  if (!battle || battle.phase !== "await_stone" || !battle.activeUnitId) return;
  const unit = battle.getUnit(battle.activeUnitId);
  if (!unit) return;
  const color = unit.team === "ally" ? "black" : "white";
  legalHints = battle.board.legalMoves(color);
  if (unit.team === "ally") {
    stoneSuggestions = battle.suggestStones(unit);
  }
}

function ensureTarget(): string | undefined {
  if (!battle) return undefined;
  if (selectedTargetId) {
    const t = battle.getUnit(selectedTargetId);
    if (t?.alive && t.kind === "monster" && t.team === "enemy") {
      return selectedTargetId;
    }
  }
  const enemies = battle.units.filter(
    (u) => u.team === "enemy" && u.kind === "monster" && u.alive,
  );
  const lowest = enemies.sort((a, b) => a.hp - b.hp)[0];
  selectedTargetId = lowest?.id ?? null;
  return selectedTargetId ?? undefined;
}

function grantRewardIfNeeded(): void {
  if (!battle?.finishReason || !currentStage) return;
  if (lastRewardMsg) return;
  const victory = battle.finishReason === "ally_win";
  const scrollsBefore = save.scrolls;
  const { save: next, reward } = applyRewards(save, currentStage, victory);
  save = next;
  persist();
  const scrollGain = save.scrolls > scrollsBefore ? ` · 소환서 +${save.scrolls - scrollsBefore}` : "";
  lastRewardMsg = victory
    ? `보상: 마나 +${reward.mana}` +
      (reward.summonerExp ? ` · EXP +${reward.summonerExp}` : "") +
      (reward.levelsGained
        ? ` · 서머너 Lv.${save.island.summonerLevel}`
        : "") +
      (reward.symbol
        ? ` · 상징 ${reward.symbol.setId}(${reward.symbol.slot})`
        : "") +
      scrollGain
    : "패배 — 보상 없음";
}

function onCellClick(x: number, y: number): void {
  if (!battle || battle.phase !== "await_stone") return;
  if (autoMode) return;
  const unit = battle.activeUnitId
    ? battle.getUnit(battle.activeUnitId)
    : null;
  if (!unit || unit.team !== "ally") return;
  if (!battle.playStone({ x, y })) return;
  refreshLegal();
  render();
}

function pushDamageFloats(hits: SkillResult[]): void {
  const ids: number[] = [];
  for (const h of hits) {
    floatSeq += 1;
    ids.push(floatSeq);
    dmgFloats.push({
      id: floatSeq,
      text: h.crit ? `CRIT ${h.damage}` : `-${h.damage}`,
      crit: h.crit,
      ult: h.usedSummonerSkill,
    });
  }
  if (!ids.length) return;
  setTimeout(() => {
    const idSet = new Set(ids);
    dmgFloats = dmgFloats.filter((f) => !idSet.has(f.id));
    const layer = app.querySelector(".dmg-layer");
    if (layer) layer.innerHTML = renderDmgLayer();
  }, 900 / battleSpeed);
}

function renderDmgLayer(): string {
  return dmgFloats
    .map(
      (f, i) =>
        `<span class="dmg-float${f.crit ? " crit" : ""}${f.ult ? " ult" : ""}" style="--i:${i}">${f.text}</span>`,
    )
    .join("");
}

function frontRow(units: Unit[]): Unit[] {
  return units.filter((u) => u.kind === "monster");
}

function backSummoner(units: Unit[]): Unit | undefined {
  return units.find((u) => u.kind === "summoner");
}

function renderSummonerBack(u: Unit | undefined, side: "enemy" | "ally"): string {
  if (!u) return "";
  const active = battle?.activeUnitId === u.id ? " active" : "";
  return `<div class="summoner-back ${side}${active}">
    <div class="name">${u.name}</div>
    <div class="muted">후열 · 착수/마나</div>
  </div>`;
}

function afterPlayerAction(): void {
  if (!battle) return;
  for (let i = 0; i < 12 && !battle.finishReason; i++) {
    const u = battle.tickUntilReady();
    if (!u) break;
    if (u.team === "ally") {
      refreshLegal();
      if (autoMode) {
        scheduleAuto();
      } else {
        render();
      }
      return;
    }
    battle.autoStone();
    const hits = battle.useSkill({
      useSummonerSkill: battle.canUseSummonerSkill(u),
    });
    pushDamageFloats(hits);
  }
  if (battle.finishReason) {
    autoMode = false;
    clearAutoTimer();
    grantRewardIfNeeded();
  }
  refreshLegal();
  render();
  if (autoMode && battle && !battle.finishReason) scheduleAuto();
}

function clearAutoTimer(): void {
  if (autoTimer) {
    clearTimeout(autoTimer);
    autoTimer = null;
  }
}

function scheduleAuto(): void {
  clearAutoTimer();
  if (!autoMode || !battle || battle.finishReason) return;
  autoTimer = setTimeout(() => {
    autoAllyTurn();
  }, 420 / battleSpeed);
}

function autoAllyTurn(): void {
  if (!battle || battle.finishReason) {
    autoMode = false;
    clearAutoTimer();
    render();
    return;
  }
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
    const hits = battle.useSkill({
      useSummonerSkill: battle.canUseSummonerSkill(unit),
    });
    pushDamageFloats(hits);
  }
  afterPlayerAction();
}

function castSkill(mode: "basic" | "ult" | "smart"): void {
  if (!battle || battle.phase !== "await_skill" || autoMode) return;
  const unit = battle.activeUnitId
    ? battle.getUnit(battle.activeUnitId)
    : null;
  if (!unit || unit.team !== "ally") return;
  const useUlt =
    mode === "ult" ||
    (mode === "smart" && battle.canUseSummonerSkill(unit));
  if (mode === "ult" && !battle.canUseSummonerSkill(unit)) {
    flash("마나가 부족합니다.");
    render();
    return;
  }
  const targetId = useUlt ? undefined : ensureTarget();
  const hits = battle.useSkill({
    useSummonerSkill: useUlt,
    targetId,
  });
  pushDamageFloats(hits);
  afterPlayerAction();
}

function renderUnit(u: Unit, opts?: { targetable?: boolean }): string {
  const active = battle?.activeUnitId === u.id ? " active" : "";
  const targeted =
    opts?.targetable && selectedTargetId === u.id ? " targeted" : "";
  const hpPct = Math.round((u.hp / u.stats.hp) * 100);
  const atbPct = Math.min(100, Math.round(u.atb));
  const shield = u.shieldHp && u.shieldHp > 0 ? Math.round(u.shieldHp) : 0;
  const dead = !u.alive ? " dead" : "";
  const tag = opts?.targetable && u.alive ? "button" : "div";
  const attrs =
    opts?.targetable && u.alive
      ? `type="button" data-target="${u.id}"`
      : "";
  return `<${tag} class="unit-card${active}${targeted}${dead}" ${attrs}>
    <div class="name">${u.name}</div>
    <div class="hp-num">${Math.max(0, Math.round(u.hp))}${shield ? `+${shield}` : ""}</div>
    <div class="bar hp"><i style="width:${hpPct}%"></i></div>
    <div class="bar atb"><i style="width:${atbPct}%"></i></div>
  </${tag}>`;
}

function renderBoard(): string {
  if (!battle) return "";
  const size = battle.board.size;
  const grid = battle.board.getBoard();
  const legalSet = new Set(legalHints.map((p) => `${p.x},${p.y}`));
  const suggestMap = new Map(
    stoneSuggestions.map((s) => [`${s.point.x},${s.point.y}`, s]),
  );
  const canClick =
    battle.phase === "await_stone" &&
    !!battle.activeUnitId &&
    battle.getUnit(battle.activeUnitId!)?.team === "ally" &&
    !autoMode;

  let cells = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const stone = grid[y]![x];
      const legal = legalSet.has(`${x},${y}`);
      const sug = suggestMap.get(`${x},${y}`);
      const token = battle.tokenAt(x, y);
      const tokenClass = token ? ` token token-${token.id}` : "";
      const sugClass = sug ? ` suggest suggest-${sug.rank}` : "";
      const tokenLabel =
        token?.id === "crit_charm"
          ? "치"
          : token?.id === "shield_core"
            ? "실"
            : token?.id === "capture_magnet"
              ? "자"
              : "";
      const stoneHtml = stone
        ? `<span class="stone ${stone}"></span>`
        : sug
          ? `<span class="suggest-mark">${sug.rank}</span>`
          : token
            ? `<span class="token-mark">${tokenLabel}</span>`
            : "";
      cells += `<button type="button" class="cell${legal && canClick ? " legal" : ""}${tokenClass}${sugClass}" data-x="${x}" data-y="${y}" ${canClick && !stone ? "" : "disabled"}>${stoneHtml}</button>`;
    }
  }
  return `<div class="board size-${size}" style="grid-template-columns:repeat(${size},auto)">${cells}</div>`;
}

function renderSuggestStrip(): string {
  if (!stoneSuggestions.length || battle?.phase !== "await_stone") return "";
  return `<div class="suggest-strip">
    ${stoneSuggestions
      .map(
        (s) =>
          `<button type="button" class="suggest-chip" data-sgx="${s.point.x}" data-sgy="${s.point.y}">
            <strong>${s.rank}위</strong>
            <span>(${s.point.x},${s.point.y})</span>
            <small>따냄 ${s.capturedCount} · 마나 +${s.manaGain} · amp +${s.amplifyDelta.toFixed(2)}${s.hasToken ? " · 토큰" : ""}</small>
          </button>`,
      )
      .join("")}
  </div>`;
}

function mainContent(manaPct: number): string {
  switch (view) {
    case "summon":
      return renderSummon();
    case "enhance":
      return renderEnhance();
    case "party":
      return renderParty();
    case "stages":
      return renderStages();
    case "battle":
      return renderBattle(manaPct);
    default:
      return renderHome();
  }
}

function render(): void {
  save = { ...save, island: tickProduction(save.island) };
  const island = save.island;
  const allyMana = battle?.allySummoner;
  const manaPct = allyMana
    ? Math.round((allyMana.mana / allyMana.manaMax) * 100)
    : 0;
  const tabStages = view === "stages" || view === "battle";

  app.innerHTML = `
    <header class="app-bar">
      <h1>StoneSummoner</h1>
      <div class="resources">
        <span>Lv.${island.summonerLevel}</span>
        <span>마나 ${Math.floor(island.mana)}</span>
        <span>에너지 ${Math.floor(island.energy)}/${island.energyMax ?? 100}</span>
        <span>소환서 ${save.scrolls}</span>
      </div>
      ${toast ? `<p class="toast">${toast}</p>` : ""}
    </header>
    <main>${mainContent(manaPct)}</main>
    <nav class="tabs">
      <button type="button" data-nav="home" class="${view === "home" || view === "summon" || view === "enhance" || view === "party" ? "active" : ""}">홈</button>
      <button type="button" data-nav="stages" class="${tabStages ? "active" : ""}">출정</button>
      <button type="button" data-nav="collect">수집</button>
    </nav>
    <p class="install-hint">공유 → 홈 화면에 추가 (PWA)</p>
  `;

  bind();
  if (toast) {
    const t = toast;
    toast = "";
    setTimeout(() => {
      if (!toast) {
        const el = app.querySelector(".toast");
        if (el && el.textContent === t) el.remove();
      }
    }, 2200);
  }
}

function renderHome(): string {
  const pond = save.island.buildings.find((b) => b.id === "mana_pond");
  const exp = Math.floor(save.island.summonerExp ?? 0);
  return `<div class="panel">
    <p class="muted">서머너 Lv.${save.island.summonerLevel} · EXP ${exp}/100 · 파티 ${save.party.length}/4</p>
    <div class="island-grid">
      <button type="button" class="building" data-b="summon_hearth"><strong>소환진</strong><small>소환서 ${save.scrolls}장</small></button>
      <button type="button" class="building" data-b="power_circle"><strong>강화진</strong><small>레벨업 · 최대 Lv.${MAX_MONSTER_LEVEL}</small></button>
      <button type="button" class="building" data-b="gateway"><strong>출정문</strong><small>시나리오 진입</small></button>
      <button type="button" class="building" data-b="mana_pond"><strong>진액 연못</strong><small>대기 ${Math.floor(pond?.storedMana ?? 0)} / 4000</small></button>
      <button type="button" class="building" data-b="party"><strong>파티</strong><small>출전 몬스터 편성</small></button>
    </div>
  </div>`;
}

function renderParty(): string {
  const selected = new Set(save.party);
  return `<div class="panel">
    <p class="muted">파티 편성 · 탭하여 선택 (최대 4)</p>
    <div class="stage-list" id="party-pick">
      ${save.roster
        .map((m) => {
          const on = selected.has(m.uid);
          return `<button type="button" class="${on ? "picked" : ""}" data-party-toggle="${m.uid}">
            <strong>${on ? "★ " : ""}${describeOwned(m)}</strong>
          </button>`;
        })
        .join("")}
    </div>
    <button type="button" class="primary full" id="btn-party-save">편성 저장 (${save.party.length}/4)</button>
    <button type="button" class="secondary full" data-nav="home">섬으로</button>
  </div>`;
}

function renderSummon(): string {
  const last = save.roster[save.roster.length - 1];
  return `<div class="panel">
    <p class="muted">소환진 · 소환서 1장 소모</p>
    <button type="button" class="primary full" id="btn-summon">소환하기 (${save.scrolls})</button>
    <p class="muted" style="margin-top:12px">최근 보유</p>
    <ul class="roster-list">
      ${save.roster
        .slice(-6)
        .reverse()
        .map((m) => {
          const def = getMonster(m.monsterId);
          return `<li>${describeOwned(m)}${def ? ` · ${def.element}` : ""}</li>`;
        })
        .join("")}
    </ul>
    ${last ? "" : ""}
    <button type="button" class="secondary full" data-nav="home">섬으로</button>
  </div>`;
}

function renderEnhance(): string {
  const acc = save.gear.accessory;
  const orb = save.gear.orb;
  return `<div class="panel">
    <p class="muted">강화진 · 몬스터 / 장비 / 상징</p>
    <p class="section-label">몬스터</p>
    <div class="stage-list">
      ${save.roster
        .map((m) => {
          const cost = enhanceManaCost(m.level);
          const maxed = m.level >= MAX_MONSTER_LEVEL;
          const inParty = save.party.includes(m.uid) ? " · 파티" : "";
          return `<button type="button" data-enh="${m.uid}" ${maxed ? "disabled" : ""}>
            <strong>${describeOwned(m)}${inParty}</strong><br/>
            <small class="muted">${maxed ? "최대 레벨" : `강화 −마나 ${cost}`}</small>
          </button>`;
        })
        .join("")}
    </div>
    <p class="section-label">서머너 장비</p>
    <div class="stage-list">
      <button type="button" data-gear="accessory" ${acc.enhance >= MAX_GEAR_ENHANCE ? "disabled" : ""}>
        <strong>${describeGear(acc)}</strong><br/>
        <small class="muted">${acc.enhance >= MAX_GEAR_ENHANCE ? "최대" : `강화 −마나 ${gearEnhanceManaCost(acc.enhance)}`}</small>
      </button>
      <button type="button" data-gear="orb" ${orb.enhance >= MAX_GEAR_ENHANCE ? "disabled" : ""}>
        <strong>${describeGear(orb)}</strong><br/>
        <small class="muted">${orb.enhance >= MAX_GEAR_ENHANCE ? "최대" : `강화 −마나 ${gearEnhanceManaCost(orb.enhance)}`}</small>
      </button>
    </div>
    <p class="section-label">상징</p>
    <div class="stage-list">
      ${save.symbols
        .map((s, i) => {
          const maxed = s.enhance >= MAX_SYMBOL_ENHANCE;
          return `<div class="sym-row">
            <button type="button" data-sym="${i}" ${maxed ? "disabled" : ""}>
              <strong>${describeSymbol(s)}</strong><br/>
              <small class="muted">${maxed ? "최대" : `강화 −마나 ${symbolEnhanceManaCost(s.enhance)}`}</small>
            </button>
            <button type="button" class="secondary sym-eq" data-equip-sym="${i}">장착</button>
          </div>`;
        })
        .join("")}
    </div>
    <button type="button" class="secondary full" data-nav="home" style="margin-top:10px">섬으로</button>
  </div>`;
}

function renderStages(): string {
  return `<div class="panel">
    <p class="muted">가렌숲 · 순차 해금 · 클리어 ${save.clearedStages.length}/5</p>
    <div class="stage-list">
      ${CHAPTER1_STAGES.map((s) => {
        const label = stageUnlockLabel(save, s);
        const locked = !isStageUnlocked(save, s.id);
        return `<button type="button" data-stage="${s.id}" ${locked ? "disabled" : ""}>
          <strong>${label} · ${s.nameKo}</strong><br/>
          <small class="muted">${s.boardSize}×${s.boardSize} · 웨이브 ${s.waves} · 에너지 ${s.energyCost}</small>
        </button>`;
      }).join("")}
    </div>
  </div>`;
}

function renderBattle(manaPct: number): string {
  if (!battle || !currentStage) return "";
  const allyUnits = battle.units.filter((u) => u.team === "ally");
  const enemyUnits = battle.units.filter((u) => u.team === "enemy");
  const allyFront = frontRow(allyUnits);
  const enemyFront = frontRow(enemyUnits);
  const allyBack = backSummoner(allyUnits);
  const enemyBack = backSummoner(enemyUnits);
  const phase = battle.circle.boardPhase;
  const phaseLabel =
    phase <= 0 ? "일반 진문" : `강화 진문 ${"I".repeat(Math.min(phase, 3))}`;
  const active = battle.activeUnitId
    ? battle.getUnit(battle.activeUnitId)
    : null;
  const awaitSkill =
    battle.phase === "await_skill" && active?.team === "ally" && !autoMode;
  const canUlt = !!active && battle.canUseSummonerSkill(active);
  const status = battle.finishReason
    ? battle.finishReason === "ally_win"
      ? "승리! (적 소환수 전멸)"
      : "패배... (아군 소환수 전멸)"
    : `${battle.phase} · amp ${battle.currentAmplify().toFixed(2)}/${battle.powerAmplifyCap().toFixed(2)} · ${phaseLabel} (${battle.circle.stoneSummonCount}/${battle.circle.resetThreshold})`;

  const skillHint =
    battle.phase === "await_stone" && active?.team === "ally"
      ? "추천 착수(1·2·3) 또는 칸 탭"
      : awaitSkill
        ? "적 소환수를 탭해 대상 지정 후 스킬"
        : autoMode
          ? `AUTO x${battleSpeed}`
          : "";

  return `<div class="battle-layout panel">
    <div class="battle-top">
      <div class="muted">${currentStage.nameKo} · ${currentStage.boardSize}×${currentStage.boardSize} · 웨이브 ${battle.currentWave}/${battle.totalWaves}</div>
      <div class="muted">${status}</div>
    </div>
    <div class="muted item-legend">서머너 후열(무적) · 전열 소환수 전멸 시 승패</div>
    ${lastRewardMsg ? `<div class="muted">${lastRewardMsg}</div>` : ""}
    ${renderSummonerBack(enemyBack, "enemy")}
    <div class="team-row enemy">${enemyFront.map((u) => renderUnit(u, { targetable: awaitSkill })).join("")}</div>
    <div class="board-wrap">
      <div class="dmg-layer">${renderDmgLayer()}</div>
      ${renderBoard()}
      ${renderSuggestStrip()}
      <div style="width:100%">
        <div class="muted">서머너 마나 ${Math.floor(battle.allySummoner.mana)}/${battle.allySummoner.manaMax}</div>
        <div class="bar mana mana-lg"><i style="width:${manaPct}%"></i></div>
      </div>
    </div>
    <div class="skill-row">
      <button type="button" id="sk-basic" ${awaitSkill ? "" : "disabled"}>평타</button>
      <button type="button" id="sk-ult" class="ult${canUlt ? " ready" : ""}" ${awaitSkill && canUlt ? "" : "disabled"}>진문개방</button>
      <button type="button" id="sk-smart" ${awaitSkill ? "" : "disabled"}>추천</button>
    </div>
    ${skillHint ? `<p class="muted skill-hint">${skillHint}</p>` : ""}
    <div class="team-row ally">${allyFront.map((u) => renderUnit(u)).join("")}</div>
    ${renderSummonerBack(allyBack, "ally")}
    <div class="battle-hud">
      <button type="button" class="secondary" id="btn-back">나가기</button>
      <button type="button" class="secondary" id="btn-speed">x${battleSpeed}</button>
      <button type="button" id="btn-auto-toggle" class="${autoMode ? "auto-on" : ""}">${autoMode ? "AUTO ON" : "AUTO"}</button>
    </div>
    <div class="log">${battle.log.slice(-6).map((l) => `<div>${l}</div>`).join("")}</div>
  </div>`;
}

function bind(): void {
  app.querySelectorAll<HTMLButtonElement>("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nav = btn.dataset.nav;
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
        flash(`진액 수집 · 마나 ${Math.floor(island.mana)}`);
        view = "home";
        render();
        return;
      }
      view = nav as View;
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
        const now = Date.now();
        const island = collectMana(save.island, "mana_pond", now);
        save = { ...save, island };
        persist();
        flash(`진액 수집 · 마나 ${Math.floor(island.mana)}`);
        render();
      } else if (id === "summon_hearth") {
        view = "summon";
        render();
      } else if (id === "power_circle") {
        view = "enhance";
        render();
      } else if (id === "party") {
        view = "party";
        render();
      }
    });
  });

  app.querySelector("#btn-summon")?.addEventListener("click", () => {
    const r = runSummon(save);
    save = r.save;
    persist();
    flash(r.message);
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-enh]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = btn.dataset.enh!;
      const r = runEnhance(save, uid);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-gear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slot = btn.dataset.gear === "orb" ? "orb" : "accessory";
      const r = runEnhanceGear(save, slot);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-sym]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.sym!;
      const r = runEnhanceSymbol(save, idx);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-equip-sym]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.equipSym!;
      const mon = save.party[0] ?? save.roster[0]?.uid ?? "0";
      const r = runEquipSymbol(save, mon, idx);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  const partyDraft = new Set(save.party);
  app.querySelectorAll<HTMLButtonElement>("[data-party-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = btn.dataset.partyToggle!;
      if (partyDraft.has(uid)) partyDraft.delete(uid);
      else if (partyDraft.size < 4) partyDraft.add(uid);
      else flash("파티는 최대 4명입니다.");
      btn.classList.toggle("picked", partyDraft.has(uid));
      const label = btn.querySelector("strong");
      if (label) {
        const text = label.textContent?.replace(/^★\s*/, "") ?? "";
        label.textContent = (partyDraft.has(uid) ? "★ " : "") + text;
      }
      const saveBtn = app.querySelector("#btn-party-save");
      if (saveBtn) saveBtn.textContent = `편성 저장 (${partyDraft.size}/4)`;
    });
  });

  app.querySelector("#btn-party-save")?.addEventListener("click", () => {
    if (partyDraft.size === 0) {
      flash("최소 1명을 선택하세요.");
      return;
    }
    const r = runSetParty(save, [...partyDraft]);
    save = r.save;
    persist();
    flash(r.message);
    view = "home";
    render();
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

  app.querySelectorAll<HTMLButtonElement>(".suggest-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      onCellClick(Number(btn.dataset.sgx), Number(btn.dataset.sgy));
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedTargetId = btn.dataset.target ?? null;
      render();
    });
  });

  app.querySelector("#sk-basic")?.addEventListener("click", () => castSkill("basic"));
  app.querySelector("#sk-ult")?.addEventListener("click", () => castSkill("ult"));
  app.querySelector("#sk-smart")?.addEventListener("click", () => castSkill("smart"));

  app.querySelector("#btn-speed")?.addEventListener("click", () => {
    battleSpeed = battleSpeed === 1 ? 2 : battleSpeed === 2 ? 3 : 1;
    render();
    if (autoMode) scheduleAuto();
  });

  app.querySelector("#btn-auto-toggle")?.addEventListener("click", () => {
    if (!battle || battle.finishReason) return;
    autoMode = !autoMode;
    if (autoMode) {
      scheduleAuto();
    } else {
      clearAutoTimer();
    }
    render();
  });

  app.querySelector("#btn-back")?.addEventListener("click", () => {
    autoMode = false;
    clearAutoTimer();
    battle = null;
    currentStage = null;
    dmgFloats = [];
    view = "stages";
    render();
  });
}

render();
