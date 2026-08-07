import "./style.css";
import { apiUrl } from "./api/url";
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
  spawnUnitVfx,
  waitFx,
} from "./battle/fx";
import { destroyAllSpine, mountBattleSpines, playSpineClip } from "./battle/spinePilot";
import {
  getBattleStillSrc,
  getSummonerBattleStillSrc,
} from "./battle/spinePacks";
import { BATTLE_STILL_FAMILY_SET } from "./battle/battleStills";
import { battleSkyHtml } from "./battle/battleBg";
import {
  battleCircleIdForStage,
  battleCircleSrc,
  battleStoneSrc,
  normalizeBattleStoneId,
} from "./battle/battleCircle";
import { dematteArtInTree } from "./ui/dematteArt";
import { initUiScale } from "./ui/uiScale";
import { bindMonPreviewTurntable } from "./ui/monPreviewTurntable";
import {
  ARROW_DOWN,
  ARROW_RIGHT,
  ARROW_LEFT,
  ARROW_UP,
  CHECK,
  EM_DASH,
  MIDDOT,
  MINUS,
  Mark,
  CODEX_LOCK_HTML,
  CODEX_SEAL_HTML,
  monStarsHtml,
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
  detectShapeBonuses,
  type ShapeBonusId,
} from "stonesummoner-combat";
import {
  ARENA_STAGES,
  DEPTH_STAGES,
  CAIROS_GIANT_STAGES,
  CAIROS_DRAGON_STAGES,
  CAIROS_NECRO_STAGES,
  EQUIP_STAGES,
  FUSION_RECIPES,
  GLORY_BUILDINGS,
  GUILD_RAID_STAGES,
  MAIN_QUEST_PIN_LAYOUT,
  MAIN_QUEST_STAGES,
  SIDE_CONTENT_PIN_LAYOUT,
  STAGES_PER_AREA,
  TRIAL_STAGES,
  WEEKDAY_STAGES,
  WORLD_ARENA_STAGES,
  gloryBuffFromLevels,
  isWeekdayStageOpenToday,
  pickArenaRival,
  canGrindSymbol,
  canImprintSymbol,
  canEquipGearOnElement,
  describeGear,
  describeSymbol,
  gearEnhanceCrystalCost,
  gearEnhanceManaCost,
  gearSellCrystal,
  gearSellMana,
  gearStarsToInvGrade,
  GEAR_SET_AFFIX_MANA,
  GEAR_SETS,
  GEAR_SLOTS,
  isGearSlot,
  getMonster,
  getMonsterArtKey,
  getSummonerLeader,
  getSummonerKit,
  emptyMagicProgress,
  unlockedMagicSkills,
  magicRank,
  magicSkillPower,
  MAX_MAGIC_RANK,
  type MagicSkillSlot,
  type SummonerMagicSkillDef,
  MONSTERS,
  resolveMonsterId,
  getStage,
  MAX_GEAR_BAG,
  MAX_GEAR_ENHANCE,
  MAX_SYMBOL_ENHANCE,
  normalizeGearPiece,
  normalizeSummonerGear,
  normalizeSymbolQuality,
  qualityToPlateId,
  skillTreeBonuses,
  SYMBOL_SETS,
  stagesForMap,
  summarizeGearSets,
  gearLeaderAtkPct,
  SYMBOL_GRIND_MANA_COST,
  SYMBOL_GRIND_STONE_COST,
  SYMBOL_IMPRINT_CRYSTAL_COST,
  type GearPiece,
  type GearQuality,
  type GearSlot,
  type MainQuestPinId,
  type StageDef,
  type SymbolSetId,
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
  displayedMonsterStars,
  enhanceManaCost,
  evolveCrystalCost,
  evolveManaCost,
  evolveMinLevel,
  isStageUnlocked,
  MAX_EVOLVE,
  MAX_MONSTER_AWAKEN,
  MAX_MONSTER_LEVEL,
  MAX_SKILL_LEVEL,
  MAX_SUMMONER_AWAKEN,
  monsterAwakenCrystalCost,
  monsterAwakenManaCost,
  monsterAwakenMatCost,
  monsterAwakenMinLevel,
  migrateSave,
  runAwakenMonster,
  runAwakenSummoner,
  runEnhanceMagicSkill,
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
  runBuyShopOffer,
  getDailyShopOffers,
  syncShopDay,
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
  runSkillUp,
  skillUpManaCost,
  skillUpMinMonsterLevel,
  SKILL_UP_MAT_COST,
  runFusion,
  runRecipeFusion,
  runGrindSymbol,
  grindstoneCount,
  unclaimedMailIds,
  runClaimMail,
  DAILY_MISSION_WISH,
  DAILY_MISSION_DOJO,
  DAILY_MISSION_COLLECT,
  DAILY_MISSION_SORTIE,
  claimableDailyMissionCount,
  isDailyMissionClaimed,
  runClaimDailyMission,
  homeCollectCrystal,
  homeCollect,
  FUSION_MANA_COST,
  runImprintSymbol,
  runJoinGuild,
  runGuildCheckIn,
  getActiveGear,
  getActiveSummoner,
  guildLeaderboard,
  GUILD_NPC_MEMBERS,
  GUILD_WEEK_CONTRIB_GOAL,
  syncGuildWeek,
  runClaimSeasonReward,
  SEASON_REWARD_WINS,
  runPracticeDojo,
  runSellSymbol,
  runSetArenaBans,
  runSetArenaDefense,
  ARENA_ATTACKS_DAILY,
  arenaAttacksRemaining,
  syncArenaAttackDay,
  RAID_BOSS_MAX_HP,
  RAID_ATTEMPTS_DAILY,
  raidAttemptsRemaining,
  syncRaidWeek,
  syncRaidAttemptDay,
  runSetParty,
  runSavePartyPreset,
  runLoadPartyPreset,
  normalizePartyPresets,
  clampPartyPresetIndex,
  PARTY_PRESET_COUNT,
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
  type ExpTrackGain,
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
  | "summoner"
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
initUiScale();
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
const authUi = {
  pane: "gate" as "gate" | "login" | "register" | "privacy" | "terms",
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPwaInstall: BeforeInstallPromptEvent | null = null;
let pwaJustInstalled = false;

function isPwaInstalled(): boolean {
  if (pwaJustInstalled) return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return !!nav.standalone;
}

function isIosSafariForPwa(): boolean {
  const ua = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIos) return false;
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}

function canOfferPwaInstall(): boolean {
  if (isPwaInstalled()) return false;
  if (deferredPwaInstall) return true;
  return isIosSafariForPwa();
}

function authPwaInstallBtn(): string {
  if (!canOfferPwaInstall()) return "";
  return `<button type="button" class="auth-pwa-install" id="auth-pwa-install" aria-label="${escapeHtml(t("auth.pwa.installAria"))}">
    <svg class="auth-pwa-install-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42L11 12.59V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z"/>
    </svg>
    <span>${escapeHtml(t("auth.pwa.install"))}</span>
  </button>`;
}

function refreshAuthPwaInstallBtn(): void {
  if (view !== "auth") return;
  const existing = app.querySelector("#auth-pwa-install");
  if (!canOfferPwaInstall()) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const main = app.querySelector(".auth-main");
  if (!main) return;
  main.insertAdjacentHTML("afterbegin", authPwaInstallBtn());
  bindAuthPwaInstall();
}

function bindAuthPwaInstall(): void {
  app.querySelector("#auth-pwa-install")?.addEventListener("click", () => {
    void (async () => {
      if (deferredPwaInstall) {
        const evt = deferredPwaInstall;
        deferredPwaInstall = null;
        try {
          await evt.prompt();
          const choice = await evt.userChoice;
          if (choice.outcome === "accepted") {
            pwaJustInstalled = true;
            toast = t("auth.pwa.installed");
          }
        } catch {
          /* user dismissed or browser blocked */
        }
        render();
        return;
      }
      if (isIosSafariForPwa()) {
        toast = t("auth.pwa.iosHint");
        render();
        return;
      }
      toast = t("auth.pwa.unavailable");
      render();
    })();
  });
}

window.addEventListener("beforeinstallprompt", (ev) => {
  ev.preventDefault();
  deferredPwaInstall = ev as BeforeInstallPromptEvent;
  refreshAuthPwaInstallBtn();
});

window.addEventListener("appinstalled", () => {
  deferredPwaInstall = null;
  pwaJustInstalled = true;
  refreshAuthPwaInstallBtn();
});

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
/** Normal / premium scroll deltas granted with the last battle reward. */
let lastScrollPremiumGain = 0;
let lastScrollGain = 0;
/** Most recently summoned monster uids (summon reveal card / multi). */
let lastSummonUids: string[] = [];
/** Empty/filled slot awaiting symbol pick (monster uid + slot 1-6). */
let slotEquipPick: { uid: string; slot: number } | null = null;
/** Symbol bag index open in detail modal (selected / candidate). */
let symbolDetailIndex: number | null = null;
/** Equipped symbol index shown beside candidate for compare. */
let symbolCompareIndex: number | null = null;
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
/** Selected summoner book detail side-tab. */
type SumDetailTab = "info" | "skills" | "awaken" | "gear";
let sumDetailTab: SumDetailTab = "info";
/** Full-screen codex overlay (monster + summoner catalog). */
let codexOpen = false;
type CodexTab = "monsters" | "summoners";
let codexTab: CodexTab = "monsters";
type CodexStarsFilter = "all" | 1 | 2 | 3 | 4 | 5;
/** Per-element star filter on the monster codex (sections by attribute). */
let codexStarsByElement: Record<SummonerElement, CodexStarsFilter> = {
  fire: "all",
  water: "all",
  wind: "all",
  light: "all",
  dark: "all",
};
/** Selected monster id inside the codex detail popover. */
let codexDetailMonsterId: string | null = null;
/** Skill-feed material picker modal (same-species fodder). */
let skillFeedModalOpen = false;
/** Selected fodder uid inside the skill-feed modal (confirm to consume). */
let skillFeedFodderUid: string | null = null;
/** Monster book / skill-feed inventory slot capacity (two-row rail). */
const ROSTER_SLOT_CAP = 60;

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

/** Swap summoner-book inspect panes without full app re-render. */
function applySumDetailTabUi(): boolean {
  const shell = app.querySelector<HTMLElement>(".sum-inspect-shell");
  if (!shell) return false;
  shell.querySelectorAll<HTMLButtonElement>("[data-sum-detail-tab]").forEach((btn) => {
    const on = btn.dataset.sumDetailTab === sumDetailTab;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  shell.querySelectorAll<HTMLElement>("[data-sum-pane]").forEach((pane) => {
    pane.hidden = pane.dataset.sumPane !== sumDetailTab;
  });
  return true;
}

/** Soft-update skill icon selection + detail pane (no full re-render). */
function applyMonSkillPickUi(): boolean {
  const pane = app.querySelector<HTMLElement>('.mon-pane[data-mon-pane="skills"]');
  if (!pane) return false;
  const owned = selectedEnhanceUid
    ? save.roster.find((m) => m.uid === selectedEnhanceUid)
    : null;
  if (!owned) return false;
  const def = getMonster(owned.monsterId);
  const levels = (owned.skillLevels ?? [1, 1, 1]) as [number, number, number];
  if (monSkillPick < 0 || monSkillPick > 2) monSkillPick = 0;
  const focusSk = def?.skills[monSkillPick];
  const focusLv = levels[monSkillPick] ?? 1;

  pane.querySelectorAll<HTMLButtonElement>("[data-mon-skill-pick]").forEach((btn) => {
    const slot = Number(btn.dataset.monSkillPick ?? "0");
    const on = slot === monSkillPick;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });

  const nameEl = pane.querySelector(".mon-skill-detail-name");
  if (nameEl) {
    nameEl.textContent = focusSk?.nameKo ?? `S${monSkillPick + 1}`;
  }
  const lvEl = pane.querySelector(".mon-skill-detail-lv");
  if (lvEl) {
    lvEl.textContent = `Lv.${focusLv}${focusLv >= MAX_SKILL_LEVEL ? " MAX" : ""}`;
  }
  const descEl = pane.querySelector(".mon-skill-detail-desc");
  if (descEl) {
    descEl.innerHTML = monsterSkillDescLines(focusSk)
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join("");
  }
  const upEl = pane.querySelector(".mon-skill-upgrades");
  if (upEl) {
    upEl.innerHTML = monsterSkillUpgradeRows(focusSk, focusLv);
  }
  return true;
}

/** Selected skill slot (0..2) on skills tab detail pane. */
let monSkillPick = 0;
/** Selected monster uid on the monsters book screen. */
let selectedEnhanceUid: string | null = null;
/** Skill-feed enhance is only available when entered via island power_circle. */
let enhanceSkillFeedAllowed = false;
/** Roster slot sort mode on enhance book. */
type RosterSortMode = "default" | "level" | "stars" | "element" | "party";
let rosterSortMode: RosterSortMode = "default";
/** Symbol bag expand confirm modal. */
let symbolBagExpandOpen = false;
/** Which symbol inventory filter dropdown is open (set / slot). */
type SymbolInvFilterKind = "set" | "slot";
const SYMBOL_SLOT_NUMS = [1, 2, 3, 4, 5, 6] as const;
type SymbolSlotNum = (typeof SYMBOL_SLOT_NUMS)[number];
let symbolInvFilterOpen: SymbolInvFilterKind | null = null;
/** AbortController for outside-click / resize while filter menu is open. */
let symbolInvFilterUiAbort: AbortController | null = null;
/** Enabled symbol set ids in inventory filter (all selected = show everything). */
let symbolInvFilterSets: Set<SymbolSetId> = new Set(
  SYMBOL_SETS.map((s) => s.id),
);
/** Enabled symbol slot numbers (1–6) in inventory filter. */
let symbolInvFilterSlots: Set<SymbolSlotNum> = new Set(SYMBOL_SLOT_NUMS);
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
/** Manual skill pick under the active unit (SW: select then tap enemy). */
let selectedSkillIndex: number | null = null;
type BattleSummonerSkillId = "open" | "declare" | "dual" | "clean" | "guard";
let selectedSummonerSkill: BattleSummonerSkillId | null = null;
let autoTimer: ReturnType<typeof setTimeout> | null = null;
let energyRegenTimer: ReturnType<typeof setInterval> | null = null;
let dmgFloats: { id: number; text: string; crit: boolean; ult: boolean }[] = [];
let floatSeq = 0;
/** Last seen circle phase — detect empowered reset for board FX. */
let lastSeenBoardPhase = 0;
/** One-shot collapse/rekindle class on the board frame. */
let boardRekindleFx = false;
/** Recent Module B shape ids for amplify / board flash. */
let shapeFlashIds: ShapeBonusId[] = [];
let shapeFlashUntil = 0;

/** Extra currencies drawer under app-bar resources. */
let resMoreOpen = false;
let settingsOpen = false;
let mailboxOpen = false;
let notifOpen = false;
let summonerPickerOpen = false;
let missionOpen = false;
let communityOpen = false;
let shopOpen = false;
/** Floating action menu above an island building (`data-b` id). */
let islandSpotMenuId: string | null = null;
/** Building info sheet open for this island spot id. */
let buildingInfoId: string | null = null;
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
/** Open region drop-info modal (SW-style). */
let stagesDropInfoOpen = false;
/** Active tab inside drop-info modal: scrolls | summoner gear. */
let stagesDropTab: "scroll" | "gear" = "scroll";
/** Expand symbol piece list under the set row. */
let stagesDropSetExpand = false;
/** Summoner element picker open inside stage prep. */
let stagePrepSummonerOpen = false;
/** Prep inventory dock tab. */
let stagePrepInvTab: "summoner" | "monster" | "skill" = "monster";
/** Prep roster sort (mirrors hub roster sorts). */
let stagePrepSortMode: RosterSortMode = "stars";
/** Long-press unit info overlay on battle prep. */
type StagePrepInfoTarget =
  | { kind: "summoner"; element: SummonerElement }
  | { kind: "monster"; uid: string }
  | { kind: "enemy"; monsterId: string };
let stagePrepInfo: StagePrepInfoTarget | null = null;
/** Selected magic slot in prep Skills tab. */
let stagePrepSkillPick: MagicSkillSlot = "A";
/** Prep long-press tracker (mirrors island 520ms hold). */
let stagePrepLongPress: {
  pointerId: number;
  startX: number;
  startY: number;
  timer: ReturnType<typeof setTimeout>;
} | null = null;
/** Suppress the click that follows a successful prep long-press. */
let stagePrepSuppressClick = false;
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
  const titles: Record<string, string> = {
    shop: t("nav.shop"),
    party: t("ui.108f04ca6e"),
    glory: t("ui.hubGlory"),
    mana_pond: t("ui.hubPond"),
    crystal_mine: t("ui.hubMine"),
    mine: t("ui.hubMine"),
    wish: t("ui.hubWish"),
    wish_temple: t("ui.hubWish"),
    dojo: t("ui.hubDojo"),
    practice_dojo: t("ui.hubDojo"),
    guild: t("ui.hubGuild"),
    guild_hall: t("ui.hubGuild"),
    fusion: t("ui.hubFusion"),
    fusion_star: t("ui.hubFusion"),
  };
  if (titles[id]) return titles[id];
  const remap: Record<string, string> = {
    wish: "wish_temple",
    dojo: "practice_dojo",
    guild: "guild_hall",
    fusion: "fusion_star",
  };
  const bid = remap[id] ?? id;
  return PHASE_BUILDINGS.find((b) => b.id === bid)?.nameKo ?? fallback;
}

const ISLAND_BLDG_INFO_KEYS: Record<string, string> = {
  summon_hearth: "ui.bldgInfo.summon_hearth",
  power_circle: "ui.bldgInfo.power_circle",
  gateway: "ui.bldgInfo.gateway",
  mana_pond: "ui.bldgInfo.mana_pond",
  shop: "ui.bldgInfo.shop",
  party: "ui.bldgInfo.party",
  wish: "ui.bldgInfo.wish",
  dojo: "ui.bldgInfo.dojo",
  crystal_mine: "ui.bldgInfo.crystal_mine",
  glory: "ui.bldgInfo.glory",
  guild: "ui.bldgInfo.guild",
  fusion: "ui.bldgInfo.fusion",
};

function buildingInfoLines(id: string): string[] {
  const key = ISLAND_BLDG_INFO_KEYS[id];
  if (!key) return [];
  return t(key as Parameters<typeof t>[0])
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function renderBuildingInfoModal(): string {
  const id = buildingInfoId;
  const open = !!id;
  const name = id ? islandSpotTitle(id) : "";
  const lines = id ? buildingInfoLines(id) : [];
  const body =
    lines.length > 0
      ? `<ul class="building-info-list">${lines
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("")}</ul>`
      : `<p class="muted">${escapeHtml(t("ui.buildingInfoClose"))}</p>`;
  return `<div class="settings-layer building-info-layer" id="building-info-layer" ${open ? "" : "hidden"} aria-hidden="${open ? "false" : "true"}">
    <button type="button" class="settings-backdrop" id="btn-building-info-close" aria-label="${escapeHtml(t("ui.buildingInfoClose"))}"></button>
    <div class="settings-sheet building-info-sheet" role="dialog" aria-modal="true" aria-labelledby="building-info-title">
      <div class="settings-sheet-handle" aria-hidden="true"></div>
      ${modalCloseX(t("ui.buildingInfoClose"), "btn-building-info-close")}
      <h2 class="settings-title" id="building-info-title">${escapeHtml(t("ui.buildingInfoTitle", { name }))}</h2>
      <div class="building-info-body" id="building-info-body">${body}</div>
    </div>
  </div>`;
}

function applyBuildingInfoOpen(): void {
  const layer = app.querySelector<HTMLElement>("#building-info-layer");
  if (!layer) return;
  const open = !!buildingInfoId;
  layer.hidden = !open;
  layer.setAttribute("aria-hidden", open ? "false" : "true");
  if (!open) return;
  const id = buildingInfoId!;
  const name = islandSpotTitle(id);
  const title = layer.querySelector("#building-info-title");
  if (title) title.textContent = t("ui.buildingInfoTitle", { name });
  const body = layer.querySelector("#building-info-body");
  if (body) {
    const lines = buildingInfoLines(id);
    body.innerHTML =
      lines.length > 0
        ? `<ul class="building-info-list">${lines
            .map((line) => `<li>${escapeHtml(line)}</li>`)
            .join("")}</ul>`
        : "";
  }
  replayModalPop(layer);
}

function openBuildingInfoSoft(id: string): void {
  setIslandSpotMenu(null);
  buildingInfoId = id;
  shopOpen = false;
  communityOpen = false;
  missionOpen = false;
  settingsOpen = false;
  mailboxOpen = false;
  notifOpen = false;
  summonerPickerOpen = false;
  resMoreOpen = false;
  closeChatOverlay();
  applyBuildingInfoOpen();
  applyShopOpen();
  applyCommunityOpen();
  applyMissionOpen();
  applySettingsOpen();
  applyMailboxOpen();
  applyNotifOpen();
  applySummonerPickerOpen();
  applyResMoreOpen();
}

function closeBuildingInfoSoft(): void {
  if (!buildingInfoId) return;
  buildingInfoId = null;
  applyBuildingInfoOpen();
}

function applyIslandSpotMenu(): void {
  app.querySelectorAll<HTMLElement>("[data-b]").forEach((el) => {
    const open = !!islandSpotMenuId && el.dataset.b === islandSpotMenuId;
    el.classList.toggle("is-menu-open", open);
    const fabs = el.querySelector<HTMLElement>(".island-spot-fabs");
    if (fabs) {
      fabs.hidden = !open;
      fabs.setAttribute("aria-hidden", open ? "false" : "true");
    }
  });
}

function setIslandSpotMenu(id: string | null): void {
  islandSpotMenuId = id;
  applyIslandSpotMenu();
}

function enterIslandBuilding(id: string): void {
  setIslandSpotMenu(null);
  closeBuildingInfoSoft();
  if (id === "gateway") {
    view = "stages";
    render();
  } else if (id === "mana_pond") {
    view = "pond";
    renderPreservingIsland();
  } else if (id === "crystal_mine") {
    view = "mine";
    renderPreservingIsland();
  } else if (id === "wish") {
    wishReveal = null;
    view = "wish";
    renderPreservingIsland();
  } else if (id === "glory") {
    view = "glory";
    renderPreservingIsland();
  } else if (id === "dojo") {
    view = "dojo";
    renderPreservingIsland();
  } else if (id === "guild") {
    openCommunityModalSoft();
  } else if (id === "fusion") {
    view = "fusion";
    renderPreservingIsland();
  } else if (id === "summon_hearth") {
    view = "summon";
    renderPreservingIsland();
  } else if (id === "power_circle") {
    enhanceSkillFeedAllowed = true;
    monDetailTab = "skills";
    view = "enhance";
    render();
  } else if (id === "shop") {
    openShopModalSoft();
  } else if (id === "party") {
    view = "party";
    partyDraft = new Set(save.party);
    renderPreservingIsland();
  }
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
    const res = await fetch(apiUrl(path), {
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
  if (stage.mode === "arena") {
    save = syncArenaAttackDay(save);
    if ((save.arenaAttacksToday ?? 0) >= ARENA_ATTACKS_DAILY) {
      flash(`${t("ui.arena.attacksLeft")} 0/${ARENA_ATTACKS_DAILY}`);
      render();
      return;
    }
  }
  if (stage.mode === "guild_raid") {
    save = syncRaidAttemptDay(syncRaidWeek(save));
    if ((save.raidAttemptsDay ?? 0) >= RAID_ATTEMPTS_DAILY) {
      flash(`${t("ui.guild.raidAttempts")} 0/${RAID_ATTEMPTS_DAILY}`);
      render();
      return;
    }
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
    arenaAttacksToday:
      stage.mode === "arena"
        ? (save.arenaAttacksToday ?? 0) + 1
        : (save.arenaAttacksToday ?? 0),
    arenaAttackDay:
      stage.mode === "arena" ? todayKey() : (save.arenaAttackDay ?? null),
    raidAttemptsDay:
      stage.mode === "guild_raid"
        ? (save.raidAttemptsDay ?? 0) + 1
        : (save.raidAttemptsDay ?? 0),
    raidAttemptDay:
      stage.mode === "guild_raid" ? todayKey() : (save.raidAttemptDay ?? null),
  };
  persist();
  currentStage = stage;
  lastReward = null;
  lastScrollGain = 0;
  lastScrollPremiumGain = 0;
  autoMode = false;
  clearAutoTimer();
  dmgFloats = [];
  selectedTargetId = null;
  clearBattleSkillSelection();
  lastSeenBoardPhase = 0;
  boardRekindleFx = false;
  shapeFlashIds = [];
  shapeFlashUntil = 0;
  stageEntryId = null;
  const rivalEnemies =
    stage.mode === "arena"
      ? pickArenaRival(`${todayKey()}:${stage.id}`).enemyMonsterIds
      : undefined;
  battle = createStageBattle(stage, save, {
    banEnemyIds:
      stage.mode === "world_arena" ? save.arenaBanIds ?? [] : undefined,
    difficulty: diff,
    enemyMonsterIds: rivalEnemies,
  });
  battle.tickUntilReady();
  prefetchBattleBoardArt(stage);
  refreshLegal();
  ensureTarget();
  view = "battle";
  render();
  void resolveCombatUntilAllyInput();
}

/** Prefetch only the active circle + stone skins for this fight. */
function prefetchBattleBoardArt(stage: StageDef): void {
  if (typeof Image === "undefined") return;
  const urls = new Set<string>();
  urls.add(battleCircleSrc(battleCircleIdForStage(stage)));
  const allyEl =
    battle?.allySummoner.summonerElement ??
    battle?.units.find((u) => u.team === "ally" && u.kind === "summoner")
      ?.element;
  const enemyEl =
    battle?.enemySummoner.summonerElement ??
    battle?.units.find((u) => u.team === "enemy" && u.kind === "summoner")
      ?.element;
  urls.add(battleStoneSrc(normalizeBattleStoneId(allyEl)));
  urls.add(battleStoneSrc(normalizeBattleStoneId(enemyEl)));
  for (const src of urls) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

function renderStagePrepDock(): string {
  const selected = ensurePartyDraft();
  const activeEl = save.activeSummoner ?? "light";

  let dockBody = "";
  if (stagePrepInvTab === "summoner") {
    dockBody = `<div class="mon-book-inv mon-book-inv--rail stage-prep-roster-rail stage-prep-roster-rail--summoner" role="listbox" aria-label="${escapeHtml(t("ui.stagePrepTabSummoner"))}">
      ${SUMMONER_ELEMENTS.map((el) => {
        const on = el === activeEl;
        const p = save.summoners?.[el] ?? { level: 1, exp: 0, awaken: 0 };
        return `<button type="button" class="mon-slot mon-slot--portrait el-${el}${on ? " is-active" : ""}" data-stage-prep-info="summoner" data-stage-prep-summoner="${el}" role="option" aria-selected="${on}" title="${escapeHtml(elementLabel(el))}">
          <span class="mon-slot-art" aria-hidden="true">
            <img class="mon-slot-img" src="${summonerArtSrc(el)}" width="56" height="56" alt="" draggable="false" decoding="async" />
          </span>
          <span class="mon-slot-lv-overlay">Lv.${p.level}</span>
        </button>`;
      }).join("")}
    </div>`;
  } else if (stagePrepInvTab === "skill") {
    const el = activeEl;
    const kit = getSummonerKit(el);
    const prog = save.summonerMagic?.[el] ?? emptyMagicProgress();
    const unlocked = unlockedMagicSkills(el, prog);
    const unlockedIds = new Set(unlocked.map((s) => s.id));
    const slots = ["A", "B", "A1", "A2", "B1", "B2"] as const;
    if (!slots.includes(stagePrepSkillPick)) stagePrepSkillPick = "A";
    const focus = kit.skills[stagePrepSkillPick];
    const focusOpen = unlockedIds.has(focus.id);
    const focusRank = magicRank(prog, focus.id);
    const focusLines = magicSkillDescLines(focus, focusOpen ? focusRank : 0);
    const icos = slots
      .map((slot) => {
        const sk = kit.skills[slot];
        const open = unlockedIds.has(sk.id);
        const rank = magicRank(prog, sk.id);
        const on = stagePrepSkillPick === slot;
        const maxed = open && rank >= MAX_MAGIC_RANK;
        return `<button type="button" class="stage-prep-skill-pick${on ? " is-active" : ""}${open ? "" : " is-locked"}${maxed ? " is-max" : ""}" data-stage-prep-skill-pick="${slot}" role="tab" aria-selected="${on}" aria-pressed="${on}" title="${escapeHtml(sk.nameKo)}">
          ${summonerSkillArtImg(sk.id, "stage-prep-skill-pick-img", 44)}
          <span class="stage-prep-skill-pick-lv">${open ? (maxed ? "MAX" : `+${rank}`) : "—"}</span>
        </button>`;
      })
      .join("");
    const lockedHint =
      stagePrepSkillPick.startsWith("A") &&
      stagePrepSkillPick !== "A" &&
      prog.branch !== "A"
        ? t("ui.skillLockedHint", { branch: "A", n: MAX_MAGIC_RANK })
        : stagePrepSkillPick.startsWith("B") &&
            stagePrepSkillPick !== "B" &&
            prog.branch !== "B"
          ? t("ui.skillLockedHint", { branch: "B", n: MAX_MAGIC_RANK })
          : t("ui.stagePrepSkillLocked");
    const detailBody = focusOpen
      ? `<ul class="stage-prep-skill-detail-desc">${focusLines
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("")}</ul>
        ${
          focusRank < MAX_MAGIC_RANK
            ? `<button type="button" class="auth-btn-primary stage-prep-magic-enh" data-magic-enhance="${focus.id}">${escapeHtml(t("ui.sumBookEnhance"))} +1</button>`
            : `<span class="stage-prep-skill-max">MAX</span>`
        }`
      : `<p class="stage-prep-skill-locked muted">${escapeHtml(lockedHint)}</p>`;
    dockBody = `<div class="stage-prep-skill-panel">
      <p class="stage-prep-dock-hint">${escapeHtml(
        prog.branch
          ? t("ui.sumBookMagicBranch", { branch: prog.branch })
          : t("ui.sumBookMagicBranchNone"),
      )}</p>
      <div class="stage-prep-skill-rail">
        <div class="stage-prep-skill-picks" role="tablist" aria-label="${escapeHtml(t("ui.stagePrepTabSkill"))}">${icos}</div>
      </div>
      <div class="stage-prep-skill-detail" role="tabpanel">
        <div class="stage-prep-skill-detail-head">
          ${summonerSkillArtImg(focus.id, "stage-prep-skill-detail-ico", 40)}
          <div class="stage-prep-skill-detail-copy">
            <strong class="stage-prep-skill-detail-name">${escapeHtml(focus.nameKo)}</strong>
            <small class="stage-prep-skill-detail-meta">${
              focusOpen
                ? escapeHtml(
                    t("ui.magicRankLabel", {
                      rank: focusRank,
                      max: MAX_MAGIC_RANK,
                    }),
                  )
                : escapeHtml(t("ui.stagePrepSkillLocked"))
            }</small>
          </div>
        </div>
        ${detailBody}
      </div>
    </div>`;
  } else {
    const sorted = sortRosterForSlots(save.roster, stagePrepSortMode);
    const rosterSlots = Array.from(
      { length: ROSTER_SLOT_CAP },
      (_, i) => sorted[i] ?? null,
    );
    const invTiles = rosterSlots
      .map((m) => {
        if (!m) {
          return `<div class="mon-slot mon-slot--portrait mon-slot--empty" role="presentation" aria-hidden="true">
            <span class="mon-slot-art">
              <img class="mon-slot-img mon-slot-img--empty" src="/art/ui/mon-slot-empty.svg" width="56" height="56" alt="" draggable="false" />
            </span>
          </div>`;
        }
        const on = selected.has(m.uid);
        const def = getMonster(m.monsterId);
        const el = def?.element ?? "dark";
        const starN = Math.max(1, def?.naturalStars ?? 1);
        const grade = invGradeFromStars(starN);
        const starsHtml = monStarsHtml(starN);
        const art =
          monsterArtImg(m.monsterId, "mon-slot-img", 56) ||
          (def?.element?.[0]?.toUpperCase() ?? "?");
        return `<button type="button" class="mon-slot mon-slot--portrait inv-grade--${grade} el-${el}${on ? " is-active" : ""}" data-stage-prep-info="monster" data-stage-party-toggle="${m.uid}" role="option" aria-selected="${on}" title="${escapeHtml(describeOwned(m))}">
          ${invGradePlateImg(grade, "mon-slot-grade-plate", 112)}
          <span class="mon-slot-art" aria-hidden="true">${art}</span>
          <span class="mon-slot-stars-overlay" aria-label="${starN}">${starsHtml}</span>
          <span class="mon-slot-lv-overlay">Lv.${m.level}</span>
        </button>`;
      })
      .join("");
    dockBody = `<div class="mon-book-inv mon-book-inv--rail stage-prep-roster-rail" role="listbox" aria-label="${escapeHtml(t("ui.stagePrepTabMonster"))}">
      ${invTiles}
    </div>`;
  }

  const sortSelect =
    stagePrepInvTab === "monster"
      ? `<label class="stage-prep-sort">
          <span class="sr-only">${escapeHtml(t("ui.rosterSort"))}</span>
          <select id="stage-prep-sort" aria-label="${escapeHtml(t("ui.rosterSort"))}">
            <option value="stars"${stagePrepSortMode === "stars" ? " selected" : ""}>${escapeHtml(t("ui.sortStars"))}</option>
            <option value="level"${stagePrepSortMode === "level" ? " selected" : ""}>${escapeHtml(t("ui.sortLevel"))}</option>
            <option value="element"${stagePrepSortMode === "element" ? " selected" : ""}>${escapeHtml(t("ui.sortElement"))}</option>
            <option value="default"${stagePrepSortMode === "default" ? " selected" : ""}>${escapeHtml(t("ui.sortDefault"))}</option>
            <option value="party"${stagePrepSortMode === "party" ? " selected" : ""}>${escapeHtml(t("ui.sortParty"))}</option>
          </select>
        </label>`
      : "";

  return `<div class="stage-prep-dock">
        <div class="stage-prep-dock-bar">
          <div class="stage-prep-tabs" role="tablist">
            <button type="button" class="stage-prep-tab${stagePrepInvTab === "summoner" ? " is-on" : ""}" data-stage-inv-tab="summoner" role="tab" aria-selected="${stagePrepInvTab === "summoner"}">${escapeHtml(t("ui.stagePrepTabSummoner"))}</button>
            <button type="button" class="stage-prep-tab${stagePrepInvTab === "monster" ? " is-on" : ""}" data-stage-inv-tab="monster" role="tab" aria-selected="${stagePrepInvTab === "monster"}">${escapeHtml(t("ui.stagePrepTabMonster"))}</button>
            <button type="button" class="stage-prep-tab${stagePrepInvTab === "skill" ? " is-on" : ""}" data-stage-inv-tab="skill" role="tab" aria-selected="${stagePrepInvTab === "skill"}">${escapeHtml(t("ui.stagePrepTabSkill"))}</button>
          </div>
          ${sortSelect}
        </div>
        <div class="stage-prep-dock-body">${dockBody}</div>
      </div>`;
}

/** Open party-setup gate before combat (SW-style sortie prep). */
function openStagePrep(stage: StageDef): void {
  if (!isStageUnlocked(save, stage.id)) {
    flash(t("ui.b72f5a4752"));
    return;
  }
  if (!isDifficultyOpen(stage, stageEntryDiff)) {
    flash(t("ui.a4d2cdf322"));
    return;
  }
  stageEntryId = stage.id;
  stagePrepSummonerOpen = false;
  stagePrepInvTab = "monster";
  stagePrepInfo = null;
  stagePrepSkillPick = "A";
  clearStagePrepLongPress();
  stagePrepSuppressClick = false;
  const presets = normalizePartyPresets(save, save.partyPresets);
  const idx = clampPartyPresetIndex(save.activePartyPreset);
  const preset = presets[idx]!;
  save = {
    ...save,
    partyPresets: presets,
    activePartyPreset: idx,
  };
  if (preset.summoner !== (save.activeSummoner ?? "light")) {
    save = setActiveSummoner(save, preset.summoner);
  }
  partyDraft = new Set(preset.party.length ? preset.party : save.party);
  persist();
  applyStagesRegionOpen();
}

function closeStagePrep(): void {
  stageEntryId = null;
  stagePrepSummonerOpen = false;
  stagePrepInfo = null;
  clearStagePrepLongPress();
  stagePrepSuppressClick = false;
  partyDraft = null;
  applyStagesRegionOpen();
}

function confirmStagePrepStart(): void {
  const stage = stageEntryId ? getStage(stageEntryId) : null;
  if (!stage) return;
  const draft = ensurePartyDraft();
  if (draft.size < 1) {
    flash(t("ui.stagePrepNeedParty"));
    return;
  }
  const r = runSetParty(save, [...draft]);
  save = r.save;
  persist();
  partyDraft = null;
  startBattle(stage, stageEntryDiff);
}

function stagePrepLeaderPassive(saveRef: PlayerSave): {
  title: string;
  detail: string;
  pct: number;
} {
  const active = getActiveSummoner(saveRef);
  const el = saveRef.activeSummoner ?? "light";
  const leader = getSummonerLeader(el);
  const tree = skillTreeBonuses(saveRef.skillTree ?? []);
  const pct =
    (leader.atkPct ?? 0) +
    awakenLeaderAtkPct(active.awaken) +
    gearLeaderAtkPct(normalizeSummonerGear(saveRef.gear)) +
    tree.leaderAtkBonus;
  const title = leader.nameKo;
  const bits: string[] = [];
  if (leader.atkPct) bits.push(`ATK +${Math.round(leader.atkPct * 100)}%`);
  if (leader.elementAtkPct)
    bits.push(`same-el ATK +${Math.round(leader.elementAtkPct * 100)}%`);
  if (leader.hpPct) bits.push(`HP +${Math.round(leader.hpPct * 100)}%`);
  if (leader.spdPct) bits.push(`SPD +${Math.round(leader.spdPct * 100)}%`);
  if (leader.accuracyFlat) bits.push(`ACC +${leader.accuracyFlat}`);
  if (leader.critRateFlat) bits.push(`CR +${leader.critRateFlat}%`);
  if (leader.critDmgFlat) bits.push(`CD +${leader.critDmgFlat}%`);
  if (leader.damageTakenMul != null)
    bits.push(`DR ${Math.round((1 - leader.damageTakenMul) * 100)}%`);
  if (pct > (leader.atkPct ?? 0))
    bits.push(
      t("ui.stagePrepLeaderAtk", {
        pct: String(Math.round(pct * 1000) / 10),
      }),
    );
  const detail = bits.length ? bits.join(` ${MIDDOT} `) : t("ui.stagePrepLeaderNone");
  return { title, detail, pct };
}

function renderStageEntryModal(): string {
  const stage = stageEntryId ? getStage(stageEntryId) : null;
  if (!stage) return "";
  const diff =
    STAGE_DIFFICULTIES.find((d) => d.id === stageEntryDiff) ??
    STAGE_DIFFICULTIES[0]!;
  const cost = stageEnergyCost(stage, stageEntryDiff);
  const energyNow = Math.floor(save.island.energy);
  const energyMax = save.island.energyMax ?? 100;
  const selected = ensurePartyDraft();
  const partyUids = [...selected];
  while (partyUids.length < 4) partyUids.push("");
  const activeEl = save.activeSummoner ?? "light";
  const activeSum = getActiveSummoner(save);
  const enemyIds = (stage.enemyMonsterIds ?? []).slice(0, 4);
  const leader = stagePrepLeaderPassive(save);
  const presets = normalizePartyPresets(save, save.partyPresets);
  const presetIdx = clampPartyPresetIndex(save.activePartyPreset);

  const enemyMonSlots = [0, 1, 2, 3]
    .map((i) => {
      const id = enemyIds[i];
      if (!id) {
        return `<div class="stage-prep-slot empty" aria-hidden="true"></div>`;
      }
      const m = getMonster(id);
      return `<button type="button" class="stage-prep-slot el-${m?.element ?? "dark"}" data-stage-prep-info="enemy" data-stage-prep-enemy-id="${id}" title="${escapeHtml(m?.nameKo ?? id)}">
        <span class="stage-prep-slot-art">${monsterArtImg(id, "stage-prep-slot-img", 52) || "?"}</span>
        <small>${escapeHtml(m?.nameKo ?? id)}</small>
      </button>`;
    })
    .join("");

  const allyMonSlots = [0, 1, 2, 3]
    .map((i) => {
      const uid = partyUids[i];
      if (!uid) {
        return `<div class="stage-prep-slot empty is-open-slot" aria-label="${i + 1}"></div>`;
      }
      const m = save.roster.find((x) => x.uid === uid);
      if (!m) {
        return `<div class="stage-prep-slot empty is-open-slot" aria-label="${i + 1}"></div>`;
      }
      const def = getMonster(m.monsterId);
      return `<button type="button" class="stage-prep-slot el-${def?.element ?? "dark"}" data-stage-prep-info="monster" data-stage-party-toggle="${m.uid}" title="${escapeHtml(describeOwned(m))}">
        <span class="stage-prep-slot-art">${monsterArtImg(m.monsterId, "stage-prep-slot-img", 56) || "?"}</span>
        <span class="stage-prep-slot-lv">Lv.${m.level}</span>
      </button>`;
    })
    .join("");

  const presetRow = Array.from({ length: PARTY_PRESET_COUNT }, (_, i) => {
    const on = i === presetIdx;
    const filled = (presets[i]?.party.length ?? 0) > 0;
    return `<button type="button" class="stage-prep-preset${on ? " is-on" : ""}${filled ? " is-filled" : ""}" data-stage-preset="${i}" aria-pressed="${on}">${i + 1}</button>`;
  }).join("");

  const magicProg =
    save.summonerMagic?.[save.activeSummoner ?? "light"] ??
    emptyMagicProgress();
  const skillIcons = unlockedMagicSkills(
    save.activeSummoner ?? "light",
    magicProg,
  )
    .slice(0, 4)
    .map((n) => {
      return `<span class="stage-prep-skill-ico is-on" title="${escapeHtml(n.nameKo)}">${summonerSkillArtImg(n.id, "stage-prep-skill-ico-img", 28)}</span>`;
    })
    .join("");

  const titleText = `${stage.nameKo}(${diff.labelKo})`;
  const canStart = selected.size > 0 && energyNow >= cost;

  return `<div class="stage-prep-layer" role="dialog" aria-modal="true" aria-labelledby="stage-entry-title">
    <div class="stage-prep stage-prep--board stage-prep--${diff.id}">
      <header class="stage-prep-top stage-prep-top--board">
        <h2 class="stage-prep-title" id="stage-entry-title">${escapeHtml(titleText)}</h2>
        <div class="stage-prep-energy">
          <img class="res-ico" src="/art/ui/res/energy.svg" width="18" height="18" alt="" draggable="false" />
          <strong>${energyNow}/${energyMax}</strong>
          <button type="button" class="stage-prep-energy-buy" id="btn-stage-prep-buy-energy" title="${escapeHtml(t("ui.stagePrepEnergyBuy"))}" aria-label="${escapeHtml(t("ui.stagePrepEnergyBuy"))}">+</button>
        </div>
      </header>

      <section class="stage-prep-team stage-prep-team--enemy" aria-label="${escapeHtml(t("ui.stagePrepEnemy"))}">
        <div class="stage-prep-slots">
          <div class="stage-prep-slot stage-prep-slot--summoner el-dark" title="${escapeHtml(t("ui.stagePrepEnemySummoner"))}">
            <img class="stage-prep-slot-img" src="${summonerArtSrc("dark")}" width="64" height="64" alt="" draggable="false" decoding="async" />
            <span class="stage-prep-slot-tag">${escapeHtml(t("ui.stagePrepEnemySummoner"))}</span>
          </div>
          ${enemyMonSlots}
        </div>
        <div class="stage-prep-effects">
          <p><span>${escapeHtml(t("ui.stagePrepEnemyLeader"))}</span> ${escapeHtml(t("ui.stagePrepEnemyLeaderLine"))}</p>
        </div>
      </section>

      <div class="stage-prep-vs" aria-hidden="true">VS</div>

      <section class="stage-prep-team stage-prep-team--ally" aria-label="${escapeHtml(t("ui.stagePrepParty"))}">
        <div class="stage-prep-presets">
          ${presetRow}
          <button type="button" class="stage-prep-save-deck" id="btn-stage-prep-save-deck">${escapeHtml(t("ui.stagePrepSaveDeck"))}</button>
        </div>
        <div class="stage-prep-slots">
          <button type="button" class="stage-prep-slot stage-prep-slot--summoner el-${activeEl}" data-stage-prep-info="summoner" data-stage-inv-tab="summoner" title="${escapeHtml(t("ui.stagePrepChangeSummoner"))}">
            <img class="stage-prep-slot-img" src="${summonerArtSrc(activeEl)}" width="64" height="64" alt="" draggable="false" decoding="async" />
            <span class="stage-prep-slot-tag">${escapeHtml(t("ui.stagePrepSummoner"))}</span>
            <span class="stage-prep-slot-lv">Lv.${activeSum.level}</span>
          </button>
          ${allyMonSlots}
        </div>
        <div class="stage-prep-effects stage-prep-effects--ally">
          <div class="stage-prep-effects-main">
            <p><span>${escapeHtml(t("ui.stagePrepLeaderPassive"))}</span> ${escapeHtml(leader.title)} ${MIDDOT} ${escapeHtml(leader.detail)}</p>
          </div>
          <div class="stage-prep-skill-icos" aria-hidden="true">${skillIcons}</div>
        </div>
      </section>

      ${renderStagePrepDock()}

      <footer class="stage-prep-footer">
        <button type="button" class="stage-prep-start" id="btn-stage-entry-start" ${canStart ? "" : "disabled"}>
          <span class="stage-prep-start-cost" aria-hidden="true"><img src="/art/ui/res/energy.svg" width="15" height="15" alt="" draggable="false" />${cost}</span>
          <span>${escapeHtml(t("ui.stagePrepStart"))}</span>
        </button>
        <button type="button" class="stage-prep-cancel" id="btn-stage-entry-cancel">${escapeHtml(t("ui.stagePrepCancel"))}</button>
      </footer>
    </div>
    ${renderStagePrepInfoModal()}
  </div>`;
}



/** Suppress CSS modal-pop on soft in-place refreshes. */
function suppressStageModalAnim(root: ParentNode): void {
  root
    .querySelectorAll<HTMLElement>(
      ".stage-prep-layer, .stages-region-layer, .stages-region-sheet, .stage-prep, .stage-drop-info-layer, .stage-entry-modal, .stage-prep-info-layer",
    )
    .forEach((el) => {
      el.style.animation = "none";
    });
}

function clearStagePrepLongPress(): void {
  if (stagePrepLongPress) {
    clearTimeout(stagePrepLongPress.timer);
    stagePrepLongPress = null;
  }
}

function consumeStagePrepSuppressClick(): boolean {
  if (!stagePrepSuppressClick) return false;
  stagePrepSuppressClick = false;
  return true;
}

function openStagePrepInfoFromEl(el: HTMLElement): void {
  const infoKind = el.dataset.stagePrepInfo;
  if (infoKind === "summoner") {
    const raw =
      el.dataset.stagePrepSummoner ?? save.activeSummoner ?? "light";
    if (!(SUMMONER_ELEMENTS as readonly string[]).includes(raw)) return;
    stagePrepInfo = { kind: "summoner", element: raw as SummonerElement };
  } else if (infoKind === "enemy") {
    const id = el.dataset.stagePrepEnemyId;
    if (!id) return;
    stagePrepInfo = { kind: "enemy", monsterId: id };
  } else if (infoKind === "monster" || el.dataset.stagePartyToggle) {
    const uid = el.dataset.stagePartyToggle;
    if (!uid) return;
    stagePrepInfo = { kind: "monster", uid };
  } else if (el.dataset.stagePrepSummoner) {
    const raw = el.dataset.stagePrepSummoner;
    if (!(SUMMONER_ELEMENTS as readonly string[]).includes(raw)) return;
    stagePrepInfo = { kind: "summoner", element: raw as SummonerElement };
  } else {
    return;
  }
  applyStagePrepInfo({ animate: true });
}

function renderStagePrepInfoModal(): string {
  const info = stagePrepInfo;
  if (!info) return "";

  let body = "";
  if (info.kind === "summoner") {
    const el = info.element;
    const p = save.summoners?.[el] ?? { level: 1, exp: 0, awaken: 0 };
    const kit = getSummonerKit(el);
    const leader = kit.leader;
    const prog = save.summonerMagic?.[el] ?? emptyMagicProgress();
    const unlocked = unlockedMagicSkills(el, prog);
    const leaderBits = stagePrepLeaderPassive({
      ...save,
      activeSummoner: el,
    });
    const skillRow = unlocked
      .map((sk) => {
        const rank = magicRank(prog, sk.id);
        return `<div class="stage-prep-info-skill">
          ${summonerSkillArtImg(sk.id, "stage-prep-info-skill-img", 36)}
          <span class="stage-prep-info-skill-copy">
            <strong>${escapeHtml(sk.nameKo)}</strong>
            <small>${escapeHtml(
              t("ui.magicRankLabel", { rank, max: MAX_MAGIC_RANK }),
            )}</small>
          </span>
        </div>`;
      })
      .join("");
    body = `<div class="stage-prep-info-hero el-${el}">
      <img class="stage-prep-info-art" src="${summonerArtSrc(el)}" width="88" height="88" alt="" draggable="false" decoding="async" />
      <div class="stage-prep-info-hero-copy">
        <strong>${escapeHtml(leader.nameKo)}</strong>
        <small>${escapeHtml(elementLabel(el))} ${MIDDOT} Lv.${p.level}${p.awaken > 0 ? ` ${MIDDOT} +${p.awaken}` : ""}</small>
        <p class="stage-prep-info-leader"><span>${escapeHtml(t("ui.stagePrepLeaderPassive"))}</span> ${escapeHtml(leaderBits.detail)}</p>
      </div>
    </div>
    <div class="stage-prep-info-section">
      <h3>${escapeHtml(t("ui.stagePrepInfoSkills"))}</h3>
      <div class="stage-prep-info-skills">${skillRow || `<p class="muted">${escapeHtml(t("ui.stagePrepSkillLocked"))}</p>`}</div>
    </div>`;
  } else if (info.kind === "monster") {
    const m = save.roster.find((x) => x.uid === info.uid);
    if (!m) {
      stagePrepInfo = null;
      return "";
    }
    const def = getMonster(m.monsterId);
    const el = def?.element ?? "dark";
    const preview = previewOwnedCombatStats(save, m.uid);
    const role = monsterRoleLabel(def?.role, def?.baseStats);
    const levels = (m.skillLevels ?? [1, 1, 1]) as [number, number, number];
    const skills = (def?.skills ?? [])
      .map((sk, si) => {
        const lv = levels[si] ?? 1;
        const lines = monsterSkillDescLines(sk)
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("");
        return `<div class="stage-prep-info-skill">
          ${monsterSkillArtImg(m.monsterId, si, sk, "stage-prep-info-skill-img", 36)}
          <span class="stage-prep-info-skill-copy">
            <strong>${escapeHtml(sk.nameKo)}</strong>
            <small>Lv.${lv}${lv >= MAX_SKILL_LEVEL ? " MAX" : ""}</small>
            <ul>${lines}</ul>
          </span>
        </div>`;
      })
      .join("");
    body = `<div class="stage-prep-info-hero el-${el}">
      <span class="stage-prep-info-art-wrap">${monsterArtImg(m.monsterId, "stage-prep-info-art", 88) || "?"}</span>
      <div class="stage-prep-info-hero-copy">
        <strong>${escapeHtml(def?.nameKo ?? m.monsterId)}</strong>
        <small>${escapeHtml(monsterElementLabel(el))} ${MIDDOT} ${escapeHtml(role)} ${MIDDOT} Lv.${m.level}</small>
        <div class="stage-prep-info-stars">${monStarsHtml(Math.max(1, def?.naturalStars ?? 1))}${(m.evolve ?? 0) > 0 ? `<span class="mon-evo">+${m.evolve}</span>` : ""}</div>
      </div>
    </div>
    ${preview ? renderInspectCombatStatsHtml(preview) : ""}
    <div class="stage-prep-info-section">
      <h3>${escapeHtml(t("ui.stagePrepInfoSkills"))}</h3>
      <div class="stage-prep-info-skills">${skills}</div>
    </div>`;
  } else {
    const def = getMonster(info.monsterId);
    if (!def) {
      stagePrepInfo = null;
      return "";
    }
    const el = def.element;
    const role = monsterRoleLabel(def.role, def.baseStats);
    const base = def.baseStats;
    const statsHtml = `<div class="mon-book-stats mon-inspect-stats mon-inspect-stats--grid2x4" role="list">
      <div class="stat-cell" role="listitem"><span class="stat-cell-k">${escapeHtml(t("ui.statHp"))}</span><span class="stat-cell-v">${base.hp}</span></div>
      <div class="stat-cell" role="listitem"><span class="stat-cell-k">${escapeHtml(t("ui.statAtk"))}</span><span class="stat-cell-v">${base.atk}</span></div>
      <div class="stat-cell" role="listitem"><span class="stat-cell-k">${escapeHtml(t("ui.statDef"))}</span><span class="stat-cell-v">${base.def}</span></div>
      <div class="stat-cell" role="listitem"><span class="stat-cell-k">${escapeHtml(t("ui.statSpd"))}</span><span class="stat-cell-v">${base.spd}</span></div>
    </div>`;
    const skills = (def.skills ?? [])
      .map((sk, si) => {
        const lines = monsterSkillDescLines(sk)
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("");
        return `<div class="stage-prep-info-skill">
          ${monsterSkillArtImg(def.id, si, sk, "stage-prep-info-skill-img", 36)}
          <span class="stage-prep-info-skill-copy">
            <strong>${escapeHtml(sk.nameKo)}</strong>
            <ul>${lines}</ul>
          </span>
        </div>`;
      })
      .join("");
    body = `<div class="stage-prep-info-hero el-${el}">
      <span class="stage-prep-info-art-wrap">${monsterArtImg(def.id, "stage-prep-info-art", 88) || "?"}</span>
      <div class="stage-prep-info-hero-copy">
        <strong>${escapeHtml(def.nameKo)}</strong>
        <small>${escapeHtml(t("ui.stagePrepInfoEnemy"))} ${MIDDOT} ${escapeHtml(monsterElementLabel(el))} ${MIDDOT} ${escapeHtml(role)}</small>
        <div class="stage-prep-info-stars">${monStarsHtml(Math.max(1, def.naturalStars))}</div>
      </div>
    </div>
    ${statsHtml}
    <div class="stage-prep-info-section">
      <h3>${escapeHtml(t("ui.stagePrepInfoSkills"))}</h3>
      <div class="stage-prep-info-skills">${skills}</div>
    </div>`;
  }

  return `<div class="stage-prep-info-layer" id="stage-prep-info-layer" role="presentation">
    <button type="button" class="stage-prep-info-backdrop" id="btn-stage-prep-info-close" aria-label="${escapeHtml(t("ui.stagePrepInfoClose"))}"></button>
    <div class="stage-prep-info-modal" role="dialog" aria-modal="true" aria-labelledby="stage-prep-info-title">
      ${modalCloseX(t("ui.stagePrepInfoClose"), "btn-stage-prep-info-close")}
      <h2 class="sr-only" id="stage-prep-info-title">${escapeHtml(t("ui.stagePrepInfoTitle"))}</h2>
      <div class="stage-prep-info-body">${body}</div>
    </div>
  </div>`;
}

function applyStagePrepInfo(opts?: { animate?: boolean }): void {
  const host = app.querySelector("#stages-region-host");
  const layer = host?.querySelector(".stage-prep-layer");
  if (!host || !layer) return;
  const existing = host.querySelector("#stage-prep-info-layer");
  if (!stagePrepInfo) {
    existing?.remove();
    return;
  }
  const html = renderStagePrepInfoModal();
  if (!html) {
    existing?.remove();
    return;
  }
  if (existing) existing.outerHTML = html;
  else layer.insertAdjacentHTML("beforeend", html);
  bindStagePrepInfoControls(host);
  if (opts?.animate !== false) {
    const next = host.querySelector<HTMLElement>("#stage-prep-info-layer");
    if (next) replayModalPop(next);
  } else {
    const next = host.querySelector<HTMLElement>("#stage-prep-info-layer");
    if (next) next.style.animation = "none";
  }
}

function bindStagePrepInfoControls(host: ParentNode): void {
  ensureModalXDelegate();
  const close = () => {
    stagePrepInfo = null;
    applyStagePrepInfo();
  };
  host.querySelector("#btn-stage-prep-info-close")?.addEventListener("click", close);
  host
    .querySelector(".stage-prep-info-backdrop")
    ?.addEventListener("click", close);
}

function bindStagePrepLongPress(host: ParentNode): void {
  const root = host.querySelector<HTMLElement>(".stage-prep");
  if (!root || root.dataset.stagePrepLpBound === "1") return;
  root.dataset.stagePrepLpBound = "1";

  const targetFromEvent = (ev: Event): HTMLElement | null => {
    const t = ev.target;
    if (!(t instanceof Element)) return null;
    return t.closest<HTMLElement>(
      "[data-stage-prep-info], [data-stage-party-toggle], [data-stage-prep-summoner]",
    );
  };

  root.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    const el = targetFromEvent(ev);
    if (!el || !root.contains(el)) return;
    clearStagePrepLongPress();
    stagePrepLongPress = {
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      timer: setTimeout(() => {
        if (!stagePrepLongPress) return;
        stagePrepLongPress = null;
        stagePrepSuppressClick = true;
        try {
          navigator.vibrate?.(18);
        } catch {
          /* ignore */
        }
        openStagePrepInfoFromEl(el);
      }, 520),
    };
  });

  root.addEventListener("pointermove", (ev) => {
    if (!stagePrepLongPress || stagePrepLongPress.pointerId !== ev.pointerId) {
      return;
    }
    if (
      Math.hypot(
        ev.clientX - stagePrepLongPress.startX,
        ev.clientY - stagePrepLongPress.startY,
      ) > 12
    ) {
      clearStagePrepLongPress();
    }
  });

  const end = (ev: PointerEvent) => {
    if (stagePrepLongPress && stagePrepLongPress.pointerId === ev.pointerId) {
      clearStagePrepLongPress();
    }
  };
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
  root.addEventListener(
    "click",
    (ev) => {
      if (!stagePrepSuppressClick) return;
      const el = targetFromEvent(ev);
      if (!el) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      stagePrepSuppressClick = false;
    },
    true,
  );
}

/** Refresh only the battle-prep inventory dock (no modal pop / team reflow). */
function refreshStagePrepDock(): void {
  const host = app.querySelector("#stages-region-host");
  if (!host || !stageEntryId) return;
  const dock = host.querySelector(".stage-prep-dock");
  if (!dock) {
    applyStagesRegionOpen({ animate: false });
    return;
  }
  dock.outerHTML = renderStagePrepDock();
  bindStagePrepDockControls(host);
  const nextDock = host.querySelector(".stage-prep-dock");
  if (nextDock) dematteArtInTree(nextDock, "img.mon-slot-img");
}

function onStagePrepInvTabClick(btn: HTMLButtonElement): void {
  const tab = btn.dataset.stageInvTab;
  if (tab === "summoner" || tab === "monster" || tab === "skill") {
    if (stagePrepInvTab === tab) return;
    stagePrepInvTab = tab;
    refreshStagePrepDock();
  }
}

function bindStagePrepDockControls(host: ParentNode): void {
  const dock = host.querySelector(".stage-prep-dock");
  if (!dock) return;

  dock.querySelectorAll<HTMLButtonElement>("[data-stage-inv-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (consumeStagePrepSuppressClick()) return;
      onStagePrepInvTabClick(btn);
    });
  });

  dock.querySelector("#stage-prep-sort")?.addEventListener("change", (ev) => {
    const raw = (ev.target as HTMLSelectElement).value;
    const allowed: RosterSortMode[] = [
      "default",
      "level",
      "stars",
      "element",
      "party",
    ];
    if (!allowed.includes(raw as RosterSortMode)) return;
    stagePrepSortMode = raw as RosterSortMode;
    refreshStagePrepDock();
  });

  dock.querySelectorAll<HTMLButtonElement>("[data-stage-prep-summoner]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (consumeStagePrepSuppressClick()) return;
      const el = btn.dataset.stagePrepSummoner as SummonerElement | undefined;
      if (!el) return;
      if (el !== (save.activeSummoner ?? "light")) {
        save = setActiveSummoner(save, el);
        persist();
        flash(t("summonerPicker.switched", { element: elementLabel(el) }));
      }
      stagePrepInvTab = "summoner";
      stagePrepSkillPick = "A";
      applyStagesRegionOpen({ animate: false });
    });
  });

  dock.querySelectorAll<HTMLButtonElement>("[data-stage-party-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (consumeStagePrepSuppressClick()) return;
      const draft = ensurePartyDraft();
      const uid = btn.dataset.stagePartyToggle!;
      if (draft.has(uid)) draft.delete(uid);
      else if (draft.size < 4) draft.add(uid);
      else {
        flash(t("ui.e44dd9cad3"));
        return;
      }
      applyStagesRegionOpen({ animate: false });
    });
  });

  dock.querySelectorAll<HTMLButtonElement>("[data-stage-prep-skill-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slot = btn.dataset.stagePrepSkillPick as MagicSkillSlot | undefined;
      if (!slot || slot === stagePrepSkillPick) return;
      stagePrepSkillPick = slot;
      refreshStagePrepDock();
    });
  });

  dock.querySelectorAll<HTMLButtonElement>("[data-magic-enhance]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.magicEnhance ?? "";
      if (!id) return;
      const r = runEnhanceMagicSkill(save, id);
      save = r.save;
      persist();
      flash(r.message);
      applyStagesRegionOpen({ animate: false });
    });
  });
}

