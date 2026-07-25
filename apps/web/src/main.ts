import "./style.css";
import {
  pickAutoSkillIndex,
  type Battle,
  type SkillResult,
  type StoneSuggestion,
  type Unit,
} from "stonesummoner-combat";
import {
  ARENA_STAGES,
  CHAPTER1_STAGES,
  CHAPTER2_STAGES,
  DEPTH_STAGES,
  GLORY_BUILDINGS,
  GUILD_RAID_STAGES,
  TRIAL_STAGES,
  WEEKDAY_STAGES,
  WORLD_ARENA_STAGES,
  canGrindSymbol,
  canImprintSymbol,
  describeGear,
  describeSymbol,
  gearEnhanceManaCost,
  getMonster,
  getStage,
  MAX_GEAR_ENHANCE,
  MAX_SYMBOL_ENHANCE,
  SYMBOL_GRIND_MANA_COST,
  SYMBOL_IMPRINT_CRYSTAL_COST,
  symbolEnhanceManaCost,
  type StageDef,
} from "stonesummoner-data";
import {
  buildingUpgradeManaCost,
  collectMana,
  MAX_BUILDING_LEVEL,
  PHASE1_BUILDINGS,
  productionManaPerHour,
  productionStorageCap,
  tickProduction,
} from "stonesummoner-home";
import {
  applyRewards,
  createDemoSave,
  createNewSave,
  createStageBattle,
  describeOwned,
  enhanceManaCost,
  evolveCrystalCost,
  evolveManaCost,
  evolveMinLevel,
  isStageUnlocked,
  MAX_EVOLVE,
  MAX_MONSTER_LEVEL,
  MAX_SKILL_LEVEL,
  runBuyGlory,
  runBuyScroll,
  runDailyWish,
  runEnhance,
  runEnhanceGear,
  runEnhanceSymbol,
  runEquipSymbol,
  runEvolve,
  runFusion,
  runGrindSymbol,
  homeCollectCrystal,
  FUSION_MANA_COST,
  runImprintSymbol,
  runSetParty,
  runSkillUp,
  runSummon,
  runUpgradeBuilding,
  SCROLL_BUY_MANA_COST,
  skillUpManaCost,
  skillUpMinMonsterLevel,
  stageUnlockLabel,
  type PlayerSave,
} from "stonesummoner-loop";
import type { Point } from "stonesummoner-board";

type View =
  | "auth"
  | "home"
  | "summon"
  | "enhance"
  | "shop"
  | "pond"
  | "glory"
  | "fusion"
  | "party"
  | "stages"
  | "battle";

type SessionUser = { id: string; email: string | null; kind: string };

const app = document.querySelector<HTMLDivElement>("#app")!;
const SAVE_KEY = "stonesummoner.save.v5";
const DEMO_SAVE_KEY = "stonesummoner.save.demo.v5";

let sessionUser: SessionUser | null = null;
const authUi = { pane: "menu" as "menu" | "login" | "register" };
let bootReady = false;
let cloudTimer: ReturnType<typeof setTimeout> | null = null;

let save: PlayerSave = createNewSave();
let view: View = "auth";
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

function localSaveKey(): string {
  return sessionUser?.kind === "demo" ? DEMO_SAVE_KEY : SAVE_KEY;
}

