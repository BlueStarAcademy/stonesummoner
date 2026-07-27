import "./style.css";
import {
  formatNumber,
  getLocale,
  initI18n,
  listLocales,
  setLocale,
  t,
  type LocaleId,
} from "./i18n";
import {
  fxDurationMs,
  mountUnitAnimHooks,
  playUltCutin,
  pulseBoardCell,
  pulseUnitClass,
  waitFx,
} from "./battle/fx";
import { destroyAllSpine, mountBattleSpines, mountBookPreviewSpine, playSpineClip } from "./battle/spinePilot";
import { dematteArtInTree } from "./ui/dematteArt";
import { bindMonPreviewTurntable } from "./ui/monPreviewTurntable";
import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  CHECK,
  EM_DASH,
  MIDDOT,
  MINUS,
  Mark,
  RANGE,
  STAR,
  TIMES,
} from "./ui/marks";
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
  SYMBOL_SETS,
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
  energyRegenRemainingMs,
  ENERGY_REGEN_MS,
  MAX_BUILDING_LEVEL,
  PHASE1_BUILDINGS,
  PHASE_BUILDINGS,
  productionCrystalCap,
  productionCrystalPerHour,
  productionManaPerHour,
  productionStorageCap,
  spendEnergy,
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
  runExpandSymbolBag,
  symbolBagCapacity,
  symbolBagExpandCost,
  SYMBOL_BAG_BASE_SLOTS,
  SYMBOL_BAG_EXPAND_STEP,
  SYMBOL_BAG_MAX_SLOTS,
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
  runFeedSameMonster,
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
  symbolSellMana,
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
  return { saveId: true, autoLogin: false, savedEmail: "" };
}

function readAuthPrefs(): AuthPrefs {
  try {
    const raw = localStorage.getItem(AUTH_PREFS_KEY);
    if (!raw) return defaultAuthPrefs();
    const parsed = JSON.parse(raw) as Partial<AuthPrefs>;
    return {
      saveId: parsed.saveId !== false,
      autoLogin: parsed.autoLogin === true,
      savedEmail: typeof parsed.savedEmail === "string" ? parsed.savedEmail : "",
    };
  } catch {
    return defaultAuthPrefs();
  }
}

function writeAuthPrefs(next: AuthPrefs): void {
  localStorage.setItem(AUTH_PREFS_KEY, JSON.stringify(next));
}