/** Open/update drop-info overlay without rebuilding the region sheet. */
function applyStageDropInfo(opts?: { animate?: boolean }): void {
  const host = app.querySelector("#stages-region-host");
  const regionLayer = host?.querySelector(".stages-region-layer");
  if (!host || !regionLayer || stageEntryId) return;
  const selected = stagesRegion
    ? stagesRegions().find((r) => r.id === stagesRegion) ?? null
    : null;
  if (!selected) return;

  const btn = host.querySelector<HTMLButtonElement>("#btn-region-drop-info");
  if (btn) {
    btn.classList.toggle("is-on", stagesDropInfoOpen);
    btn.setAttribute("aria-pressed", stagesDropInfoOpen ? "true" : "false");
  }

  const existing = host.querySelector("#stage-drop-info-layer");
  if (!stagesDropInfoOpen) {
    existing?.remove();
    return;
  }

  const html = renderStageDropInfoModal(selected);
  const animate = opts?.animate !== false;
  if (existing) {
    existing.outerHTML = html;
    const next = host.querySelector<HTMLElement>("#stage-drop-info-layer");
    if (next && !animate) next.style.animation = "none";
  } else {
    regionLayer.insertAdjacentHTML("beforeend", html);
    if (!animate) {
      const next = host.querySelector<HTMLElement>("#stage-drop-info-layer");
      if (next) next.style.animation = "none";
    }
  }
  bindStageDropInfoControls(host);
}

function bindStageDropInfoControls(host: ParentNode): void {
  host.querySelector("#btn-stage-drop-info-close")?.addEventListener("click", () => {
    stagesDropInfoOpen = false;
    stagesDropSetExpand = false;
    applyStageDropInfo();
  });

  host.querySelector("#btn-stage-drop-set-more")?.addEventListener("click", () => {
    stagesDropSetExpand = !stagesDropSetExpand;
    applyStageDropInfo({ animate: false });
  });

  host.querySelectorAll<HTMLButtonElement>("[data-drop-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.dropTab;
      if (tab === "scroll" || tab === "gear") {
        stagesDropTab = tab;
        applyStageDropInfo({ animate: false });
      }
    });
  });
}


function bindStageEntryModal(): void {
  const host = app.querySelector("#stages-region-host");
  if (!host) return;
  dematteArtInTree(host, "img.mon-slot-img");

  host.querySelector("#btn-stage-entry-start")?.addEventListener("click", () => {
    confirmStagePrepStart();
  });

  host.querySelector("#btn-stage-entry-cancel")?.addEventListener("click", () => {
    closeStagePrep();
  });

  host.querySelector("#btn-stage-prep-buy-energy")?.addEventListener("click", () => {
    const r = runBuyEnergy(save, 1);
    save = r.save;
    persist();
    flash(r.message);
    applyStagesRegionOpen({ animate: false });
  });

  host.querySelector("#btn-stage-prep-save-deck")?.addEventListener("click", () => {
    const draft = ensurePartyDraft();
    const idx = clampPartyPresetIndex(save.activePartyPreset);
    const r = runSavePartyPreset(save, idx, {
      summoner: save.activeSummoner ?? "light",
      party: [...draft],
    });
    save = r.save;
    persist();
    flash(t("ui.stagePrepDeckSaved", { n: idx + 1 }));
    applyStagesRegionOpen({ animate: false });
  });

  host.querySelectorAll<HTMLButtonElement>("[data-stage-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = clampPartyPresetIndex(Number(btn.dataset.stagePreset));
      const r = runLoadPartyPreset(save, idx);
      save = r.save;
      partyDraft = new Set(save.party);
      persist();
      flash(t("ui.stagePrepDeckLoaded", { n: idx + 1 }));
      applyStagesRegionOpen({ animate: false });
    });
  });

  host.querySelectorAll<HTMLButtonElement>(".stage-prep-slots [data-stage-party-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (consumeStagePrepSuppressClick()) return;
      const draft = ensurePartyDraft();
      const uid = btn.dataset.stagePartyToggle!;
      if (draft.has(uid)) draft.delete(uid);
      else if (draft.size < 4) draft.add(uid);
      else {
        flash(t("ui.e44dd9cad3"));
        return;
      }
      applyStagesRegionOpen({ animate: false });
    });
  });

  host
    .querySelectorAll<HTMLButtonElement>(".stage-prep-slots [data-stage-inv-tab]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        if (consumeStagePrepSuppressClick()) return;
        onStagePrepInvTabClick(btn);
      });
    });

  bindStagePrepDockControls(host);
  bindStagePrepLongPress(host);
  if (stagePrepInfo) bindStagePrepInfoControls(host);
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
}

