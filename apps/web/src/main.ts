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
  EQUIP_STAGES,
  GLORY_BUILDINGS,
  GUILD_RAID_STAGES,
  TRIAL_STAGES,
  WEEKDAY_STAGES,
  WORLD_ARENA_STAGES,
  canGrindSymbol,
  canImprintSymbol,
  describeGear,
  describeSymbol,
  gearEnhanceCrystalCost,
  gearEnhanceManaCost,
  gearSellCrystal,
  gearSellMana,
  GEAR_SET_AFFIX_MANA,
  GEAR_SETS,
  getMonster,
  getStage,
  MAX_GEAR_BAG,
  MAX_GEAR_ENHANCE,
  MAX_SYMBOL_ENHANCE,
  normalizeGearPiece,
  normalizeSummonerGear,
  SKILL_TREE_NODES,
  summarizeGearSets,
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
  PHASE_BUILDINGS,
  productionCrystalCap,
  productionCrystalPerHour,
  productionManaPerHour,
  productionStorageCap,
  tickProduction,
  todayKey,
} from "stonesummoner-home";
import {
  applyRewards,
  awakenCrystalCost,
  awakenLeaderAtkPct,
  awakenManaCost,
  awakenMinLevel,
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
  MAX_SUMMONER_AWAKEN,
  runAwakenSummoner,
  runUnlockSkillNode,
  runAffixGearSet,
  runEquipGearBag,
  runSellGearBag,
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
  EQUIP_VAULT_WEEKLY_LIMIT,
  equipVaultRemaining,
  syncEquipVaultWeek,
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
  | "mine"
  | "wish"
  | "glory"
  | "fusion"
  | "party"
  | "guild"
  | "dojo"
  | "stages"
  | "battle"
  | "result";

type ForgeReveal = {
  kind: "grind" | "imprint";
  before: string;
  after: string;
  cost: string;
};

type FusionReveal = {
  materials: string;
  result: string;
  cost: string;
};

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
/** Empty slot awaiting symbol pick (monster uid + slot 1–6). */
let slotEquipPick: { uid: string; slot: number } | null = null;
/** Grind/imprint before→after reveal card. */
let forgeReveal: ForgeReveal | null = null;
/** Fusion success reveal card. */
let fusionReveal: FusionReveal | null = null;
/** Enhance hub section tab. */
type EnhanceTab = "awaken" | "monsters" | "gear" | "symbols";
let enhanceTab: EnhanceTab = "awaken";
/** One-shot pulse/flash on next enhance paint. */
let enhanceFx: { kind: "node"; id: string } | { kind: "gear"; slot: string } | null =
  null;
/** Daily wish result card. */
let wishReveal: string | null = null;
/** Party editor draft (uid set); null means mirror save.party. */
let partyDraft: Set<string> | null = null;
let toast = "";
let battleSpeed: 1 | 2 | 3 = 1;
let autoMode = false;
let autoTimer: ReturnType<typeof setTimeout> | null = null;
let dmgFloats: { id: number; text: string; crit: boolean; ult: boolean }[] = [];
let floatSeq = 0;
/** Last seen circle phase — detect empowered reset for board FX. */
let lastSeenBoardPhase = 0;
/** One-shot collapse→rekindle class on the board frame. */
let boardRekindleFx = false;

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
    gear: normalizeSummonerGear(p.gear ?? base.gear),
    gearBag: Array.isArray(p.gearBag)
      ? p.gearBag.map((g) => normalizeGearPiece(g, g.slot)).slice(0, 40)
      : [],
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
    summonerAwaken: Math.min(
      MAX_SUMMONER_AWAKEN,
      Math.max(
        0,
        Math.floor(
          typeof p.summonerAwaken === "number" ? p.summonerAwaken : 0,
        ),
      ),
    ),
    skillTree: Array.isArray(p.skillTree)
      ? p.skillTree.filter((id): id is string => typeof id === "string")
      : [],
    equipVaultWeekKey:
      typeof p.equipVaultWeekKey === "string" ? p.equipVaultWeekKey : null,
    equipVaultWeekEntries:
      typeof p.equipVaultWeekEntries === "number"
        ? Math.max(0, Math.floor(p.equipVaultWeekEntries))
        : 0,
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
  lastSeenBoardPhase = 0;
  boardRekindleFx = false;
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
    return `<div class="result-wrap">
      <div class="battle-sky" aria-hidden="true">
        <img class="battle-sky-img" src="/art/battle/battle-arena-bg.webp" alt="" decoding="async" />
        <div class="battle-sky-veil"></div>
      </div>
      <div class="result-screen is-lose">
        <div class="result-banner">
          <p class="result-kicker">출정</p>
          <h2 class="result-title">결과 없음</h2>
          <p class="result-sub">출정문으로 돌아가 다시 도전하세요</p>
        </div>
        <div class="result-cta">
          <button type="button" class="secondary full" data-nav="stages">출정문으로</button>
        </div>
      </div>
    </div>`;
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
  const drop = [
    reward.gear
      ? `<div class="result-drop">
        <p class="section-label">장비 드롭</p>
        <p class="result-drop-card">${describeGear(reward.gear)}</p>
        <div class="result-drop-cta">
          <button type="button" class="auth-btn-primary" data-nav="enhance">강화진 가방에서 장착</button>
        </div>
      </div>`
      : "",
    reward.symbol
      ? `<div class="result-drop">
        <p class="section-label">상징 드롭</p>
        <p class="result-drop-card">${describeSymbol(reward.symbol)}</p>
        <div class="result-drop-cta">
          <button type="button" class="auth-btn-primary" data-nav="enhance">강화진에서 장착</button>
          <button type="button" class="secondary" data-nav="shop">연마·각인</button>
        </div>
      </div>`
      : "",
  ].join("");
  return `<div class="result-wrap">
    <div class="battle-sky" aria-hidden="true">
      <img class="battle-sky-img" src="/art/battle/battle-arena-bg.webp" alt="" decoding="async" />
      <div class="battle-sky-veil"></div>
    </div>
    <div class="result-screen ${win ? "is-win" : "is-lose"}">
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
      ${
        win
          ? `<button type="button" class="secondary auth-btn-ghost" data-nav="party">파티</button>`
          : ""
      }
      <button type="button" class="secondary auth-btn-ghost" data-nav="home">홈으로</button>
    </div>
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
      ? battle.useSkill({ summonerSkill: "open" })
      : battle.canUseSummonerClean(unit) &&
          battle.countEnemyStones(unit.team) >= 4
        ? battle.useSkill({ summonerSkill: "clean" })
        : battle.canUseSummonerGuard(unit) &&
            battle.allyMonstersWounded(unit.team, 0.55)
          ? battle.useSkill({ summonerSkill: "guard" })
          : battle.canUseSummonerDeclare(unit)
            ? battle.useSkill({ summonerSkill: "declare" })
            : battle.canUseSummonerDual(unit)
              ? battle.useSkill({ summonerSkill: "dual" })
              : battle.useSkill({
                  skillIndex: pickAutoSkillIndex(unit, battle.units),
                });
    pushDamageFloats(hits);
  }
  afterPlayerAction();
}

function castSkill(
  mode: "ult" | "declare" | "dual" | "clean" | "guard" | "smart" | number,
): void {
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
    const hits = battle.useSkill({ summonerSkill: "open" });
    pushDamageFloats(hits);
    afterPlayerAction();
    return;
  }
  if (mode === "declare") {
    if (!battle.canUseSummonerDeclare(unit)) {
      flash("마나 50% 이상 필요합니다.");
      render();
      return;
    }
    const hits = battle.useSkill({ summonerSkill: "declare" });
    pushDamageFloats(hits);
    afterPlayerAction();
    return;
  }
  if (mode === "dual") {
    if (!battle.canUseSummonerDual(unit)) {
      flash("마나 35% 이상 필요합니다.");
      render();
      return;
    }
    const hits = battle.useSkill({ summonerSkill: "dual" });
    pushDamageFloats(hits);
    afterPlayerAction();
    return;
  }
  if (mode === "clean") {
    if (!battle.canUseSummonerClean(unit)) {
      flash("마나 45% 이상 필요합니다.");
      render();
      return;
    }
    const hits = battle.useSkill({ summonerSkill: "clean" });
    pushDamageFloats(hits);
    afterPlayerAction();
    return;
  }
  if (mode === "guard") {
    if (!battle.canUseSummonerGuard(unit)) {
      flash("마나 40% 이상 필요합니다.");
      render();
      return;
    }
    const hits = battle.useSkill({ summonerSkill: "guard" });
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
    const disabled = !awaitSkill || (sk ? cd > 0 : i > 0);
    const state = cd > 0 ? " cooling" : awaitSkill && !disabled ? " ready" : "";
    return `<button type="button" class="skill-btn${state}" data-skill="${i}" ${disabled ? "disabled" : ""}>
      <span class="skill-btn-label">${label}</span>
      ${cd > 0 ? `<span class="skill-btn-cd">${cd}</span>` : ""}
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
  return `<${tag} class="unit-card el-${u.element}${active}${targeted}${dead}${shield ? " has-shield" : ""}" ${attrs}>
    <div class="name">${u.name}</div>
    <div class="hp-num">
      <span>${Math.max(0, Math.round(u.hp))}</span>
      ${shield ? `<span class="shield-badge" title="실드">+${shield}</span>` : ""}
    </div>
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
  if (phase > lastSeenBoardPhase) {
    if (phase > 0) boardRekindleFx = true;
    lastSeenBoardPhase = phase;
  }
  const showRekindle = boardRekindleFx;
  if (showRekindle) {
    queueMicrotask(() => {
      boardRekindleFx = false;
    });
  }
  const rebuildTag =
    phase <= 0
      ? "일반 진문"
      : `진문 재건 ${"I".repeat(Math.min(phase, 3))}`;
  const openingHint = battle.openingBonusPending
    ? `<span class="board-opening-hint">포석 보너스</span>`
    : "";
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
              : token?.id === "stride_sand"
                ? "행"
                : token?.id === "seal_nail"
                  ? "봉"
                  : token?.id === "element_ward"
                    ? "속"
                    : token?.id === "bait_stone"
                      ? "미"
                      : token?.id === "transform_dust"
                        ? "변"
                        : "";
      const bait =
        battle.baitLure &&
        battle.baitLure.x === x &&
        battle.baitLure.y === y &&
        !stone;
      const baitClass = bait ? " bait" : "";
      const stoneHtml = stone
        ? `<span class="stone ${stone}"></span>`
        : sug
          ? `<span class="suggest-mark">${sug.rank}</span>`
          : token
            ? `<span class="token-mark">${tokenLabel}</span>`
            : forbid
              ? `<span class="forbid-mark">禁</span>`
              : bait
                ? `<span class="bait-mark">誘</span>`
                : victory === key
                  ? `<span class="victory-mark">勝</span>`
                  : starSet.has(key)
                    ? `<span class="star-mark">·</span>`
                    : "";
      cells += `<button type="button" class="cell${legal && canClick ? " legal" : ""}${tokenClass}${sugClass}${forbidClass}${baitClass}${starClass}${victoryClass}" data-x="${x}" data-y="${y}" ${canClick && !stone && !forbid ? "" : "disabled"}>${stoneHtml}</button>`;
    }
  }
  const resetPct = Math.min(
    100,
    Math.round(
      (battle.circle.stoneSummonCount / Math.max(1, battle.circle.resetThreshold)) *
        100,
    ),
  );
  return `<div class="board-frame phase-${Math.min(phase, 3)}${showRekindle ? " is-rekindling" : ""}${battle.openingBonusPending ? " has-opening" : ""}" data-element="${battle.circleElement ?? ""}">
    <div class="board-phase-tag">${rebuildTag}${openingHint}</div>
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
    <p class="suggest-strip-title">추천 착수</p>
    ${stoneSuggestions
      .map(
        (s) =>
          `<button type="button" class="suggest-chip suggest-chip--${s.rank}" data-sgx="${s.point.x}" data-sgy="${s.point.y}">
            <span class="suggest-rank">${s.rank}</span>
            <span class="suggest-body">
              <strong>${s.point.x},${s.point.y}</strong>
              <small>따냄 ${s.capturedCount} · 마나 +${s.manaGain} · amp +${s.amplifyDelta.toFixed(2)}${s.hasToken ? " · 토큰" : ""}</small>
            </span>
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
  return `<header class="auth-brand-block">
    <div class="auth-brand-ornament" aria-hidden="true">
      <span class="auth-brand-rule auth-brand-rule--left"></span>
      <span class="auth-brand-gem"></span>
      <span class="auth-brand-rule auth-brand-rule--right"></span>
    </div>
    <p class="auth-brand-en">Stone Summoners</p>
    <h1 class="auth-brand-ko">신비의마법석</h1>
    <div class="auth-brand-underline" aria-hidden="true"></div>
  </header>`;
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
    case "mine":
      return renderMine();
    case "wish":
      return renderWish();
    case "glory":
      return renderGlory();
    case "fusion":
      return renderFusion();
    case "guild":
      return renderGuild();
    case "dojo":
      return renderDojo();
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
      <div class="app-bar-brand">
        <img class="app-bar-mark" src="/art/auth/logo-mark-192.png" width="28" height="28" alt="" />
        <h1>StoneSummoner ${demoTag}</h1>
      </div>
      <div class="resources">
        <span class="res-chip res-lv">Lv.${island.summonerLevel}${(save.summonerAwaken ?? 0) > 0 ? ` · 각성${save.summonerAwaken}` : ""}</span>
        <span class="res-chip res-mana">마나 ${Math.floor(island.mana)}</span>
        <span class="res-chip res-crystal">크리스탈 ${island.crystal}</span>
        <span class="res-chip">영광 ${save.gloryPoints ?? 0}</span>
        <span class="res-chip">진문석 ${save.jinmunStones ?? 0}</span>
        <span class="res-chip">기여 ${save.guildContribution ?? 0}</span>
        <span class="res-chip">시즌승 ${save.arenaSeasonWins ?? 0}</span>
        <span class="res-chip res-energy">에너지 ${Math.floor(island.energy)}/${island.energyMax ?? 100}</span>
        <span class="res-chip res-scroll">소환서 ${save.scrolls}</span>
        <button type="button" class="linkish" id="btn-logout">나가기</button>
      </div>
      ${toast ? `<p class="toast">${toast}</p>` : ""}
    </header>
    <main>${mainContent(manaPct)}</main>
    <nav class="tabs">
      <button type="button" data-nav="home" class="${view === "home" || view === "summon" || view === "enhance" || view === "shop" || view === "pond" || view === "mine" || view === "wish" || view === "glory" || view === "fusion" || view === "party" || view === "guild" || view === "dojo" ? "active" : ""}"><span class="tab-ico" aria-hidden="true">島</span>홈</button>
      <button type="button" data-nav="stages" class="${tabStages ? "active" : ""}"><span class="tab-ico" aria-hidden="true">門</span>출정</button>
      <button type="button" data-nav="collect"><span class="tab-ico" aria-hidden="true">池</span>수집</button>
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
    opts?: {
      disabled?: boolean;
      bubble?: string;
      bubbleKind?: "mana" | "crystal";
      tone?: "summon" | "forge" | "shop" | "gate" | "pond" | "mine" | "wish" | "glory" | "dojo" | "guild" | "fusion" | "party";
    },
  ) => {
    const bubble =
      opts?.bubble && opts.bubbleKind
        ? `<button type="button" class="res-bubble res-bubble--${opts.bubbleKind}" data-collect="${opts.bubbleKind}" aria-label="${opts.bubble} 수집">${opts.bubble}</button>`
        : "";
    const tone = opts?.tone ? ` building--${opts.tone}` : "";
    return `<div class="building${tone}${opts?.disabled ? " is-locked" : ""}">
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
      <p class="home-level">서머너 Lv.${save.island.summonerLevel}${(save.summonerAwaken ?? 0) > 0 ? ` · 각성 ${save.summonerAwaken}` : ""}</p>
      <div class="home-exp" role="progressbar" aria-valuenow="${exp}" aria-valuemin="0" aria-valuemax="100">
        <div class="home-exp-fill" style="width:${Math.min(100, exp)}%"></div>
      </div>
      <p class="home-meta">EXP ${exp}/100 · 파티 ${save.party.length}/4</p>
    </div>
    <div class="island-plateau">
    <div class="island-grid">
      ${tile("summon_hearth", "召", "소환진", `소환서 ${save.scrolls}장`, { tone: "summon" })}
      ${tile("power_circle", "强", "강화진", "레벨 · 각성 · 장비", { tone: "forge" })}
      ${tile("shop", "商", "마법상점", "소환서 · 연마 · 각인", { tone: "shop" })}
      ${tile("gateway", "門", "출정문", "시나리오 · 장비금고 · 아레나", { tone: "gate" })}
      ${tile("mana_pond", "池", `진액 연못 Lv.${pondLv}`, `대기 ${storedMana} / ${pondCap}`, {
        tone: "pond",
        bubble: storedMana > 0 ? String(storedMana) : undefined,
        bubbleKind: storedMana > 0 ? "mana" : undefined,
      })}
      ${tile(
        "crystal_mine",
        "晶",
        "수정 광맥",
        mine ? `대기 ${storedCrystal}` : "Lv.10 해금",
        {
          tone: "mine",
          disabled: !mineOk,
          bubble: mine && storedCrystal > 0 ? String(storedCrystal) : undefined,
          bubbleKind: mine && storedCrystal > 0 ? "crystal" : undefined,
        },
      )}
      ${tile("wish", "願", "소원의 사당", hasWish ? "일 1회 소원" : "Lv.7 해금", {
        tone: "wish",
        disabled: !hasWish,
      })}
      ${tile("glory", "榮", "영광 건물", `영광 ${save.gloryPoints ?? 0}`, { tone: "glory" })}
      ${tile("dojo", "道", "마법진 도장", dojoOk ? `수련 ${save.dojoDrills ?? 0}회` : "Lv.8 해금", {
        tone: "dojo",
        disabled: !dojoOk,
      })}
      ${tile(
        "guild",
        "會",
        "길드 홀",
        save.guildName ? save.guildName : guildOk ? "가입·출석" : "Lv.12 해금",
        { tone: "guild", disabled: !guildOk },
      )}
      ${tile("fusion", "融", "융합의 별", fusionOk ? "동일종 융합" : "Lv.17 해금", {
        tone: "fusion",
        disabled: !fusionOk,
      })}
      ${tile("party", "伍", "파티", "출전 몬스터 편성", { tone: "party" })}
    </div>
    </div>
  </div>`;
}

function hubShell(title: string, subtitle: string, body: string): string {
  return `<div class="hub-screen">
    <div class="hub-sky" aria-hidden="true">
      <img
        class="hub-sky-img"
        src="/art/hub/hub-chamber-bg.webp"
        srcset="/art/hub/hub-chamber-bg-720.webp 720w, /art/hub/hub-chamber-bg.webp 1080w"
        sizes="(max-width: 430px) 100vw, 430px"
        width="1080"
        height="1920"
        alt=""
        decoding="async"
      />
      <div class="hub-sky-veil"></div>
    </div>
    <div class="hub-content">
      <header class="hub-hud">
        <p class="hub-title">${title}</p>
        <div class="hub-title-rule" aria-hidden="true"></div>
        <p class="hub-meta">${subtitle}</p>
      </header>
      ${body}
    </div>
  </div>`;
}

function renderForgeReveal(): string {
  if (!forgeReveal) return "";
  const title = forgeReveal.kind === "grind" ? "연마 완료" : "각인 완료";
  const mark = forgeReveal.kind === "grind" ? "磨" : "印";
  return `<div class="forge-reveal forge-reveal--${forgeReveal.kind}" aria-live="polite">
    <p class="forge-reveal-kicker"><span class="forge-reveal-mark" aria-hidden="true">${mark}</span>${title}</p>
    <div class="forge-reveal-diff">
      <p class="forge-before">${forgeReveal.before}</p>
      <p class="forge-arrow" aria-hidden="true">↓</p>
      <p class="forge-after">${forgeReveal.after}</p>
    </div>
    <p class="forge-reveal-cost muted">${forgeReveal.cost}</p>
    <button type="button" class="secondary full auth-btn-ghost" id="btn-forge-dismiss">확인</button>
  </div>`;
}

function renderFusionReveal(): string {
  if (!fusionReveal) return "";
  return `<div class="forge-reveal forge-reveal--fusion" aria-live="polite">
    <p class="forge-reveal-kicker"><span class="forge-reveal-mark" aria-hidden="true">融</span>융합 완료</p>
    <div class="forge-reveal-diff">
      <p class="forge-before">${fusionReveal.materials}</p>
      <p class="forge-arrow" aria-hidden="true">↓</p>
      <p class="forge-after">${fusionReveal.result}</p>
    </div>
    <p class="forge-reveal-cost muted">${fusionReveal.cost}</p>
    <button type="button" class="secondary full auth-btn-ghost" id="btn-fusion-dismiss">확인</button>
  </div>`;
}

function renderDojo(): string {
  const drills = save.dojoDrills ?? 0;
  const rem = drills % 3;
  const untilMission = rem === 0 ? 3 : 3 - rem;
  const nextIsMission = rem === 2;
  const nextNote = nextIsMission
    ? "다음 수련 시 묘수 미션 (진문석 +1)"
    : `묘수 미션까지 ${untilMission}회`;
  const manaGain = 120 + save.island.summonerLevel * 8;
  return hubShell(
    "마법진 도장",
    `수련 ${drills}회 · 서머너 Lv.${save.island.summonerLevel}`,
    `<div class="hub-panel">
      <div class="dojo-panel">
        <p class="dojo-panel-title">수련 현황</p>
        <div class="dojo-stats">
          <div class="dojo-stat">
            <span class="dojo-stat-label">누적</span>
            <strong>${drills}</strong>
          </div>
          <div class="dojo-stat">
            <span class="dojo-stat-label">미션</span>
            <strong>${nextNote}</strong>
          </div>
        </div>
        <p class="muted dojo-hint">1회 수련 · 마나 +${manaGain} · EXP +15</p>
        <button type="button" class="primary full" id="btn-dojo-drill">수련하기</button>
      </div>
      <button type="button" class="secondary full auth-btn-ghost" data-nav="home" style="margin-top:10px">섬으로</button>
    </div>`,
  );
}

function renderPond(): string {
  const pond = save.island.buildings.find((b) => b.id === "mana_pond");
  const def = PHASE1_BUILDINGS.find((b) => b.id === "mana_pond")!;
  const lv = pond?.level ?? 1;
  const cap = productionStorageCap(def, lv);
  const rate = productionManaPerHour(def, lv);
  const maxed = lv >= MAX_BUILDING_LEVEL;
  const cost = buildingUpgradeManaCost(lv);
  const stored = Math.floor(pond?.storedMana ?? 0);
  const fillPct = cap > 0 ? Math.min(100, Math.round((stored / cap) * 100)) : 0;
  return hubShell(
    "진액 연못",
    `Lv.${lv} · ${rate}/hr · 저장 ${stored}/${cap}`,
    `<div class="hub-panel">
      <div class="pond-panel">
        <p class="pond-panel-title">진액 저장</p>
        <div class="pond-bar" role="progressbar" aria-valuenow="${stored}" aria-valuemin="0" aria-valuemax="${cap}">
          <div class="pond-bar-fill" style="width:${fillPct}%"></div>
        </div>
        <div class="pond-meta">
          <span>${stored} / ${cap}</span>
          <span>${rate}/hr</span>
        </div>
      </div>
      <div class="stage-list">
        <button type="button" class="stage-card" id="btn-pond-collect">
          <span class="stage-card-mark" aria-hidden="true">池</span>
          <span class="stage-card-body">
            <strong>진액 수집</strong>
            <small>${stored > 0 ? `대기 ${stored}` : "대기 없음"}</small>
          </span>
        </button>
        <button type="button" class="stage-card" id="btn-pond-upgrade" ${maxed ? "disabled" : ""}>
          <span class="stage-card-mark" aria-hidden="true">↑</span>
          <span class="stage-card-body">
            <strong>${maxed ? "최대 레벨" : `레벨업 → Lv.${lv + 1}`}</strong>
            <small>${maxed ? `MAX ${MAX_BUILDING_LEVEL}` : `−마나 ${cost}`}</small>
          </span>
        </button>
      </div>
      <button type="button" class="secondary full auth-btn-ghost" data-nav="home" style="margin-top:10px">섬으로</button>
    </div>`,
  );
}

function renderMine(): string {
  const mine = save.island.buildings.find((b) => b.id === "crystal_mine");
  const def = PHASE_BUILDINGS.find((b) => b.id === "crystal_mine")!;
  const lv = mine?.level ?? 1;
  const cap = productionCrystalCap(def, lv);
  const rate = productionCrystalPerHour(def, lv);
  const maxed = lv >= MAX_BUILDING_LEVEL;
  const cost = buildingUpgradeManaCost(lv);
  const stored = Math.floor(mine?.storedCrystal ?? 0);
  const fillPct = cap > 0 ? Math.min(100, Math.round((stored / cap) * 100)) : 0;
  return hubShell(
    "수정 광맥",
    `Lv.${lv} · ${rate}/hr · 저장 ${stored}/${cap}`,
    `<div class="hub-panel">
      <div class="pond-panel mine-panel">
        <p class="pond-panel-title">크리스탈 저장</p>
        <div class="pond-bar mine-bar" role="progressbar" aria-valuenow="${stored}" aria-valuemin="0" aria-valuemax="${cap}">
          <div class="pond-bar-fill mine-bar-fill" style="width:${fillPct}%"></div>
        </div>
        <div class="pond-meta">
          <span>${stored} / ${cap}</span>
          <span>${rate}/hr</span>
        </div>
      </div>
      <div class="stage-list">
        <button type="button" class="stage-card" id="btn-mine-collect">
          <span class="stage-card-mark" aria-hidden="true">晶</span>
          <span class="stage-card-body">
            <strong>크리스탈 수집</strong>
            <small>${stored > 0 ? `대기 ${stored}` : "대기 없음"}</small>
          </span>
        </button>
        <button type="button" class="stage-card" id="btn-mine-upgrade" ${maxed ? "disabled" : ""}>
          <span class="stage-card-mark" aria-hidden="true">↑</span>
          <span class="stage-card-body">
            <strong>${maxed ? "최대 레벨" : `레벨업 → Lv.${lv + 1}`}</strong>
            <small>${maxed ? `MAX ${MAX_BUILDING_LEVEL}` : `−마나 ${cost}`}</small>
          </span>
        </button>
      </div>
      <button type="button" class="secondary full auth-btn-ghost" data-nav="home" style="margin-top:10px">섬으로</button>
    </div>`,
  );
}

function renderWish(): string {
  const day = todayKey();
  const last = save.island.lastWishDay ?? null;
  const used = last === day;
  const reveal = wishReveal
    ? `<div class="forge-reveal forge-reveal--wish" aria-live="polite">
        <p class="forge-reveal-kicker"><span class="forge-reveal-mark" aria-hidden="true">願</span>소원 결과</p>
        <p class="forge-after">${wishReveal}</p>
        <button type="button" class="secondary full auth-btn-ghost" id="btn-wish-dismiss" style="margin-top:12px">확인</button>
      </div>`
    : "";
  return hubShell(
    "소원의 사당",
    used ? `오늘 완료 · ${last}` : "일 1회 기원",
    `<div class="hub-panel">
      ${reveal}
      <div class="guild-panel wish-panel">
        <p class="guild-panel-title">기원 현황</p>
        <div class="guild-stats">
          <div class="guild-stat"><span>오늘</span><strong>${used ? "완료" : "가능"}</strong></div>
          <div class="guild-stat"><span>최근</span><strong>${last ?? "—"}</strong></div>
          <div class="guild-stat"><span>소환서</span><strong>${save.scrolls}</strong></div>
        </div>
        <p class="muted dojo-hint">마나 · 크리스탈 · 소환서 중 하나가 무작위로 내려옵니다.</p>
      </div>
      <button type="button" class="auth-btn-primary full" id="btn-wish-cast" ${used ? "disabled" : ""}>
        ${used ? "오늘은 이미 빌었습니다" : "소원 빌기"}
      </button>
      <button type="button" class="secondary full auth-btn-ghost" data-nav="home" style="margin-top:10px">섬으로</button>
    </div>`,
  );
}

function ensurePartyDraft(): Set<string> {
  if (!partyDraft) partyDraft = new Set(save.party);
  return partyDraft;
}

function renderParty(): string {
  const selected = ensurePartyDraft();
  const lineup = [0, 1, 2, 3]
    .map((i) => {
      const uid = [...selected][i];
      const m = uid ? save.roster.find((x) => x.uid === uid) : null;
      const def = m ? getMonster(m.monsterId) : null;
      if (!m) {
        return `<div class="party-slot empty"><span class="party-slot-num">${i + 1}</span><span class="party-slot-name">빈 칸</span></div>`;
      }
      return `<div class="party-slot el-${def?.element ?? "dark"}">
        <span class="party-slot-num">${i + 1}</span>
        <span class="party-slot-name">${describeOwned(m)}</span>
      </div>`;
    })
    .join("");
  return hubShell(
    "파티",
    `편성 ${selected.size}/4 · 탭하여 선택`,
    `<div class="hub-panel">
      <div class="party-lineup" aria-label="출전 라인">
        <p class="party-lineup-title">출전 라인</p>
        <div class="party-slots">${lineup}</div>
      </div>
      <p class="section-label">로스터</p>
      <div class="stage-list" id="party-pick">
        ${save.roster
          .map((m) => {
            const on = selected.has(m.uid);
            const def = getMonster(m.monsterId);
            const preview = previewOwnedCombatStats(save, m.uid);
            const stats = preview
              ? `HP ${preview.final.hp} · ATK ${preview.final.atk} · DEF ${preview.final.def}`
              : def?.element ?? "";
            return `<button type="button" class="stage-card party-card el-${def?.element ?? "dark"}${on ? " picked" : ""}" data-party-toggle="${m.uid}">
              <span class="stage-card-mark" aria-hidden="true">${on ? "★" : (def?.element?.[0]?.toUpperCase() ?? "·")}</span>
              <span class="stage-card-body">
                <strong>${describeOwned(m)}</strong>
                <small>${stats}</small>
                <small class="party-card-status">${on ? "출전 선택" : "대기"}</small>
              </span>
            </button>`;
          })
          .join("")}
      </div>
      <button type="button" class="auth-btn-primary full" id="btn-party-save" style="margin-top:10px">편성 저장 (${selected.size}/4)</button>
      <button type="button" class="secondary full auth-btn-ghost" data-nav="home" style="margin-top:8px">섬으로</button>
    </div>`,
  );
}

function renderSummon(): string {
  const revealed = lastSummonUid
    ? save.roster.find((m) => m.uid === lastSummonUid)
    : null;
  const revDef = revealed ? getMonster(revealed.monsterId) : null;
  const inParty = revealed ? save.party.includes(revealed.uid) : false;
  const partyFull = save.party.length >= 4;
  const reveal = revealed
    ? `<div class="summon-reveal el-${revDef?.element ?? "dark"}" aria-live="polite">
        <p class="summon-reveal-kicker">소환 성공</p>
        <p class="summon-reveal-name">${describeOwned(revealed)}</p>
        <p class="summon-reveal-meta">${revDef?.element ?? "?"} · ${
          inParty ? "파티 편성됨" : "보유"
        }</p>
        <div class="summon-reveal-cta">
          ${
            inParty
              ? ""
              : `<button type="button" class="auth-btn-primary" id="btn-summon-party">${
                  partyFull ? "파티에 넣기 (4번째 교체)" : "파티에 넣기"
                }</button>`
          }
          <button type="button" class="secondary" data-nav="enhance">강화진으로</button>
          <button type="button" class="secondary" id="btn-summon-dismiss">확인</button>
        </div>
      </div>`
    : "";
  return `<div class="summon-screen">
    ${hubShell(
      "소환진",
      `소환서 ${save.scrolls}장`,
      `<div class="hub-panel">
        <button type="button" class="auth-btn-primary full" id="btn-summon" ${save.scrolls < 1 ? "disabled" : ""}>소환하기 (${save.scrolls})</button>
        ${reveal}
        <p class="section-label">최근 보유</p>
        <div class="stage-list summon-roster">
          ${save.roster
            .slice(-6)
            .reverse()
            .map((m) => {
              const def = getMonster(m.monsterId);
              const fresh = m.uid === lastSummonUid;
              const preview = previewOwnedCombatStats(save, m.uid);
              const inParty = save.party.includes(m.uid);
              return `<div class="stage-card summon-roster-card el-${def?.element ?? "dark"}${fresh ? " is-fresh" : ""}">
                <span class="stage-card-mark" aria-hidden="true">${def?.element?.[0]?.toUpperCase() ?? "·"}</span>
                <span class="stage-card-body">
                  <strong>${describeOwned(m)}${inParty ? " · 파티" : ""}${fresh ? " · NEW" : ""}</strong>
                  <small>${preview ? `HP ${preview.final.hp} · ATK ${preview.final.atk} · DEF ${preview.final.def}` : (def?.element ?? "")}</small>
                </span>
              </div>`;
            })
            .join("")}
        </div>
        <button type="button" class="secondary full auth-btn-ghost" data-nav="home">섬으로</button>
      </div>`,
    )}
  </div>`;
}

function symbolWearer(symId: string): string | null {
  const mon = save.roster.find((m) =>
    (m.symbolSlots ?? []).includes(symId),
  );
  return mon ? describeOwned(mon) : null;
}

function renderSlotSymbolPicker(uid: string, slot: number): string {
  const candidates = save.symbols
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.slot === slot);
  const mon = save.roster.find((m) => m.uid === uid);
  return `<div class="equip-picker slot-sym-picker" aria-live="polite">
    <p class="equip-picker-title">슬롯 ${slot} 상징 선택</p>
    <p class="muted">${mon ? describeOwned(mon) : uid}</p>
    <div class="stage-list">
      ${
        candidates.length
          ? candidates
              .map(({ s, i }) => {
                const worn = symbolWearer(s.id);
                return `<button type="button" class="stage-card" data-slot-equip-sym="${i}">
                  <span class="stage-card-mark" aria-hidden="true">${s.slot}</span>
                  <span class="stage-card-body">
                    <strong>${describeSymbol(s)}</strong>
                    <small>${worn ? `착용중 ${worn} · 이동` : "미장착"}</small>
                  </span>
                </button>`;
              })
              .join("")
          : `<p class="muted">슬롯 ${slot}용 상징이 없습니다. 전투 드롭·상점을 확인하세요.</p>`
      }
    </div>
    <button type="button" class="secondary full" id="btn-slot-equip-cancel">취소</button>
  </div>`;
}

function renderSymbolLoadout(uid: string): string {
  const mon = save.roster.find((m) => m.uid === uid);
  if (!mon) return "";
  const slots = mon.symbolSlots ?? [null, null, null, null, null, null];
  const pickingSlot =
    slotEquipPick?.uid === uid ? slotEquipPick.slot : null;
  const cells = [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const id = slots[i];
      const sym = id ? save.symbols.find((s) => s.id === id) : null;
      const slotNum = i + 1;
      if (sym) {
        return `<button type="button" class="slot-cell filled" data-unequip-uid="${uid}" data-unequip-slot="${slotNum}" title="탭하여 해제">
          <span class="slot-num">${slotNum}</span>
          <span class="slot-label">${sym.setId}</span>
        </button>`;
      }
      return `<button type="button" class="slot-cell empty${pickingSlot === slotNum ? " is-picking" : ""}" data-slot-pick-uid="${uid}" data-slot-pick="${slotNum}" title="상징 장착">
        <span class="slot-num">${slotNum}</span>
        <span class="slot-label">+</span>
      </button>`;
    })
    .join("");
  const preview = previewOwnedCombatStats(save, uid);
  const stats = preview
    ? `<div class="loadout-stats loadout-stats--bars">
        <div class="stat-cell"><span class="stat-cell-k">HP</span><span class="stat-cell-v">${preview.final.hp}</span></div>
        <div class="stat-cell"><span class="stat-cell-k">ATK</span><span class="stat-cell-v">${preview.final.atk}</span></div>
        <div class="stat-cell"><span class="stat-cell-k">DEF</span><span class="stat-cell-v">${preview.final.def}</span></div>
        <div class="stat-cell"><span class="stat-cell-k">SPD</span><span class="stat-cell-v">${preview.final.spd}</span></div>
        <div class="stat-cell"><span class="stat-cell-k">치확</span><span class="stat-cell-v">${preview.final.critRate}%</span></div>
        <div class="stat-cell"><span class="stat-cell-k">치피</span><span class="stat-cell-v">${preview.final.critDmg}%</span></div>
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
  const picker =
    slotEquipPick?.uid === uid
      ? renderSlotSymbolPicker(uid, slotEquipPick.slot)
      : "";
  return `<div class="slot-row" aria-label="상징 슬롯">${cells}</div>${stats}${picker}`;
}

function renderEnhance(): string {
  const gearEnhanceCostLabel = (enhance: number): string => {
    const mana = gearEnhanceManaCost(enhance);
    const crystal = gearEnhanceCrystalCost(enhance);
    return crystal > 0
      ? `강화 −마나 ${mana} · −크리스탈 ${crystal}`
      : `강화 −마나 ${mana}`;
  };
  const gear = normalizeSummonerGear(save.gear);
  const weapon = gear.weapon;
  const robe = gear.robe;
  const acc = gear.accessory;
  const orb = gear.orb;
  const cloak = gear.cloak;
  const ring = gear.ring;
  const awaken = save.summonerAwaken ?? 0;
  const awakenMax = awaken >= MAX_SUMMONER_AWAKEN;
  const awakenNeedLv = awakenMinLevel(awaken);
  const awakenMana = awakenManaCost(awaken);
  const awakenCrystal = awakenCrystalCost(awaken);
  const awakenLocked = save.island.summonerLevel < awakenNeedLv;
  const awakenHint = awakenMax
    ? `각성 MAX (+${MAX_SUMMONER_AWAKEN})`
    : awakenLocked
      ? `각성 Lv.${awakenNeedLv}+`
      : `각성 +${awaken + 1} (−마나 ${awakenMana} · −크리스탈 ${awakenCrystal})`;
  const leaderPct = (awakenLeaderAtkPct(awaken) * 100).toFixed(1);
  const treeUnlocked = new Set(save.skillTree ?? []);
  const branchMeta: {
    id: (typeof SKILL_TREE_NODES)[number]["branch"];
    label: string;
    mark: string;
  }[] = [
    { id: "mana", label: "마나", mark: "液" },
    { id: "sense", label: "감응", mark: "感" },
    { id: "power", label: "위력", mark: "核" },
    { id: "leader", label: "지휘", mark: "揮" },
    { id: "mastery", label: "숙련", mark: "熟" },
  ];
  const fxNode =
    enhanceFx?.kind === "node" ? enhanceFx.id : null;
  const fxGear =
    enhanceFx?.kind === "gear" ? enhanceFx.slot : null;
  const tab: EnhanceTab =
    equipPickSymIndex != null || forgeReveal
      ? "symbols"
      : slotEquipPick
        ? "monsters"
        : enhanceTab;

  const gearSlotBtn = (
    slot: "weapon" | "robe" | "accessory" | "orb" | "cloak" | "ring",
    piece: typeof weapon,
    mark: string,
    label: string,
    detail: string,
  ): string => {
    const maxed = piece.enhance >= MAX_GEAR_ENHANCE;
    const setName =
      GEAR_SETS.find((s) => s.id === piece.setId)?.nameKo ?? piece.setId;
    return `<button type="button" class="gear-slot${fxGear === slot ? " is-flash" : ""}${maxed ? " is-max" : ""}" data-gear="${slot}" ${maxed ? "disabled" : ""} title="${detail}">
      <span class="gear-slot-mark" aria-hidden="true">${mark}</span>
      <span class="gear-slot-label">${label}</span>
      <span class="gear-slot-plus">+${piece.enhance}</span>
      <span class="gear-slot-set">${setName}</span>
      <span class="gear-slot-cost">${maxed ? "MAX" : gearEnhanceCostLabel(piece.enhance)}</span>
    </button>`;
  };

  const setSummary = summarizeGearSets(gear)
    .filter((s) => s.count > 0)
    .map(
      (s) =>
        `<span class="set-chip${s.active2 || s.active4 || s.active6 ? " active" : ""}">${s.nameKo} ${s.count}${s.active6 ? " ·6" : s.active4 ? " ·4" : s.active2 ? " ·2" : ""}</span>`,
    )
    .join("");

  const treeBoard = branchMeta
    .map((br) => {
      const nodes = SKILL_TREE_NODES.filter((n) => n.branch === br.id);
      const tiles = nodes
        .map((n) => {
          const done = treeUnlocked.has(n.id);
          const missReq = n.requires.some((r) => !treeUnlocked.has(r));
          const lvLock = save.island.summonerLevel < n.minLevel;
          const ready = !done && !missReq && !lvLock;
          const cost =
            n.crystalCost > 0
              ? `−마나 ${n.manaCost} · −크 ${n.crystalCost}`
              : `−마나 ${n.manaCost}`;
          const hint = done
            ? "해금"
            : lvLock
              ? `Lv.${n.minLevel}+`
              : missReq
                ? "선행"
                : cost;
          const state = done
            ? "is-unlocked"
            : ready
              ? "is-ready"
              : "is-locked";
          return `<button type="button" class="tree-node ${state}${fxNode === n.id ? " is-pulse" : ""}" data-skill-node="${n.id}" ${done ? "disabled" : ""} title="${n.descKo}">
            <span class="tree-node-name">${n.nameKo}</span>
            <span class="tree-node-hint">${hint}</span>
          </button>`;
        })
        .join("");
      return `<div class="tree-branch tree-branch--${br.id}">
        <p class="tree-branch-label"><span aria-hidden="true">${br.mark}</span>${br.label}</p>
        <div class="tree-branch-nodes">${tiles}</div>
      </div>`;
    })
    .join("");

  const monstersPanel = save.roster
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
      const levels = (m.skillLevels ?? [1, 1, 1]) as [number, number, number];
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
      const inParty = save.party.includes(m.uid);
      const preview = previewOwnedCombatStats(save, m.uid);
      return `<div class="enhance-mon el-${def?.element ?? "dark"}">
            <div class="enhance-mon-head">
              <button type="button" class="stage-card enhance-main" data-enh="${m.uid}" ${maxed ? "disabled" : ""}>
                <span class="stage-card-mark" aria-hidden="true">${def?.element?.[0]?.toUpperCase() ?? "·"}</span>
                <span class="stage-card-body">
                  <strong>${describeOwned(m)}${inParty ? " · 파티" : ""}</strong>
                  <small>${preview ? `HP ${preview.final.hp} · ATK ${preview.final.atk}` : ""}${maxed ? " · 최대" : ` · 강화 −마나 ${cost}`}</small>
                </span>
              </button>
              <button type="button" class="secondary enhance-evo" data-evo="${m.uid}" ${evoMax ? "disabled" : ""}>
                ${evoHint}
              </button>
            </div>
            ${renderSymbolLoadout(m.uid)}
            <div class="skill-up-row">${skillBtns}</div>
          </div>`;
    })
    .join("");

  const gearAffixRows = (
    [
      ["weapon", "무기", weapon],
      ["robe", "로브", robe],
      ["accessory", "장신구", acc],
      ["orb", "마법구", orb],
      ["cloak", "망토", cloak],
      ["ring", "반지", ring],
    ] as const
  )
    .map(
      ([slot, label, piece]) => `<div class="gear-set-row">
            <span class="gear-set-slot">${label}</span>
            <div class="gear-set-chips">
              ${GEAR_SETS.map((s) => {
                const active = piece.setId === s.id;
                return `<button type="button" class="set-chip-btn${active ? " is-active" : ""}" data-gear-set="${slot}" data-set-id="${s.id}" ${active ? "disabled" : ""}>${s.nameKo}</button>`;
              }).join("")}
            </div>
          </div>`,
    )
    .join("");

  const bagLen = (save.gearBag ?? []).length;
  const bagGrid =
    bagLen === 0
      ? `<p class="muted">가방이 비어 있습니다. 장비 금고에서 드롭을 획득하세요.</p>`
      : `<div class="gear-bag-grid">${(save.gearBag ?? [])
          .map((p, i) => {
            const setName =
              GEAR_SETS.find((s) => s.id === p.setId)?.nameKo ?? "";
            return `<div class="gear-tile">
              <button type="button" class="gear-tile-main" data-gear-equip="${i}">
                <span class="gear-tile-mark" aria-hidden="true">${p.slot[0]?.toUpperCase() ?? "裝"}</span>
                <strong>${describeGear(p)}</strong>
                <small>+${p.enhance}${setName ? ` · ${setName}` : ""}</small>
              </button>
              <div class="gear-tile-actions">
                <button type="button" class="secondary" data-gear-equip="${i}">장착</button>
                <button type="button" class="secondary" data-gear-sell="${i}">+${gearSellMana(p)}${gearSellCrystal(p) > 0 ? ` · +크${gearSellCrystal(p)}` : ""}</button>
              </div>
            </div>`;
          })
          .join("")}</div>`;

  const symbolsPanel = `${
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
                  return `<button type="button" class="stage-card" data-equip-to="${m.uid}">
                    <span class="stage-card-mark" aria-hidden="true">${inParty ? "★" : "伍"}</span>
                    <span class="stage-card-body">
                      <strong>${describeOwned(m)}${inParty ? " · 파티" : ""}</strong>
                      <small>슬롯 ${save.symbols[equipPickSymIndex!]!.slot}${occupied}</small>
                    </span>
                  </button>`;
                })
                .join("")}
            </div>
            <button type="button" class="secondary full auth-btn-ghost" id="btn-equip-cancel">취소</button>
          </div>`
      : ""
  }
    <div class="stage-list sym-inventory">
      ${save.symbols
        .map((s, i) => {
          const maxed = s.enhance >= MAX_SYMBOL_ENHANCE;
          const imprintable = canImprintSymbol(s);
          const grindable = canGrindSymbol(s);
          const picking = equipPickSymIndex === i;
          const worn = symbolWearer(s.id);
          return `<div class="sym-card${picking ? " is-picking" : ""}">
            <button type="button" class="sym-card-main" data-sym="${i}" ${maxed ? "disabled" : ""}>
              <span class="stage-card-mark" aria-hidden="true">${s.slot}</span>
              <span class="stage-card-body">
                <strong>${worn ? "E · " : ""}${describeSymbol(s)}</strong>
                <small>${worn ? `착용 ${worn}` : "미장착"}${maxed ? " · 최대" : ` · 강화 −마나 ${symbolEnhanceManaCost(s.enhance)}`}</small>
              </span>
            </button>
            <div class="sym-card-actions">
              <button type="button" class="secondary" data-grind="${i}" ${grindable ? "" : "disabled"}>연마</button>
              <button type="button" class="secondary" data-imprint="${i}" ${imprintable ? "" : "disabled"}>${imprintable ? "각인" : "각인×"}</button>
              <button type="button" class="secondary sym-eq${picking ? " active" : ""}" data-equip-sym="${i}">${picking ? "선택중" : "장착"}</button>
              <button type="button" class="secondary" data-sell-sym="${i}">+${symbolSellMana(s.enhance)}</button>
            </div>
          </div>`;
        })
        .join("")}
    </div>`;

  const body = `<div class="hub-panel enhance-panel">
    ${renderForgeReveal()}
    <div class="enhance-tabs" role="tablist" aria-label="강화 구역">
      <button type="button" class="enhance-tab${tab === "awaken" ? " is-active" : ""}" data-enhance-tab="awaken" role="tab" aria-selected="${tab === "awaken"}">각성·트리</button>
      <button type="button" class="enhance-tab${tab === "monsters" ? " is-active" : ""}" data-enhance-tab="monsters" role="tab" aria-selected="${tab === "monsters"}">몬스터</button>
      <button type="button" class="enhance-tab${tab === "gear" ? " is-active" : ""}" data-enhance-tab="gear" role="tab" aria-selected="${tab === "gear"}">장비</button>
      <button type="button" class="enhance-tab${tab === "symbols" ? " is-active" : ""}" data-enhance-tab="symbols" role="tab" aria-selected="${tab === "symbols"}">상징</button>
    </div>
    <div class="enhance-panels">
      <section class="enhance-section${tab === "awaken" ? " is-active" : ""}" data-enhance-panel="awaken" ${tab === "awaken" ? "" : "hidden"}>
        <p class="section-label">서머너 각성</p>
        <div class="stage-list">
          <button type="button" class="stage-card" id="btn-awaken" data-awaken ${awakenMax ? "disabled" : ""}>
            <span class="stage-card-mark" aria-hidden="true">覺</span>
            <span class="stage-card-body">
              <strong>각성 ${awaken}/${MAX_SUMMONER_AWAKEN}</strong>
              <small>리더 공+${leaderPct}% · 마나·스킬 영구 보너스 · ${awakenHint}</small>
            </span>
          </button>
        </div>
        <p class="section-label">스킬 트리 (${treeUnlocked.size}/${SKILL_TREE_NODES.length})</p>
        <div class="skill-tree-board">${treeBoard}</div>
      </section>
      <section class="enhance-section${tab === "monsters" ? " is-active" : ""}" data-enhance-panel="monsters" ${tab === "monsters" ? "" : "hidden"}>
        <p class="section-label">몬스터</p>
        <div class="stage-list">${monstersPanel}</div>
      </section>
      <section class="enhance-section${tab === "gear" ? " is-active" : ""}" data-enhance-panel="gear" ${tab === "gear" ? "" : "hidden"}>
        <p class="section-label">서머너 장비</p>
        <div class="gear-doll" aria-label="장비 슬롯">
          ${gearSlotBtn("weapon", weapon, "劍", "무기", `스킬+${(weapon.skillPowerBonus * 100).toFixed(0)}%`)}
          <div class="gear-doll-core" aria-hidden="true"><span>召</span></div>
          ${gearSlotBtn("robe", robe, "袍", "로브", `HP+${robe.summonerHpBonus} DEF+${robe.summonerDefBonus}`)}
          ${gearSlotBtn("orb", orb, "球", "마법구", gearEnhanceCostLabel(orb.enhance))}
          ${gearSlotBtn("accessory", acc, "飾", "장신구", gearEnhanceCostLabel(acc.enhance))}
          ${gearSlotBtn("cloak", cloak, "氅", "망토", `HP+${cloak.summonerHpBonus}`)}
          ${gearSlotBtn("ring", ring, "環", "반지", `스킬+${(ring.skillPowerBonus * 100).toFixed(0)}%`)}
        </div>
        <div class="gear-set-summary">${setSummary || `<span class="muted">세트 조각 없음</span>`}</div>
        <p class="section-label">세트 부여 · −마나 ${GEAR_SET_AFFIX_MANA}</p>
        <div class="gear-set-affix">${gearAffixRows}</div>
        <p class="section-label">장비 가방 (${bagLen}/${MAX_GEAR_BAG})</p>
        ${bagGrid}
      </section>
      <section class="enhance-section${tab === "symbols" ? " is-active" : ""}" data-enhance-panel="symbols" ${tab === "symbols" ? "" : "hidden"}>
        <p class="section-label">상징</p>
        ${symbolsPanel}
      </section>
    </div>
    <button type="button" class="secondary full auth-btn-ghost" data-nav="home" style="margin-top:10px">섬으로</button>
  </div>`;
  queueMicrotask(() => {
    enhanceFx = null;
  });
  return hubShell("강화진", "각성 · 스킬트리 · 장비 · 상징", body);
}

function renderShop(): string {
  const grindRows =
    save.symbols
      .map((s, i) => {
        if (!canGrindSymbol(s)) return "";
        return `<button type="button" class="stage-card" data-grind="${i}">
          <span class="stage-card-mark" aria-hidden="true">磨</span>
          <span class="stage-card-body">
            <strong>${describeSymbol(s)}</strong>
            <small>접두어 부여/재부여 · −마나 ${SYMBOL_GRIND_MANA_COST}</small>
          </span>
        </button>`;
      })
      .join("") || `<p class="muted">연마할 상징이 없습니다</p>`;
  const imprintRows =
    save.symbols
      .map((s, i) => {
        if (!canImprintSymbol(s)) return "";
        return `<button type="button" class="stage-card" data-imprint="${i}">
          <span class="stage-card-mark" aria-hidden="true">印</span>
          <span class="stage-card-body">
            <strong>${describeSymbol(s)}</strong>
            <small>주옵션 재부여 · −크리스탈 ${SYMBOL_IMPRINT_CRYSTAL_COST}</small>
          </span>
        </button>`;
      })
      .join("") ||
    `<p class="muted">각인 가능한 상징이 없습니다 (슬롯 4–6 드롭 필요)</p>`;
  return hubShell(
    "마법상점",
    `소환서 ${save.scrolls} · 마나 ${Math.floor(save.island.mana)} · 크리스탈 ${save.island.crystal}`,
    `<div class="hub-panel">
    ${renderForgeReveal()}
    <p class="section-label">소환서</p>
    <div class="stage-list">
      <button type="button" class="stage-card shop-offer shop-scroll" id="btn-buy-scroll-1">
        <span class="stage-card-mark" aria-hidden="true">1</span>
        <span class="stage-card-body">
          <strong>소환서 1장</strong>
          <small>−마나 ${SCROLL_BUY_MANA_COST} · 보유 ${save.scrolls}</small>
        </span>
      </button>
      <button type="button" class="stage-card shop-offer shop-scroll" id="btn-buy-scroll-5">
        <span class="stage-card-mark" aria-hidden="true">5</span>
        <span class="stage-card-body">
          <strong>소환서 5장</strong>
          <small>−마나 ${SCROLL_BUY_MANA_COST * 5}</small>
        </span>
      </button>
    </div>
    <p class="section-label">에너지 · 제작</p>
    <div class="stage-list">
      <button type="button" class="stage-card shop-offer" id="btn-buy-energy">
        <span class="stage-card-mark" aria-hidden="true">能</span>
        <span class="stage-card-body">
          <strong>에너지 +${ENERGY_BUY_AMOUNT}</strong>
          <small>−크리스탈 ${ENERGY_CRYSTAL_COST}</small>
        </span>
      </button>
      <button type="button" class="stage-card shop-offer" id="btn-craft-essence">
        <span class="stage-card-mark" aria-hidden="true">晶</span>
        <span class="stage-card-body">
          <strong>정수 변환</strong>
          <small>진문석 ${ESSENCE_JINMUN_COST} → 크리스탈 ${ESSENCE_CRYSTAL_GAIN} (Lv.12)</small>
        </span>
      </button>
      <button type="button" class="stage-card shop-offer" id="btn-craft-scroll">
        <span class="stage-card-mark" aria-hidden="true">召</span>
        <span class="stage-card-body">
          <strong>소환서 제작</strong>
          <small>진문석 ${CRAFT_SCROLL_JINMUN} + 마나 ${CRAFT_SCROLL_MANA} (Lv.19)</small>
        </span>
      </button>
    </div>
    <p class="section-label">상징 연마 (접두어)</p>
    <div class="stage-list">${grindRows}</div>
    <p class="section-label">상징 각인 (슬롯 4–6)</p>
    <div class="stage-list">${imprintRows}</div>
    <button type="button" class="secondary full auth-btn-ghost" data-nav="home" style="margin-top:10px">섬으로</button>
  </div>`,
  );
}

function renderGlory(): string {
  const glory = save.gloryPoints ?? 0;
  const levels = GLORY_BUILDINGS.reduce(
    (n, g) => n + (save.gloryLevels?.[g.id] ?? 0),
    0,
  );
  const maxTotal = GLORY_BUILDINGS.reduce((n, g) => n + g.maxLevel, 0);
  return hubShell(
    "영광 건물",
    `보유 영광 ${glory}`,
    `<div class="hub-panel">
    <div class="guild-panel glory-panel">
      <p class="guild-panel-title">영광 현황</p>
      <div class="guild-stats">
        <div class="guild-stat"><span>보유</span><strong>${glory}</strong></div>
        <div class="guild-stat"><span>건물 합산</span><strong>${levels}/${maxTotal}</strong></div>
        <div class="guild-stat"><span>종류</span><strong>${GLORY_BUILDINGS.length}</strong></div>
      </div>
    </div>
    <div class="stage-list">
      ${GLORY_BUILDINGS.map((g) => {
        const lv = save.gloryLevels?.[g.id] ?? 0;
        const maxed = lv >= g.maxLevel;
        return `<button type="button" class="stage-card${maxed ? " is-maxed" : ""}" data-glory="${g.id}" ${maxed ? "disabled" : ""}>
          <span class="stage-card-mark" aria-hidden="true">${lv}</span>
          <span class="stage-card-body">
            <strong>${g.nameKo} Lv.${lv}/${g.maxLevel}</strong>
            <small>${g.effectKo} · ${maxed ? "MAX" : `−영광 ${g.gloryCostPerLevel}`}</small>
          </span>
        </button>`;
      }).join("")}
    </div>
    <button type="button" class="secondary full auth-btn-ghost" data-nav="home" style="margin-top:10px">섬으로</button>
  </div>`,
  );
}

function renderCaptureShop(): string {
  if (!battle || battle.phase !== "await_capture_shop" || autoMode) return "";
  const offers = captureShopOffers();
  const markFor = (choice: string) =>
    choice === "mana" ? "魔" : choice === "amplify" ? "增" : "盾";
  const hintFor = (choice: string) =>
    choice === "mana"
      ? "서머너 마나 충전"
      : choice === "amplify"
        ? "이번 국면 Amplify"
        : "아군 실드·정리";
  return `<div class="capture-shop">
    <p class="capture-shop-title">사석상점</p>
    <p class="muted capture-shop-sub">대량 따냄 보상 — 하나 선택</p>
    <div class="stage-list capture-shop-list">
      ${offers
        .map(
          (o) =>
            `<button type="button" class="stage-card shop-offer chip-offer" data-shop="${o.choice}">
              <span class="stage-card-mark" aria-hidden="true">${markFor(o.choice)}</span>
              <span class="stage-card-body">
                <strong>${o.labelKo}</strong>
                <small>${hintFor(o.choice)}</small>
              </span>
            </button>`,
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
        `<div class="guild-rank-row${r.self ? " self-rank" : ""}">
          <span class="guild-rank-n">${i + 1}</span>
          <span class="guild-rank-name">${r.name}${r.self ? " (나)" : ""}</span>
          <strong class="guild-rank-score">${r.contribution}</strong>
        </div>`,
    )
    .join("");
  return hubShell(
    "길드 홀",
    name ?? "미가입 · 비동기 순위",
    `<div class="hub-panel">
    <div class="guild-panel">
      <p class="guild-panel-title">${name ? name : "길드 현황"}</p>
      <div class="guild-stats">
        <div class="guild-stat"><span>기여</span><strong>${save.guildContribution ?? 0}</strong></div>
        <div class="guild-stat"><span>레이드 최고</span><strong>+${save.guildRaidBest ?? 0}</strong></div>
        <div class="guild-stat"><span>출석</span><strong>${save.guildCheckInDay ?? "—"}</strong></div>
      </div>
    </div>
    ${
      name
        ? `<div class="stage-list">
             <button type="button" class="stage-card" id="btn-guild-checkin">
               <span class="stage-card-mark" aria-hidden="true">出</span>
               <span class="stage-card-body">
                 <strong>일일 출석</strong>
                 <small>기여·보상 수령</small>
               </span>
             </button>
             <button type="button" class="stage-card" id="btn-guild-rename">
               <span class="stage-card-mark" aria-hidden="true">名</span>
               <span class="stage-card-body">
                 <strong>이름 변경</strong>
                 <small>최대 16자</small>
               </span>
             </button>
           </div>`
        : `<div class="guild-join">
             <label class="guild-join-label">길드명
               <input id="guild-name-input" maxlength="16" placeholder="예: 진문수호대" />
             </label>
             <button type="button" class="auth-btn-primary full" id="btn-guild-join">가입</button>
           </div>`
    }
    <p class="section-label">레이드 기여 순위</p>
    <div class="guild-board">${board}</div>
    <button type="button" class="secondary full auth-btn-ghost" data-nav="home" style="margin-top:10px">섬으로</button>
  </div>`,
  );
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
  return hubShell(
    "융합의 별",
    `동일 종 2마리 → 진화 +1 · −마나 ${FUSION_MANA_COST}`,
    `<div class="hub-panel">
    ${renderFusionReveal()}
    <div class="guild-panel fusion-panel">
      <p class="guild-panel-title">융합 규칙</p>
      <p class="muted dojo-hint">같은 종의 두 마리를 합치면 진화 +1 · 높은 레벨·스킬·상징을 유지합니다.</p>
    </div>
    <div class="stage-list">
      ${pairs.length
        ? pairs
            .map((p) => {
              const [a, b] = p.split(":");
              const ma = save.roster[Number(a)]!;
              const mb = save.roster[Number(b)]!;
              const evo = Math.min(
                MAX_EVOLVE,
                Math.max(ma.evolve ?? 0, mb.evolve ?? 0) + 1,
              );
              return `<button type="button" class="stage-card" data-fuse-a="${a}" data-fuse-b="${b}">
                <span class="stage-card-mark" aria-hidden="true">融</span>
                <span class="stage-card-body">
                  <strong>${describeOwned(ma)} + ${describeOwned(mb)}</strong>
                  <small>결과 진화 ${evo} · −마나 ${FUSION_MANA_COST}</small>
                </span>
              </button>`;
            })
            .join("")
        : `<p class="muted">동일 종 몬스터 2마리가 필요합니다</p>`}
    </div>
    <button type="button" class="secondary full auth-btn-ghost" data-nav="home" style="margin-top:10px">섬으로</button>
  </div>`,
  );
}

