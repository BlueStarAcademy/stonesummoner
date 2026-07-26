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
  DEPTH_STAGES,
  EQUIP_STAGES,
  GLORY_BUILDINGS,
  GUILD_RAID_STAGES,
  MAIN_QUEST_PIN_LAYOUT,
  MAIN_QUEST_STAGES,
  SIDE_CONTENT_PIN_LAYOUT,
  STAGES_PER_AREA,
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
  stagesForMap,
  summarizeGearSets,
  SYMBOL_GRIND_MANA_COST,
  SYMBOL_IMPRINT_CRYSTAL_COST,
  symbolEnhanceManaCost,
  type MainQuestPinId,
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
  createSummonerRoster,
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
  getActiveSummoner,
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
  setActiveSummoner,
  SCROLL_BUY_MANA_COST,
  SCROLL_KIND_BLURB,
  SCROLL_KIND_LABEL,
  SCROLL_KINDS,
  scrollCount,
  totalScrollCount,
  SUMMON_MULTI_COUNT,
  SUMMON_SCROLL_COST,
  SUMMONER_ELEMENTS,
  SUMMONER_ELEMENT_LABEL,
  symbolSellMana,
  skillUpManaCost,
  skillUpMinMonsterLevel,
  stageUnlockLabel,
  EQUIP_VAULT_WEEKLY_LIMIT,
  equipVaultRemaining,
  syncEquipVaultWeek,
  type BattleReward,
  type PlayerSave,
  type ScrollKind,
  type SummonerElement,
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

const AUTH_PREFS_KEY = "stonesummoner.auth.prefs.v1";

type AuthPrefs = {
  saveId: boolean;
  autoLogin: boolean;
  savedEmail: string;
};

function defaultAuthPrefs(): AuthPrefs {
  return { saveId: true, autoLogin: true, savedEmail: "" };
}

function readAuthPrefs(): AuthPrefs {
  try {
    const raw = localStorage.getItem(AUTH_PREFS_KEY);
    if (!raw) return defaultAuthPrefs();
    const parsed = JSON.parse(raw) as Partial<AuthPrefs>;
    return {
      saveId: parsed.saveId !== false,
      autoLogin: parsed.autoLogin !== false,
      savedEmail: typeof parsed.savedEmail === "string" ? parsed.savedEmail : "",
    };
  } catch {
    return defaultAuthPrefs();
  }
}

function writeAuthPrefs(next: AuthPrefs): void {
  localStorage.setItem(AUTH_PREFS_KEY, JSON.stringify(next));
}

let sessionUser: SessionUser | null = null;
const authUi = { pane: "login" as "login" | "register" };
let bootReady = false;
let cloudTimer: ReturnType<typeof setTimeout> | null = null;
/** False after cloud 401 ? keep local play, stop PUT spam. */
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
/** Most recently summoned monster uids (summon reveal card / multi). */
let lastSummonUids: string[] = [];
/** Symbol index awaiting monster pick for equip. */
let equipPickSymIndex: number | null = null;
/** Empty slot awaiting symbol pick (monster uid + slot 1?6). */
let slotEquipPick: { uid: string; slot: number } | null = null;
/** Grind/imprint before?after reveal card. */
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
/** Last seen circle phase ? detect empowered reset for board FX. */
let lastSeenBoardPhase = 0;
/** One-shot collapse?rekindle class on the board frame. */
let boardRekindleFx = false;

/** Extra currencies drawer under app-bar resources. */
let resMoreOpen = false;
let settingsOpen = false;
let mailboxOpen = false;
let notifOpen = false;
let summonerPickerOpen = false;

type StagesRegionId =
  | MainQuestPinId
  | "depth"
  | "arena"
  | "cadence"
  | "equip"
  | "warena"
  | "guild";
let stagesRegion: StagesRegionId | null = null;
let islandPan = { x: 0, y: 0 };
let islandPanCentered = false;
let islandPanDrag: {
  pointerId: number;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  moved: boolean;
} | null = null;
let stagesPan = { x: 0, y: 0 };
let stagesPanCentered = false;
let stagesPanDrag: {
  pointerId: number;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  moved: boolean;
} | null = null;

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

async function hydrateSession(
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
    return;
  }
  if (opts?.fresh) {
    save = createNewSave();
    persist();
    return;
  }
  if (!user.id.startsWith("local-")) {
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
    return;
  }
  save = loadLocalSave() ?? createNewSave();
  localStorage.setItem(localSaveKey(), JSON.stringify(save));
}

async function enterWithUser(
  user: SessionUser,
  opts?: { demo?: boolean; fresh?: boolean; enterGame?: boolean },
): Promise<void> {
  await hydrateSession(user, opts);
  authUi.pane = "login";
  const enterGame =
    opts?.enterGame ??
    (opts?.demo === true ||
      opts?.fresh === true ||
      readAuthPrefs().autoLogin);
  if (enterGame) {
    view = "home";
    flash(
      user.kind === "demo"
        ? "데모 모드로 입장했습니다."
        : user.kind === "guest"
          ? "게스트로 플레이합니다."
          : `환영합니다${user.email ? ` · ${user.email}` : ""}`,
    );
  } else {
    view = "auth";
    flash(
      user.email
        ? `로그인됨 · ${user.email}`
        : "로그인되었습니다. 게임시작을 눌러 주세요.",
    );
  }
  render();
}

