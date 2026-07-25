import "./style.css";
import {
  captureShopOffers,
  pickAutoSkillIndex,
  starPoints,
  type Battle,
  type CaptureShopChoice,
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
  runBuyEnergy,
  runBuyGlory,
  runBuyScroll,
  runCraftEssence,
  runCraftScroll,
  runDailyWish,
  ENERGY_CRYSTAL_COST,
  ENERGY_BUY_AMOUNT,
  CRAFT_SCROLL_JINMUN,
  CRAFT_SCROLL_MANA,
  ESSENCE_JINMUN_COST,
  ESSENCE_CRYSTAL_GAIN,
  runEnhance,
  runEnhanceGear,
  runEnhanceSymbol,
  runEquipSymbol,
  runUnequipSymbol,
  previewOwnedCombatStats,
  runEvolve,
  runFusion,
  runGrindSymbol,
  homeCollectCrystal,
  homeCollect,
  FUSION_MANA_COST,
  runImprintSymbol,
  runJoinGuild,
  runGuildCheckIn,
  guildLeaderboard,
  runClaimSeasonReward,
  SEASON_REWARD_WINS,
  runPracticeDojo,
  runSellSymbol,
  runSetArenaBans,
  runSetParty,
  runSkillUp,
  runSummon,
  runUpgradeBuilding,
  SCROLL_BUY_MANA_COST,
  symbolSellMana,
  skillUpManaCost,
  skillUpMinMonsterLevel,
  stageUnlockLabel,
  type BattleReward,
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
  | "guild"
  | "stages"
  | "battle"
  | "result";

type SessionUser = { id: string; email: string | null; kind: string };

const app = document.querySelector<HTMLDivElement>("#app")!;
const SAVE_KEY = "stonesummoner.save.v5";
const DEMO_SAVE_KEY = "stonesummoner.save.demo.v5";

let sessionUser: SessionUser | null = null;
const authUi = { pane: "menu" as "menu" | "login" | "register" };
let bootReady = false;
let cloudTimer: ReturnType<typeof setTimeout> | null = null;
/** False after cloud 401 — keep local play, stop PUT spam. */
let cloudSyncOk = true;
let cloudAuthWarned = false;
let ephemeralStore = false;

let save: PlayerSave = createNewSave();
let view: View = "auth";
let battle: Battle | null = null;
let currentStage: StageDef | null = null;
let legalHints: Point[] = [];
let stoneSuggestions: StoneSuggestion[] = [];
let selectedTargetId: string | null = null;
let lastReward: BattleReward | null = null;
let lastScrollGain = 0;
/** Most recently summoned monster uid (summon reveal card). */
let lastSummonUid: string | null = null;
/** Symbol index awaiting monster pick for equip. */
let equipPickSymIndex: number | null = null;
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
    if (res.status === 401) {
      noteCloudUnauthorized();
      return null;
    }
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function noteCloudUnauthorized(): void {
  if (!sessionUser || sessionUser.id.startsWith("local-")) return;
  if (!cloudSyncOk) return;
  cloudSyncOk = false;
  if (cloudTimer) {
    clearTimeout(cloudTimer);
    cloudTimer = null;
  }
  if (!cloudAuthWarned) {
    cloudAuthWarned = true;
    flash(
      ephemeralStore
        ? "서버가 메모리 DB입니다. Railway에 DATABASE_URL(Postgres)을 연결하세요. 로컬 세이브는 유지됩니다."
        : "클라우드 세션이 만료되었습니다. 다시 로그인하면 동기화됩니다. (로컬 세이브 유지)",
    );
  }
}

function resetCloudSync(): void {
  cloudSyncOk = true;
  cloudAuthWarned = false;
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
    arenaBanIds: Array.isArray(p.arenaBanIds) ? p.arenaBanIds.slice(0, 2) : [],
    arenaSeasonWins:
      typeof p.arenaSeasonWins === "number" ? p.arenaSeasonWins : 0,
    guildContribution:
      typeof p.guildContribution === "number" ? p.guildContribution : 0,
    dojoDrills: typeof p.dojoDrills === "number" ? p.dojoDrills : 0,
    guildName: typeof p.guildName === "string" ? p.guildName : null,
    guildCheckInDay:
      typeof p.guildCheckInDay === "string" ? p.guildCheckInDay : null,
    guildRaidBest: typeof p.guildRaidBest === "number" ? p.guildRaidBest : 0,
    seasonRewardsClaimed:
      typeof p.seasonRewardsClaimed === "number" ? p.seasonRewardsClaimed : 0,
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
  if (!cloudSyncOk) return;
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
  resetCloudSync();
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
  lastReward = null;
  lastScrollGain = 0;
  autoMode = false;
  clearAutoTimer();
  dmgFloats = [];
  selectedTargetId = null;
  battle = createStageBattle(stage, save, {
    banEnemyIds:
      stage.mode === "world_arena" ? save.arenaBanIds ?? [] : undefined,
  });
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
  legalHints = battle.board
    .legalMoves(color)
    .filter((p) => !battle!.isForbidden(p));
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
  if (lastReward) return;
  const victory = battle.finishReason === "ally_win";
  const scrollsBefore = save.scrolls;
  const { save: next, reward } = applyRewards(save, currentStage, victory);
  save = next;
  persist();
  lastScrollGain = Math.max(0, save.scrolls - scrollsBefore);
  lastReward = reward;
  view = "result";
}

function renderResult(): string {
  const stage = currentStage;
  const reward = lastReward;
  if (!stage || !reward) {
    return `<div class="panel"><p class="muted">결과 없음</p>
      <button type="button" class="secondary full" data-nav="stages">출정문으로</button></div>`;
  }
  const win = reward.victory;
  const rows: string[] = [];
  if (win) {
    rows.push(`<li><span>마나</span><strong>+${reward.mana}</strong></li>`);
    if (reward.crystal)
      rows.push(`<li><span>크리스탈</span><strong>+${reward.crystal}</strong></li>`);
    if (reward.glory)
      rows.push(`<li><span>영광</span><strong>+${reward.glory}</strong></li>`);
    if (reward.jinmun)
      rows.push(`<li><span>진문석</span><strong>+${reward.jinmun}</strong></li>`);
    if (reward.contribution)
      rows.push(
        `<li><span>기여도</span><strong>+${reward.contribution}</strong></li>`,
      );
    if (reward.summonerExp)
      rows.push(
        `<li><span>서머너 EXP</span><strong>+${reward.summonerExp}</strong></li>`,
      );
    if (reward.levelsGained)
      rows.push(
        `<li><span>레벨</span><strong>Lv.${save.island.summonerLevel}</strong></li>`,
      );
    if (lastScrollGain)
      rows.push(
        `<li><span>소환서</span><strong>+${lastScrollGain}</strong></li>`,
      );
  }
  const drop = reward.symbol
    ? `<div class="result-drop">
        <p class="section-label">상징 드롭</p>
        <p class="result-drop-card">${describeSymbol(reward.symbol)}</p>
      </div>`
    : "";
  return `<div class="result-screen ${win ? "is-win" : "is-lose"}">
    <div class="result-banner">
      <p class="result-kicker">${stage.nameKo}</p>
      <h2 class="result-title">${win ? "승리" : "패배"}</h2>
      <p class="result-sub">${win ? "출정 보상" : "보상 없음 — 다시 도전하세요"}</p>
    </div>
    ${
      win
        ? `<ul class="result-rewards">${rows.join("")}</ul>${drop}`
        : `<p class="muted result-empty">${reward.expNote}</p>`
    }
    <div class="result-cta">
      <button type="button" class="auth-btn-primary" id="btn-result-again">다시 도전</button>
      <button type="button" class="secondary auth-btn-ghost" data-nav="stages">출정문</button>
      <button type="button" class="secondary auth-btn-ghost" data-nav="home">홈으로</button>
    </div>
  </div>`;
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
    if (battle?.finishReason) grantRewardIfNeeded();
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
  if (battle.phase === "await_capture_shop") {
    battle.chooseCaptureShop(
      (["mana", "amplify", "cleanse"] as CaptureShopChoice[])[
        Math.floor(Math.random() * 3)
      ]!,
    );
  }
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
  const starSet = new Set(
    (battle.modules.moduleB ? starPoints(size) : []).map((p) => `${p.x},${p.y}`),
  );
  const victory =
    battle.victoryPoint && !battle.victoryPointClaimed
      ? `${battle.victoryPoint.x},${battle.victoryPoint.y}`
      : null;
  const phase = battle.circle.boardPhase;
  const canClick =
    battle.phase === "await_stone" &&
    !!battle.activeUnitId &&
    battle.getUnit(battle.activeUnitId!)?.team === "ally" &&
    !autoMode;

  let cells = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const key = `${x},${y}`;
      const stone = grid[y]![x];
      const legal = legalSet.has(key);
      const sug = suggestMap.get(key);
      const token = battle.tokenAt(x, y);
      const tokenClass = token ? ` token token-${token.id}` : "";
      const sugClass = sug ? ` suggest suggest-${sug.rank}` : "";
      const forbid = battle.isForbidden({ x, y });
      const forbidClass = forbid && !stone ? " forbid" : "";
      const starClass = starSet.has(key) && !stone ? " star" : "";
      const victoryClass = victory === key && !stone ? " victory" : "";
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
            : forbid
              ? `<span class="forbid-mark">禁</span>`
              : victory === key
                ? `<span class="victory-mark">勝</span>`
                : starSet.has(key)
                  ? `<span class="star-mark">·</span>`
                  : "";
      cells += `<button type="button" class="cell${legal && canClick ? " legal" : ""}${tokenClass}${sugClass}${forbidClass}${starClass}${victoryClass}" data-x="${x}" data-y="${y}" ${canClick && !stone && !forbid ? "" : "disabled"}>${stoneHtml}</button>`;
    }
  }
  const resetPct = Math.min(
    100,
    Math.round(
      (battle.circle.stoneSummonCount / Math.max(1, battle.circle.resetThreshold)) *
        100,
    ),
  );
  return `<div class="board-frame phase-${Math.min(phase, 3)}" data-element="${battle.circleElement ?? ""}">
    <div class="board-phase-meter" aria-hidden="true"><i style="width:${resetPct}%"></i></div>
    <div class="board size-${size} phase-${Math.min(phase, 3)}" style="grid-template-columns:repeat(${size},minmax(0,1fr))">${cells}</div>
  </div>`;
}