async function apiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  try {
    const res = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function migrateSave(raw: unknown): PlayerSave | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<PlayerSave>;
  if (!p.island) return null;
  const base = createNewSave();
  const roster = (p.roster?.length ? p.roster : base.roster).map((m) => ({
    ...m,
    evolve: m.evolve ?? 0,
    skillLevels: (m.skillLevels ?? [1, 1, 1]) as [number, number, number],
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
    gloryPoints: typeof p.gloryPoints === "number" ? p.gloryPoints : 0,
    jinmunStones: typeof p.jinmunStones === "number" ? p.jinmunStones : 0,
    gloryLevels: p.gloryLevels ?? {},
  };
}

function loadLocalSave(key = localSaveKey()): PlayerSave | null {
  try {
    const raw =
      localStorage.getItem(key) ??
      (key === SAVE_KEY
        ? localStorage.getItem("stonesummoner.save.v4") ??
          localStorage.getItem("stonesummoner.save.v3") ??
          localStorage.getItem("stonesummoner.save.v2")
        : null);
    if (raw) return migrateSave(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return null;
}

function scheduleCloudSave(): void {
  if (!sessionUser || sessionUser.id.startsWith("local-")) return;
  if (cloudTimer) clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => {
    void apiJson("/api/save", {
      method: "PUT",
      body: JSON.stringify({ save }),
    });
  }, 600);
}

function persist(): void {
  localStorage.setItem(localSaveKey(), JSON.stringify(save));
  scheduleCloudSave();
}

async function enterWithUser(
  user: SessionUser,
  opts?: { demo?: boolean; fresh?: boolean },
): Promise<void> {
  sessionUser = user;
  if (opts?.demo) {
    save = createDemoSave();
    localStorage.setItem(DEMO_SAVE_KEY, JSON.stringify(save));
    if (!user.id.startsWith("local-")) {
      await apiJson("/api/save", {
        method: "PUT",
        body: JSON.stringify({ save }),
      });
    }
  } else if (opts?.fresh) {
    save = createNewSave();
    persist();
  } else if (!user.id.startsWith("local-")) {
    const remote = await apiJson<{ save: unknown }>("/api/save");
    const migrated = remote?.save ? migrateSave(remote.save) : null;
    if (migrated) {
      save = migrated;
      localStorage.setItem(localSaveKey(), JSON.stringify(save));
    } else {
      save = loadLocalSave() ?? createNewSave();
      await apiJson("/api/save", {
        method: "PUT",
        body: JSON.stringify({ save }),
      });
      localStorage.setItem(localSaveKey(), JSON.stringify(save));
    }
  } else {
    save = loadLocalSave() ?? (opts?.demo ? createDemoSave() : createNewSave());
    localStorage.setItem(localSaveKey(), JSON.stringify(save));
  }
  authUi.pane = "menu";
  view = "home";
  flash(
    user.kind === "demo"
      ? "데모 모드로 입장했습니다."
      : user.kind === "guest"
        ? "게스트로 플레이합니다."
        : `환영합니다${user.email ? ` · ${user.email}` : ""}`,
  );
  render();
}

async function logout(): Promise<void> {
  if (sessionUser && !sessionUser.id.startsWith("local-")) {
    await apiJson("/api/auth/logout", { method: "POST", body: "{}" });
  }
  sessionUser = null;
  battle = null;
  currentStage = null;
  autoMode = false;
  clearAutoTimer();
  authUi.pane = "menu";
  view = "auth";
  save = createNewSave();
  flash("로그아웃했습니다.");
  render();
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
      (reward.crystal ? ` · 크리스탈 +${reward.crystal}` : "") +
      (reward.glory ? ` · 영광 +${reward.glory}` : "") +
      (reward.jinmun ? ` · 진문석 +${reward.jinmun}` : "") +
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
    const text =
      h.damage < 0
        ? `+${-h.damage}`
        : h.crit
          ? `CRIT ${h.damage}`
          : `-${h.damage}`;
    dmgFloats.push({
      id: floatSeq,
      text,
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
    const hits = battle.canUseSummonerSkill(unit)
      ? battle.useSkill({ useSummonerSkill: true })
      : battle.useSkill({
          skillIndex: pickAutoSkillIndex(unit, battle.units),
        });
    pushDamageFloats(hits);
  }
  afterPlayerAction();
}

function castSkill(mode: "ult" | "smart" | number): void {
  if (!battle || battle.phase !== "await_skill" || autoMode) return;
  const unit = battle.activeUnitId
    ? battle.getUnit(battle.activeUnitId)
    : null;
  if (!unit || unit.team !== "ally") return;

  if (mode === "ult") {
    if (!battle.canUseSummonerSkill(unit)) {
      flash("마나가 부족합니다.");
      render();
      return;
    }
    const hits = battle.useSkill({ useSummonerSkill: true });
    pushDamageFloats(hits);
    afterPlayerAction();
    return;
  }

  const skillIndex =
    mode === "smart" ? pickAutoSkillIndex(unit, battle.units) : mode;
  if (typeof skillIndex === "number" && !battle.canUseSkill(unit, skillIndex)) {
    flash("스킬 쿨다운 중");
    render();
    return;
  }
  const targetId = ensureTarget();
  const hits = battle.useSkill({ skillIndex, targetId });
  if (!hits.length) {
    flash("스킬을 사용할 수 없습니다.");
    render();
    return;
  }
  pushDamageFloats(hits);
  afterPlayerAction();
}

function renderSkillButtons(active: Unit | null, awaitSkill: boolean): string {
  const skills = active?.skills ?? [];
  const cds = active?.skillCd ?? [];
  const slots = [0, 1, 2].map((i) => {
    const sk = skills[i];
    const cd = cds[i] ?? 0;
    const label = sk ? sk.nameKo : i === 0 ? "평타" : `S${i + 1}`;
    const cdHint = cd > 0 ? ` CD${cd}` : "";
    const disabled = !awaitSkill || (sk ? cd > 0 : i > 0);
    return `<button type="button" data-skill="${i}" ${disabled ? "disabled" : ""}>
      ${label}${cdHint}
    </button>`;
  });
  return slots.join("");
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

function renderAuth(): string {
  const pane = authUi.pane;
  if (pane === "login" || pane === "register") {
    const title = pane === "login" ? "로그인" : "회원가입";
    const pwAuto = pane === "login" ? "current-password" : "new-password";
    return `<div class="auth-screen">
      <p class="auth-brand">StoneSummoner</p>
      <h2 class="auth-title">${title}</h2>
      <p class="auth-copy">이메일과 비밀번호로 세이브를 클라우드에 보관합니다.</p>
      <form id="auth-form" class="auth-form">
        <label>이메일<input name="email" type="email" autocomplete="username" required /></label>
        <label>비밀번호<input name="password" type="password" autocomplete="${pwAuto}" minlength="6" required /></label>
        <button type="submit">${title}</button>
      </form>
      <button type="button" class="secondary full" id="auth-back">뒤로</button>
    </div>`;
  }
  return `<div class="auth-screen">
    <p class="auth-brand">StoneSummoner</p>
    <h2 class="auth-title">상징으로 키우고<br/>마법진에서 싸운다</h2>
    <p class="auth-copy">수집형 RPG 데모 — 홈에서 소환·강화 후 가렌숲으로 출정하세요.</p>
    <div class="auth-cta">
      <button type="button" id="auth-demo">데모 플레이 (테스트)</button>
      <button type="button" class="secondary" id="auth-login">로그인</button>
      <button type="button" class="secondary" id="auth-register">회원가입</button>
      <button type="button" class="secondary" id="auth-guest">게스트로 계속</button>
    </div>
  </div>`;
}

function mainContent(manaPct: number): string {
  switch (view) {
    case "auth":
      return renderAuth();
    case "summon":
      return renderSummon();
    case "enhance":
      return renderEnhance();
    case "shop":
      return renderShop();
    case "pond":
      return renderPond();
    case "glory":
      return renderGlory();
    case "fusion":
      return renderFusion();
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
  if (!bootReady) {
    app.innerHTML = `<div class="auth-screen"><p class="auth-brand">StoneSummoner</p><p class="muted">불러오는 중…</p></div>`;
    return;
  }

  if (view !== "auth") {
    save = { ...save, island: tickProduction(save.island) };
  }
  const island = save.island;
  const allyMana = battle?.allySummoner;
  const manaPct = allyMana
    ? Math.round((allyMana.mana / allyMana.manaMax) * 100)
    : 0;
  const tabStages = view === "stages" || view === "battle";
  const demoTag = sessionUser?.kind === "demo" ? `<span class="demo-tag">DEMO</span>` : "";

  if (view === "auth") {
    app.innerHTML = `
      <main class="auth-main">${renderAuth()}</main>
      ${toast ? `<p class="toast auth-toast">${toast}</p>` : ""}
    `;
    bind();
    if (toast) {
      const t = toast;
      toast = "";
      setTimeout(() => {
        if (!toast) {
          const el = app.querySelector(".toast");
          if (el) el.remove();
        }
      }, 2200);
      void t;
    }
    return;
  }

  app.innerHTML = `
    <header class="app-bar">
      <h1>StoneSummoner ${demoTag}</h1>
      <div class="resources">
        <span>Lv.${island.summonerLevel}</span>
        <span>마나 ${Math.floor(island.mana)}</span>
        <span>크리스탈 ${island.crystal}</span>
        <span>영광 ${save.gloryPoints ?? 0}</span>
        <span>진문석 ${save.jinmunStones ?? 0}</span>
        <span>에너지 ${Math.floor(island.energy)}/${island.energyMax ?? 100}</span>
        <span>소환서 ${save.scrolls}</span>
        <button type="button" class="linkish" id="btn-logout">나가기</button>
      </div>
      ${toast ? `<p class="toast">${toast}</p>` : ""}
    </header>
    <main>${mainContent(manaPct)}</main>
    <nav class="tabs">
      <button type="button" data-nav="home" class="${view === "home" || view === "summon" || view === "enhance" || view === "shop" || view === "pond" || view === "glory" || view === "fusion" || view === "party" ? "active" : ""}">홈</button>
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
  const mine = save.island.buildings.find((b) => b.id === "crystal_mine");
  const pondDef = PHASE1_BUILDINGS.find((b) => b.id === "mana_pond")!;
  const pondLv = pond?.level ?? 1;
  const pondCap = productionStorageCap(pondDef, pondLv);
  const exp = Math.floor(save.island.summonerExp ?? 0);
  const hasWish = save.island.buildings.some((b) => b.id === "wish_temple") || save.island.summonerLevel >= 7;
  return `<div class="panel">
    <p class="muted">서머너 Lv.${save.island.summonerLevel} · EXP ${exp}/100 · 파티 ${save.party.length}/4</p>
    <div class="island-grid">
      <button type="button" class="building" data-b="summon_hearth"><strong>소환진</strong><small>소환서 ${save.scrolls}장</small></button>
      <button type="button" class="building" data-b="power_circle"><strong>강화진</strong><small>레벨 · 진화 · 스킬업</small></button>
      <button type="button" class="building" data-b="shop"><strong>마법상점</strong><small>소환서 · 연마 · 각인</small></button>
      <button type="button" class="building" data-b="gateway"><strong>출정문</strong><small>시나리오 · 심층 · 아레나</small></button>
      <button type="button" class="building" data-b="mana_pond"><strong>진액 연못 Lv.${pondLv}</strong><small>대기 ${Math.floor(pond?.storedMana ?? 0)} / ${pondCap}</small></button>
      <button type="button" class="building" data-b="crystal_mine" ${mine || save.island.summonerLevel >= 10 ? "" : "disabled"}>
        <strong>수정 광맥</strong><small>${mine ? `대기 ${Math.floor(mine.storedCrystal ?? 0)}` : "Lv.10 해금"}</small>
      </button>
      <button type="button" class="building" data-b="wish" ${hasWish ? "" : "disabled"}>
        <strong>소원의 사당</strong><small>${hasWish ? "일 1회 소원" : "Lv.7 해금"}</small>
      </button>
      <button type="button" class="building" data-b="glory"><strong>영광 건물</strong><small>영광 ${save.gloryPoints ?? 0}</small></button>
      <button type="button" class="building" data-b="fusion" ${save.island.summonerLevel >= 17 || save.island.buildings.some((b) => b.id === "fusion_star") ? "" : "disabled"}>
        <strong>융합의 별</strong><small>${save.island.summonerLevel >= 17 ? "동일종 융합" : "Lv.17 해금"}</small>
      </button>
      <button type="button" class="building" data-b="party"><strong>파티</strong><small>출전 몬스터 편성</small></button>
    </div>
  </div>`;
}

function renderPond(): string {
  const pond = save.island.buildings.find((b) => b.id === "mana_pond");
  const def = PHASE1_BUILDINGS.find((b) => b.id === "mana_pond")!;
  const lv = pond?.level ?? 1;
  const cap = productionStorageCap(def, lv);
  const rate = productionManaPerHour(def, lv);
  const maxed = lv >= MAX_BUILDING_LEVEL;
  const cost = buildingUpgradeManaCost(lv);
  return `<div class="panel">
    <p class="muted">진액 연못 · 시간당 마나 생산 · 레벨업으로 생산·저장↑</p>
    <p class="section-label">현황</p>
    <p>Lv.${lv} · 생산 ${rate}/hr · 저장 ${Math.floor(pond?.storedMana ?? 0)} / ${cap}</p>
    <div class="stage-list" style="margin-top:12px">
      <button type="button" id="btn-pond-collect">
        <strong>진액 수집</strong><br/>
        <small class="muted">대기 ${Math.floor(pond?.storedMana ?? 0)}</small>
      </button>
      <button type="button" id="btn-pond-upgrade" ${maxed ? "disabled" : ""}>
        <strong>${maxed ? "최대 레벨" : `레벨업 → Lv.${lv + 1}`}</strong><br/>
        <small class="muted">${maxed ? `MAX ${MAX_BUILDING_LEVEL}` : `−마나 ${cost}`}</small>
      </button>
    </div>
    <button type="button" class="secondary full" data-nav="home" style="margin-top:10px">섬으로</button>
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
          const evo = m.evolve ?? 0;
          const evoMax = evo >= MAX_EVOLVE;
          const evoNeed = evolveMinLevel(evo);
          const evoMana = evolveManaCost(evo);
          const evoCrystal = evolveCrystalCost(evo);
          const evoCost =
            evoCrystal > 0
              ? `−마나 ${evoMana} · −크리스탈 ${evoCrystal}`
              : `−마나 ${evoMana}`;
          const evoHint = evoMax
            ? "최대 진화"
            : m.level < evoNeed
              ? `진화 Lv.${evoNeed}+`
              : `진화 ${evoCost}`;
          const levels = (m.skillLevels ?? [1, 1, 1]) as [
            number,
            number,
            number,
          ];
          const def = getMonster(m.monsterId);
          const skillBtns = [0, 1, 2]
            .map((si) => {
              const lv = levels[si]!;
              const maxSk = lv >= MAX_SKILL_LEVEL;
              const need = skillUpMinMonsterLevel(lv);
              const skCost = skillUpManaCost(si, lv);
              const name = def?.skills[si]?.nameKo ?? `S${si + 1}`;
              const hint = maxSk
                ? `${name} MAX`
                : m.level < need
                  ? `${name} Lv.${need}+`
                  : `${name}+ (−${skCost})`;
              return `<button type="button" class="secondary sk-up" data-skup="${m.uid}" data-skslot="${si}" ${maxSk ? "disabled" : ""}>${hint}</button>`;
            })
            .join("");
          const inParty = save.party.includes(m.uid) ? " · 파티" : "";
          return `<div class="enhance-mon">
            <div class="sym-row">
              <button type="button" data-enh="${m.uid}" ${maxed ? "disabled" : ""}>
                <strong>${describeOwned(m)}${inParty}</strong><br/>
                <small class="muted">${maxed ? "최대 레벨" : `강화 −마나 ${cost}`}</small>
              </button>
              <button type="button" class="secondary" data-evo="${m.uid}" ${evoMax ? "disabled" : ""}>
                ${evoHint}
              </button>
            </div>
            <div class="skill-up-row">${skillBtns}</div>
          </div>`;
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
          const imprintable = canImprintSymbol(s);
          const grindable = canGrindSymbol(s);
          return `<div class="sym-row sym-row-actions">
            <button type="button" data-sym="${i}" ${maxed ? "disabled" : ""}>
              <strong>${describeSymbol(s)}</strong><br/>
              <small class="muted">${maxed ? "최대" : `강화 −마나 ${symbolEnhanceManaCost(s.enhance)}`}</small>
            </button>
            <button type="button" class="secondary" data-grind="${i}" ${grindable ? "" : "disabled"}>
              연마 −${SYMBOL_GRIND_MANA_COST}
            </button>
            <button type="button" class="secondary" data-imprint="${i}" ${imprintable ? "" : "disabled"}>
              ${imprintable ? `각인 −${SYMBOL_IMPRINT_CRYSTAL_COST}크` : "각인×"}
            </button>
            <button type="button" class="secondary sym-eq" data-equip-sym="${i}">장착</button>
          </div>`;
        })
        .join("")}
    </div>
    <button type="button" class="secondary full" data-nav="home" style="margin-top:10px">섬으로</button>
  </div>`;
}

function renderShop(): string {
  return `<div class="panel">
    <p class="muted">마법상점 · 소환서 · 연마(접두어) · 각인(슬롯 4–6)</p>
    <p class="section-label">소환서</p>
    <div class="stage-list">
      <button type="button" id="btn-buy-scroll-1">
        <strong>소환서 1장</strong><br/>
        <small class="muted">−마나 ${SCROLL_BUY_MANA_COST} · 보유 ${save.scrolls}</small>
      </button>
      <button type="button" id="btn-buy-scroll-5">
        <strong>소환서 5장</strong><br/>
        <small class="muted">−마나 ${SCROLL_BUY_MANA_COST * 5}</small>
      </button>
    </div>
    <p class="section-label">상징 연마 (접두어)</p>
    <div class="stage-list">
      ${save.symbols
        .map((s, i) => {
          if (!canGrindSymbol(s)) return "";
          return `<button type="button" data-grind="${i}">
            <strong>${describeSymbol(s)}</strong><br/>
            <small class="muted">접두어 부여/재부여 · −마나 ${SYMBOL_GRIND_MANA_COST}</small>
          </button>`;
        })
        .join("") || `<p class="muted">연마할 상징이 없습니다</p>`}
    </div>
    <p class="section-label">상징 각인 (슬롯 4–6)</p>
    <div class="stage-list">
      ${save.symbols
        .map((s, i) => {
          if (!canImprintSymbol(s)) return "";
          return `<button type="button" data-imprint="${i}">
            <strong>${describeSymbol(s)}</strong><br/>
            <small class="muted">주옵션 재부여 · −크리스탈 ${SYMBOL_IMPRINT_CRYSTAL_COST}</small>
          </button>`;
        })
        .join("") || `<p class="muted">각인 가능한 상징이 없습니다 (슬롯 4–6 드롭 필요)</p>`}
    </div>
    <button type="button" class="secondary full" data-nav="home" style="margin-top:10px">섬으로</button>
  </div>`;
}

function renderGlory(): string {
  return `<div class="panel">
    <p class="muted">영광 건물 · 아레나 포인트로 상시 버프 · 보유 영광 ${save.gloryPoints ?? 0}</p>
    <div class="stage-list">
      ${GLORY_BUILDINGS.map((g) => {
        const lv = save.gloryLevels?.[g.id] ?? 0;
        const maxed = lv >= g.maxLevel;
        return `<button type="button" data-glory="${g.id}" ${maxed ? "disabled" : ""}>
          <strong>${g.nameKo} Lv.${lv}/${g.maxLevel}</strong><br/>
          <small class="muted">${g.effectKo} · ${maxed ? "MAX" : `−영광 ${g.gloryCostPerLevel}`}</small>
        </button>`;
      }).join("")}
    </div>
    <button type="button" class="secondary full" data-nav="home" style="margin-top:10px">섬으로</button>
  </div>`;
}

function renderFusion(): string {
  const pairs: string[] = [];
  for (let i = 0; i < save.roster.length; i++) {
    for (let j = i + 1; j < save.roster.length; j++) {
      if (save.roster[i]!.monsterId === save.roster[j]!.monsterId) {
        pairs.push(`${i}:${j}`);
      }
    }
  }
  return `<div class="panel">
    <p class="muted">융합의 별 · 동일 종 2마리 → 진화 +1 · −마나 ${FUSION_MANA_COST}</p>
    <div class="stage-list">
      ${pairs.length
        ? pairs
            .map((p) => {
              const [a, b] = p.split(":");
              const ma = save.roster[Number(a)]!;
              const mb = save.roster[Number(b)]!;
              return `<button type="button" data-fuse-a="${a}" data-fuse-b="${b}">
                <strong>${describeOwned(ma)} + ${describeOwned(mb)}</strong><br/>
                <small class="muted">융합 −마나 ${FUSION_MANA_COST}</small>
              </button>`;
            })
            .join("")
        : `<p class="muted">동일 종 몬스터 2마리가 필요합니다</p>`}
    </div>
    <button type="button" class="secondary full" data-nav="home" style="margin-top:10px">섬으로</button>
  </div>`;
}

function stageButtons(list: StageDef[]): string {
  return list
    .map((s) => {
      const label = stageUnlockLabel(save, s);
      const locked = !isStageUnlocked(save, s.id);
      const cost =
        s.energyCost > 0 ? `에너지 ${s.energyCost}` : "에너지 0";
      const extra =
        s.gloryReward != null
          ? ` · 영광 ${s.gloryReward}`
          : s.jinmunReward != null
            ? ` · 진문석 ${s.jinmunReward}`
            : "";
      return `<button type="button" data-stage="${s.id}" ${locked ? "disabled" : ""}>
        <strong>${label} · ${s.nameKo}</strong><br/>
        <small class="muted">${s.boardSize}×${s.boardSize} · 웨이브 ${s.waves} · ${cost}${extra}</small>
      </button>`;
    })
    .join("");
}

function renderStages(): string {
  const cleared = save.clearedStages.length;
  return `<div class="panel">
    <p class="muted">출정 허브 · 클리어 ${cleared} · Phase 2 콘텐츠 포함</p>
    <p class="section-label">시나리오 1 · 가렌숲</p>
    <div class="stage-list">${stageButtons(CHAPTER1_STAGES)}</div>
    <p class="section-label">시나리오 2 · 용맹의 탑</p>
    <div class="stage-list">${stageButtons(CHAPTER2_STAGES)}</div>
    <p class="section-label">상징 심층</p>
    <div class="stage-list">${stageButtons(DEPTH_STAGES)}</div>
    <p class="section-label">아레나</p>
    <div class="stage-list">${stageButtons(ARENA_STAGES)}</div>
    <p class="section-label">요일 · 마법진 시련</p>
    <div class="stage-list">${stageButtons([...WEEKDAY_STAGES, ...TRIAL_STAGES])}</div>
    <p class="section-label">월드아레나</p>
    <div class="stage-list">${stageButtons(WORLD_ARENA_STAGES)}</div>
    <p class="section-label">길드 레이드 (13×13)</p>
    <div class="stage-list">${stageButtons(GUILD_RAID_STAGES)}</div>
  </div>`;
}

function renderBattleTicker(): string {
  if (!battle) return "";
  const lines = battle.log
    .filter(
      (l) =>
        /스톤패시브|획득|스폰|웨이브|강화 진문|defeated|회복|진문개방/.test(l),
    )
    .slice(-3);
  if (!lines.length) {
    return `<div class="battle-ticker muted">전투 알림 — 따냄·아이템·패시브가 여기 표시됩니다</div>`;
  }
  return `<div class="battle-ticker" aria-live="polite">${lines
    .map((l) => `<span>${l}</span>`)
    .join("")}</div>`;
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
    ${renderBattleTicker()}
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
      ${renderSkillButtons(active, awaitSkill)}
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

function bindAuth(): void {
  app.querySelector("#auth-demo")?.addEventListener("click", () => {
    void (async () => {
      const res = await apiJson<{ user: SessionUser }>("/api/auth/demo", {
        method: "POST",
        body: "{}",
      });
      if (res?.user) {
        await enterWithUser(res.user, { demo: true });
        return;
      }
      await enterWithUser(
        { id: "local-demo", email: null, kind: "demo" },
        { demo: true },
      );
    })();
  });

  app.querySelector("#auth-guest")?.addEventListener("click", () => {
    void (async () => {
      const res = await apiJson<{ user: SessionUser }>("/api/auth/guest", {
        method: "POST",
        body: "{}",
      });
      if (res?.user) {
        await enterWithUser(res.user, { fresh: !loadLocalSave() });
        return;
      }
      await enterWithUser(
        { id: "local-guest", email: null, kind: "guest" },
        { fresh: !loadLocalSave() },
      );
    })();
  });

  app.querySelector("#auth-login")?.addEventListener("click", () => {
    authUi.pane = "login";
    render();
  });
  app.querySelector("#auth-register")?.addEventListener("click", () => {
    authUi.pane = "register";
    render();
  });
  app.querySelector("#auth-back")?.addEventListener("click", () => {
    authUi.pane = "menu";
    render();
  });

  app.querySelector("#auth-form")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const path =
      authUi.pane === "register" ? "/api/auth/register" : "/api/auth/login";
    void (async () => {
      try {
        const res = await fetch(path, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          user?: SessionUser;
          error?: string;
        };
        if (!res.ok || !body.user) {
          flash(
            body.error === "email_taken"
              ? "이미 가입된 이메일입니다."
              : body.error === "invalid_credentials"
                ? "이메일 또는 비밀번호를 확인하세요."
                : "서버에 연결할 수 없습니다. API를 실행한 뒤 다시 시도하세요.",
          );
          render();
          return;
        }
        await enterWithUser(body.user);
      } catch {
        flash("서버에 연결할 수 없습니다.");
        render();
      }
    })();
  });
}

function bind(): void {
  if (view === "auth") {
    bindAuth();
    return;
  }

  app.querySelector("#btn-logout")?.addEventListener("click", () => {
    void logout();
  });

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
        view = "pond";
        render();
      } else if (id === "crystal_mine") {
        const r = homeCollectCrystal(save);
        save = r.save;
        persist();
        flash(r.message);
        render();
      } else if (id === "wish") {
        const r = runDailyWish(save);
        save = r.save;
        persist();
        flash(r.message);
        render();
      } else if (id === "glory") {
        view = "glory";
        render();
      } else if (id === "fusion") {
        view = "fusion";
        render();
      } else if (id === "summon_hearth") {
        view = "summon";
        render();
      } else if (id === "power_circle") {
        view = "enhance";
        render();
      } else if (id === "shop") {
        view = "shop";
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

  app.querySelectorAll<HTMLButtonElement>("[data-evo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = btn.dataset.evo!;
      const r = runEvolve(save, uid);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-skup]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = btn.dataset.skup!;
      const slot = Number(btn.dataset.skslot ?? "0");
      const r = runSkillUp(save, uid, slot);
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

  app.querySelectorAll<HTMLButtonElement>("[data-grind]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.grind!;
      const r = runGrindSymbol(save, idx);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-imprint]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.imprint!;
      const r = runImprintSymbol(save, idx);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelector("#btn-buy-scroll-1")?.addEventListener("click", () => {
    const r = runBuyScroll(save, 1);
    save = r.save;
    persist();
    flash(r.message);
    render();
  });
  app.querySelector("#btn-buy-scroll-5")?.addEventListener("click", () => {
    const r = runBuyScroll(save, 5);
    save = r.save;
    persist();
    flash(r.message);
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-fuse-a]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const r = runFusion(save, btn.dataset.fuseA!, btn.dataset.fuseB!);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-glory]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.glory as
        | "mana_fountain"
        | "ancient_sword"
        | "guardstone"
        | "crystal_altar"
        | "sky_totem";
      const r = runBuyGlory(save, id);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelector("#btn-pond-collect")?.addEventListener("click", () => {
    const now = Date.now();
    const island = collectMana(tickProduction(save.island, now), "mana_pond", now);
    save = { ...save, island };
    persist();
    flash(`진액 수집 · 마나 ${Math.floor(island.mana)}`);
    render();
  });
  app.querySelector("#btn-pond-upgrade")?.addEventListener("click", () => {
    const r = runUpgradeBuilding(save, "mana_pond");
    save = r.save;
    persist();
    flash(r.message);
    render();
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
      const stage = getStage(btn.dataset.stage!);
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

  app.querySelectorAll<HTMLButtonElement>("[data-skill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      castSkill(Number(btn.dataset.skill));
    });
  });
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

async function boot(): Promise<void> {
  const me = await apiJson<{ user: SessionUser }>("/api/me");
  bootReady = true;
  if (me?.user) {
    await enterWithUser(me.user);
    return;
  }
  view = "auth";
  render();
}

void boot();