function startGameFromAuth(): void {
  if (!sessionUser) return;
  view = "home";
  flash(
    sessionUser.kind === "demo"
        ? "데모 모드로 입장했습니다."
      : sessionUser.kind === "guest"
        ? "게스트로 플레이합니다."
        : `환영합니다${sessionUser.email ? ` · ${sessionUser.email}` : ""}`,
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
  authUi.pane = "login";
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
      ${navBackBtn({ nav: "stages", label: "돌아가기" })}
      <div class="battle-sky" aria-hidden="true">
        <img class="battle-sky-img" src="/art/battle/battle-arena-bg.webp" alt="" decoding="async" />
        <div class="battle-sky-veil"></div>
      </div>
      <div class="result-screen is-lose">
        <div class="result-banner">
          <p class="result-kicker">전투 결과</p>
          <h2 class="result-title">결과 없음</h2>
          <p class="result-sub">출정문으로 돌아가 다시 도전하세요</p>
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
        <p class="section-label">장비 드롭</p>
        <p class="result-drop-card">${describeSymbol(reward.symbol)}</p>
        <div class="result-drop-cta">
          <button type="button" class="auth-btn-primary" data-nav="enhance">강화진에서 장착</button>
          <button type="button" class="secondary" data-nav="shop">연마·각인</button>
        </div>
      </div>`
      : "",
  ].join("");
  return `<div class="result-wrap">
    ${navBackBtn({ nav: "stages", label: "돌아가기" })}
    <div class="battle-sky" aria-hidden="true">
      <img class="battle-sky-img" src="/art/battle/battle-arena-bg.webp" alt="" decoding="async" />
      <div class="battle-sky-veil"></div>
    </div>
    <div class="result-screen ${win ? "is-win" : "is-lose"}">
    <div class="result-banner">
      <p class="result-kicker">전투 결과</p>
          <h2 class="result-title">결과 없음</h2>
          <p class="result-sub">출정문으로 돌아가 다시 도전하세요</p>
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
    flash("에너지가 부족합니다.");
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
    flash("이전 스테이지를 먼저 클리어하세요.");
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
          ? "?"
          : token?.id === "shield_core"
            ? "?"
            : token?.id === "capture_magnet"
              ? "?"
              : token?.id === "stride_sand"
                ? "?"
                : token?.id === "seal_nail"
                  ? "?"
                  : token?.id === "element_ward"
                    ? "?"
                    : token?.id === "bait_stone"
                      ? "?"
                      : token?.id === "transform_dust"
                        ? "?"
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
              ? `<span class="forbid-mark">?</span>`
              : bait
                ? `<span class="bait-mark">?</span>`
                : victory === key
                  ? `<span class="victory-mark">?</span>`
                  : starSet.has(key)
                    ? `<span class="star-mark">?</span>`
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
        const label = i === 0 ? "A?" : "B?";
        const active = battle!.activeBoardIndex === i;
        const stones = battle!.boards[i]!
          .getBoard()
          .flat()
          .filter(Boolean).length;
        return `<button type="button" class="board-tab${active ? " active" : ""}" data-board-tab="${i}" ${active ? "aria-selected=\"true\"" : ""}>
          ${label}<small>${stones}?</small>
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
    <h1 class="auth-logo-wrap">
      <img
        class="auth-logo"
        src="/art/auth/logo-title-lockup.webp"
        width="1024"
        height="1024"
        alt="Stone Summoners — 신비의마법석"
        decoding="async"
        fetchpriority="high"
      />
    </h1>
  </header>`;
}

function renderAuth(): string {
  const prefs = readAuthPrefs();
  const pane = authUi.pane;
  const loggedIn = !!sessionUser;

  if (loggedIn) {
    const label =
      sessionUser!.email ??
      (sessionUser!.kind === "demo"
        ? "데모"
        : sessionUser!.kind === "guest"
          ? "?"
          : "모험가");
    return `${authHeroLayer()}
    <div class="auth-screen auth-screen--center">
      ${authBrand()}
      <div class="auth-panel">
        <p class="auth-session">로그인 · ${label}</p>
        <div class="auth-cta">
          <button type="button" class="auth-btn-primary" id="auth-start">게임시작</button>
          <button type="button" class="secondary auth-btn-ghost" id="auth-logout">로그아웃</button>
        </div>
      </div>
    </div>`;
  }

  if (pane === "register") {
    return `${authHeroLayer()}
    <div class="auth-screen auth-screen--center">
      ${navBackBtn({ id: "auth-back", label: "돌아가기" })}
      ${authBrand()}
      <div class="auth-panel">
        <h2 class="auth-title">회원가입</h2>
        <form id="auth-form" class="auth-form">
          <label>이메일<input name="email" type="email" autocomplete="username" required /></label>
          <label>비밀번호<input name="password" type="password" autocomplete="new-password" minlength="6" required /></label>
          <button type="submit" class="auth-btn-primary">회원가입</button>
        </form>
      </div>
    </div>`;
  }

  const savedEmail = prefs.saveId ? prefs.savedEmail : "";
  const emailAttr = savedEmail
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
  return `${authHeroLayer()}
  <div class="auth-screen auth-screen--center">
      ${authBrand()}
    <div class="auth-panel">
        <h2 class="auth-title">회원가입</h2>
      <form id="auth-form" class="auth-form">
        <label>이메일<input name="email" type="email" autocomplete="username" value="${emailAttr}" required /></label>
        <label>비밀번호<input name="password" type="password" autocomplete="current-password" minlength="6" required /></label>
        <div class="auth-checks">
          <label class="auth-check"><input type="checkbox" name="saveId" ${prefs.saveId ? "checked" : ""} /> 아이디 저장</label>
          <label class="auth-check"><input type="checkbox" name="autoLogin" ${prefs.autoLogin ? "checked" : ""} /> 자동 로그인</label>
        </div>
          <button type="submit" class="auth-btn-primary">회원가입</button>
      </form>
      <div class="auth-cta auth-cta--secondary">
        <button type="button" class="secondary auth-btn-ghost" id="auth-register">회원가입</button>
        <button type="button" class="secondary auth-btn-ghost" id="auth-demo">데모 플레이</button>
        <button type="button" class="secondary auth-btn-ghost" id="auth-guest">게스트로 계속</button>
      </div>
    </div>
    ${
      ephemeralStore
        ? `<p class="auth-warn">서버 DB가 메모리 모드입니다. 배포 환경에서는 Postgres(DATABASE_URL)를 연결하세요.</p>`
        : ""
    }
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

/** Compact display for wallet amounts in the app bar. */
function fmtRes(n: number): string {
  const v = Math.floor(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `${(Math.round(v / 100) / 10).toFixed(1)}K`;
  return v.toLocaleString("ko-KR");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Short display name for profile overlays. */
function displayNickname(): string {
  const email = sessionUser?.email?.trim();
  if (email) {
    const local = email.split("@")[0] || email;
    return local.length > 10 ? `${local.slice(0, 10)}?` : local;
  }
  if (sessionUser?.kind === "demo") return "체험 계정";
  if (sessionUser?.kind === "guest") return "게스트";
  return "모험가";
}

/** Toggle currency drawer without a full screen re-render. */
function applyResMoreOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-res-more");
  const panel = app.querySelector<HTMLElement>("#res-more-panel");
  if (btn) {
    btn.classList.toggle("is-open", resMoreOpen);
    btn.setAttribute("aria-expanded", resMoreOpen ? "true" : "false");
    const label = resMoreOpen ? "?? ??" : "?? ?? ??";
    btn.title = label;
    btn.setAttribute("aria-label", label);
  }
  if (panel) {
    panel.classList.toggle("is-open", resMoreOpen);
    if (resMoreOpen) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "");
  }
}

/** Toggle summoner picker sheet without a full screen re-render. */
function applySummonerPickerOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-summoner-picker");
  const layer = app.querySelector<HTMLElement>("#summoner-picker-layer");
  if (btn) {
    btn.setAttribute("aria-expanded", summonerPickerOpen ? "true" : "false");
  }
  if (layer) {
    layer.hidden = !summonerPickerOpen;
    layer.setAttribute("aria-hidden", summonerPickerOpen ? "false" : "true");
  }
}

/** One-line notice board lines under the app bar. */
function tickerMessages(): string[] {
  const active = getActiveSummoner(save);
  const el = save.activeSummoner ?? "light";
  const energy = Math.floor(save.island.energy);
  const energyMax = save.island.energyMax ?? 100;
  const lines = [
    "신비의마법석 · 섬을 드래그해 시설을 둘러보세요",
    `${SUMMONER_ELEMENT_LABEL[el]} 서머너 Lv.${active.level} 육성 중`,
    `행동력 ${energy}/${energyMax} · 출정문으로 전투에 나서세요`,
    `소환서 ${totalScrollCount(save)}장 · 소환진에서 동료를 불러내세요`,
  ];
  if ((save.gloryPoints ?? 0) > 0) {
    lines.push(`영광 ${save.gloryPoints} · 영광 건물에서 보너스를 강화하세요`);
  }
  if (save.island.summonerLevel < 7) {
    lines.push("서머너 Lv.7에 소원의 사당이 해금됩니다");
  } else if (save.island.summonerLevel < 8) {
    lines.push("서머너 Lv.8에 마법진 도장이 해금됩니다");
  }
  return lines;
}

function renderTicker(): string {
  const items = tickerMessages().map((m) => escapeHtml(m));
  const joined = items.join("　　·　　");
  return `<div class="ticker" role="marquee" aria-label="공지 전광판">
    <div class="ticker-fade" aria-hidden="true"></div>
    <div class="ticker-track">
      <span class="ticker-text">${joined}</span>
      <span class="ticker-text" aria-hidden="true">${joined}</span>
    </div>
  </div>`;
}

function render(): void {
  if (!bootReady) {
    app.classList.add("auth-mode");
    app.innerHTML = `<main class="auth-main auth-main--center">${authHeroLayer()}
      <div class="auth-screen auth-screen--center">
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
  const tabBattle = view === "stages" || view === "battle" || view === "result";
  const tabMonster = view === "enhance" || view === "fusion" || view === "party";
  const tabMission = view === "wish" || view === "glory" || view === "dojo";
  const tabCommunity = view === "guild";
  const tabShop = view === "shop";
  const demoTag = sessionUser?.kind === "demo" ? `<span class="demo-tag">DEMO</span>` : "";
  const mailItems = [
    { title: "모험가 환영 선물", body: "신비의마법석에 오신 것을 환영합니다. 소환서와 마나를 확인하세요.", tag: "시스템" },
    { title: "일일 접속 보너스", body: "오늘도 섬을 둘러보고 출정문에 도전해 보세요.", tag: "보상" },
  ];
  const notifItems = tickerMessages().slice(0, 5);

  if (view === "auth") {
    app.classList.add("auth-mode");
    app.classList.remove("home-mode");
    app.classList.remove("expedition-mode");
    app.classList.remove("combat-mode");
    app.innerHTML = `
      <main class="auth-main auth-main--center">${renderAuth()}</main>
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

  const activeSum = getActiveSummoner(save);
  const activeEl = save.activeSummoner ?? "light";
  const isHome = view === "home";
  const nick = escapeHtml(displayNickname());
  const userLv = island.summonerLevel;
  const userExp = Math.floor(island.summonerExp ?? 0);
  const accountLabel =
    sessionUser?.email ??
    (sessionUser?.kind === "demo"
      ? "일반 진문"
      : sessionUser?.kind === "guest"
        ? "데모"
          : "모험가");
  const rosterForPicker = save.summoners ?? createSummonerRoster();
  const summonerPickerList = SUMMONER_ELEMENTS.map((el) => {
    const p = rosterForPicker[el];
    const on = el === activeEl;
    const aw = p.awaken > 0 ? ` ? ?? ${p.awaken}` : "";
    return `<button type="button" class="summoner-pick${on ? " ? ?? ?" : ""}" data-summoner="${el}" ${on ? "disabled" : ""}>
      <img class="summoner-pick-art" src="/art/summoner/${el}.svg" width="44" height="44" alt="" draggable="false" />
      <span class="summoner-pick-body">
        <strong>${SUMMONER_ELEMENT_LABEL[el]} 서머너</strong>
        <small>Lv.${p.level}${aw}${on ? " ? ?? ?" : ""}</small>
      </span>
    </button>`;
  }).join("");

  app.classList.remove("auth-mode");
  app.classList.toggle("home-mode", view === "home");
  app.classList.toggle("expedition-mode", view === "stages");
  app.classList.toggle("combat-mode", view === "battle" || view === "result");
  app.innerHTML = `
    <header class="app-bar app-bar--strip${isHome ? " app-bar--home" : ""}">
      <div class="app-bar-frame app-bar-frame--strip">
        <div class="app-bar-rail" aria-hidden="true"></div>
        <div class="app-bar-strip">
          <div class="app-bar-brand app-bar-brand--strip" title="${nick}">
            <div class="user-profile" aria-label="Lv.${userLv}">
              <img class="user-profile-img" src="/art/auth/logo-mark-192.png" width="40" height="40" alt="" />
              <span class="user-profile-lv">Lv.${userLv}</span>
              <div class="user-profile-foot">
                <div class="user-profile-exp" role="progressbar" aria-valuenow="${userExp}" aria-valuemin="0" aria-valuemax="100" aria-label="경험치 ${userExp}/100">
                  <div class="user-profile-exp-fill" style="width:${Math.min(100, userExp)}%"></div>
                </div>
              </div>
            </div>
            <div class="user-profile-info">
              <div class="user-profile-top">
                <p class="user-profile-nick">${nick}${demoTag ? ` ${demoTag}` : ""}</p>
                <div class="res-item res-item--energy" title="행동력">
                  <img class="res-ico" src="/art/ui/res/energy.svg" width="14" height="14" alt="" draggable="false" />
                  <strong class="res-val">${Math.floor(island.energy)}<small>/${island.energyMax ?? 100}</small></strong>
                </div>
              </div>
              ${
                isHome
                  ? ""
                  : `<p class="user-profile-sub">${SUMMONER_ELEMENT_LABEL[activeEl]} Lv.${activeSum.level}${
                      activeSum.awaken > 0 ? ` ? ?? ${activeSum.awaken}` : ""
                    }</p>`
              }
            </div>
          </div>
          <div class="res-wallet" role="group" aria-label="주요 재화">
            <div class="res-item res-item--gold" title="골드">
              <img class="res-ico" src="/art/ui/res/gold.svg" width="14" height="14" alt="" draggable="false" />
              <strong class="res-val">${fmtRes(island.mana)}</strong>
            </div>
            <button type="button" class="res-more-btn${resMoreOpen ? " is-open" : ""}" id="btn-res-more" aria-expanded="${resMoreOpen ? "true" : "false"}" aria-controls="res-more-panel" title="${resMoreOpen ? "재화 접기" : "다른 재화 보기"}" aria-label="${resMoreOpen ? "재화 접기" : "다른 재화 보기"}">
              <span class="res-more-chevron" aria-hidden="true"></span>
            </button>
            <div class="res-item res-item--crystal" title="크리스탈">
              <img class="res-ico" src="/art/ui/res/crystal.svg" width="14" height="14" alt="" draggable="false" />
              <strong class="res-val">${fmtRes(island.crystal)}</strong>
            </div>
            <div class="res-more-panel${resMoreOpen ? " is-open" : ""}" id="res-more-panel" role="region" aria-label="기타 재화" ${resMoreOpen ? "" : "hidden"}>
                <div class="res-item res-item--scroll" title="일반 소환서">
                  <img class="res-ico" src="/art/ui/res/scroll.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">${fmtRes(scrollCount(save, "normal"))}<small>?</small></strong>
                </div>
                <div class="res-item res-item--scroll" title="고급 소환서">
                  <img class="res-ico" src="/art/ui/res/scroll.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">${fmtRes(scrollCount(save, "premium"))}<small>?</small></strong>
                </div>
                <div class="res-item res-item--scroll" title="신성/심연 소환서">
                  <img class="res-ico" src="/art/ui/res/scroll.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">${fmtRes(scrollCount(save, "mystic"))}<small>?</small></strong>
                </div>
                <div class="res-item res-item--glory" title="영광">
                  <img class="res-ico" src="/art/ui/res/glory.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">${fmtRes(save.gloryPoints ?? 0)}</strong>
                </div>
                <div class="res-item res-item--jinmun" title="진문석">
                  <img class="res-ico" src="/art/ui/res/jinmun.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">${fmtRes(save.jinmunStones ?? 0)}</strong>
                </div>
                <div class="res-item res-item--guild" title="기여">
                  <img class="res-ico" src="/art/ui/res/guild.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">${fmtRes(save.guildContribution ?? 0)}</strong>
                </div>
                <div class="res-item res-item--arena" title="시즌승">
                  <img class="res-ico" src="/art/ui/res/arena.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">${fmtRes(save.arenaSeasonWins ?? 0)}</strong>
                </div>
              </div>
          </div>
        </div>
      </div>
      ${renderTicker()}
      ${toast ? `<p class="toast">${toast}</p>` : ""}
    </header>
    <main>${mainContent(manaPct)}</main>
    ${
      settingsOpen
        ? `<div class="settings-layer" id="settings-layer">
      <button type="button" class="settings-backdrop" id="btn-settings-close" aria-label="설정 닫기"></button>
      <div class="settings-sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div class="settings-sheet-handle" aria-hidden="true"></div>
        <h2 class="settings-title" id="settings-title">설정</h2>
        <p class="settings-account">${accountLabel}</p>
        <button type="button" class="settings-logout" id="btn-logout">로그아웃</button>
      </div>
    </div>`
        : ""
    }
    ${
      isHome
        ? `<div class="settings-layer" id="summoner-picker-layer" ${summonerPickerOpen ? "" : "hidden"} aria-hidden="${summonerPickerOpen ? "false" : "true"}">
      <button type="button" class="settings-backdrop" id="btn-summoner-picker-close" aria-label="서머너 선택 닫기"></button>
      <div class="settings-sheet summoner-picker-sheet" role="dialog" aria-modal="true" aria-labelledby="summoner-picker-title">
        <div class="settings-sheet-handle" aria-hidden="true"></div>
        <h2 class="settings-title" id="summoner-picker-title">서머너 변경</h2>
        <p class="settings-account">속성별 서머너를 선택해 육성하세요</p>
        <div class="summoner-picker-list">${summonerPickerList}</div>
      </div>
    </div>`
        : ""
    }
            <aside class="side-quick" aria-label="빠른 메뉴">
      <button type="button" class="side-quick-btn${mailboxOpen ? " is-open" : ""}" id="btn-mailbox" aria-expanded="${mailboxOpen ? "true" : "false"}" aria-controls="mailbox-layer" title="우편함">
        <span class="side-quick-glow" aria-hidden="true"></span>
        <svg class="side-quick-svg" viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="sqMailBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f3e6b8"/>
      <stop offset="55%" stop-color="#d4b45a"/>
      <stop offset="100%" stop-color="#8a6a22"/>
    </linearGradient>
    <linearGradient id="sqMailFlap" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff4c8"/>
      <stop offset="100%" stop-color="#c9a227"/>
    </linearGradient>
  </defs>
  <path fill="url(#sqMailBody)" stroke="#5a4214" stroke-width="1.2" d="M8 14.5h32a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-17a3 3 0 0 1 3-3z"/>
  <path fill="url(#sqMailFlap)" stroke="#5a4214" stroke-width="1.1" d="M5.5 16.2 24 28.5 42.5 16.2V15a2 2 0 0 0-1.2-1.8L24 22.2 6.7 13.2A2 2 0 0 0 5.5 15v1.2z"/>
  <path fill="none" stroke="#fff6c8aa" stroke-width="1" d="M9 18.5h30"/>
</svg>
        <span class="side-quick-badge" aria-label="읽지 않은 우편 2">2</span>
        <span class="side-quick-caption">우편</span>
      </button>
      <button type="button" class="side-quick-btn${notifOpen ? " is-open" : ""}" id="btn-notif" aria-expanded="${notifOpen ? "true" : "false"}" aria-controls="notif-layer" title="알림">
        <span class="side-quick-glow" aria-hidden="true"></span>
        <svg class="side-quick-svg" viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="sqBell" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff1c0"/>
      <stop offset="45%" stop-color="#e0c56a"/>
      <stop offset="100%" stop-color="#9a7420"/>
    </linearGradient>
  </defs>
  <path fill="url(#sqBell)" stroke="#5a4214" stroke-width="1.2" d="M24 6.5c-1.4 0-2.5 1.1-2.5 2.5v1.1c-5.2 1.1-9 5.8-9 11.3v6.2l-3.2 4.8c-.5.8 0 1.9.9 1.9h27.6c.9 0 1.4-1.1.9-1.9l-3.2-4.8V21.4c0-5.5-3.8-10.2-9-11.3V9c0-1.4-1.1-2.5-2.5-2.5z"/>
  <path fill="url(#sqBell)" stroke="#5a4214" stroke-width="1.1" d="M20.2 36.2a3.8 3.8 0 0 0 7.6 0"/>
  <circle cx="24" cy="10.2" r="1.4" fill="#fff6c8"/>
</svg>
        <span class="side-quick-dot" aria-hidden="true"></span>
        <span class="side-quick-caption">알림</span>
      </button>
    </aside>
    ${
      mailboxOpen
        ? `<div class="settings-layer" id="mailbox-layer">
      <button type="button" class="settings-backdrop" id="btn-mailbox-close" aria-label="우편함 닫기"></button>
      <div class="settings-sheet quick-sheet" role="dialog" aria-modal="true" aria-labelledby="mailbox-title">
        <div class="settings-sheet-handle" aria-hidden="true"></div>
        <h2 class="settings-title" id="mailbox-title">우편함</h2>
        <p class="settings-account">도착한 우편을 확인하세요</p>
        <div class="quick-sheet-list">${mailItems
        .map(
          (m) => `<article class="quick-sheet-item">
          <span class="quick-sheet-tag">${m.tag}</span>
          <strong class="quick-sheet-title">${m.title}</strong>
          <p class="quick-sheet-body">${m.body}</p>
        </article>`,
        )
        .join("")}</div>
      </div>
    </div>`
        : ""
    }
    ${
      notifOpen
        ? `<div class="settings-layer" id="notif-layer">
      <button type="button" class="settings-backdrop" id="btn-notif-close" aria-label="알림 닫기"></button>
      <div class="settings-sheet quick-sheet" role="dialog" aria-modal="true" aria-labelledby="notif-title">
        <div class="settings-sheet-handle" aria-hidden="true"></div>
        <h2 class="settings-title" id="notif-title">알림</h2>
        <p class="settings-account">최근 공지와 안내</p>
        <div class="quick-sheet-list">${notifItems
        .map((n) => `<article class="quick-sheet-item"><p class="quick-sheet-body">${escapeHtml(n)}</p></article>`)
        .join("")}</div>
      </div>
    </div>`
        : ""
    }
    <nav class="tabs tabs--overlay" aria-label="메인 메뉴">
      <button type="button" data-nav="stages" class="${tabBattle ? "active" : ""}"><span class="tab-ico tab-ico--battle" aria-hidden="true"></span><span class="tab-label">전투</span></button>
      <button type="button" data-nav="enhance" class="${tabMonster ? "active" : ""}"><span class="tab-ico tab-ico--monster" aria-hidden="true"></span><span class="tab-label">몬스터</span></button>
      <button type="button" data-nav="dojo" class="${tabMission ? "active" : ""}"><span class="tab-ico tab-ico--mission" aria-hidden="true"></span><span class="tab-label">미션</span></button>
      <button type="button" data-nav="guild" class="${tabCommunity ? "active" : ""}"><span class="tab-ico tab-ico--community" aria-hidden="true"></span><span class="tab-label">커뮤니티</span></button>
      <button type="button" data-nav="shop" class="${tabShop ? "active" : ""}"><span class="tab-ico tab-ico--shop" aria-hidden="true"></span><span class="tab-label">상점</span></button>
      <button type="button" id="btn-settings" class="${settingsOpen ? "active" : ""}" aria-expanded="${settingsOpen ? "true" : "false"}" aria-controls="settings-layer" title="설정"><span class="tab-ico tab-ico--settings" aria-hidden="true"></span><span class="tab-label">설정</span></button>
    </nav>
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

  const lockSvg = `<span class="island-spot-lock" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-6-2a2 2 0 1 1 4 0v2h-4V7zm6 12H7v-8h10v8z"/></svg></span>`;

  const spot = (
    id: string,
    title: string,
    x: number,
    y: number,
    opts?: {
      locked?: boolean;
      unlockLv?: number;
      bubble?: string;
      bubbleKind?: "mana" | "crystal";
      tone?: "summon" | "forge" | "shop" | "gate" | "pond" | "mine" | "wish" | "glory" | "dojo" | "guild" | "fusion" | "party";
      sub?: string;
    },
  ) => {
    const locked = !!opts?.locked;
    const toneKey = opts?.tone ?? "summon";
    const tone = opts?.tone ? ` island-spot--${opts.tone}` : "";
    const emblemSrc = `/art/hub/emblem-${toneKey}.svg`;
    const bubble =
      !locked && opts?.bubble && opts.bubbleKind
        ? `<span class="res-bubble res-bubble--${opts.bubbleKind}" data-collect="${opts.bubbleKind}" role="button" tabindex="0" aria-label="${opts.bubble} 수집">${opts.bubble}</span>`
        : "";
    const unlock =
      locked && opts?.unlockLv
        ? `<span class="island-spot-lv">Lv.${opts.unlockLv}</span>`
        : opts?.sub
          ? `<span class="island-spot-sub">${opts.sub}</span>`
          : "";
    const label = locked && opts?.unlockLv ? `${title} · Lv.${opts.unlockLv} 해금` : title;
    return `<button type="button" class="island-spot${tone}${locked ? " is-locked" : ""}" style="left:${x}%;top:${y}%" data-b="${id}" data-locked="${locked ? "1" : "0"}" ${opts?.unlockLv ? `data-unlock="${opts.unlockLv}"` : ""} aria-label="${label}">
      <span class="island-spot-art" aria-hidden="true">
        <span class="island-spot-glow"></span>
        <img class="island-spot-img" src="${emblemSrc}" width="72" height="72" alt="" draggable="false" decoding="async" />
      </span>
      ${locked ? lockSvg : ""}
      <span class="island-spot-name">${title}</span>
      ${unlock}
      ${bubble}
    </button>`;
  };

  const activeEl = save.activeSummoner ?? "light";
  const activeSum = getActiveSummoner(save);
  return `<div class="home-island">
    <div class="home-hud">
      <div class="home-summoner-portrait home-summoner-portrait--${activeEl}" aria-label="${SUMMONER_ELEMENT_LABEL[activeEl]} 서머너 Lv.${activeSum.level}">
        <img src="/art/summoner/${activeEl}.svg" width="64" height="64" alt="" draggable="false" />
        <span class="home-summoner-tag">${SUMMONER_ELEMENT_LABEL[activeEl]}${activeSum.awaken > 0 ? ` ·${activeSum.awaken}` : ""}</span>
        <div class="home-summoner-foot">
          <span class="home-summoner-lv">Lv.${activeSum.level}</span>
          <div class="home-summoner-exp" role="progressbar" aria-valuenow="${exp}" aria-valuemin="0" aria-valuemax="100" aria-label="경험치 ${exp}/100">
            <div class="home-summoner-exp-fill" style="width:${Math.min(100, exp)}%"></div>
          </div>
        </div>
      </div>
      <button type="button" class="home-summoner-change" id="btn-summoner-picker" aria-expanded="${summonerPickerOpen ? "true" : "false"}" aria-controls="summoner-picker-layer">
        변경
      </button>
    </div>
    <div class="island-viewport" id="island-viewport">
      <div class="island-world" id="island-world" style="transform:translate(${islandPan.x}px,${islandPan.y}px)">
        <img
          class="island-map-img"
          src="/art/home/home-island-bg.webp"
          srcset="/art/home/home-island-bg-720.webp 720w, /art/home/home-island-bg.webp 1080w, /art/home/home-island-bg@2x.webp 1440w"
          sizes="(max-width: 430px) 160vw, 720px"
          width="1080"
          height="1920"
          alt=""
          draggable="false"
          decoding="async"
        />
        <div class="island-map-veil" aria-hidden="true"></div>
        ${spot("summon_hearth", "소환진", 28, 38, { tone: "summon", sub: `소환서 ${save.scrolls}장` })}
        ${spot("power_circle", "강화진", 52, 30, { tone: "forge", sub: "레벨 · 각성 · 장비" })}
        ${spot("gateway", "출정문", 74, 40, { tone: "gate", sub: "시나리오 · 아레나" })}
        ${spot("mana_pond", "진액 연못", 36, 58, {
          tone: "pond",
          sub: `Lv.${pondLv} · 대기 ${storedMana}/${pondCap}`,
          bubble: storedMana > 0 ? String(storedMana) : undefined,
          bubbleKind: storedMana > 0 ? "mana" : undefined,
        })}
        ${spot("shop", "마법상점", 58, 55, { tone: "shop", sub: "소환서 · 연마 · 각인" })}
        ${spot("party", "파티", 78, 62, { tone: "party", sub: `${save.party.length}/4` })}
        ${spot("wish", "소원의 사당", 22, 72, {
          tone: "wish",
          locked: !hasWish,
          unlockLv: 7,
          sub: hasWish ? "일 1회 소원" : undefined,
        })}
        ${spot("dojo", "마법진 도장", 44, 76, {
          tone: "dojo",
          locked: !dojoOk,
          unlockLv: 8,
          sub: dojoOk ? `수련 ${save.dojoDrills ?? 0}회` : undefined,
        })}
        ${spot("crystal_mine", "수정 광맥", 66, 74, {
          tone: "mine",
          locked: !mineOk,
          unlockLv: 10,
          sub: mineOk ? `대기 ${storedCrystal}` : undefined,
          bubble: mineOk && storedCrystal > 0 ? String(storedCrystal) : undefined,
          bubbleKind: mineOk && storedCrystal > 0 ? "crystal" : undefined,
        })}
        ${spot("glory", "영광 건물", 84, 78, { tone: "glory", sub: `영광 ${save.gloryPoints ?? 0}` })}
        ${spot("guild", save.guildName ? save.guildName : "길드 홀", 30, 88, {
          tone: "guild",
          locked: !guildOk,
          unlockLv: 12,
          sub: guildOk ? "가입·출석" : undefined,
        })}
        ${spot("fusion", "융합의 별", 56, 90, {
          tone: "fusion",
          locked: !fusionOk,
          unlockLv: 17,
          sub: fusionOk ? "동일종 융합" : undefined,
        })}
      </div>
    </div>
  </div>`;
}


function navBackBtn(opts?: {
  nav?: string;
  id?: string;
  label?: string;
}): string {
  const label = opts?.label ?? "데모";
  const idAttr = opts?.id ? ` id="${opts.id}"` : "";
  const navAttr = opts?.id ? "" : ` data-nav="${opts?.nav ?? "home"}"`;
  return `<button type="button" class="nav-back"${idAttr}${navAttr} aria-label="${label}">
    <img class="nav-back-ico" src="/art/ui/back-arrow.svg" width="20" height="20" alt="" draggable="false" />
  </button>`;
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
      ${navBackBtn({ nav: "home", label: "돌아가기" })}
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
  const mark = forgeReveal.kind === "grind" ? "?" : "?";
  return `<div class="forge-reveal forge-reveal--${forgeReveal.kind}" aria-live="polite">
    <p class="forge-reveal-kicker"><span class="forge-reveal-mark" aria-hidden="true">${mark}</span>${title}</p>
    <div class="forge-reveal-diff">
      <p class="forge-before">${forgeReveal.before}</p>
      <p class="forge-arrow" aria-hidden="true">?</p>
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
      <p class="forge-arrow" aria-hidden="true">?</p>
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
            <span class="dojo-stat-label">누적</span>
            <strong>${nextNote}</strong>
          </div>
        </div>
        <p class="muted dojo-hint">1회 수련 · 마나 +${manaGain} · EXP +15</p>
        <button type="button" class="primary full" id="btn-dojo-drill">수련하기</button>
      </div>
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
        "수정 광맥",
    `Lv.${lv} · ${rate}/hr · 저장 ${stored}/${cap}`,
    `<div class="hub-panel">
      <div class="pond-panel">
        <p class="pond-panel-title">진액 연못</p>
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
          <span class="stage-card-mark" aria-hidden="true">?</span>
          <span class="stage-card-body">
            <strong>수집하기</strong>
            <small>${stored > 0 ? `대기 ${stored}` : "대기 없음"}</small>
          </span>
        </button>
        <button type="button" class="stage-card" id="btn-pond-upgrade" ${maxed ? "disabled" : ""}>
          <span class="stage-card-mark" aria-hidden="true">?</span>
          <span class="stage-card-body">
            <strong>${maxed ? "최대 레벨" : `레벨업 → Lv.${lv + 1}`}</strong>
            <small>${maxed ? `MAX ${MAX_BUILDING_LEVEL}` : `−마나 ${cost}`}</small>
          </span>
        </button>
      </div>
    </div>`,
  );
}

function renderMine(): string {
  const mine = save.island.buildings.find((b) => b.id === "crystal_mine");
  const def = PHASE1_BUILDINGS.find((b) => b.id === "crystal_mine")!;
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
        <p class="pond-panel-title">수정 광맥</p>
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
          <span class="stage-card-mark" aria-hidden="true">?</span>
          <span class="stage-card-body">
            <strong>수집하기</strong>
            <small>${stored > 0 ? `대기 ${stored}` : "대기 없음"}</small>
          </span>
        </button>
        <button type="button" class="stage-card" id="btn-mine-upgrade" ${maxed ? "disabled" : ""}>
          <span class="stage-card-mark" aria-hidden="true">?</span>
          <span class="stage-card-body">
            <strong>${maxed ? "최대 레벨" : `레벨업 → Lv.${lv + 1}`}</strong>
            <small>${maxed ? `MAX ${MAX_BUILDING_LEVEL}` : `−마나 ${cost}`}</small>
          </span>
        </button>
      </div>
    </div>`,
  );
}

function renderWish(): string {
  const day = todayKey();
  const last = save.island.lastWishDay ?? null;
  const used = last === day;
  const reveal = wishReveal
    ? `<div class="forge-reveal forge-reveal--wish" aria-live="polite">
    <p class="forge-reveal-kicker"><span class="forge-reveal-mark" aria-hidden="true">融</span>융합 완료</p>
        <p class="forge-after">${wishReveal}</p>
        <button type="button" class="secondary full auth-btn-ghost" id="btn-wish-dismiss" style="margin-top:12px">확인</button>
      </div>`
    : "";
  return hubShell(
    "마법진 도장",
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
        return `<div class="party-slot empty"><span class="party-slot-num">${i + 1}</span><span class="party-slot-name">? ?</span></div>`;
      }
      return `<div class="party-slot el-${def?.element ?? "dark"}">
        <span class="party-slot-num">${i + 1}</span>
        <span class="party-slot-name">${describeOwned(m)}</span>
      </div>`;
    })
    .join("");
  return hubShell(
    "??",
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
              ? `HP ${preview.final.hp} ? ATK ${preview.final.atk} ? DEF ${preview.final.def}`
              : def?.element ?? "";
            return `<button type="button" class="stage-card party-card el-${def?.element ?? "dark"}${on ? " ? ?? ?" : ""}" data-party-toggle="${m.uid}">
              <span class="stage-card-mark" aria-hidden="true">${on ? "?" : (def?.element?.[0]?.toUpperCase() ?? "?")}</span>
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
    </div>`,
  );
}