function renderBoardTabs(): string {
  if (!battle || battle.boards.length < 2) return "";
  return `<div class="board-tabs" role="tablist">
    ${battle.boards
      .map((_, i) => {
        const label = i === 0 ? "A국" : "B국";
        const active = battle!.activeBoardIndex === i;
        const stones = battle!.boards[i]!
          .getBoard()
          .flat()
          .filter(Boolean).length;
        return `<button type="button" class="board-tab${active ? " active" : ""}" data-board-tab="${i}" ${active ? "aria-selected=\"true\"" : ""}>
          ${label}<small>${stones}돌</small>
        </button>`;
      })
      .join("")}
  </div>`;
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

function authHeroLayer(): string {
  return `<div class="auth-hero" aria-hidden="true">
    <img
      class="auth-hero-img"
      src="/art/auth/auth-hero-master.webp"
      srcset="/art/auth/auth-hero-master.webp 1080w, /art/auth/auth-hero-master@2x.webp 1440w"
      sizes="(max-width: 430px) 100vw, 430px"
      width="1080"
      height="1920"
      alt=""
      decoding="async"
      fetchpriority="high"
    />
    <div class="auth-hero-veil"></div>
    <div class="auth-particles">
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>
  </div>`;
}

function authBrand(): string {
  return `<img
    class="auth-brand"
    src="/art/auth/logo-wordmark.svg"
    width="720"
    height="140"
    alt="StoneSummoner"
  />`;
}

function renderAuth(): string {
  const pane = authUi.pane;
  if (pane === "login" || pane === "register") {
    const title = pane === "login" ? "로그인" : "회원가입";
    const pwAuto = pane === "login" ? "current-password" : "new-password";
    return `${authHeroLayer()}
    <div class="auth-screen auth-screen--form">
      ${authBrand()}
      <h2 class="auth-title">${title}</h2>
      <p class="auth-copy">클라우드에 세이브를 보관합니다.</p>
      <form id="auth-form" class="auth-form">
        <label>이메일<input name="email" type="email" autocomplete="username" required /></label>
        <label>비밀번호<input name="password" type="password" autocomplete="${pwAuto}" minlength="6" required /></label>
        <button type="submit" class="auth-btn-primary">${title}</button>
      </form>
      <button type="button" class="secondary full auth-btn-ghost" id="auth-back">뒤로</button>
    </div>`;
  }
  return `${authHeroLayer()}
  <div class="auth-screen">
    ${authBrand()}
    <p class="auth-copy">상징으로 키우고, 마법진에서 싸운다.</p>
    ${
      ephemeralStore
        ? `<p class="auth-warn">서버 DB가 메모리 모드입니다. 배포 환경에서는 Postgres(DATABASE_URL)를 연결하세요.</p>`
        : ""
    }
    <div class="auth-cta">
      <button type="button" class="auth-btn-primary" id="auth-demo">데모 플레이</button>
      <button type="button" class="secondary auth-btn-ghost" id="auth-login">로그인</button>
      <button type="button" class="secondary auth-btn-ghost" id="auth-register">회원가입</button>
      <button type="button" class="secondary auth-btn-ghost" id="auth-guest">게스트로 계속</button>
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
    case "guild":
      return renderGuild();
    case "party":
      return renderParty();
    case "stages":
      return renderStages();
    case "battle":
      return renderBattle(manaPct);
    case "result":
      return renderResult();
    default:
      return renderHome();
  }
}

function render(): void {
  if (!bootReady) {
    app.classList.add("auth-mode");
    app.innerHTML = `<main class="auth-main auth-main--boot">${authHeroLayer()}
      <div class="auth-screen">
        ${authBrand()}
        <p class="auth-copy">불러오는 중…</p>
      </div>
    </main>`;
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
  const tabStages = view === "stages" || view === "battle" || view === "result";
  const demoTag = sessionUser?.kind === "demo" ? `<span class="demo-tag">DEMO</span>` : "";

  if (view === "auth") {
    app.classList.add("auth-mode");
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

  app.classList.remove("auth-mode");
  app.innerHTML = `
    <header class="app-bar">
      <h1>StoneSummoner ${demoTag}</h1>
      <div class="resources">
        <span>Lv.${island.summonerLevel}</span>
        <span>마나 ${Math.floor(island.mana)}</span>
        <span>크리스탈 ${island.crystal}</span>
        <span>영광 ${save.gloryPoints ?? 0}</span>
        <span>진문석 ${save.jinmunStones ?? 0}</span>
        <span>기여 ${save.guildContribution ?? 0}</span>
        <span>시즌승 ${save.arenaSeasonWins ?? 0}</span>
        <span>에너지 ${Math.floor(island.energy)}/${island.energyMax ?? 100}</span>
        <span>소환서 ${save.scrolls}</span>
        <button type="button" class="linkish" id="btn-logout">나가기</button>
      </div>
      ${toast ? `<p class="toast">${toast}</p>` : ""}
    </header>
    <main>${mainContent(manaPct)}</main>
    <nav class="tabs">
      <button type="button" data-nav="home" class="${view === "home" || view === "summon" || view === "enhance" || view === "shop" || view === "pond" || view === "glory" || view === "fusion" || view === "party" || view === "guild" ? "active" : ""}">홈</button>
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
  const storedMana = Math.floor(pond?.storedMana ?? 0);
  const storedCrystal = Math.floor(mine?.storedCrystal ?? 0);
  const exp = Math.floor(save.island.summonerExp ?? 0);
  const hasWish =
    save.island.buildings.some((b) => b.id === "wish_temple") ||
    save.island.summonerLevel >= 7;
  const dojoOk =
    save.island.summonerLevel >= 8 ||
    save.island.buildings.some((b) => b.id === "practice_dojo");
  const guildOk =
    save.island.summonerLevel >= 12 ||
    save.island.buildings.some((b) => b.id === "guild_hall");
  const fusionOk =
    save.island.summonerLevel >= 17 ||
    save.island.buildings.some((b) => b.id === "fusion_star");
  const mineOk = Boolean(mine) || save.island.summonerLevel >= 10;

  const tile = (
    id: string,
    mark: string,
    title: string,
    sub: string,
    opts?: { disabled?: boolean; bubble?: string; bubbleKind?: "mana" | "crystal" },
  ) => {
    const bubble =
      opts?.bubble && opts.bubbleKind
        ? `<button type="button" class="res-bubble res-bubble--${opts.bubbleKind}" data-collect="${opts.bubbleKind}" aria-label="${opts.bubble} 수집">${opts.bubble}</button>`
        : "";
    return `<div class="building${opts?.disabled ? " is-locked" : ""}">
      <button type="button" class="building-main" data-b="${id}" ${opts?.disabled ? "disabled" : ""}>
        <span class="building-mark" aria-hidden="true">${mark}</span>
        <span class="building-body"><strong>${title}</strong><small>${sub}</small></span>
      </button>
      ${bubble}
    </div>`;
  };

  return `<div class="home-island">
    <div class="home-sky" aria-hidden="true">
      <img
        class="home-sky-img"
        src="/art/home/home-island-bg.webp"
        srcset="/art/home/home-island-bg-720.webp 720w, /art/home/home-island-bg.webp 1080w, /art/home/home-island-bg@2x.webp 1440w"
        sizes="(max-width: 430px) 100vw, 430px"
        width="1080"
        height="1920"
        alt=""
        decoding="async"
      />
      <div class="home-sky-veil"></div>
      <div class="home-mist"></div>
    </div>
    <div class="home-hud">
      <p class="home-level">서머너 Lv.${save.island.summonerLevel}</p>
      <p class="home-meta">EXP ${exp}/100 · 파티 ${save.party.length}/4</p>
    </div>
    <div class="island-grid">
      ${tile("summon_hearth", "召", "소환진", `소환서 ${save.scrolls}장`)}
      ${tile("power_circle", "强", "강화진", "레벨 · 진화 · 스킬업")}
      ${tile("shop", "商", "마법상점", "소환서 · 연마 · 각인")}
      ${tile("gateway", "門", "출정문", "시나리오 · 심층 · 아레나")}
      ${tile("mana_pond", "池", `진액 연못 Lv.${pondLv}`, `대기 ${storedMana} / ${pondCap}`, {
        bubble: storedMana > 0 ? String(storedMana) : undefined,
        bubbleKind: storedMana > 0 ? "mana" : undefined,
      })}
      ${tile(
        "crystal_mine",
        "晶",
        "수정 광맥",
        mine ? `대기 ${storedCrystal}` : "Lv.10 해금",
        {
          disabled: !mineOk,
          bubble: mine && storedCrystal > 0 ? String(storedCrystal) : undefined,
          bubbleKind: mine && storedCrystal > 0 ? "crystal" : undefined,
        },
      )}
      ${tile("wish", "願", "소원의 사당", hasWish ? "일 1회 소원" : "Lv.7 해금", {
        disabled: !hasWish,
      })}
      ${tile("glory", "榮", "영광 건물", `영광 ${save.gloryPoints ?? 0}`)}
      ${tile("dojo", "道", "마법진 도장", dojoOk ? `수련 ${save.dojoDrills ?? 0}회` : "Lv.8 해금", {
        disabled: !dojoOk,
      })}
      ${tile(
        "guild",
        "會",
        "길드 홀",
        save.guildName ? save.guildName : guildOk ? "가입·출석" : "Lv.12 해금",
        { disabled: !guildOk },
      )}
      ${tile("fusion", "融", "융합의 별", fusionOk ? "동일종 융합" : "Lv.17 해금", {
        disabled: !fusionOk,
      })}
      ${tile("party", "伍", "파티", "출전 몬스터 편성")}
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
  const revealed = lastSummonUid
    ? save.roster.find((m) => m.uid === lastSummonUid)
    : null;
  const revDef = revealed ? getMonster(revealed.monsterId) : null;
  const reveal = revealed
    ? `<div class="summon-reveal el-${revDef?.element ?? "dark"}" aria-live="polite">
        <p class="summon-reveal-kicker">소환 성공</p>
        <p class="summon-reveal-name">${describeOwned(revealed)}</p>
        <p class="summon-reveal-meta">${revDef?.element ?? "?"} · ${
          save.party.includes(revealed.uid) ? "파티 편성됨" : "보유"
        }</p>
        <button type="button" class="secondary" id="btn-summon-dismiss">확인</button>
      </div>`
    : "";
  return `<div class="summon-screen panel">
    <p class="muted">소환진 · 소환서 1장 소모</p>
    <button type="button" class="auth-btn-primary full" id="btn-summon" ${save.scrolls < 1 ? "disabled" : ""}>소환하기 (${save.scrolls})</button>
    ${reveal}
    <p class="muted" style="margin-top:12px">최근 보유</p>
    <ul class="roster-list">
      ${save.roster
        .slice(-6)
        .reverse()
        .map((m) => {
          const def = getMonster(m.monsterId);
          const fresh = m.uid === lastSummonUid ? " class=\"is-fresh\"" : "";
          return `<li${fresh}>${describeOwned(m)}${def ? ` · ${def.element}` : ""}</li>`;
        })
        .join("")}
    </ul>
    <button type="button" class="secondary full" data-nav="home">섬으로</button>
  </div>`;
}

function symbolWearer(symId: string): string | null {
  const mon = save.roster.find((m) =>
    (m.symbolSlots ?? []).includes(symId),
  );
  return mon ? describeOwned(mon) : null;
}

function renderSymbolLoadout(uid: string): string {
  const mon = save.roster.find((m) => m.uid === uid);
  if (!mon) return "";
  const slots = mon.symbolSlots ?? [null, null, null, null, null, null];
  const cells = [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const id = slots[i];
      const sym = id ? save.symbols.find((s) => s.id === id) : null;
      if (sym) {
        return `<button type="button" class="slot-cell filled" data-unequip-uid="${uid}" data-unequip-slot="${i + 1}" title="탭하여 해제">
          <span class="slot-num">${i + 1}</span>
          <span class="slot-label">${sym.setId}</span>
        </button>`;
      }
      return `<span class="slot-cell empty"><span class="slot-num">${i + 1}</span><span class="slot-label">빈칸</span></span>`;
    })
    .join("");
  const preview = previewOwnedCombatStats(save, uid);
  const stats = preview
    ? `<div class="loadout-stats">
        <span>HP ${preview.final.hp}</span>
        <span>ATK ${preview.final.atk}</span>
        <span>DEF ${preview.final.def}</span>
        <span>SPD ${preview.final.spd}</span>
        <span>치확 ${preview.final.critRate}%</span>
        <span>치피 ${preview.final.critDmg}%</span>
      </div>
      ${
        preview.sets.length
          ? `<div class="loadout-sets">${preview.sets
              .map(
                (s) =>
                  `<span class="set-chip${s.active ? " active" : ""}">${s.nameKo} ${s.count}/${s.pieces}${s.active ? ` · ${s.effectKo}` : ""}</span>`,
              )
              .join("")}</div>`
          : `<p class="muted loadout-sets-empty">세트 미진행</p>`
      }`
    : "";
  return `<div class="slot-row" aria-label="상징 슬롯">${cells}</div>${stats}`;
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
            ${renderSymbolLoadout(m.uid)}
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
    ${
      equipPickSymIndex != null && save.symbols[equipPickSymIndex]
        ? `<div class="equip-picker" aria-live="polite">
            <p class="equip-picker-title">장착 대상 선택</p>
            <p class="muted">${describeSymbol(save.symbols[equipPickSymIndex]!)}</p>
            <div class="stage-list">
              ${save.roster
                .map((m) => {
                  const inParty = save.party.includes(m.uid);
                  const slots = m.symbolSlots ?? [];
                  const slot = save.symbols[equipPickSymIndex!]!.slot - 1;
                  const occupied = slots[slot] ? " · 슬롯 교체" : "";
                  return `<button type="button" data-equip-to="${m.uid}">
                    <strong>${describeOwned(m)}${inParty ? " · 파티" : ""}</strong><br/>
                    <small class="muted">슬롯 ${save.symbols[equipPickSymIndex!]!.slot}${occupied}</small>
                  </button>`;
                })
                .join("")}
            </div>
            <button type="button" class="secondary full" id="btn-equip-cancel">취소</button>
          </div>`
        : ""
    }
    <div class="stage-list">
      ${save.symbols
        .map((s, i) => {
          const maxed = s.enhance >= MAX_SYMBOL_ENHANCE;
          const imprintable = canImprintSymbol(s);
          const grindable = canGrindSymbol(s);
          const picking = equipPickSymIndex === i;
          const worn = symbolWearer(s.id);
          return `<div class="sym-row sym-row-actions${picking ? " is-picking" : ""}">
            <button type="button" data-sym="${i}" ${maxed ? "disabled" : ""}>
              <strong>${worn ? "E · " : ""}${describeSymbol(s)}</strong><br/>
              <small class="muted">${worn ? `착용 ${worn}` : "미장착"}${maxed ? " · 최대" : ` · 강화 −마나 ${symbolEnhanceManaCost(s.enhance)}`}</small>
            </button>
            <button type="button" class="secondary" data-grind="${i}" ${grindable ? "" : "disabled"}>
              연마 −${SYMBOL_GRIND_MANA_COST}
            </button>
            <button type="button" class="secondary" data-imprint="${i}" ${imprintable ? "" : "disabled"}>
              ${imprintable ? `각인 −${SYMBOL_IMPRINT_CRYSTAL_COST}크` : "각인×"}
            </button>
            <button type="button" class="secondary sym-eq${picking ? " active" : ""}" data-equip-sym="${i}">${picking ? "선택중" : "장착"}</button>
            <button type="button" class="secondary" data-sell-sym="${i}">판매 +${symbolSellMana(s.enhance)}</button>
          </div>`;
        })
        .join("")}
    </div>
    <button type="button" class="secondary full" data-nav="home" style="margin-top:10px">섬으로</button>
  </div>`;
}

function renderShop(): string {
  return `<div class="panel">
    <p class="muted">마법상점 · 소환서 · 에너지 · 제작 · 연마 · 각인</p>
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
    <p class="section-label">에너지 · 제작</p>
    <div class="stage-list">
      <button type="button" id="btn-buy-energy">
        <strong>에너지 +${ENERGY_BUY_AMOUNT}</strong><br/>
        <small class="muted">−크리스탈 ${ENERGY_CRYSTAL_COST}</small>
      </button>
      <button type="button" id="btn-craft-essence">
        <strong>정수 변환</strong><br/>
        <small class="muted">진문석 ${ESSENCE_JINMUN_COST} → 크리스탈 ${ESSENCE_CRYSTAL_GAIN} (Lv.12)</small>
      </button>
      <button type="button" id="btn-craft-scroll">
        <strong>소환서 제작</strong><br/>
        <small class="muted">진문석 ${CRAFT_SCROLL_JINMUN} + 마나 ${CRAFT_SCROLL_MANA} (Lv.19)</small>
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

function renderCaptureShop(): string {
  if (!battle || battle.phase !== "await_capture_shop" || autoMode) return "";
  const offers = captureShopOffers();
  return `<div class="capture-shop">
    <p class="muted">사석상점 — 대량 따냄 보상</p>
    <div class="chip-row">
      ${offers
        .map(
          (o) =>
            `<button type="button" class="chip" data-shop="${o.choice}">${o.labelKo}</button>`,
        )
        .join("")}
    </div>
  </div>`;
}

function renderGuild(): string {
  const name = save.guildName;
  const board = guildLeaderboard(save)
    .map(
      (r, i) =>
        `<div class="${r.self ? "self-rank" : ""}">${i + 1}. ${r.name} · 기여 ${r.contribution}${r.self ? " (나)" : ""}</div>`,
    )
    .join("");
  return `<div class="panel">
    <p class="muted">길드 홀 · 비동기 순위 스텁 (실시간 후순위)</p>
    <p>길드: <strong>${name ?? "미가입"}</strong></p>
    <p class="muted">기여 ${save.guildContribution ?? 0} · 레이드 최고 +${save.guildRaidBest ?? 0} · 출석 ${save.guildCheckInDay ?? "—"}</p>
    ${
      name
        ? `<button type="button" id="btn-guild-checkin">일일 출석</button>
           <button type="button" class="secondary" id="btn-guild-rename">이름 변경</button>`
        : `<label class="muted">길드명
             <input id="guild-name-input" maxlength="16" placeholder="예: 진문수호대" />
           </label>
           <button type="button" id="btn-guild-join">가입</button>`
    }
    <p class="section-label">레이드 기여 순위</p>
    <div class="guild-board muted">${board}</div>
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
      return `<button type="button" class="stage-card" data-stage="${s.id}" ${locked ? "disabled" : ""}>
        <span class="stage-card-mark" aria-hidden="true">${s.boardSize}</span>
        <span class="stage-card-body">
          <strong>${label} · ${s.nameKo}</strong>
          <small>${s.boardSize}×${s.boardSize} · 웨이브 ${s.waves} · ${cost}${extra}</small>
        </span>
      </button>`;
    })
    .join("");
}