function clearBattleSkillSelection(): void {
  selectedSkillIndex = null;
  selectedSummonerSkill = null;
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

/** Manual cast: only use an explicitly tapped enemy (no auto lowest-HP). */
function requireSelectedEnemyTarget(): string | undefined {
  if (!battle || !selectedTargetId) return undefined;
  const t = battle.getUnit(selectedTargetId);
  if (t?.alive && t.kind === "monster" && t.team === "enemy") {
    return selectedTargetId;
  }
  return undefined;
}

function summonerSkillNeedsEnemyTarget(id: BattleSummonerSkillId): boolean {
  return id === "open";
}

function grantRewardIfNeeded(): void {
  if (!battle?.finishReason || !currentStage) return;
  if (lastReward) return;
  const victory = battle.finishReason === "ally_win";
  const scrollsBefore = save.scrolls;
  const scrollsPremiumBefore = save.scrollsPremium ?? 0;
  const { save: next, reward } = applyRewards(save, currentStage, victory);
  save = next;
  persist();
  lastScrollGain = Math.max(0, save.scrolls - scrollsBefore);
  lastScrollPremiumGain = Math.max(
    0,
    (save.scrollsPremium ?? 0) - scrollsPremiumBefore,
  );
  lastReward = reward;
  view = "result";
}

function resultLootTile(opts: {
  icon: string;
  label: string;
  amount: string;
  tone?: string;
  badge?: string;
}): string {
  const tone = opts.tone ? ` result-loot-tile--${opts.tone}` : "";
  const badge = opts.badge
    ? `<span class="result-loot-badge">${opts.badge}</span>`
    : "";
  return `<li class="result-loot-tile${tone}">
    <span class="result-loot-frame" aria-hidden="true">
      <img class="result-loot-ico" src="${opts.icon}" width="40" height="40" alt="" draggable="false" />
      ${badge}
    </span>
    <strong class="result-loot-amt">${opts.amount}</strong>
    <span class="result-loot-name">${opts.label}</span>
  </li>`;
}

function resultExpTrackRow(track: ExpTrackGain): string {
  const per = Math.max(1, track.expPerLevel);
  const cur = Math.min(per, Math.max(0, track.afterExp));
  const pct = Math.round((cur / per) * 100);
  const leveled = track.levelsGained > 0;
  let icon = "/art/auth/logo-mark-192.png";
  let label = t("ui.resultExpUser");
  if (track.kind === "summoner") {
    const el = track.element ?? save.activeSummoner ?? "light";
    icon = summonerArtSrc(el);
    label = t("ui.resultExpSummoner");
  } else if (track.kind === "monster") {
    icon =
      monsterBattleArtSrc(track.monsterId, "front") ??
      monsterArtSrc(track.monsterId) ??
      "/art/auth/logo-mark-192.png";
    label = track.nameKo || t("ui.resultExpMonster");
  }
  const lvBadge = leveled
    ? `<span class="result-exp-lvup">Lv.${track.beforeLevel}${ARROW_RIGHT}${track.afterLevel}</span>`
    : `<span class="result-exp-lv">Lv.${track.afterLevel}</span>`;
  return `<li class="result-exp-row result-exp-row--${track.kind}${leveled ? " is-levelup" : ""}">
    <span class="result-exp-art" aria-hidden="true">
      <img src="${icon}" width="40" height="40" alt="" draggable="false" />
    </span>
    <div class="result-exp-body">
      <div class="result-exp-top">
        <strong class="result-exp-name">${escapeHtml(label)}</strong>
        ${lvBadge}
        <span class="result-exp-frac">${t("ui.resultExpToNext", { cur, max: per })}</span>
        <strong class="result-exp-delta">+${fmtRes(track.gained)}</strong>
      </div>
      <div class="result-exp-bar" role="progressbar" aria-valuenow="${cur}" aria-valuemin="0" aria-valuemax="${per}">
        <i class="result-exp-bar-fill" style="width:${pct}%"></i>
      </div>
    </div>
  </li>`;
}

function renderResult(): string {
  const stage = currentStage;
  const reward = lastReward;
  if (!stage || !reward) {
    return `<div class="result-wrap result-wrap--enter">
      ${navBackBtn({ nav: "stages", label: t("ui.1a7f31cadb") })}
      ${battleSkyHtml(currentStage)}
      <div class="result-screen is-lose">
        <div class="result-banner result-banner--compact">
          <h2 class="result-title">${t("ui.70088c999d")}</h2>
        </div>
        <div class="result-cta">
          <button type="button" class="auth-btn-primary" data-nav="stages">${t("ui.0f9f095864")}</button>
          <div class="result-cta-row">
            <button type="button" class="secondary auth-btn-ghost" data-nav="home">${t("ui.d8c261904f")}</button>
          </div>
        </div>
      </div>
    </div>`;
  }
  const win = reward.victory;
  const title = win ? t("ui.resultVictory") : t("ui.resultDefeat");
  const stageLine = escapeHtml(stage.nameKo);

  const lootTiles: string[] = [];
  if (win) {
    if (reward.mana > 0) {
      lootTiles.push(
        resultLootTile({
          icon: "/art/ui/res/gold.svg",
          label: t("res.gold"),
          amount: `+${fmtRes(reward.mana)}`,
          tone: "gold",
        }),
      );
    }
    if (reward.crystal) {
      lootTiles.push(
        resultLootTile({
          icon: "/art/ui/res/crystal.svg",
          label: t("res.crystal"),
          amount: `+${fmtRes(reward.crystal)}`,
          tone: "crystal",
        }),
      );
    }
    if (reward.glory) {
      lootTiles.push(
        resultLootTile({
          icon: "/art/ui/res/glory.svg",
          label: t("res.glory"),
          amount: `+${fmtRes(reward.glory)}`,
          tone: "glory",
        }),
      );
    }
    if (reward.jinmun) {
      lootTiles.push(
        resultLootTile({
          icon: "/art/ui/res/jinmun.svg",
          label: t("res.jinmun"),
          amount: `+${fmtRes(reward.jinmun)}`,
          tone: "jinmun",
        }),
      );
    }
    if (reward.contribution) {
      lootTiles.push(
        resultLootTile({
          icon: "/art/ui/res/guild.svg",
          label: t("res.guild"),
          amount: `+${fmtRes(reward.contribution)}`,
          tone: "guild",
        }),
      );
    }
    if (lastScrollGain) {
      lootTiles.push(
        resultLootTile({
          icon: scrollArtSrc("normal"),
          label: t("res.scrollNormal"),
          amount: `+${lastScrollGain}`,
          tone: "scroll",
        }),
      );
    }
    if (lastScrollPremiumGain) {
      lootTiles.push(
        resultLootTile({
          icon: scrollArtSrc("premium"),
          label: t("res.scrollPremium"),
          amount: `+${lastScrollPremiumGain}`,
          tone: "scroll",
        }),
      );
    }
  }

  const tracks = reward.expTracks?.length
    ? reward.expTracks
    : win
      ? ([
          {
            kind: "summoner",
            id: "summoner",
            element: save.activeSummoner ?? "light",
            gained: reward.summonerExp ?? 0,
            beforeLevel: Math.max(
              1,
              save.island.summonerLevel - (reward.levelsGained ?? 0),
            ),
            beforeExp: 0,
            afterLevel: save.island.summonerLevel,
            afterExp: Math.floor(save.island.summonerExp ?? 0),
            expPerLevel: 100,
            levelsGained: reward.levelsGained ?? 0,
          },
        ] satisfies ExpTrackGain[])
      : [];

  const progressSection =
    win && tracks.length
      ? `<section class="result-progress" aria-label="${t("ui.resultExpUser")}">
        <ul class="result-exp-list">${tracks.map(resultExpTrackRow).join("")}</ul>
      </section>`
      : "";

  const lootSection =
    win && lootTiles.length
      ? `<section class="result-loot" aria-label="${t("ui.resultRewards")}">
        <ul class="result-loot-grid">${lootTiles.join("")}</ul>
      </section>`
      : "";

  const dropCards: string[] = [];
  if (reward.gear) {
    dropCards.push(`<article class="result-drop-card result-drop-card--gear">
      <p class="result-section-label">${t("ui.6be738a130")}</p>
      <div class="result-drop-body">
        <span class="result-drop-art" aria-hidden="true">
          <img src="/art/ui/symbol/gear.svg" width="56" height="56" alt="" draggable="false" />
        </span>
        <div class="result-drop-copy">
          <strong>${escapeHtml(describeGear(reward.gear))}</strong>
          <small>${escapeHtml(gearSlotLabel(reward.gear.slot))}</small>
        </div>
      </div>
      <div class="result-drop-acts">
        <button type="button" class="auth-btn-primary" data-nav="enhance">${t("ui.bbef9e1b47")}</button>
      </div>
    </article>`);
  }
  if (reward.symbol) {
    const rarity = symbolQualityMeta(reward.symbol.quality);
    dropCards.push(`<article class="result-drop-card result-drop-card--symbol rarity--${rarity.id}">
      <p class="result-section-label">${t("ui.resultSymbolDrop")}</p>
      <div class="result-drop-body">
        <span class="result-drop-art result-drop-art--sym" aria-hidden="true">
          ${renderSymIco({
            setId: reward.symbol.setId,
            slot: reward.symbol.slot,
            enhance: reward.symbol.enhance,
            rarityId: rarity.id,
            stars: reward.symbol.stars,
            size: "md",
          })}
        </span>
        <div class="result-drop-copy">
          <strong>${escapeHtml(describeSymbol(reward.symbol))}</strong>
          <small>${escapeHtml(rarity.label)}</small>
        </div>
      </div>
      <div class="result-drop-acts${reward.symbol ? " result-drop-acts--split" : ""}">
        <button type="button" class="auth-btn-primary" data-nav="enhance">${t("ui.7533294263")}</button>
        <button type="button" class="secondary auth-btn-ghost" data-nav="shop">${t("ui.9efcf019b7")}</button>
      </div>
    </article>`);
  }
  const dropSection = dropCards.length
    ? `<section class="result-drops">${dropCards.join("")}</section>`
    : "";

  const loseNote = !win
    ? `<p class="result-empty">${escapeHtml(reward.expNote || t("ui.41281baf5a"))}</p>`
    : "";

  return `<div class="result-wrap result-wrap--enter">
    ${navBackBtn({ nav: "stages", label: t("ui.1a7f31cadb") })}
    ${battleSkyHtml(stage)}
    <div class="result-screen ${win ? "is-win" : "is-lose"}">
      <div class="result-banner result-banner--compact">
        <h2 class="result-title">${title}</h2>
        <p class="result-stage">${stageLine}</p>
      </div>
      <div class="result-body">
        ${
          progressSection
            ? `<div class="result-exp-panel">${progressSection}</div>`
            : ""
        }
        ${loseNote}
      </div>
      <div class="result-foot">
        ${lootSection}
        ${dropSection}
        <div class="result-cta">
          <button type="button" class="auth-btn-primary result-cta-primary" id="btn-result-again">${t("ui.03d1f975cb")}</button>
          <div class="result-cta-row">
            <button type="button" class="secondary auth-btn-ghost" data-nav="stages">${t("ui.0f9f095864")}</button>
            ${
              win
                ? `<button type="button" class="secondary auth-btn-ghost" data-nav="party">${t("ui.108f04ca6e")}</button>`
                : ""
            }
            <button type="button" class="secondary auth-btn-ghost" data-nav="home">${t("ui.d8c261904f")}</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function onCellClick(x: number, y: number): void {
  void onCellClickAsync(x, y);
}

/** Module B board/amp feedback after a stone lands at (x,y). */
function pulseShapeBonusesAfterStone(
  x: number,
  y: number,
  color: "black" | "white",
): number {
  if (!battle?.modules.moduleB) return 0;
  const shapes = detectShapeBonuses(battle.board, color, { x, y });
  if (!shapes.length) return 0;
  const shapeMs = fxDurationMs(720, battleSpeed);
  shapeFlashIds = shapes.map((s) => s.id);
  shapeFlashUntil = Date.now() + fxDurationMs(900, battleSpeed);
  for (const sh of shapes) {
    pulseBoardCell(app, x, y, `fx-shape fx-shape--${sh.id}`, shapeMs);
  }
  if (shapes.some((s) => s.id === "star" || s.id === "star_control")) {
    for (const sp of starPoints(battle.board.size)) {
      if (battle.board.at(sp) === color) {
        pulseBoardCell(app, sp.x, sp.y, "fx-shape fx-shape--star", shapeMs);
      }
    }
  }
  if (shapes.some((s) => s.id === "corner")) {
    const last = battle.board.size - 1;
    for (const c of [
      { x: 0, y: 0 },
      { x: 0, y: last },
      { x: last, y: 0 },
      { x: last, y: last },
    ]) {
      if (battle.board.at(c) === color) {
        pulseBoardCell(app, c.x, c.y, "fx-shape fx-shape--corner", shapeMs);
      }
    }
  }
  app.querySelector(".battle-amp-chip")?.classList.add("is-hot");
  window.setTimeout(
    () => app.querySelector(".battle-amp-chip")?.classList.remove("is-hot"),
    shapeMs,
  );
  return shapeMs;
}

function isGrindSuccessMessage(message: string): boolean {
  // Loop messages are Hangul; forgeOkGrind EN is "Grind" and would miss.
  return (
    message.includes("\uC5F0\uB9C8") ||
    message.startsWith(t("ui.forgeOkGrind"))
  );
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
    const shapeMs = pulseShapeBonusesAfterStone(x, y, "black");
    await waitFx(
      Math.max(
        dropMs,
        capBonus > 0 ? fxDurationMs(380, battleSpeed) : 0,
        shapeMs,
      ),
    );
    await resolveCombatUntilAllyInput({ holdBusy: true });
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

/** Monsters with summoner seated in the middle of the line (e.g. M M S M M). */
function battleLine(units: Unit[]): Unit[] {
  const monsters = units.filter((u) => u.kind === "monster");
  const summoner = units.find((u) => u.kind === "summoner");
  if (!summoner) return monsters;
  const mid = Math.floor(monsters.length / 2);
  return [...monsters.slice(0, mid), summoner, ...monsters.slice(mid)];
}

/** Facing across the board: one rim line per side, summoner among summons. */
function renderBattleFront(
  units: Unit[],
  side: "enemy" | "ally",
  opts?: { targetable?: boolean },
): string {
  const line = battleLine(units);
  return `<div class="battle-formation ${side}">
    <div class="battle-front ${side}">${line
      .map((u) => renderUnit(u, opts))
      .join("")}</div>
  </div>`;
}

function afterPlayerAction(): void {
  void resolveCombatUntilAllyInput();
}

/** Auto-pick skill for the active unit (summoner skills preferred when ready). */
function resolveActiveUnitSkillHits(unit: Unit): SkillResult[] {
  if (!battle) return [];
  const magics = battle.summonerOf(unit.team).magicSkills ?? [];
  const full = magics.find(
    (s) => s.manaCostFrac >= 0.95 && battle!.canUseMagicSkill(unit, s.id),
  );
  if (full) return battle.useSkill({ summonerSkill: full.id });
  const any = magics.find((s) => battle!.canUseMagicSkill(unit, s.id));
  if (any) return battle.useSkill({ summonerSkill: any.id });
  if (battle.canUseSummonerSkill(unit))
    return battle.useSkill({ summonerSkill: "open" });
  if (
    battle.canUseSummonerClean(unit) &&
    battle.countEnemyStones(unit.team) >= 4
  )
    return battle.useSkill({ summonerSkill: "clean" });
  if (
    battle.canUseSummonerGuard(unit) &&
    battle.allyMonstersWounded(unit.team, 0.55)
  )
    return battle.useSkill({ summonerSkill: "guard" });
  if (battle.canUseSummonerDeclare(unit))
    return battle.useSkill({ summonerSkill: "declare" });
  if (battle.canUseSummonerDual(unit))
    return battle.useSkill({ summonerSkill: "dual" });
  const targetId = unit.team === "ally" ? ensureTarget() : undefined;
  return battle.useSkill({
    skillIndex: pickAutoSkillIndex(unit, battle.units),
    targetId,
  });
}

/**
 * Drive combat until the player must place a stone (or capture shop / finish).
 * Manual: only ally stone placement is player-driven; attacks resolve with FX.
 * Stones alternate by team (Go-like) — consecutive same-team ATB skips stone.
 */
async function resolveCombatUntilAllyInput(opts?: {
  holdBusy?: boolean;
  autoAlly?: boolean;
}): Promise<void> {
  if (!battle) return;
  const autoAlly = opts?.autoAlly ?? autoMode;
  const ownBusy = !opts?.holdBusy;
  if (ownBusy) {
    if (battleFxBusy) return;
    battleFxBusy = true;
  }
  try {
    for (let guard = 0; battle && !battle.finishReason && guard < 80; guard++) {
      if (
        battle.phase === "idle" ||
        battle.phase === "resolved" ||
        !battle.activeUnitId
      ) {
        const next = battle.tickUntilReady();
        if (!next) break;
        refreshLegal();
        render();
        await waitFx(fxDurationMs(140, battleSpeed));
      }

      const unit = battle.activeUnitId
        ? battle.getUnit(battle.activeUnitId)
        : null;
      if (!unit) break;

      if (unit.team === "ally" && !autoAlly) {
        if (battle.phase === "await_stone") {
          clearBattleSkillSelection();
          selectedTargetId = null;
          refreshLegal();
          render();
          return;
        }
        if (battle.phase === "await_capture_shop") {
          render();
          return;
        }
        if (battle.phase === "await_skill") {
          // Manual: select skill under unit, then tap an enemy.
          clearBattleSkillSelection();
          selectedTargetId = null;
          if (unit.kind === "monster" && battle.canUseSkill(unit, 0)) {
            selectedSkillIndex = 0;
          }
          refreshLegal();
          render();
          return;
        }
      }

      if (battle.phase === "await_stone") {
        if (unit.team === "ally" && autoAlly) {
          const allySum = battle.units.find(
            (u) => u.team === "ally" && u.kind === "summoner" && u.alive,
          );
          const castMs = fxDurationMs(320, battleSpeed);
          if (allySum) {
            pulseUnitClass(app, allySum.id, "fx-cast-place", castMs);
            playSpineClip(allySum.id, "cast");
          }
          await waitFx(castMs);
        }
        const before = battle.board.getBoard().map((row) => [...row]);
        if (!battle.autoStone()) {
          // No legal stone — fall through to skill if phase advanced, else bail.
          if (battle.phase === "await_stone") break;
        } else {
          refreshLegal();
          render();
          // Pulse first changed empty→stone cell if we can find it.
          let placed: { x: number; y: number; color: "black" | "white" } | null =
            null;
          const after = battle.board.getBoard();
          outer: for (let y = 0; y < after.length; y++) {
            for (let x = 0; x < (after[y]?.length ?? 0); x++) {
              if (before[y]?.[x] == null && after[y]?.[x] != null) {
                const color = after[y]![x] as "black" | "white";
                placed = { x, y, color };
                pulseBoardCell(
                  app,
                  x,
                  y,
                  "fx-stone-drop",
                  fxDurationMs(240, battleSpeed),
                );
                break outer;
              }
            }
          }
          const shapeMs = placed
            ? pulseShapeBonusesAfterStone(placed.x, placed.y, placed.color)
            : 0;
          await waitFx(Math.max(fxDurationMs(240, battleSpeed), shapeMs));
        }
      }

      if (battle.phase === "await_capture_shop") {
        if (unit.team === "ally" && !autoAlly) {
          render();
          return;
        }
        battle.chooseCaptureShop(
          (["mana", "amplify", "cleanse"] as CaptureShopChoice[])[
            Math.floor(Math.random() * 3)
          ]!,
        );
      }

      if (battle.phase === "await_skill") {
        const hits = resolveActiveUnitSkillHits(unit);
        if (battle.phase === "await_skill" && !hits.length) {
          // Skill no-op / soft — end the turn so we never spin.
          battle.phase = "resolved";
          battle.activeUnitId = null;
          continue;
        }
        const ult = hits.some((h) => h.usedSummonerSkill);
        await playStrikeFx(hits, { ult });
        refreshLegal();
        render();
        continue;
      }

      // Unexpected phase — stop to avoid spin.
      break;
    }

    if (battle?.finishReason) {
      autoMode = false;
      clearAutoTimer();
      grantRewardIfNeeded();
    }
    refreshLegal();
    render();
    if (autoMode && battle && !battle.finishReason) scheduleAuto();
  } finally {
    if (ownBusy) battleFxBusy = false;
  }
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
    void resolveCombatUntilAllyInput({ autoAlly: true });
  }, 420 / battleSpeed);
}

function autoAllyTurn(): void {
  void resolveCombatUntilAllyInput({ autoAlly: true });
}

function castSkill(
  mode: BattleSummonerSkillId | "ult" | "smart" | number,
  targetId?: string,
): void {
  // Legacy "ult" id maps to open.
  const resolved: BattleSummonerSkillId | "smart" | number =
    mode === "ult" ? "open" : mode;
  void castSkillAsync(resolved, targetId);
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
      spawnUnitVfx(app, caster, "strike-ult", cutMs);
      playSpineClip(caster, "ult");
    }
    const firstTarget = hits[0]?.targetId;
    if (firstTarget) {
      const crit = hits.some((h) => h.crit);
      window.setTimeout(() => {
        pulseUnitClass(app, firstTarget, "fx-hit", fxDurationMs(320, battleSpeed));
        spawnUnitVfx(
          app,
          firstTarget,
          crit ? "hit-crit" : "hit",
          fxDurationMs(360, battleSpeed),
        );
      }, Math.floor(cutMs * 0.45));
    }
    await waitFx(cutMs);
  } else {
    const attackerId = hits[0]!.attackerId;
    const targetId = hits[0]!.targetId;
    const crit = hits.some((h) => h.crit);
    const lungeMs = fxDurationMs(380, battleSpeed);
    pulseUnitClass(app, attackerId, "fx-lunge", lungeMs);
    spawnUnitVfx(app, attackerId, "strike", lungeMs);
    playSpineClip(attackerId, "run", { loop: false });
    window.setTimeout(() => {
      playSpineClip(attackerId, "attack");
      pulseUnitClass(app, targetId, "fx-hit", fxDurationMs(320, battleSpeed));
      spawnUnitVfx(
        app,
        targetId,
        crit ? "hit-crit" : "hit",
        fxDurationMs(360, battleSpeed),
      );
    }, Math.floor(lungeMs * 0.35));
    await waitFx(lungeMs);
  }
  pushDamageFloats(hits);
}

async function castSkillAsync(
  mode: BattleSummonerSkillId | "smart" | number,
  forcedTargetId?: string,
): Promise<void> {
  if (!battle || battle.phase !== "await_skill" || autoMode || battleFxBusy)
    return;
  const unit = battle.activeUnitId
    ? battle.getUnit(battle.activeUnitId)
    : null;
  if (!unit || unit.team !== "ally") return;

  if (forcedTargetId) selectedTargetId = forcedTargetId;

  battleFxBusy = true;
  try {
    const finish = async (hits: SkillResult[], opts?: { ult?: boolean }) => {
      clearBattleSkillSelection();
      selectedTargetId = null;
      if (opts?.ult || hits.some((h) => h.damage !== 0 || h.crit)) {
        await playStrikeFx(hits, opts);
      } else {
        pushDamageFloats(hits);
      }
      await resolveCombatUntilAllyInput({ holdBusy: true });
    };

    if (mode === "open") {
      const magics = battle.summonerOf(unit.team).magicSkills ?? [];
      const full = magics.find(
        (s) =>
          s.manaCostFrac >= 0.95 && battle!.canUseMagicSkill(unit, s.id),
      );
      const targetId = requireSelectedEnemyTarget();
      if (!targetId) {
        flash(t("ui.battlePickEnemy"));
        render();
        return;
      }
      if (full) {
        const hits = battle.useSkill({
          summonerSkill: full.id,
          targetId,
        });
        await finish(hits, { ult: true });
        return;
      }
      if (!battle.canUseSummonerSkill(unit)) {
        flash(t("ui.711b4aaddc"));
        render();
        return;
      }
      const hits = battle.useSkill({ summonerSkill: "open", targetId });
      await finish(hits, { ult: true });
      return;
    }
    if (mode === "declare") {
      if (!battle.canUseSummonerDeclare(unit)) {
        flash(t("ui.9af91c9bed"));
        render();
        return;
      }
      await finish(battle.useSkill({ summonerSkill: "declare" }));
      return;
    }
    if (mode === "dual") {
      if (!battle.canUseSummonerDual(unit)) {
        flash(t("ui.b0b1120abf"));
        render();
        return;
      }
      await finish(battle.useSkill({ summonerSkill: "dual" }));
      return;
    }
    if (mode === "clean") {
      if (!battle.canUseSummonerClean(unit)) {
        flash(t("ui.c85840dca0"));
        render();
        return;
      }
      await finish(battle.useSkill({ summonerSkill: "clean" }));
      return;
    }
    if (mode === "guard") {
      if (!battle.canUseSummonerGuard(unit)) {
        flash(t("ui.9cf3c0b981"));
        render();
        return;
      }
      await finish(battle.useSkill({ summonerSkill: "guard" }));
      return;
    }

    // "smart" only for auto/AI — manual uses explicit index + target.
    const skillIndex =
      mode === "smart" ? pickAutoSkillIndex(unit, battle.units) : mode;
    if (typeof skillIndex !== "number") return;
    if (!battle.canUseSkill(unit, skillIndex)) {
      flash(t("ui.73743ba945"));
      render();
      return;
    }
    const targetId =
      mode === "smart"
        ? ensureTarget()
        : requireSelectedEnemyTarget();
    if (!targetId) {
      flash(t("ui.battlePickEnemy"));
      render();
      return;
    }
    const hits = battle.useSkill({ skillIndex, targetId });
    if (!hits.length) {
      flash(t("ui.b72f5a4752"));
      render();
      return;
    }
    await finish(hits);
  } finally {
    battleFxBusy = false;
  }
}

function renderSkillButtons(active: Unit | null, awaitSkill: boolean): string {
  const skills = active?.skills ?? [];
  const cds = active?.skillCd ?? [];
  const monId = active?.kind === "monster" ? active.monsterId : null;
  const slots = [0, 1, 2].map((i) => {
    const sk = skills[i];
    const cd = cds[i] ?? 0;
    const label = sk ? sk.nameKo : i === 0 ? t("ui.8a1893a931") : `S${i + 1}`;
    const disabled = !awaitSkill || (sk ? cd > 0 : i > 0);
    const selected =
      awaitSkill && !disabled && selectedSkillIndex === i ? " is-selected" : "";
    const state = cd > 0 ? " cooling" : awaitSkill && !disabled ? " ready" : "";
    const ico =
      monId != null
        ? monsterSkillArtImg(monId, i, sk, "skill-btn-ico", 40)
        : `<img class="skill-btn-ico" src="${monsterSkillArtSrc(null, -1, sk)}" width="40" height="40" alt="" draggable="false" decoding="async" />`;
    return `<button type="button" class="skill-btn${state}${selected}" data-skill="${i}" ${disabled ? "disabled" : ""}>
      ${ico}
      <span class="skill-btn-label">${label}</span>
      ${cd > 0 ? `<span class="skill-btn-cd">${cd}</span>` : ""}
    </button>`;
  });
  return slots.join("");
}

function renderSummonerSkillButtons(
  active: Unit,
  awaitSkill: boolean,
): string {
  if (!battle || !awaitSkill || active.kind !== "summoner") return "";
  const items: {
    id: BattleSummonerSkillId;
    ready: boolean;
    label: string;
    art: string;
  }[] = [
    {
      id: "open",
      ready: battle.canUseSummonerSkill(active),
      label: t("ui.2d99fde255"),
      art: "open",
    },
    {
      id: "declare",
      ready: battle.canUseSummonerDeclare(active),
      label: t("ui.bd1967124e"),
      art: "declare",
    },
    {
      id: "dual",
      ready: battle.canUseSummonerDual(active),
      label: t("ui.1fa6111a65"),
      art: "dual",
    },
    {
      id: "clean",
      ready: battle.canUseSummonerClean(active),
      label: t("ui.ac2f6c7ca5"),
      art: "clean",
    },
    {
      id: "guard",
      ready: battle.canUseSummonerGuard(active),
      label: t("ui.0be109c051"),
      art: "guard",
    },
  ];
  return items
    .map((it) => {
      const selected =
        selectedSummonerSkill === it.id ? " is-selected" : "";
      const state = it.ready ? " ready" : "";
      return `<button type="button" class="summoner-sk skill-btn ${it.id}${state}${selected}" data-summoner-skill="${it.id}" ${it.ready ? "" : "disabled"}>
        ${summonerSkillArtImg(it.art, "skill-btn-ico", 40)}
        <span class="skill-btn-label">${it.label}</span>
      </button>`;
    })
    .join("");
}

function renderActiveUnitSkills(u: Unit): string {
  if (!battle || autoMode) return "";
  if (battle.phase !== "await_skill" || battle.activeUnitId !== u.id)
    return "";
  if (u.team !== "ally" || !u.alive) return "";
  const body =
    u.kind === "summoner"
      ? renderSummonerSkillButtons(u, true)
      : renderSkillButtons(u, true);
  if (!body) return "";
  return `<div class="battle-unit-skills" role="toolbar" aria-label="${escapeHtml(t("ui.battleUnitSkills"))}">${body}</div>`;
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
  const artSize = isSummoner ? 128 : 168;
  const facing: "front" | "back" = u.team === "ally" ? "back" : "front";
  const art =
    u.kind === "monster"
      ? monsterBattleArtImg(u.monsterId, "battle-unit-img", artSize, facing) ||
        monsterArtImg(u.monsterId, "battle-unit-img", artSize)
      : summonerBattleArtImg(u.element, "battle-unit-img", artSize, facing);
  const showName = isActive || isTargeted;
  const spineId =
    u.kind === "monster"
      ? u.monsterId ?? ""
      : `summoner-${u.element}`;

  let barsHtml = "";
  if (isSummoner && battle) {
    const manaState =
      u.team === "ally" ? battle.allySummoner : battle.enemySummoner;
    const manaPctUnit = Math.max(
      0,
      Math.min(
        100,
        Math.round((manaState.mana / Math.max(1, manaState.manaMax)) * 100),
      ),
    );
    barsHtml = `<div class="battle-unit-bars battle-unit-bars--mana">
      <div class="battle-unit-mana-row">
        <span class="battle-unit-mana-num">${Math.floor(manaState.mana)}<small>/${manaState.manaMax}</small></span>
      </div>
      <div class="bar mana"><i style="width:${manaPctUnit}%"></i></div>
      <div class="bar atb"><i style="width:${atbPct}%"></i></div>
    </div>`;
  } else {
    barsHtml = `<div class="battle-unit-bars">
      <div class="battle-unit-hp-row">
        <span class="battle-unit-hp-num">${Math.max(0, Math.round(u.hp))}</span>
      ${shield ? `<span class="shield-badge" title="${t("ui.e234157c2f")}">+${shield}</span>` : ""}
      </div>
      <div class="bar hp"><i style="width:${hpPct}%"></i></div>
      <div class="bar atb"><i style="width:${atbPct}%"></i></div>
    </div>`;
  }

  return `<${tag} class="battle-unit${isSummoner ? " battle-unit--summoner" : ""} el-${u.element}${active}${targeted}${dead}${shield ? " has-shield" : ""}" data-unit="${u.id}" data-spine-id="${spineId}" ${attrs} title="${u.name}">
    ${barsHtml}
    ${isActive ? `<span class="battle-unit-turn" aria-hidden="true"></span>` : ""}
    <span class="battle-unit-glow" aria-hidden="true"></span>
    <span class="battle-unit-art" aria-hidden="true">${art}</span>
    ${showName ? `<span class="battle-unit-name">${u.name}</span>` : ""}
    ${renderActiveUnitSkills(u)}
  </${tag}>`;
}


function renderBoard(): string {
  if (!battle) return "";
  const size = battle.board.size;
  const grid = battle.board.getBoard();
  const legalSet = new Set(legalHints.map((p) => `${p.x},${p.y}`));
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

  const allySummonerUnit = battle.units.find(
    (u) => u.team === "ally" && u.kind === "summoner",
  );
  const enemySummonerUnit = battle.units.find(
    (u) => u.team === "enemy" && u.kind === "summoner",
  );
  const allyStoneEl =
    battle.allySummoner.summonerElement ?? allySummonerUnit?.element;
  const enemyStoneEl =
    battle.enemySummoner.summonerElement ?? enemySummonerUnit?.element;

  let cells = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const key = `${x},${y}`;
      const stone = grid[y]![x];
      const legal = legalSet.has(key);
      const token = battle.tokenAt(x, y);
      const tokenClass = token ? ` token token-${token.id}` : "";
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
      const placeable = canClick && legal && !stone && !forbid;
      const stoneHtml = stone
        ? (() => {
            const team = stone === "black" ? "ally" : "enemy";
            const el =
              team === "ally" ? allyStoneEl : enemyStoneEl;
            const stoneId = normalizeBattleStoneId(el);
            const src = battleStoneSrc(stoneId);
            const elClass = stoneId === "enemy" ? "el-enemy" : `el-${stoneId}`;
            return `<span class="stone magic-stone ${stone} ${elClass} has-art" aria-hidden="true"><img class="magic-stone-img" src="${src}" width="64" height="64" alt="" draggable="false" decoding="async" onerror="this.closest('.magic-stone')?.classList.add('art-failed');this.remove()"/><i class="magic-stone-core"></i><i class="magic-stone-flare"></i></span>`;
          })()
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
                  : `<span class="node-mark" aria-hidden="true"></span>`;
      cells += `<button type="button" class="cell magic-node${placeable ? " legal is-placeable" : ""}${tokenClass}${forbidClass}${baitClass}${starClass}${victoryClass}${stone ? ` has-stone stone-${stone}` : ""}" data-x="${x}" data-y="${y}" ${placeable ? "" : "disabled"}>${stoneHtml}</button>`;
    }
  }
  const resetPct = Math.min(
    100,
    Math.round(
      (battle.circle.stoneSummonCount / Math.max(1, battle.circle.resetThreshold)) *
        100,
    ),
  );
  const circleId = battleCircleIdForStage(currentStage);
  const circleSrc = battleCircleSrc(circleId);
  return `<div class="board-frame board-frame--tilted board-frame--circle board-frame--has-art phase-${Math.min(phase, 3)}${showRekindle ? " is-rekindling" : ""}${battle.openingBonusPending ? " has-opening" : ""}${canClick ? " is-placeable" : ""}" data-element="${battle.circleElement ?? ""}" data-circle="${circleId}">
    <img class="board-circle-art" src="${circleSrc}" width="512" height="512" alt="" draggable="false" decoding="async" aria-hidden="true" onerror="this.remove();this.parentElement?.classList.remove('board-frame--has-art')"/>
    <div class="board-circle-aura" aria-hidden="true"></div>
    <div class="board-circle-ring" aria-hidden="true"></div>
    <div class="board-phase-tag">${rebuildTag}${openingHint}</div>
    <div class="board-phase-meter" aria-hidden="true"><i style="width:${resetPct}%"></i></div>
    <div class="board-stage">
      <div class="board-hit" aria-hidden="false">
        <div class="board magic-circle size-${size} phase-${Math.min(phase, 3)}" style="grid-template-columns:repeat(${size},minmax(0,1fr))">${cells}</div>
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
  return "";
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
      <a class="auth-footer-link" href="#terms" data-auth-legal="terms">${escapeHtml(t("auth.footer.terms"))}</a>
      ${sep}
      <a class="auth-footer-link" href="#privacy" data-auth-legal="privacy">${escapeHtml(t("auth.footer.privacy"))}</a>
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

function renderAuthLegal(kind: "privacy" | "terms"): string {
  const title =
    kind === "privacy" ? t("auth.footer.privacy") : t("auth.footer.terms");
  const body =
    kind === "privacy"
      ? `<p>${escapeHtml(t("auth.legal.privacyIntro"))}</p>
        <h3>${escapeHtml(t("auth.legal.privacyCollectTitle"))}</h3>
        <ul>
          <li>${escapeHtml(t("auth.legal.privacyCollect1"))}</li>
          <li>${escapeHtml(t("auth.legal.privacyCollect2"))}</li>
          <li>${escapeHtml(t("auth.legal.privacyCollect3"))}</li>
        </ul>
        <h3>${escapeHtml(t("auth.legal.privacyPurposeTitle"))}</h3>
        <ul>
          <li>${escapeHtml(t("auth.legal.privacyPurpose1"))}</li>
          <li>${escapeHtml(t("auth.legal.privacyPurpose2"))}</li>
        </ul>
        <h3>${escapeHtml(t("auth.legal.privacyContactTitle"))}</h3>
        <p>${escapeHtml(t("auth.legal.privacyContactBody"))}</p>
        <p class="auth-legal-ext"><a class="auth-footer-link" href="/privacy.html" target="_blank" rel="noopener">${escapeHtml(t("auth.legal.openFull"))}</a></p>`
      : `<p>${escapeHtml(t("auth.legal.termsIntro"))}</p>
        <h3>${escapeHtml(t("auth.legal.termsServiceTitle"))}</h3>
        <p>${escapeHtml(t("auth.legal.termsServiceBody"))}</p>
        <h3>${escapeHtml(t("auth.legal.termsAccountTitle"))}</h3>
        <p>${escapeHtml(t("auth.legal.termsAccountBody"))}</p>
        <p class="auth-legal-ext"><a class="auth-footer-link" href="/terms.html" target="_blank" rel="noopener">${escapeHtml(t("auth.legal.openFull"))}</a></p>`;
  return `<div class="auth-screen auth-screen--legal">
    <button type="button" class="nav-back" id="auth-back" aria-label="${escapeHtml(t("ui.1a7f31cadb"))}">${ARROW_LEFT}</button>
    ${authBrand()}
    <article class="auth-legal-card" aria-labelledby="auth-legal-title">
      <h2 id="auth-legal-title">${escapeHtml(title)}</h2>
      <div class="auth-legal-body">${body}</div>
    </article>
    ${authFooter()}
  </div>`;
}

function renderAuth(): string {
  const prefs = readAuthPrefs();
  const pane = authUi.pane;
  const loggedIn = !!sessionUser;

  if (pane === "privacy" || pane === "terms") {
    return `${authHeroLayer()}${renderAuthLegal(pane)}`;
  }

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

function isFacilityView(v: View = view): boolean {
  return (
    v === "summon" ||
    v === "pond" ||
    v === "mine" ||
    v === "wish" ||
    v === "glory" ||
    v === "fusion" ||
    v === "party" ||
    v === "dojo"
  );
}

function mainContent(manaPct: number): string {
  switch (view) {
    case "auth":
      return renderAuth();
    case "summon":
      return renderSummon();
    case "enhance":
      return renderEnhance();
    case "summoner":
      return renderSummonerBook();
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

/** Island stays mounted under facility hubs; backdrop blocks spot clicks. */
function renderFacilityLayerHtml(manaPct: number): string {
  return `<div class="facility-layer" id="facility-layer">
    <button type="button" class="facility-backdrop" data-nav="home" aria-label="${escapeHtml(t("ui.d758337556"))}"></button>
    <div class="facility-modal" role="dialog" aria-modal="true">
      ${mainContent(manaPct)}
    </div>
  </div>`;
}

function renderMainArea(manaPct: number): string {
  if (view === "home") return renderHome();
  if (isFacilityView()) {
    return `${renderHome()}
    ${renderFacilityLayerHtml(manaPct)}`;
  }
  return mainContent(manaPct);
}

/** When true, bind() skips island listeners (live island DOM is transplanted after render). */
let preserveIslandDom = false;

/** Open shop/community overlays without a full screen re-render. */
function openShopModalSoft(): void {
  shopOpen = true;
  communityOpen = false;
  missionOpen = false;
  settingsOpen = false;
  mailboxOpen = false;
  notifOpen = false;
  summonerPickerOpen = false;
  resMoreOpen = false;
  buildingInfoId = null;
  setIslandSpotMenu(null);
  closeChatOverlay();
  applyShopOpen();
  applyCommunityOpen();
  applyMissionOpen();
  applySettingsOpen();
  applyMailboxOpen();
  applyNotifOpen();
  applySummonerPickerOpen();
  applyResMoreOpen();
  applyBuildingInfoOpen();
}

function openCommunityModalSoft(): void {
  communityOpen = true;
  shopOpen = false;
  missionOpen = false;
  settingsOpen = false;
  mailboxOpen = false;
  notifOpen = false;
  summonerPickerOpen = false;
  resMoreOpen = false;
  buildingInfoId = null;
  setIslandSpotMenu(null);
  closeChatOverlay();
  applyCommunityOpen();
  applyShopOpen();
  applyMissionOpen();
  applySettingsOpen();
  applyMailboxOpen();
  applyNotifOpen();
  applySummonerPickerOpen();
  applyResMoreOpen();
  applyBuildingInfoOpen();
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

/** Green (+N) / (+N%) suffix for symbol-added combat stats. */
function formatSymbolStatBonusHtml(delta: number, percent: boolean): string {
  if (delta <= 0) return "";
  const body = percent ? `(+${delta}%)` : `(+${delta})`;
  return `<span class="stat-cell-bonus">${body}</span>`;
}

function formatInspectStatValueHtml(
  base: number,
  final: number,
  opts?: { percent?: boolean },
): string {
  const percent = Boolean(opts?.percent);
  const main = percent ? `${final}%` : String(final);
  return `${main}${formatSymbolStatBonusHtml(final - base, percent)}`;
}

function renderInspectCombatStatsHtml(
  preview: NonNullable<ReturnType<typeof previewOwnedCombatStats>>,
): string {
  const { base, final } = preview;
  const cells: Array<{ k: string; v: string }> = [
    { k: t("ui.statHp"), v: formatInspectStatValueHtml(base.hp, final.hp) },
    { k: t("ui.statAtk"), v: formatInspectStatValueHtml(base.atk, final.atk) },
    { k: t("ui.statDef"), v: formatInspectStatValueHtml(base.def, final.def) },
    { k: t("ui.statSpd"), v: formatInspectStatValueHtml(base.spd, final.spd) },
    {
      k: t("ui.statCriRate"),
      v: formatInspectStatValueHtml(base.critRate, final.critRate, {
        percent: true,
      }),
    },
    {
      k: t("ui.statCriDmg"),
      v: formatInspectStatValueHtml(base.critDmg, final.critDmg, {
        percent: true,
      }),
    },
    {
      k: t("ui.statAcc"),
      v: formatInspectStatValueHtml(base.accuracy, final.accuracy, {
        percent: true,
      }),
    },
    {
      k: t("ui.statRes"),
      v: formatInspectStatValueHtml(base.resistance, final.resistance, {
        percent: true,
      }),
    },
  ];
  return `<div class="mon-book-stats mon-inspect-stats mon-inspect-stats--grid2x4" role="list">
            ${cells
              .map(
                (c) =>
                  `<div class="stat-cell" role="listitem"><span class="stat-cell-k">${c.k}</span><span class="stat-cell-v">${c.v}</span></div>`,
              )
              .join("")}
          </div>`;
}

/** Seal-style X close control; triggers the matching backdrop close button. */
function modalCloseX(ariaLabel: string, closeBtnId: string): string {
  return `<button type="button" class="modal-x" data-modal-x-for="${closeBtnId}" aria-label="${escapeHtml(ariaLabel)}"></button>`;
}

/** One-time capture delegate so soft-injected modals (chat, drop-info, …) keep a working X. */
let modalXDelegateBound = false;
function ensureModalXDelegate(): void {
  if (modalXDelegateBound) return;
  modalXDelegateBound = true;
  app.addEventListener(
    "click",
    (ev) => {
      const t = ev.target;
      if (!(t instanceof Element)) return;
      const btn = t.closest<HTMLButtonElement>("[data-modal-x-for]");
      if (!btn || !app.contains(btn)) return;
      ev.preventDefault();
      ev.stopPropagation();
      const id = btn.dataset.modalXFor;
      if (!id) return;
      const closeBtn = app.querySelector<HTMLButtonElement>(`#${CSS.escape(id)}`);
      if (!closeBtn) return;
      // Swallow the trailing trusted click that can land on UI under the modal after it hides.
      const swallow = (e: Event) => {
        if (!e.isTrusted) return;
        e.preventDefault();
        e.stopImmediatePropagation();
      };
      document.addEventListener("click", swallow, true);
      document.addEventListener("pointerup", swallow, true);
      closeBtn.click();
      window.setTimeout(() => {
        document.removeEventListener("click", swallow, true);
        document.removeEventListener("pointerup", swallow, true);
      }, 400);
    },
    true,
  );
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
  const sheet = layer?.querySelector<HTMLElement>(
    ".settings-sheet, .mission-sheet, .community-sheet, .shop-sheet, .stages-region-sheet, .stage-entry-modal, .skill-feed-sheet, .building-info-sheet",
  );
  if (!sheet) return;
  sheet.style.animation = "none";
  void sheet.offsetWidth;
  sheet.style.animation = "";
}

/** Toggle skill-feed modal without a full screen re-render. */
function applySkillFeedOpen(): void {
  const layer = app.querySelector<HTMLElement>("#skill-feed-layer");
  if (!layer) return;
  layer.hidden = !skillFeedModalOpen;
  layer.setAttribute("aria-hidden", skillFeedModalOpen ? "false" : "true");
  if (skillFeedModalOpen) replayModalPop(layer);
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
  const layer = app.querySelector<HTMLElement>("#summoner-picker-layer");
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
  applyMailboxOpen();
  applyNotifOpen();
  applySettingsOpen();
  applySummonerPickerOpen();
  applyMissionOpen();
  applyCommunityOpen();
  applyShopOpen();
  // Inject chat sheet without remounting the island / map.
  app.querySelector("#chat-layer")?.remove();
  app.insertAdjacentHTML("beforeend", renderChatModal());
  applyHomeChatRail();
  bindChatUi();
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
  const railBtn = app.querySelector<HTMLButtonElement>("#btn-home-chat");
  if (railBtn && railBtn.dataset.chatBound !== "1") {
    railBtn.dataset.chatBound = "1";
    railBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openHomeChat();
    });
  }
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
    refreshChatModalSoft();
  });
  app.querySelector("#chat-compose")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const input = app.querySelector<HTMLInputElement>("#chat-input");
    const text = input?.value.trim() ?? "";
    if (!text) return;
    if (!pushChatMessage(chatChannelId, displayNickname(), text)) return;
    if (input) input.value = "";
    chatLineUnread = false;
    refreshChatModalSoft();
    queueMicrotask(() => {
      app.querySelector<HTMLInputElement>("#chat-input")?.focus();
    });
  });
}