function monsterElementLabel(el: string | undefined): string {
  if (!el) return "?";
  return SUMMONER_ELEMENT_LABEL[el as SummonerElement] ?? el;
}

function scrollArtSrc(kind: ScrollKind): string {
  return `/art/ui/res/scroll-${kind}.webp`;
}

function renderSummonRevealCell(uid: string): string {
  const mon = save.roster.find((m) => m.uid === uid);
  if (!mon) return "";
  const def = getMonster(mon.monsterId);
  const el = def?.element ?? "dark";
  const stars = "?".repeat(def?.naturalStars ?? 0);
  return `<div class="summon-multi-cell el-${el}">
    <span class="summon-multi-seal" aria-hidden="true">${monsterElementLabel(el).slice(0, 1)}</span>
    <strong>${def?.nameKo ?? mon.monsterId}</strong>
    <small>${monsterElementLabel(el)} ? ${stars}</small>
  </div>`;
}

function renderSummon(): string {
  const revealedList = lastSummonUids
    .map((uid) => save.roster.find((m) => m.uid === uid))
    .filter((m): m is NonNullable<typeof m> => !!m);
  const isMulti = revealedList.length > 1;
  const revealed = revealedList.length === 1 ? revealedList[0]! : null;
  const revDef = revealed ? getMonster(revealed.monsterId) : null;
  const inParty = revealed ? save.party.includes(revealed.uid) : false;
  const partyFull = save.party.length >= 4;
  const anyReady = SCROLL_KINDS.some(
    (k) => scrollCount(save, k) >= SUMMON_SCROLL_COST,
  );
  const revEl = revDef?.element ?? (isMulti ? "light" : "dark");
  const revStars = "?".repeat(revDef?.naturalStars ?? 0);
  const revPreview = revealed
    ? previewOwnedCombatStats(save, revealed.uid)
    : null;
  const hasReveal = revealedList.length > 0;
  const riteCore = isMulti
    ? `<div class="summon-reveal summon-reveal--multi" aria-live="polite">
            <p class="equip-picker-title">장착 대상 선택</p>
        <div class="summon-multi-grid">
          ${lastSummonUids.map((uid) => renderSummonRevealCell(uid)).join("")}
        </div>
        <div class="summon-reveal-cta">
          <button type="button" class="secondary" data-nav="enhance">강화진으로</button>
                <button type="button" class="secondary" data-gear-equip="${i}">장착</button>
        </div>
      </div>`
    : revealed
      ? `<div class="summon-reveal el-${revEl}" aria-live="polite">
        <div class="summon-reveal-seal" aria-hidden="true">
          <span class="summon-reveal-el">${monsterElementLabel(revEl).slice(0, 1)}</span>
        </div>
        <p class="summon-reveal-kicker">소환 성공</p>
        <p class="summon-reveal-stars" aria-label="${revDef?.naturalStars ?? 0}?">${revStars}</p>
        <p class="summon-reveal-name">${revDef?.nameKo ?? revealed.monsterId}</p>
        <p class="summon-reveal-meta">${monsterElementLabel(revEl)} ? ?${revDef?.naturalStars ?? 0}</p>
        ${
          revPreview
            ? `<div class="summon-reveal-stats">
                <span><small>HP</small><strong>${revPreview.final.hp}</strong></span>
                <span><small>ATK</small><strong>${revPreview.final.atk}</strong></span>
                <span><small>DEF</small><strong>${revPreview.final.def}</strong></span>
              </div>`
            : ""
        }
        <div class="summon-reveal-cta">
          ${
            inParty
              ? ""
              : `<button type="button" class="auth-btn-primary" id="btn-summon-party">${
                  partyFull ? "파티에 넣기 (4번째 교체)" : "파티에 넣기"
                }</button>`
          }
          <button type="button" class="secondary" data-nav="enhance">강화진으로</button>
        </div>
      </div>`
      : `<div class="summon-idle">
        <p class="summon-idle-kicker">?? ??</p>
        <p class="summon-idle-title">소환진이 고요합니다</p>
        <p class="summon-idle-copy">소환서를 사용해 동료를 불러내세요</p>
      </div>`;
  const shortLabel: Record<ScrollKind, string> = {
    normal: "??",
    premium: "??",
    mystic: "??",
  };
  const castRow = hasReveal
    ? ""
    : `<div class="summon-cast-row" role="group" aria-label="?? ??">
        ${SCROLL_KINDS.map((kind) => {
          const n = scrollCount(save, kind);
          const ready1 = n >= SUMMON_SCROLL_COST;
          const ready10 = n >= SUMMON_MULTI_COUNT * SUMMON_SCROLL_COST;
          return `<div class="summon-cast summon-cast--${kind}${ready1 ? " is-ready" : ""}">
            <span class="summon-cast-art-wrap" aria-hidden="true">
              <span class="summon-cast-art-glow"></span>
              <img class="summon-cast-art" src="${scrollArtSrc(kind)}" width="80" height="80" alt="" draggable="false" />
            </span>
            <span class="summon-cast-body">
              <strong class="summon-cast-title">${shortLabel[kind]}</strong>
              <small class="summon-cast-blurb">${SCROLL_KIND_BLURB[kind]}</small>
              <span class="summon-cast-stock"><b>${n}</b>?</span>
            </span>
            <span class="summon-cast-actions">
              <button type="button" class="summon-cast-cta" data-summon-kind="${kind}" data-summon-count="1" ${ready1 ? "" : "disabled"} aria-label="${SCROLL_KIND_LABEL[kind]} 1? ??">
                ${ready1 ? "데모" : "??"}
              </button>
              <button type="button" class="summon-cast-cta summon-cast-cta--multi" data-summon-kind="${kind}" data-summon-count="${SUMMON_MULTI_COUNT}" ${ready10 ? "" : "disabled"} aria-label="${SCROLL_KIND_LABEL[kind]} ${SUMMON_MULTI_COUNT}? ??">
                ${ready10 ? `${SUMMON_MULTI_COUNT}?` : "??"}
              </button>
            </span>
          </div>`;
        }).join("")}
      </div>`;
  return `<div class="summon-screen">
    ${hubShell(
      "소환진",
      "",
      `<div class="hub-panel summon-panel hub-panel--visual">
        <div class="summon-rite${hasReveal ? " is-revealed" : ""}${anyReady && !hasReveal ? " is-ready" : ""} el-${hasReveal ? revEl : "idle"}">
          <div class="summon-rite-glow" aria-hidden="true"></div>
          <img class="summon-rite-circle" src="/art/hub/summon-circle.svg" width="320" height="320" alt="" draggable="false" />
          <div class="summon-rite-core">${riteCore}</div>
        </div>
        ${castRow}
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
                  `<span class="set-chip${s.active ? " active" : ""}">${s.nameKo} ${s.count}/${s.pieces}${s.active ? ` ? ${s.effectKo}` : ""}</span>`,
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


function drawSkillTreeLines(): void {
  const viz = app.querySelector<HTMLElement>("#skill-tree-viz");
  const svg = app.querySelector<SVGSVGElement>("#skill-tree-lines");
  if (!viz || !svg) return;
  const vr = viz.getBoundingClientRect();
  if (vr.width < 8 || vr.height < 8) return;
  svg.setAttribute("viewBox", `0 0 ${vr.width} ${vr.height}`);
  svg.setAttribute("width", String(vr.width));
  svg.setAttribute("height", String(vr.height));
  svg.querySelectorAll<SVGPathElement>("path.skill-tree-edge").forEach((path) => {
    const fromId = path.dataset.from;
    const toId = path.dataset.to;
    if (!fromId || !toId) return;
    const a = viz.querySelector<HTMLElement>(`[data-tree-id="${fromId}"] .skill-tree-node-seal`);
    const b = viz.querySelector<HTMLElement>(`[data-tree-id="${toId}"] .skill-tree-node-seal`);
    if (!a || !b) return;
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const x1 = ar.left + ar.width / 2 - vr.left;
    const y1 = ar.top + ar.height / 2 - vr.top;
    const x2 = br.left + br.width / 2 - vr.left;
    const y2 = br.top + br.height / 2 - vr.top;
    const midY = (y1 + y2) / 2;
    path.setAttribute(
      "d",
      `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${x1.toFixed(1)} ${midY.toFixed(1)}, ${x2.toFixed(1)} ${midY.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`,
    );
  });
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
        `<span class="set-chip${s.active2 || s.active4 || s.active6 ? " active" : ""}">${s.nameKo} ${s.count}${s.active6 ? " ?6" : s.active4 ? " ?4" : s.active2 ? " ?2" : ""}</span>`,
    )
    .join("");

  const branchIcon: Record<(typeof branchMeta)[number]["id"], string> = {
    mana: "/art/ui/res/gold.svg",
    sense: "/art/ui/res/energy.svg",
    power: "/art/hub/emblem-forge.svg",
    leader: "/art/ui/res/glory.svg",
    mastery: "/art/hub/emblem-party.svg",
  };

  const TREE_POS: Record<string, { col: number; row: number }> = {
    root_mana: { col: 1, row: 1 },
    root_sense: { col: 3, row: 1 },
    root_power: { col: 5, row: 1 },
    mana_pool: { col: 1, row: 2 },
    sense_start: { col: 3, row: 2 },
    power_focus: { col: 5, row: 2 },
    abyss_well: { col: 1, row: 3 },
    sense_tide: { col: 3, row: 3 },
    declare_mastery: { col: 5, row: 3 },
    leader_aura: { col: 2, row: 3 },
    dual_mastery: { col: 3, row: 4 },
    clean_mastery: { col: 5, row: 4 },
    war_chorus: { col: 2, row: 4 },
    dual_surge: { col: 3, row: 5 },
    clean_surge: { col: 5, row: 5 },
  };

  const renderTreeNodeBtn = (n: (typeof SKILL_TREE_NODES)[number]): string => {
    const done = treeUnlocked.has(n.id);
    const missReq = n.requires.some((r) => !treeUnlocked.has(r));
    const lvLock = save.island.summonerLevel < n.minLevel;
    const ready = !done && !missReq && !lvLock;
    const cost =
      n.crystalCost > 0
              ? `−마나 ${n.manaCost} · −크 ${n.crystalCost}`
              : `−마나 ${n.manaCost}`;
    const hint = done
      ? "데모"
      : lvLock
        ? `Lv.${n.minLevel}+`
        : missReq
          ? "데모"
          : cost;
    const state = done
      ? "is-unlocked"
      : ready
        ? "is-ready"
        : "is-locked";
    const pos = TREE_POS[n.id] ?? { col: 1, row: 1 };
    return `<button type="button" class="skill-tree-node ${state}${fxNode === n.id ? " is-pulse" : ""}" data-skill-node="${n.id}" data-tree-id="${n.id}" style="grid-column:${pos.col};grid-row:${pos.row}" ${done ? "disabled" : ""} title="${n.descKo}">
      <span class="skill-tree-node-seal" aria-hidden="true">
        <img src="${branchIcon[n.branch]}" width="26" height="26" alt="" draggable="false" />
      </span>
      <strong class="skill-tree-node-name">${n.nameKo}</strong>
      <small class="skill-tree-node-hint">${hint}</small>
    </button>`;
  };

  const treeEdges = SKILL_TREE_NODES.flatMap((n) =>
    n.requires.map((parent) => {
      const live = treeUnlocked.has(parent);
      return `<path class="skill-tree-edge${live ? " is-live" : ""}" data-from="${parent}" data-to="${n.id}" fill="none" />`;
    }),
  ).join("");

  const treeBoard = `<div class="skill-tree-viz" id="skill-tree-viz">
    <div class="skill-tree-cols" aria-hidden="true">
      <span>??</span><span></span><span>??</span><span></span><span>??</span>
    </div>
    <svg class="skill-tree-lines" id="skill-tree-lines" aria-hidden="true">${treeEdges}</svg>
    <div class="skill-tree-grid">
      ${SKILL_TREE_NODES.map(renderTreeNodeBtn).join("")}
    </div>
  </div>`;

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
      ? "일반 진문"
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
              : `${name}+ (?${skCost})`;
          return `<button type="button" class="secondary sk-up" data-skup="${m.uid}" data-skslot="${si}" ${maxSk ? "disabled" : ""}>${hint}</button>`;
        })
        .join("");
      const inParty = save.party.includes(m.uid);
      const preview = previewOwnedCombatStats(save, m.uid);
      return `<div class="enhance-mon el-${def?.element ?? "dark"}">
            <div class="enhance-mon-head">
              <button type="button" class="stage-card enhance-main" data-enh="${m.uid}" ${maxed ? "disabled" : ""}>
                <span class="stage-card-mark" aria-hidden="true">${def?.element?.[0]?.toUpperCase() ?? "?"}</span>
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
                <span class="gear-tile-mark" aria-hidden="true">${p.slot[0]?.toUpperCase() ?? "?"}</span>
                <strong>${describeGear(p)}</strong>
                <small>+${p.enhance}${setName ? ` ? ${setName}` : ""}</small>
              </button>
              <div class="gear-tile-actions">
                <button type="button" class="secondary" data-gear-equip="${i}">장착</button>
                <button type="button" class="secondary" data-gear-sell="${i}">+${gearSellMana(p)}${gearSellCrystal(p) > 0 ? ` ? +?${gearSellCrystal(p)}` : ""}</button>
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
                    <span class="stage-card-mark" aria-hidden="true">${inParty ? "?" : "?"}</span>
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
                <strong>${worn ? "E ? " : ""}${describeSymbol(s)}</strong>
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
        <p class="section-label">장비 드롭</p>
        <div class="stage-list">
          <button type="button" class="stage-card" id="btn-awaken" data-awaken ${awakenMax ? "disabled" : ""}>
            <span class="stage-card-mark" aria-hidden="true">?</span>
            <span class="stage-card-body">
              <strong>각성 ${awaken}/${MAX_SUMMONER_AWAKEN}</strong>
              <small>리더 공+${leaderPct}% · 마나·스킬 영구 보너스 · ${awakenHint}</small>
            </span>
          </button>
        </div>
        <p class="section-label">스킬 트리 (${treeUnlocked.size}/${SKILL_TREE_NODES.length})</p>
        ${treeBoard}
      </section>
      <section class="enhance-section${tab === "monsters" ? " is-active" : ""}" data-enhance-panel="monsters" ${tab === "monsters" ? "" : "hidden"}>
      <p class="section-label">로스터</p>
        <div class="stage-list">${monstersPanel}</div>
      </section>
      <section class="enhance-section${tab === "gear" ? " is-active" : ""}" data-enhance-panel="gear" ${tab === "gear" ? "" : "hidden"}>
        <p class="section-label">장비 드롭</p>
        <div class="gear-doll" aria-label="장비 슬롯">
          ${gearSlotBtn("weapon", weapon, "劍", "무기", `스킬+${(weapon.skillPowerBonus * 100).toFixed(0)}%`)}
          <div class="gear-doll-core" aria-hidden="true"><span>?</span></div>
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
      <p class="section-label">로스터</p>
        ${symbolsPanel}
      </section>
    </div>
  </div>`;
  queueMicrotask(() => {
    enhanceFx = null;
    requestAnimationFrame(() => drawSkillTreeLines());
  });
  return hubShell("강화진", "각성 · 스킬트리 · 장비 · 상징", body);
}