function stageButtons(list: StageDef[], opts?: { equipWeekly?: boolean }): string {
  const vaultLeft = opts?.equipWeekly
    ? equipVaultRemaining(syncEquipVaultWeek(save))
    : null;
  return list
    .map((s) => {
      const label = stageUnlockLabel(save, s);
      const locked =
        !isStageUnlocked(save, s.id) ||
        (vaultLeft !== null && vaultLeft <= 0);
      const cost =
        s.energyCost > 0 ? `에너지 ${s.energyCost}` : "에너지 0";
      const extra =
        s.gloryReward != null
          ? ` · 영광 ${s.gloryReward}`
          : s.jinmunReward != null
            ? ` · 진문석 ${s.jinmunReward}`
            : "";
      const weekly =
        vaultLeft !== null ? ` · 주간 ${vaultLeft}/${EQUIP_VAULT_WEEKLY_LIMIT}` : "";
      return `<button type="button" class="stage-card" data-stage="${s.id}" ${locked ? "disabled" : ""}>
        <span class="stage-card-mark" aria-hidden="true">${s.boardSize}</span>
        <span class="stage-card-body">
          <strong>${label} · ${s.nameKo}</strong>
          <small>${s.boardSize}×${s.boardSize} · 웨이브 ${s.waves} · ${cost}${extra}${weekly}</small>
        </span>
      </button>`;
    })
    .join("");
}