function refreshChatModalSoft(): void {
  if (!chatOpen) return;
  app.querySelector("#chat-layer")?.remove();
  app.insertAdjacentHTML("beforeend", renderChatModal());
  applyHomeChatRail();
  bindChatUi();
  queueMicrotask(() => {
    const log = app.querySelector("#chat-log");
    if (log) log.scrollTop = log.scrollHeight;
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




function grindCostLabel(): string {
  return `${MINUS}${t("ui.grindstone")} ${SYMBOL_GRIND_STONE_COST} ${MIDDOT} ${MINUS}${t("ui.dc78e6a251")} ${SYMBOL_GRIND_MANA_COST}`;
}

function canAffordGrind(): boolean {
  return (
    grindstoneCount(save) >= SYMBOL_GRIND_STONE_COST &&
    Math.floor(save.island.mana) >= SYMBOL_GRIND_MANA_COST
  );
}

function missionItemHtml(opts: {
  title: string;
  desc: string;
  cur: number;
  max: number;
  goNav?: string;
  claimId?: string;
  claimed?: boolean;
}): string {
  const done = opts.cur >= opts.max;
  const pct = opts.max > 0 ? Math.min(100, Math.round((opts.cur / opts.max) * 100)) : 0;
  let action = "";
  if (opts.claimId && done && !opts.claimed) {
    action = `<button type="button" class="mission-item-go mission-item-claim" data-mission-claim="${opts.claimId}">${t("mission.claim")}</button>`;
  } else if (opts.claimId && opts.claimed) {
    action = `<span class="mission-item-claimed">${t("mission.claimed")}</span>`;
  } else if (opts.goNav) {
    action = `<button type="button" class="mission-item-go" data-mission-go="${opts.goNav}">${t("mission.go")}</button>`;
  }
  return `<article class="mission-item${done ? " is-done" : ""}${opts.claimed ? " is-claimed" : ""}">
    <div class="mission-item-top">
      <div class="mission-item-copy">
        <strong class="mission-item-title">${opts.title}</strong>
        <p class="mission-item-desc">${opts.desc}</p>
      </div>
      <span class="mission-item-status">${opts.claimed ? t("mission.claimed") : done ? t("mission.done") : t("mission.inProgress")}</span>
    </div>
    <div class="mission-item-bar" role="progressbar" aria-valuenow="${opts.cur}" aria-valuemin="0" aria-valuemax="${opts.max}">
      <i style="width:${pct}%"></i>
    </div>
    <div class="mission-item-foot">
      <span class="mission-item-prog">${t("mission.progress", { cur: Math.min(opts.cur, opts.max), max: opts.max })}</span>
      ${action}
    </div>
  </article>`;
}

function renderMissionDailyList(): string {
  const day = todayKey();
  const wishDone = (save.island.lastWishDay ?? null) === day;
  const wishClaimed = isDailyMissionClaimed(save, DAILY_MISSION_WISH, day);
  const drills = save.dojoDrills ?? 0;
  const dojoCur = drills % 3;
  const dojoProg = dojoCur === 0 && drills > 0 ? 3 : dojoCur;
  const dojoClaimed = isDailyMissionClaimed(save, DAILY_MISSION_DOJO, day);
  const pond = save.island.buildings.find((b) => b.id === "mana_pond");
  const mine = save.island.buildings.find((b) => b.id === "crystal_mine");
  const stored =
    Math.floor(pond?.storedMana ?? 0) + Math.floor(mine?.storedCrystal ?? 0);
  const collectDone = stored <= 0;
  const collectClaimed = isDailyMissionClaimed(save, DAILY_MISSION_COLLECT, day);
  const sortieDone =
    (save.clearedStages?.length ?? 0) > 0 &&
    Math.floor(save.island.energy) < (save.island.energyMax ?? 100);
  const sortieClaimed = isDailyMissionClaimed(save, DAILY_MISSION_SORTIE, day);
  return [
    missionItemHtml({
      title: t("mission.daily.wish.title"),
      desc: t("mission.daily.wish.desc"),
      cur: wishDone ? 1 : 0,
      max: 1,
      goNav: wishDone ? undefined : "wish",
      claimId: DAILY_MISSION_WISH,
      claimed: wishClaimed,
    }),
    missionItemHtml({
      title: t("mission.daily.dojo.title"),
      desc: t("mission.daily.dojo.desc"),
      cur: dojoProg,
      max: 3,
      goNav: dojoProg >= 3 ? undefined : "dojo",
      claimId: DAILY_MISSION_DOJO,
      claimed: dojoClaimed,
    }),
    missionItemHtml({
      title: t("mission.daily.collect.title"),
      desc: t("mission.daily.collect.desc"),
      cur: collectDone ? 1 : 0,
      max: 1,
      goNav: collectDone ? undefined : "home",
      claimId: DAILY_MISSION_COLLECT,
      claimed: collectClaimed,
    }),
    missionItemHtml({
      title: t("mission.daily.sortie.title"),
      desc: t("mission.daily.sortie.desc"),
      cur: sortieDone ? 1 : 0,
      max: 1,
      goNav: sortieDone ? undefined : "stages",
      claimId: DAILY_MISSION_SORTIE,
      claimed: sortieClaimed,
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
  // In-combat soft patch: avoid wiping the whole app (BG reload + fade flash).
  if (view === "battle" && battle && app.querySelector(".battle-screen")) {
    if (refreshBattleView()) return;
  }
  const keepIsland =
    !islandLayoutEdit && (view === "home" || isFacilityView(view))
      ? app.querySelector<HTMLElement>(".home-island")
      : null;
  preserveIslandDom = Boolean(keepIsland);
  try {
    renderScreen();
  } finally {
    preserveIslandDom = false;
  }
  if (keepIsland) {
    const next = app.querySelector<HTMLElement>(".home-island");
    if (next && next !== keepIsland) next.replaceWith(keepIsland);
  }
}

/** Full re-render; island DOM is preserved by render() when staying on the island. */
function renderPreservingIsland(): void {
  render();
}

function renderScreen(): void {
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
  const tabSummoner = view === "summoner";
  const tabMonster = view === "enhance" || view === "fusion" || view === "party";
  const tabMission = missionOpen;
  const tabCommunity = communityOpen;
  const tabShop = shopOpen;
  const demoTag = sessionUser?.kind === "demo" ? `<span class="demo-tag">DEMO</span>` : "";
  const mailPending = unclaimedMailIds(save);
  const mailUnread = mailPending.length;
  const missionClaimable = claimableDailyMissionCount(save);
  const mailItems = mailPending.map((id) => {
    if (id === "welcome_gift") {
      return {
        id,
        title: t("mail.welcomeTitle"),
        body: t("mail.welcomeBody"),
        tag: t("mail.tagEvent"),
        reward: t("mail.rewardGold", { n: 500 }),
      };
    }
    return {
      id,
      title: t("mail.dailyTitle"),
      body: t("mail.dailyBody"),
      tag: t("mail.tagReward"),
      reward: t("mail.rewardEnergy", { n: 20 }),
    };
  });
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
    app.classList.remove("summoner-mode");
    app.innerHTML = `
      <main class="auth-main auth-main--center">${authPwaInstallBtn()}${renderAuth()}${authFooter()}</main>
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
  const onIsland = isHome || isFacilityView();
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
  app.classList.toggle("home-mode", onIsland);
  app.classList.toggle("expedition-mode", isStages);
  app.classList.toggle("stage-prep-open", isStages && !!stageEntryId);
  app.classList.toggle("combat-mode", view === "battle" || view === "result");
  app.classList.toggle("monster-mode", view === "enhance" || view === "summoner");
  app.classList.toggle("summoner-mode", view === "summoner");
  app.innerHTML = `
    <header class="app-bar app-bar--hud${onIsland ? " app-bar--home" : ""}${isStages ? " app-bar--expedition" : ""}">
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
              onIsland
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
                <img class="res-ico" src="/art/ui/res/energy.svg" width="18" height="18" alt="" draggable="false" />
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
            <img class="res-ico" src="/art/ui/res/gold.svg" width="18" height="18" alt="" draggable="false" />
            <strong class="res-val">${fmtRes(island.mana)}</strong>
          </div>
          <div class="res-item res-item--crystal" title="${escapeHtml(t("res.crystal"))}">
            <img class="res-ico" src="/art/ui/res/crystal.svg" width="18" height="18" alt="" draggable="false" />
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
            <div class="res-item res-item--mats" title="${escapeHtml(t("res.skillMats"))}">
              <img class="res-ico" src="/art/ui/res/jinmun.svg" width="16" height="16" alt="" draggable="false" />
              <strong class="res-val">${fmtRes(save.skillMats ?? 0)}</strong>
            </div>
            <div class="res-item res-item--mats" title="${escapeHtml(t("res.awakenMats"))}">
              <img class="res-ico" src="/art/ui/res/crystal.svg" width="16" height="16" alt="" draggable="false" />
              <strong class="res-val">${fmtRes(
                Object.values(save.awakenMats ?? {}).reduce(
                  (a, n) => a + (typeof n === "number" ? n : 0),
                  0,
                ),
              )}</strong>
            </div>
            <div class="res-item res-item--mats" title="${escapeHtml(t("ui.grindstone"))}">
              <img class="res-ico" src="/art/ui/res/jinmun.svg" width="16" height="16" alt="" draggable="false" />
              <strong class="res-val">${fmtRes(grindstoneCount(save))}</strong>
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
      ${onIsland ? "" : renderHomeChatRail()}
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
    <main class="${isFacilityView() ? "has-facility-modal" : ""}">${renderMainArea(manaPct)}</main>
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
      onIsland
        ? `<aside class="side-quick" aria-label="${escapeHtml(t("side.quick"))}">
      <button type="button" class="side-quick-btn${mailboxOpen ? " is-open" : ""}" id="btn-mailbox" aria-expanded="${mailboxOpen ? "true" : "false"}" aria-controls="mailbox-layer" title="${escapeHtml(t("mailbox.title"))}">
        <span class="side-quick-glow" aria-hidden="true"></span>
        <span class="seal-badge seal-badge--side">
          <span class="side-quick-ico" aria-hidden="true">
            <img class="side-quick-img" src="/art/ui/nav/mail.webp" width="52" height="52" alt="" draggable="false" />
          </span>
          <span class="side-quick-caption">${escapeHtml(t("side.mailbox"))}</span>
        </span>
        ${
          mailUnread > 0
            ? `<span class="side-quick-badge" aria-label="${escapeHtml(t("mailbox.badge", { n: mailUnread }))}">${mailUnread}</span>`
            : ""
        }
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
        ${
          mailItems.length === 0
            ? `<p class="settings-account">${escapeHtml(t("mailbox.empty"))}</p>`
            : `<div class="quick-sheet-list">${mailItems
                .map(
                  (m) => `<article class="quick-sheet-item">
          <span class="quick-sheet-tag">${escapeHtml(m.tag)}</span>
          <strong class="quick-sheet-title">${escapeHtml(m.title)}</strong>
          <p class="quick-sheet-body">${escapeHtml(m.body)}</p>
          <p class="quick-sheet-reward">${escapeHtml(m.reward)}</p>
          <button type="button" class="mission-item-go" data-mail-claim="${escapeHtml(m.id)}">${escapeHtml(t("mail.claim"))}</button>
        </article>`,
                )
                .join("")}</div>`
        }
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
    ${renderBuildingInfoModal()}
    <nav class="tabs tabs--overlay" aria-label="${escapeHtml(t("nav.main"))}">
      <button type="button" data-nav="stages" class="${tabBattle ? "active" : ""}"><span class="seal-badge"><span class="tab-ico tab-ico--battle" aria-hidden="true"><img class="tab-ico-img" src="/art/ui/nav/battle.webp" width="58" height="58" alt="" draggable="false" /></span><span class="tab-label">${escapeHtml(t("nav.battle"))}</span></span></button>
      <button type="button" id="btn-nav-summoner" class="${tabSummoner ? "active" : ""}" title="${escapeHtml(t("nav.summoner"))}">
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
      <button type="button" id="btn-mission" class="${missionOpen ? "active" : ""}" aria-expanded="${missionOpen ? "true" : "false"}" aria-controls="mission-layer" title="${escapeHtml(t("nav.mission"))}"><span class="seal-badge"><span class="tab-ico tab-ico--mission" aria-hidden="true"><img class="tab-ico-img" src="/art/ui/nav/mission.webp" width="58" height="58" alt="" draggable="false" /></span><span class="tab-label">${escapeHtml(t("nav.mission"))}</span>${
        missionClaimable > 0
          ? `<span class="tab-badge" aria-label="${escapeHtml(t("mission.badge", { n: missionClaimable }))}">${missionClaimable}</span>`
          : ""
      }</span></button>
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
    const emblemFb = `/art/hub/emblem-${toneKey}.svg`;
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
    const menuOpen = !locked && islandSpotMenuId === id;
    const fabs = locked
      ? ""
      : `<div class="island-spot-fabs" ${menuOpen ? "" : "hidden"} aria-hidden="${menuOpen ? "false" : "true"}">
      <button type="button" class="island-spot-fab island-spot-fab--enter" data-spot-enter="${id}">${escapeHtml(t("ui.islandEnter"))}</button>
      <button type="button" class="island-spot-fab island-spot-fab--info" data-spot-info="${id}">${escapeHtml(t("ui.islandInfo"))}</button>
    </div>`;
    return `<div class="island-spot${tone}${locked ? " is-locked" : ""}${islandLayoutEdit ? " is-layout-edit" : ""}${focus}${menuOpen ? " is-menu-open" : ""}" style="left:${x}%;top:${y}%;--spot-scale:${spotScale};z-index:${spotZ}" data-b="${id}" data-locked="${locked ? "1" : "0"}" ${opts?.unlockLv ? `data-unlock="${opts.unlockLv}"` : ""} role="group" aria-label="${escapeHtml(label)}">
      <button type="button" class="island-spot-hit" data-spot-open="${id}" aria-label="${escapeHtml(label)}">
        <span class="island-spot-art" aria-hidden="true">
          <span class="island-spot-glow"></span>
          <img class="island-spot-img" src="${emblemSrc}" width="512" height="512" alt="" draggable="false" decoding="async" onerror="this.onerror=null;this.src='${emblemFb}'" />
        </span>
        ${locked ? lockSvg : ""}
        <span class="island-spot-name">${displayTitle}</span>
        ${unlock}
        ${bubble}
      </button>
      ${fabs}
    </div>`;
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
    t("ui.hubDojo"),
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
            <span class="dojo-stat-label">${t("ui.dojoNextLabel")}</span>
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
    t("ui.hubPond"),
    `Lv.${lv} ${MIDDOT} ${rate}/hr ${MIDDOT} ${t('ui.1f1712acff')} ${stored}/${cap}`,
    `<div class="hub-panel">
      <div class="pond-panel">
        <p class="pond-panel-title">${t("ui.hubPond")}</p>
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
    t("ui.hubMine"),
    `Lv.${lv} ${MIDDOT} ${rate}/hr ${MIDDOT} ${t('ui.1f1712acff')} ${stored}/${cap}`,
    `<div class="hub-panel">
      <div class="pond-panel mine-panel">
        <p class="pond-panel-title">${t("ui.hubMine")}</p>
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
    t("ui.hubWish"),
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
    t("ui.108f04ca6e"),
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
    const def = getMonster(monsterId);
    const artKey = def?.artKey ?? getMonsterArtKey(monsterId) ?? monsterId;
    return `/art/monster/skill/${artKey}-s${skillIndex + 1}.webp`;
  }
  const kind = skill?.effects?.[0]?.kind;
  if (kind === "heal") return "/art/ui/skill/heal.webp";
  if (kind === "shield") return "/art/ui/skill/shield.webp";
  if (kind === "mana") return "/art/ui/skill/mana.webp";
  return "/art/ui/skill/damage.webp";
}

function monsterSkillArtImg(
  monsterId: string | undefined | null,
  skillIndex: number,
  skill: { effects?: { kind: string }[] } | null | undefined,
  className: string,
  size: number,
): string {
  const src = monsterSkillArtSrc(monsterId, skillIndex, skill);
  const def = monsterId ? getMonster(monsterId) : null;
  const artKey = def?.artKey ?? getMonsterArtKey(monsterId) ?? monsterId;
  const el = def?.element;
  const fallbacks: string[] = [];
  if (artKey && skillIndex >= 0 && skillIndex <= 2) {
    if (el) fallbacks.push(`/art/monster/skill/${artKey}-${el}-s${skillIndex + 1}.svg`);
    fallbacks.push(`/art/monster/skill/${artKey}-s${skillIndex + 1}.svg`);
  } else {
    const kind = skill?.effects?.[0]?.kind;
    if (kind === "heal") fallbacks.push("/art/ui/skill/heal.svg");
    else if (kind === "shield") fallbacks.push("/art/ui/skill/shield.svg");
    else if (kind === "mana") fallbacks.push("/art/ui/skill/mana.svg");
    else fallbacks.push("/art/ui/skill/damage.svg");
  }
  const fb0 = fallbacks[0] ?? "";
  const fb1 = fallbacks[1];
  const onerr = fb0
    ? fb1
      ? ` onerror="this.onerror=function(){this.onerror=null;this.src='${fb1}'};this.src='${fb0}'"`
      : ` onerror="this.onerror=null;this.src='${fb0}'"`
    : "";
  return `<img class="${className}" src="${src}" width="${size}" height="${size}" alt="" draggable="false" decoding="async"${onerr} />`;
}

function summonerSkillArtSrc(skillId: string | undefined | null): string {
  if (!skillId) return "/art/ui/skill/damage.webp";
  return `/art/summoner/skill/${skillId}.webp`;
}

function summonerSkillArtFallbackSrc(skillId: string | undefined | null): string {
  if (!skillId) return "/art/ui/skill/damage.svg";
  return `/art/summoner/skill/${skillId}.svg`;
}

function summonerSkillArtImg(
  skillId: string | undefined | null,
  className: string,
  size: number,
): string {
  const src = summonerSkillArtSrc(skillId);
  const fb = summonerSkillArtFallbackSrc(skillId);
  return `<img class="${className}" src="${src}" width="${size}" height="${size}" alt="" draggable="false" decoding="async" onerror="this.onerror=null;this.src='${fb}'" />`;
}

function monsterSkillDescLines(
  skill: {
    cooldown: number;
    effects: {
      kind: string;
      target?: string;
      coeff?: number;
      amount?: number;
    }[];
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
      const pct = Math.round((e.coeff ?? 0) * 100);
      lines.push(
        e.target === "all_enemies"
          ? t("ui.skillFxDamageAll", { pct })
          : t("ui.skillFxDamageSingle", { pct }),
      );
    } else if (e.kind === "heal") {
      const pct = Math.round((e.coeff ?? 0) * 100);
      lines.push(
        e.target === "self"
          ? t("ui.skillFxHealSelf", { pct })
          : t("ui.skillFxHealAlly", { pct }),
      );
    } else if (e.kind === "shield") {
      lines.push(t("ui.skillFxShield", { pct: Math.round((e.coeff ?? 0) * 100) }));
    } else if (e.kind === "mana") {
      lines.push(t("ui.skillFxMana", { n: e.amount ?? 0 }));
    }
  }
  return lines;
}

/** Localized ability lines for summoner magic at the given enhance rank. */
function magicSkillDescLines(
  sk: SummonerMagicSkillDef,
  rank: number,
): string[] {
  const power = magicSkillPower(sk, rank);
  const pctInt = Math.round(power * 100);
  const turns = sk.turns ?? 1;
  const manaPct = Math.round(sk.manaCostFrac * 100);
  const lines: string[] = [t("ui.magicManaCost", { pct: manaPct })];
  switch (sk.kind) {
    case "aoe_damage":
      lines.push(t("ui.magicFxAoeDamage", { pct: pctInt }));
      break;
    case "single_damage":
      lines.push(t("ui.magicFxSingleDamage", { pct: pctInt }));
      break;
    case "ally_buff_atk":
      lines.push(t("ui.magicFxAllyBuffAtk", { pct: pctInt, turns }));
      break;
    case "ally_buff_spd":
      lines.push(t("ui.magicFxAllyBuffSpd", { pct: pctInt, turns }));
      break;
    case "ally_buff_crit":
      lines.push(t("ui.magicFxAllyBuffCrit", { pct: pctInt, turns }));
      break;
    case "ally_heal":
      lines.push(t("ui.magicFxAllyHeal", { pct: pctInt }));
      break;
    case "ally_shield":
      lines.push(t("ui.magicFxAllyShield", { pct: pctInt }));
      break;
    case "enemy_debuff":
      lines.push(t("ui.magicFxEnemyDebuff", { pct: pctInt, turns }));
      break;
    case "amplify":
      lines.push(t("ui.magicFxAmplify", { pct: pctInt }));
      break;
    case "dual_stone":
      lines.push(t("ui.magicFxDualStone"));
      break;
    case "board_clean":
      lines.push(t("ui.magicFxBoardClean"));
      break;
    case "damage_reduce":
      lines.push(t("ui.magicFxDamageReduce", { pct: pctInt, turns }));
      break;
    default:
      break;
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
  const artKey = getMonsterArtKey(monsterId);
  if (!artKey) return null;
  return `/art/monster/${artKey}.webp`;
}

function summonerBattleArtImg(
  element: string | undefined | null,
  className: string,
  size = 128,
  facing: "front" | "back" = "front",
): string {
  const src =
    getSummonerBattleStillSrc(element, facing) ?? summonerArtSrc(element);
  const fb = summonerArtSrc(element);
  const front = getSummonerBattleStillSrc(element, "front") ?? fb;
  const back = getSummonerBattleStillSrc(element, "back") ?? front;
  const stillAttrs = front
    ? ` data-still-front="${front}" data-still-back="${back || front}"`
    : "";
  const pngFb =
    src.endsWith(".webp") ? src.replace(/\.webp$/i, ".png") : "";
  const onerr = pngFb
    ? ` onerror="this.onerror=null;this.src='${pngFb}';this.onerror=function(){this.onerror=null;this.src='${fb}'};"`
    : src !== fb
      ? ` onerror="this.onerror=null;this.src='${fb}'"`
      : "";
  return `<img class="${className}" src="${src}" width="${size}" height="${size}" alt="" draggable="false" decoding="async"${stillAttrs}${onerr} />`;
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
  const el = getMonster(monsterId ?? "")?.element;
  const tint = el ? ` el-tint-${el}` : "";
  return `<img class="${className}${tint}" src="${src}" width="${size}" height="${size}" alt="" draggable="false" decoding="async" />`;
}

/** Art used in battle / book hero: Spine still when available, else WebP. */
function monsterBattleArtSrc(
  monsterId: string | undefined | null,
  facing: "front" | "back" = "front",
): string | null {
  return getBattleStillSrc(monsterId, facing) ?? monsterArtSrc(monsterId);
}

function monsterBattleArtImg(
  monsterId: string | undefined | null,
  className: string,
  size = 120,
  facing: "front" | "back" = "front",
): string {
  const src = monsterBattleArtSrc(monsterId, facing);
  if (!src) return "";
  const artKey = getMonsterArtKey(monsterId);
  const pngFb =
    artKey && src.endsWith(".webp")
      ? src.replace(/\.webp$/i, ".png")
      : "";
  const front = getBattleStillSrc(monsterId, "front") ?? monsterArtSrc(monsterId) ?? "";
  const back = getBattleStillSrc(monsterId, "back") ?? front;
  const stillAttrs = front
    ? ` data-still-front="${front}" data-still-back="${back || front}"`
    : "";
  const el = getMonster(monsterId ?? "")?.element;
  const tint = el ? ` el-tint-${el}` : "";
  const onerr = pngFb
    ? ` onerror="this.onerror=null;this.src='${pngFb}'"`
    : "";
  return `<img class="${className}${tint}" src="${src}" width="${size}" height="${size}" alt="" draggable="false" decoding="async"${stillAttrs}${onerr} />`;
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
                ${ready1 ? t("ui.6b0ff13ffd") : t("ui.summonNeedScroll")}
              </button>
              <button type="button" class="summon-cast-cta summon-cast-cta--multi" data-summon-kind="${kind}" data-summon-count="${SUMMON_MULTI_COUNT}" ${ready10 ? "" : "disabled"} aria-label="${SCROLL_KIND_LABEL[kind]} ${SUMMON_MULTI_COUNT}${t('ui.be988ce3e3')}">
                ${ready10 ? `${SUMMON_MULTI_COUNT}${TIMES}` : t("ui.summonNeedScroll")}
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
          <img class="summon-rite-circle" src="/art/hub/summon-circle.webp" width="320" height="320" alt="" draggable="false" onerror="this.onerror=null;this.src='/art/hub/summon-circle.svg'" />
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

function symbolArtSrc(setId: string, _slot?: number): string {
  return `/art/ui/symbol/${setId}-mark.webp`;
}

function symbolArtFallbackSrc(setId: string, slot: number): string {
  return `/art/ui/symbol/${setId}-${slot}.svg`;
}

function symbolSetArtSrc(setId: string): string {
  return `/art/ui/symbol/${setId}-mark.webp`;
}

function symbolSetArtFallbackSrc(setId: string): string {
  return `/art/ui/symbol/${setId}.svg`;
}

function symbolArtImg(
  setId: string,
  slot: number,
  className: string,
  size: number,
): string {
  const src = symbolArtSrc(setId, slot);
  const fallback = symbolArtFallbackSrc(setId, slot);
  return `<img class="${className}" src="${src}" width="${size}" height="${size}" alt="" draggable="false" decoding="async" onerror="this.onerror=null;this.src='${fallback}'" />`;
}

function symbolSetArtImg(
  setId: string,
  className: string,
  size: number,
): string {
  const src = symbolSetArtSrc(setId);
  const fallback = symbolSetArtFallbackSrc(setId);
  return `<img class="${className}" src="${src}" width="${size}" height="${size}" alt="" draggable="false" decoding="async" onerror="this.onerror=null;this.src='${fallback}'" />`;
}

function symbolEmptySlotArtSrc(slot: number): string {
  return `/art/ui/symbol/empty-${slot}.webp`;
}

function symbolEmptySlotArtFallbackSrc(slot: number): string {
  return `/art/ui/symbol/empty-${slot}.svg`;
}

function symbolCircleFrameSrc(): string {
  return `/art/ui/symbol/circle-frame.svg`;
}

function symbolPlateSrc(rarityId: string, slot: number): string {
  return `/art/ui/symbol/plate-${rarityId}-${slot}.webp`;
}

function symbolPlateFallbackSrc(rarityId: string, slot: number): string {
  return `/art/ui/symbol/plate-${rarityId}-${slot}.svg`;
}

function symbolPlateImg(rarityId: string, slot: number, className: string, size = 72): string {
  const src = symbolPlateSrc(rarityId, slot);
  const fb = symbolPlateFallbackSrc(rarityId, slot);
  return `<img class="${className}" src="${src}" width="${size}" height="${size}" alt="" aria-hidden="true" draggable="false" onerror="this.onerror=null;this.src='${fb}'" />`;
}

function symbolEmptySlotImg(slot: number, className: string, size = 72): string {
  const src = symbolEmptySlotArtSrc(slot);
  const fb = symbolEmptySlotArtFallbackSrc(slot);
  return `<img class="${className}" src="${src}" width="${size}" height="${size}" alt="" draggable="false" onerror="this.onerror=null;this.src='${fb}'" />`;
}

const SYMBOL_SET_ACCENTS: Record<string, string> = {
  hwalro: "#6cbc7a",
  yongmaeng: "#e07040",
  mussang: "#d0b070",
  haengma: "#4aa0d0",
  jipjung: "#9a70d0",
  gunhim: "#c9a227",
  yeongyeol: "#70b8a0",
  bogang: "#8ec8f0",
  hwangyeok: "#e09050",
  ssangnip: "#e8e0c8",
  eungjing: "#c05040",
  tagae: "#a03050",
  pamyeol: "#5a4068",
  myosu: "#6060a8",
  gyeongno: "#e05030",
  chimtu: "#c04070",
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
  stars?: number;
  size?: "sm" | "md" | "lg";
}): string {
  const size = opts.size ?? "md";
  const starsBadge =
    opts.stars != null
      ? `<span class="sym-ico-stars">${STAR}${opts.stars}</span>`
      : "";
  return `<span class="sym-ico sym-ico--${size} rarity--${opts.rarityId}">
    ${symbolPlateImg(opts.rarityId, opts.slot, "sym-ico-plate", 72)}
    ${symbolArtImg(opts.setId, opts.slot, "sym-ico-art", 64)}
    ${starsBadge}
    <span class="sym-ico-plus">${opts.enhance}</span>
  </span>`;
}

function symbolQualityMeta(quality: string | undefined): { id: string; label: string } {
  const q = quality ?? "legend";
  switch (q) {
    case "normal":
      return { id: qualityToPlateId("normal"), label: t("ui.rarityNormal") };
    case "advanced":
    case "magic": // legacy
      return { id: qualityToPlateId("advanced"), label: t("ui.rarityAdvanced") };
    case "rare":
      return { id: qualityToPlateId("rare"), label: t("ui.rarityRare") };
    case "epic":
    case "hero": // legacy
      return { id: qualityToPlateId("epic"), label: t("ui.rarityEpic") };
    case "legend":
    default:
      return { id: qualityToPlateId("legend"), label: t("ui.rarityLegendary") };
  }
}

/** Inventory backplate grade: gray → green → blue → purple → red. */
type InvGradeId = "gray" | "green" | "blue" | "purple" | "red";

function invGradeFromStars(stars: number): InvGradeId {
  const n = Math.max(1, Math.min(5, Math.floor(stars) || 1));
  return (["gray", "green", "blue", "purple", "red"] as const)[n - 1]!;
}

function invGradeFromRarityId(rarityId: string): InvGradeId {
  switch (rarityId) {
    case "normal":
      return "gray";
    case "magic":
      return "green";
    case "rare":
      return "blue";
    case "epic":
      return "purple";
    case "legendary":
    case "mythic":
      return "red";
    default:
      return "gray";
  }
}

function invGradePlateSrc(grade: InvGradeId): string {
  return `/art/ui/inv-grade/${grade}.webp`;
}

function invGradePlateFallbackSrc(grade: InvGradeId): string {
  return `/art/ui/inv-grade/${grade}.svg`;
}

function invGradePlateImg(grade: InvGradeId, className: string, size = 112): string {
  const src = invGradePlateSrc(grade);
  const fb = invGradePlateFallbackSrc(grade);
  return `<img class="${className}" src="${src}" width="${size}" height="${size}" alt="" aria-hidden="true" draggable="false" onerror="this.onerror=null;this.src='${fb}'" />`;
}

/** Same-species fodder only (excludes the skill-up target). */
function skillFeedFodderList(targetUid: string | null): typeof save.roster {
  if (!targetUid) return [];
  const target = save.roster.find((m) => m.uid === targetUid);
  if (!target) return [];
  return sortRosterForSlots(save.roster, rosterSortMode).filter(
    (x) => x.monsterId === target.monsterId && x.uid !== target.uid,
  );
}

function skillFeedEnhanceCost(targetUid: string | null): number {
  const target = targetUid
    ? save.roster.find((m) => m.uid === targetUid)
    : null;
  return target ? enhanceManaCost(target.level) : 0;
}

function skillFeedConfirmBtnHtml(targetUid: string | null): string {
  const cost = skillFeedEnhanceCost(targetUid);
  const selected =
    !!skillFeedFodderUid &&
    skillFeedFodderList(targetUid).some((m) => m.uid === skillFeedFodderUid);
  const haveMats = save.skillMats ?? 0;
  const canPay =
    Math.floor(save.island.mana) >= cost && haveMats >= SKILL_UP_MAT_COST;
  const disabled = !selected || !canPay || cost <= 0;
  return `<button type="button" class="auth-btn-primary mon-book-enh mon-book-enh--cost skill-feed-confirm" id="btn-skill-feed-confirm" ${disabled ? "disabled" : ""}>
    <span class="mon-enh-label">${escapeHtml(t("ui.3e1a337d93"))}</span>
    <span class="mon-enh-cost"><img class="res-ico mon-enh-cost-ico" src="/art/ui/res/gold.svg" width="14" height="14" alt="" draggable="false" /><strong>${fmtRes(cost)}</strong><span class="muted"> · ${escapeHtml(t("res.skillMats"))} ${haveMats}/${SKILL_UP_MAT_COST}</span></span>
  </button>`;
}

function skillFeedSlotsHtml(targetUid: string | null): string {
  const fodderList = skillFeedFodderList(targetUid);
  const slots = Array.from(
    { length: ROSTER_SLOT_CAP },
    (_, i) => fodderList[i] ?? null,
  );
  return slots
    .map((m) => {
      if (!m || !targetUid) {
        return `<div class="mon-slot mon-slot--portrait mon-slot--empty" role="presentation" aria-hidden="true">
        <span class="mon-slot-art">
          <img class="mon-slot-img mon-slot-img--empty" src="/art/ui/mon-slot-empty.svg" width="56" height="56" alt="" draggable="false" />
        </span>
      </div>`;
      }
      const def = getMonster(m.monsterId);
      const el = def?.element ?? "dark";
      const inParty = save.party.includes(m.uid);
      const on = skillFeedFodderUid === m.uid;
      const starN = Math.max(1, def?.naturalStars ?? 1);
      const grade = invGradeFromStars(starN);
      const starsHtml = monStarsHtml(starN);
      const art =
        monsterArtImg(m.monsterId, "mon-slot-img", 56) ||
        (def?.element?.[0]?.toUpperCase() ?? "?");
      const title = inParty
        ? `${describeOwned(m)} · ${t("ui.7b191a9f9f")}`
        : describeOwned(m);
      return `<button type="button" class="mon-slot mon-slot--portrait inv-grade--${grade} el-${el}${inParty ? " is-party" : ""}${on ? " is-on" : ""}" data-skill-feed-fodder="${m.uid}" role="option" aria-selected="${on}" title="${escapeHtml(title)}">
        ${invGradePlateImg(grade, "mon-slot-grade-plate", 112)}
        <span class="mon-slot-art" aria-hidden="true">${art}</span>
        <span class="mon-slot-stars-overlay" aria-label="${starN}">${starsHtml}</span>
        <span class="mon-slot-lv-overlay">Lv.${m.level}</span>
      </button>`;
    })
    .join("");
}

function refreshSkillFeedModalDom(): void {
  const inv = app.querySelector<HTMLElement>("#skill-feed-inv");
  const empty = app.querySelector<HTMLElement>("#skill-feed-empty");
  const foot = app.querySelector<HTMLElement>("#skill-feed-foot");
  if (inv) {
    inv.innerHTML = skillFeedSlotsHtml(selectedEnhanceUid);
    dematteArtInTree(inv, "img.mon-slot-img");
  }
  if (empty) {
    const hasFodder = skillFeedFodderList(selectedEnhanceUid).length > 0;
    empty.hidden = hasFodder;
  }
  if (foot) {
    foot.innerHTML = skillFeedConfirmBtnHtml(selectedEnhanceUid);
  }
}

function renderSkillFeedModal(): string {
  const fodderCount = skillFeedFodderList(selectedEnhanceUid).length;
  return `<div class="settings-layer skill-feed-layer" id="skill-feed-layer" ${skillFeedModalOpen ? "" : "hidden"} aria-hidden="${skillFeedModalOpen ? "false" : "true"}">
    <button type="button" class="settings-backdrop" id="btn-skill-feed-close" aria-label="${escapeHtml(t("ui.skillFeedClose"))}"></button>
    <div class="settings-sheet skill-feed-sheet" role="dialog" aria-modal="true" aria-labelledby="skill-feed-title">
      <div class="settings-sheet-handle" aria-hidden="true"></div>
      ${modalCloseX(t("ui.skillFeedClose"), "btn-skill-feed-close")}
      <h2 class="settings-title" id="skill-feed-title">${escapeHtml(t("ui.skillFeedTitle"))}</h2>
      <p class="skill-feed-hint muted">${escapeHtml(t("ui.skillEnhanceHint"))}</p>
      <div class="mon-book-inv mon-book-inv--rail skill-feed-inv" id="skill-feed-inv" role="listbox" aria-label="${escapeHtml(t("ui.skillFeedTitle"))}">
        ${skillFeedSlotsHtml(selectedEnhanceUid)}
      </div>
      <p class="skill-feed-empty muted" id="skill-feed-empty"${fodderCount > 0 ? " hidden" : ""}>${escapeHtml(t("ui.skillFeedEmpty"))}</p>
      <div class="skill-feed-foot" id="skill-feed-foot">${skillFeedConfirmBtnHtml(selectedEnhanceUid)}</div>
    </div>
  </div>`;
}

function findSymbolIndexById(id: string): number {
  return save.symbols.findIndex((x) => x.id === id);
}

function rematchSymbolModalIndices(
  detailId: string | null,
  compareId: string | null,
): void {
  symbolDetailIndex = detailId ? findSymbolIndexById(detailId) : null;
  if (symbolDetailIndex != null && symbolDetailIndex < 0) symbolDetailIndex = null;
  symbolCompareIndex = compareId ? findSymbolIndexById(compareId) : null;
  if (symbolCompareIndex != null && symbolCompareIndex < 0) symbolCompareIndex = null;
  if (
    symbolDetailIndex != null &&
    symbolCompareIndex != null &&
    symbolDetailIndex === symbolCompareIndex
  ) {
    symbolCompareIndex = null;
  }
}

function symbolStatLabel(stat: string): string {
  switch (stat) {
    case "ATK+":
    case "ATK%":
      return t("ui.statAtk");
    case "HP+":
    case "HP%":
      return t("ui.statHp");
    case "DEF+":
    case "DEF%":
      return t("ui.statDef");
    case "SPD+":
      return t("ui.statSpd");
    case "CRI Rate%":
      return t("ui.statCriRate");
    case "CRI Dmg%":
      return t("ui.statCriDmg");
    case "ACC%":
      return t("ui.statAcc");
    case "RES%":
      return t("ui.statRes");
    default:
      return stat;
  }
}

function formatSymbolStatLine(stat: string, value: number): string {
  const pct = stat.includes("%");
  const n = Math.round(value);
  return `${symbolStatLabel(stat)} +${n}${pct ? "%" : ""}`;
}

type SymDetailRole = "single" | "equipped" | "candidate";

function renderSymbolDetailSheet(index: number, role: SymDetailRole): string {
  const sym = save.symbols[index];
  if (!sym) return "";
  const set = SYMBOL_SETS.find((x) => x.id === sym.setId);
  const rarity = symbolQualityMeta(sym.quality);
  const wornUid =
    save.roster.find((m) => (m.symbolSlots ?? []).includes(sym.id))?.uid ?? null;
  const mainLine = formatSymbolStatLine(sym.mainStat, sym.mainValue);
  /** Always reserve 4 substat rows (max innate rolls). */
  const subs: string[] = (sym.substats ?? []).map((sub) =>
    formatSymbolStatLine(sub.stat, sub.value),
  );
  while (subs.length < 4) subs.push("");
  const subHtml = subs
    .slice(0, 4)
    .map((line) =>
      line
        ? `<p class="sym-detail-sub">${escapeHtml(line)}</p>`
        : `<p class="sym-detail-sub is-empty">${EM_DASH}</p>`,
    )
    .join("");
  const setLine = set
    ? `<span class="sym-detail-set-ico"><img src="${symbolSetArtSrc(set.id)}" width="20" height="20" alt="" draggable="false" onerror="this.onerror=null;this.src='${symbolSetArtFallbackSrc(set.id)}'" /></span><span class="sym-detail-set-text">${escapeHtml(t("ui.setPiecesN", { n: set.pieces }))} ${escapeHtml(set.effectKo)}</span>`
    : "";
  const imprintable = canImprintSymbol(sym);
  const grindable = canGrindSymbol(sym) && canAffordGrind();
  const maxed = sym.enhance >= MAX_SYMBOL_ENHANCE;
  const title = `${set?.nameKo ?? sym.setId} (${t("ui.slotN", { n: sym.slot })}) - ${rarity.label}`;
  const badge =
    role === "equipped"
      ? `<span class="sym-detail-badge">${escapeHtml(t("ui.symCompareEquipped"))}</span>`
      : role === "candidate"
        ? `<span class="sym-detail-badge sym-detail-badge--pick">${escapeHtml(t("ui.symCompareSelected"))}</span>`
        : "";
  const thirdBtn =
    role === "equipped"
      ? `<button type="button" class="sym-detail-act" data-sym-detail-unequip data-sym-idx="${index}">${t("ui.unequip")}</button>`
      : role === "candidate"
        ? `<button type="button" class="sym-detail-act" data-sym-detail-equip data-sym-idx="${index}">${t("ui.818a75cd98")}</button>`
        : wornUid
          ? `<button type="button" class="sym-detail-act" data-sym-detail-unequip data-sym-idx="${index}">${t("ui.unequip")}</button>`
          : `<button type="button" class="sym-detail-act" data-sym-detail-equip data-sym-idx="${index}">${t("ui.818a75cd98")}</button>`;
  const closeX =
    role === "single" ? modalCloseX("close", "btn-sym-detail-close") : "";
  const prefixHtml =
    sym.prefixStat && sym.prefixValue
      ? `<p class="sym-detail-prefix">${escapeHtml(
          t("ui.symPrefixLabel", {
            line: formatSymbolStatLine(sym.prefixStat, sym.prefixValue),
          }),
        )}</p>`
      : "";
  return `<div class="sym-detail-sheet rarity--${rarity.id}" data-sym-sheet="${role}" role="${role === "single" ? "dialog" : "group"}"${role === "single" ? ' aria-modal="true" aria-labelledby="sym-detail-title"' : ""}>
      ${closeX}
      ${badge}
      <h3 class="sym-detail-title"${role === "single" ? ' id="sym-detail-title"' : ""}>${escapeHtml(title)}</h3>
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
              <p class="sym-detail-main">${escapeHtml(mainLine)}</p>
              ${prefixHtml}
            </div>
          </div>
          <div class="sym-detail-subs" aria-label="substats">${subHtml}</div>
        </div>
        <div class="sym-detail-right">
          <p class="sym-detail-set">${setLine}</p>
          <button type="button" class="sym-detail-act" data-sym-detail-grind data-sym-idx="${index}" ${grindable ? "" : "disabled"}>${t("ui.c14c1b1bc6")}</button>
          <button type="button" class="sym-detail-act" data-sym-detail-imprint data-sym-idx="${index}" ${imprintable ? "" : "disabled"}>${t("ui.8b41b055f7")}</button>
          <button type="button" class="sym-detail-act" data-sym-detail-enhance data-sym-idx="${index}" ${maxed ? "disabled" : ""}>${t("ui.3e1a337d93")}</button>
          ${thirdBtn}
        </div>
      </div>
    </div>`;
}

function renderSymbolDetailModal(): string {
  if (symbolDetailIndex == null) return "";
  if (!save.symbols[symbolDetailIndex]) return "";
  const comparing =
    symbolCompareIndex != null &&
    symbolCompareIndex !== symbolDetailIndex &&
    !!save.symbols[symbolCompareIndex];

  if (comparing) {
    return `<div class="settings-layer sym-detail-layer sym-detail-layer--compare" id="sym-detail-layer" aria-hidden="false">
    <button type="button" class="settings-backdrop" id="btn-sym-detail-close" aria-label="close"></button>
    <div class="sym-detail-compare" role="dialog" aria-modal="true" aria-label="${escapeHtml(t("ui.60fbf51b13"))}">
      ${modalCloseX("close", "btn-sym-detail-close")}
      ${renderSymbolDetailSheet(symbolCompareIndex!, "equipped")}
      ${renderSymbolDetailSheet(symbolDetailIndex, "candidate")}
    </div>
  </div>`;
  }

  return `<div class="settings-layer sym-detail-layer" id="sym-detail-layer" aria-hidden="false">
    <button type="button" class="settings-backdrop" id="btn-sym-detail-close" aria-label="close"></button>
    ${renderSymbolDetailSheet(symbolDetailIndex, "single")}
  </div>`;
}

function openSymbolDetailFromSlot(uid: string, slot: number, symId: string): void {
  const idx = findSymbolIndexById(symId);
  if (idx < 0) return;
  symbolDetailIndex = idx;
  symbolCompareIndex = null;
  slotEquipPick = { uid, slot };
  if (SYMBOL_SLOT_NUMS.includes(slot as SymbolSlotNum)) {
    applySymbolInvSlotFilter(slot as SymbolSlotNum);
  }
  symbolInvFilterSets = new Set(SYMBOL_SETS.map((s) => s.id));
  monDetailTab = "symbols";
  render();
}

function renderSymbolBagExpandModal(): string {
  if (!symbolBagExpandOpen) return "";
  const cur = symbolBagCapacity(save);
  const cost = symbolBagExpandCost(save);
  if (cost == null) return "";
  const add = SYMBOL_BAG_EXPAND_STEP;
  const next = Math.min(SYMBOL_BAG_MAX_SLOTS, cur + add);
  return `<div class="settings-layer sym-bag-expand-layer" id="sym-bag-expand-layer" aria-hidden="false">
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
        return `<button type="button" class="slot-cell filled" data-unequip-uid="${uid}" data-unequip-slot="${slotNum}" title="${describeSymbol(sym)}">
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
                    <img class="set-chip-ico" src="${symbolSetArtSrc(s.setId)}" width="16" height="16" alt="" draggable="false" onerror="this.onerror=null;this.src='${symbolSetArtFallbackSrc(s.setId)}'" />
                    <span class="set-chip-label">${s.nameKo} ${s.count}/${s.pieces}${s.active ? ` / ${s.effectKo}` : ""}</span>
                  </span>`;
              })
              .join("")}</div>`
          : `<p class="muted loadout-sets-empty">${t('ui.102350c0dd')}</p>`
      }`
    : "";
  if (opts?.slotsOnly) {
    return `<div class="slot-row" aria-label="${t('ui.7cf8acb154')}">${cells}</div>`;
  }
  return `<div class="slot-row" aria-label="${t('ui.7cf8acb154')}">${cells}</div>${stats}`;
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
        const rarity = symbolQualityMeta(sym.quality);
        const symIdx = findSymbolIndexById(sym.id);
        return `<button type="button" class="rune-slot rune-slot--${slotNum} filled rarity--${rarity.id}${picking}" data-sym-detail="${symIdx}" data-sym-from="slot" data-sym-slot-uid="${uid}" data-sym-slot="${slotNum}" style="--sym-accent:${symbolSetAccent(sym.setId)}" title="${describeSymbol(sym)}">
          <span class="rune-slot-face">
            ${symbolPlateImg(rarity.id, slotNum, "rune-slot-plate", 96)}
            ${symbolArtImg(sym.setId, slotNum, "rune-slot-art", 96)}
            <span class="rune-slot-plus">+${sym.enhance}</span>
          </span>
        </button>`;
      }
      return `<button type="button" class="rune-slot rune-slot--${slotNum} empty${picking}" data-slot-pick-uid="${uid}" data-slot-pick="${slotNum}" title="${t("ui.3f1100d730")}">
          <span class="rune-slot-face">
            ${symbolEmptySlotImg(slotNum, "rune-slot-art", 96)}
          </span>
        </button>`;
    })
    .join("");
  return `<div class="rune-circle rune-board" aria-label="${t("ui.7cf8acb154")}">
    ${cells}
  </div>`;
}