function renderShop(): string {
  const grindRows =
    save.symbols
      .map((s, i) => {
        if (!canGrindSymbol(s)) return "";
        return `<button type="button" class="stage-card" data-grind="${i}">
          <span class="stage-card-mark" aria-hidden="true">?</span>
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
          <span class="stage-card-mark" aria-hidden="true">?</span>
          <span class="stage-card-body">
            <strong>${describeSymbol(s)}</strong>
            <small>주옵션 재부여 · −크리스탈 ${SYMBOL_IMPRINT_CRYSTAL_COST}</small>
          </span>
        </button>`;
      })
      .join("") ||
    `<p class="muted">각인 가능한 상징이 없습니다 (슬롯 4–6 드롭 필요)</p>`;
  return hubShell(
    "??",
    `소환서 ${save.scrolls} · 마나 ${Math.floor(save.island.mana)} · 크리스탈 ${save.island.crystal}`,
    `<div class="hub-panel">
    ${renderForgeReveal()}
      <p class="section-label">로스터</p>
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
        <span class="stage-card-mark" aria-hidden="true">?</span>
        <span class="stage-card-body">
          <strong>에너지 +${ENERGY_BUY_AMOUNT}</strong>
          <small>−크리스탈 ${ENERGY_CRYSTAL_COST}</small>
        </span>
      </button>
      <button type="button" class="stage-card shop-offer" id="btn-craft-essence">
        <span class="stage-card-mark" aria-hidden="true">?</span>
        <span class="stage-card-body">
            <strong>진액 제작</strong>
          <small>진문석 ${ESSENCE_JINMUN_COST} → 크리스탈 ${ESSENCE_CRYSTAL_GAIN} (Lv.12)</small>
        </span>
      </button>
      <button type="button" class="stage-card shop-offer" id="btn-craft-scroll">
        <span class="stage-card-mark" aria-hidden="true">?</span>
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
        "수정 광맥",
    `보유 영광 ${glory}`,
    `<div class="hub-panel">
    <div class="guild-panel glory-panel">
        <p class="guild-panel-title">기원 현황</p>
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
  </div>`,
  );
}

function renderCaptureShop(): string {
  if (!battle || battle.phase !== "await_capture_shop" || autoMode) return "";
  const offers = captureShopOffers();
  const markFor = (choice: string) =>
    choice === "mana" ? "?" : choice === "amplify" ? "?" : "?";
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
          <span class="guild-rank-name">${r.name}${r.self ? " (?)" : ""}</span>
          <strong class="guild-rank-score">${r.contribution}</strong>
        </div>`,
    )
    .join("");
  return hubShell(
        "수정 광맥",
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
               <span class="stage-card-mark" aria-hidden="true">?</span>
               <span class="stage-card-body">
            <strong>출석</strong>
                 <small>기여·보상 수령</small>
               </span>
             </button>
             <button type="button" class="stage-card" id="btn-guild-rename">
               <span class="stage-card-mark" aria-hidden="true">?</span>
               <span class="stage-card-body">
            <strong>출석</strong>
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
    <p class="section-label">에너지 · 제작</p>
    <div class="guild-board">${board}</div>
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
    "마법진 도장",
    `동일 종 2마리 → 진화 +1 · −마나 ${FUSION_MANA_COST}`,
    `<div class="hub-panel">
    ${renderFusionReveal()}
    <div class="guild-panel fusion-panel">
        <p class="guild-panel-title">기원 현황</p>
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
                <span class="stage-card-mark" aria-hidden="true">?</span>
                <span class="stage-card-body">
                  <strong>${describeOwned(ma)} + ${describeOwned(mb)}</strong>
                  <small>결과 진화 ${evo} · −마나 ${FUSION_MANA_COST}</small>
                </span>
              </button>`;
            })
            .join("")
        : `<p class="muted">동일 종 몬스터 2마리가 필요합니다</p>`}
    </div>
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
      const done = save.clearedStages.includes(s.id);
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
      return `<button type="button" class="stage-card${done ? " is-cleared" : ""}" data-stage="${s.id}" ${locked ? "disabled" : ""}>
        <span class="stage-card-mark" aria-hidden="true">${done ? "?" : s.boardSize}</span>
        <span class="stage-card-body">
          <strong>${label} ? ${s.nameKo}</strong>
          <small>${s.boardSize}×${s.boardSize} · 웨이브 ${s.waves} · ${cost}${extra}${weekly}</small>
        </span>
      </button>`;
    })
    .join("");
}