function renderStages(): string {
  const cleared = save.clearedStages.length;
  const bans = save.arenaBanIds ?? [];
  const banPool = [
    ...new Set(WORLD_ARENA_STAGES.flatMap((s) => s.enemyMonsterIds)),
  ];
  const banRow = banPool
    .map((id) => {
      const m = getMonster(id);
      const on = bans.includes(id);
      return `<button type="button" class="chip ${on ? "active" : ""}" data-ban-toggle="${id}">
        ${on ? "밴 " : ""}${m?.nameKo ?? id}
      </button>`;
    })
    .join("");
  return `<div class="stages-hub">
    <div class="stages-sky" aria-hidden="true">
      <img
        class="stages-sky-img"
        src="/art/stages/stages-gateway-bg.webp"
        srcset="/art/stages/stages-gateway-bg-720.webp 720w, /art/stages/stages-gateway-bg.webp 1080w"
        sizes="(max-width: 430px) 100vw, 430px"
        width="1080"
        height="1920"
        alt=""
        decoding="async"
      />
      <div class="stages-sky-veil"></div>
    </div>
    <div class="stages-content">
      <header class="stages-hud">
        <p class="stages-title">출정문</p>
        <p class="stages-meta">클리어 ${cleared} · 시즌승 ${save.arenaSeasonWins ?? 0}</p>
      </header>
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
      <p class="section-label">월드아레나 · 밴픽 (최대 2)</p>
      <p class="muted stages-note">시즌승 ${save.arenaSeasonWins ?? 0} · 보상티어 ${save.seasonRewardsClaimed ?? 0} · 밴 ${bans.length ? bans.join(", ") : "없음"}</p>
      <button type="button" class="secondary full stages-claim" id="btn-season-claim">
        시즌 보상 수령 (승 ${(save.seasonRewardsClaimed ?? 0) + 1}×${SEASON_REWARD_WINS} 필요)
      </button>
      <div class="chip-row">${banRow}</div>
      <div class="stage-list">${stageButtons(WORLD_ARENA_STAGES)}</div>
      <p class="section-label">길드 레이드 (13×13 · 모듈 E/F · 쌍국)</p>
      <p class="muted stages-note">기여도 ${save.guildContribution ?? 0} · 최고 단회 +${save.guildRaidBest ?? 0}</p>
      <div class="stage-list">${stageButtons(GUILD_RAID_STAGES)}</div>
    </div>
  </div>`;
}