function symbolQualityRank(quality: string | undefined): number {
  switch (normalizeSymbolQuality(quality)) {
    case "legend":
      return 5;
    case "epic":
      return 4;
    case "rare":
      return 3;
    case "advanced":
      return 2;
    case "normal":
      return 1;
  }
}

function compareSymbolsByGradeDesc(
  a: { quality?: string; enhance?: number; stars?: number },
  b: { quality?: string; enhance?: number; stars?: number },
): number {
  const qd = symbolQualityRank(b.quality) - symbolQualityRank(a.quality);
  if (qd !== 0) return qd;
  const ed = (b.enhance ?? 0) - (a.enhance ?? 0);
  if (ed !== 0) return ed;
  return (b.stars ?? 0) - (a.stars ?? 0);
}

/** Compact symbol bag grid (SW inventory) for the symbols tab. */
function symbolInvFilterSetsIsAll(): boolean {
  return SYMBOL_SETS.every((s) => symbolInvFilterSets.has(s.id));
}

function symbolInvFilterSlotsIsAll(): boolean {
  return SYMBOL_SLOT_NUMS.every((n) => symbolInvFilterSlots.has(n));
}

function symbolInvFilterSetLabel(): string {
  if (symbolInvFilterSetsIsAll()) return t("ui.symFilterAllSets");
  if (symbolInvFilterSets.size === 0) return t("ui.symFilterNone");
  if (symbolInvFilterSets.size === 1) {
    const id = [...symbolInvFilterSets][0]!;
    return SYMBOL_SETS.find((s) => s.id === id)?.nameKo ?? id;
  }
  return t("ui.symFilterN", { n: symbolInvFilterSets.size });
}

function symbolInvFilterSlotLabel(): string {
  if (symbolInvFilterSlotsIsAll()) return t("ui.symFilterAllSlots");
  if (symbolInvFilterSlots.size === 0) return t("ui.symFilterNone");
  if (symbolInvFilterSlots.size === 1) {
    const n = [...symbolInvFilterSlots][0]!;
    return t("ui.symSlotLabel", { n });
  }
  return t("ui.symFilterSlotN", { n: symbolInvFilterSlots.size });
}

/** Filter inventory to one slot (or restore all). Closes the filter dropdown. */
function applySymbolInvSlotFilter(slot: SymbolSlotNum | "all"): void {
  symbolInvFilterSlots =
    slot === "all" ? new Set(SYMBOL_SLOT_NUMS) : new Set([slot]);
  symbolInvFilterOpen = null;
}

function renderSymbolSetBonusHtml(uid: string): string {
  const preview = previewOwnedCombatStats(save, uid);
  if (!preview?.sets.length) {
    return `<p class="muted loadout-sets-empty">${t("ui.setBonusNone")}</p>`;
  }
  return `<div class="loadout-sets loadout-sets--lines">${preview.sets
    .map((set) => {
      const accent = symbolSetAccent(set.setId);
      return `<span class="set-chip set-chip--line${set.active ? " active" : ""}" style="--sym-accent:${accent}" title="${escapeHtml(set.nameKo)} ${set.count}/${set.pieces}">
        <span class="set-chip-ico-wrap">
          <img class="set-chip-ico" src="${symbolSetArtSrc(set.setId)}" width="22" height="22" alt="" draggable="false" onerror="this.onerror=null;this.src='${symbolSetArtFallbackSrc(set.setId)}'" />
          <span class="set-chip-count">${set.count}</span>
        </span>
        <span class="set-chip-fx">${set.effectKo}</span>
      </span>`;
    })
    .join("")}</div>`;
}

/** Soft-refresh symbol bag UI (filters + grid) without a full app re-render. */
function refreshSymbolInventoryDom(): boolean {
  const host = app.querySelector<HTMLElement>(".mon-sym-viewer-inv");
  if (!host) return false;
  host.innerHTML = renderSymbolInventoryGrid();
  dematteArtInTree(host);
  bindSymbolInventoryInteractions();
  syncSymbolInvFilterMenuUi();
  return true;
}

/** Soft-refresh rune circle, set bonuses, and inventory after equip/unequip/filter. */
function refreshMonsterSymbolsPane(): boolean {
  const uid = selectedEnhanceUid;
  if (!uid) return false;
  const pane = app.querySelector<HTMLElement>('.mon-pane[data-mon-pane="symbols"]');
  if (!pane) return false;

  const circle = pane.querySelector<HTMLElement>(".rune-circle");
  if (circle) {
    const wrap = document.createElement("div");
    wrap.innerHTML = renderMonsterRuneCircle(uid);
    const next = wrap.firstElementChild;
    if (next) circle.replaceWith(next);
  }

  const effectBody = pane.querySelector<HTMLElement>(".rune-effect-body");
  if (effectBody) {
    effectBody.innerHTML = renderSymbolSetBonusHtml(uid);
  }

  const invHost = pane.querySelector<HTMLElement>(".mon-sym-viewer-inv");
  if (invHost) {
    invHost.innerHTML = renderSymbolInventoryGrid();
    dematteArtInTree(invHost);
  }

  // Info-tab combat stats can change after equip — update if present.
  const preview = previewOwnedCombatStats(save, uid);
  const statsRoot = app.querySelector<HTMLElement>(
    '.mon-pane[data-mon-pane="info"] .mon-inspect-stats',
  );
  if (preview && statsRoot) {
    const wrap = document.createElement("div");
    wrap.innerHTML = renderInspectCombatStatsHtml(preview);
    const next = wrap.firstElementChild;
    if (next) statsRoot.replaceWith(next);
  }

  bindSymbolInventoryInteractions();
  syncSymbolInvFilterMenuUi();
  return true;
}

let symbolInvInteractAbort: AbortController | null = null;

/** Bind filter / equip / slot-pick handlers (safe to re-call after soft DOM refresh). */
function bindSymbolInventoryInteractions(): void {
  symbolInvInteractAbort?.abort();
  const ac = new AbortController();
  symbolInvInteractAbort = ac;
  const opts: AddEventListenerOptions = { signal: ac.signal };

  app.querySelector("[data-expand-sym-bag]")?.addEventListener(
    "click",
    () => {
      if (symbolBagExpandCost(save) == null) {
        flash(t("ui.expandSymbolBagMax"));
        return;
      }
      symbolBagExpandOpen = true;
      render();
    },
    opts,
  );

  app.querySelectorAll<HTMLButtonElement>("[data-sym-filter-toggle]").forEach((btn) => {
    btn.addEventListener(
      "click",
      (ev) => {
        ev.stopPropagation();
        const kind = btn.dataset.symFilterToggle;
        if (kind !== "set" && kind !== "slot") return;
        symbolInvFilterOpen = symbolInvFilterOpen === kind ? null : kind;
        if (!refreshSymbolInventoryDom()) render();
      },
      opts,
    );
  });

  app.querySelectorAll(".mon-sym-filter-menu").forEach((menu) => {
    menu.addEventListener(
      "pointerdown",
      (ev) => {
        ev.stopPropagation();
      },
      opts,
    );
  });

  app.querySelectorAll<HTMLInputElement>("[data-sym-filter-set]").forEach((input) => {
    input.addEventListener(
      "change",
      () => {
        const key = input.dataset.symFilterSet ?? "";
        if (key === "all") {
          if (input.checked) {
            symbolInvFilterSets = new Set(SYMBOL_SETS.map((s) => s.id));
          } else {
            symbolInvFilterSets = new Set();
          }
        } else if (SYMBOL_SETS.some((s) => s.id === key)) {
          const id = key as SymbolSetId;
          if (input.checked) symbolInvFilterSets.add(id);
          else symbolInvFilterSets.delete(id);
        }
        symbolInvFilterOpen = "set";
        if (!refreshSymbolInventoryDom()) render();
      },
      opts,
    );
  });

  app.querySelectorAll<HTMLInputElement>("[data-sym-filter-slot]").forEach((input) => {
    input.addEventListener(
      "change",
      () => {
        const key = input.dataset.symFilterSlot ?? "";
        if (key === "all") {
          symbolInvFilterSlots = input.checked
            ? new Set(SYMBOL_SLOT_NUMS)
            : new Set();
        } else {
          const n = Number(key) as SymbolSlotNum;
          if (SYMBOL_SLOT_NUMS.includes(n)) {
            if (input.checked) symbolInvFilterSlots.add(n);
            else symbolInvFilterSlots.delete(n);
          }
        }
        symbolInvFilterOpen = "slot";
        if (!refreshSymbolInventoryDom()) render();
      },
      opts,
    );
  });

  app.querySelectorAll<HTMLButtonElement>("[data-sym-detail]").forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        const idx = Number(btn.dataset.symDetail);
        if (!Number.isFinite(idx) || idx < 0 || !save.symbols[idx]) return;
        const from = btn.dataset.symFrom ?? "";
        const clicked = save.symbols[idx]!;

        if (from === "slot") {
          const uid = btn.dataset.symSlotUid ?? selectedEnhanceUid;
          const slot = Number(btn.dataset.symSlot);
          if (!uid || !Number.isFinite(slot)) return;
          openSymbolDetailFromSlot(uid, slot, clicked.id);
          return;
        }

        // Inventory: empty-slot pick equips immediately; otherwise open detail/compare.
        if (from === "inv" && slotEquipPick) {
          if (clicked.slot !== slotEquipPick.slot) return;
          const mon = save.roster.find((m) => m.uid === slotEquipPick!.uid);
          const equippedId = mon?.symbolSlots?.[slotEquipPick.slot - 1] ?? null;
          if (equippedId && equippedId !== clicked.id) {
            const eqIdx = findSymbolIndexById(equippedId);
            if (eqIdx >= 0) {
              symbolCompareIndex = eqIdx;
              symbolDetailIndex = idx;
              monDetailTab = "symbols";
              render();
              return;
            }
          }
          if (!equippedId) {
            const r = runEquipSymbol(save, slotEquipPick.uid, String(idx));
            save = r.save;
            persist();
            slotEquipPick = null;
            symbolDetailIndex = null;
            symbolCompareIndex = null;
            applySymbolInvSlotFilter("all");
            flash(r.message);
            if (!refreshMonsterSymbolsPane()) render();
            return;
          }
        }

        if (from === "inv" && selectedEnhanceUid) {
          const mon = save.roster.find((m) => m.uid === selectedEnhanceUid);
          const equippedId = mon?.symbolSlots?.[clicked.slot - 1] ?? null;
          if (equippedId && equippedId !== clicked.id) {
            const eqIdx = findSymbolIndexById(equippedId);
            if (eqIdx >= 0) {
              symbolCompareIndex = eqIdx;
              symbolDetailIndex = idx;
              slotEquipPick = { uid: selectedEnhanceUid, slot: clicked.slot };
              if (SYMBOL_SLOT_NUMS.includes(clicked.slot as SymbolSlotNum)) {
                applySymbolInvSlotFilter(clicked.slot as SymbolSlotNum);
              }
              monDetailTab = "symbols";
              render();
              return;
            }
          }
        }

        symbolCompareIndex = null;
        symbolDetailIndex = idx;
        if (from === "inv" && SYMBOL_SLOT_NUMS.includes(clicked.slot as SymbolSlotNum)) {
          applySymbolInvSlotFilter(clicked.slot as SymbolSlotNum);
          if (selectedEnhanceUid) {
            slotEquipPick = { uid: selectedEnhanceUid, slot: clicked.slot };
          }
        }
        monDetailTab = "symbols";
        render();
      },
      opts,
    );
  });

  app.querySelectorAll<HTMLButtonElement>("[data-slot-pick]").forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        const uid = btn.dataset.slotPickUid!;
        const slot = Number(btn.dataset.slotPick);
        if (!uid || !Number.isFinite(slot)) return;
        const togglingOff =
          slotEquipPick?.uid === uid && slotEquipPick.slot === slot;
        if (togglingOff) {
          slotEquipPick = null;
          applySymbolInvSlotFilter("all");
        } else {
          slotEquipPick = { uid, slot };
          if (SYMBOL_SLOT_NUMS.includes(slot as SymbolSlotNum)) {
            applySymbolInvSlotFilter(slot as SymbolSlotNum);
          }
          symbolInvFilterSets = new Set(SYMBOL_SETS.map((s) => s.id));
          monDetailTab = "symbols";
          applyMonDetailTabUi();
        }
        symbolDetailIndex = null;
        symbolCompareIndex = null;
        if (!refreshMonsterSymbolsPane()) render();
      },
      opts,
    );
  });

  const closeSymDetail = () => {
    symbolDetailIndex = null;
    symbolCompareIndex = null;
    render();
  };
  app
    .querySelector("#btn-sym-detail-close")
    ?.addEventListener("click", closeSymDetail, opts);

  app.querySelectorAll<HTMLButtonElement>("[data-sym-detail-enhance]").forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        const idx = Number(btn.dataset.symIdx);
        if (!Number.isFinite(idx) || !save.symbols[idx]) return;
        const detailId =
          symbolDetailIndex != null
            ? (save.symbols[symbolDetailIndex]?.id ?? null)
            : null;
        const compareId =
          symbolCompareIndex != null
            ? (save.symbols[symbolCompareIndex]?.id ?? null)
            : null;
        const id = save.symbols[idx]?.id;
        const r = runEnhanceSymbol(save, String(idx));
        save = r.save;
        persist();
        rematchSymbolModalIndices(detailId, compareId);
        if (symbolDetailIndex == null && id) {
          const next = findSymbolIndexById(id);
          symbolDetailIndex = next >= 0 ? next : null;
        }
        flash(r.message);
        render();
      },
      opts,
    );
  });

  app.querySelectorAll<HTMLButtonElement>("[data-sym-detail-imprint]").forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        const idx = Number(btn.dataset.symIdx);
        if (!Number.isFinite(idx) || !save.symbols[idx]) return;
        const detailId =
          symbolDetailIndex != null
            ? (save.symbols[symbolDetailIndex]?.id ?? null)
            : null;
        const compareId =
          symbolCompareIndex != null
            ? (save.symbols[symbolCompareIndex]?.id ?? null)
            : null;
        const prev = save.symbols[idx];
        const before = prev ? describeSymbol(prev) : "";
        const id = prev?.id;
        const r = runImprintSymbol(save, String(idx));
        save = r.save;
        persist();
        const next = id ? save.symbols.find((x) => x.id === id) : undefined;
        if (next && before && r.message.startsWith(t("ui.forgeOkImprint"))) {
          forgeReveal = {
            kind: "imprint",
            before,
            after: describeSymbol(next),
            cost: `${MINUS}${t("ui.5d0bf3b101")} ${SYMBOL_IMPRINT_CRYSTAL_COST}`,
          };
        }
        rematchSymbolModalIndices(detailId, compareId);
        if (symbolDetailIndex == null && id) {
          const ni = findSymbolIndexById(id);
          symbolDetailIndex = ni >= 0 ? ni : null;
        }
        flash(r.message);
        render();
      },
      opts,
    );
  });

  app.querySelectorAll<HTMLButtonElement>("[data-sym-detail-grind]").forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        const idx = Number(btn.dataset.symIdx);
        if (!Number.isFinite(idx) || !save.symbols[idx]) return;
        const detailId =
          symbolDetailIndex != null
            ? (save.symbols[symbolDetailIndex]?.id ?? null)
            : null;
        const compareId =
          symbolCompareIndex != null
            ? (save.symbols[symbolCompareIndex]?.id ?? null)
            : null;
        const prev = save.symbols[idx];
        const before = prev ? describeSymbol(prev) : "";
        const id = prev?.id;
        const r = runGrindSymbol(save, String(idx));
        save = r.save;
        persist();
        const next = id ? save.symbols.find((x) => x.id === id) : undefined;
        if (next && before && isGrindSuccessMessage(r.message)) {
          forgeReveal = {
            kind: "grind",
            before,
            after: describeSymbol(next),
            cost: grindCostLabel(),
          };
        }
        rematchSymbolModalIndices(detailId, compareId);
        if (symbolDetailIndex == null && id) {
          const ni = findSymbolIndexById(id);
          symbolDetailIndex = ni >= 0 ? ni : null;
        }
        flash(r.message);
        render();
      },
      opts,
    );
  });

  app.querySelectorAll<HTMLButtonElement>("[data-sym-detail-unequip]").forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        const idx = Number(btn.dataset.symIdx);
        if (!Number.isFinite(idx) || !save.symbols[idx]) return;
        const sym = save.symbols[idx]!;
        const mon = save.roster.find((m) =>
          (m.symbolSlots ?? []).includes(sym.id),
        );
        if (!mon) return;
        const slot = (mon.symbolSlots ?? []).findIndex((id) => id === sym.id) + 1;
        const detailId =
          symbolDetailIndex != null
            ? (save.symbols[symbolDetailIndex]?.id ?? null)
            : null;
        const compareId =
          symbolCompareIndex != null
            ? (save.symbols[symbolCompareIndex]?.id ?? null)
            : null;
        const r = runUnequipSymbol(save, mon.uid, slot);
        save = r.save;
        persist();
        rematchSymbolModalIndices(detailId, compareId);
        if (compareId && compareId === sym.id) symbolCompareIndex = null;
        if (detailId && detailId === sym.id) {
          symbolDetailIndex = null;
          symbolCompareIndex = null;
        }
        flash(r.message);
        render();
      },
      opts,
    );
  });

  app.querySelectorAll<HTMLButtonElement>("[data-sym-detail-equip]").forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        const idx = Number(btn.dataset.symIdx);
        if (!Number.isFinite(idx) || !save.symbols[idx]) return;
        const targetUid = slotEquipPick?.uid ?? selectedEnhanceUid;
        if (!targetUid) return;
        const r = runEquipSymbol(save, targetUid, String(idx));
        save = r.save;
        persist();
        symbolDetailIndex = null;
        symbolCompareIndex = null;
        slotEquipPick = null;
        applySymbolInvSlotFilter("all");
        flash(r.message);
        render();
      },
      opts,
    );
  });
}

function clearSymbolInvFilterMenuPortal(): void {
  document.querySelectorAll("body > .mon-sym-filter-menu").forEach((el) => el.remove());
}

function findSymbolInvFilterMenu(kind: SymbolInvFilterKind): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>(
      `body > .mon-sym-filter-menu[data-sym-filter-menu="${kind}"]`,
    ) ??
    app.querySelector<HTMLElement>(`.mon-sym-filter-menu[data-sym-filter-menu="${kind}"]`)
  );
}