type StagesRegion = {
  id: StagesRegionId;
  name: string;
  blurb: string;
  x: number;
  y: number;
  tone: string;
  stages: StageDef[];
  equipWeekly?: boolean;
  warena?: boolean;
  guild?: boolean;
};

function isMainQuestRegion(id: StagesRegionId): boolean {
  return MAIN_QUEST_PIN_LAYOUT.some((p) => p.id === id);
}

function stagesRegions(): StagesRegion[] {
  const mqRegions: StagesRegion[] = MAIN_QUEST_PIN_LAYOUT.map((pin) => ({
    id: pin.id,
    name: `맵 ${pin.map}`,
    blurb: `맵 ${pin.map} · ${pin.areaKo}`,
    x: pin.x,
    y: pin.y,
    tone: pin.tone,
    stages: stagesForMap(pin.map),
  }));
  const sideMeta: Record<
    string,
    {
      name: string;
      blurb: string;
      stages: StageDef[];
      equipWeekly?: boolean;
      warena?: boolean;
      guild?: boolean;
    }
  > = {
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
      blurb: "대규모 대전",
      stages: WORLD_ARENA_STAGES,
      warena: true,
    },
    guild: {
      name: "길드 레이드",
      blurb: "13대13 길드 레이드",
      stages: GUILD_RAID_STAGES,
      guild: true,
    },
  };
  const sideRegions: StagesRegion[] = SIDE_CONTENT_PIN_LAYOUT.map((pin) => {
    const meta = sideMeta[pin.id]!;
    return {
      id: pin.id,
      name: meta.name,
      blurb: `${meta.blurb} · ${pin.landmarkKo}`,
      x: pin.x,
      y: pin.y,
      tone: pin.id,
      stages: meta.stages,
      equipWeekly: meta.equipWeekly,
      warena: meta.warena,
      guild: meta.guild,
    };
  });
  return [...mqRegions, ...sideRegions];
}