function readIslandLayout(): Record<string, { x: number; y: number }> {
  const out: Record<string, { x: number; y: number }> = {
    ...ISLAND_LAYOUT_DEFAULT,
  };
  try {
    const raw = localStorage.getItem(ISLAND_LAYOUT_KEY);
    if (!raw) return out;
    const parsed = JSON.parse(raw) as Record<string, { x?: unknown; y?: unknown }>;
    for (const [id, pos] of Object.entries(parsed)) {
      if (!ISLAND_LAYOUT_DEFAULT[id]) continue;
      const x = Number(pos?.x);
      const y = Number(pos?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      out[id] = clampIslandLayoutPos(x, y);
    }
  } catch {
    /* ignore */
  }
  return out;
}

function writeIslandLayout(layout: Record<string, { x: number; y: number }>): void {
  const slim: Record<string, { x: number; y: number }> = {};
  for (const id of Object.keys(ISLAND_LAYOUT_DEFAULT)) {
    const pos = layout[id] ?? ISLAND_LAYOUT_DEFAULT[id]!;
    slim[id] = {
      x: Math.round(pos.x * 10) / 10,
      y: Math.round(pos.y * 10) / 10,
    };
  }
  localStorage.setItem(ISLAND_LAYOUT_KEY, JSON.stringify(slim));
}

function resolveIslandSpotPos(
  id: string,
  fallbackX: number,
  fallbackY: number,
): { x: number; y: number } {
  const src =
    islandLayoutEdit && islandLayoutDraft
      ? islandLayoutDraft
      : readIslandLayout();
  return src[id] ?? ISLAND_LAYOUT_DEFAULT[id] ?? { x: fallbackX, y: fallbackY };
}

function enterIslandLayoutEdit(focusId?: string): void {
  islandLayoutEdit = true;
  islandLayoutDraft = { ...readIslandLayout() };
  islandLayoutSuppressClick = true;
  islandPanDrag = null;
  islandLongPress = null;
  flash(t('ui.19364fa53d'));
  render();
  if (focusId) {
    queueMicrotask(() => {
      app
        .querySelectorAll<HTMLElement>("[data-b]")
        .forEach((el) =>
          el.classList.toggle("is-layout-focus", el.dataset.b === focusId),
        );
    });
  }
}

function exitIslandLayoutEdit(commit: boolean): void {
  if (commit && islandLayoutDraft) {
    writeIslandLayout(islandLayoutDraft);
    flash(t('ui.3ad18550e0'));
  } else if (!commit) {
    flash(t('ui.5d8b99bb60'));
  }
  islandLayoutEdit = false;
  islandLayoutDraft = null;
  islandSpotDrag = null;
  islandLongPress = null;
  render();
}

function clientToIslandPct(
  clientX: number,
  clientY: number,
  world: HTMLElement,
): { x: number; y: number } {
  const rect = world.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return { x: 50, y: 50 };
  return clampIslandLayoutPos(
    ((clientX - rect.left) / rect.width) * 100,
    ((clientY - rect.top) / rect.height) * 100,
  );
}

function applyIslandSpotPosDom(id: string, x: number, y: number): void {
  if (!islandLayoutDraft) islandLayoutDraft = { ...readIslandLayout() };
  const prev = islandLayoutDraft[id] ?? ISLAND_LAYOUT_DEFAULT[id] ?? { x: 50, y: 50 };
  const others = { ...islandLayoutDraft };
  delete others[id];
  const pos = resolveIslandSpotCollision(id, x, y, others, prev);
  islandLayoutDraft[id] = pos;
  const btn = app.querySelector<HTMLElement>(`[data-b="${id}"]`);
  if (!btn) return;
  const depth = Math.max(0, Math.min(1, pos.y / 100));
  btn.style.left = `${pos.x}%`;
  btn.style.top = `${pos.y}%`;
  btn.style.setProperty("--spot-scale", (0.68 + depth * 0.5).toFixed(3));
  btn.style.zIndex = String(Math.round(10 + pos.y));
  btn.classList.toggle("is-layout-focus", true);
  app.querySelectorAll<HTMLElement>("[data-b]").forEach((el) => {
    if (el.dataset.b !== id) el.classList.remove("is-layout-focus");
  });
}


let sessionUser: SessionUser | null = null;
/** gate = brand + CTA; login/register = form panel. */
const authUi = { pane: "gate" as "gate" | "login" | "register" };
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
/** Most recently summoned monster uids (summon reveal card / multi). */
let lastSummonUids: string[] = [];
/** Symbol index awaiting monster pick for equip. */
let equipPickSymIndex: number | null = null;
/** Empty slot awaiting symbol pick (monster uid + slot 1-6). */
let slotEquipPick: { uid: string; slot: number } | null = null;
/** Grind/imprint before/after reveal card. */
let forgeReveal: ForgeReveal | null = null;
/** Fusion success reveal card. */
let fusionReveal: FusionReveal | null = null;
/** Enhance hub section tab. */
type EnhanceTab = "monsters" | "summoner";
let enhanceTab: EnhanceTab = "monsters";
/** Bottom dock on monster book: roster slots or symbol bag. */
let monBookDock: "roster" | "symbols" = "roster";
/** Selected monster detail side-tab. */
type MonDetailTab = "info" | "skills" | "awaken" | "symbols";
let monDetailTab: MonDetailTab = "info";

/** Swap inspect panes without full app re-render (keeps roster dock intact). */
function applyMonDetailTabUi(): boolean {
  const shell = app.querySelector<HTMLElement>(".mon-inspect-shell");
  if (!shell) return false;
  shell.querySelectorAll<HTMLButtonElement>("[data-mon-detail-tab]").forEach((btn) => {
    const on = btn.dataset.monDetailTab === monDetailTab;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  shell.querySelectorAll<HTMLElement>("[data-mon-pane]").forEach((pane) => {
    pane.hidden = pane.dataset.monPane !== monDetailTab;
  });
  return true;
}

/** Selected skill slot (0..2) on skills tab detail pane. */
let monSkillPick = 0;
/** Selected monster uid on the monsters book screen. */
let selectedEnhanceUid: string | null = null;
/** Roster slot sort mode on enhance book. */
type RosterSortMode = "default" | "level" | "stars" | "element" | "party";
let rosterSortMode: RosterSortMode = "default";
/** Symbol bag index open in detail modal. */
let symbolDetailIndex: number | null = null;
/** Symbol bag expand confirm modal. */
let symbolBagExpandOpen = false;
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
/** Blocks input while place/strike choreography plays. */
let battleFxBusy = false;
let autoTimer: ReturnType<typeof setTimeout> | null = null;
let energyRegenTimer: ReturnType<typeof setInterval> | null = null;
let dmgFloats: { id: number; text: string; crit: boolean; ult: boolean }[] = [];
let floatSeq = 0;
/** Last seen circle phase — detect empowered reset for board FX. */
let lastSeenBoardPhase = 0;
/** One-shot collapse/rekindle class on the board frame. */
let boardRekindleFx = false;

/** Extra currencies drawer under app-bar resources. */
let resMoreOpen = false;
let settingsOpen = false;
let mailboxOpen = false;
let notifOpen = false;
let summonerPickerOpen = false;
let missionOpen = false;
let communityOpen = false;
let shopOpen = false;
/** Island world chat panel. */
let chatOpen = false;
/** True while the player is connected to a world-chat channel session. */
let chatConnected = false;
/** Latest one-line chat preview on the home dock (session-only). */
let chatLineNick: string | null = null;
let chatLineText: string | null = null;
/** True while the one-line dock has unseen messages. */
let chatLineUnread = false;
let chatSimTimer: ReturnType<typeof setInterval> | null = null;
type MissionTab = "daily" | "achievements";
let missionTab: MissionTab = "daily";

type StagesRegionId =
  | MainQuestPinId
  | "depth"
  | "arena"
  | "cadence"
  | "equip"
  | "warena"
  | "guild";
let stagesRegion: StagesRegionId | null = null;
type StageDifficulty = "normal" | "hard" | "hell";
let stageEntryId: string | null = null;
let stageEntryDiff: StageDifficulty = "normal";
let islandPan = { x: 0, y: 0 };
let islandPanCentered = false;
/** Bump when cover metrics change so the next bind re-centers once. */
const ISLAND_COVER_FIT_VERSION = 3;
let islandCoverFitApplied = 0;
/** User zoom via island-world layout size (1 = default). Not applied as CSS transform scale. */
let islandZoom = 1;
const ISLAND_BASE_SCALE = 1.12;
/** Must stay in sync with .island-world width/height % at --island-zoom: 1. */
const ISLAND_WORLD_PCT = { w: 2.12, h: 2.28 } as const;
/** Extra cover so edges never letterbox after scale. */
const ISLAND_ZOOM_MIN_OVERSCAN = 1.22;
/** Fallback ceiling; real max is computed from map pixel size. */
const ISLAND_ZOOM_MAX_HARD = 4;
/** Stop just before object-fit cover would upsample the bitmap past 1 CSS px / image px. */
const ISLAND_ZOOM_SHARP_PAD = 0.98;
const ISLAND_MAP_NATURAL = { w: 1440, h: 2560 } as const;
const ISLAND_TRANSFORM_ORIGIN = { x: 0.5, y: 0.36 };
/** Keep tilt tiny - larger angles foreshorten and leave empty strips at the top. */
const ISLAND_ROTATE_X_DEG = 2;
let islandPanDrag: {
  pointerId: number;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  moved: boolean;
} | null = null;
const islandActivePointers = new Map<number, { x: number; y: number }>();
let islandPinch: {
  startDist: number;
  startZoom: number;
} | null = null;

const ISLAND_LAYOUT_KEY = "stonesummoner.island-layout.v1";
const ISLAND_LAYOUT_DEFAULT: Record<string, { x: number; y: number }> = {
  summon_hearth: { x: 30, y: 44 },
  power_circle: { x: 50, y: 27 },
  gateway: { x: 72, y: 40 },
  mana_pond: { x: 24, y: 58 },
  shop: { x: 52, y: 52 },
  party: { x: 76, y: 56 },
  wish: { x: 18, y: 40 },
  dojo: { x: 40, y: 70 },
  crystal_mine: { x: 66, y: 68 },
  glory: { x: 86, y: 74 },
  guild: { x: 28, y: 82 },
  fusion: { x: 58, y: 86 },
};

/** Placeable terrace (% of island-world). Kept in sync with .island-build-zone CSS. */
const ISLAND_LAYOUT_BOUNDS = {
  minX: 14,
  maxX: 86,
  minY: 24,
  maxY: 80,
} as const;

function clampIslandLayoutPos(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.min(ISLAND_LAYOUT_BOUNDS.maxX, Math.max(ISLAND_LAYOUT_BOUNDS.minX, x)),
    y: Math.min(ISLAND_LAYOUT_BOUNDS.maxY, Math.max(ISLAND_LAYOUT_BOUNDS.minY, y)),
  };
}
function islandSpotTitle(id: string, fallback = ""): string {
  const extra: Record<string, string> = {
    shop: t('ui.0f6f02427f'),
    party: t('ui.108f04ca6e'),
    glory: t('ui.6a1629b11c'),
    mana_pond: t('ui.7c70400fef'),
  };
  if (extra[id]) return extra[id];
  const remap: Record<string, string> = {
    wish: "wish_temple",
    dojo: "practice_dojo",
    guild: "guild_hall",
    fusion: "fusion_star",
  };
  const bid = remap[id] ?? id;
  return PHASE_BUILDINGS.find((b) => b.id === bid)?.nameKo ?? fallback;
}

function looksBrokenLabel(s: string): boolean {
  if (!s) return true;
  if (/[\uac00-\ud7a3]/.test(s)) return false;
  return /\?/.test(s);
}


/** Footprint ellipse half-axes in % of island-world (scaled by depth). */
const ISLAND_SPOT_HIT = { rx: 10.5, ry: 12.5 } as const;

function islandSpotScaleAt(y: number): number {
  return 0.68 + Math.max(0, Math.min(1, y / 100)) * 0.5;
}

function islandSpotOverlaps(
  a: { x: number; y: number },
  b: { x: number; y: number },
): boolean {
  const scale = (islandSpotScaleAt(a.y) + islandSpotScaleAt(b.y)) / 2;
  const rx = ISLAND_SPOT_HIT.rx * scale;
  const ry = ISLAND_SPOT_HIT.ry * scale;
  const dx = (a.x - b.x) / rx;
  const dy = (a.y - b.y) / ry;
  return dx * dx + dy * dy < 1;
}

function islandSpotCollides(
  id: string,
  pos: { x: number; y: number },
  layout: Record<string, { x: number; y: number }>,
): boolean {
  for (const [otherId, other] of Object.entries(layout)) {
    if (otherId === id) continue;
    if (islandSpotOverlaps(pos, other)) return true;
  }
  return false;
}

/** Push out of overlapping spots, then clamp. Falls back to `fallback` if still blocked. */
function resolveIslandSpotCollision(
  id: string,
  x: number,
  y: number,
  layout: Record<string, { x: number; y: number }>,
  fallback: { x: number; y: number },
): { x: number; y: number } {
  let pos = clampIslandLayoutPos(x, y);
  for (let iter = 0; iter < 10; iter++) {
    let moved = false;
    for (const [otherId, other] of Object.entries(layout)) {
      if (otherId === id) continue;
      const scale = (islandSpotScaleAt(pos.y) + islandSpotScaleAt(other.y)) / 2;
      const rx = ISLAND_SPOT_HIT.rx * scale;
      const ry = ISLAND_SPOT_HIT.ry * scale;
      let dx = pos.x - other.x;
      let dy = pos.y - other.y;
      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
        dx = 0.35;
        dy = 0.35;
      }
      const nx = dx / rx;
      const ny = dy / ry;
      const d2 = nx * nx + ny * ny;
      if (d2 >= 1) continue;
      const d = Math.sqrt(d2) || 0.001;
      const push = (1.02 - d) / d;
      pos = clampIslandLayoutPos(pos.x + dx * push, pos.y + dy * push);
      moved = true;
    }
    if (!moved) break;
  }
  if (islandSpotCollides(id, pos, layout)) {
    // Axis-slide toward target from fallback
    const xOnly = clampIslandLayoutPos(x, fallback.y);
    if (!islandSpotCollides(id, xOnly, layout)) return xOnly;
    const yOnly = clampIslandLayoutPos(fallback.x, y);
    if (!islandSpotCollides(id, yOnly, layout)) return yOnly;
    return fallback;
  }
  return pos;
}

let islandLayoutEdit = false;
let islandLayoutDraft: Record<string, { x: number; y: number }> | null = null;
let islandLayoutSuppressClick = false;
let islandSpotDrag: {
  id: string;
  pointerId: number;
} | null = null;
let islandLongPress: {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  timer: ReturnType<typeof setTimeout>;
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
/** Atlas pixel size — pin x/y% are fractions of this image, not the viewport crop. */
const STAGES_MAP_NATURAL = { w: 1080, h: 1920 } as const;
const STAGES_MAP_ASPECT = STAGES_MAP_NATURAL.w / STAGES_MAP_NATURAL.h;
/** World larger than viewport so the full atlas can be panned. */
const STAGES_WORLD_OVERSCAN = 1.55;
/** Bump when atlas fit metrics change so the next bind re-centers once. */
const STAGES_MAP_FIT_VERSION = 1;
let stagesMapFitApplied = 0;
let stagesWorldResizeObs: ResizeObserver | null = null;

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
        ? t('ui.efd1a0e80b')
        : t('ui.d073e3e918'),
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
    symbolBagSlots: (() => {
      const raw =
        typeof p.symbolBagSlots === "number"
          ? p.symbolBagSlots
          : SYMBOL_BAG_BASE_SLOTS;
      return Math.min(
        SYMBOL_BAG_MAX_SLOTS,
        Math.max(SYMBOL_BAG_BASE_SLOTS, Math.floor(raw)),
      );
    })(),
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
  authUi.pane = "gate";
  const enterGame =
    opts?.enterGame ??
    (opts?.demo === true ||
      opts?.fresh === true ||
      readAuthPrefs().autoLogin);
  if (enterGame) {
    view = "home";
    flash(
      user.kind === "demo"
        ? t('ui.0b00025fb4')
        : user.kind === "guest"
          ? t('ui.02f932d2cd')
          : `${t('ui.b0814cee04')}${user.email ? ` ${MIDDOT} ${user.email}` : ""}`,
    );
  } else {
    view = "auth";
    flash(
      user.email
        ? t('ui.9f3e44b02a', { email: user.email })
        : t('ui.fa5d2fb50b'),
    );
  }
  render();
}

function startGameFromAuth(): void {
  if (!sessionUser) return;
  view = "home";
  flash(
    sessionUser.kind === "demo"
        ? t('ui.0b00025fb4')
      : sessionUser.kind === "guest"
        ? t('ui.02f932d2cd')
        : `${t('ui.b0814cee04')}${sessionUser.email ? ` ${MIDDOT} ${sessionUser.email}` : ""}`,
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
  authUi.pane = "gate";
  view = "auth";
  save = createNewSave();
  flash(t('ui.493fff2990'));
  render();
}

function flash(msg: string): void {
  toast = msg;
  const bar = app.querySelector("header.app-bar");
  if (!bar) return;
  bar.querySelector(".toast")?.remove();
  const p = document.createElement("p");
  p.className = "toast";
  p.textContent = msg;
  bar.appendChild(p);
  setTimeout(() => {
    if (toast === msg) toast = "";
    p.remove();
  }, 2200);
}


function ensureResFxLayer(): HTMLElement {
  let layer = document.querySelector<HTMLElement>("#res-fx-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "res-fx-layer";
    layer.className = "res-fx-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
  }
  return layer;
}

function animateResCount(
  el: HTMLElement,
  from: number,
  to: number,
  ms = 480,
): void {
  const start = performance.now();
  const delta = to - from;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = fmtRes(from + delta * eased);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = fmtRes(to);
  };
  requestAnimationFrame(tick);
}

/** Float one resource icon skyward, then bump the header wallet. */
function playResourceCollectFx(opts: {
  kind: "mana" | "crystal";
  amount: number;
  from: DOMRect;
  fromValue: number;
  toValue: number;
}): void {
  if (opts.amount <= 0) return;

  const reduce =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const walletSel =
    opts.kind === "mana" ? ".res-item--gold" : ".res-item--crystal";
  const icon =
    opts.kind === "mana" ? "/art/ui/res/gold.svg" : "/art/ui/res/crystal.svg";
  const holdHeader = () => {
    const item = app.querySelector<HTMLElement>(walletSel);
    const valEl = item?.querySelector<HTMLElement>(".res-val");
    if (valEl) valEl.textContent = fmtRes(opts.fromValue);
  };
  holdHeader();

  const finishHeader = () => {
    const item = app.querySelector<HTMLElement>(walletSel);
    const valEl = item?.querySelector<HTMLElement>(".res-val");
    if (!valEl || !item) return;
    item.classList.remove("is-res-gain");
    void item.offsetWidth;
    item.classList.add("is-res-gain");
    animateResCount(valEl, opts.fromValue, opts.toValue, reduce ? 180 : 520);
    window.setTimeout(() => item.classList.remove("is-res-gain"), 700);
  };

  if (reduce) {
    finishHeader();
    return;
  }

  const layer = ensureResFxLayer();
  const cx = opts.from.left + opts.from.width / 2;
  const cy = opts.from.top + opts.from.height / 2;
  const chip = document.createElement("div");
  chip.className = `res-fly res-fly--${opts.kind}`;
  chip.style.left = `${cx}px`;
  chip.style.top = `${cy}px`;
  chip.innerHTML = `<img src="${icon}" width="28" height="28" alt="" />`;
  layer.appendChild(chip);
  chip.addEventListener("animationend", () => chip.remove(), { once: true });

  window.setTimeout(finishHeader, 720);
}


function startBattle(stage: StageDef, diff: StageDifficulty = "normal"): void {
  if (!isStageUnlocked(save, stage.id)) {
    flash(t('ui.b72f5a4752'));
    render();
    return;
  }
  if (!isDifficultyOpen(stage, diff)) {
    flash(t('ui.a4d2cdf322'));
    render();
    return;
  }
  const cost = stageEnergyCost(stage, diff);
  if (Math.floor(save.island.energy) < cost) {
    flash(t('ui.711b4aaddc'));
    render();
    return;
  }
  save = {
    ...save,
    island: spendEnergy(save.island, cost),
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
  stageEntryId = null;
  battle = createStageBattle(stage, save, {
    banEnemyIds:
      stage.mode === "world_arena" ? save.arenaBanIds ?? [] : undefined,
    difficulty: diff,
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
      ${navBackBtn({ nav: "stages", label: t('ui.1a7f31cadb') })}
      <div class="battle-sky" aria-hidden="true">
        <img class="battle-sky-img" src="/art/battle/battle-arena-bg.webp" alt="" decoding="async" />
        <div class="battle-sky-veil"></div>
      </div>
      <div class="result-screen is-lose">
        <div class="result-banner">
          <p class="result-kicker">${t('ui.be85833944')}</p>
          <h2 class="result-title">${t('ui.70088c999d')}</h2>
          <p class="result-sub">${t('ui.41281baf5a')}</p>
        </div>
      </div>
    </div>`;
  }
  const win = reward.victory;
  const rows: string[] = [];
  if (win) {
    rows.push(`<li><span>${t('ui.dc78e6a251')}</span><strong>+${reward.mana}</strong></li>`);
    if (reward.crystal)
      rows.push(`<li><span>${t('ui.5d0bf3b101')}</span><strong>+${reward.crystal}</strong></li>`);
    if (reward.glory)
      rows.push(`<li><span>${t('ui.ba0c9e096f')}</span><strong>+${reward.glory}</strong></li>`);
    if (reward.jinmun)
      rows.push(`<li><span>${t('ui.4b482b3675')}</span><strong>+${reward.jinmun}</strong></li>`);
    if (reward.contribution)
      rows.push(
        `<li><span>${t('ui.443ac89859')}</span><strong>+${reward.contribution}</strong></li>`,
      );
    if (reward.summonerExp)
      rows.push(
        `<li><span>${t('ui.fd3c4455cd')} EXP</span><strong>+${reward.summonerExp}</strong></li>`,
      );
    if (reward.levelsGained)
      rows.push(
        `<li><span>${t('ui.453d0d2df5')}</span><strong>Lv.${save.island.summonerLevel}</strong></li>`,
      );
    if (lastScrollGain)
      rows.push(
        `<li><span>${t('ui.fa73f3a42f')}</span><strong>+${lastScrollGain}</strong></li>`,
      );
  }
  const drop = [
    reward.gear
      ? `<div class="result-drop">
        <p class="section-label">${t('ui.6be738a130')}</p>
        <p class="result-drop-card">${describeGear(reward.gear)}</p>
        <div class="result-drop-cta">
          <button type="button" class="auth-btn-primary" data-nav="enhance">${t('ui.bbef9e1b47')}</button>
        </div>
      </div>`
      : "",
    reward.symbol
      ? `<div class="result-drop">
        <p class="section-label">${t('ui.6be738a130')}</p>
        <p class="result-drop-card">${describeSymbol(reward.symbol)}</p>
        <div class="result-drop-cta">
          <button type="button" class="auth-btn-primary" data-nav="enhance">${t('ui.7533294263')}</button>
          <button type="button" class="secondary" data-nav="shop">${t('ui.9efcf019b7')}</button>
        </div>
      </div>`
      : "",
  ].join("");
  return `<div class="result-wrap">
    ${navBackBtn({ nav: "stages", label: t('ui.1a7f31cadb') })}
    <div class="battle-sky" aria-hidden="true">
      <img class="battle-sky-img" src="/art/battle/battle-arena-bg.webp" alt="" decoding="async" />
      <div class="battle-sky-veil"></div>
    </div>
    <div class="result-screen ${win ? "is-win" : "is-lose"}">
    <div class="result-banner">
          <p class="result-kicker">${t('ui.be85833944')}</p>
          <h2 class="result-title">${t('ui.70088c999d')}</h2>
          <p class="result-sub">${t('ui.41281baf5a')}</p>
    </div>
    ${
      win
        ? `<ul class="result-rewards">${rows.join("")}</ul>${drop}`
        : `<p class="muted result-empty">${reward.expNote}</p>`
    }
    <div class="result-cta">
      <button type="button" class="auth-btn-primary" id="btn-result-again">${t('ui.03d1f975cb')}</button>
      <button type="button" class="secondary auth-btn-ghost" data-nav="stages">${t('ui.0f9f095864')}</button>
      ${
        win
          ? `<button type="button" class="secondary auth-btn-ghost" data-nav="party">${t('ui.108f04ca6e')}</button>`
          : ""
      }
      <button type="button" class="secondary auth-btn-ghost" data-nav="home">${t('ui.d8c261904f')}</button>
    </div>
  </div>
  </div>`;
}

function onCellClick(x: number, y: number): void {
  void onCellClickAsync(x, y);
}

async function onCellClickAsync(x: number, y: number): Promise<void> {
  if (!battle || battle.phase !== "await_stone") return;
  if (autoMode || battleFxBusy) return;
  const unit = battle.activeUnitId
    ? battle.getUnit(battle.activeUnitId)
    : null;
  if (!unit || unit.team !== "ally") return;

  battleFxBusy = true;
  try {
    const allySum = battle.units.find(
      (u) => u.team === "ally" && u.kind === "summoner" && u.alive,
    );
    const castMs = fxDurationMs(420, battleSpeed);
    if (allySum) {
      pulseUnitClass(app, allySum.id, "fx-cast-place", castMs);
      playSpineClip(allySum.id, "cast");
    }
    await waitFx(castMs);

    if (!battle.playStone({ x, y })) return;
    const capBonus = battle.pendingCaptureDamageBonus.ally;
    refreshLegal();
    render();
    const dropMs = fxDurationMs(280, battleSpeed);
    pulseBoardCell(app, x, y, "fx-stone-drop", dropMs);
    if (capBonus > 0) {
      pulseBoardCell(app, x, y, "fx-capture", fxDurationMs(380, battleSpeed));
      app.querySelector(".board-frame")?.classList.add("fx-capture-flash");
      window.setTimeout(
        () =>
          app
            .querySelector(".board-frame")
            ?.classList.remove("fx-capture-flash"),
        fxDurationMs(380, battleSpeed),
      );
    }
    await waitFx(Math.max(dropMs, capBonus > 0 ? fxDurationMs(380, battleSpeed) : 0));
  } finally {
    battleFxBusy = false;
  }
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

/** SW-style formation: monsters flanking a center summoner. */
function renderBattleFront(
  units: Unit[],
  side: "enemy" | "ally",
  opts?: { targetable?: boolean },
): string {
  const monsters = frontRow(units);
  const summoner = backSummoner(units);
  const mid = Math.ceil(monsters.length / 2);
  const left = monsters.slice(0, mid);
  const right = monsters.slice(mid);
  const summonerOpts =
    side === "enemy" && opts?.targetable ? opts : undefined;
  const parts = [
    ...left.map((u) => renderUnit(u, opts)),
    summoner ? renderUnit(summoner, summonerOpts) : "",
    ...right.map((u) => renderUnit(u, opts)),
  ];
  return `<div class="battle-front ${side}">${parts.join("")}</div>`;
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

function clearEnergyRegenTimer(): void {
  if (energyRegenTimer) {
    clearInterval(energyRegenTimer);
    energyRegenTimer = null;
  }
}

function fmtEnergyRegen(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function syncEnergyHud(now = Date.now()): void {
  const max = save.island.energyMax ?? 100;
  const energy = Math.floor(save.island.energy);
  const valEl = app.querySelector("#res-energy-val");
  const timerEl = app.querySelector<HTMLElement>("#res-energy-timer");
  const itemEl = app.querySelector(".res-item--energy");
  if (valEl) {
    valEl.innerHTML = `${energy}<small>/${max}</small>`;
  }
  if (itemEl) {
    itemEl.classList.toggle("has-timer", energy < max);
  }
  if (!timerEl) return;
  if (energy >= max) {
    timerEl.hidden = true;
    timerEl.textContent = "";
    return;
  }
  const rem = energyRegenRemainingMs(save.island, now) ?? ENERGY_REGEN_MS;
  timerEl.hidden = false;
  timerEl.textContent = fmtEnergyRegen(rem);
}

function startEnergyRegenTimer(): void {
  clearEnergyRegenTimer();
  if (view === "auth") return;
  const tick = (): void => {
    const before = Math.floor(save.island.energy);
    const max = save.island.energyMax ?? 100;
    if (before >= max) {
      clearEnergyRegenTimer();
      syncEnergyHud();
      return;
    }
    const nextIsland = tickProduction(save.island);
    const after = Math.floor(nextIsland.energy);
    if (after !== before || nextIsland.energyUpdatedAt !== save.island.energyUpdatedAt) {
      save = { ...save, island: nextIsland };
      if (after !== before) persist();
    }
    syncEnergyHud();
    if (after >= max) clearEnergyRegenTimer();
  };
  tick();
  if (Math.floor(save.island.energy) < (save.island.energyMax ?? 100)) {
    energyRegenTimer = setInterval(tick, 1000);
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
  void castSkillAsync(mode);
}

async function playStrikeFx(
  hits: SkillResult[],
  opts?: { ult?: boolean },
): Promise<void> {
  if (!hits.length) {
    pushDamageFloats(hits);
    return;
  }
  if (opts?.ult) {
    const cutMs = fxDurationMs(520, battleSpeed);
    playUltCutin(app, cutMs);
    const caster = hits[0]?.attackerId;
    if (caster) {
      pulseUnitClass(app, caster, "fx-ult", cutMs);
      playSpineClip(caster, "ult");
    }
    await waitFx(cutMs);
  } else {
    const attackerId = hits[0]!.attackerId;
    const targetId = hits[0]!.targetId;
    const lungeMs = fxDurationMs(380, battleSpeed);
    pulseUnitClass(app, attackerId, "fx-lunge", lungeMs);
    pulseUnitClass(app, targetId, "fx-hit", lungeMs);
    playSpineClip(attackerId, "run", { loop: false });
    window.setTimeout(() => {
      playSpineClip(attackerId, "attack");
    }, Math.floor(lungeMs * 0.35));
    await waitFx(lungeMs);
  }
  pushDamageFloats(hits);
}

async function castSkillAsync(
  mode: "ult" | "declare" | "dual" | "clean" | "guard" | "smart" | number,
): Promise<void> {
  if (!battle || battle.phase !== "await_skill" || autoMode || battleFxBusy)
    return;
  const unit = battle.activeUnitId
    ? battle.getUnit(battle.activeUnitId)
    : null;
  if (!unit || unit.team !== "ally") return;

  battleFxBusy = true;
  try {
    if (mode === "ult") {
      if (!battle.canUseSummonerSkill(unit)) {
        flash(t("ui.711b4aaddc"));
        render();
        return;
      }
      const hits = battle.useSkill({ summonerSkill: "open" });
      await playStrikeFx(hits, { ult: true });
      afterPlayerAction();
      return;
    }
    if (mode === "declare") {
      if (!battle.canUseSummonerDeclare(unit)) {
        flash(t("ui.9af91c9bed"));
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
        flash(t("ui.b0b1120abf"));
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
        flash(t("ui.c85840dca0"));
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
        flash(t("ui.9cf3c0b981"));
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
      flash(t("ui.73743ba945"));
      render();
      return;
    }
    const targetId = ensureTarget();
    const hits = battle.useSkill({ skillIndex, targetId });
    if (!hits.length) {
      flash(t("ui.b72f5a4752"));
      render();
      return;
    }
    await playStrikeFx(hits);
    afterPlayerAction();
  } finally {
    battleFxBusy = false;
  }
}

function renderSkillButtons(active: Unit | null, awaitSkill: boolean): string {
  const skills = active?.skills ?? [];
  const cds = active?.skillCd ?? [];
  const slots = [0, 1, 2].map((i) => {
    const sk = skills[i];
    const cd = cds[i] ?? 0;
    const label = sk ? sk.nameKo : i === 0 ? t('ui.8a1893a931') : `S${i + 1}`;
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
  const isActive = battle?.activeUnitId === u.id;
  const isTargeted = !!(opts?.targetable && selectedTargetId === u.id);
  const active = isActive ? " active" : "";
  const targeted = isTargeted ? " targeted" : "";
  const hpPct = Math.round((u.hp / u.stats.hp) * 100);
  const atbPct = Math.min(100, Math.round(u.atb));
  const shield = u.shieldHp && u.shieldHp > 0 ? Math.round(u.shieldHp) : 0;
  const dead = !u.alive ? " dead" : "";
  const isSummoner = u.kind === "summoner";
  const tag = opts?.targetable && u.alive ? "button" : "div";
  const attrs =
    opts?.targetable && u.alive
      ? `type="button" data-target="${u.id}"`
      : "";
  const artSize = isSummoner ? 128 : 160;
  const art =
    u.kind === "monster"
      ? monsterArtImg(u.monsterId, "battle-unit-img", artSize)
      : `<img class="battle-unit-img" src="${summonerArtSrc(u.element)}" width="${artSize}" height="${artSize}" alt="" draggable="false" decoding="async" />`;
  const showName = isActive || isTargeted;
  const spineId =
    u.kind === "monster"
      ? u.monsterId ?? ""
      : `summoner-${u.element}`;
  return `<${tag} class="battle-unit${isSummoner ? " battle-unit--summoner" : ""} el-${u.element}${active}${targeted}${dead}${shield ? " has-shield" : ""}" data-unit="${u.id}" data-spine-id="${spineId}" ${attrs} title="${u.name}">
    <div class="battle-unit-bars">
      <div class="battle-unit-hp-row">
        <span class="battle-unit-hp-num">${Math.max(0, Math.round(u.hp))}</span>
      ${shield ? `<span class="shield-badge" title="${t('ui.e234157c2f')}">+${shield}</span>` : ""}
      </div>
      <div class="bar hp"><i style="width:${hpPct}%"></i></div>
      <div class="bar atb"><i style="width:${atbPct}%"></i></div>
    </div>
    ${isActive ? `<span class="battle-unit-turn" aria-hidden="true"></span>` : ""}
    <span class="battle-unit-glow" aria-hidden="true"></span>
    <span class="battle-unit-art" aria-hidden="true">${art}</span>
    ${showName ? `<span class="battle-unit-name">${u.name}</span>` : ""}
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
      ? t('ui.d2342783cb')
      : `${t('ui.0f554c7cff')} ${"I".repeat(Math.min(phase, 3))}`;
  const openingHint = battle.openingBonusPending
    ? `<span class="board-opening-hint">${t('ui.413147d435')}</span>`
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
          ? Mark.crit
          : token?.id === "shield_core"
            ? Mark.shieldCore
            : token?.id === "capture_magnet"
              ? Mark.magnet
              : token?.id === "stride_sand"
                ? Mark.stride
                : token?.id === "seal_nail"
                  ? Mark.seal
                  : token?.id === "element_ward"
                    ? Mark.ward
                    : token?.id === "bait_stone"
                      ? Mark.lure
                      : token?.id === "transform_dust"
                        ? Mark.transform
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
              ? `<span class="forbid-mark">${Mark.forbid}</span>`
              : bait
                ? `<span class="bait-mark">${Mark.bait}</span>`
                : victory === key
                  ? `<span class="victory-mark">${Mark.victory}</span>`
                  : starSet.has(key)
                    ? `<span class="star-mark">${Mark.starDot}</span>`
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
  return `<div class="board-frame board-frame--tilted phase-${Math.min(phase, 3)}${showRekindle ? " is-rekindling" : ""}${battle.openingBonusPending ? " has-opening" : ""}" data-element="${battle.circleElement ?? ""}">
    <div class="board-phase-tag">${rebuildTag}${openingHint}</div>
    <div class="board-phase-meter" aria-hidden="true"><i style="width:${resetPct}%"></i></div>
    <div class="board-stage">
      <div class="board-hit" aria-hidden="false">
        <div class="board size-${size} phase-${Math.min(phase, 3)}" style="grid-template-columns:repeat(${size},minmax(0,1fr))">${cells}</div>
      </div>
    </div>
  </div>`;
}

function renderBoardTabs(): string {
  if (!battle || battle.boards.length < 2) return "";
  return `<div class="board-tabs" role="tablist">
    ${battle.boards
      .map((_, i) => {
        const label = i === 0 ? Mark.boardA : Mark.boardB;
        const active = battle!.activeBoardIndex === i;
        const stones = battle!.boards[i]!
          .getBoard()
          .flat()
          .filter(Boolean).length;
        return `<button type="button" class="board-tab${active ? " active" : ""}" data-board-tab="${i}" ${active ? "aria-selected=\"true\"" : ""}>
          ${label}<small>${stones}${Mark.stone}</small>
        </button>`;
      })
      .join("")}
  </div>`;
}

function renderSuggestStrip(): string {
  if (!stoneSuggestions.length || battle?.phase !== "await_stone") return "";
  const manaMax = battle?.allySummoner.manaMax ?? 100;
  return `<div class="suggest-strip">
    <p class="suggest-strip-title">${t('ui.c943a2bfc5')}</p>
    ${stoneSuggestions
      .map((s) => {
        const manaTotal =
          s.manaGain + Math.round(manaMax * (s.captureManaFrac ?? 0));
        const dmgPct = Math.round((s.captureDamageBonus ?? 0) * 100);
        const dmgBit = dmgPct > 0 ? ` ${MIDDOT} +${dmgPct}%` : "";
        return `<button type="button" class="suggest-chip suggest-chip--${s.rank}" data-sgx="${s.point.x}" data-sgy="${s.point.y}">
            <span class="suggest-rank">${s.rank}</span>
            <span class="suggest-body">
              <strong>${s.point.x},${s.point.y}</strong>
              <small>${t('ui.b61d5e36ba')} ${s.capturedCount}${dmgBit} ${MIDDOT} ${t('ui.dc78e6a251')} +${manaTotal} ${MIDDOT} amp +${s.amplifyDelta.toFixed(2)}${s.hasToken ? t('ui.67082f387a') : ""}</small>
            </span>
          </button>`;
      })
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
        alt="${t('ui.974e7916c4')}"
        decoding="async"
        fetchpriority="high"
      />
    </h1>
  </header>`;
}

function authFooter(): string {
  const sep = `<span class="auth-footer-sep" aria-hidden="true">|</span>`;
  return `<footer class="auth-footer">
    <nav class="auth-footer-nav" aria-label="${escapeHtml(t("auth.footer.navAria"))}">
      <a class="auth-footer-link" href="#terms">${escapeHtml(t("auth.footer.terms"))}</a>
      ${sep}
      <a class="auth-footer-link" href="#privacy">${escapeHtml(t("auth.footer.privacy"))}</a>
      ${sep}
      <a class="auth-footer-link" href="mailto:stonesummoners@gmail.com">${escapeHtml(t("auth.footer.support"))}</a>
    </nav>
    <div class="auth-footer-body">
      <p class="auth-footer-meta">
        <span class="auth-footer-unit">${escapeHtml(t("auth.footer.company"))}</span>${sep}<span class="auth-footer-unit">${escapeHtml(t("auth.footer.ceo"))}</span>
      </p>
      <p class="auth-footer-meta">
        <span class="auth-footer-unit">${escapeHtml(t("auth.footer.bizNo"))}</span>${sep}<span class="auth-footer-unit">${escapeHtml(t("auth.footer.mailOrder"))}</span>
      </p>
      <p class="auth-footer-meta">
        <span class="auth-footer-unit">${escapeHtml(t("auth.footer.address"))}</span>
      </p>
      <p class="auth-footer-meta">
        <span class="auth-footer-unit">${escapeHtml(t("auth.footer.phoneLabel"))} <a class="auth-footer-link" href="tel:010-5484-1960">010-5484-1960</a></span>${sep}<span class="auth-footer-unit"><a class="auth-footer-link" href="mailto:stonesummoners@gmail.com">stonesummoners@gmail.com</a></span>
      </p>
    </div>
    <p class="auth-footer-copy">${escapeHtml(t("auth.footer.copy"))}</p>
  </footer>`;
}

function renderAuth(): string {
  const prefs = readAuthPrefs();
  const pane = authUi.pane;
  const loggedIn = !!sessionUser;

  if (pane === "gate") {
    const sessionHint = loggedIn
      ? `<p class="auth-session-hint">${escapeHtml(displayNickname())}${
          sessionUser!.email ? ` ${MIDDOT} ${escapeHtml(sessionUser!.email)}` : ""
        }</p>`
      : "";
    const primary = loggedIn
      ? `<button type="button" class="auth-btn-primary auth-hero-cta" id="auth-start">${t("ui.50cec01118")}</button>`
      : `<button type="button" class="auth-btn-primary auth-hero-cta" id="auth-open-login">${t("ui.e225a6fd75")}</button>`;
    const links = loggedIn
      ? `<div class="auth-link-row">
          <button type="button" class="auth-text-link" id="auth-logout">${t("ui.3879f078a4")}</button>
        </div>`
      : `<div class="auth-link-row">
          <button type="button" class="auth-text-link" id="auth-register">${t("ui.ecb4cc8789")}</button>
          <span class="auth-link-sep" aria-hidden="true">${MIDDOT}</span>
          <button type="button" class="auth-text-link" id="auth-demo">${t("ui.275aaa8da4")}</button>
        </div>`;
    return `${authHeroLayer()}
    <div class="auth-screen auth-screen--gate">
      ${authBrand()}
      <div class="auth-gate">
        ${sessionHint}
        ${primary}
        ${links}
      </div>
    </div>`;
  }

  if (pane === "register") {
    return `${authHeroLayer()}
    <div class="auth-screen auth-screen--form">
      ${authBrand()}
      <div class="auth-panel">
        <h2 class="auth-title">${t("ui.ecb4cc8789")}</h2>
        <form id="auth-form" class="auth-form">
          <label>${t("ui.3c37764a2b")}<input name="email" type="email" autocomplete="username" required /></label>
          <label>${t("ui.81973897c7")}<input name="password" type="password" autocomplete="new-password" minlength="6" required /></label>
          <button type="submit" class="auth-btn-primary">${t("ui.ecb4cc8789")}</button>
        </form>
        <button type="button" class="secondary full auth-btn-ghost" id="auth-back">${t("ui.1a7f31cadb")}</button>
      </div>
    </div>`;
  }

  const savedEmail = prefs.saveId ? prefs.savedEmail : "";
  const emailAttr = savedEmail
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
  return `${authHeroLayer()}
  <div class="auth-screen auth-screen--form">
    ${authBrand()}
    <div class="auth-panel">
      <h2 class="auth-title">${t("ui.e225a6fd75")}</h2>
      <form id="auth-form" class="auth-form">
        <label>${t("ui.3c37764a2b")}<input name="email" type="email" autocomplete="username" value="${emailAttr}" required /></label>
        <label>${t("ui.81973897c7")}<input name="password" type="password" autocomplete="current-password" minlength="6" required /></label>
        <div class="auth-checks">
          <label class="auth-check"><input type="checkbox" name="saveId" ${prefs.saveId ? "checked" : ""} /> ${t("ui.929b21bf23")}</label>
          <label class="auth-check"><input type="checkbox" name="autoLogin" ${prefs.autoLogin ? "checked" : ""} /> ${t("ui.217211959e")}</label>
        </div>
        <button type="submit" class="auth-btn-primary">${t("ui.e225a6fd75")}</button>
      </form>
      <div class="auth-link-row">
        <button type="button" class="auth-text-link" id="auth-register">${t("ui.ecb4cc8789")}</button>
        <span class="auth-link-sep" aria-hidden="true">${MIDDOT}</span>
        <button type="button" class="auth-text-link" id="auth-demo">${t("ui.275aaa8da4")}</button>
      </div>
      <button type="button" class="secondary full auth-btn-ghost" id="auth-back">${t("ui.94b7dba159")}</button>
    </div>
    ${
      ephemeralStore
        ? `<p class="auth-warn">${t("ui.b97534218c")}</p>`
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
  return formatNumber(v);
}

function elementLabel(el: SummonerElement): string {
  return t(`element.${el}`);
}

function languageOptionsHtml(): string {
  const current = getLocale();
  return listLocales()
    .map(
      (loc) =>
        `<option value="${loc.id}" ${loc.id === current ? "selected" : ""}>${escapeHtml(loc.nativeName)}</option>`,
    )
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Seal-style X close control; triggers the matching backdrop close button. */
function modalCloseX(ariaLabel: string, closeBtnId: string): string {
  return `<button type="button" class="modal-x" data-modal-x-for="${closeBtnId}" aria-label="${escapeHtml(ariaLabel)}"></button>`;
}

/** Short display name for profile overlays. */
function displayNickname(): string {
  const email = sessionUser?.email?.trim();
  if (email) {
    const local = email.split("@")[0] || email;
    return local.length > 10 ? `${local.slice(0, 10)}?` : local;
  }
  if (sessionUser?.kind === "demo") return t("account.demo");
  if (sessionUser?.kind === "guest") return t("account.guest");
  return t("account.default");
}

/** Toggle currency drawer without a full screen re-render. */
function applyResMoreOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-res-more");
  const panel = app.querySelector<HTMLElement>("#res-more-panel");
  if (btn) {
    btn.classList.toggle("is-open", resMoreOpen);
    btn.setAttribute("aria-expanded", resMoreOpen ? "true" : "false");
    const label = resMoreOpen ? t("res.moreClose") : t("res.moreOpen");
    btn.title = label;
    btn.setAttribute("aria-label", label);
  }
  if (panel) {
    panel.classList.toggle("is-open", resMoreOpen);
    if (resMoreOpen) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "");
  }
}


/** Replay centered modal pop animation when a layer becomes visible. */
function replayModalPop(layer: HTMLElement | null): void {
  const sheet = layer?.querySelector<HTMLElement>(".settings-sheet, .mission-sheet, .community-sheet, .shop-sheet, .stages-region-sheet, .stage-entry-modal");
  if (!sheet) return;
  sheet.style.animation = "none";
  void sheet.offsetWidth;
  sheet.style.animation = "";
}

/** Toggle settings modal without a full screen re-render. */
function applySettingsOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-settings");
  const layer = app.querySelector<HTMLElement>("#settings-layer");
  if (btn) {
    btn.classList.toggle("is-open", settingsOpen);
    btn.classList.toggle("active", settingsOpen);
    btn.setAttribute("aria-expanded", settingsOpen ? "true" : "false");
  }
  if (layer) {
    layer.hidden = !settingsOpen;
    layer.setAttribute("aria-hidden", settingsOpen ? "false" : "true");
    if (settingsOpen) replayModalPop(layer);
  }
}

/** Toggle mailbox modal without a full screen re-render. */
function applyMailboxOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-mailbox");
  const layer = app.querySelector<HTMLElement>("#mailbox-layer");
  if (btn) {
    btn.classList.toggle("is-open", mailboxOpen);
    btn.setAttribute("aria-expanded", mailboxOpen ? "true" : "false");
  }
  if (layer) {
    layer.hidden = !mailboxOpen;
    layer.setAttribute("aria-hidden", mailboxOpen ? "false" : "true");
    if (mailboxOpen) replayModalPop(layer);
  }
}

/** Toggle notification modal without a full screen re-render. */
function applyNotifOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-notif");
  const layer = app.querySelector<HTMLElement>("#notif-layer");
  if (btn) {
    btn.classList.toggle("is-open", notifOpen);
    btn.setAttribute("aria-expanded", notifOpen ? "true" : "false");
  }
  if (layer) {
    layer.hidden = !notifOpen;
    layer.setAttribute("aria-hidden", notifOpen ? "false" : "true");
    if (notifOpen) replayModalPop(layer);
  }
}

/** Toggle mission modal without a full screen re-render. */
function applyMissionOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-mission");
  const layer = app.querySelector<HTMLElement>("#mission-layer");
  if (btn) {
    btn.classList.toggle("active", missionOpen);
    btn.setAttribute("aria-expanded", missionOpen ? "true" : "false");
  }
  if (layer) {
    layer.hidden = !missionOpen;
    layer.setAttribute("aria-hidden", missionOpen ? "false" : "true");
    if (missionOpen) replayModalPop(layer);
  }
}

/** Toggle community (guild) modal without a full screen re-render. */
function applyCommunityOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-community");
  const layer = app.querySelector<HTMLElement>("#community-layer");
  if (btn) {
    btn.classList.toggle("active", communityOpen);
    btn.setAttribute("aria-expanded", communityOpen ? "true" : "false");
  }
  if (layer) {
    layer.hidden = !communityOpen;
    layer.setAttribute("aria-hidden", communityOpen ? "false" : "true");
    if (communityOpen) replayModalPop(layer);
  }
}

/** Open community modal and close other home overlays. */
function openCommunityModal(): void {
  communityOpen = true;
  shopOpen = false;
  missionOpen = false;
  settingsOpen = false;
  mailboxOpen = false;
  notifOpen = false;
  summonerPickerOpen = false;
  resMoreOpen = false;
  chatOpen = false;
}

/** Toggle shop modal without a full screen re-render. */
function applyShopOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-shop");
  const layer = app.querySelector<HTMLElement>("#shop-layer");
  if (btn) {
    btn.classList.toggle("active", shopOpen);
    btn.setAttribute("aria-expanded", shopOpen ? "true" : "false");
  }
  if (layer) {
    layer.hidden = !shopOpen;
    layer.setAttribute("aria-hidden", shopOpen ? "false" : "true");
    if (shopOpen) replayModalPop(layer);
  }
}

/** Open shop modal and close other home overlays. */
function openShopModal(): void {
  shopOpen = true;
  communityOpen = false;
  missionOpen = false;
  settingsOpen = false;
  mailboxOpen = false;
  notifOpen = false;
  summonerPickerOpen = false;
  resMoreOpen = false;
  chatOpen = false;
}


/** Toggle summoner picker sheet without a full screen re-render. */
function applySummonerPickerOpen(): void {
  const btn = app.querySelector<HTMLButtonElement>("#btn-nav-summoner");
  const layer = app.querySelector<HTMLElement>("#summoner-picker-layer");
  if (btn) {
    btn.setAttribute("aria-expanded", summonerPickerOpen ? "true" : "false");
    btn.classList.toggle("active", summonerPickerOpen);
  }
  if (layer) {
    layer.hidden = !summonerPickerOpen;
    layer.setAttribute("aria-hidden", summonerPickerOpen ? "false" : "true");
    if (summonerPickerOpen) replayModalPop(layer);
  }
}

/** Notice lines reused by the notification sheet (not a marquee). */
function tickerMessages(): string[] {
  const active = getActiveSummoner(save);
  const el = save.activeSummoner ?? "light";
  const energy = Math.floor(save.island.energy);
  const energyMax = save.island.energyMax ?? 100;
  const lines = [
    t("ticker.welcome"),
    t("ticker.training", { element: elementLabel(el), level: active.level }),
    t("ticker.energy", { energy, max: energyMax }),
    t("ticker.scrolls", { n: totalScrollCount(save) }),
  ];
  if ((save.gloryPoints ?? 0) > 0) {
    lines.push(t("ticker.glory", { n: save.gloryPoints ?? 0 }));
  }
  if (save.island.summonerLevel < 7) {
    lines.push(t("ticker.unlockWish"));
  } else if (save.island.summonerLevel < 8) {
    lines.push(t("ticker.unlockDojo"));
  }
  return lines;
}

const CHAT_CHANNEL_CAP = 100;
const CHAT_CHANNEL_COUNT = 6;

type ChatMsg = { id: string; nick: string; text: string; at: number };
type ChatChannel = { id: number; users: number; msgs: ChatMsg[] };

let chatChannels: ChatChannel[] = [];
let chatChannelId = 1;
let chatMsgSeq = 0;

const CHAT_BOT_NICKS = [
  "StoneFox",
  "RuneOwl",
  "CrystalJay",
  "ManaPike",
  "GloryFin",
  "DojoCrow",
];
const CHAT_BOT_LINES = [
  "gg",
  "anyone farming stage 7?",
  "looking for guild",
  "nice pull!",
  "energy refill soon",
  "symbol bag almost full",
  "hello channel",
  "need wind lead",
];

function ensureChatChannels(): void {
  if (chatChannels.length) return;
  for (let i = 1; i <= CHAT_CHANNEL_COUNT; i++) {
    const seeded =
      i === 1 ? 18 : i === 2 ? CHAT_CHANNEL_CAP : Math.min(CHAT_CHANNEL_CAP, 35 + i * 9);
    chatChannels.push({
      id: i,
      users: seeded,
      msgs: [],
    });
  }
  chatChannelId = chatChannels.find((c) => c.users < CHAT_CHANNEL_CAP)?.id ?? 1;
}

function chatChannel(id: number): ChatChannel | undefined {
  ensureChatChannels();
  return chatChannels.find((c) => c.id === id);
}

function chatIsFull(ch: ChatChannel): boolean {
  return ch.users >= CHAT_CHANNEL_CAP;
}

function joinChatChannel(id: number): boolean {
  ensureChatChannels();
  const ch = chatChannel(id);
  if (!ch || chatIsFull(ch)) return false;
  if (chatChannelId !== id) {
    const prev = chatChannel(chatChannelId);
    if (prev && prev.users > 0) prev.users -= 1;
    ch.users = Math.min(CHAT_CHANNEL_CAP, ch.users + 1);
    chatChannelId = id;
  }
  return true;
}

function clearChatLine(): void {
  chatLineNick = null;
  chatLineText = null;
  chatLineUnread = false;
}

function clearChannelMsgs(id: number): void {
  const ch = chatChannel(id);
  if (ch) ch.msgs = [];
}

/** Begin a chat session on a channel — no history from before this connect. */
function connectChatSession(id?: number): boolean {
  ensureChatChannels();
  const target = id ?? chatChannelId;
  if (!joinChatChannel(target)) {
    const fallback = chatChannels.find((c) => !chatIsFull(c));
    if (!fallback || !joinChatChannel(fallback.id)) return false;
  }
  clearChannelMsgs(chatChannelId);
  chatConnected = true;
  clearChatLine();
  return true;
}

/** End the chat session and wipe session messages. */
function disconnectChatSession(): void {
  if (chatConnected) clearChannelMsgs(chatChannelId);
  chatConnected = false;
  chatOpen = false;
  clearChatLine();
}

/** Switch channel: leave previous session history, join empty. */
function switchChatSession(id: number): boolean {
  ensureChatChannels();
  if (chatConnected && id === chatChannelId) return true;
  if (chatConnected) clearChannelMsgs(chatChannelId);
  if (!joinChatChannel(id)) return false;
  clearChannelMsgs(chatChannelId);
  chatConnected = true;
  clearChatLine();
  return true;
}

function pushChatMessage(channelId: number, nick: string, text: string): ChatMsg | null {
  ensureChatChannels();
  if (!chatConnected || channelId !== chatChannelId) return null;
  const ch = chatChannel(channelId);
  if (!ch) return null;
  const msg: ChatMsg = {
    id: `m${++chatMsgSeq}`,
    nick,
    text,
    at: Date.now(),
  };
  ch.msgs = [...ch.msgs.slice(-40), msg];
  chatLineNick = nick;
  chatLineText = text;
  if (!chatOpen) chatLineUnread = true;
  return msg;
}

function chatSimAllowed(): boolean {
  return view !== "auth" && view !== "battle" && view !== "result";
}

function simulateChatTick(): void {
  if (!chatSimAllowed() || !chatConnected) return;
  ensureChatChannels();
  const ch = chatChannel(chatChannelId);
  if (!ch || chatIsFull(ch)) return;
  const nick = CHAT_BOT_NICKS[Math.floor(Math.random() * CHAT_BOT_NICKS.length)]!;
  const text = CHAT_BOT_LINES[Math.floor(Math.random() * CHAT_BOT_LINES.length)]!;
  const msg = pushChatMessage(ch.id, nick, text);
  if (!msg) return;
  if (chatOpen) {
    const log = app.querySelector("#chat-log");
    if (log) {
      const empty = log.querySelector(".chat-empty");
      if (empty) empty.remove();
      const row = document.createElement("div");
      row.className = "chat-msg";
      row.innerHTML = `<strong>${escapeHtml(nick)}</strong><span>${escapeHtml(text)}</span>`;
      log.appendChild(row);
      log.scrollTop = log.scrollHeight;
    }
  } else {
    applyHomeChatRail();
  }
}

function pauseChatSim(): void {
  if (!chatSimTimer) return;
  clearInterval(chatSimTimer);
  chatSimTimer = null;
}

function startChatSim(): void {
  if (!chatSimAllowed()) return;
  if (!chatConnected) connectChatSession(chatChannelId);
  if (chatSimTimer) return;
  ensureChatChannels();
  chatSimTimer = setInterval(() => simulateChatTick(), 14000);
}

function stopChatSim(): void {
  disconnectChatSession();
  pauseChatSim();
}

function renderHomeChatRail(): string {
  ensureChatChannels();
  const hasLine = Boolean(chatLineNick && chatLineText);
  const nick = hasLine ? escapeHtml(chatLineNick!) : "";
  const text = hasLine ? escapeHtml(chatLineText!) : "";
  return `<div class="home-chat-rail${hasLine ? " has-line" : ""}${chatLineUnread ? " has-unread" : ""}" id="home-chat-rail">
    <button type="button" class="home-chat-line${hasLine ? " has-line" : ""}${chatLineUnread ? " has-unread" : ""}" id="btn-home-chat" aria-expanded="${chatOpen ? "true" : "false"}" aria-controls="chat-layer" title="${escapeHtml(t("chat.open"))}" aria-label="${escapeHtml(chatLineUnread ? t("chat.ticker") : t("chat.open"))}">
      <span class="home-chat-line-ico" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M4 4.8A2.8 2.8 0 0 1 6.8 2h10.4A2.8 2.8 0 0 1 20 4.8v8.4a2.8 2.8 0 0 1-2.8 2.8H11l-4.2 3.2c-.7.5-1.7 0-1.7-.8v-2.4H6.8A2.8 2.8 0 0 1 4 13.2V4.8Z"/>
        </svg>
      </span>
      ${
        hasLine
          ? `<span class="home-chat-line-body">
        <strong class="home-chat-line-nick">${nick}</strong>
        <span class="home-chat-line-text">${text}</span>
      </span>`
          : ""
      }
      ${chatLineUnread ? `<span class="home-chat-badge" aria-hidden="true"></span>` : ""}
    </button>
  </div>`;
}

function applyHomeChatRail(): void {
  const rail = app.querySelector("#home-chat-rail");
  if (!rail) return;
  rail.outerHTML = renderHomeChatRail();
  app.querySelector("#btn-home-chat")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    openHomeChat();
  });
}

function openHomeChat(): void {
  ensureChatChannels();
  if (!chatConnected) connectChatSession(chatChannelId);
  chatLineUnread = false;
  chatOpen = true;
  mailboxOpen = false;
  notifOpen = false;
  settingsOpen = false;
  summonerPickerOpen = false;
  missionOpen = false;
  communityOpen = false;
  shopOpen = false;
  render();
  queueMicrotask(() => {
    const log = app.querySelector("#chat-log");
    if (log) log.scrollTop = log.scrollHeight;
  });
}

/** Close chat sheet without remounting the island. */
function closeChatOverlay(): void {
  if (!chatOpen) return;
  chatOpen = false;
  app.querySelector("#chat-layer")?.remove();
  applyHomeChatRail();
}

function bindChatUi(): void {
  app.querySelector("#btn-home-chat")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    openHomeChat();
  });
  app.querySelector("#btn-chat-close")?.addEventListener("click", () => {
    closeChatOverlay();
  });
  app.querySelector("#chat-channel-select")?.addEventListener("change", (ev) => {
    const sel = ev.currentTarget as HTMLSelectElement;
    const id = Number(sel.value);
    if (!Number.isFinite(id)) return;
    if (!switchChatSession(id)) {
      flash(t("chat.channelFull"));
      sel.value = String(chatChannelId);
      return;
    }
    chatLineUnread = false;
    render();
    queueMicrotask(() => {
      const log = app.querySelector("#chat-log");
      if (log) log.scrollTop = log.scrollHeight;
    });
  });
  app.querySelector("#chat-compose")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const input = app.querySelector<HTMLInputElement>("#chat-input");
    const text = input?.value.trim() ?? "";
    if (!text) return;
    if (!pushChatMessage(chatChannelId, displayNickname(), text)) return;
    if (input) input.value = "";
    chatLineUnread = false;
    render();
    queueMicrotask(() => {
      const log = app.querySelector("#chat-log");
      if (log) log.scrollTop = log.scrollHeight;
      app.querySelector<HTMLInputElement>("#chat-input")?.focus();
    });
  });
}

function renderChatModal(): string {
  if (!chatOpen) return "";
  ensureChatChannels();
  const ch = chatChannel(chatChannelId) ?? chatChannels[0]!;
  const options = chatChannels
    .map((c) => {
      const full = chatIsFull(c);
      const on = c.id === chatChannelId;
      const users = t("chat.channelUsers", { n: c.users, max: CHAT_CHANNEL_CAP });
      const label = `${t("chat.channelN", { n: c.id })} ${MIDDOT} ${users}${full ? ` ${MIDDOT} ${t("chat.full")}` : ""}`;
      return `<option value="${c.id}" ${on ? "selected" : ""} ${full && !on ? "disabled" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");
  const msgs =
    ch.msgs
      .map(
        (m) =>
          `<div class="chat-msg"><strong>${escapeHtml(m.nick)}</strong><span>${escapeHtml(m.text)}</span></div>`,
      )
      .join("") || `<p class="muted chat-empty">${escapeHtml(t("chat.empty"))}</p>`;
  return `<div class="settings-layer chat-layer" id="chat-layer" aria-hidden="false">
    <button type="button" class="settings-backdrop" id="btn-chat-close" aria-label="${escapeHtml(t("chat.close"))}"></button>
    <div class="settings-sheet chat-sheet" role="dialog" aria-modal="true" aria-labelledby="chat-title">
      <div class="settings-sheet-handle" aria-hidden="true"></div>
      ${modalCloseX(t("chat.close"), "btn-chat-close")}
      <h2 class="settings-title" id="chat-title">${escapeHtml(t("chat.title"))}</h2>
      <p class="chat-cap-hint">${escapeHtml(t("chat.capHint", { max: CHAT_CHANNEL_CAP }))}</p>
      <label class="chat-ch-select-wrap">
        <span class="chat-ch-select-label">${escapeHtml(t("chat.channelSelect"))}</span>
        <select id="chat-channel-select" class="chat-ch-select" aria-label="${escapeHtml(t("chat.channelSelect"))}">
          ${options}
        </select>
      </label>
      <div class="chat-log" id="chat-log">${msgs}</div>
      <form class="chat-compose" id="chat-compose">
        <input class="chat-input" id="chat-input" type="text" maxlength="80" autocomplete="off" placeholder="${escapeHtml(t("chat.placeholder"))}" />
        <button type="submit" class="chat-send">${escapeHtml(t("chat.send"))}</button>
      </form>
    </div>
  </div>`;
}




function missionItemHtml(opts: {
  title: string;
  desc: string;
  cur: number;
  max: number;
  goNav?: string;
}): string {
  const done = opts.cur >= opts.max;
  const pct = opts.max > 0 ? Math.min(100, Math.round((opts.cur / opts.max) * 100)) : 0;
  const go = opts.goNav
    ? `<button type="button" class="mission-item-go" data-mission-go="${opts.goNav}">${t("mission.go")}</button>`
    : "";
  return `<article class="mission-item${done ? " is-done" : ""}">
    <div class="mission-item-top">
      <div class="mission-item-copy">
        <strong class="mission-item-title">${opts.title}</strong>
        <p class="mission-item-desc">${opts.desc}</p>
      </div>
      <span class="mission-item-status">${done ? t("mission.done") : t("mission.inProgress")}</span>
    </div>
    <div class="mission-item-bar" role="progressbar" aria-valuenow="${opts.cur}" aria-valuemin="0" aria-valuemax="${opts.max}">
      <i style="width:${pct}%"></i>
    </div>
    <div class="mission-item-foot">
      <span class="mission-item-prog">${t("mission.progress", { cur: Math.min(opts.cur, opts.max), max: opts.max })}</span>
      ${go}
    </div>
  </article>`;
}

function renderMissionDailyList(): string {
  const day = todayKey();
  const wishDone = (save.island.lastWishDay ?? null) === day;
  const drills = save.dojoDrills ?? 0;
  const dojoCur = drills % 3;
  const pond = save.island.buildings.find((b) => b.id === "mana_pond");
  const mine = save.island.buildings.find((b) => b.id === "crystal_mine");
  const stored =
    Math.floor(pond?.storedMana ?? 0) + Math.floor(mine?.storedCrystal ?? 0);
  const collectDone = stored <= 0;
  const sortieDone = (save.clearedStages?.length ?? 0) > 0 && Math.floor(save.island.energy) < (save.island.energyMax ?? 100);
  return [
    missionItemHtml({
      title: t("mission.daily.wish.title"),
      desc: t("mission.daily.wish.desc"),
      cur: wishDone ? 1 : 0,
      max: 1,
      goNav: "wish",
    }),
    missionItemHtml({
      title: t("mission.daily.dojo.title"),
      desc: t("mission.daily.dojo.desc"),
      cur: dojoCur === 0 && drills > 0 ? 3 : dojoCur,
      max: 3,
      goNav: "dojo",
    }),
    missionItemHtml({
      title: t("mission.daily.collect.title"),
      desc: t("mission.daily.collect.desc"),
      cur: collectDone ? 1 : 0,
      max: 1,
      goNav: "home",
    }),
    missionItemHtml({
      title: t("mission.daily.sortie.title"),
      desc: t("mission.daily.sortie.desc"),
      cur: sortieDone ? 1 : 0,
      max: 1,
      goNav: "stages",
    }),
  ].join("");
}

function renderMissionAchieveList(): string {
  const lv = save.island.summonerLevel ?? 1;
  const cleared = save.clearedStages?.length ?? 0;
  const roster = save.roster?.length ?? 0;
  const gloryLv = Object.values(save.gloryLevels ?? {}).reduce(
    (n, v) => n + (typeof v === "number" ? v : 0),
    0,
  );
  const guildOk = Boolean(save.guildName);
  return [
    missionItemHtml({
      title: t("mission.ach.lv5.title"),
      desc: t("mission.ach.lv5.desc"),
      cur: lv,
      max: 5,
    }),
    missionItemHtml({
      title: t("mission.ach.lv10.title"),
      desc: t("mission.ach.lv10.desc"),
      cur: lv,
      max: 10,
    }),
    missionItemHtml({
      title: t("mission.ach.clear5.title"),
      desc: t("mission.ach.clear5.desc"),
      cur: cleared,
      max: 5,
      goNav: "stages",
    }),
    missionItemHtml({
      title: t("mission.ach.clear15.title"),
      desc: t("mission.ach.clear15.desc"),
      cur: cleared,
      max: 15,
      goNav: "stages",
    }),
    missionItemHtml({
      title: t("mission.ach.roster4.title"),
      desc: t("mission.ach.roster4.desc"),
      cur: roster,
      max: 4,
      goNav: "summon",
    }),
    missionItemHtml({
      title: t("mission.ach.glory.title"),
      desc: t("mission.ach.glory.desc"),
      cur: gloryLv > 0 ? 1 : 0,
      max: 1,
      goNav: "glory",
    }),
    missionItemHtml({
      title: t("mission.ach.guild.title"),
      desc: t("mission.ach.guild.desc"),
      cur: guildOk ? 1 : 0,
      max: 1,
      goNav: "guild",
    }),
  ].join("");
}

function renderMissionModal(): string {
  const daily = missionTab === "daily";
  return `<div class="settings-layer mission-layer" id="mission-layer" ${missionOpen ? "" : "hidden"} aria-hidden="${missionOpen ? "false" : "true"}">
  <button type="button" class="settings-backdrop" id="btn-mission-close" aria-label="${escapeHtml(t("mission.close"))}"></button>
  <div class="settings-sheet mission-sheet" role="dialog" aria-modal="true" aria-labelledby="mission-title">
    <div class="settings-sheet-handle" aria-hidden="true"></div>
    ${modalCloseX(t("mission.close"), "btn-mission-close")}
    <h2 class="settings-title" id="mission-title">${escapeHtml(t("mission.title"))}</h2>
    <div class="mission-tabs" role="tablist" aria-label="${escapeHtml(t("mission.title"))}">
      <button type="button" class="mission-tab${daily ? " is-active" : ""}" role="tab" aria-selected="${daily ? "true" : "false"}" data-mission-tab="daily">${escapeHtml(t("mission.tabDaily"))}</button>
      <button type="button" class="mission-tab${!daily ? " is-active" : ""}" role="tab" aria-selected="${!daily ? "true" : "false"}" data-mission-tab="achievements">${escapeHtml(t("mission.tabAchieve"))}</button>
    </div>
    <div class="mission-list" role="tabpanel">
      ${daily ? renderMissionDailyList() : renderMissionAchieveList()}
    </div>
  </div>
</div>`;
}

function render(): void {
  clearEnergyRegenTimer();
  if (!bootReady) {
    app.classList.add("auth-mode");
    app.classList.remove("home-mode");
    app.innerHTML = `<main class="auth-main auth-main--center">${authHeroLayer()}
      <div class="auth-screen auth-screen--form">
      ${authBrand()}
        <p class="auth-copy">${escapeHtml(t("boot.loading"))}</p>
      </div>
      ${authFooter()}
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
  const tabSummoner = summonerPickerOpen;
  const tabMonster = view === "enhance" || view === "fusion" || view === "party";
  const tabMission = missionOpen;
  const tabCommunity = communityOpen;
  const tabShop = shopOpen;
  const demoTag = sessionUser?.kind === "demo" ? `<span class="demo-tag">DEMO</span>` : "";
  const mailItems = [
    {
      title: t("mail.welcomeTitle"),
      body: t("mail.welcomeBody"),
      tag: t("mail.tagEvent"),
    },
    {
      title: t("mail.dailyTitle"),
      body: t("mail.dailyBody"),
      tag: t("mail.tagReward"),
    },
  ];
  const notifItems = tickerMessages().slice(0, 5);

  if (view === "auth") {
    stopChatSim();
    chatOpen = false;
  } else if (view === "battle" || view === "result") {
    pauseChatSim();
    chatOpen = false;
  } else {
    startChatSim();
  }

  if (view === "auth") {
    app.classList.add("auth-mode");
    app.classList.remove("home-mode");
    app.classList.remove("expedition-mode");
    app.classList.remove("combat-mode");
    app.classList.remove("monster-mode");
    app.innerHTML = `
      <main class="auth-main auth-main--center">${renderAuth()}${authFooter()}</main>
      ${toast ? `<p class="toast auth-toast">${toast}</p>` : ""}
    `;
    bind();
    if (toast) {
      const toastText = toast;
      toast = "";
      setTimeout(() => {
        if (!toast) {
          const el = app.querySelector(".toast");
          if (el) el.remove();
        }
        void toastText;
      }, 2200);
    }
    return;
  }

  const activeSum = getActiveSummoner(save);
  const activeEl = save.activeSummoner ?? "light";
  const isHome = view === "home";
  const isStages = view === "stages";
  const nick = escapeHtml(displayNickname());
  const userLv = island.summonerLevel;
  const userExp = Math.floor(island.summonerExp ?? 0);
  const accountLabel = escapeHtml(
    sessionUser?.email ||
      (sessionUser?.kind === "demo"
        ? t("account.demo")
        : sessionUser?.kind === "guest"
          ? t("account.guest")
          : t("account.default")),
  );
  const rosterForPicker = save.summoners ?? createSummonerRoster();
  const summonerPickerList = SUMMONER_ELEMENTS.map((el) => {
    const p = rosterForPicker[el];
    const on = el === activeEl;
    const aw = p.awaken > 0 ? ` - ${t("summonerPicker.awaken", { n: p.awaken })}` : "";
    return `<button type="button" class="summoner-pick${on ? " is-active" : ""}" data-summoner="${el}" ${on ? "disabled" : ""}>
      <img class="summoner-pick-art" src="/art/summoner/${el}.webp" width="44" height="44" alt="" draggable="false" decoding="async" />
      <span class="summoner-pick-body">
        <strong>${escapeHtml(t("summonerPicker.summoner", { element: elementLabel(el) }))}</strong>
        <small>Lv.${p.level}${aw}${on ? ` - ${escapeHtml(t("summonerPicker.active"))}` : ""}</small>
      </span>
    </button>`;
  }).join("");

  app.classList.remove("auth-mode");
  app.classList.toggle("home-mode", view === "home");
  app.classList.toggle("expedition-mode", isStages);
  app.classList.toggle("combat-mode", view === "battle" || view === "result");
  app.classList.toggle("monster-mode", view === "enhance");
  app.innerHTML = `
    <header class="app-bar app-bar--hud${isHome ? " app-bar--home" : ""}${isStages ? " app-bar--expedition" : ""}">
      <div class="app-bar-hud">
        <div class="hud-profile" title="${nick}">
          <div class="user-profile" aria-label="Lv.${userLv}">
            <img class="user-profile-img" src="/art/auth/logo-mark-192.png" width="40" height="40" alt="" />
            <span class="user-profile-lv">Lv.${userLv}</span>
            <div class="user-profile-foot">
              <div class="user-profile-exp" role="progressbar" aria-valuenow="${userExp}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(t("profile.exp", { n: userExp }))}">
                <div class="user-profile-exp-fill" style="width:${Math.min(100, userExp)}%"></div>
              </div>
            </div>
          </div>
          <div class="user-profile-info">
            <p class="user-profile-nick">${nick}${demoTag ? ` ${demoTag}` : ""}</p>
            ${
              isHome
                ? ""
                : `<p class="user-profile-sub">${escapeHtml(elementLabel(activeEl))} Lv.${activeSum.level}${
                    activeSum.awaken > 0 ? ` - ${escapeHtml(t("summonerPicker.awaken", { n: activeSum.awaken }))}` : ""
                  }</p>`
            }
          </div>
        </div>
        <div class="res-wallet" role="group" aria-label="${escapeHtml(t("res.wallet"))}">
          <div class="res-item res-item--energy${Math.floor(island.energy) < (island.energyMax ?? 100) ? " has-timer" : ""}" title="${escapeHtml(t("res.energy"))}">
            <div class="res-energy-row">
              <span class="res-energy-ico-wrap">
                <img class="res-ico" src="/art/ui/res/energy.svg" width="14" height="14" alt="" draggable="false" />
              </span>
              <strong class="res-val" id="res-energy-val">${Math.floor(island.energy)}<small>/${island.energyMax ?? 100}</small></strong>
            </div>
            <span class="res-energy-timer" id="res-energy-timer"${Math.floor(island.energy) < (island.energyMax ?? 100) ? "" : " hidden"}>${
              Math.floor(island.energy) < (island.energyMax ?? 100)
                ? fmtEnergyRegen(energyRegenRemainingMs(island) ?? ENERGY_REGEN_MS)
                : ""
            }</span>
          </div>
          <div class="res-item res-item--gold" title="${escapeHtml(t("res.gold"))}">
            <img class="res-ico" src="/art/ui/res/gold.svg" width="14" height="14" alt="" draggable="false" />
            <strong class="res-val">${fmtRes(island.mana)}</strong>
          </div>
          <div class="res-item res-item--crystal" title="${escapeHtml(t("res.crystal"))}">
            <img class="res-ico" src="/art/ui/res/crystal.svg" width="14" height="14" alt="" draggable="false" />
            <strong class="res-val">${fmtRes(island.crystal)}</strong>
          </div>
          <button type="button" class="res-more-btn${resMoreOpen ? " is-open" : ""}" id="btn-res-more" aria-expanded="${resMoreOpen ? "true" : "false"}" aria-controls="res-more-panel" title="${escapeHtml(resMoreOpen ? t("res.moreClose") : t("res.moreOpen"))}" aria-label="${escapeHtml(resMoreOpen ? t("res.moreClose") : t("res.moreOpen"))}">
            <span class="res-more-chevron" aria-hidden="true"></span>
          </button>
          <div class="res-more-panel${resMoreOpen ? " is-open" : ""}" id="res-more-panel" role="region" aria-label="${escapeHtml(t("res.more"))}" ${resMoreOpen ? "" : "hidden"}>
            <div class="res-item res-item--scroll" title="${escapeHtml(t("res.scrollNormal"))}">
              <img class="res-ico" src="/art/ui/res/scroll.svg" width="16" height="16" alt="" draggable="false" />
              <strong class="res-val">${fmtRes(scrollCount(save, "normal"))}</strong>
            </div>
            <div class="res-item res-item--scroll" title="${escapeHtml(t("res.scrollPremium"))}">
              <img class="res-ico" src="/art/ui/res/scroll.svg" width="16" height="16" alt="" draggable="false" />
              <strong class="res-val">${fmtRes(scrollCount(save, "premium"))}</strong>
            </div>
            <div class="res-item res-item--scroll" title="${escapeHtml(t("res.scrollMystic"))}">
              <img class="res-ico" src="/art/ui/res/scroll.svg" width="16" height="16" alt="" draggable="false" />
              <strong class="res-val">${fmtRes(scrollCount(save, "mystic"))}</strong>
            </div>
            <div class="res-item res-item--glory" title="${escapeHtml(t("res.glory"))}">
              <img class="res-ico" src="/art/ui/res/glory.svg" width="16" height="16" alt="" draggable="false" />
              <strong class="res-val">${fmtRes(save.gloryPoints ?? 0)}</strong>
            </div>
            <div class="res-item res-item--jinmun" title="${escapeHtml(t("res.jinmun"))}">
              <img class="res-ico" src="/art/ui/res/jinmun.svg" width="16" height="16" alt="" draggable="false" />
              <strong class="res-val">${fmtRes(save.jinmunStones ?? 0)}</strong>
            </div>
            <div class="res-item res-item--guild" title="${escapeHtml(t("res.guild"))}">
              <img class="res-ico" src="/art/ui/res/guild.svg" width="16" height="16" alt="" draggable="false" />
              <strong class="res-val">${fmtRes(save.guildContribution ?? 0)}</strong>
            </div>
            <div class="res-item res-item--arena" title="${escapeHtml(t("res.arena"))}">
              <img class="res-ico" src="/art/ui/res/arena.svg" width="16" height="16" alt="" draggable="false" />
              <strong class="res-val">${fmtRes(save.arenaSeasonWins ?? 0)}</strong>
            </div>
          </div>
        </div>
      </div>
      ${isHome ? "" : renderHomeChatRail()}
      ${
        isStages
          ? `<button type="button" class="stages-map-back" data-nav="home" aria-label="${t("ui.d758337556")}">
        <img class="stages-map-back-ico" src="/art/ui/back-arrow.svg" width="18" height="18" alt="" draggable="false" />
        <span>${t("ui.d758337556")}</span>
      </button>`
          : ""
      }
      ${toast ? `<p class="toast">${toast}</p>` : ""}
    </header>
    <main>${mainContent(manaPct)}</main>
    <div class="settings-layer" id="settings-layer" ${settingsOpen ? "" : "hidden"} aria-hidden="${settingsOpen ? "false" : "true"}">
      <button type="button" class="settings-backdrop" id="btn-settings-close" aria-label="${escapeHtml(t("settings.close"))}"></button>
      <div class="settings-sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div class="settings-sheet-handle" aria-hidden="true"></div>
        ${modalCloseX(t("settings.close"), "btn-settings-close")}
        <h2 class="settings-title" id="settings-title">${escapeHtml(t("settings.title"))}</h2>
        <p class="settings-account">${accountLabel}</p>
        <label class="settings-lang" for="settings-lang">
          <span class="settings-lang-label">${escapeHtml(t("settings.language"))}</span>
          <span class="settings-lang-hint">${escapeHtml(t("settings.languageHint"))}</span>
          <select id="settings-lang" class="settings-lang-select" aria-label="${escapeHtml(t("settings.language"))}">
            ${languageOptionsHtml()}
          </select>
        </label>
        <button type="button" class="settings-logout" id="btn-logout">${escapeHtml(t("settings.logout"))}</button>
      </div>
    </div>
    ${
      `<div class="settings-layer" id="summoner-picker-layer" ${summonerPickerOpen ? "" : "hidden"} aria-hidden="${summonerPickerOpen ? "false" : "true"}">
      <button type="button" class="settings-backdrop" id="btn-summoner-picker-close" aria-label="${escapeHtml(t("summonerPicker.close"))}"></button>
      <div class="settings-sheet summoner-picker-sheet" role="dialog" aria-modal="true" aria-labelledby="summoner-picker-title">
        <div class="settings-sheet-handle" aria-hidden="true"></div>
        ${modalCloseX(t("summonerPicker.close"), "btn-summoner-picker-close")}
        <h2 class="settings-title" id="summoner-picker-title">${escapeHtml(t("summonerPicker.title"))}</h2>
        <p class="settings-account">${escapeHtml(t("summonerPicker.hint"))}</p>
        <div class="summoner-picker-list">${summonerPickerList}</div>
      </div>
    </div>`
    }
    ${
      isHome
        ? `<aside class="side-quick" aria-label="${escapeHtml(t("side.quick"))}">
      <button type="button" class="side-quick-btn${mailboxOpen ? " is-open" : ""}" id="btn-mailbox" aria-expanded="${mailboxOpen ? "true" : "false"}" aria-controls="mailbox-layer" title="${escapeHtml(t("mailbox.title"))}">
        <span class="side-quick-glow" aria-hidden="true"></span>
        <span class="seal-badge seal-badge--side">
          <span class="side-quick-ico" aria-hidden="true">
            <img class="side-quick-img" src="/art/ui/nav/mail.webp" width="52" height="52" alt="" draggable="false" />
          </span>
          <span class="side-quick-caption">${escapeHtml(t("side.mailbox"))}</span>
        </span>
        <span class="side-quick-badge" aria-label="${escapeHtml(t("mailbox.badge"))}">2</span>
      </button>
      <button type="button" class="side-quick-btn${notifOpen ? " is-open" : ""}" id="btn-notif" aria-expanded="${notifOpen ? "true" : "false"}" aria-controls="notif-layer" title="${escapeHtml(t("notif.title"))}">
        <span class="side-quick-glow" aria-hidden="true"></span>
        <span class="seal-badge seal-badge--side">
          <span class="side-quick-ico" aria-hidden="true">
            <img class="side-quick-img" src="/art/ui/nav/notif.webp" width="52" height="52" alt="" draggable="false" />
          </span>
          <span class="side-quick-caption">${escapeHtml(t("side.notif"))}</span>
        </span>
        <span class="side-quick-dot" aria-hidden="true"></span>
      </button>
      <button type="button" class="side-quick-btn${settingsOpen ? " is-open" : ""}" id="btn-settings" aria-expanded="${settingsOpen ? "true" : "false"}" aria-controls="settings-layer" title="${escapeHtml(t("nav.settings"))}">
        <span class="side-quick-glow" aria-hidden="true"></span>
        <span class="seal-badge seal-badge--side">
          <span class="side-quick-ico" aria-hidden="true">
            <img class="side-quick-img" src="/art/ui/nav/settings.svg" width="52" height="52" alt="" draggable="false" />
          </span>
          <span class="side-quick-caption">${escapeHtml(t("nav.settings"))}</span>
        </span>
      </button>
    </aside>`
        : ""
    }
    ${renderChatModal()}
    <div class="settings-layer" id="mailbox-layer" ${mailboxOpen ? "" : "hidden"} aria-hidden="${mailboxOpen ? "false" : "true"}">
      <button type="button" class="settings-backdrop" id="btn-mailbox-close" aria-label="${escapeHtml(t("mailbox.close"))}"></button>
      <div class="settings-sheet quick-sheet" role="dialog" aria-modal="true" aria-labelledby="mailbox-title">
        <div class="settings-sheet-handle" aria-hidden="true"></div>
        ${modalCloseX(t("mailbox.close"), "btn-mailbox-close")}
        <h2 class="settings-title" id="mailbox-title">${escapeHtml(t("mailbox.title"))}</h2>
        <p class="settings-account">${escapeHtml(t("mailbox.empty"))}</p>
        <div class="quick-sheet-list">${mailItems
        .map(
          (m) => `<article class="quick-sheet-item">
          <span class="quick-sheet-tag">${escapeHtml(m.tag)}</span>
          <strong class="quick-sheet-title">${escapeHtml(m.title)}</strong>
          <p class="quick-sheet-body">${escapeHtml(m.body)}</p>
        </article>`,
        )
        .join("")}</div>
      </div>
    </div>
    <div class="settings-layer" id="notif-layer" ${notifOpen ? "" : "hidden"} aria-hidden="${notifOpen ? "false" : "true"}">
      <button type="button" class="settings-backdrop" id="btn-notif-close" aria-label="${escapeHtml(t("notif.close"))}"></button>
      <div class="settings-sheet quick-sheet" role="dialog" aria-modal="true" aria-labelledby="notif-title">
        <div class="settings-sheet-handle" aria-hidden="true"></div>
        ${modalCloseX(t("notif.close"), "btn-notif-close")}
        <h2 class="settings-title" id="notif-title">${escapeHtml(t("notif.title"))}</h2>
        <p class="settings-account">${escapeHtml(t("notif.empty"))}</p>
        <div class="quick-sheet-list">${notifItems
        .map((n) => `<article class="quick-sheet-item"><p class="quick-sheet-body">${escapeHtml(n)}</p></article>`)
        .join("")}</div>
      </div>
    </div>
    ${renderMissionModal()}
    ${renderCommunityModal()}
    ${renderShopModal()}
    <nav class="tabs tabs--overlay" aria-label="${escapeHtml(t("nav.main"))}">
      <button type="button" data-nav="stages" class="${tabBattle ? "active" : ""}"><span class="seal-badge"><span class="tab-ico tab-ico--battle" aria-hidden="true"><img class="tab-ico-img" src="/art/ui/nav/battle.webp" width="58" height="58" alt="" draggable="false" /></span><span class="tab-label">${escapeHtml(t("nav.battle"))}</span></span></button>
      <button type="button" id="btn-nav-summoner" class="${tabSummoner ? "active" : ""}" aria-expanded="${summonerPickerOpen ? "true" : "false"}" aria-controls="summoner-picker-layer" title="${escapeHtml(t("nav.summoner"))}">
        <span class="seal-badge seal-badge--summoner">
          <span class="tab-ico tab-summoner-face" aria-hidden="true">
            <img class="tab-ico-img tab-summoner-seal" src="/art/ui/nav/summoner-frame.webp" width="58" height="58" alt="" draggable="false" decoding="async" />
            <img class="tab-summoner-art" src="/art/summoner/${activeEl}.webp" width="42" height="42" alt="" draggable="false" decoding="async" />
            <span class="tab-summoner-lv">Lv.${activeSum.level}</span>
          </span>
          <span class="tab-label">${escapeHtml(t("nav.summoner"))}</span>
        </span>
      </button>
      <button type="button" data-nav="enhance" class="${tabMonster ? "active" : ""}"><span class="seal-badge"><span class="tab-ico tab-ico--monster" aria-hidden="true"><img class="tab-ico-img" src="/art/ui/nav/monster.webp" width="58" height="58" alt="" draggable="false" /></span><span class="tab-label">${escapeHtml(t("nav.monster"))}</span></span></button>
      <button type="button" id="btn-mission" class="${missionOpen ? "active" : ""}" aria-expanded="${missionOpen ? "true" : "false"}" aria-controls="mission-layer" title="${escapeHtml(t("nav.mission"))}"><span class="seal-badge"><span class="tab-ico tab-ico--mission" aria-hidden="true"><img class="tab-ico-img" src="/art/ui/nav/mission.webp" width="58" height="58" alt="" draggable="false" /></span><span class="tab-label">${escapeHtml(t("nav.mission"))}</span></span></button>
      <button type="button" id="btn-community" class="${tabCommunity ? "active" : ""}" aria-expanded="${communityOpen ? "true" : "false"}" aria-controls="community-layer" title="${escapeHtml(t("nav.community"))}"><span class="seal-badge"><span class="tab-ico tab-ico--community" aria-hidden="true"><img class="tab-ico-img" src="/art/ui/nav/community.webp" width="58" height="58" alt="" draggable="false" /></span><span class="tab-label">${escapeHtml(t("nav.community"))}</span></span></button>
      <button type="button" id="btn-shop" class="${tabShop ? "active" : ""}" aria-expanded="${shopOpen ? "true" : "false"}" aria-controls="shop-layer" title="${escapeHtml(t("nav.shop"))}"><span class="seal-badge"><span class="tab-ico tab-ico--shop" aria-hidden="true"><img class="tab-ico-img" src="/art/ui/nav/shop.webp" width="58" height="58" alt="" draggable="false" /></span><span class="tab-label">${escapeHtml(t("nav.shop"))}</span></span></button>
    </nav>
  `;

  bind();
  if (toast) {
    const toastText = toast;
    toast = "";
    setTimeout(() => {
      if (!toast) {
        const el = app.querySelector(".toast");
        if (el && el.textContent === toastText) el.remove();
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
    const emblemSrc = `/art/hub/bldg-${toneKey}.webp`;
    const pos = resolveIslandSpotPos(id, x, y);
    x = pos.x;
    y = pos.y;
    const depth = Math.max(0, Math.min(1, y / 100));
    const spotScale = (0.68 + depth * 0.5).toFixed(3);
    const spotZ = Math.round(10 + y);
    const focus =
      islandLayoutEdit && islandSpotDrag?.id === id ? " is-layout-focus" : "";
    const bubbleIcon =
      opts?.bubbleKind === "crystal"
        ? "/art/ui/res/crystal.svg"
        : "/art/ui/res/gold.svg";
    const bubble =
      !locked && opts?.bubble && opts.bubbleKind
        ? `<span class="res-bubble res-bubble--${opts.bubbleKind}" data-collect="${opts.bubbleKind}" role="button" tabindex="0" aria-label="${t('ui.4215c0df88')}"><img class="res-bubble-ico" src="${bubbleIcon}" width="18" height="18" alt="" draggable="false" /><strong class="res-bubble-val">${opts.bubble}</strong></span>`
        : "";
    const unlock =
      locked && opts?.unlockLv
        ? `<span class="island-spot-lv">Lv.${opts.unlockLv}</span>`
        : "";
    const displayTitle =
      id === "guild" && title && !looksBrokenLabel(title)
        ? title
        : islandSpotTitle(id, title);
    const label = locked && opts?.unlockLv
      ? `${displayTitle} ${ARROW_RIGHT} Lv.${opts.unlockLv} ${t('ui.d1496ce82d')}`
      : displayTitle;
    return `<button type="button" class="island-spot${tone}${locked ? " is-locked" : ""}${islandLayoutEdit ? " is-layout-edit" : ""}${focus}" style="left:${x}%;top:${y}%;--spot-scale:${spotScale};z-index:${spotZ}" data-b="${id}" data-locked="${locked ? "1" : "0"}" ${opts?.unlockLv ? `data-unlock="${opts.unlockLv}"` : ""} aria-label="${label}">
      <span class="island-spot-art" aria-hidden="true">
        <span class="island-spot-glow"></span>
        <img class="island-spot-img" src="${emblemSrc}" width="512" height="512" alt="" draggable="false" decoding="async" />
      </span>
      ${locked ? lockSvg : ""}
      <span class="island-spot-name">${displayTitle}</span>
      ${unlock}
      ${bubble}
    </button>`;
  };

  return `<div class="home-island">
    ${renderHomeChatRail()}
    ${
      islandLayoutEdit
        ? `<div class="island-edit-hud" role="toolbar" aria-label="${t('ui.1ac9a0470a')}">
      <div class="island-edit-hud-copy">
        <strong>${t('ui.78296b2020')}</strong>
        <small>${t('ui.c45b8eb502')}</small>
      </div>
      <button type="button" class="secondary" id="btn-island-layout-reset">${t('ui.ff75b4ff24')}</button>
      <button type="button" class="auth-btn-primary" id="btn-island-layout-done">${t('ui.8d8680373c')}</button>
    </div>`
        : ""
    }
    <div class="island-viewport${islandLayoutEdit ? " is-layout-edit" : ""}" id="island-viewport">
      <div class="island-world" id="island-world" style="--island-zoom:${islandZoom.toFixed(4)};transform:translate3d(${islandPan.x}px,${islandPan.y}px,0) rotateX(${ISLAND_ROTATE_X_DEG}deg) scale(${ISLAND_BASE_SCALE})">
        <img
          class="island-map-img"
          src="/art/home/home-island-bg@2x.webp"
          width="1440"
          height="2560"
          alt=""
          draggable="false"
          decoding="async"
        />
        <div class="island-map-veil" aria-hidden="true"></div>
        ${
          islandLayoutEdit
            ? `<div class="island-build-zone" aria-hidden="true" style="left:${ISLAND_LAYOUT_BOUNDS.minX}%;top:${ISLAND_LAYOUT_BOUNDS.minY}%;width:${ISLAND_LAYOUT_BOUNDS.maxX - ISLAND_LAYOUT_BOUNDS.minX}%;height:${ISLAND_LAYOUT_BOUNDS.maxY - ISLAND_LAYOUT_BOUNDS.minY}%">
          <div class="island-build-zone-pad"></div>
          <div class="island-build-zone-grid"></div>
          <span class="island-build-zone-label">${t('ui.58c0079ead')}</span>
        </div>`
            : ""
        }
        ${spot("summon_hearth", islandSpotTitle("summon_hearth"), 30, 44, { tone: "summon", sub: `${t('ui.fa73f3a42f')} ${save.scrolls}${t('ui.b241493768')}` })}
        ${spot("power_circle", islandSpotTitle("power_circle"), 50, 27, { tone: "forge", sub: t('ui.1ab42b48a4') })}
        ${spot("gateway", islandSpotTitle("gateway"), 72, 40, { tone: "gate", sub: t('ui.13c82de693') })}
        ${spot("mana_pond", islandSpotTitle("mana_pond"), 24, 58, {
                  tone: "pond",
                  sub: `Lv.${pondLv} ${"\u00B7"} ${t('ui.df72a8753d')} ${storedMana}/${pondCap}`,
                  bubble: storedMana > 0 ? String(storedMana) : undefined,
                  bubbleKind: storedMana > 0 ? "mana" : undefined,
                })}
        ${spot("shop", islandSpotTitle("shop"), 52, 52, { tone: "shop", sub: t('ui.ed3a862c2c') })}
        ${spot("party", islandSpotTitle("party"), 76, 56, { tone: "party", sub: `${save.party.length}/4` })}
        ${spot("wish", islandSpotTitle("wish"), 18, 40, {
                  tone: "wish",
                  locked: !hasWish,
                  unlockLv: 7,
                  sub: hasWish ? t('ui.6ca75b551e') : undefined,
                })}
        ${spot("dojo", islandSpotTitle("dojo"), 40, 70, {
                  tone: "dojo",
                  locked: !dojoOk,
                  unlockLv: 8,
                  sub: dojoOk ? `${t('ui.ca119dd0f6')} ${save.dojoDrills ?? 0}${t('ui.2fc05c02be')}` : undefined,
                })}
        ${spot("crystal_mine", islandSpotTitle("crystal_mine"), 66, 68, {
                  tone: "mine",
                  locked: !mineOk,
                  unlockLv: 10,
                  sub: mineOk ? `${t('ui.df72a8753d')} ${storedCrystal}` : undefined,
                  bubble: mineOk && storedCrystal > 0 ? String(storedCrystal) : undefined,
                  bubbleKind: mineOk && storedCrystal > 0 ? "crystal" : undefined,
                })}
        ${spot("glory", islandSpotTitle("glory"), 86, 74, { tone: "glory", sub: `${t('ui.ba0c9e096f')} ${save.gloryPoints ?? 0}` })}
        ${spot("guild", save.guildName ? save.guildName : islandSpotTitle("guild"), 28, 82, {
                  tone: "guild",
                  locked: !guildOk,
                  unlockLv: 12,
                  sub: guildOk ? t('ui.d55c6d0b00') : undefined,
                })}
        ${spot("fusion", islandSpotTitle("fusion"), 58, 86, {
                  tone: "fusion",
                  locked: !fusionOk,
                  unlockLv: 17,
                  sub: fusionOk ? t('ui.1074e15059') : undefined,
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
  const label = opts?.label ?? t('ui.ac9d7edf0f');
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
      ${navBackBtn({ nav: "home", label: t('ui.1a7f31cadb') })}
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
  const title = forgeReveal.kind === "grind" ? t('ui.d8680bb7b3') : t('ui.27cf021299');
  const mark = forgeReveal.kind === "grind" ? Mark.grind : Mark.imprint;
  return `<div class="forge-reveal forge-reveal--${forgeReveal.kind}" aria-live="polite">
    <p class="forge-reveal-kicker"><span class="forge-reveal-mark" aria-hidden="true">${mark}</span>${title}</p>
    <div class="forge-reveal-diff">
      <p class="forge-before">${forgeReveal.before}</p>
      <p class="forge-arrow" aria-hidden="true">${ARROW_DOWN}</p>
      <p class="forge-after">${forgeReveal.after}</p>
    </div>
    <p class="forge-reveal-cost muted">${forgeReveal.cost}</p>
    <button type="button" class="secondary full auth-btn-ghost" id="btn-forge-dismiss">${t('ui.468266d639')}</button>
  </div>`;
}

function renderFusionReveal(): string {
  if (!fusionReveal) return "";
  return `<div class="forge-reveal forge-reveal--fusion" aria-live="polite">
    <p class="forge-reveal-kicker"><span class="forge-reveal-mark" aria-hidden="true">${Mark.fusion}</span>${t('ui.0b4d534507')}</p>
    <div class="forge-reveal-diff">
      <p class="forge-before">${fusionReveal.materials}</p>
      <p class="forge-arrow" aria-hidden="true">${ARROW_DOWN}</p>
      <p class="forge-after">${fusionReveal.result}</p>
    </div>
    <p class="forge-reveal-cost muted">${fusionReveal.cost}</p>
    <button type="button" class="secondary full auth-btn-ghost" id="btn-fusion-dismiss">${t('ui.468266d639')}</button>
  </div>`;
}

function renderDojo(): string {
  const drills = save.dojoDrills ?? 0;
  const rem = drills % 3;
  const untilMission = rem === 0 ? 3 : 3 - rem;
  const nextIsMission = rem === 2;
  const nextNote = nextIsMission
    ? t('ui.4ae6a748b6')
    : `${t('ui.210ca7ad33')} ${untilMission}${t('ui.2fc05c02be')}`;
  const manaGain = 120 + save.island.summonerLevel * 8;
  return hubShell(
    t('ui.81e2301960'),
    `${t('ui.ca119dd0f6')} ${drills}${t('ui.5d8e2b5c4a')} Lv.${save.island.summonerLevel}`,
    `<div class="hub-panel">
      <div class="dojo-panel">
        <p class="dojo-panel-title">${t('ui.1365952072')}</p>
        <div class="dojo-stats">
          <div class="dojo-stat">
            <span class="dojo-stat-label">${t('ui.c7b8d42347')}</span>
            <strong>${drills}</strong>
          </div>
          <div class="dojo-stat">
            <span class="dojo-stat-label">${t('ui.c7b8d42347')}</span>
            <strong>${nextNote}</strong>
          </div>
        </div>
        <p class="muted dojo-hint">1${t('ui.d975611bf8')} +${manaGain} ${MIDDOT} EXP +15</p>
        <button type="button" class="primary full" id="btn-dojo-drill">${t('ui.23a04d1293')}</button>
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
    t('ui.81e2301960'),
    `Lv.${lv} ${MIDDOT} ${rate}/hr ${MIDDOT} ${t('ui.1f1712acff')} ${stored}/${cap}`,
    `<div class="hub-panel">
      <div class="pond-panel">
        <p class="pond-panel-title">${t('ui.7c70400fef')}</p>
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
          <span class="stage-card-mark" aria-hidden="true">${Mark.pond}</span>
          <span class="stage-card-body">
            <strong>${t('ui.b3fe16e64a')}</strong>
            <small>${stored > 0 ? `${t('ui.df72a8753d')} ${stored}` : t('ui.2c1116fb7b')}</small>
          </span>
        </button>
        <button type="button" class="stage-card" id="btn-pond-upgrade" ${maxed ? "disabled" : ""}>
          <span class="stage-card-mark" aria-hidden="true">${ARROW_UP}</span>
          <span class="stage-card-body">
            <strong>${maxed ? t('ui.cc24e86471') : `${t('ui.e5f5d19099')} ${ARROW_RIGHT} Lv.${lv + 1}`}</strong>
            <small>${maxed ? `MAX ${MAX_BUILDING_LEVEL}` : `${MINUS}${t('ui.dc78e6a251')} ${cost}`}</small>
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
    t('ui.81e2301960'),
    `Lv.${lv} ${MIDDOT} ${rate}/hr ${MIDDOT} ${t('ui.1f1712acff')} ${stored}/${cap}`,
    `<div class="hub-panel">
      <div class="pond-panel mine-panel">
        <p class="pond-panel-title">${t('ui.7c70400fef')}</p>
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
          <span class="stage-card-mark" aria-hidden="true">${Mark.crystal}</span>
          <span class="stage-card-body">
            <strong>${t('ui.b3fe16e64a')}</strong>
            <small>${stored > 0 ? `${t('ui.df72a8753d')} ${stored}` : t('ui.2c1116fb7b')}</small>
          </span>
        </button>
        <button type="button" class="stage-card" id="btn-mine-upgrade" ${maxed ? "disabled" : ""}>
          <span class="stage-card-mark" aria-hidden="true">${ARROW_UP}</span>
          <span class="stage-card-body">
            <strong>${maxed ? t('ui.cc24e86471') : `${t('ui.e5f5d19099')} ${ARROW_RIGHT} Lv.${lv + 1}`}</strong>
            <small>${maxed ? `MAX ${MAX_BUILDING_LEVEL}` : `${MINUS}${t('ui.dc78e6a251')} ${cost}`}</small>
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
    <p class="forge-reveal-kicker"><span class="forge-reveal-mark" aria-hidden="true">${Mark.wish}</span>${t('ui.0b4d534507')}</p>
        <p class="forge-after">${wishReveal}</p>
        <button type="button" class="secondary full auth-btn-ghost" id="btn-wish-dismiss" style="margin-top:12px">${t('ui.468266d639')}</button>
      </div>`
    : "";
  return hubShell(
    t('ui.81e2301960'),
    used ? `${t('ui.ecc82466ef')} ${MIDDOT} ${last}` : t('ui.b65d90440e'),
    `<div class="hub-panel">
      ${reveal}
      <div class="guild-panel wish-panel">
        <p class="guild-panel-title">${t('ui.6667aae26a')}</p>
        <div class="guild-stats">
          <div class="guild-stat"><span>${t('ui.2bdce5e8cc')}</span><strong>${used ? t('ui.8d8680373c') : t('ui.9614672b56')}</strong></div>
          <div class="guild-stat"><span>${t('ui.0f8cd87cd5')}</span><strong>${last ?? EM_DASH}</strong></div>
          <div class="guild-stat"><span>${t('ui.fa73f3a42f')}</span><strong>${save.scrolls}</strong></div>
        </div>
        <p class="muted dojo-hint">${t('ui.7e6bcf70a0')}.</p>
      </div>
      <button type="button" class="auth-btn-primary full" id="btn-wish-cast" ${used ? "disabled" : ""}>
        ${used ? t('ui.566fd24305') : t('ui.7898ac8908')}
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
        return `<div class="party-slot empty"><span class="party-slot-num">${i + 1}</span><span class="party-slot-name">${Mark.partyEmpty}</span></div>`;
      }
      return `<div class="party-slot el-${def?.element ?? "dark"}">
        <span class="party-slot-num">${i + 1}</span>
        ${monsterArtImg(m.monsterId, "party-slot-art", 36)}
        <span class="party-slot-name">${describeOwned(m)}</span>
      </div>`;
    })
    .join("");
  return hubShell(
    t('ui.759f762a02'),
    `${t('ui.d5e7024eb8')} ${selected.size}/4 ${MIDDOT} ${t('ui.269ecd9013')}`,
    `<div class="hub-panel">
      <div class="party-lineup" aria-label="${t('ui.a5d54ca91e')}">
        <p class="party-lineup-title">${t('ui.a5d54ca91e')}</p>
        <div class="party-slots">${lineup}</div>
      </div>
      <p class="section-label">${t('ui.079b50d844')}</p>
      <div class="stage-list" id="party-pick">
        ${save.roster
          .map((m) => {
            const on = selected.has(m.uid);
            const def = getMonster(m.monsterId);
            const preview = previewOwnedCombatStats(save, m.uid);
            const stats = preview
              ? `HP ${preview.final.hp} ${MIDDOT} ATK ${preview.final.atk} ${MIDDOT} DEF ${preview.final.def}`
              : def?.element ?? "";
            return `<button type="button" class="stage-card party-card el-${def?.element ?? "dark"}${on ? " picked" : ""}" data-party-toggle="${m.uid}">
              <span class="stage-card-mark party-card-art" aria-hidden="true">${monsterArtImg(m.monsterId, "party-card-img", 44) || (on ? STAR : (def?.element?.[0]?.toUpperCase() ?? "?"))}</span>
              <span class="stage-card-body">
                <strong>${describeOwned(m)}</strong>
                <small>${stats}</small>
                <small class="party-card-status">${on ? t('ui.c33ba55e69') : t('ui.df72a8753d')}</small>
              </span>
            </button>`;
          })
          .join("")}
      </div>
      <button type="button" class="auth-btn-primary full" id="btn-party-save" style="margin-top:10px">${t('ui.5ef8e0b5ef')} (${selected.size}/4)</button>
    </div>`,
  );
}

function monsterElementLabel(el: string | undefined): string {
  if (!el) return "?";
  if ((SUMMONER_ELEMENTS as readonly string[]).includes(el)) {
    return elementLabel(el as SummonerElement);
  }
  return el;
}

function monsterElementArtSrc(el: string | undefined | null): string | null {
  if (!el) return null;
  if (!(SUMMONER_ELEMENTS as readonly string[]).includes(el)) return null;
  return `/art/ui/element/${el}.webp`;
}

function monsterSkillArtSrc(
  monsterId: string | undefined | null,
  skillIndex: number,
  skill?: {
    effects?: { kind: string }[];
  } | null,
): string {
  if (monsterId && skillIndex >= 0 && skillIndex <= 2) {
    return `/art/monster/skill/${monsterId}-s${skillIndex + 1}.webp`;
  }
  const kind = skill?.effects?.[0]?.kind;
  if (kind === "heal") return "/art/ui/skill/heal.svg";
  if (kind === "shield") return "/art/ui/skill/shield.svg";
  if (kind === "mana") return "/art/ui/skill/mana.svg";
  return "/art/ui/skill/damage.svg";
}

function monsterSkillDescLines(
  skill: {
    cooldown: number;
    effects: (
      | { kind: "damage"; target: string; coeff: number }
      | { kind: "heal"; target: string; coeff: number }
      | { kind: "shield"; target: string; coeff: number }
      | { kind: "mana"; amount: number }
    )[];
  } | null | undefined,
): string[] {
  if (!skill) return [];
  const lines: string[] = [
    skill.cooldown > 0
      ? t("ui.skillCdLabel", { n: skill.cooldown })
      : t("ui.skillCdNone"),
  ];
  for (const e of skill.effects) {
    if (e.kind === "damage") {
      const pct = Math.round(e.coeff * 100);
      lines.push(
        e.target === "all_enemies"
          ? t("ui.skillFxDamageAll", { pct })
          : t("ui.skillFxDamageSingle", { pct }),
      );
    } else if (e.kind === "heal") {
      const pct = Math.round(e.coeff * 100);
      lines.push(
        e.target === "self"
          ? t("ui.skillFxHealSelf", { pct })
          : t("ui.skillFxHealAlly", { pct }),
      );
    } else if (e.kind === "shield") {
      lines.push(t("ui.skillFxShield", { pct: Math.round(e.coeff * 100) }));
    } else if (e.kind === "mana") {
      lines.push(t("ui.skillFxMana", { n: e.amount }));
    }
  }
  return lines;
}

function monsterSkillUpgradeRows(
  skill: { cooldown: number } | null | undefined,
  currentLv: number,
): string {
  const rows: string[] = [];
  for (let lv = 2; lv <= MAX_SKILL_LEVEL; lv++) {
    const reached = currentLv >= lv;
    let text = t("ui.skillLvPower", { pct: 8 });
    if (lv >= MAX_SKILL_LEVEL && (skill?.cooldown ?? 0) > 0) {
      text = t("ui.skillLvCd");
    }
    rows.push(
      `<div class="mon-skill-uprow${reached ? " is-on" : ""}"><span class="mon-skill-uplv">Lv.${lv}</span><span class="mon-skill-uptext">${text}</span></div>`,
    );
  }
  return rows.join("");
}

/** Map catalog role (tank/dps/support/flex). */
function monsterRoleLabel(role: string | undefined, base?: {
  hp: number;
  atk: number;
  def: number;
}): string {
  switch (role) {
    case "support":
    case "stonesage":
      return t("ui.roleSupport");
    case "attacker":
    case "capturer":
    case "debuffer":
      return t("ui.roleAttack");
    case "tank":
      if (base && base.def * 10 >= base.hp) return t("ui.roleDefense");
      return t("ui.roleHp");
    default:
      break;
  }
  if (base) {
    const { hp, atk, def: d } = base;
    if (atk >= d && atk * 3 >= hp) return t("ui.roleAttack");
    if (d * 10 >= hp && d >= atk) return t("ui.roleDefense");
    if (hp >= atk * 3 && hp >= d * 10) return t("ui.roleHp");
  }
  return t("ui.roleSupport");
}

function scrollArtSrc(kind: ScrollKind): string {
  return `/art/ui/res/scroll-${kind}.webp`;
}

function monsterArtSrc(monsterId: string | undefined | null): string | null {
  if (!monsterId) return null;
  return `/art/monster/${monsterId}.webp`;
}

function summonerArtSrc(element: string | undefined | null): string {
  const el = element && ["fire", "water", "wind", "light", "dark"].includes(element)
    ? element
    : "light";
  return `/art/summoner/${el}.webp`;
}

function monsterArtImg(
  monsterId: string | undefined | null,
  className: string,
  size = 44,
): string {
  const src = monsterArtSrc(monsterId);
  if (!src) return "";
  return `<img class="${className}" src="${src}" width="${size}" height="${size}" alt="" draggable="false" decoding="async" />`;
}

function renderSummonRevealCell(uid: string): string {
  const mon = save.roster.find((m) => m.uid === uid);
  if (!mon) return "";
  const def = getMonster(mon.monsterId);
  const el = def?.element ?? "dark";
  const stars = STAR.repeat(def?.naturalStars ?? 0);
  return `<div class="summon-multi-cell el-${el}">
    <span class="summon-multi-seal" aria-hidden="true">${monsterArtImg(mon.monsterId, "summon-multi-img", 48) || monsterElementLabel(el).slice(0, 1)}</span>
    <strong>${def?.nameKo ?? mon.monsterId}</strong>
    <small>${monsterElementLabel(el)} ${MIDDOT} ${stars}</small>
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
  const revStars = STAR.repeat(revDef?.naturalStars ?? 0);
  const revPreview = revealed
    ? previewOwnedCombatStats(save, revealed.uid)
    : null;
  const hasReveal = revealedList.length > 0;
  const riteCore = isMulti
    ? `<div class="summon-reveal summon-reveal--multi" aria-live="polite">
            <p class="equip-picker-title">${t('ui.d3d3707997')}</p>
        <div class="summon-multi-grid">
          ${lastSummonUids.map((uid) => renderSummonRevealCell(uid)).join("")}
        </div>
        <div class="summon-reveal-cta">
          <button type="button" class="secondary" data-nav="enhance">${t('ui.91c120d564')}</button>
        </div>
      </div>`
    : revealed
      ? `<div class="summon-reveal el-${revEl}" aria-live="polite">
        <div class="summon-reveal-seal" aria-hidden="true">
          ${monsterArtImg(revealed.monsterId, "summon-reveal-img", 72) || `<span class="summon-reveal-el">${monsterElementLabel(revEl).slice(0, 1)}</span>`}
        </div>
        <p class="summon-reveal-kicker">${t('ui.4150cda5a2')}</p>
        <p class="summon-reveal-stars" aria-label="${revDef?.naturalStars ?? 0}">${revStars}</p>
        <p class="summon-reveal-name">${revDef?.nameKo ?? revealed.monsterId}</p>
        <p class="summon-reveal-meta">${monsterElementLabel(revEl)} ${MIDDOT} ${STAR}${revDef?.naturalStars ?? 0}</p>
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
                  partyFull ? t('ui.f66f56e98f') : t('ui.6686a68a3f')
                }</button>`
          }
          <button type="button" class="secondary" data-nav="enhance">${t('ui.91c120d564')}</button>
        </div>
      </div>`
      : `<div class="summon-idle">
        <p class="summon-idle-kicker">${t('ui.c6953a607b')}</p>
        <p class="summon-idle-title">${t('ui.290a3fb982')}</p>
        <p class="summon-idle-copy">${t('ui.ea58ae8a45')}</p>
      </div>`;
  const shortLabel: Record<ScrollKind, string> = {
    normal: t('ui.aef1a1e70e'),
    premium: t('ui.1c208809ed'),
    mystic: t('ui.2d586d2a06'),
  };
  const castRow = hasReveal
    ? ""
    : `<div class="summon-cast-row" role="group" aria-label="${t('ui.d0e22dbd7b')}">
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
              <span class="summon-cast-stock"><b>${n}</b></span>
            </span>
            <span class="summon-cast-actions">
              <button type="button" class="summon-cast-cta" data-summon-kind="${kind}" data-summon-count="1" ${ready1 ? "" : "disabled"} aria-label="${SCROLL_KIND_LABEL[kind]} ${t('ui.6b0ff13ffd')}">
                ${ready1 ? t('ui.ac9d7edf0f') : t('ui.759f762a02')}
              </button>
              <button type="button" class="summon-cast-cta summon-cast-cta--multi" data-summon-kind="${kind}" data-summon-count="${SUMMON_MULTI_COUNT}" ${ready10 ? "" : "disabled"} aria-label="${SCROLL_KIND_LABEL[kind]} ${SUMMON_MULTI_COUNT}${t('ui.be988ce3e3')}">
                ${ready10 ? `${SUMMON_MULTI_COUNT}?` : t('ui.759f762a02')}
              </button>
            </span>
          </div>`;
        }).join("")}
      </div>`;
  return `<div class="summon-screen">
    ${hubShell(
      t('ui.0d242e234f'),
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

function symbolArtSrc(setId: string, slot: number): string {
  return `/art/ui/symbol/${setId}-${slot}.svg`;
}

function symbolSetArtSrc(setId: string): string {
  return `/art/ui/symbol/${setId}.svg`;
}

function symbolEmptySlotArtSrc(slot: number): string {
  return `/art/ui/symbol/empty-${slot}.svg`;
}

function symbolCircleFrameSrc(): string {
  return `/art/ui/symbol/circle-frame.svg`;
}

function symbolPlateSrc(rarityId: string, slot: number): string {
  return `/art/ui/symbol/plate-${rarityId}-${slot}.svg`;
}

const SYMBOL_SET_ACCENTS: Record<string, string> = {
  hwalro: "#6cbc7a",
  yongmaeng: "#e07040",
  haengma: "#4aa0d0",
  gunhim: "#c9a227",
  mussang: "#d0b070",
  chimtu: "#c04070",
  bogang: "#8ec8f0",
  jipjung: "#9a70d0",
};

function symbolSetAccent(setId: string): string {
  return SYMBOL_SET_ACCENTS[setId] ?? "#c9a227";
}

/** Shared mark + enhance badge used in inventory / modal / dock. */
function renderSymIco(opts: {
  setId: string;
  slot: number;
  enhance: number;
  rarityId: string;
  size?: "sm" | "md" | "lg";
}): string {
  const size = opts.size ?? "md";
  return `<span class="sym-ico sym-ico--${size} rarity--${opts.rarityId}">
    <img class="sym-ico-plate" src="${symbolPlateSrc(opts.rarityId, opts.slot)}" width="72" height="72" alt="" aria-hidden="true" draggable="false" />
    <img class="sym-ico-art" src="${symbolArtSrc(opts.setId, opts.slot)}" width="64" height="64" alt="" draggable="false" />
    <span class="sym-ico-plus">${opts.enhance}</span>
  </span>`;
}

function symbolRarity(stars: number): { id: string; label: string } {
  if (stars >= 6) return { id: "mythic", label: t("ui.rarityMythic") };
  if (stars >= 5) return { id: "legendary", label: t("ui.rarityLegendary") };
  if (stars >= 4) return { id: "epic", label: t("ui.rarityEpic") };
  if (stars >= 3) return { id: "rare", label: t("ui.rarityRare") };
  if (stars >= 2) return { id: "magic", label: t("ui.rarityMagic") };
  return { id: "normal", label: t("ui.rarityNormal") };
}

function symbolStatLabelKo(stat: string): string {
  switch (stat) {
    case "ATK+": return t("ui.statAtk");
    case "HP+": return t("ui.statHp");
    case "DEF+": return t("ui.statDef");
    case "SPD+": return t("ui.statSpd");
    case "CRI Rate%": return t("ui.statCriRate");
    case "CRI Dmg%": return t("ui.statCriDmg");
    case "ACC%": return t("ui.statAcc");
    case "RES%": return t("ui.statRes");
    default: return stat;
  }
}

function formatSymbolStatLine(stat: string, value: number): string {
  const pct = stat.includes("%");
  const n = Math.round(value);
  return `${symbolStatLabelKo(stat)} +${n}${pct ? "%" : ""}`;
}

function symbolMainDisplayValue(sym: { mainValue: number; enhance: number }): number {
  return sym.mainValue * (1 + sym.enhance * 0.08);
}

function symbolSubstatCapacity(stars: number): number {
  if (stars >= 6) return 4;
  if (stars >= 5) return 3;
  if (stars >= 3) return 2;
  return 1;
}

function findSymbolIndexById(id: string): number {
  return save.symbols.findIndex((x) => x.id === id);
}

function renderSymbolDetailModal(): string {
  if (symbolDetailIndex == null) return "";
  const sym = save.symbols[symbolDetailIndex];
  if (!sym) return "";
  const set = SYMBOL_SETS.find((x) => x.id === sym.setId);
  const rarity = symbolRarity(sym.stars);
  const wornUid =
    save.roster.find((m) => (m.symbolSlots ?? []).includes(sym.id))?.uid ?? null;
  const wornMon = wornUid ? save.roster.find((m) => m.uid === wornUid) : null;
  const wornName = wornMon ? describeOwned(wornMon) : null;
  const mainLine = formatSymbolStatLine(sym.mainStat, symbolMainDisplayValue(sym));
  const subs: string[] = [];
  if (sym.prefixStat && sym.prefixValue) {
    subs.push(formatSymbolStatLine(sym.prefixStat, sym.prefixValue));
  }
  const cap = symbolSubstatCapacity(sym.stars);
  while (subs.length < cap) subs.push("");
  const subHtml = subs
    .map((line) =>
      line
        ? `<p class="sym-detail-sub">${line}</p>`
        : `<p class="sym-detail-sub is-empty">&mdash;</p>`,
    )
    .join("");
  const setLine = set
    ? `<span class="sym-detail-set-ico"><img src="${symbolSetArtSrc(set.id)}" width="20" height="20" alt="" draggable="false" /></span><span class="sym-detail-set-text">${t("ui.setPiecesN", { n: set.pieces })} ${set.effectKo}</span>`
    : "";
  const imprintable = canImprintSymbol(sym);
  const maxed = sym.enhance >= MAX_SYMBOL_ENHANCE;
  const title = `${set?.nameKo ?? sym.setId} (${t("ui.slotN", { n: sym.slot })}) - ${rarity.label}`;
  const thirdBtn = wornUid
    ? `<button type="button" class="sym-detail-act" data-sym-detail-unequip>${t("ui.unequip")}</button>`
    : `<button type="button" class="sym-detail-act" data-sym-detail-equip>${t("ui.818a75cd98")}</button>`;
  return `<div class="settings-layer sym-detail-layer" id="sym-detail-layer" aria-hidden="false">
    <button type="button" class="settings-backdrop" id="btn-sym-detail-close" aria-label="close"></button>
    <div class="sym-detail-sheet rarity--${rarity.id}" role="dialog" aria-modal="true" aria-labelledby="sym-detail-title">
      ${modalCloseX("close", "btn-sym-detail-close")}
      <h3 class="sym-detail-title" id="sym-detail-title">${title}</h3>
      <div class="sym-detail-body">
        <div class="sym-detail-left">
          <div class="sym-detail-hero">
            ${renderSymIco({
              setId: sym.setId,
              slot: sym.slot,
              enhance: sym.enhance,
              rarityId: rarity.id,
              size: "lg",
            })}
            <div class="sym-detail-main-wrap">
              <p class="sym-detail-main">${mainLine}</p>
              <small class="sym-detail-plus">+${sym.enhance}${wornName ? ` / ${wornName}` : ""}</small>
            </div>
          </div>
          <div class="sym-detail-subs">${subHtml}</div>
        </div>
        <div class="sym-detail-right">
          <p class="sym-detail-set">${setLine}</p>
          <button type="button" class="sym-detail-act" data-sym-detail-imprint ${imprintable ? "" : "disabled"}>${t("ui.8b41b055f7")}</button>
          <button type="button" class="sym-detail-act" data-sym-detail-enhance ${maxed ? "disabled" : ""}>${t("ui.3e1a337d93")}</button>
          ${thirdBtn}
        </div>
      </div>
    </div>
  </div>`;
}

function renderSymbolBagExpandModal(): string {
  if (!symbolBagExpandOpen) return "";
  const cur = symbolBagCapacity(save);
  const cost = symbolBagExpandCost(save);
  if (cost == null) return "";
  const add = SYMBOL_BAG_EXPAND_STEP;
  const next = Math.min(SYMBOL_BAG_MAX_SLOTS, cur + add);
  return `<div class="settings-layer sym-detail-layer sym-bag-expand-layer" id="sym-bag-expand-layer" aria-hidden="false">
    <button type="button" class="settings-backdrop" id="btn-sym-bag-expand-close" aria-label="close"></button>
    <div class="sym-bag-expand-sheet" role="dialog" aria-modal="true" aria-labelledby="sym-bag-expand-title">
      ${modalCloseX("close", "btn-sym-bag-expand-close")}
      <h3 class="sym-bag-expand-title" id="sym-bag-expand-title">${t("ui.expandSymbolBagTitle")}</h3>
      <div class="sym-bag-expand-rows">
        <div class="sym-bag-expand-row">
          <span>${t("ui.expandSymbolBagCurrent")}</span>
          <strong>${cur}</strong>
        </div>
        <div class="sym-bag-expand-row">
          <span>${t("ui.expandSymbolBagAdd")}</span>
          <strong>+${add} ${MIDDOT} ${next}</strong>
        </div>
        <div class="sym-bag-expand-row sym-bag-expand-row--price">
          <span>${t("ui.expandSymbolBagPrice")}</span>
          <strong>${cost} ${t("res.crystal")}</strong>
        </div>
      </div>
      <div class="sym-bag-expand-acts">
        <button type="button" class="secondary" id="btn-sym-bag-expand-cancel">${t("ui.19b2d19bc1")}</button>
        <button type="button" class="sym-bag-expand-ok" id="btn-sym-bag-expand-ok">${t("ui.expandSymbolBagConfirm")}</button>
      </div>
    </div>
  </div>`;
}

function renderSlotSymbolPicker(uid: string, slot: number): string {
  const candidates = save.symbols
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.slot === slot);
  const mon = save.roster.find((m) => m.uid === uid);
  return `<div class="equip-picker slot-sym-picker" aria-live="polite">
    <p class="equip-picker-title">${t('ui.81d226110c')} ${slot} ${t('ui.0e69339fa1')}</p>
    <p class="muted">${mon ? describeOwned(mon) : uid}</p>
    <div class="stage-list">
      ${
        candidates.length
          ? candidates
              .map(({ s, i }) => {
                const worn = symbolWearer(s.id);
                const rarity = symbolRarity(s.stars);
                return `<button type="button" class="stage-card stage-card--sym" data-slot-equip-sym="${i}">
                  ${renderSymIco({ setId: s.setId, slot: s.slot, enhance: s.enhance, rarityId: rarity.id, size: "sm" })}
                  <span class="stage-card-body">
                    <strong>${describeSymbol(s)}</strong>
                    <small>${worn ? `${t('ui.ebe035bf0f')} ${worn} / ${t('ui.c686d05434')}` : t('ui.43d54a7358')}</small>
                  </span>
                </button>`;
              })
              .join("")
          : `<p class="muted">${t("ui.noSymbolForSlot")}</p>`
      }
    </div>
    <button type="button" class="secondary full" id="btn-slot-equip-cancel">${t('ui.19b2d19bc1')}</button>
  </div>`;
}

function renderSymbolLoadout(uid: string, opts?: { slotsOnly?: boolean }): string {
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
        const symIdx = findSymbolIndexById(sym.id);
        return `<button type="button" class="slot-cell filled" data-sym-detail="${symIdx}" title="${describeSymbol(sym)}">
          <span class="slot-num">${slotNum}</span>
          <span class="slot-label">${sym.setId}</span>
        </button>`;
      }
      return `<button type="button" class="slot-cell empty${pickingSlot === slotNum ? " is-picking" : ""}" data-slot-pick-uid="${uid}" data-slot-pick="${slotNum}" title="${t('ui.3f1100d730')}">
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
        <div class="stat-cell"><span class="stat-cell-k">${t('ui.04de68c24f')}</span><span class="stat-cell-v">${preview.final.critRate}%</span></div>
        <div class="stat-cell"><span class="stat-cell-k">${t('ui.0502c88b0e')}</span><span class="stat-cell-v">${preview.final.critDmg}%</span></div>
      </div>
      ${
        preview.sets.length
          ? `<div class="loadout-sets">${preview.sets
              .map((s) => {
                const accent = symbolSetAccent(s.setId);
                return `<span class="set-chip${s.active ? " active" : ""}" style="--sym-accent:${accent}">
                    <img class="set-chip-ico" src="${symbolSetArtSrc(s.setId)}" width="16" height="16" alt="" draggable="false" />
                    <span class="set-chip-label">${s.nameKo} ${s.count}/${s.pieces}${s.active ? ` / ${s.effectKo}` : ""}</span>
                  </span>`;
              })
              .join("")}</div>`
          : `<p class="muted loadout-sets-empty">${t('ui.102350c0dd')}</p>`
      }`
    : "";
  const picker =
    slotEquipPick?.uid === uid
      ? renderSlotSymbolPicker(uid, slotEquipPick.slot)
      : "";
  if (opts?.slotsOnly) {
    return `<div class="slot-row" aria-label="${t('ui.7cf8acb154')}">${cells}</div>${picker}`;
  }
  return `<div class="slot-row" aria-label="${t('ui.7cf8acb154')}">${cells}</div>${stats}${picker}`;
}



function renderMonsterRuneCircle(uid: string): string {
  const mon = save.roster.find((m) => m.uid === uid);
  if (!mon) return "";
  const slots = mon.symbolSlots ?? [null, null, null, null, null, null];
  const pickingSlot = slotEquipPick?.uid === uid ? slotEquipPick.slot : null;
  const cells = [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const id = slots[i];
      const sym = id ? save.symbols.find((x) => x.id === id) : null;
      const slotNum = i + 1;
      const picking = pickingSlot === slotNum ? " is-picking" : "";
      if (sym) {
        const symIdx = findSymbolIndexById(sym.id);
        const rarity = symbolRarity(sym.stars);
        return `<button type="button" class="rune-slot rune-slot--${slotNum} filled rarity--${rarity.id}${picking}" data-sym-detail="${symIdx}" title="${describeSymbol(sym)}">
          <span class="rune-slot-face">
            <img class="rune-slot-plate" src="${symbolPlateSrc(rarity.id, slotNum)}" width="72" height="72" alt="" aria-hidden="true" draggable="false" />
            <img class="rune-slot-art" src="${symbolArtSrc(sym.setId, slotNum)}" width="72" height="72" alt="" draggable="false" />
          </span>
        </button>`;
      }
      return `<button type="button" class="rune-slot rune-slot--${slotNum} empty${picking}" data-slot-pick-uid="${uid}" data-slot-pick="${slotNum}" title="${t("ui.3f1100d730")}">
          <span class="rune-slot-face">
            <img class="rune-slot-art" src="${symbolEmptySlotArtSrc(slotNum)}" width="72" height="72" alt="" draggable="false" />
          </span>
        </button>`;
    })
    .join("");
  const picker =
    slotEquipPick?.uid === uid
      ? renderSlotSymbolPicker(uid, slotEquipPick.slot)
      : "";
  return `<div class="rune-circle" aria-label="${t("ui.7cf8acb154")}">
    <img class="rune-circle-frame" src="${symbolCircleFrameSrc()}" width="240" height="240" alt="" aria-hidden="true" draggable="false" />
    ${cells}
  </div>${picker}`;
}

/** Compact symbol bag grid (SW inventory) for the symbols tab left column. */
function renderSymbolInventoryGrid(): string {
  const cap = symbolBagCapacity(save);
  const filled = Math.min(save.symbols.length, cap);
  const expandCost = symbolBagExpandCost(save);
  const atMax = expandCost == null;
  const expandTitle = atMax
    ? t("ui.expandSymbolBagMax")
    : t("ui.expandSymbolBag", { cost: expandCost! });
  const tiles: string[] = [];
  for (let i = 0; i < cap; i++) {
    const sym = i < filled ? save.symbols[i] : null;
    if (sym) {
      const worn = symbolWearer(sym.id);
      const rarity = symbolRarity(sym.stars);
      tiles.push(`<div class="mon-sym-inv-cell">
        <button type="button" class="mon-sym-inv-tile rarity--${rarity.id}${worn ? " is-worn" : ""}" data-sym-detail="${i}" title="${describeSymbol(sym)}">
          <span class="mon-sym-inv-ico" aria-hidden="true">
            <img class="mon-sym-inv-plate" src="${symbolPlateSrc(rarity.id, sym.slot)}" alt="" draggable="false" />
            <img class="mon-sym-inv-mark" src="${symbolArtSrc(sym.setId, sym.slot)}" alt="" draggable="false" />
            <span class="mon-sym-inv-enh">${sym.enhance}</span>
          </span>
          ${worn ? `<span class="mon-sym-inv-worn">E</span>` : ""}
        </button>
      </div>`);
    } else {
      tiles.push(`<div class="mon-sym-inv-cell" aria-hidden="true">
        <div class="mon-sym-inv-tile is-empty">
          <span class="mon-sym-inv-empty-face"></span>
        </div>
      </div>`);
    }
  }
  return `<div class="mon-sym-inv" aria-label="${t("ui.60fbf51b13")}">
    <div class="mon-sym-inv-head">
      <div class="mon-sym-inv-head-title">
        <strong>${t("ui.60fbf51b13")}</strong>
        <button type="button" class="mon-sym-inv-expand" data-expand-sym-bag ${atMax ? "disabled" : ""} title="${escapeHtml(expandTitle)}" aria-label="${escapeHtml(expandTitle)}">+</button>
      </div>
      <span>${filled}/${cap}</span>
    </div>
    <div class="mon-sym-inv-grid">${tiles.join("")}</div>
  </div>`;
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

function sortRosterForSlots(
  roster: typeof save.roster,
  mode: RosterSortMode,
): typeof save.roster {
  const elOrder: Record<string, number> = {
    fire: 0,
    water: 1,
    wind: 2,
    light: 3,
    dark: 4,
  };
  const list = roster.slice();
  if (mode === "default") return list;
  list.sort((a, b) => {
    const da = getMonster(a.monsterId);
    const db = getMonster(b.monsterId);
    if (mode === "level") {
      if (b.level !== a.level) return b.level - a.level;
      return (db?.naturalStars ?? 0) - (da?.naturalStars ?? 0);
    }
    if (mode === "stars") {
      const sa = da?.naturalStars ?? 0;
      const sb = db?.naturalStars ?? 0;
      if (sb !== sa) return sb - sa;
      return b.level - a.level;
    }
    if (mode === "element") {
      const ea = elOrder[da?.element ?? ""] ?? 9;
      const eb = elOrder[db?.element ?? ""] ?? 9;
      if (ea !== eb) return ea - eb;
      if (b.level !== a.level) return b.level - a.level;
      return (db?.naturalStars ?? 0) - (da?.naturalStars ?? 0);
    }
    // party
    const pa = save.party.includes(a.uid) ? 0 : 1;
    const pb = save.party.includes(b.uid) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    if (b.level !== a.level) return b.level - a.level;
    return (db?.naturalStars ?? 0) - (da?.naturalStars ?? 0);
  });
  return list;
}

function renderEnhance(): string {
  enhanceTab = "monsters";
  const dock: "roster" | "symbols" =
    equipPickSymIndex != null || forgeReveal || monBookDock === "symbols"
      ? "symbols"
      : "roster";

  if (
    !selectedEnhanceUid ||
    !save.roster.some((m) => m.uid === selectedEnhanceUid)
  ) {
    selectedEnhanceUid = save.roster[0]?.uid ?? null;
  }
  const selectedMon = selectedEnhanceUid
    ? save.roster.find((m) => m.uid === selectedEnhanceUid) ?? null
    : null;
  const selectedDef = selectedMon ? getMonster(selectedMon.monsterId) : null;
  const selectedEl = selectedDef?.element ?? "dark";
  const selectedPreview = selectedMon
    ? previewOwnedCombatStats(save, selectedMon.uid)
    : null;
  const selectedEvo = selectedMon?.evolve ?? 0;

  if (slotEquipPick) monDetailTab = "symbols";

  const rosterSlotCap = 60;
  const sortedRoster = sortRosterForSlots(save.roster, rosterSortMode);
  const rosterFilled = Math.min(sortedRoster.length, rosterSlotCap);
  const rosterSlots = Array.from(
    { length: rosterSlotCap },
    (_, i) => sortedRoster[i] ?? null,
  );

  const monBookDetail = selectedMon
    ? (() => {
        const m = selectedMon;
        const levels = (m.skillLevels ?? [1, 1, 1]) as [number, number, number];
        const def = selectedDef;
        const elLabel = monsterElementLabel(selectedEl);
        const starsHtml = Array.from(
          { length: Math.max(1, def?.naturalStars ?? 1) },
          () => `<span class="mon-star" aria-hidden="true">&#9733;</span>`,
        ).join("");

        const expPct = Math.round((m.level / MAX_MONSTER_LEVEL) * 100);
        const enhCost = enhanceManaCost(m.level);
        const enhMaxed = m.level >= MAX_MONSTER_LEVEL;
        if (monSkillPick < 0 || monSkillPick > 2) monSkillPick = 0;
        const focusSk = def?.skills[monSkillPick];
        const focusLv = levels[monSkillPick] ?? 1;

        const skillIcons = [0, 1, 2]
          .map((si) => {
            const sk = def?.skills[si];
            const lv = levels[si] ?? 1;
            const on = monSkillPick === si;
            const maxSk = lv >= MAX_SKILL_LEVEL;
            return `<button type="button" class="mon-skill-ico${on ? " is-active" : ""}${maxSk ? " is-max" : ""}" data-mon-skill-pick="${si}" aria-pressed="${on}" title="${sk?.nameKo ?? `S${si + 1}`}">
            <img class="mon-skill-ico-img" src="${monsterSkillArtSrc(m.monsterId, si, sk)}" width="56" height="56" alt="" draggable="false" />
            <span class="mon-skill-ico-lv">${maxSk ? "MAX" : `Lv.${lv}`}</span>
          </button>`;
          })
          .join("");

        const fodderList = save.roster.filter(
          (x) => x.monsterId === m.monsterId && x.uid !== m.uid,
        );
        const feedRows = fodderList
          .map((f) => {
            const thumb =
              monsterArtImg(f.monsterId, "mon-skill-feed-img", 36) || "?";
            return `<button type="button" class="mon-skill-feed" data-skill-feed-target="${m.uid}" data-skill-feed-fodder="${f.uid}">
              <span class="mon-skill-feed-art">${thumb}</span>
              <span class="mon-skill-feed-body">
                <strong>Lv.${f.level}</strong>
                <small>${t("ui.skillFeedUse")}</small>
              </span>
            </button>`;
          })
          .join("");

        const skillDescLines = monsterSkillDescLines(focusSk);
        const skillsPanel = `<div class="mon-pane mon-pane--skills">
        <div class="mon-skill-rail">
          <div class="mon-skill-icos" role="tablist" aria-label="skills">${skillIcons}</div>
        </div>
        <div class="mon-skill-main">
          <div class="mon-skill-detail mon-skill-detail--tall">
            <div class="mon-skill-detail-head">
              <strong class="mon-skill-detail-name">${focusSk?.nameKo ?? `S${monSkillPick + 1}`}</strong>
              <span class="mon-skill-detail-lv">Lv.${focusLv}${focusLv >= MAX_SKILL_LEVEL ? " MAX" : ""}</span>
            </div>
            <ul class="mon-skill-detail-desc">
              ${skillDescLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
            </ul>
            <div class="mon-skill-upgrades">${monsterSkillUpgradeRows(focusSk, focusLv)}</div>
          </div>
          <div class="mon-skill-footer">
            <button type="button" class="auth-btn-primary mon-book-enh mon-book-enh--cost" data-enh="${m.uid}" ${enhMaxed ? "disabled" : ""}>${
              enhMaxed
                ? "MAX"
                : `<span class="mon-enh-label">${escapeHtml(t("ui.3e1a337d93"))}</span><span class="mon-enh-cost"><img class="res-ico mon-enh-cost-ico" src="/art/ui/res/gold.svg" width="16" height="16" alt="" draggable="false" /><strong>${fmtRes(enhCost)}</strong></span>`
            }</button>
            <p class="mon-skill-feed-caption">${escapeHtml(t("ui.skillFeedTitle"))}</p>
            ${feedRows ? `<div class="mon-skill-feed-list">${feedRows}</div>` : ""}
          </div>
        </div>
      </div>`;

        const awakenPanel = `<div class="mon-pane mon-pane--awaken">
        <p class="mon-pane-copy muted">${t("ui.awakenComingSoon")}</p>
      </div>`;

        const symbolsPanel = `<div class="mon-pane mon-pane--symbols">
        <div class="mon-sym-viewer">
          <div class="mon-sym-viewer-equip">
            ${renderMonsterRuneCircle(m.uid)}
            <div class="rune-effect-block">
              <div class="rune-effect-head">
                <strong>${t("ui.effect")}</strong>
              </div>
              ${
                selectedPreview?.sets.length
                  ? `<div class="loadout-sets">${selectedPreview.sets
                      .map((set) => {
                        const accent = symbolSetAccent(set.setId);
                        return `<span class="set-chip${set.active ? " active" : ""}" style="--sym-accent:${accent}">
                          <img class="set-chip-ico" src="${symbolSetArtSrc(set.setId)}" width="16" height="16" alt="" draggable="false" />
                          <span class="set-chip-label">${set.nameKo} ${set.count}/${set.pieces}${set.active ? ` / ${set.effectKo}` : ""}</span>
                        </span>`;
                      })
                      .join("")}</div>`
                  : `<p class="muted loadout-sets-empty">${t("ui.setBonusNone")}</p>`
              }
            </div>
          </div>
          <div class="mon-sym-viewer-inv">${renderSymbolInventoryGrid()}</div>
        </div>
      </div>`;

        const infoPanel = `<div class="mon-pane mon-pane--info">
          <div class="mon-book-stats mon-inspect-stats mon-inspect-stats--grid2x4" role="list">
            <div class="stat-cell" role="listitem"><span class="stat-cell-k">${t("ui.statHp")}</span><span class="stat-cell-v">${selectedPreview?.final.hp ?? "-"}</span></div>
            <div class="stat-cell" role="listitem"><span class="stat-cell-k">${t("ui.statAtk")}</span><span class="stat-cell-v">${selectedPreview?.final.atk ?? "-"}</span></div>
            <div class="stat-cell" role="listitem"><span class="stat-cell-k">${t("ui.statDef")}</span><span class="stat-cell-v">${selectedPreview?.final.def ?? "-"}</span></div>
            <div class="stat-cell" role="listitem"><span class="stat-cell-k">${t("ui.statSpd")}</span><span class="stat-cell-v">${selectedPreview?.final.spd ?? "-"}</span></div>
            <div class="stat-cell" role="listitem"><span class="stat-cell-k">${t("ui.statCriRate")}</span><span class="stat-cell-v">${selectedPreview ? selectedPreview.final.critRate + "%" : "-"}</span></div>
            <div class="stat-cell" role="listitem"><span class="stat-cell-k">${t("ui.statCriDmg")}</span><span class="stat-cell-v">${selectedPreview ? selectedPreview.final.critDmg + "%" : "-"}</span></div>
            <div class="stat-cell" role="listitem"><span class="stat-cell-k">${t("ui.statAcc")}</span><span class="stat-cell-v">${selectedPreview ? selectedPreview.final.accuracy + "%" : "-"}</span></div>
            <div class="stat-cell" role="listitem"><span class="stat-cell-k">${t("ui.statRes")}</span><span class="stat-cell-v">${selectedPreview ? selectedPreview.final.resistance + "%" : "-"}</span></div>
          </div>
        </div>`;

        const infoPane = infoPanel.replace(
          'class="mon-pane mon-pane--info"',
          `class="mon-pane mon-pane--info" data-mon-pane="info"${monDetailTab === "info" ? "" : " hidden"}`,
        );
        const skillsPane = skillsPanel.replace(
          'class="mon-pane mon-pane--skills"',
          `class="mon-pane mon-pane--skills" data-mon-pane="skills"${monDetailTab === "skills" ? "" : " hidden"}`,
        );
        const awakenPane = awakenPanel.replace(
          'class="mon-pane mon-pane--awaken"',
          `class="mon-pane mon-pane--awaken" data-mon-pane="awaken"${monDetailTab === "awaken" ? "" : " hidden"}`,
        );
        const symbolsPane = symbolsPanel.replace(
          'class="mon-pane mon-pane--symbols"',
          `class="mon-pane mon-pane--symbols" data-mon-pane="symbols"${monDetailTab === "symbols" ? "" : " hidden"}`,
        );

        const previewArt =
          monsterArtImg(m.monsterId, "mon-preview-img", 120) ||
          `<span class="mon-inspect-art-fallback">${def?.element?.[0]?.toUpperCase() ?? "?"}</span>`;
        const heroBlock = `<div class="mon-inspect-hero">
            <div class="mon-inspect-preview" data-mon-preview="${m.monsterId}" data-yaw="18" role="img" aria-label="${def?.nameKo ?? m.monsterId}">
              <div class="mon-preview-turntable">
                <div class="mon-preview-spin">
                  <div class="mon-preview-art" data-unit-anim="orbit">${previewArt}</div>
                </div>
              </div>
              <span class="mon-preview-facing" aria-hidden="true">F</span>
              <span class="mon-preview-drag-hint" aria-hidden="true">${ARROW_LEFT}${ARROW_RIGHT}</span>
            </div>
            <div class="mon-inspect-hero-info">
              <strong class="mon-inspect-name">${def?.nameKo ?? m.monsterId}</strong>
              <div class="mon-inspect-facts">
                <span class="mon-inspect-fact mon-inspect-fact--el">
                  <span class="mon-el-ico mon-el-ico--${selectedEl}" aria-hidden="true">
                    <img class="mon-el-ico-img" src="${monsterElementArtSrc(selectedEl) ?? ""}" width="22" height="22" alt="" draggable="false" />
                  </span>
                  <span class="mon-inspect-fact-v">${elLabel}</span>
                </span>
                <span class="mon-inspect-fact mon-inspect-fact--stars" aria-label="${def?.naturalStars ?? 0}">
                  <span class="mon-inspect-stars">${starsHtml}</span>${selectedEvo > 0 ? `<span class="mon-evo">+${selectedEvo}</span>` : ""}
                </span>
                <span class="mon-inspect-fact mon-inspect-fact--role">
                  <span class="mon-inspect-fact-v">${monsterRoleLabel(def?.role, def?.baseStats)}</span>
                </span>
              </div>
              <div class="mon-inspect-art-foot" role="progressbar" aria-valuenow="${expPct}" aria-valuemin="0" aria-valuemax="100" aria-label="Lv.${m.level}">
                <span class="mon-inspect-art-lv">Lv.${m.level}</span>
                <div class="mon-inspect-art-exp"><div class="mon-inspect-art-exp-fill" style="width:${Math.min(100, expPct)}%"></div></div>
              </div>
            </div>
          </div>`;

        return `<div class="mon-inspect el-${selectedEl}">
      <div class="mon-inspect-shell">
        ${heroBlock}
        <div class="mon-inspect-tabs mon-inspect-tabs--row mon-inspect-tabs--4 mon-inspect-tabs--compact" role="tablist" aria-label="detail">
          <button type="button" class="mon-side-tab${monDetailTab === "info" ? " is-active" : ""}" data-mon-detail-tab="info" role="tab" aria-selected="${monDetailTab === "info"}">${t("ui.tabInfo")}</button>
          <button type="button" class="mon-side-tab${monDetailTab === "skills" ? " is-active" : ""}" data-mon-detail-tab="skills" role="tab" aria-selected="${monDetailTab === "skills"}">${t("ui.2b47128fd2")}</button>
          <button type="button" class="mon-side-tab${monDetailTab === "awaken" ? " is-active" : ""}" data-mon-detail-tab="awaken" role="tab" aria-selected="${monDetailTab === "awaken"}">${t("ui.a2d1ab7b28")}</button>
          <button type="button" class="mon-side-tab${monDetailTab === "symbols" ? " is-active" : ""}" data-mon-detail-tab="symbols" role="tab" aria-selected="${monDetailTab === "symbols"}">${t("ui.60fbf51b13")}</button>
        </div>
        <div class="mon-inspect-body mon-inspect-body--full">
          <div class="mon-inspect-panel">${infoPane}${skillsPane}${awakenPane}${symbolsPane}</div>
        </div>
      </div>
    </div>`;
      })()
    : `<div class="mon-book-empty muted">${t("ui.079b50d844")}</div>`;

  const symbolsDock = `${
    equipPickSymIndex != null && save.symbols[equipPickSymIndex]
      ? `<div class="equip-picker" aria-live="polite">
            <p class="equip-picker-title">${t("ui.d3d3707997")}</p>
            <p class="muted">${describeSymbol(save.symbols[equipPickSymIndex]!)}</p>
            <div class="stage-list">
              ${save.roster
                .map((m) => {
                  const inParty = save.party.includes(m.uid);
                  const slots = m.symbolSlots ?? [];
                  const slot = save.symbols[equipPickSymIndex!]!.slot - 1;
                  const occupied = slots[slot] ? t("ui.50ce91ae85") : "";
                  return `<button type="button" class="stage-card" data-equip-to="${m.uid}">
                    <span class="stage-card-mark" aria-hidden="true">${monsterArtImg(m.monsterId, "mon-slot-img", 36) || STAR}</span>
                    <span class="stage-card-body">
                  <strong>${describeOwned(m)}${inParty ? t("ui.7b191a9f9f") : ""}</strong>
                      <small>${t("ui.81d226110c")} ${save.symbols[equipPickSymIndex!]!.slot}${occupied}</small>
                    </span>
                  </button>`;
                })
                .join("")}
            </div>
            <button type="button" class="secondary full auth-btn-ghost" id="btn-equip-cancel">${t("ui.19b2d19bc1")}</button>
          </div>`
      : ""
  }
    <div class="mon-sym-grid">
      ${save.symbols.length
        ? save.symbols
            .map((sym, i) => {
              const maxed = sym.enhance >= MAX_SYMBOL_ENHANCE;
              const imprintable = canImprintSymbol(sym);
              const grindable = canGrindSymbol(sym);
              const picking = equipPickSymIndex === i;
              const worn = symbolWearer(sym.id);
              const rarity = symbolRarity(sym.stars);
              const setDef = SYMBOL_SETS.find((x) => x.id === sym.setId);
              return `<div class="mon-sym-tile${picking ? " is-picking" : ""}">
            <button type="button" class="mon-sym-main" data-sym-detail="${i}" title="${describeSymbol(sym)}">
              ${renderSymIco({
                setId: sym.setId,
                slot: sym.slot,
                enhance: sym.enhance,
                rarityId: rarity.id,
                size: "sm",
              })}
              <span class="mon-sym-main-text">
                <strong class="mon-sym-name">${worn ? "E / " : ""}${setDef?.nameKo ?? sym.setId}</strong>
                <small>+${sym.enhance}${worn ? ` / ${worn}` : ""}</small>
              </span>
            </button>
            <div class="mon-sym-actions">
              <button type="button" class="secondary" data-grind="${i}" ${grindable ? "" : "disabled"}>${t("ui.c14c1b1bc6")}</button>
              <button type="button" class="secondary" data-imprint="${i}" ${imprintable ? "" : "disabled"}>${imprintable ? t("ui.8b41b055f7") : t("ui.b5f528925f")}</button>
              <button type="button" class="secondary sym-eq${picking ? " active" : ""}" data-equip-sym="${i}">${picking ? t("ui.d21c4c3248") : t("ui.818a75cd98")}</button>
              <button type="button" class="secondary" data-sell-sym="${i}">+${symbolSellMana(sym.enhance)}</button>
            </div>
          </div>`;
            })
            .join("")
        : `<p class="muted mon-book-empty">${t("ui.43d54a7358")}</p>`}
    </div>`;

  const rosterDock = `<div class="mon-roster-dock">
      <div class="mon-roster-toolbar">
        <label class="mon-roster-sort" for="mon-roster-sort">
          <span class="mon-roster-sort-label">${t("ui.rosterSort")}</span>
          <select id="mon-roster-sort" class="mon-roster-sort-select" aria-label="${t("ui.rosterSort")}">
            <option value="default"${rosterSortMode === "default" ? " selected" : ""}>${t("ui.sortDefault")}</option>
            <option value="level"${rosterSortMode === "level" ? " selected" : ""}>${t("ui.sortLevel")}</option>
            <option value="stars"${rosterSortMode === "stars" ? " selected" : ""}>${t("ui.sortStars")}</option>
            <option value="element"${rosterSortMode === "element" ? " selected" : ""}>${t("ui.sortElement")}</option>
            <option value="party"${rosterSortMode === "party" ? " selected" : ""}>${t("ui.sortParty")}</option>
          </select>
        </label>
        <span class="mon-roster-count" aria-label="${rosterFilled}/${rosterSlotCap}">${rosterFilled}/${rosterSlotCap}</span>
      </div>
      <div class="mon-book-inv mon-book-inv--rail" role="listbox" aria-label="${t("ui.fa2390684b")}">
      ${rosterSlots
        .map((m) => {
          if (!m) {
            return `<div class="mon-slot mon-slot--portrait mon-slot--empty" role="presentation" aria-hidden="true">
        <span class="mon-slot-art">
          <img class="mon-slot-img mon-slot-img--empty" src="/art/ui/mon-slot-empty.svg" width="56" height="56" alt="" draggable="false" />
        </span>
      </div>`;
          }
          const def = getMonster(m.monsterId);
          const el = def?.element ?? "dark";
          const on = m.uid === selectedEnhanceUid;
          const starN = Math.max(1, def?.naturalStars ?? 1);
          const starsHtml = Array.from(
            { length: starN },
            () => `<span class="mon-star" aria-hidden="true">&#9733;</span>`,
          ).join("");
          const art =
            monsterArtImg(m.monsterId, "mon-slot-img", 56) ||
            (def?.element?.[0]?.toUpperCase() ?? "?");
          return `<button type="button" class="mon-slot mon-slot--portrait el-${el}${on ? " is-active" : ""}" data-select-mon="${m.uid}" role="option" aria-selected="${on ? "true" : "false"}" title="${describeOwned(m)}">
        <span class="mon-slot-art" aria-hidden="true">${art}</span>
        <span class="mon-slot-stars-overlay" aria-label="${starN}">${starsHtml}</span>
        <span class="mon-slot-lv-overlay">Lv.${m.level}</span>
      </button>`;
        })
        .join("")}
    </div>
    </div>`;

  const monstersPanel = `<div class="mon-book">
    <div class="mon-book-viewer">${monBookDetail}</div>
    ${
      dock === "symbols"
        ? `<div class="mon-sym-sheet" aria-live="polite">
      <div class="mon-sym-sheet-head">
        <strong>${t("ui.60fbf51b13")}</strong>
        <button type="button" class="secondary mon-sym-sheet-close" data-mon-dock="roster">${t("ui.94b7dba159")}</button>
      </div>
      <div class="mon-sym-sheet-body">${symbolsDock}</div>
    </div>`
        : ""
    }
    ${rosterDock}
  </div>`;

  const body = `<div class="hub-panel enhance-panel enhance-panel--desk">
    ${renderForgeReveal()}
    ${renderSymbolDetailModal()}
    ${renderSymbolBagExpandModal()}
    ${monstersPanel}
  </div>`;
  queueMicrotask(() => {
    enhanceFx = null;
    const slot = app.querySelector<HTMLElement>(".mon-slot.is-active");
    const rail = app.querySelector<HTMLElement>(".mon-book-inv--rail");
    if (slot && rail) {
      const slotCenter = slot.offsetLeft + slot.offsetWidth / 2;
      const nextLeft = Math.max(0, slotCenter - rail.clientWidth / 2);
      rail.scrollTo({ left: nextLeft, behavior: "smooth" });
    }
  });
  return `<div class="hub-screen enhance-screen">
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
      <header class="mon-topbar">
        ${navBackBtn({ nav: "home", label: t("ui.1a7f31cadb") })}
        <h1 class="mon-topbar-title">${escapeHtml(t("nav.monster"))}</h1>
        <span class="mon-topbar-spacer" aria-hidden="true"></span>
      </header>
      ${body}
    </div>
  </div>`;
}

function renderShopBody(): string {
  const grindRows =
    save.symbols
      .map((s, i) => {
        if (!canGrindSymbol(s)) return "";
        return `<button type="button" class="stage-card" data-grind="${i}">
          <span class="stage-card-mark" aria-hidden="true">${Mark.grind}</span>
          <span class="stage-card-body">
            <strong>${describeSymbol(s)}</strong>
            <small>${t('ui.956df04e9a')} ${MIDDOT} ${MINUS}${t('ui.dc78e6a251')} ${SYMBOL_GRIND_MANA_COST}</small>
          </span>
        </button>`;
      })
      .join("") || `<p class="muted">${t('ui.1d689ebc57')}</p>`;
  const imprintRows =
    save.symbols
      .map((s, i) => {
        if (!canImprintSymbol(s)) return "";
        return `<button type="button" class="stage-card" data-imprint="${i}">
          <span class="stage-card-mark" aria-hidden="true">${Mark.imprint}</span>
          <span class="stage-card-body">
            <strong>${describeSymbol(s)}</strong>
            <small>${t('ui.285324164a')} ${MIDDOT} ${MINUS}${t('ui.5d0bf3b101')} ${SYMBOL_IMPRINT_CRYSTAL_COST}</small>
          </span>
        </button>`;
      })
      .join("") ||
    `<p class="muted">${t('ui.b9c0de06ae')} (${t('ui.81d226110c')} 4${RANGE}6 ${t('ui.a05d718889')})</p>`;
  return `<div class="hub-panel shop-body">
    ${renderForgeReveal()}
      <p class="section-label">${t('ui.079b50d844')}</p>
    <div class="stage-list">
      <button type="button" class="stage-card shop-offer shop-scroll" id="btn-buy-scroll-1">
        <span class="stage-card-mark" aria-hidden="true">1</span>
        <span class="stage-card-body">
          <strong>${t('ui.58c8d4982d')}</strong>
          <small>?${t('ui.dc78e6a251')} ${SCROLL_BUY_MANA_COST} ${MIDDOT} ${t('ui.e41479e637')} ${save.scrolls}</small>
        </span>
      </button>
      <button type="button" class="stage-card shop-offer shop-scroll" id="btn-buy-scroll-5">
        <span class="stage-card-mark" aria-hidden="true">5</span>
        <span class="stage-card-body">
          <strong>${t('ui.544ebe1d37')}</strong>
          <small>?${t('ui.dc78e6a251')} ${SCROLL_BUY_MANA_COST * 5}</small>
        </span>
      </button>
    </div>
    <p class="section-label">${t('ui.5515ca646d')}</p>
    <div class="stage-list">
      <button type="button" class="stage-card shop-offer" id="btn-buy-energy">
        <span class="stage-card-mark" aria-hidden="true">${Mark.energy}</span>
        <span class="stage-card-body">
          <strong>${t('ui.7154da110a')} +${ENERGY_BUY_AMOUNT}</strong>
          <small>?${t('ui.5d0bf3b101')} ${ENERGY_CRYSTAL_COST}</small>
        </span>
      </button>
      <button type="button" class="stage-card shop-offer" id="btn-craft-essence">
        <span class="stage-card-mark" aria-hidden="true">${Mark.crystal}</span>
        <span class="stage-card-body">
            <strong>${t('ui.6623b135fa')}</strong>
          <small>${t('ui.4b482b3675')} ${ESSENCE_JINMUN_COST} ${MIDDOT} ${t('ui.5d0bf3b101')} ${ESSENCE_CRYSTAL_GAIN} (Lv.12)</small>
        </span>
      </button>
      <button type="button" class="stage-card shop-offer" id="btn-craft-scroll">
        <span class="stage-card-mark" aria-hidden="true">${Mark.summon}</span>
        <span class="stage-card-body">
            <strong>${t('ui.6623b135fa')}</strong>
          <small>${t('ui.4b482b3675')} ${CRAFT_SCROLL_JINMUN} + ${t('ui.dc78e6a251')} ${CRAFT_SCROLL_MANA} (Lv.19)</small>
        </span>
      </button>
    </div>
    <p class="section-label">${t('ui.d3a3c215c8')} (${t('ui.49758b94ae')})</p>
    <div class="stage-list">${grindRows}</div>
    <p class="section-label">${t('ui.515ca5f235')} (${t('ui.81d226110c')} 4${RANGE}6)</p>
    <div class="stage-list">${imprintRows}</div>
  </div>`;
}

function renderShop(): string {
  return hubShell(
    t('ui.759f762a02'),
    `${t('ui.fa73f3a42f')} ${save.scrolls} ${MIDDOT} ${t('ui.dc78e6a251')} ${Math.floor(save.island.mana)} ${MIDDOT} ${t('ui.5d0bf3b101')} ${save.island.crystal}`,
    renderShopBody(),
  );
}

function renderShopModal(): string {
  return `<div class="settings-layer shop-layer" id="shop-layer" ${shopOpen ? "" : "hidden"} aria-hidden="${shopOpen ? "false" : "true"}">
  <button type="button" class="settings-backdrop" id="btn-shop-close" aria-label="${escapeHtml(t("shop.close"))}"></button>
  <div class="settings-sheet shop-sheet" role="dialog" aria-modal="true" aria-labelledby="shop-title">
    <div class="settings-sheet-handle" aria-hidden="true"></div>
    ${modalCloseX(t("shop.close"), "btn-shop-close")}
    <h2 class="settings-title" id="shop-title">${escapeHtml(t("nav.shop"))}</h2>
    <p class="settings-account">${escapeHtml(`${t("ui.fa73f3a42f")} ${save.scrolls} ${MIDDOT} ${t("ui.dc78e6a251")} ${Math.floor(save.island.mana)} ${MIDDOT} ${t("ui.5d0bf3b101")} ${save.island.crystal}`)}</p>
    ${renderShopBody()}
  </div>
</div>`;
}

function renderGlory(): string {
  const glory = save.gloryPoints ?? 0;
  const levels = GLORY_BUILDINGS.reduce(
    (n, g) => n + (save.gloryLevels?.[g.id] ?? 0),
    0,
  );
  const maxTotal = GLORY_BUILDINGS.reduce((n, g) => n + g.maxLevel, 0);
  return hubShell(
    t('ui.81e2301960'),
    `${t('ui.14b961e9d3')} ${glory}`,
    `<div class="hub-panel">
    <div class="guild-panel glory-panel">
        <p class="guild-panel-title">${t('ui.6667aae26a')}</p>
      <div class="guild-stats">
        <div class="guild-stat"><span>${t('ui.e41479e637')}</span><strong>${glory}</strong></div>
        <div class="guild-stat"><span>${t('ui.ad11613bb4')}</span><strong>${levels}/${maxTotal}</strong></div>
        <div class="guild-stat"><span>${t('ui.29efb69b57')}</span><strong>${GLORY_BUILDINGS.length}</strong></div>
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
            <small>${g.effectKo} ${MIDDOT} ${maxed ? "MAX" : `${MINUS}${t('ui.ba0c9e096f')} ${g.gloryCostPerLevel}`}</small>
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
    choice === "mana" ? Mark.mana : choice === "amplify" ? Mark.amplify : Mark.shield;
  const hintFor = (choice: string) =>
    choice === "mana"
      ? t('ui.9eab85fc5c')
      : choice === "amplify"
        ? t('ui.eed788cba0')
        : t('ui.4ee49fe6c1');
  return `<div class="capture-shop">
    <p class="capture-shop-title">${t('ui.c2646fe538')}</p>
    <p class="muted capture-shop-sub">${t('ui.fafad3d54f')} ${MIDDOT} ${t('ui.12ce947dc1')}</p>
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

function renderGuildBody(): string {
  const name = save.guildName;
  const board = guildLeaderboard(save)
    .map(
      (r, i) =>
        `<div class="guild-rank-row${r.self ? " self-rank" : ""}">
          <span class="guild-rank-n">${i + 1}</span>
          <span class="guild-rank-name">${r.name}${r.self ? ` (${Mark.me})` : ""}</span>
          <strong class="guild-rank-score">${r.contribution}</strong>
        </div>`,
    )
    .join("");
  return `<div class="hub-panel community-body">
    <div class="guild-panel">
      <p class="guild-panel-title">${name ? name : t('ui.2a1d74bcdd')}</p>
      <div class="guild-stats">
        <div class="guild-stat"><span>${t('ui.fe2c5c3e7d')}</span><strong>${save.guildContribution ?? 0}</strong></div>
        <div class="guild-stat"><span>${t('ui.332e9eedf2')}</span><strong>+${save.guildRaidBest ?? 0}</strong></div>
        <div class="guild-stat"><span>${t('ui.937c424f40')}</span><strong>${save.guildCheckInDay ?? EM_DASH}</strong></div>
      </div>
    </div>
    ${
      name
        ? `<div class="stage-list">
             <button type="button" class="stage-card" id="btn-guild-checkin">
               <span class="stage-card-mark" aria-hidden="true">${Mark.checkIn}</span>
               <span class="stage-card-body">
            <strong>${t('ui.b3fe16e64a')}</strong>
                 <small>${t('ui.118337544a')}</small>
               </span>
             </button>
             <button type="button" class="stage-card" id="btn-guild-rename">
               <span class="stage-card-mark" aria-hidden="true">${Mark.rename}</span>
               <span class="stage-card-body">
            <strong>${t('ui.b3fe16e64a')}</strong>
                 <small>${t('ui.e9db3b5735')}</small>
               </span>
             </button>
           </div>`
        : `<div class="guild-join">
             <label class="guild-join-label">${t('ui.f6d4bb4a67')}
               <input id="guild-name-input" maxlength="16" placeholder="${t('ui.b662766cf8')}" />
             </label>
             <button type="button" class="auth-btn-primary full" id="btn-guild-join">${t('ui.8b92576f2b')}</button>
           </div>`
    }
    <p class="section-label">${t('ui.5515ca646d')}</p>
    <div class="guild-board">${board}</div>
  </div>`;
}

function renderGuild(): string {
  const name = save.guildName;
  return hubShell(
    t('ui.81e2301960'),
    name ?? t('ui.928873f927'),
    renderGuildBody(),
  );
}

function renderCommunityModal(): string {
  const name = save.guildName;
  return `<div class="settings-layer community-layer" id="community-layer" ${communityOpen ? "" : "hidden"} aria-hidden="${communityOpen ? "false" : "true"}">
  <button type="button" class="settings-backdrop" id="btn-community-close" aria-label="${escapeHtml(t("community.close"))}"></button>
  <div class="settings-sheet community-sheet" role="dialog" aria-modal="true" aria-labelledby="community-title">
    <div class="settings-sheet-handle" aria-hidden="true"></div>
    ${modalCloseX(t("community.close"), "btn-community-close")}
    <h2 class="settings-title" id="community-title">${escapeHtml(t("nav.community"))}</h2>
    <p class="settings-account">${escapeHtml(name ?? t("ui.928873f927"))}</p>
    ${renderGuildBody()}
  </div>
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
  return hubShell(
    t('ui.81e2301960'),
    `${t('ui.df9d336285')} ${MIDDOT} ${t('ui.d02987ca08')} +1 ${MIDDOT} ${MINUS}${t('ui.dc78e6a251')} ${FUSION_MANA_COST}`,
    `<div class="hub-panel">
    ${renderFusionReveal()}
    <div class="guild-panel fusion-panel">
        <p class="guild-panel-title">${t('ui.6667aae26a')}</p>
      <p class="muted dojo-hint">${t('ui.7882865401')}.</p>
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
                <span class="stage-card-mark" aria-hidden="true">${Mark.fusion}</span>
                <span class="stage-card-body">
                  <strong>${describeOwned(ma)} + ${describeOwned(mb)}</strong>
                  <small>${t('ui.ebc3c5c656')} ${evo} ${MIDDOT} ${MINUS}${t('ui.dc78e6a251')} ${FUSION_MANA_COST}</small>
                </span>
              </button>`;
            })
            .join("")
        : `<p class="muted">${t('ui.6b94c9708e')}</p>`}
    </div>
  </div>`,
  );
}


const STAGE_DIFFICULTIES: {
  id: StageDifficulty;
  labelKo: string;
  blurb: string;
  energyMul: number;
}[] = [
  { id: "normal", labelKo: t('ui.aef1a1e70e'), blurb: t('ui.2387a8e0b0'), energyMul: 1 },
  { id: "hard", labelKo: t('ui.3dfdef02ab'), blurb: t('ui.7be5aa7542'), energyMul: 1.5 },
  { id: "hell", labelKo: t('ui.173366486b'), blurb: t('ui.ab309da205'), energyMul: 2 },
];

function stageEnergyCost(stage: StageDef, diff: StageDifficulty): number {
  const mul =
    STAGE_DIFFICULTIES.find((d) => d.id === diff)?.energyMul ?? 1;
  return Math.max(0, Math.ceil(stage.energyCost * mul));
}

function isDifficultyOpen(stage: StageDef, diff: StageDifficulty): boolean {
  if (diff === "normal") return true;
  const cleared = save.clearedStages.includes(stage.id);
  if (diff === "hard") return cleared;
  // hell: require hard clear tracked via clearedStages (same id) + optional later
  return cleared;
}

function stageDropSlots(stage: StageDef): Array<1 | 2 | 3 | 4 | 5 | 6> {
  if (stage.mode === "scenario") {
    if (stage.stage >= 1 && stage.stage <= 6) {
      return [stage.stage as 1 | 2 | 3 | 4 | 5 | 6];
    }
    return [1, 2, 3, 4, 5, 6];
  }
  const n = ((((stage.stage - 1) % 6) + 6) % 6) + 1;
  return [n as 1 | 2 | 3 | 4 | 5 | 6];
}

function stageDropPreview(stage: StageDef, opts?: { equipWeekly?: boolean }): string {
  const def = SYMBOL_SETS.find((x) => x.id === stage.dropSetId);
  const name = def?.nameKo ?? stage.dropSetId;
  const slots = stageDropSlots(stage);
  const chips = slots
    .map((slot) => {
      const label = `${name}${slot}`;
      return `<span class="stage-drop-piece" title="${label}">
        <img class="stage-drop-piece-ico" src="/art/ui/symbol/${stage.dropSetId}-${slot}.svg" width="28" height="28" alt="${label}" draggable="false" />
        <span class="stage-drop-piece-label">${label}</span>
      </span>`;
    })
    .join("");
  const hasGear =
    !!opts?.equipWeekly || (stage.gearDropChance ?? 0) > 0 || stage.mode === "equip";
  const gear = hasGear
    ? `<span class="stage-drop-piece stage-drop-piece--gear" title="${t('ui.759f762a02')}">
        <img class="stage-drop-piece-ico" src="/art/ui/symbol/gear.svg" width="28" height="28" alt="${t('ui.759f762a02')}" draggable="false" />
        <span class="stage-drop-piece-label">${t('ui.e17b206052')}</span>
      </span>`
    : "";
  return `<span class="stage-card-drops">${chips}${gear}</span>`;
}

function stageButtons(list: StageDef[], opts?: { equipWeekly?: boolean }): string {
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
          ? ` ${MIDDOT} ${t('ui.ba0c9e096f')} ${s.gloryReward}`
          : s.jinmunReward != null
            ? ` ${MIDDOT} ${t('ui.4b482b3675')} ${s.jinmunReward}`
            : "";
      const weekly =
        vaultLeft !== null
          ?  ` ${MIDDOT} ${t('ui.9cbaf58b88')} ${vaultLeft}/${EQUIP_VAULT_WEEKLY_LIMIT}`
          : "";
      const costHint = !diffOpen
        ? t('ui.4292516afd')
        : cost <= 0
          ? t('ui.bc22e8e368')
          : `${t('ui.7dcdb553c8')} ${cost}`;
      const mark = done
        ? CHECK
        : s.mode === "scenario"
          ? `${s.map}-${s.stage}`
          : String(s.boardSize);
      return `<button type="button" class="stage-card stage-card--sortie${done ? " is-cleared" : ""}${!canFight ? " is-disabled" : ""}" data-stage="${s.id}" ${canFight ? "" : "disabled"}>
        <span class="stage-card-mark" aria-hidden="true">${mark}</span>
        <span class="stage-card-body">
          <strong>${label} ${MIDDOT} ${s.nameKo}</strong>
          <small>${s.boardSize}${TIMES}${s.boardSize} ${MIDDOT} ${t('ui.fe1fb24836')} ${s.waves}${extra}${weekly}</small>
          ${stageDropPreview(s, opts)}
        </span>
        <span class="stage-card-cost${cost > energyNow && diffOpen ? " is-short" : ""}">
          <strong>${costHint}</strong>
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
    name: pin.areaKo,
    blurb: `${t('ui.9d96ebc162')} ${MIDDOT} ${pin.areaKo}`,
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
    depth: { name: t('ui.cd2bb578b4'), blurb: t('ui.7316fbbfa6'), stages: DEPTH_STAGES },
    arena: { name: t('ui.262553905b'), blurb: t('ui.be1af5568b'), stages: ARENA_STAGES },
    cadence: {
      name: t('ui.e0536c253c'),
      blurb: t('ui.4d59148e17'),
      stages: [...WEEKDAY_STAGES, ...TRIAL_STAGES],
    },
    equip: {
      name: t('ui.6003da6bd2'),
      blurb: t('ui.e00890de86'),
      stages: EQUIP_STAGES,
      equipWeekly: true,
    },
    warena: {
      name: t("stages.warena"),
      blurb: t("stages.warenaBlurb"),
      stages: WORLD_ARENA_STAGES,
      warena: true,
    },
    guild: {
      name: t("stages.guildRaid"),
      blurb: t("stages.guildRaidBlurb"),
      stages: GUILD_RAID_STAGES,
      guild: true,
    },
  };
  const sideRegions: StagesRegion[] = SIDE_CONTENT_PIN_LAYOUT.map((pin) => {
    const meta = sideMeta[pin.id]!;
    return {
      id: pin.id,
      name: meta.name,
      blurb: `${meta.blurb} ${MIDDOT} ${pin.landmarkKo}`,
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

function regionDifficultyOpen(region: StagesRegion, diff: StageDifficulty): boolean {
  if (diff === "normal") return true;
  return region.stages.some((s) => isDifficultyOpen(s, diff));
}

/** Open/close/refresh the region sheet without redrawing the world map. */
function applyStagesRegionOpen(): void {
  const host = app.querySelector<HTMLElement>("#stages-region-host");
  if (!host) return;

  app.querySelectorAll<HTMLButtonElement>("[data-region]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.region === stagesRegion);
  });

  const selected = stagesRegion
    ? stagesRegions().find((r) => r.id === stagesRegion) ?? null
    : null;
  if (!selected) {
    host.innerHTML = "";
    return;
  }
  if (!regionDifficultyOpen(selected, stageEntryDiff)) {
    stageEntryDiff = "normal";
  }
  host.innerHTML = renderStagesRegionSheet(selected);
  const layer = host.querySelector<HTMLElement>(".stages-region-layer");
  if (layer) replayModalPop(layer);
  bindStagesRegionSheet();
}

function bindStagesRegionSheet(): void {
  const host = app.querySelector("#stages-region-host");
  if (!host) return;

  host.querySelectorAll<HTMLButtonElement>("[data-modal-x-for]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const id = btn.dataset.modalXFor;
      if (!id) return;
      host.querySelector<HTMLButtonElement>(`#${CSS.escape(id)}`)?.click();
    });
  });

  host.querySelector("#btn-region-close")?.addEventListener("click", () => {
    stagesRegion = null;
    stageEntryId = null;
    applyStagesRegionOpen();
  });

  host.querySelector("#region-diff-select")?.addEventListener("change", (ev) => {
    const v = (ev.target as HTMLSelectElement).value as StageDifficulty;
    if (v === "normal" || v === "hard" || v === "hell") {
      stageEntryDiff = v;
      applyStagesRegionOpen();
    }
  });

  host.querySelectorAll<HTMLButtonElement>("[data-stage]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stage = getStage(btn.dataset.stage!);
      if (stage) startBattle(stage, stageEntryDiff);
    });
  });

  host.querySelectorAll<HTMLButtonElement>("[data-ban-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.banToggle!;
      const cur = [...(save.arenaBanIds ?? [])];
      const idx = cur.indexOf(id);
      if (idx >= 0) cur.splice(idx, 1);
      else if (cur.length < 2) cur.push(id);
      else {
        flash(t("ui.522ab79351"));
        return;
      }
      const r = runSetArenaBans(save, cur);
      save = r.save;
      persist();
      flash(r.message);
      applyStagesRegionOpen();
    });
  });

  host.querySelector("#btn-season-claim")?.addEventListener("click", () => {
    const r = runClaimSeasonReward(save);
    save = r.save;
    persist();
    flash(r.message);
    applyStagesRegionOpen();
  });
}