/** Anchor the fixed filter menu to its toggle (avoids panel overflow clip). */
function placeSymbolInvFilterMenu(): void {
  const kind = symbolInvFilterOpen;
  if (!kind) return;
  const btn = app.querySelector<HTMLElement>(`[data-sym-filter-toggle="${kind}"]`);
  const menu = findSymbolInvFilterMenu(kind);
  if (!btn || !menu) return;
  const r = btn.getBoundingClientRect();
  const pad = 8;
  const mw = Math.max(menu.offsetWidth, 160);
  const mh = Math.max(menu.offsetHeight, 40);
  let left = r.right - mw;
  left = Math.min(Math.max(pad, left), Math.max(pad, window.innerWidth - mw - pad));
  let top = r.bottom + 4;
  if (top + mh > window.innerHeight - pad) {
    top = Math.max(pad, r.top - mh - 4);
  }
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}

function syncSymbolInvFilterMenuUi(): void {
  symbolInvFilterUiAbort?.abort();
  symbolInvFilterUiAbort = null;
  clearSymbolInvFilterMenuPortal();
  if (!symbolInvFilterOpen) return;
  const kind = symbolInvFilterOpen;
  const menu = app.querySelector<HTMLElement>(
    `.mon-sym-filter-menu[data-sym-filter-menu="${kind}"]`,
  );
  if (!menu) return;
  // Portal to body so hub-screen transform / overflow cannot clip the menu.
  document.body.appendChild(menu);
  placeSymbolInvFilterMenu();
  requestAnimationFrame(placeSymbolInvFilterMenu);
  const ac = new AbortController();
  symbolInvFilterUiAbort = ac;
  const onOutside = (ev: Event) => {
    const target = ev.target as HTMLElement | null;
    if (
      target?.closest?.(".mon-sym-filter") ||
      target?.closest?.(".mon-sym-filter-menu")
    ) {
      return;
    }
    symbolInvFilterOpen = null;
    symbolInvFilterUiAbort?.abort();
    symbolInvFilterUiAbort = null;
    clearSymbolInvFilterMenuPortal();
    app.querySelectorAll<HTMLButtonElement>("[data-sym-filter-toggle]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  };
  // Defer so the opening click does not immediately close the menu.
  setTimeout(() => {
    if (ac.signal.aborted) return;
    document.addEventListener("pointerdown", onOutside, {
      capture: true,
      signal: ac.signal,
    });
  }, 0);
  window.addEventListener(
    "resize",
    () => {
      if (symbolInvFilterOpen) placeSymbolInvFilterMenu();
    },
    { signal: ac.signal },
  );
  window.addEventListener(
    "scroll",
    () => {
      if (symbolInvFilterOpen) placeSymbolInvFilterMenu();
    },
    { capture: true, signal: ac.signal },
  );
}

function renderSymFilterDropdown(
  kind: SymbolInvFilterKind,
  label: string,
  titleKey: "ui.symFilter" | "ui.symFilterSlot",
  rowsHtml: string,
): string {
  const open = symbolInvFilterOpen === kind;
  const menu = open
    ? `<div class="mon-sym-filter-menu" data-sym-filter-menu="${kind}" role="group" aria-label="${escapeHtml(t(titleKey))}">${rowsHtml}</div>`
    : "";
  return `<div class="mon-sym-filter" data-sym-filter-kind="${kind}">
    <button type="button" class="mon-sym-filter-btn" data-sym-filter-toggle="${kind}" aria-expanded="${open ? "true" : "false"}" title="${escapeHtml(t(titleKey))}">
      <span class="mon-sym-filter-btn-label">${escapeHtml(label)}</span>
      <span class="mon-sym-filter-caret" aria-hidden="true">${ARROW_DOWN}</span>
    </button>
    ${menu}
  </div>`;
}

function renderSymbolInventoryGrid(): string {
  const cap = symbolBagCapacity(save);
  const expandCost = symbolBagExpandCost(save);
  const atMax = expandCost == null;
  const expandTitle = atMax
    ? t("ui.expandSymbolBagMax")
    : t("ui.expandSymbolBag", { cost: expandCost! });
  const filterSetsAll = symbolInvFilterSetsIsAll();
  const filterSlotsAll = symbolInvFilterSlotsIsAll();
  const visible = save.symbols
    .map((sym, i) => ({ sym, i }))
    .filter(
      ({ sym }) =>
        symbolInvFilterSets.has(sym.setId) &&
        symbolInvFilterSlots.has(sym.slot as SymbolSlotNum),
    )
    .sort((a, b) => compareSymbolsByGradeDesc(a.sym, b.sym));
  const tiles: string[] = [];
  for (const { sym, i } of visible) {
    const worn = symbolWearer(sym.id);
    const rarity = symbolQualityMeta(sym.quality);
    const grade = invGradeFromRarityId(rarity.id);
    tiles.push(`<div class="mon-sym-inv-cell">
        <button type="button" class="mon-sym-inv-tile inv-grade--${grade} rarity--${rarity.id}${worn ? " is-worn" : ""}" data-sym-detail="${i}" data-sym-from="inv" title="${describeSymbol(sym)}">
          ${invGradePlateImg(grade, "mon-sym-inv-grade-plate", 112)}
          <span class="mon-sym-inv-ico" aria-hidden="true">
            ${symbolPlateImg(rarity.id, sym.slot, "mon-sym-inv-plate", 72)}
            ${symbolArtImg(sym.setId, sym.slot, "mon-sym-inv-mark", 48)}
            <span class="mon-sym-inv-enh">${sym.enhance}</span>
          </span>
          ${worn ? `<span class="mon-sym-inv-worn">E</span>` : ""}
        </button>
      </div>`);
  }
  if (filterSetsAll && filterSlotsAll) {
    const emptyCount = Math.max(0, cap - save.symbols.length);
    for (let e = 0; e < emptyCount; e++) {
      tiles.push(`<div class="mon-sym-inv-cell" aria-hidden="true">
        <div class="mon-sym-inv-tile is-empty">
          ${symbolEmptySlotImg(((e % 6) + 1), "mon-sym-inv-empty-art", 48)}
        </div>
      </div>`);
    }
  }
  const setFilterRows = [
    `<label class="mon-sym-filter-row">
      <input type="checkbox" data-sym-filter-set="all" ${filterSetsAll ? "checked" : ""} />
      <span>${escapeHtml(t("ui.symFilterAllSets"))}</span>
    </label>`,
    ...SYMBOL_SETS.map(
      (s) => `<label class="mon-sym-filter-row">
      <input type="checkbox" data-sym-filter-set="${s.id}" ${symbolInvFilterSets.has(s.id) ? "checked" : ""} />
      <img class="mon-sym-filter-ico" src="${symbolSetArtSrc(s.id)}" width="16" height="16" alt="" draggable="false" onerror="this.onerror=null;this.src='${symbolSetArtFallbackSrc(s.id)}'" />
      <span>${escapeHtml(s.nameKo)}</span>
    </label>`,
    ),
  ].join("");
  const slotFilterRows = [
    `<label class="mon-sym-filter-row">
      <input type="checkbox" data-sym-filter-slot="all" ${filterSlotsAll ? "checked" : ""} />
      <span>${escapeHtml(t("ui.symFilterAllSlots"))}</span>
    </label>`,
    ...SYMBOL_SLOT_NUMS.map(
      (n) => `<label class="mon-sym-filter-row">
      <input type="checkbox" data-sym-filter-slot="${n}" ${symbolInvFilterSlots.has(n) ? "checked" : ""} />
      ${symbolEmptySlotImg(n, "mon-sym-filter-ico mon-sym-filter-ico--slot", 16)}
      <span>${escapeHtml(t("ui.symSlotLabel", { n }))}</span>
    </label>`,
    ),
  ].join("");
  const gridBody =
    tiles.length > 0
      ? tiles.join("")
      : `<p class="mon-sym-inv-empty muted">${escapeHtml(t("ui.symFilterEmpty"))}</p>`;
  return `<div class="mon-sym-inv" aria-label="${t("ui.60fbf51b13")}">
    <div class="mon-sym-inv-head">
      <div class="mon-sym-inv-head-title">
        <strong>${t("ui.60fbf51b13")}</strong>
        <button type="button" class="mon-sym-inv-expand" data-expand-sym-bag ${atMax ? "disabled" : ""} title="${escapeHtml(expandTitle)}" aria-label="${escapeHtml(expandTitle)}">+</button>
      </div>
      <div class="mon-sym-inv-head-meta">
        ${renderSymFilterDropdown("set", symbolInvFilterSetLabel(), "ui.symFilter", setFilterRows)}
        ${renderSymFilterDropdown("slot", symbolInvFilterSlotLabel(), "ui.symFilterSlot", slotFilterRows)}
      </div>
    </div>
    <div class="mon-sym-inv-grid mon-sym-inv-grid--rail">${gridBody}</div>
    <div class="mon-sym-inv-foot">
      <span class="mon-sym-inv-count">${visible.length}/${cap}</span>
    </div>
  </div>`;
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

function monTopbarCodexBtn(): string {
  return `<button type="button" class="mon-topbar-codex" id="btn-open-codex" aria-label="${escapeHtml(t("ui.codex"))}" title="${escapeHtml(t("ui.codex"))}">
    <span class="mon-topbar-codex-seal" aria-hidden="true">${CODEX_SEAL_HTML}</span>
    <span class="mon-topbar-codex-label">${escapeHtml(t("ui.codex"))}</span>
  </button>`;
}

function ownedMonsterIdSet(): Set<string> {
  const ids = new Set<string>();
  for (const m of save.roster) {
    ids.add(resolveMonsterId(m.monsterId));
  }
  return ids;
}

function gearEnhanceCostLabel(enhance: number): string {
  const mana = gearEnhanceManaCost(enhance);
  const crystal = gearEnhanceCrystalCost(enhance);
  return crystal > 0
    ? t("ui.gearEnhanceCostCrystal", { mana, crystal })
    : t("ui.gearEnhanceCost", { mana });
}

function gearSlotLabel(slot: GearSlot): string {
  switch (slot) {
    case "weapon":
      return t("ui.gearSlotWeapon");
    case "top":
      return t("ui.gearSlotTop");
    case "bottom":
      return t("ui.gearSlotBottom");
    case "shoes":
      return t("ui.gearSlotShoes");
    case "necklace":
      return t("ui.gearSlotNecklace");
    case "ring":
      return t("ui.gearSlotRing");
  }
}

function parseGearSlot(raw: string | undefined): GearSlot {
  if (raw && isGearSlot(raw)) return raw;
  if (raw === "robe" || raw === "armor") return "top";
  if (raw === "cloak") return "bottom";
  if (raw === "accessory") return "shoes";
  if (raw === "orb" || raw === "helm") return "necklace";
  return "shoes";
}

function gearSlotArtSrc(
  slot: GearSlot,
  element?: SummonerElement | string,
): string {
  if (slot === "weapon" && element) {
    return `/art/ui/gear/weapon-${element}.webp`;
  }
  return `/art/ui/gear/${slot}.webp`;
}

function gearSlotArtFallbackSrc(
  slot: GearSlot,
  element?: SummonerElement | string,
): string {
  if (slot === "weapon" && element) {
    return `/art/ui/gear/weapon-${element}.svg`;
  }
  return `/art/ui/gear/${slot}.svg`;
}

function gearQualityLabel(quality: GearQuality | string | undefined): string {
  return symbolQualityMeta(quality).label;
}

function renderGearDollHtml(activeEl: SummonerElement): string {
  const gear = getActiveGear(save);
  const fxGear = enhanceFx?.kind === "gear" ? enhanceFx.slot : null;
  const slots: GearSlot[] = [...GEAR_SLOTS];
  const slotBtn = (slot: GearSlot, piece: GearPiece): string => {
    const maxed = piece.enhance >= MAX_GEAR_ENHANCE;
    const setName =
      GEAR_SETS.find((s) => s.id === piece.setId)?.nameKo ?? piece.setId;
    const grade = gearStarsToInvGrade(piece.stars);
    const qLabel = gearQualityLabel(piece.quality);
    const art = gearSlotArtSrc(slot, piece.element ?? activeEl);
    const artFb = gearSlotArtFallbackSrc(slot, piece.element ?? activeEl);
    return `<button type="button" class="gear-slot inv-grade--${grade}${fxGear === slot ? " is-flash" : ""}${maxed ? " is-max" : ""}" data-gear="${slot}" ${maxed ? "disabled" : ""} title="${escapeHtml(describeGear(piece))}">
      <img class="gear-slot-ico" src="${art}" width="40" height="40" alt="" draggable="false" onerror="this.onerror=null;this.src='${artFb}'" />
      <span class="gear-slot-seal" aria-hidden="true"><img src="${art}" width="22" height="22" alt="" draggable="false" /></span>
      <span class="gear-slot-body">
        <span class="gear-slot-label">${escapeHtml(gearSlotLabel(slot))}</span>
        <span class="gear-slot-plus">★${piece.stars} +${piece.enhance}</span>
        <span class="gear-slot-set">${escapeHtml(qLabel)} · ${escapeHtml(setName)}</span>
        <span class="gear-slot-cost">${maxed ? "MAX" : escapeHtml(gearEnhanceCostLabel(piece.enhance))}</span>
      </span>
    </button>`;
  };
  const setSummary = summarizeGearSets(gear)
    .filter((s) => s.count > 0)
    .map(
      (s) =>
        `<span class="set-chip${s.active2 || s.active4 || s.active6 ? " active" : ""}">${escapeHtml(s.nameKo)} ${s.count}${s.active6 ? " ·6" : s.active4 ? " ·4" : s.active2 ? " ·2" : ""}</span>`,
    )
    .join("");
  const gearAffixRows = slots
    .map((slot) => {
      const piece = gear[slot];
      const chips = GEAR_SETS.map((s) => {
        const active = piece.setId === s.id;
        return `<button type="button" class="set-chip-btn${active ? " is-active" : ""}" data-gear-set="${slot}" data-set-id="${s.id}" ${active ? "disabled" : ""}>${escapeHtml(s.nameKo)}</button>`;
      }).join("");
      return `<div class="gear-set-row">
        <span class="gear-set-row-label">${escapeHtml(gearSlotLabel(slot))}</span>
        <div class="gear-set-row-chips">${chips}</div>
      </div>`;
    })
    .join("");
  const bag = save.gearBag ?? [];
  const bagGrid = bag.length
    ? `<div class="gear-bag-grid">${bag
        .map((p, i) => {
          const piece = normalizeGearPiece(p, p.slot);
          const sellCrystal = gearSellCrystal(piece);
          const grade = gearStarsToInvGrade(piece.stars);
          const canEquip = canEquipGearOnElement(piece, activeEl);
          const lockHint =
            piece.slot === "weapon" && piece.element
              ? t("ui.gearWeaponElementLock", {
                  element: elementLabel(piece.element as SummonerElement),
                })
              : "";
          return `<div class="gear-tile inv-grade--${grade}${canEquip ? "" : " is-element-locked"}">
          <button type="button" class="gear-tile-main" data-gear-equip="${i}" title="${escapeHtml(describeGear(piece))}${lockHint ? ` · ${escapeHtml(lockHint)}` : ""}">
            <span class="gear-tile-seal" aria-hidden="true"><img src="${gearSlotArtSrc(piece.slot, piece.element)}" width="28" height="28" alt="" draggable="false" onerror="this.onerror=null;this.src='${gearSlotArtFallbackSrc(piece.slot, piece.element)}'" /></span>
            <strong>${escapeHtml(describeGear(piece))}</strong>
            <small>${escapeHtml(gearSlotLabel(piece.slot))} · ${escapeHtml(gearQualityLabel(piece.quality))}${lockHint ? ` · ${escapeHtml(lockHint)}` : ""}</small>
          </button>
          <div class="gear-tile-actions">
            <button type="button" class="secondary${canEquip ? "" : " is-locked"}" data-gear-equip="${i}" aria-disabled="${canEquip ? "false" : "true"}">${escapeHtml(t("ui.sumBookEquip"))}</button>
            <button type="button" class="secondary" data-gear-sell="${i}">+${gearSellMana(piece)}${sellCrystal > 0 ? ` / +${sellCrystal}` : ""}</button>
          </div>
        </div>`;
        })
        .join("")}</div>`
    : `<p class="muted">${escapeHtml(t("ui.sumBookGearEmpty"))}</p>`;

  return `<div class="sum-gear-panel">
    <p class="muted gear-per-summoner-hint">${escapeHtml(t("ui.gearPerSummonerHint"))}</p>
    <div class="gear-doll" aria-label="${escapeHtml(t("ui.sumBookTabGear"))}">
      ${slotBtn("weapon", gear.weapon)}
      ${slotBtn("necklace", gear.necklace)}
      ${slotBtn("top", gear.top)}
      <div class="gear-doll-core" aria-hidden="true">
        <img src="${summonerArtSrc(activeEl)}" width="40" height="40" alt="" draggable="false" decoding="async" />
      </div>
      ${slotBtn("ring", gear.ring)}
      ${slotBtn("bottom", gear.bottom)}
      ${slotBtn("shoes", gear.shoes)}
    </div>
    <div class="gear-set-summary">${setSummary || `<span class="muted">${escapeHtml(t("ui.sumBookNoSets"))}</span>`}</div>
    <p class="section-label">${escapeHtml(t("ui.sumBookSetAffix", { n: GEAR_SET_AFFIX_MANA }))}</p>
    <div class="gear-set-affix">${gearAffixRows}</div>
    <p class="section-label">${escapeHtml(t("ui.sumBookGearBag", { n: bag.length, max: MAX_GEAR_BAG }))}</p>
    ${bagGrid}
  </div>`;
}

function codexCellHtml(
  m: (typeof MONSTERS)[number],
  owned: Set<string>,
): string {
  const have = owned.has(m.id);
  const starN = Math.max(1, m.naturalStars);
  const grade = invGradeFromStars(starN);
  const art =
    monsterArtImg(m.id, "codex-cell-img", 52) ||
    `<span class="codex-cell-fallback">${m.element[0]?.toUpperCase() ?? "?"}</span>`;
  const stars = monStarsHtml(starN);
  return `<button type="button" class="codex-cell inv-grade--${grade} el-${m.element}${have ? " is-owned" : " is-locked"}${codexDetailMonsterId === m.id ? " is-active" : ""}" data-codex-mon="${m.id}" data-codex-stars="${m.naturalStars}" title="${have ? escapeHtml(m.nameKo) : escapeHtml(t("ui.codexLocked"))}">
    ${invGradePlateImg(grade, "codex-cell-grade-plate", 112)}
    <span class="codex-cell-art" aria-hidden="true">${art}</span>
    <span class="codex-cell-stars">${stars}</span>
    ${have ? "" : `<span class="codex-cell-lock" aria-hidden="true">${CODEX_LOCK_HTML}</span>`}
  </button>`;
}

function codexMonsterDetailHtml(monsterId: string | null): string {
  if (!monsterId) return "";
  const def = getMonster(monsterId);
  if (!def) return "";
  const owned = ownedMonsterIdSet();
  const have = owned.has(def.id);
  const role = monsterRoleLabel(def.role, def.baseStats);
  const grade = invGradeFromStars(def.naturalStars);
  const art =
    monsterArtImg(def.id, "codex-detail-img", 72) ||
    `<span class="codex-cell-fallback">${def.element[0]?.toUpperCase() ?? "?"}</span>`;
  const elSrc = monsterElementArtSrc(def.element) ?? "";
  const skills = (def.skills ?? [])
    .map((sk, si) => {
      const lines = monsterSkillDescLines(sk)
        .map((line) => `<li>${escapeHtml(line)}</li>`)
        .join("");
      return `<button type="button" class="codex-skill-ico" data-codex-skill="${si}" aria-expanded="false" aria-label="${escapeHtml(sk.nameKo)}">
        ${monsterSkillArtImg(def.id, si, sk, "codex-skill-ico-img", 36)}
        <span class="codex-skill-tip" hidden role="tooltip">
          <strong>${escapeHtml(sk.nameKo)}</strong>
          <ul>${lines}</ul>
        </span>
      </button>`;
    })
    .join("");
  return `<div class="codex-detail" role="dialog" aria-label="${escapeHtml(def.nameKo)}">
    <div class="codex-detail-art inv-grade--${grade} el-${def.element}${have ? "" : " is-locked"}">
      ${invGradePlateImg(grade, "codex-detail-grade-plate", 112)}
      ${art}
    </div>
    <div class="codex-detail-body">
      <strong>${escapeHtml(def.nameKo)}</strong>
      <small class="codex-detail-meta">
        <img class="codex-detail-el" src="${elSrc}" width="18" height="18" alt="" draggable="false" />
        ${monStarsHtml(Math.max(1, def.naturalStars))} ${MIDDOT} ${escapeHtml(role)}
      </small>
      <small>${escapeHtml(have ? t("ui.codexOwned") : t("ui.codexLocked"))}</small>
      ${
        skills
          ? `<div class="codex-detail-skills" aria-label="${escapeHtml(t("ui.codexDetailSkills"))}">${skills}</div>`
          : ""
      }
    </div>
    <button type="button" class="codex-detail-close" id="btn-codex-detail-close" aria-label="${escapeHtml(t("ui.codexClose"))}">${TIMES}</button>
  </div>`;
}

function syncCodexActiveCells(): void {
  app.querySelectorAll<HTMLButtonElement>("[data-codex-mon]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.codexMon === codexDetailMonsterId);
  });
}

function closeCodexSkillTips(root: ParentNode = app): void {
  root.querySelectorAll<HTMLButtonElement>(".codex-skill-ico.is-tip-open").forEach((btn) => {
    btn.classList.remove("is-tip-open");
    btn.setAttribute("aria-expanded", "false");
    btn.querySelector(".codex-skill-tip")?.setAttribute("hidden", "");
  });
}

function bindCodexDetailControls(root: ParentNode): void {
  root.querySelector("#btn-codex-detail-close")?.addEventListener("click", () => {
    codexDetailMonsterId = null;
    syncCodexActiveCells();
    refreshCodexDetailDom();
  });
  root.querySelectorAll<HTMLButtonElement>("[data-codex-skill]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const wasOpen = btn.classList.contains("is-tip-open");
      closeCodexSkillTips(root);
      if (wasOpen) return;
      btn.classList.add("is-tip-open");
      btn.setAttribute("aria-expanded", "true");
      const tip = btn.querySelector<HTMLElement>(".codex-skill-tip");
      if (tip) {
        tip.removeAttribute("hidden");
        const r = btn.getBoundingClientRect();
        tip.style.position = "fixed";
        tip.style.left = `${Math.round(r.left + r.width / 2)}px`;
        tip.style.bottom = `${Math.round(window.innerHeight - r.top + 8)}px`;
        tip.style.top = "auto";
        tip.style.transform = "translateX(-50%)";
      }
    });
  });
}

function refreshCodexDetailDom(): void {
  const host = app.querySelector("#codex-detail-host");
  if (!host) return;
  host.innerHTML = codexMonsterDetailHtml(codexDetailMonsterId);
  bindCodexDetailControls(host);
  dematteArtInTree(host, "img.codex-detail-img");
}

function rebuildCodexElementGrid(el: SummonerElement): void {
  const grid = app.querySelector(`[data-codex-grid="${el}"]`);
  if (!grid) {
    render();
    return;
  }
  const owned = ownedMonsterIdSet();
  const starFilter = codexStarsByElement[el];
  const list = MONSTERS.filter((m) => m.element === el)
    .sort(
      (a, b) =>
        a.naturalStars - b.naturalStars || a.nameKo.localeCompare(b.nameKo),
    )
    .filter((m) => starFilter === "all" || m.naturalStars === starFilter);
  grid.innerHTML = list.map((m) => codexCellHtml(m, owned)).join("");
  dematteArtInTree(grid, "img.codex-cell-img");
}

function renderCodexLayer(): string {
  if (!codexOpen) return "";
  const owned = ownedMonsterIdSet();
  const ownedCount = MONSTERS.filter((m) => owned.has(m.id)).length;

  let body = "";
  if (codexTab === "monsters") {
    const starOptions = (el: SummonerElement): string => {
      const cur = codexStarsByElement[el];
      const opts = (
        [
          ["all", t("ui.codexFilterAll")],
          ["1", t("ui.codexStarN", { n: 1 })],
          ["2", t("ui.codexStarN", { n: 2 })],
          ["3", t("ui.codexStarN", { n: 3 })],
          ["4", t("ui.codexStarN", { n: 4 })],
          ["5", t("ui.codexStarN", { n: 5 })],
        ] as const
      )
        .map(
          ([v, label]) =>
            `<option value="${v}"${String(cur) === v ? " selected" : ""}>${escapeHtml(label)}</option>`,
        )
        .join("");
      return `<label class="codex-el-stars">
        <span class="sr-only">${escapeHtml(t("ui.codexStarFilter", { element: elementLabel(el) }))}</span>
        <select class="codex-el-stars-select" data-codex-el-stars="${el}" aria-label="${escapeHtml(t("ui.codexStarFilter", { element: elementLabel(el) }))}">${opts}</select>
      </label>`;
    };

    const sections = SUMMONER_ELEMENTS.map((el) => {
      const starFilter = codexStarsByElement[el];
      const list = MONSTERS.filter((m) => m.element === el).sort(
        (a, b) =>
          a.naturalStars - b.naturalStars || a.nameKo.localeCompare(b.nameKo),
      );
      const visible = list.filter(
        (m) => starFilter === "all" || m.naturalStars === starFilter,
      );
      const elOwned = list.filter((m) => owned.has(m.id)).length;
      const elSrc = monsterElementArtSrc(el) ?? "";
      return `<section class="codex-el-section el-${el}" data-codex-section="${el}">
        <header class="codex-el-head">
          <span class="codex-el-ico" title="${escapeHtml(elementLabel(el))}" aria-label="${escapeHtml(elementLabel(el))}">
            <img class="codex-el-ico-img" src="${elSrc}" width="40" height="40" alt="" draggable="false" decoding="async" />
          </span>
          <span class="codex-el-count" aria-hidden="true">${elOwned}/${list.length}</span>
          ${starOptions(el)}
        </header>
        <div class="codex-grid" data-codex-grid="${el}">
          ${visible.map((m) => codexCellHtml(m, owned)).join("")}
        </div>
      </section>`;
    }).join("");

    body = `<p class="codex-count">${escapeHtml(t("ui.codexOwnedCount", { n: ownedCount, total: MONSTERS.length }))}</p>
      <div class="codex-el-list">${sections}</div>
      <div id="codex-detail-host">${codexMonsterDetailHtml(codexDetailMonsterId)}</div>`;
  } else {
    const roster = save.summoners ?? createSummonerRoster();
    const cards = SUMMONER_ELEMENTS.map((el) => {
      const p = roster[el];
      const leader = getSummonerLeader(el);
      const on = el === (save.activeSummoner ?? "light");
      const elSrc = monsterElementArtSrc(el) ?? "";
      return `<button type="button" class="codex-summoner-card el-${el}${on ? " is-active" : ""}" data-codex-summoner="${el}">
        <img class="codex-summoner-art" src="${summonerArtSrc(el)}" width="64" height="64" alt="" draggable="false" decoding="async" />
        <strong>${escapeHtml(leader.nameKo)}</strong>
        <small class="codex-summoner-meta">
          <img class="codex-detail-el" src="${elSrc}" width="18" height="18" alt="" draggable="false" />
          Lv.${p.level}${p.awaken > 0 ? ` ${MIDDOT} +${p.awaken}` : ""}
        </small>
      </button>`;
    }).join("");
    body = `<div class="codex-summoner-grid">${cards}</div>`;
  }

  return `<div class="codex-layer" id="codex-layer" role="dialog" aria-modal="true" aria-labelledby="codex-title">
    <div class="codex-sheet">
      <header class="codex-head">
        <h2 class="codex-title" id="codex-title">${escapeHtml(t("ui.codexTitle"))}</h2>
        <button type="button" class="codex-close" id="btn-codex-close" aria-label="${escapeHtml(t("ui.codexClose"))}">${TIMES}</button>
      </header>
      <div class="codex-tabs" role="tablist">
        <button type="button" class="codex-tab${codexTab === "monsters" ? " is-active" : ""}" data-codex-tab="monsters" role="tab" aria-selected="${codexTab === "monsters"}">${escapeHtml(t("ui.codexTabMonsters"))}</button>
        <button type="button" class="codex-tab${codexTab === "summoners" ? " is-active" : ""}" data-codex-tab="summoners" role="tab" aria-selected="${codexTab === "summoners"}">${escapeHtml(t("ui.codexTabSummoners"))}</button>
      </div>
      <div class="codex-body">${body}</div>
    </div>
  </div>`;
}

function renderSummonerBook(): string {
  const activeEl = (save.activeSummoner ?? "light") as SummonerElement;
  const active = getActiveSummoner(save);
  const kit = getSummonerKit(activeEl);
  const leader = kit.leader;
  const prog = save.summonerMagic?.[activeEl] ?? emptyMagicProgress();
  const unlocked = unlockedMagicSkills(activeEl, prog);
  const unlockedIds = new Set(unlocked.map((s) => s.id));
  const awaken = active.awaken;
  const awakenMax = awaken >= MAX_SUMMONER_AWAKEN;
  const awakenNeedLv = awakenMinLevel(awaken);
  const awakenMana = awakenManaCost(awaken);
  const awakenCrystal = awakenCrystalCost(awaken);
  const awakenLocked = active.level < awakenNeedLv;
  const leaderPct = (awakenLeaderAtkPct(awaken) * 100).toFixed(1);
  const levelPct = Math.max(
    0,
    Math.min(100, Math.round((active.level / MAX_MONSTER_LEVEL) * 100)),
  );

  const infoPanel = `<div class="mon-pane mon-pane--info" data-sum-pane="info"${sumDetailTab === "info" ? "" : " hidden"}>
    <div class="sum-leader-card">
      <span class="sum-leader-k">${escapeHtml(t("ui.sumBookLeader"))}</span>
      <strong>${escapeHtml(leader.nameKo)}</strong>
      <p class="muted">${escapeHtml(stagePrepLeaderPassive(save).detail)}</p>
      <small>${escapeHtml(t("ui.sumBookLeaderAtk", { pct: leaderPct }))}</small>
    </div>
    <div class="mon-book-stats mon-inspect-stats mon-inspect-stats--grid2x4" role="list">
      <div class="stat-cell" role="listitem"><span class="stat-cell-k">Lv</span><span class="stat-cell-v">${active.level}</span></div>
      <div class="stat-cell" role="listitem"><span class="stat-cell-k">EXP</span><span class="stat-cell-v">${Math.floor(active.exp ?? 0)}</span></div>
      <div class="stat-cell" role="listitem"><span class="stat-cell-k">${escapeHtml(t("ui.a2d1ab7b28"))}</span><span class="stat-cell-v">+${awaken}</span></div>
      <div class="stat-cell" role="listitem"><span class="stat-cell-k">${escapeHtml(elementLabel(activeEl))}</span><span class="stat-cell-v">${escapeHtml(kit.leader.nameKo)}</span></div>
    </div>
  </div>`;

  const skillTiles = (["A", "B", "A1", "A2", "B1", "B2"] as const)
    .map((slot) => {
      const sk = kit.skills[slot];
      const open = unlockedIds.has(sk.id);
      const rank = magicRank(prog, sk.id);
      const lockedHint =
        slot.startsWith("A") && slot !== "A" && prog.branch !== "A"
          ? t("ui.skillLockedHint", { branch: "A", n: MAX_MAGIC_RANK })
          : slot.startsWith("B") && slot !== "B" && prog.branch !== "B"
            ? t("ui.skillLockedHint", { branch: "B", n: MAX_MAGIC_RANK })
            : "";
      return `<div class="sum-magic-tile${open ? " is-on" : " is-locked"}">
        <div class="sum-magic-tile-head">
          ${summonerSkillArtImg(sk.id, "sum-magic-ico", 40)}
          <div class="sum-magic-tile-copy">
            <strong>${escapeHtml(sk.nameKo)}</strong>
            <small>${open ? `+${rank}/${MAX_MAGIC_RANK}` : escapeHtml(lockedHint || t("ui.stagePrepSkillLocked"))}</small>
          </div>
        </div>
        ${
          open && rank < MAX_MAGIC_RANK
            ? `<button type="button" class="auth-btn-primary sum-magic-enh" data-magic-enhance="${sk.id}">${escapeHtml(t("ui.sumBookEnhance"))} +1</button>`
            : open
              ? `<span class="sum-magic-max">MAX</span>`
              : ""
        }
      </div>`;
    })
    .join("");

  const skillsPanel = `<div class="mon-pane mon-pane--skills" data-sum-pane="skills"${sumDetailTab === "skills" ? "" : " hidden"}>
    <p class="sum-magic-branch muted">${escapeHtml(
      prog.branch
        ? t("ui.sumBookMagicBranch", { branch: prog.branch })
        : t("ui.sumBookMagicBranchNone"),
    )}</p>
    <div class="sum-magic-grid">${skillTiles}</div>
  </div>`;

  const awakenLabel = awakenMax
    ? t("ui.sumBookAwakenMax")
    : awakenLocked
      ? t("ui.sumBookAwakenNeedLv", { n: awakenNeedLv })
      : t("ui.sumBookAwakenBtn", { n: awaken + 1 });
  const awakenPanel = `<div class="mon-pane mon-pane--awaken" data-sum-pane="awaken"${sumDetailTab === "awaken" ? "" : " hidden"}>
    <div class="sum-awaken-card">
      <strong>+${awaken} / ${MAX_SUMMONER_AWAKEN}</strong>
      <p class="muted">${escapeHtml(t("ui.sumBookLeaderAtk", { pct: leaderPct }))}</p>
      ${
        !awakenMax && !awakenLocked
          ? `<p class="muted">${escapeHtml(t("ui.sumBookAwakenCost", { mana: awakenMana, crystal: awakenCrystal }))}</p>`
          : ""
      }
      <button type="button" class="auth-btn-primary" data-awaken ${awakenMax || awakenLocked ? "disabled" : ""}>${escapeHtml(awakenLabel)}</button>
    </div>
  </div>`;

  const gearPanel = `<div class="mon-pane mon-pane--gear" data-sum-pane="gear"${sumDetailTab === "gear" ? "" : " hidden"}>
    ${renderGearDollHtml(activeEl)}
  </div>`;

  const heroBlock = `<div class="mon-inspect-hero">
    <div class="mon-inspect-preview">
      <div class="mon-preview-turntable" role="img" aria-label="${escapeHtml(leader.nameKo)}">
        <div class="mon-preview-art">
          <img class="mon-preview-img sum-preview-img" src="${summonerArtSrc(activeEl)}" width="120" height="120" alt="" draggable="false" decoding="async" />
        </div>
      </div>
    </div>
    <div class="mon-inspect-hero-info">
      <div class="mon-inspect-title-row">
        <span class="mon-el-ico mon-el-ico--${activeEl}" title="${escapeHtml(elementLabel(activeEl))}" aria-label="${escapeHtml(elementLabel(activeEl))}">
          <img class="mon-el-ico-img" src="${monsterElementArtSrc(activeEl) ?? ""}" width="24" height="24" alt="" draggable="false" />
        </span>
        <strong class="mon-inspect-name">${escapeHtml(leader.nameKo)}</strong>
        <span class="mon-inspect-type">${escapeHtml(elementLabel(activeEl))}</span>
      </div>
      <div class="mon-inspect-meta-row">
        <span class="mon-inspect-lv">Lv.${active.level}</span>
        <div class="mon-inspect-exp" aria-hidden="true">
          <div class="mon-inspect-exp-track">
            <div class="mon-inspect-exp-fill" style="width:${levelPct}%"></div>
          </div>
        </div>
      </div>
      <div class="mon-inspect-stars-row">
        <span class="mon-evo">+${awaken}</span>
      </div>
    </div>
  </div>`;

  const detail = `<div class="mon-inspect el-${activeEl} sum-inspect">
    ${heroBlock}
    <div class="mon-inspect-shell sum-inspect-shell">
      <div class="mon-inspect-tabs mon-inspect-tabs--row mon-inspect-tabs--4 mon-inspect-tabs--compact" role="tablist" aria-label="detail">
        <button type="button" class="mon-side-tab${sumDetailTab === "info" ? " is-active" : ""}" data-sum-detail-tab="info" role="tab" aria-selected="${sumDetailTab === "info"}">${t("ui.tabInfo")}</button>
        <button type="button" class="mon-side-tab${sumDetailTab === "skills" ? " is-active" : ""}" data-sum-detail-tab="skills" role="tab" aria-selected="${sumDetailTab === "skills"}">${t("ui.2b47128fd2")}</button>
        <button type="button" class="mon-side-tab${sumDetailTab === "awaken" ? " is-active" : ""}" data-sum-detail-tab="awaken" role="tab" aria-selected="${sumDetailTab === "awaken"}">${t("ui.a2d1ab7b28")}</button>
        <button type="button" class="mon-side-tab${sumDetailTab === "gear" ? " is-active" : ""}" data-sum-detail-tab="gear" role="tab" aria-selected="${sumDetailTab === "gear"}">${t("ui.sumBookTabGear")}</button>
      </div>
      <div class="mon-inspect-body mon-inspect-body--full">
        <div class="mon-inspect-panel">${infoPanel}${skillsPanel}${awakenPanel}${gearPanel}</div>
      </div>
    </div>
  </div>`;

  const roster = save.summoners ?? createSummonerRoster();
  const rail = `<div class="sum-roster-rail" role="listbox" aria-label="${escapeHtml(t("nav.summoner"))}">
    ${SUMMONER_ELEMENTS.map((el) => {
      const p = roster[el];
      const on = el === activeEl;
      return `<button type="button" class="sum-rail-slot el-${el}${on ? " is-active" : ""}" data-select-summoner="${el}" role="option" aria-selected="${on ? "true" : "false"}" title="${escapeHtml(elementLabel(el))}">
        <img class="sum-rail-img" src="${summonerArtSrc(el)}" width="56" height="56" alt="" draggable="false" decoding="async" />
        <span class="sum-rail-lv">Lv.${p.level}</span>
        ${p.awaken > 0 ? `<span class="sum-rail-aw">+${p.awaken}</span>` : ""}
      </button>`;
    }).join("")}
  </div>`;

  const body = `<div class="hub-panel enhance-panel enhance-panel--desk">
    <div class="mon-book sum-book">
      <div class="mon-book-viewer">${detail}</div>
      ${rail}
    </div>
  </div>`;

  queueMicrotask(() => {
    enhanceFx = null;
  });

  return `<div class="hub-screen enhance-screen sum-screen">
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
        <h1 class="mon-topbar-title">${escapeHtml(t("nav.summoner"))}</h1>
        ${monTopbarCodexBtn()}
      </header>
      ${body}
    </div>
    ${renderCodexLayer()}
  </div>`;
}