function regionProgress(stages: StageDef[]): {
  unlocked: boolean;
  cleared: number;
  total: number;
} {
  const cleared = stages.filter((s) => save.clearedStages.includes(s.id)).length;
  const unlocked = stages.some((s) => isStageUnlocked(save, s.id));
  return { unlocked, cleared, total: stages.length };
}

function stagesMqPathD(): string {
  return MAIN_QUEST_PIN_LAYOUT.map(
    (p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
  ).join(" ");
}

function renderStages(): string {
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
      `<span class="stages-mq-node" style="left:${p.x}%;top:${p.y}%" aria-hidden="true"><span class="stages-mq-node-core"></span></span>`,
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
        ? `${prog.cleared}/${STAGES_PER_AREA}`
        : `${prog.cleared}/${prog.total}`;
      return `<button type="button" class="stages-pin ${mq ? "stages-pin--mq" : "stages-pin--side"} stages-pin--${r.tone}${prog.unlocked ? "" : " is-locked"}${active ? " is-active" : ""}${prog.cleared === prog.total && prog.total > 0 ? " is-cleared" : ""}" style="left:${r.x}%;top:${r.y}%" data-region="${r.id}" aria-label="${r.name}${prog.unlocked ? "" : " · 미해금"}" ${prog.unlocked ? "" : 'data-locked="1"'}>
        <span class="stages-pin-dot" aria-hidden="true">${mq ? `<span class="stages-pin-mark">${mark}</span>` : ""}</span>
        <span class="stages-pin-label">
          <strong>${r.name}</strong>
          <small>${mq && pinLayout ? pinLayout.areaKo + " ? " : ""}${sub}</small>
        </span>
      </button>`;
    })
    .join("");
  return `<div class="stages-hub stages-hub--map">
    <div class="stages-viewport" id="stages-viewport">
      <div class="stages-world" id="stages-world" style="transform:translate(${stagesPan.x}px,${stagesPan.y}px)">
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
          <path class="stages-mq-path-glow" d="${mqPathD}" fill="none" />
          <path class="stages-mq-path-rail" d="${mqPathD}" fill="none" />
          <path class="stages-mq-path-core" d="${mqPathD}" fill="none" />
          <path class="stages-mq-path-sheen" d="${mqPathD}" fill="none" />
        </svg>
        <div class="stages-mq-nodes">${mqNodes}</div>
        <div class="stages-map-pins">${pins}</div>
      </div>
    </div>
    <header class="stages-map-hud">
      <button type="button" class="stages-map-back" data-nav="home" aria-label="섬으로">
        <img class="stages-map-back-ico" src="/art/ui/back-arrow.svg" width="18" height="18" alt="" draggable="false" />
        <span>섬으로</span>
      </button>
      <div class="stages-map-hud-text">
        <p class="stages-title">세계 지도</p>
        <p class="stages-meta">메인 ${mqCleared}/${mqTotal} · 전체 클리어 ${cleared} · 시즌승 ${seasonWins}</p>
      </div>
    </header>
    ${selected ? renderStagesRegionSheet(selected) : ""}
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
    battle.boards.length > 1 ? ` ? ${battle.boardLabel}` : "";
  const status = battle.finishReason
    ? battle.finishReason === "ally_win"
      ? "승리! (적 소환수 전멸)"
      : "패배... (아군 소환수 전멸)"
    : `${battle.phase} ? amp ${battle.currentAmplify().toFixed(2)}/${battle.powerAmplifyCap().toFixed(2)} ? ${phaseLabel} (${battle.circle.stoneSummonCount}/${battle.circle.resetThreshold})${mission}${boardTag}`;

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
    <div class="battle-topbar">${navBackBtn({ id: "btn-back", label: "돌아가기" })}</div>
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
      <button type="button" class="secondary" id="btn-speed">x${battleSpeed}</button>
      <button type="button" id="btn-auto-toggle" class="${autoMode ? "auto-on" : ""}">${autoMode ? "AUTO ON" : "AUTO"}</button>
    </div>
    <div class="log">${battle.log.slice(-6).map((l) => `<div>${l}</div>`).join("")}</div>
  </div>
  </div>`;
}