function renderStagesRegionSheet(region: StagesRegion): string {
  const prog = regionProgress(region.stages);
  const bans = save.arenaBanIds ?? [];
  const seasonWins = save.arenaSeasonWins ?? 0;
  const claimed = save.seasonRewardsClaimed ?? 0;
  const nextTierAt = (claimed + 1) * SEASON_REWARD_WINS;
  const energyNow = Math.floor(save.island.energy);
  const energyMax = save.island.energyMax ?? 100;
  const diffMeta =
    STAGE_DIFFICULTIES.find((d) => d.id === stageEntryDiff) ??
    STAGE_DIFFICULTIES[0]!;

  const diffOptions = STAGE_DIFFICULTIES.map((d) => {
    const open = regionDifficultyOpen(region, d.id);
    const selected = d.id === stageEntryDiff ? "selected" : "";
    const label = open ? d.labelKo : `${d.labelKo} (${t('ui.956f2f4243')})`;
    return `<option value="${d.id}" ${selected} ${open ? "" : "disabled"}>${label}</option>`;
  }).join("");

  let extras = "";
  if (region.equipWeekly) {
    extras = `<p class="stages-note">${t('ui.e35b325054')} ${equipVaultRemaining(syncEquipVaultWeek(save))}/${EQUIP_VAULT_WEEKLY_LIMIT} ${MIDDOT} ${t('ui.6a432402bd')}</p>`;
  }
  if (region.guild) {
    extras = `<p class="stages-note">${t('ui.fe2c5c3e7d')} ${save.guildContribution ?? 0} ${MIDDOT} ${t('ui.3ea974d72f')} +${save.guildRaidBest ?? 0}</p>`;
  }
  if (region.warena) {
    const banPool = [
      ...new Set(WORLD_ARENA_STAGES.flatMap((s) => s.enemyMonsterIds)),
    ];
    const banRow = banPool
      .map((id) => {
        const m = getMonster(id);
        const on = bans.includes(id);
        return `<button type="button" class="ban-chip${on ? " active" : ""}" data-ban-toggle="${id}">
          <span class="ban-chip-mark" aria-hidden="true">${on ? Mark.banOn : Mark.banOff}</span>
          <span class="ban-chip-body">
            <strong>${m?.nameKo ?? id}</strong>
            <small>${on ? t('ui.402782da6b') : t('ui.25a68ffa5c')}</small>
          </span>
        </button>`;
      })
      .join("");
    extras = `<div class="season-panel">
        <p class="season-panel-title">${t('ui.b78477b088')} ${seasonWins}</p>
        <p class="muted stages-note">${t('ui.45e62f7d49')} ${nextTierAt}${t('ui.3b1908b79a')} ${MIDDOT} ${t('ui.d18227b255')} ${claimed}</p>
        <button type="button" class="auth-btn-primary full" id="btn-season-claim">${t('ui.8b8572eda1')}</button>
      </div>
      <p class="stages-note">${t('ui.ca139249b0')} ${bans.length ? bans.map((id) => getMonster(id)?.nameKo ?? id).join(", ") : t('ui.d58fa73adc')} ${MIDDOT} ${t('ui.869e9feb1b')} 2</p>
      <div class="ban-row">${banRow}</div>`;
  }

  const mqPin = isMainQuestRegion(region.id)
    ? MAIN_QUEST_PIN_LAYOUT.find((p) => p.id === region.id)
    : null;
  const regionTitle = mqPin
    ? `<span class="stages-pin-num" aria-hidden="true">${mqPin.map}</span>${region.name}`
    : region.name;

  return `<div class="stages-region-layer" id="stages-region-layer">
    <button type="button" class="stages-region-backdrop" id="btn-region-close" aria-label="${t('ui.94b7dba159')}"></button>
    <div class="stages-region-sheet stages-region-sheet--card stages-region-sheet--${region.tone}" role="dialog" aria-modal="true" aria-labelledby="stages-region-title">
      ${modalCloseX(t("ui.94b7dba159"), "btn-region-close")}
      <header class="stages-region-head">
        <div class="stages-region-head-main">
          <p class="stages-region-kicker">${region.blurb}</p>
          <div class="stages-region-title-row">
            <h2 class="stages-region-title" id="stages-region-title">${regionTitle}</h2>
            <label class="stages-region-diff-inline">
              <span class="sr-only">${t('ui.94b7dba159')}</span>
              <select class="stages-region-diff-select" id="region-diff-select" aria-label="${t('ui.1a3b3223e1')}" title="${diffMeta.blurb}">
                ${diffOptions}
              </select>
            </label>
          </div>
          <p class="stages-meta">${t('ui.330ccf22cb')} ${prog.cleared}/${prog.total}${prog.unlocked ? "" : ` ${MIDDOT} ${t('ui.956f2f4243')}`} ${MIDDOT} ${t('ui.7dcdb553c8')} ${energyNow}/${energyMax}</p>
        </div>
      </header>
      ${extras}
      <div class="stage-list stage-list--expedition">${stageButtons(region.stages, { equipWeekly: region.equipWeekly })}</div>
    </div>
  </div>`;
}
function renderStages(): string {
  const regions = stagesRegions();
  const mqNodes = MAIN_QUEST_PIN_LAYOUT.map(
    (p) =>
      `<span class="stages-mq-node" style="left:${p.x}%;top:${p.y}%" aria-hidden="true"><span class="stages-mq-node-core"></span></span>`,
  ).join("");
  const pins = regions
    .map((r) => {
      const prog = regionProgress(r.stages);
      const active = stagesRegion === r.id;
      const mq = isMainQuestRegion(r.id);
      const pinLayout = mq
        ? MAIN_QUEST_PIN_LAYOUT.find((p) => p.id === r.id)
        : null;
      const mark = mq ? String(pinLayout?.map ?? "") : "";
      const sub = mq
        ? `${prog.cleared}/${STAGES_PER_AREA}`
        : `${prog.cleared}/${prog.total}`;
      const lockMark = prog.unlocked
        ? ""
        : `<span class="stages-pin-lock" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-6-2a2 2 0 1 1 4 0v2h-4V7zm6 12H7v-8h10v8z"/></svg></span>`;
      const titleNum = mark
        ? `<span class="stages-pin-num" aria-hidden="true">${mark}</span>`
        : "";
      const ariaName = mark ? `${mark} ${r.name}` : r.name;
      return `<button type="button" class="stages-pin ${mq ? "stages-pin--mq" : "stages-pin--side"} stages-pin--${r.tone}${prog.unlocked ? "" : " is-locked"}${active ? " is-active" : ""}${prog.cleared === prog.total && prog.total > 0 ? " is-cleared" : ""}" style="left:${r.x}%;top:${r.y}%" data-region="${r.id}" aria-label="${ariaName}${prog.unlocked ? "" : ` ${MIDDOT} ${t('ui.b35f488f01')}`}" ${prog.unlocked ? "" : 'data-locked="1"'}>
        <span class="stages-pin-dot" aria-hidden="true">${mq ? `<span class="stages-pin-mark">${mark}</span>` : ""}</span>
        <span class="stages-pin-label">
          <strong>${lockMark}${titleNum}${r.name}</strong>
          <small>${prog.unlocked ? sub : t('ui.759f762a02')}</small>
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
        <div class="stages-mq-nodes">${mqNodes}</div>
        <div class="stages-map-pins">${pins}</div>
      </div>
    </div>
    <div id="stages-region-host"></div>
  </div>`;
}

function renderBattleTicker(): string {
  if (!battle) return "";
  // ASCII-safe keyword list (\u escapes) — do not use Hangul regex literals here.
  const keys = [
    t('ui.f4d93d3cf8'),
    t('ui.048b7511df'),
    t('ui.00faa47381'),
    t('ui.fe1fb24836'),
    t('ui.00b2768bcc'),
    t('ui.c1ef178866'),
    t('ui.413147d435'),
    "defeated",
    t('ui.95ca12ad92'),
    t('ui.f3d47aa42f'),
    t('ui.b4d6128261'),
    t('ui.aad8793826'),
    t('ui.0898bd2315'),
    t('ui.bf60bb0a77'),
    t('ui.e36213525e'),
    t('ui.bff20dc3bb'),
    t('ui.c2646fe538'),
    t('ui.85de958b5f'),
    t('ui.06dd3affb3'),
    t('ui.4d67306e14'),
    t('ui.e480e4fefe'),
    t('ui.b89e5dbdd6'),
    t('ui.7311d239fd'),
    t('ui.511fa65e38'),
    t('ui.329b63fdf1'),
    t('ui.d5028d9279'),
  ];
  const lines = battle.log
    .filter((l) => keys.some((k) => l.includes(k)))
    .slice(-3);
  if (!lines.length) {
    return `<div class="battle-ticker muted">${t('ui.0fd080f51d')}</div>`;
  }
  return `<div class="battle-ticker" aria-live="polite">${lines
    .map((l) => `<span>${l}</span>`)
    .join("")}</div>`;
}

function renderBattle(manaPct: number): string {
  if (!battle || !currentStage) return "";
  const allyUnits = battle.units.filter((u) => u.team === "ally");
  const enemyUnits = battle.units.filter((u) => u.team === "enemy");
  const phase = battle.circle.boardPhase;
  const phaseLabel =
    phase <= 0 ? t('ui.d2342783cb') : `${t('ui.00b2768bcc')} ${"I".repeat(Math.min(phase, 3))}`;
  const active = battle.activeUnitId
    ? battle.getUnit(battle.activeUnitId) ?? null
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
      ? ` ${MIDDOT} ${t('ui.511fa65e38')} ${battle.brilliantCount}/${battle.brilliantGoal}${battle.brilliantDone ? CHECK : ""}`
      : "";
  const boardTag =
    battle.boards.length > 1 ? ` ${MIDDOT} ${battle.boardLabel}` : "";
  const status = battle.finishReason
    ? battle.finishReason === "ally_win"
      ? t('ui.ba130f3539')
      : t('ui.8d9e9106fa')
    : `${battle.phase} ${MIDDOT} amp ${battle.currentAmplify().toFixed(2)}/${battle.powerAmplifyCap().toFixed(2)} ${MIDDOT} ${phaseLabel} (${battle.circle.stoneSummonCount}/${battle.circle.resetThreshold})${mission}${boardTag}`;

  const skillHint =
    battle.phase === "await_stone" && active?.team === "ally"
      ? t('ui.62b39a7abd')
      : awaitShop
        ? t('ui.e724206861')
      : awaitSkill
        ? t('ui.250a3a4d15')
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
    : `<div class="skill-dock skill-dock--stage${showBoardSwitch ? " has-switch" : ""}${awaitSkill ? " is-armed" : ""}">
      <div class="skill-cluster skill-cluster--unit">
        ${renderSkillButtons(active, awaitSkill)}
      </div>
      <div class="skill-cluster skill-cluster--summoner" aria-label="${t('ui.5618aec54c')}">
        <button type="button" id="sk-ult" class="summoner-sk ult${canUlt ? " ready" : ""}" ${awaitSkill && canUlt ? "" : "disabled"}><span class="sk-mark" aria-hidden="true">${Mark.open}</span><span class="sk-name">${t('ui.2d99fde255')}</span></button>
        <button type="button" id="sk-declare" class="summoner-sk declare${canDeclare ? " ready" : ""}" ${awaitSkill && canDeclare ? "" : "disabled"}><span class="sk-mark" aria-hidden="true">${Mark.declare}</span><span class="sk-name">${t('ui.bd1967124e')}</span></button>
        <button type="button" id="sk-dual" class="summoner-sk dual${canDual ? " ready" : ""}" ${awaitSkill && canDual ? "" : "disabled"}><span class="sk-mark" aria-hidden="true">${Mark.dual}</span><span class="sk-name">${t('ui.1fa6111a65')}</span></button>
        <button type="button" id="sk-clean" class="summoner-sk clean${canClean ? " ready" : ""}" ${awaitSkill && canClean ? "" : "disabled"}><span class="sk-mark" aria-hidden="true">${Mark.clean}</span><span class="sk-name">${t('ui.ac2f6c7ca5')}</span></button>
        <button type="button" id="sk-guard" class="summoner-sk guard${canGuard ? " ready" : ""}" ${awaitSkill && canGuard ? "" : "disabled"}><span class="sk-mark" aria-hidden="true">${Mark.guard}</span><span class="sk-name">${t('ui.0be109c051')}</span></button>
      </div>
      <div class="skill-cluster skill-cluster--util">
        <button type="button" id="sk-smart" class="smart" ${awaitSkill ? "" : "disabled"}>${t('ui.4b0ea2fcd0')}</button>
        ${
          showBoardSwitch
            ? `<button type="button" class="secondary board-switch" id="btn-board-switch">${t('ui.bf185333fe')} ${battle.boardLabel === t('ui.8bbc778e36') ? "?B" : "?A"}</button>`
            : ""
        }
      </div>
    </div>`;

  const manaTone =
    manaPct >= 99 ? " is-full" : manaPct >= 40 ? " is-charged" : "";
  const stageTitle = escapeHtml(currentStage.nameKo);

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
      <div class="battle-arena-floor"></div>
    </div>
    <header class="battle-chrome">
      ${renderBattleTicker()}
      <div class="battle-stage-pill" title="${stageTitle}">
        <strong class="battle-stage-name">${stageTitle}</strong>
        <span class="battle-wave">${currentStage.boardSize}?${currentStage.boardSize} (${battle.currentWave}/${battle.totalWaves})</span>
      </div>
    </header>
    <div class="battle-layout battle-layout--framed battle-layout--stage">
    ${status ? `<div class="battle-status battle-status--overlay">${status}</div>` : ""}
    <div class="battle-lane enemy">
      ${renderBattleFront(enemyUnits, "enemy", { targetable: awaitSkill })}
    </div>
    <div class="board-wrap board-wrap--stage">
      ${renderBoardTabs()}
      <div class="dmg-layer">${renderDmgLayer()}</div>
      ${renderBoard()}
      ${renderSuggestStrip()}
      ${renderCaptureShop()}
      <div class="mana-block mana-block--compact${manaTone}">
        <div class="mana-head">
          <span class="mana-label">${t('ui.7ff9ee538f')}</span>
          <span class="mana-nums">${Math.floor(battle.allySummoner.mana)}<small>/${battle.allySummoner.manaMax}</small></span>
        </div>
        <div class="bar mana mana-lg"><i style="width:${manaPct}%"></i></div>
      </div>
    </div>
    ${skillRow}
    ${skillHint ? `<p class="skill-hint">${skillHint}</p>` : ""}
    <div class="battle-lane ally">
      ${renderBattleFront(allyUnits, "ally")}
    </div>
    <div class="battle-hud battle-hud--stage">
      ${navBackBtn({ id: "btn-back", label: t('ui.1a7f31cadb') })}
      <div class="battle-hud-actions">
        <button type="button" class="secondary" id="btn-speed">x${battleSpeed}</button>
        <button type="button" id="btn-auto-toggle" class="${autoMode ? "auto-on" : ""}">${autoMode ? "AUTO ON" : "AUTO"}</button>
      </div>
    </div>
  </div>
  </div>`;
}

function bindAuth(): void {
  app.querySelector("#auth-open-login")?.addEventListener("click", () => {
    authUi.pane = "login";
    render();
  });

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

  app.querySelector("#auth-register")?.addEventListener("click", () => {
    authUi.pane = "register";
    render();
  });
  app.querySelector("#auth-back")?.addEventListener("click", () => {
    authUi.pane = "gate";
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
        ? t('ui.0b00025fb4')
              : body.error === "invalid_credentials"
                ? t('ui.0e5bf793ef')
                : t('ui.c17466f9ed'),
          );
          render();
          return;
        }
        const enterGame =
          authUi.pane === "register" ? true : readAuthPrefs().autoLogin;
        await enterWithUser(body.user, { enterGame });
      } catch {
    flash(t('ui.b72f5a4752'));
        render();
      }
    })();
  });
}

function islandMapNaturalSize(world: HTMLElement): { w: number; h: number } {
  const img = world.querySelector<HTMLImageElement>(".island-map-img");
  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    return { w: img.naturalWidth, h: img.naturalHeight };
  }
  return { w: ISLAND_MAP_NATURAL.w, h: ISLAND_MAP_NATURAL.h };
}

/** Min zoom that still full-bleeds the viewport (no letterbox / map-edge framing). */
function islandZoomMin(): number {
  const coverW = 1 / (ISLAND_WORLD_PCT.w * ISLAND_BASE_SCALE);
  const coverH = 1 / (ISLAND_WORLD_PCT.h * ISLAND_BASE_SCALE);
  return Math.max(coverW, coverH) * ISLAND_ZOOM_MIN_OVERSCAN;
}

/** Max zoom before the map bitmap is CSS-upsampled (blur). At least default framing (1). */
function islandZoomMax(world: HTMLElement): number {
  const W = world.offsetWidth;
  const H = world.offsetHeight;
  if (W <= 0 || H <= 0 || islandZoom <= 0) return 1;
  const nat = islandMapNaturalSize(world);
  // Layout size at zoom 1 (current size is proportional to islandZoom).
  const baseW = W / islandZoom;
  const baseH = H / islandZoom;
  const coverAt1 = Math.max(baseW / nat.w, baseH / nat.h);
  if (coverAt1 <= 0) return 1;
  const sharpMax = ISLAND_ZOOM_SHARP_PAD / coverAt1;
  const minZ = islandZoomMin();
  return Math.min(ISLAND_ZOOM_MAX_HARD, Math.max(minZ, 1, sharpMax));
}

function islandOriginPx(world: HTMLElement): { ox: number; oy: number } {
  return {
    ox: world.offsetWidth * ISLAND_TRANSFORM_ORIGIN.x,
    oy: world.offsetHeight * ISLAND_TRANSFORM_ORIGIN.y,
  };
}

function applyIslandPan(): void {
  const world = app.querySelector<HTMLElement>("#island-world");
  if (world) {
    world.style.setProperty("--island-zoom", islandZoom.toFixed(4));
    world.style.transform = `translate3d(${islandPan.x}px,${islandPan.y}px,0) rotateX(${ISLAND_ROTATE_X_DEG}deg) scale(${ISLAND_BASE_SCALE})`;
  }
}

function clampIslandPan(viewport: HTMLElement, world: HTMLElement): void {
  const s = ISLAND_BASE_SCALE;
  const W = world.offsetWidth;
  const H = world.offsetHeight;
  if (W <= 0 || H <= 0) return;
  const { ox, oy } = islandOriginPx(world);
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const maxX = -ox * (1 - s);
  const minX = vw - W * s - ox * (1 - s);
  const maxY = -oy * (1 - s);
  const minY = vh - H * s - oy * (1 - s);
  if (minX > maxX) {
    islandPan.x = (vw - W * s) / 2 - ox * (1 - s);
  } else {
    islandPan.x = Math.min(maxX, Math.max(minX, islandPan.x));
  }
  if (minY > maxY) {
    islandPan.y = (vh - H * s) / 2 - oy * (1 - s);
  } else {
    islandPan.y = Math.min(maxY, Math.max(minY, islandPan.y));
  }
}

function zoomIslandAt(
  viewport: HTMLElement,
  world: HTMLElement,
  clientX: number,
  clientY: number,
  nextZoom: number,
): void {
  const maxZ = islandZoomMax(world);
  const minZ = islandZoomMin();
  const z = Math.min(maxZ, Math.max(minZ, nextZoom));
  if (Math.abs(z - islandZoom) < 1e-5) return;

  const s = ISLAND_BASE_SCALE;
  const rect = viewport.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  const prevW = world.offsetWidth;
  const prevH = world.offsetHeight;
  if (prevW <= 0 || prevH <= 0) return;
  const { ox, oy } = islandOriginPx(world);
  const lx = (mx - islandPan.x - ox * (1 - s)) / s;
  const ly = (my - islandPan.y - oy * (1 - s)) / s;
  const fx = lx / prevW;
  const fy = ly / prevH;

  islandZoom = z;
  applyIslandPan();
  // Reflow so offsetWidth reflects the new --island-zoom layout size.
  const newW = world.offsetWidth;
  const newH = world.offsetHeight;
  const ox2 = newW * ISLAND_TRANSFORM_ORIGIN.x;
  const oy2 = newH * ISLAND_TRANSFORM_ORIGIN.y;
  islandPan.x = mx - fx * newW * s - ox2 * (1 - s);
  islandPan.y = my - fy * newH * s - oy2 * (1 - s);
  clampIslandPan(viewport, world);
  applyIslandPan();
}

function islandPinchDistance(): number {
  if (islandActivePointers.size < 2) return 0;
  const pts = [...islandActivePointers.values()];
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
}

function islandPinchMidpoint(): { x: number; y: number } {
  const pts = [...islandActivePointers.values()];
  return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
}

function bindIslandPan(): void {
  const viewport = app.querySelector<HTMLElement>("#island-viewport");
  const world = app.querySelector<HTMLElement>("#island-world");
  if (!viewport || !world) return;

  islandActivePointers.clear();
  islandPinch = null;
  if (islandCoverFitApplied !== ISLAND_COVER_FIT_VERSION) {
    islandCoverFitApplied = ISLAND_COVER_FIT_VERSION;
    islandPanCentered = false;
    islandZoom = Math.max(islandZoomMin(), 1);
  }
  applyIslandPan();

  const finishClamp = () => {
    const minZ = islandZoomMin();
    const maxZ = islandZoomMax(world);
    if (islandZoom < minZ) {
      islandZoom = minZ;
      islandPanCentered = false;
    }
    if (islandZoom > maxZ) islandZoom = maxZ;
    if (!islandPanCentered && world.offsetWidth > 0) {
      const s = ISLAND_BASE_SCALE;
      const { ox, oy } = islandOriginPx(world);
      islandPan.x = (viewport.clientWidth - world.offsetWidth * s) / 2 - ox * (1 - s);
      islandPan.y =
        (viewport.clientHeight - world.offsetHeight * s) / 2 - oy * (1 - s) + viewport.clientHeight * 0.05;
      islandPanCentered = true;
    }
    clampIslandPan(viewport, world);
    applyIslandPan();
  };
  finishClamp();
  requestAnimationFrame(finishClamp);
  const mapImg = world.querySelector<HTMLImageElement>(".island-map-img");
  if (mapImg && !mapImg.complete) {
    mapImg.addEventListener("load", finishClamp, { once: true });
  }

  viewport.addEventListener(
    "wheel",
    (ev) => {
      ev.preventDefault();
      const factor = Math.exp(-ev.deltaY * 0.0016);
      zoomIslandAt(viewport, world, ev.clientX, ev.clientY, islandZoom * factor);
    },
    { passive: false },
  );

  viewport.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    islandActivePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

    if (islandActivePointers.size >= 2) {
      islandPanDrag = null;
      clearIslandLongPress();
      const dist = islandPinchDistance();
      if (dist > 0) {
        islandPinch = { startDist: dist, startZoom: islandZoom };
        viewport.setAttribute("data-pan-moved", "1");
      }
      try {
        viewport.setPointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
      return;
    }

    const onSpot = (ev.target as HTMLElement | null)?.closest?.("[data-b]");
    if (islandLayoutEdit && onSpot) return;
    if (onSpot && !islandLayoutEdit) {
      // Long-press handler owns the gesture until cancelled.
      return;
    }
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
    if (islandActivePointers.has(ev.pointerId)) {
      islandActivePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    }

    if (islandPinch && islandActivePointers.size >= 2) {
      const dist = islandPinchDistance();
      if (dist > 0 && islandPinch.startDist > 0) {
        const mid = islandPinchMidpoint();
        zoomIslandAt(
          viewport,
          world,
          mid.x,
          mid.y,
          islandPinch.startZoom * (dist / islandPinch.startDist),
        );
      }
      return;
    }

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
    islandActivePointers.delete(ev.pointerId);
    if (islandActivePointers.size < 2) {
      islandPinch = null;
      if (islandActivePointers.size === 0) {
        queueMicrotask(() => viewport.removeAttribute("data-pan-moved"));
      }
    }

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

/**
 * Size the pannable world to the atlas aspect ratio so pin left%/top% map 1:1
 * onto stages-world-map.png on every device (no object-fit cover crop drift).
 */
function sizeStagesWorld(viewport: HTMLElement, world: HTMLElement): void {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  if (vw <= 0 || vh <= 0) return;
  let worldH = Math.max(
    vh * STAGES_WORLD_OVERSCAN,
    (vw * STAGES_WORLD_OVERSCAN) / STAGES_MAP_ASPECT,
  );
  let worldW = worldH * STAGES_MAP_ASPECT;
  if (worldW < vw * 1.08) {
    worldW = vw * STAGES_WORLD_OVERSCAN;
    worldH = worldW / STAGES_MAP_ASPECT;
  }
  if (worldH < vh * 1.08) {
    worldH = vh * STAGES_WORLD_OVERSCAN;
    worldW = worldH * STAGES_MAP_ASPECT;
  }
  world.style.width = `${Math.round(worldW)}px`;
  world.style.height = `${Math.round(worldH)}px`;
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
    sizeStagesWorld(viewport, world);
    if (stagesMapFitApplied !== STAGES_MAP_FIT_VERSION) {
      stagesPanCentered = false;
      stagesMapFitApplied = STAGES_MAP_FIT_VERSION;
    }
    if (!stagesPanCentered && world.offsetWidth > 0) {
      // Bias toward the MQ corridor start (lower-center of the atlas).
      stagesPan.x = (viewport.clientWidth - world.offsetWidth) * 0.42;
      stagesPan.y = (viewport.clientHeight - world.offsetHeight) * 0.72;
      stagesPanCentered = true;
    }
    clampStagesPan(viewport, world);
    applyStagesPan();
  };
  finishClamp();
  requestAnimationFrame(finishClamp);

  stagesWorldResizeObs?.disconnect();
  stagesWorldResizeObs = new ResizeObserver(() => {
    sizeStagesWorld(viewport, world);
    clampStagesPan(viewport, world);
    applyStagesPan();
  });
  stagesWorldResizeObs.observe(viewport);

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

function clearIslandLongPress(): void {
  if (islandLongPress) {
    clearTimeout(islandLongPress.timer);
    islandLongPress = null;
  }
}

function bindIslandLayoutEdit(): void {
  const viewport = app.querySelector<HTMLElement>("#island-viewport");
  const world = app.querySelector<HTMLElement>("#island-world");
  if (!viewport || !world) return;

  app.querySelector("#btn-island-layout-done")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    exitIslandLayoutEdit(true);
  });
  app.querySelector("#btn-island-layout-reset")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    islandLayoutDraft = { ...ISLAND_LAYOUT_DEFAULT };
    writeIslandLayout(islandLayoutDraft);
    flash(t('ui.f88240ee56'));
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-b]").forEach((btn) => {
    btn.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      const id = btn.dataset.b;
      if (!id) return;

      if (islandLayoutEdit) {
        ev.preventDefault();
        ev.stopPropagation();
        islandPanDrag = null;
        islandSpotDrag = { id, pointerId: ev.pointerId };
        btn.classList.add("is-layout-focus", "is-dragging");
        try {
          btn.setPointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }

      clearIslandLongPress();
      islandLongPress = {
        id,
        pointerId: ev.pointerId,
        startX: ev.clientX,
        startY: ev.clientY,
        timer: setTimeout(() => {
          if (!islandLongPress || islandLongPress.id !== id) return;
          islandLongPress = null;
          islandPanDrag = null;
          try {
            navigator.vibrate?.(24);
          } catch {
            /* ignore */
          }
          enterIslandLayoutEdit(id);
        }, 520),
      };
    });

    btn.addEventListener("pointermove", (ev) => {
      if (
        islandLongPress &&
        islandLongPress.pointerId === ev.pointerId &&
        Math.hypot(ev.clientX - islandLongPress.startX, ev.clientY - islandLongPress.startY) > 12
      ) {
        clearIslandLongPress();
        // Hand off to pan.
        islandPanDrag = {
          pointerId: ev.pointerId,
          startX: ev.clientX,
          startY: ev.clientY,
          origX: islandPan.x,
          origY: islandPan.y,
          moved: true,
        };
        try {
          viewport.setPointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }

      if (!islandSpotDrag || islandSpotDrag.pointerId !== ev.pointerId) return;
      if (islandSpotDrag.id !== btn.dataset.b) return;
      ev.preventDefault();
      ev.stopPropagation();
      const pct = clientToIslandPct(ev.clientX, ev.clientY, world);
      applyIslandSpotPosDom(islandSpotDrag.id, pct.x, pct.y);
    });

    const endSpot = (ev: PointerEvent) => {
      if (islandLongPress && islandLongPress.pointerId === ev.pointerId) {
        clearIslandLongPress();
      }
      if (!islandSpotDrag || islandSpotDrag.pointerId !== ev.pointerId) return;
      btn.classList.remove("is-dragging");
      islandSpotDrag = null;
      islandLayoutSuppressClick = true;
      queueMicrotask(() => {
        islandLayoutSuppressClick = false;
      });
    };
    btn.addEventListener("pointerup", endSpot);
    btn.addEventListener("pointercancel", endSpot);
  });
}

function bind(): void {
  app.querySelectorAll<HTMLButtonElement>("[data-modal-x-for]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const id = btn.dataset.modalXFor;
      if (!id) return;
      app.querySelector<HTMLButtonElement>(`#${CSS.escape(id)}`)?.click();
    });
  });

  if (view === "auth") {
    bindAuth();
    return;
  }

  if (view === "home") {
    bindIslandPan();
    bindIslandLayoutEdit();
  }
  bindChatUi();

  const toggleSummonerPicker = () => {
    summonerPickerOpen = !summonerPickerOpen;
    if (summonerPickerOpen) {
      resMoreOpen = false;
      settingsOpen = false;
      mailboxOpen = false;
      notifOpen = false;
      missionOpen = false;
      communityOpen = false;
      shopOpen = false;
      closeChatOverlay();
      applyResMoreOpen();
      applySettingsOpen();
      applyMailboxOpen();
      applyNotifOpen();
      applyMissionOpen();
      applyCommunityOpen();
      applyShopOpen();
    }
    applySummonerPickerOpen();
  };

  app.querySelector("#btn-nav-summoner")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    toggleSummonerPicker();
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
      flash(t("summonerPicker.switched", { element: elementLabel(el) }));
      render();
    });
  });

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
      missionOpen = false;
      communityOpen = false;
      shopOpen = false;
      closeChatOverlay();
      applyMailboxOpen();
      applyNotifOpen();
      applyMissionOpen();
      applyCommunityOpen();
      applyShopOpen();
    }
    if (summonerPickerOpen) {
      summonerPickerOpen = false;
      applySummonerPickerOpen();
    }
    if (resMoreOpen) {
      resMoreOpen = false;
      applyResMoreOpen();
    }
    applySettingsOpen();
  });

  app.querySelector("#btn-settings-close")?.addEventListener("click", () => {
    settingsOpen = false;
    applySettingsOpen();
  });

  app.querySelector("#btn-mission")?.addEventListener("click", () => {
    missionOpen = !missionOpen;
    if (missionOpen) {
      settingsOpen = false;
      mailboxOpen = false;
      notifOpen = false;
      summonerPickerOpen = false;
      resMoreOpen = false;
      communityOpen = false;
      shopOpen = false;
      closeChatOverlay();
      applySettingsOpen();
      applyMailboxOpen();
      applyNotifOpen();
      applySummonerPickerOpen();
      applyResMoreOpen();
      applyCommunityOpen();
      applyShopOpen();
    }
    applyMissionOpen();
  });
  app.querySelector("#btn-mission-close")?.addEventListener("click", () => {
    missionOpen = false;
    applyMissionOpen();
  });
  app.querySelectorAll<HTMLButtonElement>("[data-mission-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.missionTab;
      if (tab !== "daily" && tab !== "achievements") return;
      missionTab = tab;
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-mission-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nav = btn.dataset.missionGo;
      if (!nav) return;
      missionOpen = false;
      if (nav === "guild") {
        openCommunityModal();
        render();
        return;
      }
      if (nav === "shop") {
        openShopModal();
        render();
        return;
      }
      communityOpen = false;
      shopOpen = false;
      view = nav as View;
      render();
    });
  });

  app.querySelector("#btn-community")?.addEventListener("click", () => {
    communityOpen = !communityOpen;
    if (communityOpen) {
      settingsOpen = false;
      mailboxOpen = false;
      notifOpen = false;
      summonerPickerOpen = false;
      resMoreOpen = false;
      missionOpen = false;
      shopOpen = false;
      closeChatOverlay();
      applySettingsOpen();
      applyMailboxOpen();
      applyNotifOpen();
      applySummonerPickerOpen();
      applyResMoreOpen();
      applyMissionOpen();
      applyShopOpen();
    }
    applyCommunityOpen();
  });
  app.querySelector("#btn-community-close")?.addEventListener("click", () => {
    communityOpen = false;
    applyCommunityOpen();
  });

  app.querySelector("#btn-shop")?.addEventListener("click", () => {
    shopOpen = !shopOpen;
    if (shopOpen) {
      settingsOpen = false;
      mailboxOpen = false;
      notifOpen = false;
      summonerPickerOpen = false;
      resMoreOpen = false;
      missionOpen = false;
      communityOpen = false;
      closeChatOverlay();
      applySettingsOpen();
      applyMailboxOpen();
      applyNotifOpen();
      applySummonerPickerOpen();
      applyResMoreOpen();
      applyMissionOpen();
      applyCommunityOpen();
    }
    applyShopOpen();
  });
  app.querySelector("#btn-shop-close")?.addEventListener("click", () => {
    shopOpen = false;
    applyShopOpen();
  });

  app.querySelector<HTMLSelectElement>("#settings-lang")?.addEventListener("change", (ev) => {
    const next = (ev.currentTarget as HTMLSelectElement).value as LocaleId;
    setLocale(next);
    settingsOpen = true;
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
      missionOpen = false;
      communityOpen = false;
      shopOpen = false;
      applyNotifOpen();
      applySettingsOpen();
      applyMissionOpen();
      applyCommunityOpen();
      applyShopOpen();
      if (summonerPickerOpen) {
        summonerPickerOpen = false;
        applySummonerPickerOpen();
      }
      if (resMoreOpen) {
        resMoreOpen = false;
        applyResMoreOpen();
      }
    }
    applyMailboxOpen();
  });
  app.querySelector("#btn-mailbox-close")?.addEventListener("click", () => {
    mailboxOpen = false;
    applyMailboxOpen();
  });

  app.querySelector("#btn-notif")?.addEventListener("click", () => {
    notifOpen = !notifOpen;
    if (notifOpen) {
      mailboxOpen = false;
      settingsOpen = false;
      missionOpen = false;
      communityOpen = false;
      shopOpen = false;
      applyMailboxOpen();
      applySettingsOpen();
      applyMissionOpen();
      applyCommunityOpen();
      applyShopOpen();
      if (summonerPickerOpen) {
        summonerPickerOpen = false;
        applySummonerPickerOpen();
      }
      if (resMoreOpen) {
        resMoreOpen = false;
        applyResMoreOpen();
      }
    }
    applyNotifOpen();
  });
  app.querySelector("#btn-notif-close")?.addEventListener("click", () => {
    notifOpen = false;
    applyNotifOpen();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      settingsOpen = false;
      mailboxOpen = false;
      notifOpen = false;
      summonerPickerOpen = false;
      resMoreOpen = false;
      missionOpen = false;
      communityOpen = false;
      shopOpen = false;
      const nav = btn.dataset.nav;
      if (nav === "guild") {
        openCommunityModal();
        render();
        return;
      }
      if (nav === "shop") {
        if (view === "result" || view === "battle") {
          autoMode = false;
          clearAutoTimer();
          battle = null;
          dmgFloats = [];
          view = "home";
        }
        openShopModal();
        render();
        return;
      }
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
        flash(`${t('ui.e94107292d')} ${Math.floor(island.mana)}`);
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
      if (view === "home" && nav !== "home" && islandLayoutEdit) {
        if (islandLayoutDraft) writeIslandLayout(islandLayoutDraft);
        islandLayoutEdit = false;
        islandLayoutDraft = null;
        islandSpotDrag = null;
        clearIslandLongPress();
      }
      if (nav === "enhance") enhanceTab = "monsters";
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
      if (kind !== "mana" && kind !== "crystal") return;
      const from = btn.getBoundingClientRect();
      const beforeMana = Math.floor(save.island.mana);
      const beforeCrystal = Math.floor(save.island.crystal);
      const r = kind === "mana" ? homeCollect(save) : homeCollectCrystal(save);
      save = r.save;
      persist();
      const toMana = Math.floor(save.island.mana);
      const toCrystal = Math.floor(save.island.crystal);
      const gained =
        kind === "mana" ? toMana - beforeMana : toCrystal - beforeCrystal;
      // Drop the bubble in place — do not remount the island.
      btn.remove();
      if (gained > 0) {
        playResourceCollectFx({
          kind,
          amount: gained,
          from,
          fromValue: kind === "mana" ? beforeMana : beforeCrystal,
          toValue: kind === "mana" ? toMana : toCrystal,
        });
      } else {
        flash(r.message);
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-b]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      if (app.querySelector("#island-viewport")?.getAttribute("data-pan-moved") === "1") {
        ev.preventDefault();
        return;
      }
      if (islandLayoutEdit || islandLayoutSuppressClick) {
        ev.preventDefault();
        ev.stopPropagation();
        islandLayoutSuppressClick = false;
        if (islandLayoutEdit && btn.dataset.b) {
          app.querySelectorAll<HTMLElement>("[data-b]").forEach((el) => {
            el.classList.toggle("is-layout-focus", el.dataset.b === btn.dataset.b);
          });
        }
        return;
      }
      if (btn.dataset.locked === "1") {
        const lv = btn.dataset.unlock;
        flash(lv ? `${t('ui.fd3c4455cd')} Lv.${lv}${t('ui.71654c1bdc')}.` : t('ui.654ebee916'));
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
        openCommunityModal();
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
        openShopModal();
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
      flash(t('ui.d02305abdb'));
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

  app.querySelectorAll<HTMLButtonElement>("[data-select-mon]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = btn.dataset.selectMon;
      if (!uid) return;
      selectedEnhanceUid = uid;
      monSkillPick = 0;
      enhanceTab = "monsters";
      monBookDock = "roster";
      render();
    });
  });

  app.querySelector<HTMLSelectElement>("#mon-roster-sort")?.addEventListener("change", (ev) => {
    const raw = (ev.currentTarget as HTMLSelectElement).value;
    const allowed: RosterSortMode[] = ["default", "level", "stars", "element", "party"];
    if (!allowed.includes(raw as RosterSortMode)) return;
    rosterSortMode = raw as RosterSortMode;
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-mon-detail-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.monDetailTab;
      if (raw === "info" || raw === "skills" || raw === "awaken" || raw === "symbols") {
        if (monDetailTab === raw) return;
        monDetailTab = raw;
        enhanceTab = "monsters";
        if (!applyMonDetailTabUi()) render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-mon-dock]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.monDock;
      if (raw === "roster" || raw === "symbols") {
        monBookDock = raw;
        if (raw === "roster") {
          equipPickSymIndex = null;
        } else {
          monDetailTab = "symbols";
        }
        enhanceTab = "monsters";
        render();
      }
    });
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

  app.querySelectorAll<HTMLButtonElement>("[data-mon-skill-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slot = Number(btn.dataset.monSkillPick ?? "0");
      if (slot >= 0 && slot <= 2) {
        monSkillPick = slot;
        monDetailTab = "skills";
        enhanceTab = "monsters";
        render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-skill-feed-fodder]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.skillFeedTarget;
      const fodder = btn.dataset.skillFeedFodder;
      if (!target || !fodder) return;
      const r = runFeedSameMonster(save, target, fodder);
      save = r.save;
      persist();
      flash(r.message);
      monDetailTab = "skills";
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-enhance-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.enhanceTab;
      if (raw === "monsters" || raw === "summoner") {
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
      if (r.message.startsWith(t('ui.efa49027d0'))) {
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
      if (id && r.message.includes(t('ui.d1496ce82d'))) {
        enhanceFx = { kind: "node", id };
      }
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-sym-detail]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.symDetail);
      if (!Number.isFinite(idx) || !save.symbols[idx]) return;
      symbolDetailIndex = idx;
      enhanceTab = "monsters";
      render();
    });
  });

  const closeSymDetail = () => {
    symbolDetailIndex = null;
    render();
  };
  app.querySelector("#btn-sym-detail-close")?.addEventListener("click", closeSymDetail);

  app.querySelector("[data-sym-detail-enhance]")?.addEventListener("click", () => {
    if (symbolDetailIndex == null) return;
    const id = save.symbols[symbolDetailIndex]?.id;
    const r = runEnhanceSymbol(save, String(symbolDetailIndex));
    save = r.save;
    persist();
    if (id) {
      const next = save.symbols.findIndex((x) => x.id === id);
      symbolDetailIndex = next >= 0 ? next : null;
    }
    flash(r.message);
    render();
  });

  app.querySelector("[data-sym-detail-imprint]")?.addEventListener("click", () => {
    if (symbolDetailIndex == null) return;
    const prev = save.symbols[symbolDetailIndex];
    const before = prev ? describeSymbol(prev) : "";
    const id = prev?.id;
    const r = runImprintSymbol(save, String(symbolDetailIndex));
    save = r.save;
    persist();
    const next = id ? save.symbols.find((x) => x.id === id) : undefined;
    if (next && before && r.message.startsWith(t("ui.d48858f588"))) {
      forgeReveal = {
        kind: "imprint",
        before,
        after: describeSymbol(next),
        cost: `${MINUS}${t("ui.5d0bf3b101")} ${SYMBOL_IMPRINT_CRYSTAL_COST}`,
      };
    }
    if (id) {
      const ni = save.symbols.findIndex((x) => x.id === id);
      symbolDetailIndex = ni >= 0 ? ni : null;
    }
    flash(r.message);
    render();
  });

  app.querySelector("[data-sym-detail-unequip]")?.addEventListener("click", () => {
    if (symbolDetailIndex == null) return;
    const sym = save.symbols[symbolDetailIndex];
    if (!sym) return;
    const mon = save.roster.find((m) => (m.symbolSlots ?? []).includes(sym.id));
    if (!mon) return;
    const slot = (mon.symbolSlots ?? []).findIndex((id) => id === sym.id) + 1;
    const r = runUnequipSymbol(save, mon.uid, slot);
    save = r.save;
    persist();
    flash(r.message);
    render();
  });

  app.querySelector("[data-sym-detail-equip]")?.addEventListener("click", () => {
    if (symbolDetailIndex == null) return;
    const idx = symbolDetailIndex;
    symbolDetailIndex = null;
    equipPickSymIndex = idx;
    monBookDock = "symbols";
    enhanceTab = "monsters";
    render();
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
      if (next && before && r.message.startsWith(t('ui.d48858f588'))) {
        forgeReveal = {
          kind: "grind",
          before,
          after: describeSymbol(next),
          cost: `${MINUS}${t('ui.dc78e6a251')} ${SYMBOL_GRIND_MANA_COST}`,
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
      if (next && before && r.message.startsWith(t('ui.d48858f588'))) {
        forgeReveal = {
          kind: "imprint",
          before,
          after: describeSymbol(next),
          cost: `${MINUS}${t('ui.5d0bf3b101')} ${SYMBOL_IMPRINT_CRYSTAL_COST}`,
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
  app.querySelector("[data-expand-sym-bag]")?.addEventListener("click", () => {
    if (symbolBagExpandCost(save) == null) {
      flash(t("ui.expandSymbolBagMax"));
      return;
    }
    symbolBagExpandOpen = true;
    render();
  });
  const closeSymBagExpand = () => {
    if (!symbolBagExpandOpen) return;
    symbolBagExpandOpen = false;
    render();
  };
  app.querySelector("#btn-sym-bag-expand-close")?.addEventListener("click", closeSymBagExpand);
  app.querySelector("#btn-sym-bag-expand-cancel")?.addEventListener("click", closeSymBagExpand);
  app.querySelector("#btn-sym-bag-expand-ok")?.addEventListener("click", () => {
    symbolBagExpandOpen = false;
    const r = runExpandSymbolBag(save);
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
      if (r.message.startsWith(t('ui.04e75ecf18')) && keepUid) {
        const kept = save.roster.find((m) => m.uid === keepUid);
        if (kept && materials) {
          fusionReveal = {
            materials,
            result: describeOwned(kept),
            cost: `${MINUS}${t('ui.dc78e6a251')} ${FUSION_MANA_COST}`,
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

  app.querySelector("#btn-pond-collect")?.addEventListener("click", (ev) => {
    const origin = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const now = Date.now();
    const before = Math.floor(save.island.mana);
    const island = collectMana(tickProduction(save.island, now), "mana_pond", now);
    save = { ...save, island };
    persist();
    const to = Math.floor(island.mana);
    const gained = to - before;
    render();
    if (gained > 0) {
      playResourceCollectFx({
        kind: "mana",
        amount: gained,
        from: origin,
        fromValue: before,
        toValue: to,
      });
    }
  });
  app.querySelector("#btn-pond-upgrade")?.addEventListener("click", () => {
    const r = runUpgradeBuilding(save, "mana_pond");
    save = r.save;
    persist();
    flash(r.message);
    render();
  });

  app.querySelector("#btn-mine-collect")?.addEventListener("click", (ev) => {
    const origin = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const before = Math.floor(save.island.crystal);
    const r = homeCollectCrystal(save);
    save = r.save;
    persist();
    const to = Math.floor(save.island.crystal);
    const gained = to - before;
    render();
    if (gained > 0) {
      playResourceCollectFx({
        kind: "crystal",
        amount: gained,
        from: origin,
        fromValue: before,
        toValue: to,
      });
    } else {
      flash(r.message);
    }
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
    if (r.message.startsWith(t('ui.b835657896'))) {
      wishReveal = r.message.replace(/^\uC18C\uC6D0:\s*/, "");
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
      if (equipPickSymIndex != null) {
        monBookDock = "symbols";
        enhanceTab = "monsters";
      }
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
      enhanceTab = "monsters";
      monBookDock = "roster";
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
        flash(t('ui.e44dd9cad3'));
        render();
        return;
      }
      render();
    });
  });

  app.querySelector("#btn-party-save")?.addEventListener("click", () => {
    const draft = ensurePartyDraft();
    if (draft.size === 0) {
      flash(t('ui.bb044ada8a'));
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
    if (btn.closest("#stages-region-host")) return;
    btn.addEventListener("click", () => {
      const id = btn.dataset.banToggle!;
      const cur = [...(save.arenaBanIds ?? [])];
      const idx = cur.indexOf(id);
      if (idx >= 0) cur.splice(idx, 1);
      else if (cur.length < 2) cur.push(id);
      else {
        flash(t('ui.522ab79351'));
        return;
      }
      const r = runSetArenaBans(save, cur);
      save = r.save;
      persist();
      flash(r.message);
      if (view === "stages" && stagesRegion) applyStagesRegionOpen();
      else render();
    });
  });

  app.querySelector("#btn-season-claim")?.addEventListener("click", () => {
    const r = runClaimSeasonReward(save);
    save = r.save;
    persist();
    flash(r.message);
    if (view === "stages" && stagesRegion) applyStagesRegionOpen();
    else render();
  });

  app.querySelector("#btn-board-switch")?.addEventListener("click", () => {
    if (!battle) return;
    if (!battle.switchBoard(t('ui.a9034f7e3d'))) return;
    refreshLegal();
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-board-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!battle || battle.boards.length < 2) return;
      const idx = Number(btn.dataset.boardTab);
      if (!Number.isFinite(idx) || idx === battle.activeBoardIndex) return;
    if (!battle.switchBoard(t('ui.a9034f7e3d'))) return;
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
    const next = window.prompt(t('ui.b43e678315'), save.guildName ?? "");
    if (next == null) return;
    const r = runJoinGuild(save, next);
    save = r.save;
    persist();
    flash(r.message);
    render();
  });

  app.querySelector("#region-diff-select")?.addEventListener("change", (ev) => {
    const v = (ev.target as HTMLSelectElement).value as StageDifficulty;
    if (v === "normal" || v === "hard" || v === "hell") {
      stageEntryDiff = v;
      if (view === "stages") applyStagesRegionOpen();
      else render();
    }
  });

  app.querySelectorAll<HTMLButtonElement>("[data-stage]").forEach((btn) => {
    if (btn.closest("#stages-region-host")) return;
    btn.addEventListener("click", () => {
      const stage = getStage(btn.dataset.stage!);
      if (stage) startBattle(stage, stageEntryDiff);
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-region]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (app.querySelector("#stages-viewport")?.getAttribute("data-pan-moved") === "1") {
        return;
      }
      const id = btn.dataset.region as StagesRegionId;
      if (btn.dataset.locked === "1") {
        flash(t("ui.b72f5a4752"));
        return;
      }
      stagesRegion = stagesRegion === id ? null : id;
      applyStagesRegionOpen();
    });
  });

  app.querySelector("#btn-region-close")?.addEventListener("click", () => {
    stagesRegion = null;
    stageEntryId = null;
    applyStagesRegionOpen();
  });

  if (view === "stages") {
    applyStagesRegionOpen();
  }

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

  if (view === "battle") {
    destroyAllSpine();
    mountUnitAnimHooks(app);
    dematteArtInTree(app, "img.battle-unit-img");
    void mountBattleSpines(app);
  } else if (view === "enhance") {
    destroyAllSpine();
    bindMonPreviewTurntable(app);
    dematteArtInTree(
      app,
      "img.mon-preview-img, img.mon-inspect-art-img, img.mon-slot-img, img.mon-skill-feed-img",
    );
    void mountBookPreviewSpine(app);
  } else if (view !== "result") {
    destroyAllSpine();
  }

  startEnergyRegenTimer();
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
    authUi.pane = "gate";
    view = "auth";
    render();
    return;
  }
  view = "auth";
  authUi.pane = "gate";
  render();
}

initI18n();
void boot();