function renderEnhance(): string {
  enhanceTab = "monsters";
  const dock: "roster" | "symbols" =
    forgeReveal || monBookDock === "symbols" ? "symbols" : "roster";

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

  const rosterSlotCap = ROSTER_SLOT_CAP;
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
        const starsHtml = monStarsHtml(
          displayedMonsterStars(
            def?.naturalStars ?? 1,
            m.awaken ?? 0,
          ),
        );

        const roleLabel = monsterRoleLabel(def?.role, def?.baseStats);
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
            ${monsterSkillArtImg(m.monsterId, si, sk, "mon-skill-ico-img", 44)}
            <span class="mon-skill-ico-lv">${maxSk ? "MAX" : `Lv.${lv}`}</span>
          </button>`;
          })
          .join("");

        const skillsMaxed = levels.every((lv) => lv >= MAX_SKILL_LEVEL);
        const skillDescLines = monsterSkillDescLines(focusSk);
        const skillUpNeedLv = skillUpMinMonsterLevel(focusLv);
        const skillUpLocked = m.level < skillUpNeedLv;
        const skillUpMana = skillUpManaCost(monSkillPick, focusLv);
        const skillMatHave = save.skillMats ?? 0;
        const skillUpLabel = skillsMaxed
          ? "MAX"
          : skillUpLocked
            ? escapeHtml(t("ui.monBookSkillUpNeedLv", { n: skillUpNeedLv }))
            : escapeHtml(t("ui.3e1a337d93"));
        const skillEnhanceBtn = `<button type="button" class="auth-btn-primary mon-book-enh mon-book-enh--rail mon-book-enh--cost" data-skill-up="${m.uid}" data-skill-idx="${monSkillPick}" ${skillsMaxed || skillUpLocked ? "disabled" : ""}>
            <span class="mon-enh-label">${skillUpLabel}</span>
            ${
              skillsMaxed || skillUpLocked
                ? ""
                : `<span class="mon-enh-cost"><img class="res-ico mon-enh-cost-ico" src="/art/ui/res/gold.svg" width="14" height="14" alt="" draggable="false" /><strong>${fmtRes(skillUpMana)}</strong><span class="muted"> · ${escapeHtml(t("res.skillMats"))} ${skillMatHave}/${SKILL_UP_MAT_COST}</span></span>`
            }
          </button>`;
        const skillFeedBtn = enhanceSkillFeedAllowed
          ? `<button type="button" class="auth-btn-ghost mon-book-enh mon-book-enh--rail" data-skill-feed-open="${m.uid}" ${skillsMaxed ? "disabled" : ""}>
            <span class="mon-enh-label">${escapeHtml(t("ui.monBookSkillFeedBtn"))}</span>
          </button>`
          : "";
        const skillsPanel = `<div class="mon-pane mon-pane--skills">
        <div class="mon-skill-rail">
          <div class="mon-skill-icos" role="tablist" aria-label="skills">${skillIcons}</div>
          ${skillEnhanceBtn}
          ${skillFeedBtn}
        </div>
        <div class="mon-skill-main">
          <div class="mon-skill-detail mon-skill-detail--tall">
            <div class="mon-skill-detail-head">
              <strong class="mon-skill-detail-name">${focusSk?.nameKo ?? `S${monSkillPick + 1}`}</strong>
              <span class="mon-skill-detail-lv">Lv.${focusLv}${focusLv >= MAX_SKILL_LEVEL ? " MAX" : ""}</span>
            </div>
            <p class="muted">${escapeHtml(
              t("ui.monBookSkillMats", {
                have: skillMatHave,
                need: SKILL_UP_MAT_COST,
              }),
            )}</p>
            ${
              skillsMaxed || skillUpLocked
                ? ""
                : `<p class="muted">${escapeHtml(
                    t("ui.monBookSkillUpCost", {
                      mana: skillUpMana,
                      mat: SKILL_UP_MAT_COST,
                    }),
                  )}</p>`
            }
            <ul class="mon-skill-detail-desc">
              ${skillDescLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
            </ul>
            <div class="mon-skill-upgrades">${monsterSkillUpgradeRows(focusSk, focusLv)}</div>
          </div>
        </div>
      </div>`;

        const monAwaken = m.awaken ?? 0;
        const awakenMax = monAwaken >= MAX_MONSTER_AWAKEN;
        const awakenNeedLv = monsterAwakenMinLevel(def?.naturalStars ?? 1);
        const awakenLocked = m.level < awakenNeedLv;
        const awakenMana = monsterAwakenManaCost(monAwaken);
        const awakenCrystal = monsterAwakenCrystalCost(monAwaken);
        const awakenMatNeed = monsterAwakenMatCost(monAwaken);
        const awakenMatHave = (save.awakenMats ?? {})[selectedEl] ?? 0;
        const awakenLabel = awakenMax
          ? t("ui.monBookAwakenMax")
          : awakenLocked
            ? t("ui.monBookAwakenNeedLv", { n: awakenNeedLv })
            : t("ui.monBookAwakenBtn");
        const evo = selectedEvo;
        const evoMax = evo >= MAX_EVOLVE;
        const evoNeedLv = evolveMinLevel(evo);
        const evoLocked = m.level < evoNeedLv;
        const evoMana = evolveManaCost(evo);
        const evoCrystal = evolveCrystalCost(evo);
        const evoLabel = evoMax
          ? t("ui.monBookEvolveMax")
          : evoLocked
            ? t("ui.monBookEvolveNeedLv", { n: evoNeedLv })
            : t("ui.monBookEvolveBtn", { n: evo + 1 });
        const evoCrystalNote =
          evoCrystal > 0
            ? ` · ${t("ui.5d0bf3b101")} ${evoCrystal}`
            : "";
        const awakenPanel = `<div class="mon-pane mon-pane--awaken">
        <div class="sum-awaken-card">
          <strong>+${monAwaken} / ${MAX_MONSTER_AWAKEN}</strong>
          <p class="muted">${escapeHtml(t("ui.monBookAwakenBonus"))}</p>
          <p class="muted">${escapeHtml(
            t("ui.monBookAwakenMats", {
              el: elLabel,
              have: awakenMatHave,
              need: awakenMatNeed,
            }),
          )}</p>
          ${
            awakenMax
              ? ""
              : `<p class="muted">${escapeHtml(
                  t("ui.monBookAwakenCost", {
                    mana: awakenMana,
                    crystal: awakenCrystal,
                    mat: awakenMatNeed,
                  }),
                )}</p>`
          }
          <button type="button" class="auth-btn-primary" data-mon-awaken="${m.uid}" ${
            awakenMax || awakenLocked ? "disabled" : ""
          }>${escapeHtml(awakenLabel)}</button>
        </div>
        <div class="sum-awaken-card" style="margin-top:0.75rem">
          <strong>E${evo} / ${MAX_EVOLVE}</strong>
          ${
            evoMax
              ? ""
              : `<p class="muted">${escapeHtml(
                  t("ui.monBookEvolveCost", {
                    mana: evoMana,
                    crystal: evoCrystalNote,
                  }),
                )}</p>`
          }
          <button type="button" class="auth-btn-primary" data-evo="${m.uid}" ${
            evoMax || evoLocked ? "disabled" : ""
          }>${escapeHtml(evoLabel)}</button>
        </div>
      </div>`;

        const symbolsPanel = `<div class="mon-pane mon-pane--symbols">
        <div class="mon-sym-viewer mon-sym-viewer--stack">
          <div class="mon-sym-viewer-equip">
            ${renderMonsterRuneCircle(m.uid)}
            <div class="rune-effect-block">
              <div class="rune-effect-head">
                <strong>${t("ui.effect")}</strong>
              </div>
              <div class="rune-effect-body">${renderSymbolSetBonusHtml(m.uid)}</div>
            </div>
          </div>
          <div class="mon-sym-viewer-inv">${renderSymbolInventoryGrid()}</div>
        </div>
      </div>`;

        const infoPanel = `<div class="mon-pane mon-pane--info">
          ${
            selectedPreview
              ? renderInspectCombatStatsHtml(selectedPreview)
              : `<div class="mon-book-stats mon-inspect-stats mon-inspect-stats--grid2x4" role="list"><div class="stat-cell" role="listitem"><span class="stat-cell-k">-</span><span class="stat-cell-v">-</span></div></div>`
          }
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
          monsterBattleArtImg(m.monsterId, "mon-preview-img", 120) ||
          `<span class="mon-inspect-art-fallback">${def?.element?.[0]?.toUpperCase() ?? "?"}</span>`;
        const levelPct = Math.max(
          0,
          Math.min(100, Math.round((m.level / MAX_MONSTER_LEVEL) * 100)),
        );
        const heroBlock = `<div class="mon-inspect-hero">
            <div class="mon-inspect-preview" data-mon-preview="${m.monsterId}">
              <div class="mon-preview-turntable" role="img" aria-label="${def?.nameKo ?? m.monsterId}">
                <div class="mon-preview-art">${previewArt}</div>
              </div>
            </div>
            <div class="mon-inspect-hero-info">
              <div class="mon-inspect-title-row">
                <span class="mon-el-ico mon-el-ico--${selectedEl}" title="${elLabel}" aria-label="${elLabel}">
                  <img class="mon-el-ico-img" src="${monsterElementArtSrc(selectedEl) ?? ""}" width="24" height="24" alt="" draggable="false" />
                </span>
                <strong class="mon-inspect-name">${def?.nameKo ?? m.monsterId}</strong>
                <span class="mon-inspect-type" title="${roleLabel}">${roleLabel}</span>
              </div>
              <div class="mon-inspect-meta-row">
                <span class="mon-inspect-lv">Lv.${m.level}</span>
                <div class="mon-inspect-exp" aria-hidden="true">
                  <div class="mon-inspect-exp-track">
                    <div class="mon-inspect-exp-fill" style="width:${levelPct}%"></div>
                  </div>
                </div>
              </div>
              <div class="mon-inspect-stars-row" aria-label="${def?.naturalStars ?? 0}">
                <span class="mon-inspect-stars">${starsHtml}</span>${selectedEvo > 0 ? `<span class="mon-evo">+${selectedEvo}</span>` : ""}
              </div>
            </div>
          </div>`;

        return `<div class="mon-inspect el-${selectedEl}">
      ${heroBlock}
      <div class="mon-inspect-shell">
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

  const symbolsDock = `<div class="mon-sym-grid">
      ${save.symbols.length
        ? [...save.symbols]
            .map((sym, i) => ({ sym, i }))
            .sort((a, b) => compareSymbolsByGradeDesc(a.sym, b.sym))
            .map(({ sym, i }) => {
              const imprintable = canImprintSymbol(sym);
              const grindable = canGrindSymbol(sym) && canAffordGrind();
              const worn = symbolWearer(sym.id);
              const rarity = symbolQualityMeta(sym.quality);
              const setDef = SYMBOL_SETS.find((x) => x.id === sym.setId);
              return `<div class="mon-sym-tile">
            <div class="mon-sym-main" title="${describeSymbol(sym)}">
              ${renderSymIco({
                setId: sym.setId,
                slot: sym.slot,
                enhance: sym.enhance,
                rarityId: rarity.id,
                stars: sym.stars,
                size: "sm",
              })}
              <span class="mon-sym-main-text">
                <strong class="mon-sym-name">${worn ? "E / " : ""}${setDef?.nameKo ?? sym.setId}</strong>
                <small>+${sym.enhance}${worn ? ` / ${worn}` : ""}</small>
              </span>
            </div>
            <div class="mon-sym-actions">
              <button type="button" class="secondary" data-grind="${i}" ${grindable ? "" : "disabled"}>${t("ui.c14c1b1bc6")}</button>
              <button type="button" class="secondary" data-imprint="${i}" ${imprintable ? "" : "disabled"}>${imprintable ? t("ui.8b41b055f7") : t("ui.b5f528925f")}</button>
              <button type="button" class="secondary" data-enhance-sym="${i}" ${sym.enhance >= MAX_SYMBOL_ENHANCE ? "disabled" : ""}>${t("ui.3e1a337d93")}</button>
              <button type="button" class="secondary sym-eq" data-equip-sym="${i}">${t("ui.818a75cd98")}</button>
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
          const grade = invGradeFromStars(starN);
          const starsHtml = monStarsHtml(starN);
          const art =
            monsterArtImg(m.monsterId, "mon-slot-img", 56) ||
            (def?.element?.[0]?.toUpperCase() ?? "?");
          return `<button type="button" class="mon-slot mon-slot--portrait inv-grade--${grade} el-${el}${on ? " is-active" : ""}" data-select-mon="${m.uid}" role="option" aria-selected="${on ? "true" : "false"}" title="${describeOwned(m)}">
        ${invGradePlateImg(grade, "mon-slot-grade-plate", 112)}
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
    ${renderSymbolBagExpandModal()}
    ${renderSymbolDetailModal()}
    ${renderSkillFeedModal()}
    ${monstersPanel}
  </div>`;
  queueMicrotask(() => {
    enhanceFx = null;
    const slot = app.querySelector<HTMLElement>(".mon-roster-dock .mon-slot.is-active");
    const rail = app.querySelector<HTMLElement>(".mon-roster-dock .mon-book-inv--rail");
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
        ${monTopbarCodexBtn()}
      </header>
      ${body}
    </div>
    ${renderCodexLayer()}
  </div>`;
}

function renderShopBody(): string {
  const shopSave = syncShopDay(save);
  const day = shopSave.shopDayKey ?? todayKey();
  const sold = new Set(shopSave.shopSoldIds ?? []);
  const dailyOffers = getDailyShopOffers(day);
  const dailyRows =
    dailyOffers
      .map((o) => {
        const gone = sold.has(o.id);
        const cost =
          o.costCrystal > 0
            ? `${MINUS}${t("ui.5d0bf3b101")} ${o.costCrystal}`
            : `${MINUS}${t("ui.dc78e6a251")} ${o.costMana}`;
        return `<button type="button" class="stage-card shop-offer${gone ? " is-maxed" : ""}" data-shop-offer="${o.id}" ${gone ? "disabled" : ""}>
          <span class="stage-card-mark" aria-hidden="true">${gone ? Mark.checkIn : Mark.summon}</span>
          <span class="stage-card-body">
            <strong>${o.labelKo} x${o.qty}</strong>
            <small>${gone ? t("ui.shop.soldOut") : cost}</small>
          </span>
        </button>`;
      })
      .join("") || `<p class="muted">${t("ui.shop.dailyOffers")}</p>`;
  const grindRows =
    save.symbols
      .map((s, i) => {
        if (!canGrindSymbol(s)) return "";
        const afford = canAffordGrind();
        return `<button type="button" class="stage-card" data-grind="${i}" ${afford ? "" : "disabled"}>
          <span class="stage-card-mark" aria-hidden="true">${Mark.grind}</span>
          <span class="stage-card-body">
            <strong>${describeSymbol(s)}</strong>
            <small>${t("ui.956df04e9a")} ${MIDDOT} ${grindCostLabel()} ${MIDDOT} ${t("ui.grindstoneHeld", { n: grindstoneCount(save) })}</small>
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
    `<p class="muted">${t('ui.b9c0de06ae')} (${t('ui.imprintSlotsHint')} ${t('ui.a05d718889')})</p>`;
  return `<div class="hub-panel shop-body">
    ${renderForgeReveal()}
    <p class="section-label">${t("ui.shop.dailyOffers")}</p>
    <div class="stage-list">${dailyRows}</div>
      <p class="section-label">${t('ui.079b50d844')}</p>
    <div class="stage-list">
      <button type="button" class="stage-card shop-offer shop-scroll" id="btn-buy-scroll-1">
        <span class="stage-card-mark" aria-hidden="true">1</span>
        <span class="stage-card-body">
          <strong>${t('ui.58c8d4982d')}</strong>
          <small>${MINUS}${t('ui.dc78e6a251')} ${SCROLL_BUY_MANA_COST} ${MIDDOT} ${t('ui.e41479e637')} ${save.scrolls}</small>
        </span>
      </button>
      <button type="button" class="stage-card shop-offer shop-scroll" id="btn-buy-scroll-5">
        <span class="stage-card-mark" aria-hidden="true">5</span>
        <span class="stage-card-body">
          <strong>${t('ui.544ebe1d37')}</strong>
          <small>${MINUS}${t('ui.dc78e6a251')} ${SCROLL_BUY_MANA_COST * 5}</small>
        </span>
      </button>
    </div>
    <p class="section-label">${t('ui.5515ca646d')}</p>
    <div class="stage-list">
      <button type="button" class="stage-card shop-offer" id="btn-buy-energy">
        <span class="stage-card-mark" aria-hidden="true">${Mark.energy}</span>
        <span class="stage-card-body">
          <strong>${t('ui.7154da110a')} +${ENERGY_BUY_AMOUNT}</strong>
          <small>${MINUS}${t('ui.5d0bf3b101')} ${ENERGY_CRYSTAL_COST}</small>
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
    <p class="section-label">${t('ui.d3a3c215c8')} (${t('ui.49758b94ae')}) · ${escapeHtml(t("ui.shop.grindstoneStock", { n: grindstoneCount(save) }))}</p>
    <div class="stage-list">${grindRows}</div>
    <p class="section-label">${t('ui.515ca5f235')} (${t('ui.imprintSlotsHint')})</p>
    <div class="stage-list">${imprintRows}</div>
  </div>`;
}

function renderShop(): string {
  return hubShell(
    t("nav.shop"),
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
  const buff = gloryBuffFromLevels(save.gloryLevels ?? {});
  const buffLine = `${t("ui.glory.buffSummary")}: ATK +${Math.round(buff.atkPct * 100)}% · DEF +${Math.round(buff.defPct * 100)}% · HP +${Math.round(buff.hpPct * 100)}% · SPD +${buff.spdFlat} · ${t("ui.dc78e6a251")} +${Math.round(buff.manaProdPct * 100)}%`;
  return hubShell(
    t("ui.hubGlory"),
    `${t('ui.14b961e9d3')} ${glory}`,
    `<div class="hub-panel">
    <div class="guild-panel glory-panel">
        <p class="guild-panel-title">${t("ui.hubGlory")}</p>
      <div class="guild-stats">
        <div class="guild-stat"><span>${t('ui.e41479e637')}</span><strong>${glory}</strong></div>
        <div class="guild-stat"><span>${t('ui.ad11613bb4')}</span><strong>${levels}/${maxTotal}</strong></div>
        <div class="guild-stat"><span>${t('ui.29efb69b57')}</span><strong>${GLORY_BUILDINGS.length}</strong></div>
      </div>
      <p class="muted stages-note">${buffLine}</p>
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
  const guildSave = syncGuildWeek(syncRaidWeek(save));
  const weekContrib = guildSave.guildWeekContrib ?? 0;
  const streak = guildSave.guildCheckInStreak ?? 0;
  const raidHp = guildSave.raidBossHp ?? RAID_BOSS_MAX_HP;
  const raidLeft = raidAttemptsRemaining(guildSave);
  const board = guildLeaderboard(guildSave)
    .map(
      (r, i) =>
        `<div class="guild-rank-row${r.self ? " self-rank" : ""}">
          <span class="guild-rank-n">${i + 1}</span>
          <span class="guild-rank-name">${r.name}${r.self ? ` (${Mark.me})` : ""}</span>
          <strong class="guild-rank-score">${r.contribution}</strong>
        </div>`,
    )
    .join("");
  const npcRows = GUILD_NPC_MEMBERS.map(
    (m) =>
      `<div class="guild-rank-row">
        <span class="guild-rank-n">${Mark.me}</span>
        <span class="guild-rank-name">${m.name}</span>
        <strong class="guild-rank-score">${m.roleKo}</strong>
      </div>`,
  ).join("");
  return `<div class="hub-panel community-body">
    <div class="guild-panel">
      <p class="guild-panel-title">${name ? name : t('ui.2a1d74bcdd')}</p>
      <div class="guild-stats">
        <div class="guild-stat"><span>${t('ui.fe2c5c3e7d')}</span><strong>${guildSave.guildContribution ?? 0}</strong></div>
        <div class="guild-stat"><span>${t('ui.332e9eedf2')}</span><strong>+${guildSave.guildRaidBest ?? 0}</strong></div>
        <div class="guild-stat"><span>${t('ui.937c424f40')}</span><strong>${guildSave.guildCheckInDay ?? EM_DASH}</strong></div>
        <div class="guild-stat"><span>${t("ui.guild.weeklyGoal")}</span><strong>${weekContrib}/${GUILD_WEEK_CONTRIB_GOAL}</strong></div>
        <div class="guild-stat"><span>${t("ui.guild.streak")}</span><strong>${streak}</strong></div>
        <div class="guild-stat"><span>${t("ui.guild.raidHp")}</span><strong>${raidHp}/${RAID_BOSS_MAX_HP}</strong></div>
        <div class="guild-stat"><span>${t("ui.guild.raidAttempts")}</span><strong>${raidLeft}/${RAID_ATTEMPTS_DAILY}</strong></div>
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
    <p class="section-label">${t("ui.guild.members")}</p>
    <div class="guild-board">${npcRows}</div>
    <p class="section-label">${t('ui.5515ca646d')}</p>
    <div class="guild-board">${board}</div>
  </div>`;
}

function renderGuild(): string {
  const name = save.guildName;
  return hubShell(
    t("ui.hubGuild"),
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
  const recipeRows = FUSION_RECIPES.map((recipe) => {
    const needCounts = new Map<string, number>();
    for (const id of recipe.fodderMonsterIds) {
      needCounts.set(id, (needCounts.get(id) ?? 0) + 1);
    }
    const available = new Map<string, string[]>();
    for (const m of save.roster) {
      const list = available.get(m.monsterId) ?? [];
      list.push(m.uid);
      available.set(m.monsterId, list);
    }
    const fodderUids: string[] = [];
    let ok = true;
    for (const [id, need] of needCounts) {
      const pool = [...(available.get(id) ?? [])];
      if (pool.length < need) {
        ok = false;
        break;
      }
      for (let n = 0; n < need; n++) fodderUids.push(pool.shift()!);
    }
    const keeper =
      save.roster.find((m) => !fodderUids.includes(m.uid)) ?? save.roster[0];
    const result = getMonster(recipe.resultMonsterId);
    const needLabel = recipe.fodderMonsterIds
      .map((id) => getMonster(id)?.nameKo ?? id)
      .join(" + ");
    const cost = recipe.manaCost ?? FUSION_MANA_COST;
    const disabled = !ok || !keeper;
    return `<button type="button" class="stage-card${disabled ? " is-maxed" : ""}" data-recipe-id="${recipe.id}" data-recipe-keeper="${keeper?.uid ?? ""}" data-recipe-fodder="${fodderUids.join(",")}" ${disabled ? "disabled" : ""}>
      <span class="stage-card-mark" aria-hidden="true">${Mark.fusion}</span>
      <span class="stage-card-body">
        <strong>${recipe.nameKo} → ${result?.nameKo ?? recipe.resultMonsterId}</strong>
        <small>${disabled ? t("ui.fusion.recipeNeed") : needLabel} ${MIDDOT} ${MINUS}${t("ui.dc78e6a251")} ${cost}</small>
      </span>
    </button>`;
  }).join("");
  return hubShell(
    t("ui.hubFusion"),
    `${t('ui.df9d336285')} ${MIDDOT} ${t('ui.d02987ca08')} +1 ${MIDDOT} ${MINUS}${t('ui.dc78e6a251')} ${FUSION_MANA_COST}`,
    `<div class="hub-panel">
    ${renderFusionReveal()}
    <div class="guild-panel fusion-panel">
        <p class="guild-panel-title">${t("ui.hubFusion")}</p>
      <p class="muted dojo-hint">${t('ui.7882865401')}.</p>
    </div>
    <p class="section-label">${t("ui.fusion.recipes")}</p>
    <div class="stage-list">${recipeRows || `<p class="muted">${t("ui.fusion.recipeNeed")}</p>`}</div>
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

function stageAppearingMons(stage: StageDef): string {
  const ids = [...new Set(stage.enemyMonsterIds)].slice(0, 6);
  if (!ids.length) return "";
  const icons = ids
    .map((id) => {
      const m = getMonster(id);
      const name = m?.nameKo ?? id;
      const grade = invGradeFromStars(m?.naturalStars ?? 1);
      return `<span class="stage-sortie-mon inv-grade--${grade}" title="${name}">
        ${monsterArtImg(id, "stage-sortie-mon-img", 32) || `<span class="stage-sortie-mon-fallback">${name.slice(0, 1)}</span>`}
      </span>`;
    })
    .join("");
  return `<div class="stage-sortie-mons" aria-label="${t("ui.stageAppearing")}">${icons}</div>`;
}

function stageListMarker(stage: StageDef, idx: number): string {
  if (stage.mode === "scenario") return `${stage.map}-${stage.stage}`;
  if (stage.mode === "depth" || stage.mode === "equip") return String(stage.stage);
  return String(stage.stage > 0 ? stage.stage : idx + 1);
}

function stageButtons(list: StageDef[], opts?: { equipWeekly?: boolean }): string {
  const vaultLeft = opts?.equipWeekly
    ? equipVaultRemaining(syncEquipVaultWeek(save))
    : null;
  const energyNow = Math.floor(save.island.energy);
  return list
    .map((s, idx) => {
      const locked =
        !isStageUnlocked(save, s.id) ||
        (vaultLeft !== null && vaultLeft <= 0);
      const done = save.clearedStages.includes(s.id);
      const diffOpen = isDifficultyOpen(s, stageEntryDiff);
      const cost = stageEnergyCost(s, stageEntryDiff);
      const canFight = !locked && diffOpen && (cost <= 0 || energyNow >= cost);
      const short = cost > energyNow && diffOpen;
      const marker = stageListMarker(s, idx);
      const costLabel = String(cost);
      const battleAria = !diffOpen
        ? t("ui.4292516afd")
        : `${marker} ${s.nameKo} ${MIDDOT} ${t("ui.stageBattle")} ${MIDDOT} ${t("ui.7dcdb553c8")} ${costLabel}`;
      const status = stageUnlockLabel(save, s);
      const rowTitle =
        vaultLeft !== null
          ? `${s.nameKo} · ${t("ui.9cbaf58b88")} ${vaultLeft}/${EQUIP_VAULT_WEEKLY_LIMIT}`
          : `${s.nameKo} · ${status}`;
      return `<div class="stage-sortie${done ? " is-cleared" : ""}${locked ? " is-locked" : ""}${!canFight ? " is-disabled" : ""}" title="${escapeHtml(rowTitle)}">
        <span class="stage-sortie-mark${done ? " is-done" : ""}" aria-hidden="true">
          ${done ? `<span class="stage-sortie-check">${CHECK}</span>` : ""}
          <strong>${escapeHtml(marker)}</strong>
        </span>
        ${stageAppearingMons(s)}
        <button type="button" class="stage-sortie-battle${short ? " is-short" : ""}" data-stage="${s.id}" aria-label="${escapeHtml(battleAria)}" title="${!diffOpen ? t("ui.4292516afd") : escapeHtml(status)}" ${canFight ? "" : "disabled"}>
          <span class="stage-sortie-cost" aria-hidden="true"><strong>${costLabel}</strong></span>
          <span class="stage-sortie-battle-label">${t("ui.stageBattle")}</span>
        </button>
      </div>`;
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
  arena?: boolean;
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
      arena?: boolean;
    }
  > = {
    depth: { name: t('ui.cd2bb578b4'), blurb: t('ui.7316fbbfa6'), stages: DEPTH_STAGES },
    arena: {
      name: t('ui.262553905b'),
      blurb: t('ui.be1af5568b'),
      stages: ARENA_STAGES,
      arena: true,
    },
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
      arena: meta.arena,
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
function applyStagesRegionOpen(opts?: { animate?: boolean }): void {
  const animate = opts?.animate !== false;
  const host = app.querySelector<HTMLElement>("#stages-region-host");
  if (!host) return;

  app.querySelectorAll<HTMLButtonElement>("[data-region]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.region === stagesRegion);
  });
  app.classList.toggle("stage-prep-open", view === "stages" && !!stageEntryId);

  const selected = stagesRegion
    ? stagesRegions().find((r) => r.id === stagesRegion) ?? null
    : null;
  if (!selected && !stageEntryId) {
    host.innerHTML = "";
    return;
  }
  if (selected && !regionDifficultyOpen(selected, stageEntryDiff)) {
    stageEntryDiff = "normal";
  }
  const sheet = selected && !stageEntryId ? renderStagesRegionSheet(selected) : "";
  const prep = stageEntryId ? renderStageEntryModal() : "";
  host.innerHTML = `${sheet}${prep}`;
  const layer = host.querySelector<HTMLElement>(
    stageEntryId ? ".stage-prep-layer" : ".stages-region-layer",
  );
  if (animate) {
    if (layer) replayModalPop(layer);
  } else {
    suppressStageModalAnim(host);
  }
  if (selected && !stageEntryId) bindStagesRegionSheet();
  if (stageEntryId) bindStageEntryModal();
}

function bindStagesRegionSheet(): void {
  const host = app.querySelector("#stages-region-host");
  if (!host) return;
  ensureModalXDelegate();

  host.querySelector("#btn-region-close")?.addEventListener("click", () => {
    stagesRegion = null;
    stageEntryId = null;
    stagesDropInfoOpen = false;
    stagesDropSetExpand = false;
    applyStagesRegionOpen();
  });

  host.querySelector("#btn-region-drop-info")?.addEventListener("click", () => {
    stagesDropInfoOpen = !stagesDropInfoOpen;
    if (stagesDropInfoOpen) {
      stagesDropTab = "scroll";
      stagesDropSetExpand = false;
      applyStageDropInfo({ animate: true });
    } else {
      stagesDropSetExpand = false;
      applyStageDropInfo();
    }
  });

  if (stagesDropInfoOpen) bindStageDropInfoControls(host);

  host.querySelector("#region-diff-select")?.addEventListener("change", (ev) => {
    const v = (ev.target as HTMLSelectElement).value as StageDifficulty;
    if (v === "normal" || v === "hard" || v === "hell") {
      stageEntryDiff = v;
      applyStagesRegionOpen({ animate: false });
    }
  });

  host.querySelectorAll<HTMLButtonElement>("[data-stage]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stage = getStage(btn.dataset.stage!);
      if (stage) openStagePrep(stage);
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
      applyStagesRegionOpen({ animate: false });
    });
  });

  host.querySelector("#btn-season-claim")?.addEventListener("click", () => {
    const r = runClaimSeasonReward(save);
    save = r.save;
    persist();
    flash(r.message);
    applyStagesRegionOpen({ animate: false });
  });
}

function regionPrimaryDropSet(region: StagesRegion): (typeof SYMBOL_SETS)[number] | null {
  const counts = new Map<string, number>();
  for (const s of region.stages) {
    counts.set(s.dropSetId, (counts.get(s.dropSetId) ?? 0) + 1);
  }
  let bestId = region.stages[0]?.dropSetId;
  let bestN = 0;
  for (const [id, n] of counts) {
    if (n > bestN) {
      bestId = id as typeof bestId;
      bestN = n;
    }
  }
  if (!bestId) return null;
  return SYMBOL_SETS.find((x) => x.id === bestId) ?? null;
}

function stageDropInfoRow(opts: {
  icon: string;
  name: string;
  sub?: string;
}): string {
  return `<div class="stage-drop-info-row">
    <span class="stage-drop-info-ico" aria-hidden="true"><img src="${opts.icon}" width="44" height="44" alt="" draggable="false" /></span>
    <span class="stage-drop-info-copy">
      <strong>${opts.name}</strong>
      ${opts.sub ? `<small>${opts.sub}</small>` : ""}
    </span>
  </div>`;
}

function renderStageDropInfoModal(region: StagesRegion): string {
  if (!stagesDropInfoOpen) return "";
  const set = regionPrimaryDropSet(region);
  const setBonus = set
    ? t("ui.stageDropSetBonus", { n: set.pieces, effect: set.effectKo })
    : t("ui.setBonusNone");
  const setIco = set ? symbolSetArtSrc(set.id) : symbolEmptySlotArtSrc(1);
  const setIcoFallback = set
    ? symbolSetArtFallbackSrc(set.id)
    : symbolEmptySlotArtFallbackSrc(1);
  const setName = set?.nameKo ?? "—";
  const pieceExpand = stagesDropSetExpand && set
    ? `<div class="stage-drop-info-pieces">${[1, 2, 3, 4, 5, 6]
        .map(
          (slot) =>
            `<span class="stage-drop-info-piece" title="${t("ui.stageDropPiece", { name: set.nameKo, slot })}">
              ${symbolArtImg(set.id, slot, "", 36)}
              <small>${set.nameKo}${slot}</small>
            </span>`,
        )
        .join("")}</div>`
    : "";

  const scrollRows = [
    stageDropInfoRow({
      icon: scrollArtSrc("normal"),
      name: t("ui.stageDropScrollNormal"),
    }),
  ];
  if (stageEntryDiff === "hard" || stageEntryDiff === "hell") {
    scrollRows.push(
      stageDropInfoRow({
        icon: scrollArtSrc("premium"),
        name: t("ui.stageDropScrollPremium"),
      }),
    );
  }

  const gearSlotIds: GearSlot[] = [...GEAR_SLOTS];
  const gearRows = [
    stageDropInfoRow({
      icon: "/art/ui/gear/weapon.svg",
      name: t("ui.stageDropGearRandom"),
      sub: t("ui.stageDropGearRandomHint"),
    }),
    ...gearSlotIds.map((slot) =>
      stageDropInfoRow({
        icon: gearSlotArtSrc(slot),
        name: gearSlotLabel(slot),
      }),
    ),
  ];

  const bodyRows =
    stagesDropTab === "gear" ? gearRows.join("") : scrollRows.join("");

  return `<div class="stage-drop-info-layer" id="stage-drop-info-layer" role="presentation">
    <button type="button" class="stage-drop-info-backdrop" id="btn-stage-drop-info-close" aria-label="${t("ui.94b7dba159")}"></button>
    <div class="stage-drop-info-modal" role="dialog" aria-modal="true" aria-labelledby="stage-drop-info-title">
      ${modalCloseX(t("ui.94b7dba159"), "btn-stage-drop-info-close")}
      <h2 class="sr-only" id="stage-drop-info-title">${t("ui.stageDropInfo")}</h2>

      <section class="stage-drop-info-block">
        <div class="stage-drop-info-tabs stage-drop-info-tabs--solo">
          <span class="stage-drop-info-tab is-on">${t("ui.60fbf51b13")}</span>
        </div>
        <div class="stage-drop-info-panel">
          <div class="stage-drop-info-row stage-drop-info-row--set">
            <span class="stage-drop-info-ico" aria-hidden="true"><img src="${setIco}" width="44" height="44" alt="" draggable="false"${setIcoFallback ? ` onerror="this.onerror=null;this.src='${setIcoFallback}'"` : ""} /></span>
            <span class="stage-drop-info-copy">
              <strong>${setName}</strong>
              <small>${setBonus}</small>
            </span>
            <button type="button" class="stage-drop-info-more${stagesDropSetExpand ? " is-on" : ""}" id="btn-stage-drop-set-more" aria-expanded="${stagesDropSetExpand ? "true" : "false"}" aria-label="${t("ui.stageDropSetMore")}" title="${t("ui.stageDropSetMore")}">
              <span aria-hidden="true">${MIDDOT}${MIDDOT}${MIDDOT}</span>
            </button>
          </div>
          ${pieceExpand}
        </div>
      </section>

      <section class="stage-drop-info-block">
        <div class="stage-drop-info-tabs" role="tablist" aria-label="${t("ui.stageDropInfo")}">
          <button type="button" class="stage-drop-info-tab${stagesDropTab === "scroll" ? " is-on" : ""}" role="tab" aria-selected="${stagesDropTab === "scroll" ? "true" : "false"}" data-drop-tab="scroll">${t("ui.fa73f3a42f")}</button>
          <button type="button" class="stage-drop-info-tab${stagesDropTab === "gear" ? " is-on" : ""}" role="tab" aria-selected="${stagesDropTab === "gear" ? "true" : "false"}" data-drop-tab="gear">${t("ui.stageDropGear")}</button>
        </div>
        <div class="stage-drop-info-panel" role="tabpanel">
          ${bodyRows}
        </div>
      </section>
    </div>
  </div>`;
}

function renderStagesRegionSheet(region: StagesRegion): string {
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
    const raidSave = syncRaidWeek(save);
    extras = `<p class="stages-note">${t('ui.fe2c5c3e7d')} ${save.guildContribution ?? 0} ${MIDDOT} ${t('ui.3ea974d72f')} +${save.guildRaidBest ?? 0} ${MIDDOT} ${t("ui.guild.raidHp")} ${raidSave.raidBossHp ?? RAID_BOSS_MAX_HP}/${RAID_BOSS_MAX_HP} ${MIDDOT} ${t("ui.guild.raidAttempts")} ${raidAttemptsRemaining(raidSave)}/${RAID_ATTEMPTS_DAILY}</p>`;
  }
  if (region.arena) {
    const attacksLeft = arenaAttacksRemaining(save);
    const def = save.arenaDefense;
    const defLabel = def
      ? `${def.party.length}${t("ui.arena.defenseSet")}`
      : t("ui.arena.defenseEmpty");
    extras = `<div class="season-panel">
        <p class="season-panel-title">${t("ui.arena.attacksLeft")} ${attacksLeft}/${ARENA_ATTACKS_DAILY}</p>
        <p class="muted stages-note">${t("ui.arena.setDefense")}: ${defLabel}</p>
        <button type="button" class="auth-btn-primary full" id="btn-arena-defense">${t("ui.arena.setDefense")}</button>
      </div>`;
  }
  if (region.id === "cadence") {
    const openNames = WEEKDAY_STAGES.filter((s) =>
      isWeekdayStageOpenToday(s.id),
    )
      .map((s) => s.nameKo)
      .join(` ${MIDDOT} `);
    const openLine = openNames
      ? `${t("ui.weekdayOpenToday")}: ${openNames}`
      : t("ui.weekdayClosedToday");
    extras = `<p class="stages-note">${escapeHtml(openLine)}</p><p class="muted stages-note">${escapeHtml(t("ui.weekdaySchedule"))}</p>${
      (save.trialTokens ?? 0) > 0
        ? `<p class="muted stages-note">${t("ui.trial.tokens")}: ${save.trialTokens}${save.trialTitleUnlocked ? ` ${MIDDOT} ${t("ui.trial.titleOn")}` : ""}</p>`
        : ""
    }`;
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
    <div class="stages-region-sheet stages-region-sheet--card stages-region-sheet--sortie stages-region-sheet--${region.tone}" data-diff="${stageEntryDiff}" role="dialog" aria-modal="true" aria-labelledby="stages-region-title">
      ${modalCloseX(t("ui.94b7dba159"), "btn-region-close")}
      <header class="stages-region-head stages-region-head--sortie">
        <h2 class="stages-region-title stages-region-title--sortie" id="stages-region-title">${regionTitle}</h2>
        <label class="stages-region-diff-inline stages-region-diff-inline--sortie">
          <span class="stages-region-diff-label">${t("ui.stageDiff")}</span>
          <select class="stages-region-diff-select stages-region-diff-select--${stageEntryDiff}" id="region-diff-select" aria-label="${t('ui.1a3b3223e1')}" title="${diffMeta.blurb}">
            ${diffOptions}
          </select>
        </label>
        <div class="stages-region-tools">
          <button type="button" class="stages-region-drop-btn${stagesDropInfoOpen ? " is-on" : ""}" id="btn-region-drop-info" aria-pressed="${stagesDropInfoOpen ? "true" : "false"}">${t("ui.stageDropInfo")}</button>
          <div class="stages-region-tools-stats">
            <span class="stages-region-status-chip stages-region-status-chip--energy" title="${escapeHtml(t("res.energy"))}">
              <img class="res-ico" src="/art/ui/res/energy.svg" width="16" height="16" alt="" draggable="false" />
              <strong>${energyNow}/${energyMax}</strong>
            </span>
          </div>
        </div>
      </header>
      ${extras}
      <div class="stage-list stage-list--expedition">${stageButtons(region.stages, { equipWeekly: region.equipWeekly })}</div>
    </div>
    ${renderStageDropInfoModal(region)}
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
  const mission =
    battle.modules.moduleG && !battle.finishReason
      ? ` ${MIDDOT} ${t('ui.511fa65e38')} ${battle.brilliantCount}/${battle.brilliantGoal}${battle.brilliantDone ? CHECK : ""}`
      : "";
  const boardTag =
    battle.boards.length > 1 ? ` ${MIDDOT} ${battle.boardLabel}` : "";
  const ampHot =
    shapeFlashIds.length > 0 && Date.now() < shapeFlashUntil
      ? " is-hot"
      : "";
  const shapeChip =
    ampHot && shapeFlashIds.length
      ? ` ${MIDDOT} <span class="battle-shape-chip">${shapeFlashIds
          .map((id) => {
            const key =
              id === "corner"
                ? "ui.shape.corner"
                : id === "star"
                  ? "ui.shape.star"
                  : id === "star_control"
                    ? "ui.shape.star_control"
                    : id === "tiger"
                      ? "ui.shape.tiger"
                      : id === "kosumi"
                        ? "ui.shape.kosumi"
                        : "ui.shape.axis";
            return escapeHtml(t(key));
          })
          .join(` ${MIDDOT} `)}</span>`
      : "";
  const status = battle.finishReason
    ? battle.finishReason === "ally_win"
      ? t('ui.ba130f3539')
      : t('ui.8d9e9106fa')
    : `${battle.phase} ${MIDDOT} <span class="battle-amp-chip${ampHot}">amp ${battle.currentAmplify().toFixed(2)}/${battle.powerAmplifyCap().toFixed(2)}</span>${shapeChip} ${MIDDOT} ${phaseLabel} (${battle.circle.stoneSummonCount}/${battle.circle.resetThreshold})${mission}${boardTag}`;

  const hasSkillPick =
    awaitSkill &&
    (selectedSkillIndex != null || selectedSummonerSkill != null);
  const skillHint =
    battle.phase === "await_stone" && active?.team === "ally"
      ? t("ui.62b39a7abd")
      : awaitShop
        ? t("ui.e724206861")
        : awaitSkill
          ? hasSkillPick
            ? t("ui.battlePickEnemy")
            : t("ui.battlePickSkill")
          : autoMode
            ? `AUTO x${battleSpeed}`
            : "";

  const showBoardSwitch =
    battle.boards.length > 1 &&
    battle.phase === "await_stone" &&
    active?.team === "ally" &&
    !autoMode;
  const utilRow =
    showBoardSwitch
      ? `<div class="battle-util-row">
        <button type="button" class="secondary board-switch" id="btn-board-switch">${t("ui.bf185333fe")} ${battle.boardLabel === t("ui.8bbc778e36") ? `${ARROW_RIGHT}B` : `${ARROW_RIGHT}A`}</button>
      </div>`
      : "";

  const stageTitle = escapeHtml(currentStage.nameKo);

  return `<div class="battle-screen battle-screen--enter">
    ${battleSkyHtml(currentStage)}
    <header class="battle-chrome">
      ${renderBattleTicker()}
      <div class="battle-stage-pill" title="${stageTitle}">
        <strong class="battle-stage-name">${stageTitle}</strong>
        <span class="battle-wave">${currentStage.boardSize}${TIMES}${currentStage.boardSize} (${battle.currentWave}/${battle.totalWaves})</span>
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
      ${renderCaptureShop()}
    </div>
    <div class="battle-lane ally">
      ${renderBattleFront(allyUnits, "ally")}
    </div>
    ${utilRow}
    ${skillHint ? `<p class="skill-hint">${skillHint}</p>` : ""}
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

/** Snapshot unit art nodes (incl. spine hosts) before a soft battle DOM rebuild. */
function captureBattleArtMap(root: ParentNode): Map<string, HTMLElement> {
  const map = new Map<string, HTMLElement>();
  root.querySelectorAll<HTMLElement>(".battle-unit[data-unit]").forEach((unit) => {
    const id = unit.dataset.unit;
    const art = unit.querySelector<HTMLElement>(".battle-unit-art");
    if (id && art) map.set(id, art);
  });
  return map;
}

/** Reattach preserved art when src matches so images/spine do not remount. */
function restoreBattleArt(
  root: ParentNode,
  arts: Map<string, HTMLElement>,
): void {
  root.querySelectorAll<HTMLElement>(".battle-unit[data-unit]").forEach((unit) => {
    const id = unit.dataset.unit;
    if (!id) return;
    const prev = arts.get(id);
    const next = unit.querySelector<HTMLElement>(".battle-unit-art");
    if (!prev || !next || prev === next) return;
    const prevSrc = prev.querySelector("img")?.getAttribute("src");
    const nextSrc = next.querySelector("img")?.getAttribute("src");
    if (prevSrc && prevSrc === nextSrc) next.replaceWith(prev);
  });
}

/**
 * Patch the live battle screen in place (no app.innerHTML wipe).
 * Preserves sky BG + unit art/spine so combat does not "flash refresh".
 */
function refreshBattleView(): boolean {
  if (view !== "battle" || !battle || !currentStage) return false;
  const screen = app.querySelector<HTMLElement>(".battle-screen");
  if (!screen) return false;

  const allyMana = battle.allySummoner;
  const manaPct = Math.round((allyMana.mana / allyMana.manaMax) * 100);
  const arts = captureBattleArtMap(screen);
  const sky = screen.querySelector<HTMLElement>(".battle-sky");

  const wrap = document.createElement("div");
  wrap.innerHTML = renderBattle(manaPct);
  const next = wrap.firstElementChild as HTMLElement | null;
  if (!next) return false;

  // Drop enter animation on subsequent soft updates
  next.classList.remove("battle-screen--enter");
  screen.classList.remove("battle-screen--enter");

  const nextSky = next.querySelector(".battle-sky");
  if (sky && nextSky) nextSky.replaceWith(sky);

  screen.replaceChildren(...Array.from(next.childNodes));
  restoreBattleArt(screen, arts);
  bindBattleInteractive();
  mountUnitAnimHooks(screen);
  return true;
}

/** Rebind combat controls after a soft battle DOM patch. */
function bindBattleInteractive(): void {
  app.querySelector("#btn-board-switch")?.addEventListener("click", () => {
    if (!battle) return;
    if (!battle.switchBoard(t("ui.a9034f7e3d"))) return;
    refreshLegal();
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-board-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!battle || battle.boards.length < 2) return;
      const idx = Number(btn.dataset.boardTab);
      if (!Number.isFinite(idx) || idx === battle.activeBoardIndex) return;
      if (!battle.switchBoard(t("ui.a9034f7e3d"))) return;
      refreshLegal();
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-shop]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!battle) return;
      const choice = btn.dataset.shop as CaptureShopChoice;
      if (!battle.chooseCaptureShop(choice)) return;
      void resolveCombatUntilAllyInput();
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
      if (
        !battle ||
        battle.phase !== "await_skill" ||
        autoMode ||
        battleFxBusy
      ) {
        render();
        return;
      }
      const unit = battle.activeUnitId
        ? battle.getUnit(battle.activeUnitId)
        : null;
      if (!unit || unit.team !== "ally") {
        render();
        return;
      }
      if (selectedSummonerSkill && summonerSkillNeedsEnemyTarget(selectedSummonerSkill)) {
        castSkill(selectedSummonerSkill, selectedTargetId ?? undefined);
        return;
      }
      if (selectedSkillIndex != null) {
        castSkill(selectedSkillIndex, selectedTargetId ?? undefined);
        return;
      }
      flash(t("ui.battlePickSkill"));
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-skill]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (!battle || battle.phase !== "await_skill" || autoMode || battleFxBusy)
        return;
      const idx = Number(btn.dataset.skill);
      if (!Number.isFinite(idx)) return;
      selectedSummonerSkill = null;
      selectedSkillIndex = selectedSkillIndex === idx ? null : idx;
      render();
    });
  });

  app
    .querySelectorAll<HTMLButtonElement>("[data-summoner-skill]")
    .forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (
          !battle ||
          battle.phase !== "await_skill" ||
          autoMode ||
          battleFxBusy
        )
          return;
        const id = btn.dataset.summonerSkill as BattleSummonerSkillId | undefined;
        if (!id) return;
        selectedSkillIndex = null;
        if (summonerSkillNeedsEnemyTarget(id)) {
          selectedSummonerSkill =
            selectedSummonerSkill === id ? null : id;
          render();
          return;
        }
        // Buff / board skills: cast immediately (no enemy tap).
        selectedSummonerSkill = id;
        castSkill(id);
      });
    });

  app.querySelector("#btn-speed")?.addEventListener("click", () => {
    battleSpeed = battleSpeed === 1 ? 2 : battleSpeed === 2 ? 3 : 1;
    render();
    if (autoMode) scheduleAuto();
  });

  app.querySelector("#btn-auto-toggle")?.addEventListener("click", () => {
    if (!battle || battle.finishReason) return;
    autoMode = !autoMode;
    if (autoMode) {
      clearBattleSkillSelection();
      scheduleAuto();
    } else clearAutoTimer();
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
    lastScrollPremiumGain = 0;
    dmgFloats = [];
    clearBattleSkillSelection();
    view = "stages";
    render();
  });
}