function bindAuth(): void {
  app.querySelector("#auth-start")?.addEventListener("click", () => {
    startGameFromAuth();
  });

  app.querySelector("#auth-logout")?.addEventListener("click", () => {
    void logout();
  });

  app.querySelector("#auth-demo")?.addEventListener("click", () => {
    void (async () => {
      const res = await apiJson<{ user: SessionUser }>("/api/auth/demo", {
        method: "POST",
        body: "{}",
      });
      if (res?.user) {
        await enterWithUser(res.user, { demo: true, enterGame: true });
        return;
      }
      await enterWithUser(
        { id: "local-demo", email: null, kind: "demo" },
        { demo: true, enterGame: true },
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
        await enterWithUser(res.user, {
          fresh: !loadLocalSave(),
          enterGame: true,
        });
        return;
      }
      await enterWithUser(
        { id: "local-guest", email: null, kind: "guest" },
        { fresh: !loadLocalSave(), enterGame: true },
      );
    })();
  });

  app.querySelector("#auth-register")?.addEventListener("click", () => {
    authUi.pane = "register";
    render();
  });
  app.querySelector("#auth-back")?.addEventListener("click", () => {
    authUi.pane = "login";
    render();
  });

  app.querySelector("#auth-form")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const saveId = fd.get("saveId") === "on";
    const autoLogin = fd.get("autoLogin") === "on";
    const path =
      authUi.pane === "register" ? "/api/auth/register" : "/api/auth/login";

    if (authUi.pane === "login") {
      writeAuthPrefs({
        saveId,
        autoLogin,
        savedEmail: saveId ? email : "",
      });
    }

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
        ? "데모 모드로 입장했습니다."
              : body.error === "invalid_credentials"
                ? "이메일 또는 비밀번호를 확인하세요."
                : "서버에 연결할 수 없습니다. API를 실행한 뒤 다시 시도하세요.",
          );
          render();
          return;
        }
        const enterGame =
          authUi.pane === "register" ? true : readAuthPrefs().autoLogin;
        await enterWithUser(body.user, { enterGame });
      } catch {
    flash("이전 스테이지를 먼저 클리어하세요.");
        render();
      }
    })();
  });
}

function applyIslandPan(): void {
  const world = app.querySelector<HTMLElement>("#island-world");
  if (world) {
    world.style.transform = `translate(${islandPan.x}px, ${islandPan.y}px)`;
  }
}

function clampIslandPan(viewport: HTMLElement, world: HTMLElement): void {
  const minX = Math.min(0, viewport.clientWidth - world.offsetWidth);
  const minY = Math.min(0, viewport.clientHeight - world.offsetHeight);
  islandPan.x = Math.min(0, Math.max(minX, islandPan.x));
  islandPan.y = Math.min(0, Math.max(minY, islandPan.y));
}