function renderBattleTicker(): string {
  if (!battle) return "";
  const lines = battle.log
    .filter(
      (l) =>
        /스톤패시브|획득|스폰|웨이브|강화 진문|defeated|회복|진문개방|형상|이벤트|사석상점|속성|필승|봉인|돌흡수|진형파괴|서머너 착수|묘수|맞마나|이중층/.test(l),
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
  const awaitShop =
    battle.phase === "await_capture_shop" &&
    active?.team === "ally" &&
    !autoMode;
  const awaitSkill =
    battle.phase === "await_skill" && active?.team === "ally" && !autoMode;
  const canUlt = !!active && battle.canUseSummonerSkill(active);
  const mission =
    battle.modules.moduleG && !battle.finishReason
      ? ` · 묘수 ${battle.brilliantCount}/${battle.brilliantGoal}${battle.brilliantDone ? "✓" : ""}`
      : "";
  const boardTag =
    battle.boards.length > 1 ? ` · ${battle.boardLabel}` : "";
  const status = battle.finishReason
    ? battle.finishReason === "ally_win"
      ? "승리! (적 소환수 전멸)"
      : "패배... (아군 소환수 전멸)"
    : `${battle.phase} · amp ${battle.currentAmplify().toFixed(2)}/${battle.powerAmplifyCap().toFixed(2)} · ${phaseLabel} (${battle.circle.stoneSummonCount}/${battle.circle.resetThreshold})${mission}${boardTag}`;

  const skillHint =
    battle.phase === "await_stone" && active?.team === "ally"
      ? "추천 착수(1·2·3) 또는 칸 탭"
      : awaitShop
        ? "사석상점 보상을 선택하세요"
      : awaitSkill
        ? "적 소환수를 탭해 대상 지정 후 스킬"
        : autoMode
          ? `AUTO x${battleSpeed}`
          : "";

  const skillRow = awaitShop
    ? ""
    : `<div class="skill-row">
      ${renderSkillButtons(active, awaitSkill)}
      <button type="button" id="sk-ult" class="ult${canUlt ? " ready" : ""}" ${awaitSkill && canUlt ? "" : "disabled"}>진문개방</button>
      <button type="button" id="sk-smart" ${awaitSkill ? "" : "disabled"}>추천</button>
      ${
        battle.boards.length > 1 &&
        battle.phase === "await_stone" &&
        active?.team === "ally" &&
        !autoMode
          ? `<button type="button" class="secondary" id="btn-board-switch">쌍국 ${battle.boardLabel === "A국" ? "→B" : "→A"}</button>`
          : ""
      }
    </div>`;

  return `<div class="battle-layout panel battle-layout--framed">
    <div class="battle-top">
      <div class="battle-stage-name">${currentStage.nameKo}</div>
      <div class="muted">${currentStage.boardSize}×${currentStage.boardSize} · 웨이브 ${battle.currentWave}/${battle.totalWaves}</div>
      <div class="muted battle-status">${status}</div>
    </div>
    ${renderBattleTicker()}
    <div class="muted item-legend">서머너 후열(무적) · 전열 소환수 전멸 시 승패</div>
    ${renderSummonerBack(enemyBack, "enemy")}
    <div class="team-row enemy">${enemyFront.map((u) => renderUnit(u, { targetable: awaitSkill })).join("")}</div>
    <div class="board-wrap">
      ${renderBoardTabs()}
      <div class="dmg-layer">${renderDmgLayer()}</div>
      ${renderBoard()}
      ${renderSuggestStrip()}
      ${renderCaptureShop()}
      <div style="width:100%">
        <div class="muted">서머너 마나 ${Math.floor(battle.allySummoner.mana)}/${battle.allySummoner.manaMax}</div>
        <div class="bar mana mana-lg"><i style="width:${manaPct}%"></i></div>
      </div>
    </div>
    ${skillRow}
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
      if (view === "result" || view === "battle") {
        autoMode = false;
        clearAutoTimer();
        if (nav === "home" || nav === "stages" || nav === "collect") {
          battle = null;
          dmgFloats = [];
          if (nav === "home") {
            currentStage = null;
            lastReward = null;
            lastScrollGain = 0;
          }
        }
      }
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

  app.querySelectorAll<HTMLButtonElement>("[data-collect]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      const kind = btn.dataset.collect;
      if (kind === "mana") {
        const r = homeCollect(save);
        save = r.save;
        persist();
        flash(r.message);
        view = "home";
        render();
        return;
      }
      if (kind === "crystal") {
        const r = homeCollectCrystal(save);
        save = r.save;
        persist();
        flash(r.message);
        view = "home";
        render();
      }
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
      } else if (id === "dojo") {
        const r = runPracticeDojo(save);
        save = r.save;
        persist();
        flash(r.message);
        render();
      } else if (id === "guild") {
        view = "guild";
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
    const before = new Set(save.roster.map((m) => m.uid));
    const r = runSummon(save);
    save = r.save;
    persist();
    const fresh = save.roster.find((m) => !before.has(m.uid));
    lastSummonUid = fresh?.uid ?? null;
    flash(r.message);
    render();
  });

  app.querySelector("#btn-summon-dismiss")?.addEventListener("click", () => {
    lastSummonUid = null;
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

  app.querySelectorAll<HTMLButtonElement>("[data-sell-sym]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const r = runSellSymbol(save, btn.dataset.sellSym!);
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
  app.querySelector("#btn-buy-energy")?.addEventListener("click", () => {
    const r = runBuyEnergy(save, 1);
    save = r.save;
    persist();
    flash(r.message);
    render();
  });
  app.querySelector("#btn-craft-essence")?.addEventListener("click", () => {
    const r = runCraftEssence(save);
    save = r.save;
    persist();
    flash(r.message);
    render();
  });
  app.querySelector("#btn-craft-scroll")?.addEventListener("click", () => {
    const r = runCraftScroll(save);
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
      const idx = Number(btn.dataset.equipSym);
      if (!Number.isFinite(idx) || !save.symbols[idx]) return;
      equipPickSymIndex = equipPickSymIndex === idx ? null : idx;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-equip-to]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (equipPickSymIndex == null) return;
      const uid = btn.dataset.equipTo!;
      const r = runEquipSymbol(save, uid, String(equipPickSymIndex));
      save = r.save;
      persist();
      equipPickSymIndex = null;
      flash(r.message);
      render();
    });
  });

  app.querySelector("#btn-equip-cancel")?.addEventListener("click", () => {
    equipPickSymIndex = null;
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-unequip-uid]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = btn.dataset.unequipUid!;
      const slot = Number(btn.dataset.unequipSlot);
      const r = runUnequipSymbol(save, uid, slot);
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

  app.querySelectorAll<HTMLButtonElement>("[data-ban-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.banToggle!;
      const cur = [...(save.arenaBanIds ?? [])];
      const idx = cur.indexOf(id);
      if (idx >= 0) cur.splice(idx, 1);
      else if (cur.length < 2) cur.push(id);
      else {
        flash("밴은 최대 2마리입니다.");
        return;
      }
      const r = runSetArenaBans(save, cur);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelector("#btn-season-claim")?.addEventListener("click", () => {
    const r = runClaimSeasonReward(save);
    save = r.save;
    persist();
    flash(r.message);
    render();
  });

  app.querySelector("#btn-board-switch")?.addEventListener("click", () => {
    if (!battle) return;
    if (!battle.switchBoard("수동")) return;
    refreshLegal();
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-board-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!battle || battle.boards.length < 2) return;
      const idx = Number(btn.dataset.boardTab);
      if (!Number.isFinite(idx) || idx === battle.activeBoardIndex) return;
      if (!battle.switchBoard("탭")) return;
      refreshLegal();
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-shop]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!battle) return;
      const choice = btn.dataset.shop as CaptureShopChoice;
      if (!battle.chooseCaptureShop(choice)) return;
      refreshLegal();
      render();
    });
  });

  app.querySelector("#btn-guild-join")?.addEventListener("click", () => {
    const input = app.querySelector<HTMLInputElement>("#guild-name-input");
    const r = runJoinGuild(save, input?.value ?? "");
    save = r.save;
    persist();
    flash(r.message);
    render();
  });

  app.querySelector("#btn-guild-checkin")?.addEventListener("click", () => {
    const r = runGuildCheckIn(save);
    save = r.save;
    persist();
    flash(r.message);
    render();
  });

  app.querySelector("#btn-guild-rename")?.addEventListener("click", () => {
    const next = window.prompt("새 길드명", save.guildName ?? "");
    if (next == null) return;
    const r = runJoinGuild(save, next);
    save = r.save;
    persist();
    flash(r.message);
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
    if (battle?.finishReason) grantRewardIfNeeded();
    if (view === "result") {
      battle = null;
      dmgFloats = [];
      view = "stages";
      render();
      return;
    }
    battle = null;
    currentStage = null;
    lastReward = null;
    lastScrollGain = 0;
    dmgFloats = [];
    view = "stages";
    render();
  });

  app.querySelector("#btn-result-again")?.addEventListener("click", () => {
    const stage = currentStage;
    if (!stage) {
      view = "stages";
      render();
      return;
    }
    battle = null;
    dmgFloats = [];
    startBattle(stage);
  });
}

async function boot(): Promise<void> {
  const health = await apiJson<{ ok?: boolean; db?: string }>("/api/health");
  ephemeralStore = health?.db === "memory";
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