function renderStages(): string {
  const cleared = save.clearedStages.length;
  const bans = save.arenaBanIds ?? [];
  const seasonWins = save.arenaSeasonWins ?? 0;
  const claimed = save.seasonRewardsClaimed ?? 0;
  const nextTierAt = (claimed + 1) * SEASON_REWARD_WINS;
  const banPool = [
    ...new Set(WORLD_ARENA_STAGES.flatMap((s) => s.enemyMonsterIds)),
  ];
  const banRow = banPool
    .map((id) => {
      const m = getMonster(id);
      const on = bans.includes(id);
      return `<button type="button" class="ban-chip${on ? " active" : ""}" data-ban-toggle="${id}">
        <span class="ban-chip-mark" aria-hidden="true">${on ? "禁" : "可"}</span>
        <span class="ban-chip-body">
          <strong>${m?.nameKo ?? id}</strong>
          <small>${on ? "밴 해제" : "밴 지정"}</small>
        </span>
      </button>`;
    })
    .join("");
  const section = (title: string, body: string, note?: string) =>
    `<section class="stage-section">
      <p class="section-label">${title}</p>
      ${note ? `<p class="muted stages-note">${note}</p>` : ""}
      ${body}
    </section>`;
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
        <p class="stages-meta">클리어 ${cleared} · 시즌승 ${seasonWins}</p>
      </header>
      <div class="stages-summary">
        <div class="stages-stat"><span>클리어</span><strong>${cleared}</strong></div>
        <div class="stages-stat"><span>시즌승</span><strong>${seasonWins}</strong></div>
        <div class="stages-stat"><span>밴</span><strong>${bans.length}/2</strong></div>
      </div>
      ${section("시나리오 1 · 가렌숲", `<div class="stage-list">${stageButtons(CHAPTER1_STAGES)}</div>`)}
      ${section("시나리오 2 · 용맹의 탑", `<div class="stage-list">${stageButtons(CHAPTER2_STAGES)}</div>`)}
      ${section("상징 심층", `<div class="stage-list">${stageButtons(DEPTH_STAGES)}</div>`)}
      ${section("아레나", `<div class="stage-list">${stageButtons(ARENA_STAGES)}</div>`)}
      ${section(
        "요일 · 마법진 시련",
        `<div class="stage-list">${stageButtons([...WEEKDAY_STAGES, ...TRIAL_STAGES])}</div>`,
      )}
      ${section(
        "장비 금고",
        `<div class="stage-list">${stageButtons(EQUIP_STAGES, { equipWeekly: true })}</div>`,
        `주간 ${equipVaultRemaining(syncEquipVaultWeek(save))}/${EQUIP_VAULT_WEEKLY_LIMIT} · 가방 보관 후 강화진에서 장착/판매`,
      )}
      ${section(
        "월드아레나 · 밴픽",
        `<div class="season-panel">
          <p class="season-panel-title">시즌 보상</p>
          <p class="muted stages-note">다음 티어 ${nextTierAt}승 · 현재 티어 ${claimed}</p>
          <button type="button" class="auth-btn-primary full" id="btn-season-claim">시즌 보상 수령</button>
        </div>
        <div class="ban-row">${banRow}</div>
        <div class="stage-list">${stageButtons(WORLD_ARENA_STAGES)}</div>`,
        `밴 ${bans.length ? bans.map((id) => getMonster(id)?.nameKo ?? id).join(", ") : "없음"} · 최대 2`,
      )}
      ${section(
        "길드 레이드",
        `<div class="stage-list">${stageButtons(GUILD_RAID_STAGES)}</div>`,
        `13×13 · 기여 ${save.guildContribution ?? 0} · 최고 +${save.guildRaidBest ?? 0}`,
      )}
    </div>
  </div>`;
}

function renderBattleTicker(): string {
  if (!battle) return "";
  const lines = battle.log
    .filter(
      (l) =>
        /스톤패시브|획득|스폰|웨이브|강화 진문|진문 붕괴|포석 보너스|defeated|회복|진문개방|증폭선언|쌍착수|진문청소|진문수호|형상|이벤트|사석상점|속성|필승|봉인|돌흡수|진형파괴|서머너 착수|묘수|맞마나|이중층/.test(l),
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
  const canDeclare = !!active && battle.canUseSummonerDeclare(active);
  const canDual = !!active && battle.canUseSummonerDual(active);
  const canClean = !!active && battle.canUseSummonerClean(active);
  const canGuard = !!active && battle.canUseSummonerGuard(active);
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

  const showBoardSwitch =
    battle.boards.length > 1 &&
    battle.phase === "await_stone" &&
    active?.team === "ally" &&
    !autoMode;
  const skillRow = awaitShop
    ? ""
    : `<div class="skill-dock${showBoardSwitch ? " has-switch" : ""}">
      <div class="skill-cluster skill-cluster--unit">
        ${renderSkillButtons(active, awaitSkill)}
      </div>
      <div class="skill-cluster skill-cluster--summoner" aria-label="서머너 마나 스킬">
        <button type="button" id="sk-ult" class="summoner-sk ult${canUlt ? " ready" : ""}" ${awaitSkill && canUlt ? "" : "disabled"}><span class="sk-mark" aria-hidden="true">開</span><span class="sk-name">개방</span></button>
        <button type="button" id="sk-declare" class="summoner-sk declare${canDeclare ? " ready" : ""}" ${awaitSkill && canDeclare ? "" : "disabled"}><span class="sk-mark" aria-hidden="true">宣</span><span class="sk-name">증폭</span></button>
        <button type="button" id="sk-dual" class="summoner-sk dual${canDual ? " ready" : ""}" ${awaitSkill && canDual ? "" : "disabled"}><span class="sk-mark" aria-hidden="true">雙</span><span class="sk-name">쌍착</span></button>
        <button type="button" id="sk-clean" class="summoner-sk clean${canClean ? " ready" : ""}" ${awaitSkill && canClean ? "" : "disabled"}><span class="sk-mark" aria-hidden="true">掃</span><span class="sk-name">청소</span></button>
        <button type="button" id="sk-guard" class="summoner-sk guard${canGuard ? " ready" : ""}" ${awaitSkill && canGuard ? "" : "disabled"}><span class="sk-mark" aria-hidden="true">守</span><span class="sk-name">수호</span></button>
      </div>
      <div class="skill-cluster skill-cluster--util">
        <button type="button" id="sk-smart" class="smart" ${awaitSkill ? "" : "disabled"}>추천</button>
        ${
          showBoardSwitch
            ? `<button type="button" class="secondary board-switch" id="btn-board-switch">쌍국 ${battle.boardLabel === "A국" ? "→B" : "→A"}</button>`
            : ""
        }
      </div>
    </div>`;

  const manaTone =
    manaPct >= 99 ? " is-full" : manaPct >= 40 ? " is-charged" : "";

  return `<div class="battle-screen">
    <div class="battle-sky" aria-hidden="true">
      <img
        class="battle-sky-img"
        src="/art/battle/battle-arena-bg.webp"
        srcset="/art/battle/battle-arena-bg-720.webp 720w, /art/battle/battle-arena-bg.webp 1080w"
        sizes="(max-width: 430px) 100vw, 430px"
        width="1080"
        height="1920"
        alt=""
        decoding="async"
      />
      <div class="battle-sky-veil"></div>
    </div>
    <div class="battle-layout battle-layout--framed">
    <div class="battle-top">
      <div class="battle-stage-name">${currentStage.nameKo}</div>
      <div class="battle-wave">${currentStage.boardSize}×${currentStage.boardSize} · 웨이브 ${battle.currentWave}/${battle.totalWaves}</div>
      <div class="battle-status">${status}</div>
    </div>
    ${renderBattleTicker()}
    <div class="item-legend">서머너 후열(무적) · 전열 소환수 전멸 시 승패</div>
    ${renderSummonerBack(enemyBack, "enemy")}
    <div class="team-row enemy">${enemyFront.map((u) => renderUnit(u, { targetable: awaitSkill })).join("")}</div>
    <div class="board-wrap">
      ${renderBoardTabs()}
      <div class="dmg-layer">${renderDmgLayer()}</div>
      ${renderBoard()}
      ${renderSuggestStrip()}
      ${renderCaptureShop()}
      <div class="mana-block${manaTone}">
        <div class="mana-head">
          <span class="mana-label">서머너 마나</span>
          <span class="mana-nums">${Math.floor(battle.allySummoner.mana)}<small>/${battle.allySummoner.manaMax}</small></span>
        </div>
        <div class="bar mana mana-lg"><i style="width:${manaPct}%"></i></div>
        <div class="mana-ticks" aria-hidden="true"><i></i><i></i><i></i></div>
      </div>
    </div>
    ${skillRow}
    ${skillHint ? `<p class="skill-hint">${skillHint}</p>` : ""}
    <div class="team-row ally">${allyFront.map((u) => renderUnit(u)).join("")}</div>
    ${renderSummonerBack(allyBack, "ally")}
    <div class="battle-hud">
      <button type="button" class="secondary" id="btn-back">나가기</button>
      <button type="button" class="secondary" id="btn-speed">x${battleSpeed}</button>
      <button type="button" id="btn-auto-toggle" class="${autoMode ? "auto-on" : ""}">${autoMode ? "AUTO ON" : "AUTO"}</button>
    </div>
    <div class="log">${battle.log.slice(-6).map((l) => `<div>${l}</div>`).join("")}</div>
  </div>
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
        if (nav !== "battle" && nav !== "result") {
          battle = null;
          dmgFloats = [];
          if (nav === "home" || nav === "enhance" || nav === "shop" || nav === "party") {
            if (nav === "home") {
              currentStage = null;
              lastReward = null;
              lastScrollGain = 0;
            }
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
        partyDraft = null;
        render();
        return;
      }
      if (nav === "party") {
        partyDraft = new Set(save.party);
      } else if (view === "party" && nav !== "party") {
        partyDraft = null;
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
        view = "mine";
        render();
      } else if (id === "wish") {
        wishReveal = null;
        view = "wish";
        render();
      } else if (id === "glory") {
        view = "glory";
        render();
      } else if (id === "dojo") {
        view = "dojo";
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
        partyDraft = new Set(save.party);
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

  app.querySelector("#btn-summon-party")?.addEventListener("click", () => {
    if (!lastSummonUid) return;
    const uid = lastSummonUid;
    if (save.party.includes(uid)) {
      flash("이미 파티에 있습니다.");
      render();
      return;
    }
    const next =
      save.party.length < 4
        ? [...save.party, uid]
        : [...save.party.slice(0, 3), uid];
    const r = runSetParty(save, next);
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

  app.querySelectorAll<HTMLButtonElement>("[data-enhance-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.enhanceTab;
      if (
        raw === "awaken" ||
        raw === "monsters" ||
        raw === "gear" ||
        raw === "symbols"
      ) {
        enhanceTab = raw;
        render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-gear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.gear;
      const slot =
        raw === "weapon" ||
        raw === "robe" ||
        raw === "orb" ||
        raw === "cloak" ||
        raw === "ring" ||
        raw === "accessory"
          ? raw
          : "accessory";
      const r = runEnhanceGear(save, slot);
      save = r.save;
      if (r.message.startsWith("장비 강화:")) {
        enhanceFx = { kind: "gear", slot };
      }
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-gear-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.gearSet;
      const setRaw = btn.dataset.setId ?? "";
      const slot =
        raw === "weapon" ||
        raw === "robe" ||
        raw === "orb" ||
        raw === "cloak" ||
        raw === "ring" ||
        raw === "accessory"
          ? raw
          : "accessory";
      if (
        setRaw !== "mana" &&
        setRaw !== "assault" &&
        setRaw !== "guardian" &&
        setRaw !== "sense" &&
        setRaw !== "tempo"
      ) {
        return;
      }
      const r = runAffixGearSet(save, slot, setRaw);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-gear-equip]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.gearEquip ?? "-1");
      const r = runEquipGearBag(save, idx);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-gear-sell]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.gearSell ?? "-1");
      const r = runSellGearBag(save, idx);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-awaken]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const r = runAwakenSummoner(save);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-skill-node]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.skillNode ?? "";
      const r = runUnlockSkillNode(save, id);
      save = r.save;
      if (id && r.message.includes("해금")) {
        enhanceFx = { kind: "node", id };
      }
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
      const prev = save.symbols[Number(idx)];
      const before = prev ? describeSymbol(prev) : "";
      const id = prev?.id;
      const r = runGrindSymbol(save, idx);
      save = r.save;
      persist();
      const next = id ? save.symbols.find((s) => s.id === id) : undefined;
      if (next && before && r.message.startsWith("연마:")) {
        forgeReveal = {
          kind: "grind",
          before,
          after: describeSymbol(next),
          cost: `−마나 ${SYMBOL_GRIND_MANA_COST}`,
        };
      }
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
      const prev = save.symbols[Number(idx)];
      const before = prev ? describeSymbol(prev) : "";
      const id = prev?.id;
      const r = runImprintSymbol(save, idx);
      save = r.save;
      persist();
      const next = id ? save.symbols.find((s) => s.id === id) : undefined;
      if (next && before && r.message.startsWith("각인:")) {
        forgeReveal = {
          kind: "imprint",
          before,
          after: describeSymbol(next),
          cost: `−크리스탈 ${SYMBOL_IMPRINT_CRYSTAL_COST}`,
        };
      }
      flash(r.message);
      render();
    });
  });

  app.querySelector("#btn-forge-dismiss")?.addEventListener("click", () => {
    forgeReveal = null;
    render();
  });

  app.querySelector("#btn-dojo-drill")?.addEventListener("click", () => {
    const r = runPracticeDojo(save);
    save = r.save;
    persist();
    flash(r.message);
    render();
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
      const a = save.roster[Number(btn.dataset.fuseA!)];
      const b = save.roster[Number(btn.dataset.fuseB!)];
      const materials =
        a && b ? `${describeOwned(a)} + ${describeOwned(b)}` : "";
      const keepUid = a?.uid;
      const r = runFusion(save, btn.dataset.fuseA!, btn.dataset.fuseB!);
      save = r.save;
      persist();
      if (r.message.startsWith("융합:") && keepUid) {
        const kept = save.roster.find((m) => m.uid === keepUid);
        if (kept && materials) {
          fusionReveal = {
            materials,
            result: describeOwned(kept),
            cost: `−마나 ${FUSION_MANA_COST}`,
          };
        }
      }
      flash(r.message);
      render();
    });
  });

  app.querySelector("#btn-fusion-dismiss")?.addEventListener("click", () => {
    fusionReveal = null;
    render();
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

  app.querySelector("#btn-mine-collect")?.addEventListener("click", () => {
    const r = homeCollectCrystal(save);
    save = r.save;
    persist();
    flash(r.message);
    render();
  });
  app.querySelector("#btn-mine-upgrade")?.addEventListener("click", () => {
    const r = runUpgradeBuilding(save, "crystal_mine");
    save = r.save;
    persist();
    flash(r.message);
    render();
  });

  app.querySelector("#btn-wish-cast")?.addEventListener("click", () => {
    const r = runDailyWish(save);
    save = r.save;
    persist();
    if (r.message.startsWith("소원:")) {
      wishReveal = r.message.replace(/^소원:\s*/, "");
    }
    flash(r.message);
    render();
  });
  app.querySelector("#btn-wish-dismiss")?.addEventListener("click", () => {
    wishReveal = null;
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-equip-sym]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.equipSym);
      if (!Number.isFinite(idx) || !save.symbols[idx]) return;
      slotEquipPick = null;
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
      slotEquipPick = null;
      flash(r.message);
      render();
    });
  });

  app.querySelector("#btn-equip-cancel")?.addEventListener("click", () => {
    equipPickSymIndex = null;
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-slot-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = btn.dataset.slotPickUid!;
      const slot = Number(btn.dataset.slotPick);
      if (!uid || !Number.isFinite(slot)) return;
      equipPickSymIndex = null;
      slotEquipPick =
        slotEquipPick?.uid === uid && slotEquipPick.slot === slot
          ? null
          : { uid, slot };
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-slot-equip-sym]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!slotEquipPick) return;
      const idx = Number(btn.dataset.slotEquipSym);
      if (!Number.isFinite(idx) || !save.symbols[idx]) return;
      const r = runEquipSymbol(save, slotEquipPick.uid, String(idx));
      save = r.save;
      persist();
      slotEquipPick = null;
      equipPickSymIndex = null;
      flash(r.message);
      render();
    });
  });

  app.querySelector("#btn-slot-equip-cancel")?.addEventListener("click", () => {
    slotEquipPick = null;
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-unequip-uid]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = btn.dataset.unequipUid!;
      const slot = Number(btn.dataset.unequipSlot);
      const r = runUnequipSymbol(save, uid, slot);
      save = r.save;
      persist();
      slotEquipPick = null;
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-party-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const draft = ensurePartyDraft();
      const uid = btn.dataset.partyToggle!;
      if (draft.has(uid)) draft.delete(uid);
      else if (draft.size < 4) draft.add(uid);
      else {
        flash("파티는 최대 4명입니다.");
        render();
        return;
      }
      render();
    });
  });

  app.querySelector("#btn-party-save")?.addEventListener("click", () => {
    const draft = ensurePartyDraft();
    if (draft.size === 0) {
      flash("최소 1명을 선택하세요.");
      return;
    }
    const r = runSetParty(save, [...draft]);
    save = r.save;
    persist();
    partyDraft = null;
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
  app.querySelector("#sk-declare")?.addEventListener("click", () =>
    castSkill("declare"),
  );
  app.querySelector("#sk-dual")?.addEventListener("click", () =>
    castSkill("dual"),
  );
  app.querySelector("#sk-clean")?.addEventListener("click", () =>
    castSkill("clean"),
  );
  app.querySelector("#sk-guard")?.addEventListener("click", () =>
    castSkill("guard"),
  );
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