function bindIslandPan(): void {
  const viewport = app.querySelector<HTMLElement>("#island-viewport");
  const world = app.querySelector<HTMLElement>("#island-world");
  if (!viewport || !world) return;

  const finishClamp = () => {
    if (!islandPanCentered && world.offsetWidth > 0) {
      islandPan.x = (viewport.clientWidth - world.offsetWidth) / 2;
      islandPan.y = (viewport.clientHeight - world.offsetHeight) / 2;
      islandPanCentered = true;
    }
    clampIslandPan(viewport, world);
    applyIslandPan();
  };
  finishClamp();
  requestAnimationFrame(finishClamp);

  viewport.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    islandPanDrag = {
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      origX: islandPan.x,
      origY: islandPan.y,
      moved: false,
    };
    try {
      viewport.setPointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }
  });

  viewport.addEventListener("pointermove", (ev) => {
    if (!islandPanDrag || islandPanDrag.pointerId !== ev.pointerId) return;
    const dx = ev.clientX - islandPanDrag.startX;
    const dy = ev.clientY - islandPanDrag.startY;
    if (Math.hypot(dx, dy) > 8) islandPanDrag.moved = true;
    islandPan.x = islandPanDrag.origX + dx;
    islandPan.y = islandPanDrag.origY + dy;
    clampIslandPan(viewport, world);
    applyIslandPan();
  });

  const endDrag = (ev: PointerEvent) => {
    if (!islandPanDrag || islandPanDrag.pointerId !== ev.pointerId) return;
    const moved = islandPanDrag.moved;
    islandPanDrag = null;
    if (moved) {
      viewport.setAttribute("data-pan-moved", "1");
      queueMicrotask(() => viewport.removeAttribute("data-pan-moved"));
    }
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
}

function applyStagesPan(): void {
  const world = app.querySelector<HTMLElement>("#stages-world");
  if (world) {
    world.style.transform = `translate(${stagesPan.x}px, ${stagesPan.y}px)`;
  }
}

function clampStagesPan(viewport: HTMLElement, world: HTMLElement): void {
  const minX = Math.min(0, viewport.clientWidth - world.offsetWidth);
  const minY = Math.min(0, viewport.clientHeight - world.offsetHeight);
  stagesPan.x = Math.min(0, Math.max(minX, stagesPan.x));
  stagesPan.y = Math.min(0, Math.max(minY, stagesPan.y));
}

function bindStagesPan(): void {
  const viewport = app.querySelector<HTMLElement>("#stages-viewport");
  const world = app.querySelector<HTMLElement>("#stages-world");
  if (!viewport || !world) return;

  const finishClamp = () => {
    if (!stagesPanCentered && world.offsetWidth > 0) {
      stagesPan.x = (viewport.clientWidth - world.offsetWidth) * 0.35;
      stagesPan.y = (viewport.clientHeight - world.offsetHeight) * 0.58;
      stagesPanCentered = true;
    }
    clampStagesPan(viewport, world);
    applyStagesPan();
  };
  finishClamp();
  requestAnimationFrame(finishClamp);

  viewport.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    if ((ev.target as HTMLElement | null)?.closest?.(".stages-region-layer")) {
      return;
    }
    stagesPanDrag = {
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      origX: stagesPan.x,
      origY: stagesPan.y,
      moved: false,
    };
    try {
      viewport.setPointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }
  });

  viewport.addEventListener("pointermove", (ev) => {
    if (!stagesPanDrag || stagesPanDrag.pointerId !== ev.pointerId) return;
    const dx = ev.clientX - stagesPanDrag.startX;
    const dy = ev.clientY - stagesPanDrag.startY;
    if (Math.hypot(dx, dy) > 8) stagesPanDrag.moved = true;
    stagesPan.x = stagesPanDrag.origX + dx;
    stagesPan.y = stagesPanDrag.origY + dy;
    clampStagesPan(viewport, world);
    applyStagesPan();
  });

  const endDrag = (ev: PointerEvent) => {
    if (!stagesPanDrag || stagesPanDrag.pointerId !== ev.pointerId) return;
    const moved = stagesPanDrag.moved;
    stagesPanDrag = null;
    if (moved) {
      viewport.setAttribute("data-pan-moved", "1");
      queueMicrotask(() => viewport.removeAttribute("data-pan-moved"));
    }
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
}

function bind(): void {
  if (view === "auth") {
    bindAuth();
    return;
  }

  if (view === "home") {
    bindIslandPan();
    app.querySelector("#btn-summoner-picker")?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      summonerPickerOpen = !summonerPickerOpen;
      if (summonerPickerOpen && resMoreOpen) {
        resMoreOpen = false;
        applyResMoreOpen();
      }
      if (summonerPickerOpen && settingsOpen) {
        settingsOpen = false;
        const settings = app.querySelector("#settings-layer");
        settings?.remove();
        app.querySelector("#btn-settings")?.classList.remove("active");
        app.querySelector("#btn-settings")?.setAttribute("aria-expanded", "false");
      }
      if (summonerPickerOpen && (mailboxOpen || notifOpen)) {
        mailboxOpen = false;
        notifOpen = false;
        app.querySelector("#mailbox-layer")?.remove();
        app.querySelector("#notif-layer")?.remove();
      }
      applySummonerPickerOpen();
    });
    app
      .querySelector("#btn-summoner-picker-close")
      ?.addEventListener("click", () => {
        summonerPickerOpen = false;
        applySummonerPickerOpen();
      });
    app.querySelectorAll<HTMLButtonElement>("[data-summoner]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const el = btn.dataset.summoner as SummonerElement | undefined;
        if (!el || el === (save.activeSummoner ?? "light")) return;
        save = setActiveSummoner(save, el);
        summonerPickerOpen = false;
        persist();
        flash(`${SUMMONER_ELEMENT_LABEL[el]} 서머너로 전환`);
        render();
      });
    });
  }
  if (view === "stages") {
    bindStagesPan();
  }

  app.querySelector("#btn-res-more")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    resMoreOpen = !resMoreOpen;
    if (resMoreOpen && summonerPickerOpen) {
      summonerPickerOpen = false;
      applySummonerPickerOpen();
    }
    applyResMoreOpen();
  });

  app.querySelector("#btn-settings")?.addEventListener("click", () => {
    settingsOpen = !settingsOpen;
    if (settingsOpen) {
      mailboxOpen = false;
      notifOpen = false;
    }
    if (summonerPickerOpen) {
      summonerPickerOpen = false;
      applySummonerPickerOpen();
    }
    if (resMoreOpen) {
      resMoreOpen = false;
      applyResMoreOpen();
    }
    render();
  });

  app.querySelector("#btn-settings-close")?.addEventListener("click", () => {
    settingsOpen = false;
    render();
  });

  app.querySelector("#btn-logout")?.addEventListener("click", () => {
    settingsOpen = false;
    void logout();
  });

  app.querySelector("#btn-mailbox")?.addEventListener("click", () => {
    mailboxOpen = !mailboxOpen;
    if (mailboxOpen) {
      notifOpen = false;
      settingsOpen = false;
      if (summonerPickerOpen) {
        summonerPickerOpen = false;
        applySummonerPickerOpen();
      }
      if (resMoreOpen) {
        resMoreOpen = false;
        applyResMoreOpen();
      }
    }
    render();
  });
  app.querySelector("#btn-mailbox-close")?.addEventListener("click", () => {
    mailboxOpen = false;
    render();
  });

  app.querySelector("#btn-notif")?.addEventListener("click", () => {
    notifOpen = !notifOpen;
    if (notifOpen) {
      mailboxOpen = false;
      settingsOpen = false;
      if (summonerPickerOpen) {
        summonerPickerOpen = false;
        applySummonerPickerOpen();
      }
      if (resMoreOpen) {
        resMoreOpen = false;
        applyResMoreOpen();
      }
    }
    render();
  });
  app.querySelector("#btn-notif-close")?.addEventListener("click", () => {
    notifOpen = false;
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      settingsOpen = false;
      mailboxOpen = false;
      notifOpen = false;
      summonerPickerOpen = false;
      resMoreOpen = false;
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
      if (nav !== "stages") {
        stagesRegion = null;
      }
      view = nav as View;
      render();
    });
  });

  app.querySelectorAll<HTMLElement>("[data-collect]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      if (app.querySelector("#island-viewport")?.getAttribute("data-pan-moved") === "1") {
        return;
      }
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
    btn.addEventListener("click", (ev) => {
      if (app.querySelector("#island-viewport")?.getAttribute("data-pan-moved") === "1") {
        ev.preventDefault();
        return;
      }
      if (btn.dataset.locked === "1") {
        const lv = btn.dataset.unlock;
        flash(lv ? `서머너 Lv.${lv}에 해금됩니다.` : "아직 해금되지 않았습니다.");
        return;
      }
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

  app.querySelectorAll<HTMLButtonElement>("[data-summon-kind]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.summonKind as ScrollKind | undefined;
      if (!kind || !(SCROLL_KINDS as readonly string[]).includes(kind)) return;
      const count = Math.max(
        1,
        Math.floor(Number(btn.dataset.summonCount ?? "1") || 1),
      );
      const before = new Set(save.roster.map((m) => m.uid));
      const r = runSummon(save, kind, Math.random, count);
      save = r.save;
      persist();
      lastSummonUids = save.roster
        .filter((m) => !before.has(m.uid))
        .map((m) => m.uid);
      flash(r.message);
      render();
    });
  });

  app.querySelector("#btn-summon-dismiss")?.addEventListener("click", () => {
    lastSummonUids = [];
    render();
  });

  app.querySelector("#btn-summon-party")?.addEventListener("click", () => {
    const uid = lastSummonUids[0];
    if (!uid) return;
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
      if (next && before && r.message.startsWith("연마:")) {
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
    if (!battle.switchBoard("수동")) return;
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

  app.querySelectorAll<HTMLButtonElement>("[data-region]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (app.querySelector("#stages-viewport")?.getAttribute("data-pan-moved") === "1") {
        return;
      }
      const id = btn.dataset.region as StagesRegionId;
      if (btn.dataset.locked === "1") {
      flash("이미 파티에 있습니다.");
        return;
      }
      stagesRegion = stagesRegion === id ? null : id;
      render();
    });
  });

  app.querySelector("#btn-region-close")?.addEventListener("click", () => {
    stagesRegion = null;
    render();
  });

  app.querySelector("#btn-region-close-x")?.addEventListener("click", () => {
    stagesRegion = null;
    render();
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
    const prefs = readAuthPrefs();
    if (prefs.autoLogin) {
      await enterWithUser(me.user, { enterGame: true });
      return;
    }
    await hydrateSession(me.user);
    authUi.pane = "login";
    view = "auth";
    render();
    return;
  }
  view = "auth";
  authUi.pane = "login";
  render();
}

void boot();