function bindAuth(): void {
  bindAuthPwaInstall();

  app.querySelectorAll<HTMLAnchorElement>("[data-auth-legal]").forEach((a) => {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      const kind = a.dataset.authLegal;
      if (kind === "privacy" || kind === "terms") {
        authUi.pane = kind;
        history.replaceState(null, "", `#${kind}`);
        render();
      }
    });
  });

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
    if (location.hash === "#privacy" || location.hash === "#terms") {
      history.replaceState(null, "", location.pathname + location.search);
    }
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
        const res = await fetch(apiUrl(path), {
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

  app.querySelectorAll<HTMLElement>("[data-b]").forEach((btn) => {
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
          setIslandSpotMenu(null);
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
  ensureModalXDelegate();

  if (view === "auth") {
    bindAuth();
    return;
  }

  if (view === "home" || isFacilityView()) {
    if (!preserveIslandDom) {
      bindIslandPan();
      bindIslandLayoutEdit();
    }
  }
  bindChatUi();

  app.querySelector("#btn-nav-summoner")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    summonerPickerOpen = false;
    applySummonerPickerOpen();
    settingsOpen = false;
    mailboxOpen = false;
    notifOpen = false;
    missionOpen = false;
    communityOpen = false;
    shopOpen = false;
    resMoreOpen = false;
    closeChatOverlay();
    applySettingsOpen();
    applyMailboxOpen();
    applyNotifOpen();
    applyMissionOpen();
    applyCommunityOpen();
    applyShopOpen();
    applyResMoreOpen();
    if (view === "summoner") {
      view = "home";
    } else {
      view = "summoner";
      sumDetailTab = "info";
      codexOpen = false;
    }
    partyDraft = null;
    render();
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
      closeBuildingInfoSoft();
      setIslandSpotMenu(null);
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
      const layer = app.querySelector("#mission-layer");
      if (layer && (view === "home" || isFacilityView())) {
        // Soft-refresh mission body only — keep island mounted.
        renderPreservingIsland();
        missionOpen = true;
        applyMissionOpen();
        return;
      }
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-mission-claim]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.missionClaim;
      if (!id) return;
      const r = runClaimDailyMission(save, id);
      save = r.save;
      persist();
      flash(r.message);
      renderPreservingIsland();
      missionOpen = true;
      applyMissionOpen();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-mail-claim]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.mailClaim;
      if (!id) return;
      const r = runClaimMail(save, id);
      save = r.save;
      persist();
      flash(r.message);
      renderPreservingIsland();
      mailboxOpen = true;
      applyMailboxOpen();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-mission-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nav = btn.dataset.missionGo;
      if (!nav) return;
      missionOpen = false;
      applyMissionOpen();
      if (nav === "guild") {
        openCommunityModalSoft();
        return;
      }
      if (nav === "shop") {
        openShopModalSoft();
        return;
      }
      communityOpen = false;
      shopOpen = false;
      applyCommunityOpen();
      applyShopOpen();
      const next = nav as View;
      const stayOnIsland =
        (view === "home" || isFacilityView(view)) &&
        (next === "home" || isFacilityView(next)) &&
        Boolean(app.querySelector(".home-island"));
      view = next;
      if (stayOnIsland) renderPreservingIsland();
      else render();
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
      closeBuildingInfoSoft();
      setIslandSpotMenu(null);
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
      closeBuildingInfoSoft();
      setIslandSpotMenu(null);
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
      applySettingsOpen();
      applyMailboxOpen();
      applyNotifOpen();
      applySummonerPickerOpen();
      applyResMoreOpen();
      applyMissionOpen();
      applyCommunityOpen();
      applyShopOpen();
      closeChatOverlay();
      const nav = btn.dataset.nav;
      if (nav === "guild") {
        openCommunityModalSoft();
        return;
      }
      if (nav === "shop") {
        if (view === "result" || view === "battle") {
          autoMode = false;
          clearAutoTimer();
          battle = null;
          dmgFloats = [];
          view = "home";
          render();
        }
        openShopModalSoft();
        return;
      }
      if (view === "result" || view === "battle") {
        autoMode = false;
        clearAutoTimer();
        if (nav !== "battle" && nav !== "result") {
          battle = null;
          dmgFloats = [];
          if (nav === "home" || nav === "enhance" || nav === "shop" || nav === "party" || nav === "summoner") {
            if (nav === "home") {
              currentStage = null;
              lastReward = null;
              lastScrollGain = 0;
              lastScrollPremiumGain = 0;
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
      if ((view === "home" || isFacilityView()) && nav !== "home" && islandLayoutEdit) {
        if (islandLayoutDraft) writeIslandLayout(islandLayoutDraft);
        islandLayoutEdit = false;
        islandLayoutDraft = null;
        islandSpotDrag = null;
        clearIslandLongPress();
      }
      if (nav === "enhance") {
        enhanceTab = "monsters";
        enhanceSkillFeedAllowed = false;
      }
      if (nav === "home") {
        enhanceSkillFeedAllowed = false;
        skillFeedModalOpen = false;
        skillFeedFodderUid = null;
      }
      if (nav === "enhance" || nav === "home" || nav === "summoner") {
        codexOpen = false;
        codexDetailMonsterId = null;
      }
      const next = nav as View;
      const stayOnIsland =
        (view === "home" || isFacilityView(view)) &&
        (next === "home" || isFacilityView(next)) &&
        Boolean(app.querySelector(".home-island"));
      view = next;
      if (stayOnIsland) renderPreservingIsland();
      else render();
    });
  });

  app.querySelectorAll<HTMLElement>("[data-collect]").forEach((btn) => {
    if (preserveIslandDom) return;
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

  app.querySelectorAll<HTMLElement>("[data-b]").forEach((btn) => {
    if (preserveIslandDom) return;
    btn.addEventListener("click", (ev) => {
      const target = ev.target as HTMLElement | null;
      if (target?.closest?.("[data-spot-enter], [data-spot-info], [data-collect]")) {
        return;
      }
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
      if (!id) return;
      setIslandSpotMenu(islandSpotMenuId === id ? null : id);
    });
  });

  if (!preserveIslandDom) {
    app.querySelectorAll<HTMLButtonElement>("[data-spot-enter]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (app.querySelector("#island-viewport")?.getAttribute("data-pan-moved") === "1") return;
        const id = btn.dataset.spotEnter;
        if (!id) return;
        enterIslandBuilding(id);
      });
    });
    app.querySelectorAll<HTMLButtonElement>("[data-spot-info]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (app.querySelector("#island-viewport")?.getAttribute("data-pan-moved") === "1") return;
        const id = btn.dataset.spotInfo;
        if (!id) return;
        openBuildingInfoSoft(id);
      });
    });
    const viewport = app.querySelector<HTMLElement>("#island-viewport");
    viewport?.addEventListener("click", (ev) => {
      if (islandLayoutEdit || !islandSpotMenuId) return;
      const target = ev.target as HTMLElement | null;
      if (target?.closest?.("[data-b], [data-spot-enter], [data-spot-info], [data-collect]")) {
        return;
      }
      if (viewport.getAttribute("data-pan-moved") === "1") return;
      setIslandSpotMenu(null);
    });
  } else {
    applyIslandSpotMenu();
  }

  const closeBuildingInfo = () => closeBuildingInfoSoft();
  app.querySelector("#btn-building-info-close")?.addEventListener("click", closeBuildingInfo);

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
      skillFeedModalOpen = false;
      skillFeedFodderUid = null;
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
        if (raw !== "symbols") symbolInvFilterOpen = null;
        enhanceTab = "monsters";
        if (!applyMonDetailTabUi()) render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-sum-detail-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.sumDetailTab;
      if (raw === "info" || raw === "skills" || raw === "awaken" || raw === "gear") {
        if (sumDetailTab === raw) return;
        sumDetailTab = raw;
        if (!applySumDetailTabUi()) render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-select-summoner]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const el = btn.dataset.selectSummoner as SummonerElement | undefined;
      if (!el || el === (save.activeSummoner ?? "light")) return;
      save = setActiveSummoner(save, el);
      persist();
      render();
    });
  });

  const openCodex = () => {
    codexOpen = true;
    codexDetailMonsterId = null;
    render();
  };
  const closeCodex = () => {
    codexOpen = false;
    codexDetailMonsterId = null;
    render();
  };
  app.querySelector("#btn-open-codex")?.addEventListener("click", openCodex);
  app.querySelector("#btn-codex-close")?.addEventListener("click", closeCodex);
  bindCodexDetailControls(app);
  // Event delegation: keep detail updates working even after grid rebuilds.
  app.querySelector("#codex-layer")?.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    if (target.closest("[data-codex-skill]")) return;
    if (target.closest("#btn-codex-detail-close")) return;
    const monBtn = target.closest<HTMLButtonElement>("[data-codex-mon]");
    if (monBtn?.dataset.codexMon) {
      ev.preventDefault();
      ev.stopPropagation();
      const id = monBtn.dataset.codexMon;
      codexDetailMonsterId = codexDetailMonsterId === id ? null : id;
      syncCodexActiveCells();
      refreshCodexDetailDom();
      return;
    }
    closeCodexSkillTips(app);
  });
  app.querySelectorAll<HTMLButtonElement>("[data-codex-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.codexTab;
      if (raw === "monsters" || raw === "summoners") {
        codexTab = raw;
        codexDetailMonsterId = null;
        render();
      }
    });
  });
  app.querySelectorAll<HTMLSelectElement>("[data-codex-el-stars]").forEach((sel) => {
    sel.addEventListener("change", () => {
      const el = sel.dataset.codexElStars as SummonerElement | undefined;
      if (!el || !(SUMMONER_ELEMENTS as readonly string[]).includes(el)) return;
      const raw = sel.value;
      let next: CodexStarsFilter = "all";
      if (raw === "all") {
        next = "all";
      } else {
        const n = Number(raw);
        if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) next = n;
        else return;
      }
      codexStarsByElement = { ...codexStarsByElement, [el]: next };
      rebuildCodexElementGrid(el);
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-codex-summoner]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const el = btn.dataset.codexSummoner as SummonerElement | undefined;
      if (!el) return;
      save = setActiveSummoner(save, el);
      persist();
      codexOpen = false;
      codexDetailMonsterId = null;
      view = "summoner";
      sumDetailTab = "info";
      flash(t("summonerPicker.switched", { element: elementLabel(el) }));
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-mon-dock]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.monDock;
      if (raw === "roster" || raw === "symbols") {
        monBookDock = raw;
        if (raw === "symbols") {
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

  app.querySelectorAll<HTMLButtonElement>("[data-skill-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = btn.dataset.skillUp;
      const idxRaw = btn.dataset.skillIdx;
      if (!uid || idxRaw == null) return;
      const skillIndex = Number(idxRaw);
      if (!Number.isFinite(skillIndex)) return;
      const r = runSkillUp(save, uid, skillIndex);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-skill-feed-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!enhanceSkillFeedAllowed) return;
      const uid = btn.dataset.skillFeedOpen;
      if (!uid) return;
      selectedEnhanceUid = uid;
      skillFeedFodderUid = null;
      skillFeedModalOpen = true;
      monDetailTab = "skills";
      applyMonDetailTabUi();
      refreshSkillFeedModalDom();
      applySkillFeedOpen();
    });
  });

  const closeSkillFeed = (): void => {
    if (!skillFeedModalOpen) return;
    skillFeedModalOpen = false;
    skillFeedFodderUid = null;
    applySkillFeedOpen();
  };
  app.querySelector("#btn-skill-feed-close")?.addEventListener("click", closeSkillFeed);
  app
    .querySelector("#skill-feed-layer .settings-backdrop")
    ?.addEventListener("click", closeSkillFeed);

  app.querySelector("#skill-feed-layer")?.addEventListener("click", (ev) => {
    const fodderBtn = (ev.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-skill-feed-fodder]",
    );
    if (fodderBtn && app.contains(fodderBtn)) {
      const fodder = fodderBtn.dataset.skillFeedFodder;
      if (!fodder) return;
      skillFeedFodderUid = skillFeedFodderUid === fodder ? null : fodder;
      refreshSkillFeedModalDom();
      return;
    }

    const confirm = (ev.target as HTMLElement).closest<HTMLButtonElement>(
      "#btn-skill-feed-confirm",
    );
    if (!confirm || !app.contains(confirm) || confirm.disabled) return;
    const target = selectedEnhanceUid;
    const fodder = skillFeedFodderUid;
    if (!target || !fodder) return;
    const r = runFeedSameMonster(save, target, fodder);
    save = r.save;
    persist();
    flash(r.message);
    monDetailTab = "skills";
    skillFeedFodderUid = null;
    const owned = save.roster.find((m) => m.uid === target);
    const levels = (owned?.skillLevels ?? [1, 1, 1]) as [number, number, number];
    const hasFodder =
      !!owned &&
      save.roster.some(
        (x) => x.monsterId === owned.monsterId && x.uid !== owned.uid,
      );
    if (levels.every((lv) => lv >= MAX_SKILL_LEVEL) || !hasFodder) {
      skillFeedModalOpen = false;
    }
    render();
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

  app.querySelectorAll<HTMLButtonElement>("[data-mon-awaken]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = btn.dataset.monAwaken!;
      const r = runAwakenMonster(save, uid);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-mon-skill-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slot = Number(btn.dataset.monSkillPick ?? "0");
      if (slot < 0 || slot > 2 || slot === monSkillPick) return;
      monSkillPick = slot;
      monDetailTab = "skills";
      enhanceTab = "monsters";
      applyMonDetailTabUi();
      if (!applyMonSkillPickUi()) render();
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
      const slot = parseGearSlot(btn.dataset.gear);
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
      const slot = parseGearSlot(btn.dataset.gearSet);
      const setRaw = btn.dataset.setId ?? "";
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

  app.querySelectorAll<HTMLButtonElement>("[data-magic-enhance]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.magicEnhance ?? "";
      if (!id) return;
      const r = runEnhanceMagicSkill(save, id);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });

  bindSymbolInventoryInteractions();
  syncSymbolInvFilterMenuUi();

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
      if (next && before && isGrindSuccessMessage(r.message)) {
        forgeReveal = {
          kind: "grind",
          before,
          after: describeSymbol(next),
          cost: grindCostLabel(),
        };
      }
      flash(r.message);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-enhance-sym]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.enhanceSym!;
      const r = runEnhanceSymbol(save, idx);
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
      const prev = save.symbols[Number(idx)];
      const before = prev ? describeSymbol(prev) : "";
      const id = prev?.id;
      const r = runImprintSymbol(save, idx);
      save = r.save;
      persist();
      const next = id ? save.symbols.find((s) => s.id === id) : undefined;
      if (next && before && r.message.startsWith(t('ui.forgeOkImprint'))) {
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
  app.querySelectorAll<HTMLButtonElement>("[data-shop-offer]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const r = runBuyShopOffer(save, btn.dataset.shopOffer!);
      save = r.save;
      persist();
      flash(r.message);
      render();
    });
  });
  app.querySelector("#btn-arena-defense")?.addEventListener("click", () => {
    const r = runSetArenaDefense(save);
    save = r.save;
    persist();
    flash(r.message);
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

  app.querySelectorAll<HTMLButtonElement>("[data-recipe-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const recipeId = btn.dataset.recipeId!;
      const keeper = btn.dataset.recipeKeeper!;
      const fodder = (btn.dataset.recipeFodder ?? "")
        .split(",")
        .filter(Boolean);
      const r = runRecipeFusion(save, recipeId, keeper, fodder);
      save = r.save;
      persist();
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
        | "sky_totem"
        | "fire_sanctuary"
        | "water_sanctuary"
        | "wind_sanctuary"
        | "fairy_tree";
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
      const uid = selectedEnhanceUid;
      if (!uid) return;
      const r = runEquipSymbol(save, uid, String(idx));
      save = r.save;
      persist();
      slotEquipPick = null;
      monDetailTab = "symbols";
      monBookDock = "symbols";
      enhanceTab = "monsters";
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
      void resolveCombatUntilAllyInput();
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
      if (stage) openStagePrep(stage);
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
      const next = stagesRegion === id ? null : id;
      if (next !== stagesRegion) {
        stagesDropInfoOpen = false;
        stagesDropSetExpand = false;
      }
      stagesRegion = next;
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
      if (
        !battle ||
        battle.phase !== "await_skill" ||
        autoMode ||
        battleFxBusy
      ) {
        render();
        return;
      }
      const unit = battle.activeUnitId
        ? battle.getUnit(battle.activeUnitId)
        : null;
      if (!unit || unit.team !== "ally") {
        render();
        return;
      }
      if (
        selectedSummonerSkill &&
        summonerSkillNeedsEnemyTarget(selectedSummonerSkill)
      ) {
        castSkill(selectedSummonerSkill, selectedTargetId ?? undefined);
        return;
      }
      if (selectedSkillIndex != null) {
        castSkill(selectedSkillIndex, selectedTargetId ?? undefined);
        return;
      }
      flash(t("ui.battlePickSkill"));
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-skill]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (!battle || battle.phase !== "await_skill" || autoMode || battleFxBusy)
        return;
      const idx = Number(btn.dataset.skill);
      if (!Number.isFinite(idx)) return;
      selectedSummonerSkill = null;
      selectedSkillIndex = selectedSkillIndex === idx ? null : idx;
      render();
    });
  });

  app
    .querySelectorAll<HTMLButtonElement>("[data-summoner-skill]")
    .forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (
          !battle ||
          battle.phase !== "await_skill" ||
          autoMode ||
          battleFxBusy
        )
          return;
        const id = btn.dataset.summonerSkill as
          | BattleSummonerSkillId
          | undefined;
        if (!id) return;
        selectedSkillIndex = null;
        if (summonerSkillNeedsEnemyTarget(id)) {
          selectedSummonerSkill =
            selectedSummonerSkill === id ? null : id;
          render();
          return;
        }
        selectedSummonerSkill = id;
        castSkill(id);
      });
    });

  app.querySelector("#btn-speed")?.addEventListener("click", () => {
    battleSpeed = battleSpeed === 1 ? 2 : battleSpeed === 2 ? 3 : 1;
    render();
    if (autoMode) scheduleAuto();
  });

  app.querySelector("#btn-auto-toggle")?.addEventListener("click", () => {
    if (!battle || battle.finishReason) return;
    autoMode = !autoMode;
    if (autoMode) {
      clearBattleSkillSelection();
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
    lastScrollPremiumGain = 0;
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
    // Painted battle stills are already transparent — dematte punches dark cloth.
    dematteArtInTree(app, "img.battle-unit-img:not([data-still-front])");
    void mountBattleSpines(app);
    // One-shot enter fade; soft patches strip this class.
    queueMicrotask(() => {
      app.querySelector(".battle-screen")?.classList.remove("battle-screen--enter");
    });
  } else if (view === "enhance" || view === "summoner") {
    destroyAllSpine();
    bindMonPreviewTurntable(app);
    dematteArtInTree(app);
  } else if (view !== "result") {
    destroyAllSpine();
  }
  // Portraits elsewhere (party / fusion / stage prep / summon reveal).
  if (view !== "battle") {
    dematteArtInTree(
      app,
      "img.party-slot-art, img.party-card-img, img.summon-multi-img, img.summon-reveal-img, img.stage-prep-inv-img, img.stage-prep-slot-img, img.mon-slot-img, img.codex-cell-img",
    );
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
  const hash = location.hash.replace(/^#/, "");
  authUi.pane =
    hash === "privacy" || hash === "terms" ? hash : "gate";
  render();
}

initI18n();
void boot();
