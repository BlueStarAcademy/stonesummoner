import {
  amplifyCapFromPowerDelta,
  Battle,
  estimateCombatPower,
  makeUnit,
  modulesForStage,
  type SummonerState,
  type Unit,
} from "stonesummoner-combat";
import {
  applySymbolsToStats,
  bumpGearEnhance,
  bumpSymbolEnhance,
  canEquipGearOnElement,
  createEmptyGear,
  createStarterGear,
  gearPieces,
  createStarterHwalro,
  describeGear,
  describeSymbol,
  gearEnhanceCrystalCost,
  gearEnhanceManaCost,
  gearLeaderAtkPct,
  gearSellCrystal,
  gearSellMana,
  gearSetBonuses,
  GEAR_SET_AFFIX_MANA,
  getGearSet,
  getGloryBuilding,
  circleInscriptionBuffFromLevels,
  getCircleInscription,
  getMonster,
  getSkillTreeNode,
  isSkillTreeNodeId,
  canUnlockSkillNode,
  resolveMonsterId,
  symbolCombatMods,
  GEAR_BAG_BASE_SLOTS,
  GEAR_BAG_EXPAND_STEP,
  GEAR_BAG_MAX_SLOTS,
  MAX_GEAR_BAG,
  normalizeGearPiece,
  normalizeSummonerGear,
  rollGearDrop,
  rollSymbolDrop,
  skillTreeBonuses,
  summarizeGearSets,
  getStage,
  gloryBuffFromLevels,
  imprintSymbolMain,
  canImprintSymbol,
  canGrindSymbol,
  grindEnhanceSubstat,
  grindSymbolPrefix,
  MAX_GEAR_ENHANCE,
  MAX_SYMBOL_ENHANCE,
  symbolEnhanceManaCost,
  SYMBOL_IMPRINT_STONE_COST,
  SYMBOL_GRIND_MANA_COST,
  SYMBOL_GRIND_STONE_COST,
  summarizeSymbolSets,
  ALL_STAGES,
  emptyMagicProgress,
  getSummonerKit,
  getSummonerLeader,
  magicEnhanceCrystalCost,
  magicEnhanceManaCost,
  magicEnhanceRequiredLevel,
  magicRank,
  magicSkillPower,
  MAX_MAGIC_RANK,
  tryUnlockMagicBranch,
  unlockedMagicSkills,
  magicTier2Unlocked,
  isWeekdayStageOpenToday,
  WEEKDAY_EVOLVE_MAT_DROP,
  WEEKDAY_SKILL_MAT_DROP,
  scenarioSymbolDropTable,
  scenarioEnemyHpMul,
  SKILL_DMG_MUL,
  getFusionRecipe,
  planFusionRecipe,
  pickArenaRival,
  getArenaRivalDeck,
  type Element,
  type GearPiece,
  type GearSetId,
  type GearSlot,
  type GloryBuildingId,
  type CircleInscriptionId,
  type SkillTreeNodeId,
  type StageDef,
  type SummonerGear,
  type SummonerMagicProgress,
  type SymbolInstance,
  normalizeSymbol,
} from "stonesummoner-data";
export {
  MAX_GEAR_BAG,
  GEAR_BAG_BASE_SLOTS,
  GEAR_BAG_EXPAND_STEP,
  GEAR_BAG_MAX_SLOTS,
};
import {
  collectCrystal,
  collectMana,
  createStarterIsland,
  energyMaxForLevel,
  grantEnergy,
  runWish,
  syncBuildingUnlocks,
  tickProduction,
  upgradeBuilding,
  spendEnergy,
  todayKey,
  ENERGY_MAX,
  summonerExpToNext,
  type BuildingId,
  type IslandState,
  type WishReward,
} from "stonesummoner-home";
import {
  createStarterRoster,
  describeOwned,
  emptySymbolSlots,
  enhanceManaCost,
  evolveCrystalCost,
  evolveManaCost,
  evolveMinLevel,
  MAX_EVOLVE,
  MAX_MONSTER_AWAKEN,
  monsterExpToNext,
  monsterMaxLevel,
  MAX_SKILL_LEVEL,
  nextUid,
  normalizeSkillLevels,
  pickRandomSkillUpIndex,
  pickSummonMonster,
  scaledMonsterStats,
  skillUpManaCost,
  skillUpMinMonsterLevel,
  skillUpgradableIndices,
  defaultSkillLevels,
  displayedMonsterStars,
  monsterAwakenCrystalCost,
  monsterAwakenManaCost,
  monsterAwakenMatCost,
  monsterAwakenMinLevel,
  SKILL_UP_MAT_COST,
  SCROLL_BUY_MANA_COST,
  SCROLL_PREMIUM_BUY_MANA_COST,
  SCROLL_PREMIUM_BUY_CRYSTAL_COST,
  SCROLL_MYSTIC_BUY_CRYSTAL_COST,
  SCROLL_KIND_BLURB,
  SCROLL_KIND_LABEL,
  SCROLL_KINDS,
  SUMMON_MULTI_COUNT,
  SUMMON_SCROLL_COST,
  type OwnedMonster,
  type ScrollKind,
  addOwnedMonsterExp,
} from "./roster.js";
import {
  expForStage,
  isDifficultyOpen,
  isStageUnlocked,
  stageUnlockLabel,
  type ScenarioDifficulty,
} from "./progress.js";
import {
  bumpDailyActivity,
  emptyDailyActivity,
  type DailyActivity,
} from "./dailyMissions.js";
export {
  DAILY_MISSION_WISH,
  DAILY_MISSION_WISH_MANA,
  DAILY_MISSION_WISH_ENERGY,
  DAILY_MISSION_DOJO,
  DAILY_MISSION_DOJO_MANA,
  DAILY_MISSION_DOJO_ENERGY,
  DAILY_MISSION_COLLECT,
  DAILY_MISSION_COLLECT_MANA,
  DAILY_MISSION_COLLECT_ENERGY,
  DAILY_MISSION_SORTIE,
  DAILY_MISSION_SORTIE_MANA,
  DAILY_MISSION_SORTIE_ENERGY,
  DAILY_MISSIONS,
  DAILY_MISSION_REWARDS,
  bumpDailyActivity,
  claimableDailyMissionCount,
  claimableDailyMissionIds,
  dailyActivityCount,
  dailyMissionClaimKey,
  dailyMissionGoal,
  dailyMissionProgress,
  emptyDailyActivity,
  getDailyMission,
  isDailyMissionClaimed,
  isDailyMissionComplete,
  isDailyMissionUnlocked,
  mergeDailyMissionState,
  normalizeDailyActivity,
  runClaimDailyMission,
  syncDailyActivity,
  unlockedDailyMissions,
  visibleDailyMissions,
} from "./dailyMissions.js";
export type {
  DailyActivity,
  DailyActivityKey,
  DailyMissionDef,
  DailyMissionId,
} from "./dailyMissions.js";

export type { OwnedMonster, ScrollKind } from "./roster.js";
export {
  addOwnedMonsterExp,
  describeOwned,
  enhanceManaCost,
  evolveCrystalCost,
  evolveManaCost,
  evolveMinLevel,
  MAX_EVOLVE,
  MAX_MONSTER_AWAKEN,
  MAX_MONSTER_LEVEL,
  MONSTER_EXP_PER_LEVEL,
  monsterExpToNext,
  monsterGrade,
  monsterMaxLevel,
  MAX_SKILL_LEVEL,
  displayedMonsterStars,
  monsterAwakenCrystalCost,
  monsterAwakenManaCost,
  monsterAwakenMatCost,
  monsterAwakenMinLevel,
  normalizeSkillLevels,
  pickRandomSkillUpIndex,
  skillUpgradableIndices,
  skillUpManaCost,
  skillUpMinMonsterLevel,
  SKILL_UP_MAT_COST,
  SCROLL_BUY_MANA_COST,
  SCROLL_PREMIUM_BUY_MANA_COST,
  SCROLL_PREMIUM_BUY_CRYSTAL_COST,
  SCROLL_MYSTIC_BUY_CRYSTAL_COST,
  SCROLL_KIND_BLURB,
  SCROLL_KIND_LABEL,
  SCROLL_KINDS,
  SUMMON_MULTI_COUNT,
  SUMMON_SCROLL_COST,
} from "./roster.js";
export {
  expForStage,
  isDifficultyOpen,
  isStageUnlocked,
  nextStageInProgression,
  stageUnlockLabel,
} from "./progress.js";
export type { ScenarioDifficulty } from "./progress.js";

/** Shared weekly entry budget across equip vault stages. */
export const EQUIP_VAULT_WEEKLY_LIMIT = 5;

/** ISO week key (UTC), e.g. 2026-W30. */
export function isoWeekKey(now = Date.now()): string {
  const date = new Date(now);
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Reset weekly counter when the ISO week rolls over. */
export function syncEquipVaultWeek(
  save: PlayerSave,
  now = Date.now(),
): PlayerSave {
  const key = isoWeekKey(now);
  if (save.equipVaultWeekKey === key) return save;
  return {
    ...save,
    equipVaultWeekKey: key,
    equipVaultWeekEntries: 0,
  };
}

export function equipVaultRemaining(
  save: PlayerSave,
  now = Date.now(),
): number {
  const synced = syncEquipVaultWeek(save, now);
  return Math.max(
    0,
    EQUIP_VAULT_WEEKLY_LIMIT - (synced.equipVaultWeekEntries ?? 0),
  );
}

/** Phase 3b: arena attacks per calendar day. */
export const ARENA_ATTACKS_DAILY = 10;
/** Phase 3g: weekly guild contribution goal. */
export const GUILD_WEEK_CONTRIB_GOAL = 100;
export const GUILD_CHECKIN_CONTRIB = 15;
export const GUILD_CHECKIN_GLORY = 8;
/** Local stub: founding a guild spends crystal. */
export const GUILD_CREATE_CRYSTAL_COST = 300;
export const GUILD_CHEST_GLORY = 25;
export const GUILD_CHEST_CRYSTAL = 10;
/** Phase 3h: local raid boss. */
export const RAID_BOSS_MAX_HP = 100_000;
export const RAID_ATTEMPTS_DAILY = 3;
export const RAID_DAMAGE_BASE = 5000;
/** Combat HP → weekly raid bar. A full clear lands near RAID_DAMAGE_BASE. */
export const RAID_COMBAT_TO_BOSS = 0.1;
const RAID_CONTRIB_BASE = 40;
export const RAID_MILESTONE_PERCENTS = [75, 50, 25, 0] as const;
export const RAID_MILESTONE_JINMUN = 5;
export const RAID_MILESTONE_GLORY = 20;

export const GUILD_NPC_MEMBERS: { name: string; roleKo: string }[] = [
  { name: "심연수호·갑", roleKo: "마스터" },
  { name: "진문연맹·을", roleKo: "부마스터" },
  { name: "사석사냥·병", roleKo: "레이더" },
  { name: "화점길드·정", roleKo: "지원" },
  { name: "안개원정·무", roleKo: "신입" },
];

export function syncArenaAttackDay(
  save: PlayerSave,
  now = Date.now(),
): PlayerSave {
  const day = todayKey(now);
  if (save.arenaAttackDay === day) return save;
  return { ...save, arenaAttackDay: day, arenaAttacksToday: 0 };
}

export function arenaAttacksRemaining(
  save: PlayerSave,
  now = Date.now(),
): number {
  const synced = syncArenaAttackDay(save, now);
  return Math.max(0, ARENA_ATTACKS_DAILY - (synced.arenaAttacksToday ?? 0));
}

export function syncGuildWeek(
  save: PlayerSave,
  now = Date.now(),
): PlayerSave {
  const key = isoWeekKey(now);
  if (save.guildWeekKey === key) return save;
  return { ...save, guildWeekKey: key, guildWeekContrib: 0 };
}

export function syncRaidWeek(save: PlayerSave, now = Date.now()): PlayerSave {
  const key = isoWeekKey(now);
  if (save.raidWeekKey === key) {
    return {
      ...save,
      raidBossHp:
        typeof save.raidBossHp === "number"
          ? Math.max(0, Math.min(RAID_BOSS_MAX_HP, save.raidBossHp))
          : RAID_BOSS_MAX_HP,
      raidMilestonesClaimed: Array.isArray(save.raidMilestonesClaimed)
        ? save.raidMilestonesClaimed
        : [],
    };
  }
  return {
    ...save,
    raidWeekKey: key,
    raidBossHp: RAID_BOSS_MAX_HP,
    raidMilestonesClaimed: [],
  };
}

export function syncRaidAttemptDay(
  save: PlayerSave,
  now = Date.now(),
): PlayerSave {
  const day = todayKey(now);
  if (save.raidAttemptDay === day) return save;
  return { ...save, raidAttemptDay: day, raidAttemptsDay: 0 };
}

export function raidAttemptsRemaining(
  save: PlayerSave,
  now = Date.now(),
): number {
  const synced = syncRaidAttemptDay(syncRaidWeek(save, now), now);
  return Math.max(0, RAID_ATTEMPTS_DAILY - (synced.raidAttemptsDay ?? 0));
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic RNG from a string seed (daily shop / rivals). */
export function seededRng(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export type ShopOfferKind =
  | "scroll_normal"
  | "scroll_premium"
  | "energy"
  | "symbol_roll"
  | "grindstone"
  | "imprint_stone";

export interface ShopOffer {
  id: string;
  kind: ShopOfferKind;
  qty: number;
  costMana: number;
  costCrystal: number;
  labelKo: string;
}

/** 4–6 seeded daily shop offers. */
export function getDailyShopOffers(dayKey: string): ShopOffer[] {
  const rng = seededRng(`shop:${dayKey}`);
  const count = 4 + Math.floor(rng() * 3);
  const offers: ShopOffer[] = [];
  const pools: Array<() => ShopOffer> = [
    () => ({
      id: "",
      kind: "scroll_normal",
      qty: 1 + Math.floor(rng() * 3),
      costMana: 400 + Math.floor(rng() * 200),
      costCrystal: 0,
      labelKo: "일반 소환서",
    }),
    () => ({
      id: "",
      kind: "scroll_premium",
      qty: 1,
      costMana: 1200 + Math.floor(rng() * 400),
      costCrystal: 0,
      labelKo: "고급 소환서",
    }),
    () => ({
      id: "",
      kind: "energy",
      qty: ENERGY_BUY_AMOUNT,
      costMana: 0,
      costCrystal: 6 + Math.floor(rng() * 5),
      labelKo: "에너지",
    }),
    () => ({
      id: "",
      kind: "symbol_roll",
      qty: 1,
      costMana: 600 + Math.floor(rng() * 400),
      costCrystal: 0,
      labelKo: "상징 뽑기",
    }),
    () => ({
      id: "",
      kind: "grindstone",
      qty: 1,
      costMana: 0,
      costCrystal: 22 + Math.floor(rng() * 10),
      labelKo: "연마석",
    }),
    () => ({
      id: "",
      kind: "imprint_stone",
      qty: 1,
      costMana: 0,
      costCrystal: 36 + Math.floor(rng() * 12),
      labelKo: "각인석",
    }),
  ];
  let symbolRolls = 0;
  let rareStoneRolls = 0;
  for (let i = 0; i < count; i++) {
    let pick = pools[Math.floor(rng() * pools.length)]!;
    let offer = pick();
    if (offer.kind === "symbol_roll") {
      symbolRolls += 1;
      if (symbolRolls > 2) {
        offer = pools[Math.floor(rng() * 3)]!();
      }
    }
    if (offer.kind === "grindstone" || offer.kind === "imprint_stone") {
      rareStoneRolls += 1;
      // Cap rare forge stones in daily shop (at most one of either kind).
      if (rareStoneRolls > 1 || rng() > 0.35) {
        offer = pools[Math.floor(rng() * 3)]!();
      }
    }
    offer = { ...offer, id: `daily_${dayKey}_${i}_${offer.kind}` };
    offers.push(offer);
  }
  return offers;
}

export function syncShopDay(save: PlayerSave, now = Date.now()): PlayerSave {
  const day = todayKey(now);
  if (save.shopDayKey === day) return save;
  return { ...save, shopDayKey: day, shopSoldIds: [], shopBuyCounts: {} };
}

/** Always-on catalog shop SKUs (distinct from rotating daily offers). */
export type CatalogShopSku =
  | "scroll_normal_1"
  | "scroll_normal_5"
  | "scroll_premium"
  | "scroll_mystic"
  | "energy"
  | "grindstone"
  | "imprint_stone";

/** Daily purchase caps for catalog products (per SKU purchase units). */
export const CATALOG_SHOP_DAILY_LIMIT: Record<CatalogShopSku, number> = {
  scroll_normal_1: 10,
  scroll_normal_5: 5,
  scroll_premium: 3,
  scroll_mystic: 2,
  energy: 5,
  grindstone: 5,
  imprint_stone: 3,
};

export function catalogShopBoughtToday(
  save: PlayerSave,
  sku: CatalogShopSku,
  now = Date.now(),
): number {
  const synced = syncShopDay(save, now);
  return Math.max(0, Math.floor(synced.shopBuyCounts?.[sku] ?? 0));
}

export function catalogShopRemaining(
  save: PlayerSave,
  sku: CatalogShopSku,
  now = Date.now(),
): number {
  const used = catalogShopBoughtToday(save, sku, now);
  return Math.max(0, CATALOG_SHOP_DAILY_LIMIT[sku] - used);
}

function tryConsumeShopQuota(
  save: PlayerSave,
  sku: string,
  limit: number,
  purchases = 1,
  now = Date.now(),
): { ok: true; save: PlayerSave } | { ok: false; save: PlayerSave; message: string } {
  const working = syncShopDay(save, now);
  const n = Math.max(1, Math.floor(purchases));
  const bought = Math.max(0, Math.floor(working.shopBuyCounts?.[sku as CatalogShopSku] ?? 0));
  if (bought + n > limit) {
    return {
      ok: false,
      save: working,
      message: `오늘 구매 한도 초과 (${Math.min(bought, limit)}/${limit})`,
    };
  }
  return {
    ok: true,
    save: {
      ...working,
      shopBuyCounts: {
        ...(working.shopBuyCounts ?? {}),
        [sku]: bought + n,
      },
    },
  };
}

function tryConsumeCatalogQuota(
  save: PlayerSave,
  sku: CatalogShopSku,
  purchases = 1,
  now = Date.now(),
): { ok: true; save: PlayerSave } | { ok: false; save: PlayerSave; message: string } {
  const working = syncShopDay(save, now);
  const n = Math.max(1, Math.floor(purchases));
  const limit = CATALOG_SHOP_DAILY_LIMIT[sku];
  const bought = Math.max(0, Math.floor(working.shopBuyCounts?.[sku] ?? 0));
  if (bought + n > limit) {
    return {
      ok: false,
      save: working,
      message: `오늘 구매 한도 초과 (${Math.min(bought, limit)}/${limit})`,
    };
  }
  return {
    ok: true,
    save: {
      ...working,
      shopBuyCounts: {
        ...(working.shopBuyCounts ?? {}),
        [sku]: bought + n,
      },
    },
  };
}

function catalogSkuForScrollBuy(
  kind: ScrollKind,
  count: number,
): { sku: CatalogShopSku; purchases: number } {
  if (kind === "premium") return { sku: "scroll_premium", purchases: count };
  if (kind === "mystic") return { sku: "scroll_mystic", purchases: count };
  if (count === 5) return { sku: "scroll_normal_5", purchases: 1 };
  return { sku: "scroll_normal_1", purchases: count };
}

export const SUMMONER_ELEMENTS: Element[] = [
  "fire",
  "water",
  "wind",
  "light",
  "dark",
];

export type SummonerElement = Element;

export interface ElementSummonerProfile {
  level: number;
  exp: number;
  awaken: number;
  /** Per-summoner equipped gear set (weapons are element-locked). */
  gear?: SummonerGear;
}

/** Active summoner's equipped gear (mirrored on save.gear). */
export function getActiveGear(save: PlayerSave): SummonerGear {
  const el = save.activeSummoner ?? "light";
  const fromProfile = save.summoners?.[el]?.gear;
  return normalizeSummonerGear(fromProfile ?? save.gear, el);
}

/** Write gear onto the active summoner profile and legacy save.gear mirror. */
export function withActiveGear(save: PlayerSave, gear: SummonerGear): PlayerSave {
  const synced = syncSummonerMirrors(save);
  const el = synced.activeSummoner;
  const nextGear = normalizeSummonerGear(gear, el);
  const summoners = {
    ...synced.summoners,
    [el]: { ...synced.summoners[el], gear: nextGear },
  };
  return { ...synced, summoners, gear: nextGear };
}

/** Saved favorite deck: summoner element + up to 4 monster uids + magic slots. */
export interface PartyPreset {
  summoner: SummonerElement;
  party: string[];
  magic?: SummonerMagicLoadout;
}

export const PARTY_PRESET_COUNT = 5;

function normalizeMagicLoadout(raw: unknown): SummonerMagicLoadout {
  if (!Array.isArray(raw)) return [null, null];
  return [
    typeof raw[0] === "string" ? raw[0] : null,
    typeof raw[1] === "string" ? raw[1] : null,
  ];
}

export function emptyPartyPreset(
  summoner: SummonerElement = "light",
): PartyPreset {
  return { summoner, party: [], magic: [null, null] };
}

function isSummonerElement(v: unknown): v is SummonerElement {
  return (
    typeof v === "string" &&
    (SUMMONER_ELEMENTS as readonly string[]).includes(v)
  );
}

/** Normalize / seed 5 deck presets; slot 0 mirrors current party when missing. */
export function normalizePartyPresets(
  save: PlayerSave,
  raw?: PartyPreset[] | null,
): PartyPreset[] {
  const active = isSummonerElement(save.activeSummoner)
    ? save.activeSummoner
    : "light";
  const rosterIds = new Set(save.roster.map((m) => m.uid));
  const out: PartyPreset[] = [];
  for (let i = 0; i < PARTY_PRESET_COUNT; i++) {
    const src = Array.isArray(raw) ? raw[i] : undefined;
    if (!src || typeof src !== "object") {
      out.push(
        i === 0
          ? {
              summoner: active,
              party: [...(save.party ?? [])]
                .filter((uid) => rosterIds.has(uid))
                .slice(0, 4),
            }
          : emptyPartyPreset(active),
      );
      continue;
    }
    const el = isSummonerElement(src.summoner) ? src.summoner : active;
    const seen = new Set<string>();
    const party: string[] = [];
    for (const uid of Array.isArray(src.party) ? src.party : []) {
      if (typeof uid !== "string" || !rosterIds.has(uid) || seen.has(uid)) {
        continue;
      }
      seen.add(uid);
      party.push(uid);
      if (party.length >= 4) break;
    }
    const magicRaw = (src as { magic?: unknown }).magic;
    const magic = Array.isArray(magicRaw)
      ? normalizeMagicLoadout(magicRaw)
      : undefined;
    out.push(magic ? { summoner: el, party, magic } : { summoner: el, party });
  }
  return out;
}

export function clampPartyPresetIndex(index: unknown): number {
  const n = typeof index === "number" ? Math.floor(index) : 0;
  if (n < 0) return 0;
  if (n >= PARTY_PRESET_COUNT) return PARTY_PRESET_COUNT - 1;
  return n;
}

/** Write current (or override) lineup into a favorite slot. */
export function runSavePartyPreset(
  save: PlayerSave,
  index: number,
  opts?: {
    summoner?: SummonerElement;
    party?: string[];
    magic?: SummonerMagicLoadout;
  },
): LoopStepResult {
  const i = clampPartyPresetIndex(index);
  const summoner = isSummonerElement(opts?.summoner)
    ? opts!.summoner!
    : isSummonerElement(save.activeSummoner)
      ? save.activeSummoner
      : "light";
  const rosterIds = new Set(save.roster.map((m) => m.uid));
  const srcParty = opts?.party ?? save.party ?? [];
  const seen = new Set<string>();
  const party: string[] = [];
  for (const uid of srcParty) {
    if (typeof uid !== "string" || !rosterIds.has(uid) || seen.has(uid)) {
      continue;
    }
    seen.add(uid);
    party.push(uid);
    if (party.length >= 4) break;
  }
  const magic = normalizeMagicLoadout(
    opts?.magic ?? save.summonerMagicLoadouts?.[summoner],
  );
  const presets = normalizePartyPresets(save, save.partyPresets);
  presets[i] = { summoner, party, magic };
  return {
    save: {
      ...save,
      partyPresets: presets,
      activePartyPreset: i,
    },
    message: `덱 슬롯 ${i + 1} 저장`,
  };
}

/** Load a favorite slot into party + active summoner. */
export function runLoadPartyPreset(
  save: PlayerSave,
  index: number,
): LoopStepResult {
  const i = clampPartyPresetIndex(index);
  const presets = normalizePartyPresets(save, save.partyPresets);
  const preset = presets[i] ?? emptyPartyPreset();
  if (!isSummonerUnlocked(save, preset.summoner)) {
    return { save, message: "미해금 소환사" };
  }
  const loadouts = {
    ...createEmptySummonerMagicLoadouts(),
    ...(save.summonerMagicLoadouts ?? {}),
  };
  if (preset.magic) {
    loadouts[preset.summoner] = normalizeMagicLoadout(preset.magic);
  }
  const next = syncSummonerMirrors({
    ...save,
    party: [...preset.party],
    activeSummoner: preset.summoner,
    partyPresets: presets,
    activePartyPreset: i,
    summonerMagicLoadouts: loadouts,
  });
  return {
    save: next,
    message: `덱 슬롯 ${i + 1} 불러옴`,
  };
}

/** Save current party + active summoner as arena defense deck. */
export function runSetArenaDefense(
  save: PlayerSave,
  partyUids?: string[],
): LoopStepResult {
  const summoner = isSummonerElement(save.activeSummoner)
    ? save.activeSummoner
    : "light";
  const rosterIds = new Set(save.roster.map((m) => m.uid));
  const src = partyUids ?? save.party ?? [];
  const seen = new Set<string>();
  const party: string[] = [];
  for (const uid of src) {
    if (typeof uid !== "string" || !rosterIds.has(uid) || seen.has(uid)) {
      continue;
    }
    seen.add(uid);
    party.push(uid);
    if (party.length >= 4) break;
  }
  if (party.length === 0) {
    return { save, message: "방어 덱에 소환수가 필요합니다" };
  }
  return {
    save: {
      ...save,
      arenaDefense: { summoner, party },
    },
    message: `아레나 방어 덱 설정 (${party.length}마리 · ${SUMMONER_ELEMENT_LABEL[summoner]})`,
  };
}

export const SUMMONER_ELEMENT_LABEL: Record<SummonerElement, string> = {
  fire: "화염",
  water: "심해",
  wind: "질풍",
  light: "신성",
  dark: "심연",
};

export function createSummonerRoster(
  seed?: Partial<ElementSummonerProfile>,
): Record<SummonerElement, ElementSummonerProfile> {
  const light: ElementSummonerProfile = {
    level: Math.max(1, Math.floor(seed?.level ?? 1)),
    exp: Math.max(0, Math.floor(seed?.exp ?? 0)),
    awaken: Math.max(0, Math.floor(seed?.awaken ?? 0)),
    gear: seed?.gear
      ? normalizeSummonerGear(seed.gear, "light")
      : createEmptyGear(),
  };
  const blank = (el: SummonerElement): ElementSummonerProfile => ({
    level: 1,
    exp: 0,
    awaken: 0,
    gear: createEmptyGear(),
  });
  return {
    fire: blank("fire"),
    water: blank("water"),
    wind: blank("wind"),
    light,
    dark: blank("dark"),
  };
}

export function createEmptySummonerMagic(): Record<
  SummonerElement,
  SummonerMagicProgress
> {
  return {
    fire: emptyMagicProgress(),
    water: emptyMagicProgress(),
    wind: emptyMagicProgress(),
    light: emptyMagicProgress(),
    dark: emptyMagicProgress(),
  };
}

/** Two battle-ready magic skills per summoner element. */
export type SummonerMagicLoadout = [string | null, string | null];

export function createEmptySummonerMagicLoadouts(): Record<
  SummonerElement,
  SummonerMagicLoadout
> {
  return {
    fire: [null, null],
    water: [null, null],
    wind: [null, null],
    light: [null, null],
    dark: [null, null],
  };
}

export function accountSummonerLevel(
  summoners: Record<SummonerElement, ElementSummonerProfile>,
): number {
  return Math.max(
    1,
    ...SUMMONER_ELEMENTS.map((e) => summoners[e]?.level ?? 1),
  );
}

/** Account level = highest elemental summoner level. */
export function accountLevelOf(save: PlayerSave): number {
  if (save.summoners) return accountSummonerLevel(save.summoners);
  return Math.max(1, Math.floor(save.island.summonerLevel ?? 1));
}

export function getActiveSummoner(save: PlayerSave): ElementSummonerProfile {
  const el = save.activeSummoner ?? "light";
  return (
    save.summoners?.[el] ?? {
      level: save.island.summonerLevel,
      exp: save.island.summonerExp ?? 0,
      awaken: save.summonerAwaken ?? 0,
    }
  );
}

/** Mirror active awaken + account max level onto legacy island/awaken fields. */
export function syncSummonerMirrors(save: PlayerSave): PlayerSave {
  let summoners = save.summoners ?? createSummonerRoster({
    level: save.island.summonerLevel,
    exp: save.island.summonerExp ?? 0,
    awaken: save.summonerAwaken ?? 0,
  });
  const activeSummoner = save.activeSummoner ?? "light";
  const nextSummoners = { ...summoners };
  for (const el of SUMMONER_ELEMENTS) {
    const cur = nextSummoners[el] ?? {
      level: 1,
      exp: 0,
      awaken: 0,
    };
    const seedGear =
      cur.gear ??
      (el === activeSummoner && save.gear ? save.gear : undefined);
    nextSummoners[el] = {
      ...cur,
      gear: normalizeSummonerGear(seedGear, el),
    };
  }
  summoners = nextSummoners;
  const active = summoners[activeSummoner] ?? summoners.light;
  const activeGear = normalizeSummonerGear(active.gear, activeSummoner);
  const summonerMagic = {
    ...(save.summonerMagic ?? createEmptySummonerMagic()),
  };
  for (const el of SUMMONER_ELEMENTS) {
    if (!summonerMagic[el]) summonerMagic[el] = emptyMagicProgress();
  }
  const summonerMagicLoadouts = {
    ...createEmptySummonerMagicLoadouts(),
    ...(save.summonerMagicLoadouts ?? {}),
  };
  for (const el of SUMMONER_ELEMENTS) {
    const loadout = summonerMagicLoadouts[el];
    summonerMagicLoadouts[el] = [
      typeof loadout?.[0] === "string" ? loadout[0] : null,
      typeof loadout?.[1] === "string" ? loadout[1] : null,
    ];
  }
  const gearBag = (save.gearBag ?? []).map((g) =>
    normalizeGearPiece(g, g.slot),
  );
  return {
    ...save,
    summoners,
    activeSummoner,
    summonerAwaken: active.awaken,
    summonerMagic,
    summonerMagicLoadouts,
    gear: activeGear,
    gearBag,
    island: {
      ...save.island,
      summonerLevel: accountSummonerLevel(summoners),
      summonerExp: active.exp,
    },
  };
}

/** User-level gates for extra summoner slots: 1 at start, then +1 at 5/10/15/20. */
export const SUMMONER_UNLOCK_LEVELS = [1, 5, 10, 15, 20] as const;

export function summonerUnlockSlotCount(accountLevel: number): number {
  const lv = Math.max(1, Math.floor(accountLevel));
  let n = 1;
  for (let i = 1; i < SUMMONER_UNLOCK_LEVELS.length; i++) {
    if (lv >= SUMMONER_UNLOCK_LEVELS[i]!) n = i + 1;
  }
  return n;
}

/** Next user level that grants another summoner slot, or null when all 5 are open. */
export function nextSummonerUnlockLevel(unlockedCount: number): number | null {
  if (unlockedCount >= SUMMONER_ELEMENTS.length) return null;
  return SUMMONER_UNLOCK_LEVELS[Math.max(0, unlockedCount)] ?? null;
}

export function normalizeUnlockedSummoners(
  raw: unknown,
  fallback: readonly SummonerElement[] = ["light"],
): SummonerElement[] {
  const seen = new Set<SummonerElement>();
  const out: SummonerElement[] = [];
  if (Array.isArray(raw)) {
    for (const v of raw) {
      if (!isSummonerElement(v) || seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
  }
  if (out.length > 0) return out;
  for (const el of fallback) {
    if (!isSummonerElement(el) || seen.has(el)) continue;
    seen.add(el);
    out.push(el);
  }
  return out.length > 0 ? out : ["light"];
}

export function unlockedSummonerList(save: PlayerSave): SummonerElement[] {
  const active = isSummonerElement(save.activeSummoner)
    ? save.activeSummoner
    : "light";
  return normalizeUnlockedSummoners(save.unlockedSummoners, [active]);
}

export function isSummonerUnlocked(
  save: PlayerSave,
  element: SummonerElement,
): boolean {
  return unlockedSummonerList(save).includes(element);
}

export function hasSpareSummonerUnlockSlot(save: PlayerSave): boolean {
  return (
    unlockedSummonerList(save).length <
    summonerUnlockSlotCount(accountLevelOf(save))
  );
}

export function canUnlockAdditionalSummoner(
  save: PlayerSave,
  element: SummonerElement,
): boolean {
  if (!isSummonerElement(element)) return false;
  if (isSummonerUnlocked(save, element)) return false;
  return hasSpareSummonerUnlockSlot(save);
}

export function withUnlockedSummoners(
  save: PlayerSave,
  elements: readonly SummonerElement[],
): PlayerSave {
  const list = normalizeUnlockedSummoners(elements, []);
  const active = list.includes(save.activeSummoner as SummonerElement)
    ? (save.activeSummoner as SummonerElement)
    : (list[0] ?? "light");
  return syncSummonerMirrors({
    ...save,
    unlockedSummoners: list,
    starterSummonerPicked: true,
    activeSummoner: active,
  });
}

/** First-rite pick: replace the default starter with the chosen element. */
export function chooseStarterSummoner(
  save: PlayerSave,
  element: SummonerElement,
): PlayerSave {
  if (!isSummonerElement(element)) return save;
  const synced = syncSummonerMirrors(save);
  const presets = normalizePartyPresets(
    { ...synced, activeSummoner: element },
    synced.partyPresets,
  ).map((p, i) =>
    i === 0
      ? { ...p, summoner: element, party: [...(synced.party ?? [])] }
      : { ...p, summoner: element },
  );
  return syncSummonerMirrors({
    ...synced,
    unlockedSummoners: [element],
    starterSummonerPicked: true,
    activeSummoner: element,
    partyPresets: presets,
  });
}

export function unlockAdditionalSummoner(
  save: PlayerSave,
  element: SummonerElement,
): LoopStepResult {
  if (!canUnlockAdditionalSummoner(save, element)) {
    return { save, message: "소환사 해금 불가" };
  }
  const unlocked = [...unlockedSummonerList(save), element];
  return {
    save: syncSummonerMirrors({
      ...save,
      unlockedSummoners: unlocked,
    }),
    message: `${SUMMONER_ELEMENT_LABEL[element]} 소환사 해금`,
  };
}

export function setActiveSummoner(
  save: PlayerSave,
  element: SummonerElement,
): PlayerSave {
  if (!SUMMONER_ELEMENTS.includes(element)) return save;
  if (!isSummonerUnlocked(save, element)) return save;
  return syncSummonerMirrors({ ...save, activeSummoner: element });
}

export function addActiveSummonerExp(
  save: PlayerSave,
  amount: number,
  now = Date.now(),
): {
  save: PlayerSave;
  levelsGained: number;
  accountLevelsGained: number;
  unlockedBuildingIds: BuildingId[];
} {
  const synced = syncSummonerMirrors(save);
  const beforeAccountLv = accountSummonerLevel(
    synced.summoners ?? createSummonerRoster(),
  );
  const beforeBuildingIds = new Set(synced.island.buildings.map((b) => b.id));
  const el = synced.activeSummoner;
  const cur = synced.summoners[el];
  let exp = cur.exp + amount;
  let level = cur.level;
  let levelsGained = 0;
  while (exp >= summonerExpToNext(level)) {
    exp -= summonerExpToNext(level);
    level += 1;
    levelsGained += 1;
  }
  const summoners = {
    ...synced.summoners,
    [el]: { ...cur, level, exp },
  };
  let next = syncSummonerMirrors({ ...synced, summoners });
  const afterAccountLv = accountSummonerLevel(
    next.summoners ?? createSummonerRoster(),
  );
  const accountLevelsGained = Math.max(0, afterAccountLv - beforeAccountLv);
  const targetMax = energyMaxForLevel(afterAccountLv);
  let island = {
    ...next.island,
    energyMax: Math.max(next.island.energyMax ?? ENERGY_MAX, targetMax),
  };
  island = syncBuildingUnlocks(island, now);
  const unlockedBuildingIds = island.buildings
    .map((b) => b.id)
    .filter((id) => !beforeBuildingIds.has(id));
  return {
    save: { ...next, island },
    levelsGained,
    accountLevelsGained,
    unlockedBuildingIds,
  };
}

/** Serialized first-rite guide progress (mirrors web onboard snapshot). */
export type OnboardRiteSave = {
  step: string;
  openedStages: boolean;
  openedRegion: boolean;
  summoned: boolean;
  enhanced: boolean;
  partySet: boolean;
  equipped: boolean;
  hasBattleDrop: boolean;
  welcomeSeen: boolean;
};

export interface PlayerSave {
  island: IslandState;
  symbols: SymbolInstance[];
  clearedStages: string[];
  /** Scenario stages cleared on Hard (Hell unlock gate). */
  clearedHardStages: string[];
  /** Scenario stages cleared on Hell. */
  clearedHellStages: string[];
  roster: OwnedMonster[];
  /** Up to 4 owned monster uids for battle. */
  party: string[];
  /** Favorite deck slots (summoner + party), length 5. */
  partyPresets: PartyPreset[];
  /** Active favorite deck index 0..4. */
  activePartyPreset: number;
  /** 일반 소환서. */
  scrolls: number;
  /** 고급 소환서. */
  scrollsPremium: number;
  /** 신성/심연 소환서. */
  scrollsMystic: number;
  gear: SummonerGear;
  /** Unequipped gear drops (equip vault bag). */
  gearBag: GearPiece[];
  /** Gear bag capacity (base 20 … max 100, +10 per expand). */
  gearBagSlots: number;
  /** @deprecated Mirror of active summoner awaken — prefer summoners[active]. */
  summonerAwaken: number;
  /** Per-element summoner progression. */
  summoners: Record<SummonerElement, ElementSummonerProfile>;
  /** Currently selected summoner element. */
  activeSummoner: SummonerElement;
  /** Elemental summoners the player has chosen / unlocked. */
  unlockedSummoners: SummonerElement[];
  /** True after the opening summoner pick (legacy saves migrate as true). */
  starterSummonerPicked: boolean;
  /** Unlocked summoner skill-tree node ids (legacy Phase 1 passives). */
  skillTree: string[];
  /** Phase 2 per-element magic skill ranks + branch. */
  summonerMagic: Record<SummonerElement, SummonerMagicProgress>;
  /** Four equipped magic skills per summoner element. */
  summonerMagicLoadouts: Record<SummonerElement, SummonerMagicLoadout>;
  /** Phase 2: arena glory currency. */
  gloryPoints: number;
  /** Friendship shop currency (hearts sent to friends). */
  friendshipPoints: number;
  /** Phase 2: magic-circle trial tokens. */
  jinmunStones: number;
  /** Phase 2: glory building levels. */
  gloryLevels: Partial<Record<GloryBuildingId, number>>;
  /** Phase 2+: world arena ban list (monster ids, max 2). */
  arenaBanIds: string[];
  /** Phase 2+: world arena season wins. */
  arenaSeasonWins: number;
  /** Phase 2+: guild raid contribution points. */
  guildContribution: number;
  /** Phase 2+: practice dojo lifetime drill count. */
  dojoDrills: number;
  /** YYYY-MM-DD of last dojo drill (daily cap). */
  dojoDrillDay: string | null;
  /** Dojo drills used on dojoDrillDay. */
  dojoDrillsToday: number;
  /** Magic-circle inscription levels (진문석 sink). */
  circleInscriptions: Partial<Record<CircleInscriptionId, number>>;
  /** Phase 2+: guild name (local stub, not realtime). */
  guildName: string | null;
  /** YYYY-MM-DD of last guild check-in. */
  guildCheckInDay: string | null;
  /** Best single guild-raid contribution gain. */
  guildRaidBest: number;
  /** World-arena season reward tiers claimed. */
  seasonRewardsClaimed: number;
  /** ISO week key for equip vault entries (e.g. 2026-W30). */
  equipVaultWeekKey: string | null;
  /** Equip vault entries used this week. */
  equipVaultWeekEntries: number;
  /** Symbol inventory capacity (base 100 … max 1000, +10 per expand). */
  symbolBagSlots: number;
  /** Weekday evolve/awaken materials by element. */
  awakenMats: Partial<Record<Element, number>>;
  /** Weekday skill-up materials (shared pool). */
  skillMats: number;
  /** Phase 3b: arena defense lineup (local offline). */
  arenaDefense: { summoner: SummonerElement; party: string[] } | null;
  /** Phase 3b: arena attacks used today. */
  arenaAttacksToday: number;
  /** Phase 3b: YYYY-MM-DD of arena attack counter. */
  arenaAttackDay: string | null;
  /** Phase 3c: shop rotation day key. */
  shopDayKey: string | null;
  /** Phase 3c: offer ids bought today. */
  shopSoldIds: string[];
  /** Catalog / extra shop purchase counts for the current `shopDayKey`. */
  shopBuyCounts: Partial<Record<string, number>>;
  /** Phase 3d: trial B3 clear tokens. */
  trialTokens: number;
  /** Phase 3d: dojo cosmetic unlock from trial. */
  trialTitleUnlocked: boolean;
  /** Phase 3g: ISO week key for guild weekly contrib. */
  guildWeekKey: string | null;
  /** Phase 3g: contribution gained this week. */
  guildWeekContrib: number;
  /** Phase 3g: consecutive check-in days. */
  guildCheckInStreak: number;
  /** Phase 3g: week key when weekly chest was claimed. */
  guildChestClaimedWeek: string | null;
  /** Phase 3h: local raid boss HP. */
  raidBossHp: number;
  /** Phase 3h: raid attempts used today. */
  raidAttemptsDay: number;
  /** Phase 3h: YYYY-MM-DD of raid attempt counter. */
  raidAttemptDay: string | null;
  /** Phase 3h: claimed HP milestone percents (75/50/25/0). */
  raidMilestonesClaimed: number[];
  /** Phase 3h: ISO week key for raid boss reset. */
  raidWeekKey: string | null;
  /** Symbol grindstone bag (consume 1 per grind / substat enhance). */
  grindstones: number;
  /** Symbol imprint-stone bag (consume 1 per main-stat re-roll on slots 2/4/6). */
  imprintStones: number;
  /** Claimed mailbox reward ids (persistent). */
  claimedMailIds: string[];
  /** Client persist timestamp (ms). Used to keep the freshest save on reconnect. */
  updatedAt: number;
  /** Today's daily-mission action counters (`day` rolls over with `todayKey`). */
  dailyActivity: DailyActivity;
  /** Claimed daily mission keys (`missionId:YYYY-MM-DD`). */
  claimedMissionKeys: string[];
  /** Claimed one-time main quest ids. */
  claimedMainQuestIds: string[];
  /** Codex monster id used as the HUD profile portrait. Null = default mark. */
  profileIconId: string | null;
  /** Display nickname cached on the save (synced from account when logged in). */
  profileNickname: string | null;
  /** Successful profile renames. 0 = next rename is free. */
  nicknameChangeCount: number;
  /**
   * First-session rite checkpoint (client UI). Null = never written;
   * cloud sync carries it so Capacitor / multi-device stays aligned.
   */
  onboardRite: OnboardRiteSave | null;
}

export interface ExpTrackGain {
  kind: "user" | "summoner" | "monster";
  id: string;
  /** Display name for monster rows (content). */
  nameKo?: string;
  monsterId?: string;
  element?: SummonerElement;
  gained: number;
  beforeLevel: number;
  beforeExp: number;
  afterLevel: number;
  afterExp: number;
  expPerLevel: number;
  levelsGained: number;
}

export interface BattleReward {
  mana: number;
  crystal?: number;
  glory?: number;
  jinmun?: number;
  contribution?: number;
  raidDamage?: number;
  expNote: string;
  symbol?: SymbolInstance;
  /** Equip dungeon wearable drop (stored in gearBag). */
  gear?: GearPiece;
  victory: boolean;
  summonerExp?: number;
  levelsGained?: number;
  /** User / summoner / party monster EXP progress for the result screen. */
  expTracks?: ExpTrackGain[];
  /** Island buildings unlocked by account-level gain this battle. */
  unlockedBuildingIds?: BuildingId[];
}

export interface LoopStepResult {
  save: PlayerSave;
  message: string;
  reward?: BattleReward;
  battleLog?: string[];
  /** Island buildings unlocked by account-level gain this step. */
  unlockedBuildingIds?: BuildingId[];
  /** Structured daily wish grant (when runDailyWish succeeds). */
  wishReward?: WishReward;
  /** New roster uid created by recipe combination. */
  fusedUid?: string;
}

function resolveOwned(
  save: PlayerSave,
  uidOrIndex: string,
): OwnedMonster | undefined {
  if (/^\d+$/.test(uidOrIndex)) return save.roster[Number(uidOrIndex)];
  return save.roster.find((m) => m.uid === uidOrIndex);
}

function resolveSymbol(
  save: PlayerSave,
  idOrIndex: string,
): SymbolInstance | undefined {
  if (/^\d+$/.test(idOrIndex)) return save.symbols[Number(idOrIndex)];
  return save.symbols.find((s) => s.id === idOrIndex);
}

function equippedSymbols(
  save: PlayerSave,
  owned: OwnedMonster,
): SymbolInstance[] {
  const slots = owned.symbolSlots ?? emptySymbolSlots();
  return slots
    .map((id) => (id ? save.symbols.find((s) => s.id === id) : undefined))
    .filter((s): s is SymbolInstance => !!s)
    .map(normalizeSymbol);
}

export const MAX_SUMMONER_AWAKEN = 5;

/** Mana cost to raise awaken → awaken+1 */
export function awakenManaCost(awaken: number): number {
  return 500 + awaken * 400;
}

export function awakenCrystalCost(awaken: number): number {
  return 3 + awaken * 2;
}

/** Elemental essence required for summon awaken → awaken+1. */
export function summonerAwakenMatCost(awaken: number): number {
  return 8 + Math.max(0, awaken) * 4;
}

/** Minimum summoner level to attempt this awaken step. */
export function awakenMinLevel(awaken: number): number {
  return 5 + awaken * 3;
}

export function awakenLeaderAtkPct(awaken: number): number {
  return Math.max(0, awaken) * 0.012;
}

function buildSummonerState(
  unitId: string,
  gear: SummonerGear,
  weakBoard = false,
  awaken = 0,
  skillTree: string[] = [],
  magicSkills: SummonerState["magicSkills"] = [],
  summonerElement?: Element,
  startManaFlat = 0,
): SummonerState {
  const g = normalizeSummonerGear(gear, summonerElement);
  const pieces = gearPieces(g);
  const sets = gearSetBonuses(g);
  const tree = skillTreeBonuses(skillTree);
  const a = Math.max(0, awaken);
  const regen =
    0.85 +
    pieces.reduce((n, p) => n + (p.manaRegenBonus ?? 0), 0) +
    sets.manaRegenBonus +
    tree.manaRegenBonus +
    a * 0.06;
  const manaMax =
    100 +
    pieces.reduce((n, p) => n + (p.manaMaxBonus ?? 0), 0) +
    sets.manaMaxBonus +
    tree.manaMaxBonus +
    a * 8;
  const boardSense = weakBoard
    ? 0.02
    : 0.05 +
      pieces.reduce((n, p) => n + (p.boardSenseBonus ?? 0), 0) +
      sets.boardSenseBonus +
      tree.boardSenseBonus +
      a * 0.015;
  const startPct =
    0.2 +
    pieces.reduce((n, p) => n + (p.startManaPct ?? 0), 0) +
    sets.startManaPct +
    tree.startManaPct +
    a * 0.01;
  const skillPowerBonus =
    pieces.reduce((n, p) => n + (p.skillPowerBonus ?? 0), 0) +
    sets.skillPowerBonus +
    tree.skillPowerBonus +
    a * 0.025;
  return {
    unitId,
    mana: Math.min(manaMax, manaMax * startPct + startManaFlat),
    manaMax,
    manaRegenPerTick: regen,
    boardSense,
    skillPowerBonus,
    declareCostMul: tree.declareCostMul,
    dualCostMul: tree.dualCostMul,
    cleanCostMul: tree.cleanCostMul,
    declarePowerBonus: tree.declarePowerBonus,
    cleanAmpBonus: tree.cleanAmpBonus,
    skillTreeUnlocked: [...skillTree],
    magicSkills: magicSkills ?? [],
    summonerElement,
  };
}

/** Scale enemy summoner pressure by stage mode / number. */
function enemySummonerProfile(stage: StageDef): {
  weakBoard: boolean;
  awaken: number;
  skillTree: string[];
} {
  const isPvp =
    stage.mode === "arena" || stage.mode === "world_arena";
  const awaken = isPvp
    ? Math.min(4, Math.floor(stage.stage) + 1)
    : Math.min(3, Math.floor(stage.stage / 2));
  // Keep early scenario summoners soft — stage 3 was a hard cliff with full sense.
  const weakBoard = !isPvp && stage.stage <= 3;
  const skillTree: string[] = [];
  if (stage.stage >= 2 || isPvp) skillTree.push("root_power");
  if (stage.stage >= 4 || isPvp) skillTree.push("root_mana");
  if (stage.stage >= 5 || (isPvp && stage.stage >= 2)) {
    skillTree.push("power_focus");
  }
  return { weakBoard, awaken, skillTree };
}

function skillsForMonster(
  m: NonNullable<ReturnType<typeof getMonster>>,
  evolve = 0,
  skillLevels: [number, number, number] = defaultSkillLevels(),
) {
  const evoBump = evolve * 0.05;
  return m.skills.map((sk, i) => {
    const lv = skillLevels[i] ?? 1;
    const skBump = (lv - 1) * 0.08;
    const cdCut = sk.cooldown > 0 && lv >= MAX_SKILL_LEVEL ? 1 : 0;
    return {
      ...sk,
      cooldown: Math.max(0, sk.cooldown - cdCut),
      effects: sk.effects.map((e) => {
        if (e.kind === "damage" || e.kind === "heal" || e.kind === "shield") {
          return { ...e, coeff: e.coeff * (1 + evoBump + skBump) };
        }
        if (e.kind === "mana") {
          return { ...e, amount: Math.round(e.amount * (1 + skBump)) };
        }
        return e;
      }),
    };
  });
}

function unitFromOwned(
  save: PlayerSave,
  owned: OwnedMonster,
  team: "ally" | "enemy",
): Unit {
  const m = getMonster(owned.monsterId);
  if (!m) throw new Error(`Unknown monster ${owned.monsterId}`);
  const base = scaledMonsterStats(
    m,
    owned.level,
    owned.evolve ?? 0,
    owned.awaken ?? 0,
  );
  let stats = applySymbolsToStats(base, equippedSymbols(save, owned));
  if (team === "ally") {
    const g = gloryBuffFromLevels(save.gloryLevels ?? {});
    stats = {
      ...stats,
      hp: Math.round(stats.hp * (1 + g.hpPct)),
      atk: Math.round(stats.atk * (1 + g.atkPct)),
      def: Math.round(stats.def * (1 + g.defPct)),
      spd: stats.spd + g.spdFlat,
    };
  }
  const evoTag = (owned.evolve ?? 0) > 0 ? ` E${owned.evolve}` : "";
  const awakenTag = (owned.awaken ?? 0) > 0 ? ` 각성` : "";
  const skillLevels = normalizeSkillLevels(owned.skillLevels);
  const mods = symbolCombatMods(equippedSymbols(save, owned));
  return makeUnit({
    id: owned.uid,
    name: `${m.nameKo} Lv.${owned.level}${evoTag}${awakenTag}`,
    team,
    kind: "monster",
    monsterId: m.id,
    element: m.element,
    stats: {
      hp: stats.hp,
      atk: stats.atk,
      def: stats.def,
      spd: stats.spd,
      critRate: stats.critRate,
      critDmg: stats.critDmg,
      accuracy: stats.accuracy,
      resistance: stats.resistance,
    },
    skillCoeff:
      m.skillCoeff *
      (1 + (owned.evolve ?? 0) * 0.05 + (skillLevels[0]! - 1) * 0.08),
    skills: skillsForMonster(m, owned.evolve ?? 0, skillLevels),
    stonePassive: m.stonePassiveId,
    startShieldPct: mods.startShieldPct || undefined,
    counterChance: mods.counterChance || undefined,
    statusImmuneTurns: mods.statusImmuneTurns || undefined,
    lifestealPct: mods.lifestealPct || undefined,
    stunOnHitChance: mods.stunChance || undefined,
    violentChance: mods.violentChance || undefined,
    nemesisAtbPer7: mods.nemesisAtbPer7 || undefined,
    destroySets: mods.destroySets || undefined,
    originalMaxHp: stats.hp,
  });
}

function unitFromMonsterId(
  id: string,
  team: "ally" | "enemy",
  uid: string,
  level = 1,
): Unit {
  const m = getMonster(id);
  if (!m) throw new Error(`Unknown monster ${id}`);
  const stats = scaledMonsterStats(m, level, 0);
  return makeUnit({
    id: uid,
    name: m.nameKo,
    team,
    kind: "monster",
    monsterId: m.id,
    element: m.element,
    stats: { ...stats },
    skillCoeff: m.skillCoeff,
    skills: skillsForMonster(m, 0),
    stonePassive: m.stonePassiveId,
  });
}

function scaleScenarioEnemyHp(unit: Unit, stage: StageDef): Unit {
  const mul = scenarioEnemyHpMul(stage);
  if (mul === 1) return unit;
  const hp = Math.max(1, Math.round(unit.stats.hp * mul));
  unit.stats = { ...unit.stats, hp };
  unit.hp = hp;
  if (unit.originalMaxHp != null) unit.originalMaxHp = hp;
  return unit;
}

export function createNewSave(now = Date.now()): PlayerSave {
  const { roster, party, scrolls, scrollsPremium, scrollsMystic } =
    createStarterRoster();
  const summoners = createSummonerRoster();
  const gear = normalizeSummonerGear(summoners.light.gear, "light");
  const s1 = { ...createStarterHwalro(1), id: "starter_sym_1" };
  const s2 = { ...createStarterHwalro(2), id: "starter_sym_2" };
  roster[0] = {
    ...roster[0]!,
    symbolSlots: [s1.id, s2.id, null, null, null, null],
  };
  return {
    island: createStarterIsland(now),
    symbols: [s1, s2],
    clearedStages: [],
    clearedHardStages: [],
    clearedHellStages: [],
    roster,
    party,
    partyPresets: [
      { summoner: "light" as SummonerElement, party: [...party] },
      emptyPartyPreset("light"),
      emptyPartyPreset("light"),
      emptyPartyPreset("light"),
      emptyPartyPreset("light"),
    ],
    activePartyPreset: 0,
    scrolls,
    scrollsPremium,
    scrollsMystic,
    gear,
    gearBag: [],
    gearBagSlots: GEAR_BAG_BASE_SLOTS,
    summonerAwaken: 0,
    summoners,
    activeSummoner: "light",
    unlockedSummoners: ["light"],
    starterSummonerPicked: false,
    skillTree: [],
    summonerMagic: createEmptySummonerMagic(),
    summonerMagicLoadouts: createEmptySummonerMagicLoadouts(),
    gloryPoints: 0,
    friendshipPoints: 0,
    jinmunStones: 0,
    gloryLevels: {},
    arenaBanIds: [],
    arenaSeasonWins: 0,
    guildContribution: 0,
    dojoDrills: 0,
    dojoDrillDay: null,
    dojoDrillsToday: 0,
    circleInscriptions: {},
    guildName: null,
    guildCheckInDay: null,
    guildRaidBest: 0,
    seasonRewardsClaimed: 0,
    equipVaultWeekKey: isoWeekKey(now),
    equipVaultWeekEntries: 0,
    symbolBagSlots: SYMBOL_BAG_BASE_SLOTS,
    awakenMats: {},
    skillMats: 0,
    arenaDefense: null,
    arenaAttacksToday: 0,
    arenaAttackDay: null,
    shopDayKey: null,
    shopSoldIds: [],
    shopBuyCounts: {},
    trialTokens: 0,
    trialTitleUnlocked: false,
    guildWeekKey: isoWeekKey(now),
    guildWeekContrib: 0,
    guildCheckInStreak: 0,
    guildChestClaimedWeek: null,
    raidBossHp: RAID_BOSS_MAX_HP,
    raidAttemptsDay: 0,
    raidAttemptDay: null,
    raidMilestonesClaimed: [],
    raidWeekKey: isoWeekKey(now),
    grindstones: 1,
    imprintStones: 0,
    claimedMailIds: [],
    updatedAt: 0,
    dailyActivity: emptyDailyActivity(),
    claimedMissionKeys: [],
    claimedMainQuestIds: [],
    profileIconId: null,
    profileNickname: null,
    nicknameChangeCount: 0,
    onboardRite: null,
  };
}

/** Prefixed demo save for test entry (extra mana/scrolls/levels). */
export function createDemoSave(now = Date.now()): PlayerSave {
  const save = createNewSave(now);
  return syncSummonerMirrors({
    ...save,
    scrolls: 20,
    scrollsPremium: 5,
    scrollsMystic: 3,
    gloryPoints: 120,
    friendshipPoints: 80,
    jinmunStones: 5,
    grindstones: Math.max(save.grindstones ?? 0, 2),
    imprintStones: Math.max(save.imprintStones ?? 0, 1),
    summoners: createSummonerRoster({ level: 10, exp: 40 }),
    unlockedSummoners: [...SUMMONER_ELEMENTS],
    starterSummonerPicked: true,
    island: {
      ...save.island,
      mana: 5000,
      crystal: 30,
      energy: save.island.energyMax,
    },
    roster: save.roster.map((m, i) =>
      i === 0 ? { ...m, level: 8, evolve: 0 } : { ...m, level: 5 },
    ),
    clearedStages: ["garen_1_1", "garen_1_2", "garen_1_3", "garen_1_4", "garen_1_5"],
    onboardRite: {
      step: "done",
      openedStages: true,
      openedRegion: true,
      summoned: true,
      enhanced: true,
      partySet: true,
      equipped: true,
      hasBattleDrop: false,
      welcomeSeen: true,
    },
  });
}

export function homeCollect(save: PlayerSave, now = Date.now()): LoopStepResult {
  let island = tickProduction(save.island, now);
  const before = island.mana;
  island = collectMana(island, "mana_pond", now);
  const gained = Math.floor(island.mana - before);
  let next: PlayerSave = { ...save, island };
  if (gained > 0) next = bumpDailyActivity(next, "collect", 1, now);
  return {
    save: next,
    message: `골드 연못 수집: 골드 +${gained} (보유 ${Math.floor(island.mana)})`,
  };
}

export function homeCollectCrystal(
  save: PlayerSave,
  now = Date.now(),
): LoopStepResult {
  let island = tickProduction(save.island, now);
  if (!island.buildings.some((b) => b.id === "crystal_mine")) {
    island = syncBuildingUnlocks(island, now);
  }
  if (!island.buildings.some((b) => b.id === "crystal_mine")) {
    return {
      save: { ...save, island },
      message: "수정 광맥 해금 필요 (소환사 Lv.10)",
    };
  }
  const before = island.crystal;
  island = collectCrystal(island, "crystal_mine", now);
  const gained = island.crystal - before;
  let next: PlayerSave = { ...save, island };
  if (gained > 0) next = bumpDailyActivity(next, "collect", 1, now);
  return {
    save: next,
    message: `수정 광맥 수집: 크리스탈 +${gained} (보유 ${island.crystal})`,
  };
}

export function runDailyWish(
  save: PlayerSave,
  now = Date.now(),
  rng: () => number = Math.random,
): LoopStepResult {
  const r = runWish(save.island, now, rng);
  const reward = r.reward;
  let next: PlayerSave = {
    ...save,
    island: r.island,
  };
  if (reward) {
    next = {
      ...bumpDailyActivity(save, "wish", 1, now),
      island: r.island,
    };
    switch (reward.kind) {
      case "scroll":
        next = { ...next, scrolls: (next.scrolls ?? 0) + reward.amount };
        break;
      case "skill_mats":
        next = { ...next, skillMats: (next.skillMats ?? 0) + reward.amount };
        break;
      case "jinmun":
        next = { ...next, jinmunStones: (next.jinmunStones ?? 0) + reward.amount };
        break;
      case "grindstone":
        next = { ...next, grindstones: (next.grindstones ?? 0) + reward.amount };
        break;
      case "imprint_stone":
        next = {
          ...next,
          imprintStones: (next.imprintStones ?? 0) + reward.amount,
        };
        break;
      default:
        break;
    }
  }
  return {
    save: next,
    message: r.message,
    wishReward: reward,
  };
}

/** Upgrade a production building (mana pond / crystal mine). */
export function runUpgradeBuilding(
  save: PlayerSave,
  buildingId: BuildingId = "mana_pond",
): LoopStepResult {
  const island = tickProduction(save.island);
  const before =
    island.buildings.find((b) => b.id === buildingId)?.level ?? 0;
  const r = upgradeBuilding(island, buildingId, accountLevelOf(save));
  const after =
    r.island.buildings.find((b) => b.id === buildingId)?.level ?? 0;
  let next: PlayerSave = { ...save, island: r.island };
  if (after > before) next = bumpDailyActivity(next, "building");
  return {
    save: next,
    message: r.message,
  };
}

export function runBuyGlory(
  save: PlayerSave,
  buildingId: GloryBuildingId,
): LoopStepResult {
  const def = getGloryBuilding(buildingId);
  if (!def) return { save, message: `영광 건물 없음: ${buildingId}` };
  const cur = save.gloryLevels[buildingId] ?? 0;
  if (cur >= def.maxLevel) {
    return { save, message: `${def.nameKo} 이미 최대 Lv.${def.maxLevel}` };
  }
  const cost = def.gloryCostPerLevel;
  if (save.gloryPoints < cost) {
    return {
      save,
      message: `영광포인트 부족 (필요 ${cost}, 보유 ${save.gloryPoints})`,
    };
  }
  const nextLv = cur + 1;
  const gloryLevels = { ...save.gloryLevels, [buildingId]: nextLv };
  const buff = gloryBuffFromLevels(gloryLevels);
  const island = {
    ...save.island,
    manaProdBonus: buff.manaProdPct,
  };
  return {
    save: bumpDailyActivity(
      {
        ...save,
        gloryPoints: save.gloryPoints - cost,
        gloryLevels,
        island,
      },
      "building",
    ),
    message: `영광: ${def.nameKo} Lv.${nextLv} (−영광 ${cost}) · ${def.effectKo}`,
  };
}

export const FUSION_MANA_COST = 800;
/** Crystal cost from the second profile nickname change onward. */
export const NICKNAME_CHANGE_CRYSTAL_COST = 300;
export const ENERGY_CRYSTAL_COST = 10;
export const ENERGY_BUY_AMOUNT = 20;

export function nicknameChangeCrystalCost(save: PlayerSave): number {
  return (save.nicknameChangeCount ?? 0) > 0
    ? NICKNAME_CHANGE_CRYSTAL_COST
    : 0;
}

export function runSetProfileIcon(
  save: PlayerSave,
  monsterId: string | null,
): PlayerSave {
  if (!monsterId) return { ...save, profileIconId: null };
  const id = resolveMonsterId(monsterId);
  const owned = save.roster.some((m) => resolveMonsterId(m.monsterId) === id);
  if (!owned) return save;
  return { ...save, profileIconId: id };
}

export function runChangeProfileNickname(
  save: PlayerSave,
  nickname: string,
): LoopStepResult {
  const next = nickname.trim();
  if (!next || next === (save.profileNickname ?? "").trim()) {
    return { save, message: "unchanged" };
  }
  const cost = nicknameChangeCrystalCost(save);
  if (cost > 0 && save.island.crystal < cost) {
    return { save, message: "crystal_short" };
  }
  return {
    save: {
      ...save,
      profileNickname: next,
      nicknameChangeCount: (save.nicknameChangeCount ?? 0) + 1,
      island:
        cost > 0
          ? { ...save.island, crystal: save.island.crystal - cost }
          : save.island,
    },
    message: "ok",
  };
}
/** Shop: buy grindstones for symbol forge (crystal — rare). */
export const GRINDSTONE_BUY_CRYSTAL_COST = 28;
export const GRINDSTONE_BUY_AMOUNT = 1;
/** Shop: buy imprint stones for symbol main re-roll (crystal — rarer). */
export const IMPRINT_STONE_BUY_CRYSTAL_COST = 45;
export const IMPRINT_STONE_BUY_AMOUNT = 1;

/** Symbol bag: start 100, +10 per expand, hard cap 1000. */
export const SYMBOL_BAG_BASE_SLOTS = 100;
export const SYMBOL_BAG_EXPAND_STEP = 10;
export const SYMBOL_BAG_MAX_SLOTS = 1000;
/** Expand cost: 10, 20, … then caps at 100 crystal each. */
export const SYMBOL_BAG_EXPAND_COST_START = 10;
export const SYMBOL_BAG_EXPAND_COST_STEP = 10;
export const SYMBOL_BAG_EXPAND_COST_CAP = 100;

export function symbolBagCapacity(save: PlayerSave): number {
  const raw =
    typeof save.symbolBagSlots === "number"
      ? save.symbolBagSlots
      : SYMBOL_BAG_BASE_SLOTS;
  return Math.min(
    SYMBOL_BAG_MAX_SLOTS,
    Math.max(SYMBOL_BAG_BASE_SLOTS, Math.floor(raw)),
  );
}

/** How many +10 expands have already been purchased. */
export function symbolBagExpandCount(save: PlayerSave): number {
  return Math.max(
    0,
    Math.floor(
      (symbolBagCapacity(save) - SYMBOL_BAG_BASE_SLOTS) / SYMBOL_BAG_EXPAND_STEP,
    ),
  );
}

/** Crystal cost for the next +10 expand, or null if already at max. */
export function symbolBagExpandCost(save: PlayerSave): number | null {
  if (symbolBagCapacity(save) >= SYMBOL_BAG_MAX_SLOTS) return null;
  const n = symbolBagExpandCount(save);
  return Math.min(
    SYMBOL_BAG_EXPAND_COST_START + n * SYMBOL_BAG_EXPAND_COST_STEP,
    SYMBOL_BAG_EXPAND_COST_CAP,
  );
}

/** Buy +10 symbol bag slots for crystal. */
export function runExpandSymbolBag(save: PlayerSave): LoopStepResult {
  const cost = symbolBagExpandCost(save);
  if (cost == null) {
    return {
      save,
      message: `상징 가방 슬롯 최대 (${SYMBOL_BAG_MAX_SLOTS})`,
    };
  }
  if (save.island.crystal < cost) {
    return {
      save,
      message: `크리스탈 부족 (필요 ${cost}, 보유 ${save.island.crystal})`,
    };
  }
  const next = Math.min(
    SYMBOL_BAG_MAX_SLOTS,
    symbolBagCapacity(save) + SYMBOL_BAG_EXPAND_STEP,
  );
  return {
    save: {
      ...save,
      symbolBagSlots: next,
      island: {
        ...save.island,
        crystal: save.island.crystal - cost,
      },
    },
    message: `상징 가방 +${SYMBOL_BAG_EXPAND_STEP} (−크리스탈 ${cost}) · ${next}/${SYMBOL_BAG_MAX_SLOTS}`,
  };
}

export function gearBagCapacity(save: PlayerSave): number {
  const raw =
    typeof save.gearBagSlots === "number"
      ? save.gearBagSlots
      : GEAR_BAG_BASE_SLOTS;
  return Math.min(
    GEAR_BAG_MAX_SLOTS,
    Math.max(GEAR_BAG_BASE_SLOTS, Math.floor(raw)),
  );
}

export function gearBagExpandCount(save: PlayerSave): number {
  return Math.max(
    0,
    Math.floor(
      (gearBagCapacity(save) - GEAR_BAG_BASE_SLOTS) / GEAR_BAG_EXPAND_STEP,
    ),
  );
}

/** Crystal cost for the next +10 expand, matching symbol-bag prices. */
export function gearBagExpandCost(save: PlayerSave): number | null {
  if (gearBagCapacity(save) >= GEAR_BAG_MAX_SLOTS) return null;
  const n = gearBagExpandCount(save);
  return Math.min(
    SYMBOL_BAG_EXPAND_COST_START + n * SYMBOL_BAG_EXPAND_COST_STEP,
    SYMBOL_BAG_EXPAND_COST_CAP,
  );
}

/** Buy +10 gear bag slots for crystal. */
export function runExpandGearBag(save: PlayerSave): LoopStepResult {
  const cost = gearBagExpandCost(save);
  if (cost == null) {
    return {
      save,
      message: `장비 가방 슬롯 최대 (${GEAR_BAG_MAX_SLOTS})`,
    };
  }
  if (save.island.crystal < cost) {
    return {
      save,
      message: `크리스탈 부족 (필요 ${cost}, 보유 ${save.island.crystal})`,
    };
  }
  const next = Math.min(
    GEAR_BAG_MAX_SLOTS,
    gearBagCapacity(save) + GEAR_BAG_EXPAND_STEP,
  );
  return {
    save: {
      ...save,
      gearBagSlots: next,
      island: {
        ...save.island,
        crystal: save.island.crystal - cost,
      },
    },
    message: `장비 가방 +${GEAR_BAG_EXPAND_STEP} (−크리스탈 ${cost}) · ${next}/${GEAR_BAG_MAX_SLOTS}`,
  };
}
/** 제작소: 진문석 + 골드 → 소환서 */
export const CRAFT_SCROLL_JINMUN = 2;
export const CRAFT_SCROLL_MANA = 300;
/** 정수 공방: 진문석 → 크리스탈 */
export const ESSENCE_JINMUN_COST = 1;
export const ESSENCE_CRYSTAL_GAIN = 4;

export function symbolSellMana(enhance: number): number {
  return 40 + enhance * 18;
}

/**
 * Fusion stub: sacrifice two same-species monsters → keep one with +1 evolve (cap MAX_EVOLVE).
 */
export function runFusion(
  save: PlayerSave,
  refA: string,
  refB: string,
): LoopStepResult {
  const island = syncBuildingUnlocks(tickProduction(save.island));
  if (
    !island.buildings.some((b) => b.id === "fusion_star") &&
    island.summonerLevel < 17
  ) {
    return {
      save: { ...save, island },
      message: "융합의 별 해금 필요 (소환사 Lv.17)",
    };
  }
  const a = resolveOwned(save, refA);
  const b = resolveOwned(save, refB);
  if (!a || !b) return { save, message: "융합 재료 소환수를 찾을 수 없음" };
  if (a.uid === b.uid) return { save, message: "같은 소환수는 융합할 수 없음" };
  if (a.monsterId !== b.monsterId) {
    return { save, message: "동일 종만 융합 가능 (스텁)" };
  }
  if (island.mana < FUSION_MANA_COST) {
    return {
      save: { ...save, island },
      message: `골드 부족 (필요 ${FUSION_MANA_COST}, 보유 ${Math.floor(island.mana)})`,
    };
  }
  const keepEvolve = Math.min(
    MAX_EVOLVE,
    Math.max(a.evolve ?? 0, b.evolve ?? 0) + 1,
  );
  const keepLevel = Math.max(a.level, b.level);
  const keepSkills: [number, number, number] = [
    Math.max(
      normalizeSkillLevels(a.skillLevels)[0]!,
      normalizeSkillLevels(b.skillLevels)[0]!,
    ),
    Math.max(
      normalizeSkillLevels(a.skillLevels)[1]!,
      normalizeSkillLevels(b.skillLevels)[1]!,
    ),
    Math.max(
      normalizeSkillLevels(a.skillLevels)[2]!,
      normalizeSkillLevels(b.skillLevels)[2]!,
    ),
  ];
  const keepSlots = [...(a.symbolSlots ?? emptySymbolSlots())];
  const dropSlots = b.symbolSlots ?? emptySymbolSlots();
  // Prefer keeper's symbols; fill empty from donor
  for (let i = 0; i < 6; i++) {
    if (!keepSlots[i] && dropSlots[i]) keepSlots[i] = dropSlots[i]!;
  }

  const kept = {
    ...a,
    level: keepLevel,
    evolve: keepEvolve,
    skillLevels: keepSkills,
    symbolSlots: keepSlots,
  };
  const roster = save.roster
    .filter((m) => m.uid !== b.uid)
    .map((m) => (m.uid === a.uid ? kept : m));
  const party = save.party.filter((uid) => uid !== b.uid);
  return {
    save: {
      ...save,
      island: { ...island, mana: island.mana - FUSION_MANA_COST },
      roster,
      party,
    },
    message: `융합: ${describeOwned(kept)} (−골드 ${FUSION_MANA_COST}, 재료 1소모)`,
  };
}

/**
 * Recipe combination: consume matching fodder and grant a new result monster.
 * Available from the island combination circle (power_circle / fusion view).
 */
export function runRecipeFusion(
  save: PlayerSave,
  recipeId: string,
  fodderUids?: string[],
): LoopStepResult {
  const island = syncBuildingUnlocks(tickProduction(save.island));
  const recipe = getFusionRecipe(recipeId);
  if (!recipe) return { save, message: `조합 레시피 없음: ${recipeId}` };
  const needLv = recipe.unlockSummonerLevel ?? 1;
  if (island.summonerLevel < needLv) {
    return {
      save: { ...save, island },
      message: `조합 해금 필요 (소환사 Lv.${needLv})`,
    };
  }
  const cost = recipe.manaCost ?? FUSION_MANA_COST;
  if (island.mana < cost) {
    return {
      save: { ...save, island },
      message: `골드 부족 (필요 ${cost}, 보유 ${Math.floor(island.mana)})`,
    };
  }
  if (!getMonster(recipe.resultMonsterId)) {
    return { save, message: `결과 몬스터 없음: ${recipe.resultMonsterId}` };
  }
  const planned = planFusionRecipe(save.roster, recipe);
  const useUids =
    fodderUids && fodderUids.length > 0 ? fodderUids : planned.fodderUids;
  if (!planned.ok && (!fodderUids || fodderUids.length === 0)) {
    return { save, message: `조합 재료 부족 (${recipe.nameKo})` };
  }
  if (useUids.length !== recipe.fodderMonsterIds.length) {
    return {
      save,
      message: `재료 수 불일치 (필요 ${recipe.fodderMonsterIds.length})`,
    };
  }
  const fodderOwned = useUids.map((uid) => resolveOwned(save, uid));
  if (fodderOwned.some((m) => !m)) {
    return { save, message: "조합 재료 소환수를 찾을 수 없음" };
  }
  const need = [...recipe.fodderMonsterIds].sort();
  const have = fodderOwned
    .map((m) => m!.monsterId)
    .map((id) => resolveMonsterId(id))
    .sort();
  if (need.length !== have.length || need.some((id, i) => id !== have[i])) {
    return { save, message: `레시피 재료 불일치 (${recipe.nameKo})` };
  }

  const dropUids = new Set(useUids);
  const created: OwnedMonster = {
    uid: nextUid("fuse"),
    monsterId: recipe.resultMonsterId,
    level: 1,
    exp: 0,
    symbolSlots: emptySymbolSlots(),
    evolve: 0,
    awaken: 0,
    skillLevels: defaultSkillLevels(),
  };
  const roster = [
    ...save.roster.filter((m) => !dropUids.has(m.uid)),
    created,
  ];
  const party = save.party.filter((uid) => !dropUids.has(uid));
  if (party.length < 4) party.push(created.uid);
  const resultName =
    getMonster(recipe.resultMonsterId)?.nameKo ?? recipe.resultMonsterId;
  return {
    save: {
      ...save,
      island: { ...island, mana: island.mana - cost },
      roster,
      party,
    },
    message: `조합: ${recipe.nameKo} → ${resultName} (−골드 ${cost})`,
    fusedUid: created.uid,
  };
}

/** Buy one daily shop offer (once per offer per day). */
export function runBuyShopOffer(
  save: PlayerSave,
  offerId: string,
  now = Date.now(),
  rng: () => number = Math.random,
): LoopStepResult {
  let working = syncShopDay(save, now);
  const day = working.shopDayKey ?? todayKey(now);
  const offers = getDailyShopOffers(day);
  const offer = offers.find((o) => o.id === offerId);
  if (!offer) return { save: working, message: `상점 상품 없음: ${offerId}` };
  const sold = new Set(working.shopSoldIds ?? []);
  if (sold.has(offerId)) {
    return { save: working, message: "오늘 이미 구매한 상품입니다" };
  }
  if (offer.costMana > 0 && working.island.mana < offer.costMana) {
    return {
      save: working,
      message: `골드 부족 (필요 ${offer.costMana}, 보유 ${Math.floor(working.island.mana)})`,
    };
  }
  if (offer.costCrystal > 0 && working.island.crystal < offer.costCrystal) {
    return {
      save: working,
      message: `크리스탈 부족 (필요 ${offer.costCrystal}, 보유 ${working.island.crystal})`,
    };
  }

  let next: PlayerSave = {
    ...working,
    island: {
      ...working.island,
      mana: working.island.mana - offer.costMana,
      crystal: working.island.crystal - offer.costCrystal,
    },
    shopSoldIds: [...sold, offerId],
  };

  if (offer.kind === "scroll_normal") {
    next = withScrollDelta(next, "normal", offer.qty);
  } else if (offer.kind === "scroll_premium") {
    next = withScrollDelta(next, "premium", offer.qty);
  } else if (offer.kind === "energy") {
    next = {
      ...next,
      island: grantEnergy(next.island, offer.qty),
    };
  } else if (offer.kind === "symbol_roll") {
    if (next.symbols.length >= symbolBagCapacity(next)) {
      return {
        save: working,
        message: `상징 가방이 가득 참 (${symbolBagCapacity(next)})`,
      };
    }
    const sym = rollSymbolDrop(rng, `shop_${offerId}`, {});
    next = bumpDailyActivity(
      { ...next, symbols: [...next.symbols, sym] },
      "shop",
      1,
      now,
    );
    return {
      save: next,
      message: `일일상점: ${describeSymbol(sym)} (−골드 ${offer.costMana})`,
    };
  } else if (offer.kind === "grindstone") {
    next = {
      ...next,
      grindstones: (next.grindstones ?? 0) + offer.qty,
    };
  } else if (offer.kind === "imprint_stone") {
    next = {
      ...next,
      imprintStones: (next.imprintStones ?? 0) + offer.qty,
    };
  }

  const costNote =
    offer.costCrystal > 0
      ? `−크리스탈 ${offer.costCrystal}`
      : `−골드 ${offer.costMana}`;
  return {
    save: bumpDailyActivity(next, "shop", 1, now),
    message: `일일상점: ${offer.labelKo} x${offer.qty} (${costNote})`,
  };
}

/** Buy energy with crystal (shop / emergency refill). */
export function runBuyEnergy(
  save: PlayerSave,
  packs = 1,
  now = Date.now(),
): LoopStepResult {
  const n = Math.max(1, Math.min(10, Math.floor(packs)));
  const cost = ENERGY_CRYSTAL_COST * n;
  const gain = ENERGY_BUY_AMOUNT * n;
  let working = syncShopDay(save, now);
  if (working.island.crystal < cost) {
    return {
      save: working,
      message: `크리스탈 부족 (필요 ${cost}, 보유 ${working.island.crystal})`,
    };
  }
  const quota = tryConsumeCatalogQuota(working, "energy", n, now);
  if (!quota.ok) return { save: quota.save, message: quota.message };
  working = quota.save;
  const island = {
    ...grantEnergy(working.island, gain),
    crystal: working.island.crystal - cost,
  };
  const max = island.energyMax ?? 100;
  return {
    save: bumpDailyActivity(
      {
        ...working,
        island,
      },
      "shop",
      1,
      now,
    ),
    message: `에너지 +${Math.floor(island.energy - working.island.energy)} (−크리스탈 ${cost}) · 보유 ${Math.floor(island.energy)}/${max}`,
  };
}

/** Buy grindstones with crystal (shop stock for symbol forge). */
export function runBuyGrindstone(
  save: PlayerSave,
  packs = 1,
  now = Date.now(),
): LoopStepResult {
  const n = Math.max(1, Math.min(10, Math.floor(packs)));
  const qty = GRINDSTONE_BUY_AMOUNT * n;
  const cost = GRINDSTONE_BUY_CRYSTAL_COST * n;
  let working = syncShopDay(save, now);
  if (working.island.crystal < cost) {
    return {
      save: working,
      message: `크리스탈 부족 (필요 ${cost}, 보유 ${working.island.crystal})`,
    };
  }
  const quota = tryConsumeCatalogQuota(working, "grindstone", n, now);
  if (!quota.ok) return { save: quota.save, message: quota.message };
  working = quota.save;
  const next = (working.grindstones ?? 0) + qty;
  return {
    save: bumpDailyActivity(
      {
        ...working,
        island: { ...working.island, crystal: working.island.crystal - cost },
        grindstones: next,
      },
      "shop",
      1,
      now,
    ),
    message: `연마석 +${qty} (−크리스탈 ${cost}) · 보유 ${next}`,
  };
}

/** Buy imprint stones with crystal (shop stock for symbol main re-roll). */
export function runBuyImprintStone(
  save: PlayerSave,
  packs = 1,
  now = Date.now(),
): LoopStepResult {
  const n = Math.max(1, Math.min(10, Math.floor(packs)));
  const qty = IMPRINT_STONE_BUY_AMOUNT * n;
  const cost = IMPRINT_STONE_BUY_CRYSTAL_COST * n;
  let working = syncShopDay(save, now);
  if (working.island.crystal < cost) {
    return {
      save: working,
      message: `크리스탈 부족 (필요 ${cost}, 보유 ${working.island.crystal})`,
    };
  }
  const quota = tryConsumeCatalogQuota(working, "imprint_stone", n, now);
  if (!quota.ok) return { save: quota.save, message: quota.message };
  working = quota.save;
  const next = (working.imprintStones ?? 0) + qty;
  return {
    save: bumpDailyActivity(
      {
        ...working,
        island: { ...working.island, crystal: working.island.crystal - cost },
        imprintStones: next,
      },
      "shop",
      1,
      now,
    ),
    message: `각인석 +${qty} (−크리스탈 ${cost}) · 보유 ${next}`,
  };
}

export type ArenaShopSku = "arena_gold" | "arena_energy" | "arena_scroll" | "arena_grind";
export type FriendShopSku = "friend_gold" | "friend_energy" | "friend_scroll" | "friend_grind";
export type CashPackSku =
  | "pack_crystal_250"
  | "pack_crystal_650"
  | "pack_crystal_1400"
  | "pack_energy";

export const ARENA_SHOP: Record<
  ArenaShopSku,
  { glory: number; gold?: number; energy?: number; premiumScrolls?: number; grindstones?: number; daily: number }
> = {
  arena_gold: { glory: 15, gold: 50000, daily: 5 },
  arena_energy: { glory: 15, energy: 50, daily: 5 },
  arena_scroll: { glory: 30, premiumScrolls: 1, daily: 3 },
  arena_grind: { glory: 20, grindstones: 1, daily: 5 },
};

export const FRIEND_SHOP: Record<
  FriendShopSku,
  { fp: number; gold?: number; energy?: number; scrolls?: number; grindstones?: number; daily: number }
> = {
  friend_gold: { fp: 5, gold: 30000, daily: 10 },
  friend_energy: { fp: 5, energy: 10, daily: 10 },
  friend_scroll: { fp: 10, scrolls: 1, daily: 5 },
  friend_grind: { fp: 20, grindstones: 1, daily: 5 },
};

export const CASH_PACKS: Record<
  CashPackSku,
  { krw: number; crystal?: number; energy?: number; scrolls?: number; daily: number }
> = {
  pack_crystal_250: { krw: 3300, crystal: 250, daily: 3 },
  pack_crystal_650: { krw: 6600, crystal: 700, daily: 3 },
  pack_crystal_1400: { krw: 11000, crystal: 1550, daily: 3 },
  pack_energy: { krw: 3300, energy: 100, scrolls: 5, daily: 3 },
};

export function shopQuotaRemaining(
  save: PlayerSave,
  sku: string,
  limit: number,
  now = Date.now(),
): number {
  const synced = syncShopDay(save, now);
  const bought = Math.max(0, Math.floor(synced.shopBuyCounts?.[sku] ?? 0));
  return Math.max(0, limit - bought);
}

export function grantFriendshipPoints(save: PlayerSave, n: number): PlayerSave {
  const add = Math.max(0, Math.floor(n));
  if (!add) return save;
  return { ...save, friendshipPoints: (save.friendshipPoints ?? 0) + add };
}

export function runBuyArenaShop(
  save: PlayerSave,
  sku: ArenaShopSku,
  now = Date.now(),
): LoopStepResult {
  const def = ARENA_SHOP[sku];
  if (!def) return { save, message: "상품 없음" };
  let working = syncShopDay(save, now);
  const glory = working.gloryPoints ?? 0;
  if (glory < def.glory) {
    return { save: working, message: `영광 부족 (필요 ${def.glory}, 보유 ${glory})` };
  }
  const quota = tryConsumeShopQuota(working, sku, def.daily, 1, now);
  if (!quota.ok) return { save: quota.save, message: quota.message };
  working = quota.save;
  let next: PlayerSave = { ...working, gloryPoints: glory - def.glory };
  if (def.gold) {
    next = { ...next, island: { ...next.island, mana: next.island.mana + def.gold } };
  }
  if (def.energy) {
    next = { ...next, island: grantEnergy(next.island, def.energy) };
  }
  if (def.premiumScrolls) {
    next = withScrollDelta(next, "premium", def.premiumScrolls);
  }
  if (def.grindstones) {
    next = { ...next, grindstones: (next.grindstones ?? 0) + def.grindstones };
  }
  return {
    save: bumpDailyActivity(next, "shop", 1, now),
    message: `아레나 상점 구매 (−영광 ${def.glory})`,
  };
}

export function runBuyFriendShop(
  save: PlayerSave,
  sku: FriendShopSku,
  now = Date.now(),
): LoopStepResult {
  const def = FRIEND_SHOP[sku];
  if (!def) return { save, message: "상품 없음" };
  let working = syncShopDay(save, now);
  const fp = working.friendshipPoints ?? 0;
  if (fp < def.fp) {
    return { save: working, message: `우정 부족 (필요 ${def.fp}, 보유 ${fp})` };
  }
  const quota = tryConsumeShopQuota(working, sku, def.daily, 1, now);
  if (!quota.ok) return { save: quota.save, message: quota.message };
  working = quota.save;
  let next: PlayerSave = { ...working, friendshipPoints: fp - def.fp };
  if (def.gold) {
    next = { ...next, island: { ...next.island, mana: next.island.mana + def.gold } };
  }
  if (def.energy) {
    next = { ...next, island: grantEnergy(next.island, def.energy) };
  }
  if (def.scrolls) {
    next = withScrollDelta(next, "normal", def.scrolls);
  }
  if (def.grindstones) {
    next = { ...next, grindstones: (next.grindstones ?? 0) + def.grindstones };
  }
  return {
    save: bumpDailyActivity(next, "shop", 1, now),
    message: `우정상점 구매 (−우정 ${def.fp})`,
  };
}

/** Cash pack grant (web sandbox until Play Billing IAP is wired). */
export function runBuyCashPack(
  save: PlayerSave,
  sku: CashPackSku,
  now = Date.now(),
): LoopStepResult {
  const def = CASH_PACKS[sku];
  if (!def) return { save, message: "상품 없음" };
  let working = syncShopDay(save, now);
  const quota = tryConsumeShopQuota(working, sku, def.daily, 1, now);
  if (!quota.ok) return { save: quota.save, message: quota.message };
  working = quota.save;
  let next: PlayerSave = working;
  if (def.crystal) {
    next = {
      ...next,
      island: { ...next.island, crystal: next.island.crystal + def.crystal },
    };
  }
  if (def.energy) {
    next = { ...next, island: grantEnergy(next.island, def.energy) };
  }
  if (def.scrolls) {
    next = withScrollDelta(next, "normal", def.scrolls);
  }
  return {
    save: bumpDailyActivity(next, "shop", 1, now),
    message: `패키지 구매`,
  };
}

/** Craft hall: jinmun + mana → summon scroll. */
export function runCraftScroll(save: PlayerSave): LoopStepResult {
  let island = syncBuildingUnlocks(tickProduction(save.island));
  if (
    !island.buildings.some((b) => b.id === "craft_hall") &&
    island.summonerLevel < 19
  ) {
    return {
      save: { ...save, island },
      message: "제작소 해금 필요 (소환사 Lv.19)",
    };
  }
  if ((save.jinmunStones ?? 0) < CRAFT_SCROLL_JINMUN) {
    return {
      save,
      message: `진문석 부족 (필요 ${CRAFT_SCROLL_JINMUN}, 보유 ${save.jinmunStones ?? 0})`,
    };
  }
  if (island.mana < CRAFT_SCROLL_MANA) {
    return {
      save: { ...save, island },
      message: `골드 부족 (필요 ${CRAFT_SCROLL_MANA}, 보유 ${Math.floor(island.mana)})`,
    };
  }
  return {
    save: {
      ...save,
      island: { ...island, mana: island.mana - CRAFT_SCROLL_MANA },
      jinmunStones: (save.jinmunStones ?? 0) - CRAFT_SCROLL_JINMUN,
      scrollsMystic: scrollCount(save, "mystic") + 1,
    },
    message: `제작: ${SCROLL_KIND_LABEL.mystic} +1 (−진문석 ${CRAFT_SCROLL_JINMUN} · −골드 ${CRAFT_SCROLL_MANA})`,
  };
}

/** Fuse center: jinmun → crystal. */
export function runCraftEssence(save: PlayerSave): LoopStepResult {
  let island = syncBuildingUnlocks(tickProduction(save.island));
  if (
    !island.buildings.some((b) => b.id === "fuse_center") &&
    island.summonerLevel < 12
  ) {
    return {
      save: { ...save, island },
      message: "정수 공방 해금 필요 (소환사 Lv.12)",
    };
  }
  if ((save.jinmunStones ?? 0) < ESSENCE_JINMUN_COST) {
    return {
      save,
      message: `진문석 부족 (필요 ${ESSENCE_JINMUN_COST}, 보유 ${save.jinmunStones ?? 0})`,
    };
  }
  return {
    save: {
      ...save,
      island: {
        ...island,
        crystal: island.crystal + ESSENCE_CRYSTAL_GAIN,
      },
      jinmunStones: (save.jinmunStones ?? 0) - ESSENCE_JINMUN_COST,
    },
    message: `정수: 크리스탈 +${ESSENCE_CRYSTAL_GAIN} (−진문석 ${ESSENCE_JINMUN_COST})`,
  };
}

/** Sell inventory symbol for mana (unequips first). */
export function runSellSymbol(
  save: PlayerSave,
  idOrIndex: string,
): LoopStepResult {
  const sym = resolveSymbol(save, idOrIndex);
  if (!sym) return { save, message: `상징 없음: ${idOrIndex}` };
  const gain = symbolSellMana(sym.enhance);
  const roster = save.roster.map((m) => {
    const slots = [...(m.symbolSlots ?? emptySymbolSlots())];
    return {
      ...m,
      symbolSlots: slots.map((id) => (id === sym.id ? null : id)),
    };
  });
  const symbols = save.symbols.filter((s) => s.id !== sym.id);
  return {
    save: {
      ...save,
      roster,
      symbols,
      island: { ...save.island, mana: save.island.mana + gain },
    },
    message: `상징 판매: ${describeSymbol(sym)} · 골드 +${gain}`,
  };
}

export const DOJO_DAILY_LIMIT = 3;
export const DOJO_DRILL_JINMUN = 1;
export const DOJO_DRILL_EXP = 3;

export function dojoDayState(
  save: PlayerSave,
  now = Date.now(),
): { day: string; drillsToday: number } {
  const day = todayKey(now);
  if ((save.dojoDrillDay ?? null) === day) {
    return { day, drillsToday: save.dojoDrillsToday ?? 0 };
  }
  return { day, drillsToday: 0 };
}

/** Practice hall: limited daily drills that grant 진문석 for circle inscriptions. */
export function runPracticeDojo(
  save: PlayerSave,
  now = Date.now(),
): LoopStepResult {
  let island = syncBuildingUnlocks(tickProduction(save.island, now), now);
  if (
    !island.buildings.some((b) => b.id === "practice_dojo") &&
    island.summonerLevel < 8
  ) {
    return {
      save: { ...save, island },
      message: "진문 수련장 해금 필요 (소환사 Lv.8)",
    };
  }
  const { day, drillsToday } = dojoDayState(save, now);
  if (drillsToday >= DOJO_DAILY_LIMIT) {
    return {
      save: { ...save, island },
      message: `오늘 수련 한도 (${DOJO_DAILY_LIMIT}회)`,
    };
  }
  const active = getActiveSummoner({ ...save, island });
  const manaGain = 40 + active.level * 2;
  island = { ...island, mana: island.mana + manaGain };
  const leveled = addActiveSummonerExp({ ...save, island }, DOJO_DRILL_EXP);
  const nextDrillsToday = drillsToday + 1;
  const jinmunGain = DOJO_DRILL_JINMUN;
  const nextActive = getActiveSummoner(leveled.save);
  return {
    save: {
      ...bumpDailyActivity(leveled.save, "dojo", 1, now),
      dojoDrills: (save.dojoDrills ?? 0) + 1,
      dojoDrillDay: day,
      dojoDrillsToday: nextDrillsToday,
      jinmunStones: (save.jinmunStones ?? 0) + jinmunGain,
    },
    message: `진문 수련: 진문석 +${jinmunGain} · 골드 +${manaGain} · ${DOJO_DAILY_LIMIT - nextDrillsToday}/${DOJO_DAILY_LIMIT}${
      leveled.levelsGained > 0 ? ` · 소환사 Lv.${nextActive.level}` : ""
    }`,
    unlockedBuildingIds: leveled.unlockedBuildingIds,
  };
}

export function runBuyCircleInscription(
  save: PlayerSave,
  inscriptionId: CircleInscriptionId,
): LoopStepResult {
  const def = getCircleInscription(inscriptionId);
  if (!def) return { save, message: `진문 각인 없음: ${inscriptionId}` };
  let island = syncBuildingUnlocks(tickProduction(save.island));
  if (
    !island.buildings.some((b) => b.id === "practice_dojo") &&
    island.summonerLevel < 8
  ) {
    return {
      save: { ...save, island },
      message: "진문 수련장 해금 필요 (소환사 Lv.8)",
    };
  }
  const cur = save.circleInscriptions?.[inscriptionId] ?? 0;
  if (cur >= def.maxLevel) {
    return { save, message: `${def.nameKo} 이미 최대 Lv.${def.maxLevel}` };
  }
  const cost = def.jinmunCostPerLevel;
  if ((save.jinmunStones ?? 0) < cost) {
    return {
      save,
      message: `진문석 부족 (필요 ${cost}, 보유 ${save.jinmunStones ?? 0})`,
    };
  }
  const nextLv = cur + 1;
  const circleInscriptions = {
    ...(save.circleInscriptions ?? {}),
    [inscriptionId]: nextLv,
  };
  return {
    save: {
      ...save,
      island,
      jinmunStones: (save.jinmunStones ?? 0) - cost,
      circleInscriptions,
    },
    message: `진문 각인: ${def.nameKo} Lv.${nextLv} (−진문석 ${cost}) · ${def.effectKo}`,
  };
}

function guildHallIsland(save: PlayerSave) {
  const island = syncBuildingUnlocks(tickProduction(save.island));
  const unlocked =
    island.buildings.some((b) => b.id === "guild_hall") ||
    island.summonerLevel >= 12;
  return { island, unlocked };
}

function trimmedGuildName(name: string): string {
  return name.trim().slice(0, 16);
}

/** Join or rename local guild (non-realtime stub). */
export function runJoinGuild(
  save: PlayerSave,
  name: string,
): LoopStepResult {
  const { island, unlocked } = guildHallIsland(save);
  if (!unlocked) {
    return {
      save: { ...save, island },
      message: "길드 홀 해금 필요 (소환사 Lv.12)",
    };
  }
  const trimmed = trimmedGuildName(name);
  if (!trimmed) {
    return { save: { ...save, island }, message: "길드 이름을 입력하세요" };
  }
  return {
    save: { ...save, island, guildName: trimmed },
    message: `길드 가입: ${trimmed}`,
  };
}

/** Found a local guild (non-realtime stub). */
export function runCreateGuild(
  save: PlayerSave,
  name: string,
): LoopStepResult {
  const { island, unlocked } = guildHallIsland(save);
  if (!unlocked) {
    return {
      save: { ...save, island },
      message: "길드 홀 해금 필요 (소환사 Lv.12)",
    };
  }
  if (save.guildName) {
    return {
      save: { ...save, island },
      message: `이미 ${save.guildName} 소속입니다`,
    };
  }
  const trimmed = trimmedGuildName(name);
  if (!trimmed) {
    return { save: { ...save, island }, message: "길드 이름을 입력하세요" };
  }
  const held = Math.floor(island.crystal);
  if (held < GUILD_CREATE_CRYSTAL_COST) {
    return {
      save: { ...save, island },
      message: `크리스탈 부족 (필요 ${GUILD_CREATE_CRYSTAL_COST}, 보유 ${held})`,
    };
  }
  return {
    save: {
      ...save,
      island: { ...island, crystal: island.crystal - GUILD_CREATE_CRYSTAL_COST },
      guildName: trimmed,
    },
    message: `길드 창설: ${trimmed}`,
  };
}

/** Daily guild check-in → glory + contribution + weekly chest. */
export function runGuildCheckIn(
  save: PlayerSave,
  now = Date.now(),
): LoopStepResult {
  let island = syncBuildingUnlocks(tickProduction(save.island, now), now);
  if (
    !island.buildings.some((b) => b.id === "guild_hall") &&
    island.summonerLevel < 12
  ) {
    return {
      save: { ...save, island },
      message: "길드 홀 해금 필요 (소환사 Lv.12)",
    };
  }
  if (!save.guildName) {
    return {
      save: { ...save, island },
      message: "먼저 길드에 가입하세요",
    };
  }
  const day = todayKey(now);
  if (save.guildCheckInDay === day) {
    return {
      save: { ...save, island },
      message: `오늘 이미 출석했습니다 (${save.guildName})`,
    };
  }
  let working = syncGuildWeek({ ...save, island }, now);
  const prevDay = save.guildCheckInDay;
  let streak = working.guildCheckInStreak ?? 0;
  if (prevDay) {
    const prev = new Date(`${prevDay}T00:00:00.000Z`).getTime();
    const cur = new Date(`${day}T00:00:00.000Z`).getTime();
    const diffDays = Math.round((cur - prev) / 86_400_000);
    streak = diffDays === 1 ? streak + 1 : 1;
  } else {
    streak = 1;
  }
  const weekKey = working.guildWeekKey ?? isoWeekKey(now);
  const weekContrib =
    (working.guildWeekContrib ?? 0) + GUILD_CHECKIN_CONTRIB;
  let gloryPoints = (working.gloryPoints ?? 0) + GUILD_CHECKIN_GLORY;
  let guildContribution =
    (working.guildContribution ?? 0) + GUILD_CHECKIN_CONTRIB;
  let crystal = island.crystal;
  let chestNote = "";
  let guildChestClaimedWeek = working.guildChestClaimedWeek ?? null;
  if (
    weekContrib >= GUILD_WEEK_CONTRIB_GOAL &&
    guildChestClaimedWeek !== weekKey
  ) {
    gloryPoints += GUILD_CHEST_GLORY;
    crystal += GUILD_CHEST_CRYSTAL;
    guildChestClaimedWeek = weekKey;
    chestNote = ` · 주간상자 영광+${GUILD_CHEST_GLORY}/크+${GUILD_CHEST_CRYSTAL}`;
  }
  return {
    save: {
      ...bumpDailyActivity(working, "guild", 1, now),
      island: { ...island, crystal },
      guildCheckInDay: day,
      guildCheckInStreak: streak,
      guildWeekKey: weekKey,
      guildWeekContrib: weekContrib,
      guildChestClaimedWeek,
      gloryPoints,
      guildContribution,
    },
    message: `길드 출석 (${working.guildName}): 영광 +${GUILD_CHECKIN_GLORY} · 기여 +${GUILD_CHECKIN_CONTRIB} · 연속 ${streak}일 · 주간 ${weekContrib}/${GUILD_WEEK_CONTRIB_GOAL}${chestNote}`,
  };
}

export interface GuildRankRow {
  name: string;
  contribution: number;
  self?: boolean;
}

/** Async guild raid board stub (NPC + self). */
export function guildLeaderboard(save: PlayerSave): GuildRankRow[] {
  const selfScore = save.guildContribution ?? 0;
  const selfName = save.guildName ? `${save.guildName}·나` : "무소속·나";
  const npcs: GuildRankRow[] = [
    { name: "심연수호·갑", contribution: Math.max(80, selfScore + 40) },
    { name: "진문연맹·을", contribution: Math.max(55, selfScore + 10) },
    { name: "사석사냥·병", contribution: Math.max(35, Math.floor(selfScore * 0.7)) },
    { name: "화점길드·정", contribution: Math.max(20, Math.floor(selfScore * 0.4)) },
    { name: "안개원정·무", contribution: 12 },
  ];
  return [...npcs, { name: selfName, contribution: selfScore, self: true }].sort(
    (a, b) => b.contribution - a.contribution || (a.self ? -1 : 1),
  );
}

export const SEASON_REWARD_WINS = 3;
export const SEASON_REWARD_GLORY = 40;
export const SEASON_REWARD_CRYSTAL = 6;

/** Claim world-arena season reward every SEASON_REWARD_WINS wins. */
export function runClaimSeasonReward(save: PlayerSave): LoopStepResult {
  const wins = save.arenaSeasonWins ?? 0;
  const claimed = save.seasonRewardsClaimed ?? 0;
  const need = (claimed + 1) * SEASON_REWARD_WINS;
  if (wins < need) {
    return {
      save,
      message: `시즌 보상 잠김 — 월드아레나 승 ${wins}/${need}`,
    };
  }
  const island = {
    ...save.island,
    crystal: save.island.crystal + SEASON_REWARD_CRYSTAL,
  };
  return {
    save: {
      ...save,
      island,
      gloryPoints: (save.gloryPoints ?? 0) + SEASON_REWARD_GLORY,
      seasonRewardsClaimed: claimed + 1,
    },
    message: `시즌 보상 #${claimed + 1}: 영광 +${SEASON_REWARD_GLORY} · 크리스탈 +${SEASON_REWARD_CRYSTAL}`,
  };
}

export function listStages(): StageDef[] {
  return ALL_STAGES;
}

export function listScenarioStages(): StageDef[] {
  return ALL_STAGES.filter((s) => s.mode === "scenario");
}

export function listRoster(save: PlayerSave): string[] {
  return save.roster.map((m, i) => {
    const inParty = save.party.includes(m.uid) ? "★" : " ";
    const owned = {
      ...m,
      symbolSlots: m.symbolSlots ?? emptySymbolSlots(),
    };
    return `[${i}] ${inParty} ${describeOwned(owned)} (${m.uid})`;
  });
}

export function listGear(save: PlayerSave): string[] {
  const gear = getActiveGear(save);
  const leader = (gearLeaderAtkPct(gear) * 100).toFixed(1);
  const sets = summarizeGearSets(gear)
    .filter((s) => s.count > 0)
    .map(
      (s) =>
        `${s.nameKo} ${s.count}${s.active6 ? "(6)" : s.active4 ? "(4)" : s.active2 ? "(2)" : ""}`,
    )
    .join(" · ");
  const slotLine = (label: string, piece: typeof gear.weapon, extra: string) =>
    piece ? `${label} ${describeGear(piece)} · ${extra}` : `${label} (미장착)`;
  return [
    slotLine(
      "무기",
      gear.weapon,
      `스킬+${((gear.weapon?.skillPowerBonus ?? 0) * 100).toFixed(0)}%`,
    ),
    slotLine(
      "상의",
      gear.top,
      `HP+${gear.top?.summonerHpBonus ?? 0} DEF+${gear.top?.summonerDefBonus ?? 0}`,
    ),
    slotLine(
      "하의",
      gear.bottom,
      `HP+${gear.bottom?.summonerHpBonus ?? 0} 리더+${((gear.bottom?.leaderAtkBonus ?? 0) * 100).toFixed(1)}%`,
    ),
    slotLine(
      "신발",
      gear.shoes,
      `regen+${(gear.shoes?.manaRegenBonus ?? 0).toFixed(2)} max+${gear.shoes?.manaMaxBonus ?? 0}`,
    ),
    slotLine(
      "반지",
      gear.ring,
      `스킬+${((gear.ring?.skillPowerBonus ?? 0) * 100).toFixed(0)}% 리더+${((gear.ring?.leaderAtkBonus ?? 0) * 100).toFixed(1)}%`,
    ),
    slotLine(
      "목걸이",
      gear.necklace,
      `sense+${(gear.necklace?.boardSenseBonus ?? 0).toFixed(2)}`,
    ),
    `세트 ${sets || "없음"}`,
    `리더 합산 ATK +${leader}%`,
    `가방 ${(save.gearBag ?? []).length}/${gearBagCapacity(save)}`,
  ];
}

export function listGearBag(save: PlayerSave): string[] {
  const bag = save.gearBag ?? [];
  if (bag.length === 0) return ["(가방 비어 있음)"];
  return bag.map(
    (p, i) =>
      `[${i}] ${describeGear(p)} · 판매 +${gearSellMana(p)}${gearSellCrystal(p) > 0 ? `/+크${gearSellCrystal(p)}` : ""} · 슬롯 ${p.slot}`,
  );
}

export function listSymbols(save: PlayerSave): string[] {
  return save.symbols.map((s, i) => {
    const worn = save.roster.some((m) =>
      (m.symbolSlots ?? []).includes(s.id),
    );
    return `[${i}] ${worn ? "E" : " "} ${describeSymbol(s)}`;
  });
}

/** Set battle party from roster indices or uids (max 4). */
export function runSetParty(
  save: PlayerSave,
  refs: string[],
): LoopStepResult {
  if (refs.length === 0 || refs.length > 4) {
    return { save, message: "파티는 1~4명을 지정하세요" };
  }
  const uids: string[] = [];
  for (const ref of refs) {
    const owned = resolveOwned(save, ref);
    if (!owned) {
      return { save, message: `소환수 없음: ${ref}` };
    }
    if (uids.includes(owned.uid)) {
      return { save, message: "같은 소환수를 중복 편성할 수 없습니다" };
    }
    uids.push(owned.uid);
  }
  return {
    save: { ...save, party: uids },
    message: `파티 편성: ${uids
      .map((id) => {
        const m = save.roster.find((x) => x.uid === id)!;
        return describeOwned(m);
      })
      .join(" / ")}`,
  };
}

/**
 * Summon at 소환진 — spend 1 scroll, add random monster to roster.
 */
export function scrollCount(save: PlayerSave, kind: ScrollKind): number {
  if (kind === "premium") return Math.max(0, Math.floor(save.scrollsPremium ?? 0));
  if (kind === "mystic") return Math.max(0, Math.floor(save.scrollsMystic ?? 0));
  return Math.max(0, Math.floor(save.scrolls ?? 0));
}

export function totalScrollCount(save: PlayerSave): number {
  return (
    scrollCount(save, "normal") +
    scrollCount(save, "premium") +
    scrollCount(save, "mystic")
  );
}

export function withScrollDelta(
  save: PlayerSave,
  kind: ScrollKind,
  delta: number,
): PlayerSave {
  const next = Math.max(0, scrollCount(save, kind) + Math.floor(delta));
  if (kind === "premium") return { ...save, scrollsPremium: next };
  if (kind === "mystic") return { ...save, scrollsMystic: next };
  return { ...save, scrolls: next };
}

export function runSummon(
  save: PlayerSave,
  kind: ScrollKind = "normal",
  rng: () => number = Math.random,
  count = 1,
): LoopStepResult {
  const label = SCROLL_KIND_LABEL[kind];
  const pulls = Math.max(1, Math.min(50, Math.floor(count)));
  const cost = SUMMON_SCROLL_COST * pulls;
  const have = scrollCount(save, kind);
  if (have < cost) {
    return {
      save,
      message: `${label} 부족 (필요 ${cost}, 보유 ${have})`,
    };
  }

  const summoned: OwnedMonster[] = [];
  for (let i = 0; i < pulls; i++) {
    const def = pickSummonMonster(rng, kind);
    summoned.push({
      uid: nextUid("sum"),
      monsterId: def.id,
      level: 1,
      exp: 0,
      symbolSlots: emptySymbolSlots(),
      evolve: 0,
      awaken: 0,
      skillLevels: defaultSkillLevels(),
    });
  }

  const roster = [...save.roster, ...summoned];
  let party = [...save.party];
  for (const owned of summoned) {
    if (party.length >= 4) break;
    party.push(owned.uid);
  }
  const nextSave = withScrollDelta(save, kind, -cost);
  const left = scrollCount(nextSave, kind);
  const message =
    pulls === 1
      ? `소환 성공: ${describeOwned(summoned[0]!)} (${label} ${left})`
      : `${pulls}연 소환 성공 (${label} −${cost} · 잔여 ${left})`;

  return {
    save: bumpDailyActivity(
      {
        ...nextSave,
        roster,
        party,
      },
      "summon",
      pulls,
    ),
    message,
  };
}

/**
 * Enhance on the monster screen — spend mana, +1 level (up to the current grade cap).
 * Like Summoners War power-up: also randomly levels one non-max skill.
 */
export function runEnhance(
  save: PlayerSave,
  uidOrIndex: string,
): LoopStepResult {
  const owned = resolveOwned(save, uidOrIndex);
  if (!owned) {
    return { save, message: `소환수를 찾을 수 없음: ${uidOrIndex}` };
  }
  const maxLevel = monsterMaxLevel(owned);
  if (owned.level >= maxLevel) {
    return {
      save,
      message: `${describeOwned(owned)} 이미 최대 레벨(${maxLevel})`,
    };
  }

  const cost = enhanceManaCost(owned.level);
  if (save.island.mana < cost) {
    return {
      save,
      message: `골드 부족 (필요 ${cost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }

  const nextLevel = owned.level + 1;
  const levels = normalizeSkillLevels(owned.skillLevels);
  const skillIdx = pickRandomSkillUpIndex(levels);
  let nextLevels: [number, number, number] = levels;
  let skillNote = "";
  if (skillIdx != null) {
    nextLevels = [levels[0]!, levels[1]!, levels[2]!];
    nextLevels[skillIdx] = (levels[skillIdx] ?? 1) + 1;
    const def = getMonster(owned.monsterId);
    const skillName = def?.skills[skillIdx]?.nameKo ?? `S${skillIdx + 1}`;
    skillNote = ` · ${skillName} Lv.${nextLevels[skillIdx]}`;
  }

  const roster = save.roster.map((m) =>
    m.uid === owned.uid
      ? { ...m, level: nextLevel, skillLevels: nextLevels }
      : m,
  );
  const island = { ...save.island, mana: save.island.mana - cost };

  return {
    save: bumpDailyActivity({ ...save, island, roster }, "enhanceMon"),
    message: `강화: ${describeOwned({ ...owned, level: nextLevel, skillLevels: nextLevels })}${skillNote} (−골드 ${cost})`,
  };
}

/** EXP a monster contributes when consumed as power-up material. */
export function monsterPowerUpExp(fodder: OwnedMonster): number {
  const stars = Math.max(1, getMonster(fodder.monsterId)?.naturalStars ?? 1);
  return stars * 35 + fodder.level * 12 + (fodder.evolve ?? 0) * 25;
}

/** Mana cost for a material-based monster power-up. */
export function monsterPowerUpManaCost(fodders: readonly OwnedMonster[]): number {
  const exp = fodders.reduce((total, fodder) => total + monsterPowerUpExp(fodder), 0);
  return Math.max(100, Math.ceil(exp * 0.5));
}

/**
 * Consume owned monsters to grant EXP to a target.
 * Matching monster IDs additionally raise one non-max target skill at random.
 */
export function runPowerUpMonster(
  save: PlayerSave,
  targetUidOrIndex: string,
  fodderUidOrIndices: readonly string[],
  rng: () => number = Math.random,
): LoopStepResult {
  const target = resolveOwned(save, targetUidOrIndex);
  if (!target) {
    return { save, message: `소환수를 찾을 수 없음: ${targetUidOrIndex}` };
  }
  const maxLevel = monsterMaxLevel(target);
  if (target.level >= maxLevel) {
    return {
      save,
      message: `${describeOwned(target)} 이미 최대 레벨(${maxLevel})`,
    };
  }

  const uniqueIds = [...new Set(fodderUidOrIndices)];
  if (uniqueIds.length === 0) {
    return { save, message: "강화 재료 소환수를 선택하세요" };
  }
  if (uniqueIds.includes(target.uid)) {
    return { save, message: "대상 소환수는 재료로 사용할 수 없습니다" };
  }
  const partyBlocked = uniqueIds.find((id) => save.party.includes(id));
  if (partyBlocked) {
    const blocked = resolveOwned(save, partyBlocked);
    return {
      save,
      message: blocked
        ? `${describeOwned(blocked)}는 파티 소환수라 재료로 사용할 수 없습니다`
        : "파티 소환수는 재료로 사용할 수 없습니다",
    };
  }
  const fodders = uniqueIds.map((id) => resolveOwned(save, id));
  if (fodders.some((fodder) => !fodder)) {
    return { save, message: "강화 재료 소환수를 찾을 수 없습니다" };
  }
  const materials = fodders as OwnedMonster[];
  const cost = monsterPowerUpManaCost(materials);
  if (save.island.mana < cost) {
    return {
      save,
      message: `골드 부족 (필요 ${cost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }

  const expGain = materials.reduce(
    (total, fodder) => total + monsterPowerUpExp(fodder),
    0,
  );
  const powered = addOwnedMonsterExp(target, expGain).monster;
  const nextLevels = normalizeSkillLevels(target.skillLevels);
  let skillUps = 0;
  for (const fodder of materials) {
    if (fodder.monsterId !== target.monsterId) continue;
    const skillIdx = pickRandomSkillUpIndex(nextLevels, rng);
    if (skillIdx == null) continue;
    nextLevels[skillIdx] = (nextLevels[skillIdx] ?? 1) + 1;
    skillUps += 1;
  }
  const updated: OwnedMonster = {
    ...powered,
    skillLevels: nextLevels,
  };
  const consumed = new Set(uniqueIds);
  const roster = save.roster
    .filter((monster) => !consumed.has(monster.uid))
    .map((monster) => (monster.uid === target.uid ? updated : monster));
  const party = save.party.filter((uid) => !consumed.has(uid));
  const skillNote = skillUps > 0 ? ` · 동일 소환수 스킬 +${skillUps}` : "";

  return {
    save: bumpDailyActivity(
      {
        ...save,
        island: { ...save.island, mana: save.island.mana - cost },
        roster,
        party,
      },
      "enhanceMon",
    ),
    message: `강화: ${describeOwned(updated)} · EXP +${expGain}${skillNote} (재료 ${materials.length} · −골드 ${cost})`,
  };
}

/**
 * Feed a same-species duplicate into target (Summoners War-style).
 * Consumes fodder and randomly levels one non-max skill on the target.
 */
export function runFeedSameMonster(
  save: PlayerSave,
  targetUidOrIndex: string,
  fodderUidOrIndex: string,
): LoopStepResult {
  const target = resolveOwned(save, targetUidOrIndex);
  const fodder = resolveOwned(save, fodderUidOrIndex);
  if (!target) {
    return { save, message: `소환수를 찾을 수 없음: ${targetUidOrIndex}` };
  }
  if (!fodder) {
    return { save, message: `재료 소환수를 찾을 수 없음: ${fodderUidOrIndex}` };
  }
  if (target.uid === fodder.uid) {
    return { save, message: "같은 소환수는 재료로 쓸 수 없습니다" };
  }
  if (save.party.includes(fodder.uid)) {
    return {
      save,
      message: `${describeOwned(fodder)}는 파티 소환수라 재료로 사용할 수 없습니다`,
    };
  }
  if (target.monsterId !== fodder.monsterId) {
    return { save, message: "동일 소환수만 스킬 강화 재료로 사용할 수 있습니다" };
  }

  const levels = normalizeSkillLevels(target.skillLevels);
  const skillIdx = pickRandomSkillUpIndex(levels);
  if (skillIdx == null) {
    return {
      save,
      message: `${describeOwned(target)} 스킬이 모두 최대입니다`,
    };
  }

  const cost = enhanceManaCost(target.level);
  if (save.island.mana < cost) {
    return {
      save,
      message: `골드 부족 (필요 ${cost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  const haveMats = save.skillMats ?? 0;
  if (haveMats < SKILL_UP_MAT_COST) {
    return {
      save,
      message: `스킬재료 부족 (필요 ${SKILL_UP_MAT_COST}, 보유 ${haveMats})`,
    };
  }

  const nextLevels: [number, number, number] = [
    levels[0]!,
    levels[1]!,
    levels[2]!,
  ];
  nextLevels[skillIdx] = (levels[skillIdx] ?? 1) + 1;
  const def = getMonster(target.monsterId);
  const skillName = def?.skills[skillIdx]?.nameKo ?? `S${skillIdx + 1}`;

  const roster = save.roster
    .filter((m) => m.uid !== fodder.uid)
    .map((m) =>
      m.uid === target.uid ? { ...m, skillLevels: nextLevels } : m,
    );
  const party = save.party.filter((uid) => uid !== fodder.uid);
  const updated = { ...target, skillLevels: nextLevels };
  const island = { ...save.island, mana: save.island.mana - cost };

  return {
    save: bumpDailyActivity(
      {
        ...save,
        island,
        roster,
        party,
        skillMats: haveMats - SKILL_UP_MAT_COST,
      },
      "skillUp",
    ),
    message: `스킬업: ${describeOwned(updated)} · ${skillName} → Lv.${nextLevels[skillIdx]} (−${describeOwned(fodder)}, −골드 ${cost} · −스킬재료 ${SKILL_UP_MAT_COST})`,
  };
}

/**
 * Evolve on the monster screen — raise evolve stage (cap MAX_EVOLVE).
 * Requires level gate + mana (+ crystal from 2nd evolve).
 */
export function runEvolve(
  save: PlayerSave,
  uidOrIndex: string,
): LoopStepResult {
  const owned = resolveOwned(save, uidOrIndex);
  if (!owned) {
    return { save, message: `소환수를 찾을 수 없음: ${uidOrIndex}` };
  }
  const evo = owned.evolve ?? 0;
  if (evo >= MAX_EVOLVE) {
    return {
      save,
      message: `${describeOwned(owned)} 이미 최대 진화(E${MAX_EVOLVE})`,
    };
  }
  const needLv = evolveMinLevel(evo);
  if (owned.level < needLv) {
    return {
      save,
      message: `진화 조건 미달 — Lv.${needLv} 필요 (현재 ${owned.level})`,
    };
  }
  const manaCost = evolveManaCost(evo);
  const crystalCost = evolveCrystalCost(evo);
  if (save.island.mana < manaCost) {
    return {
      save,
      message: `골드 부족 (필요 ${manaCost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  if (save.island.crystal < crystalCost) {
    return {
      save,
      message: `크리스탈 부족 (필요 ${crystalCost}, 보유 ${save.island.crystal})`,
    };
  }

  const nextEvo = evo + 1;
  const roster = save.roster.map((m) =>
    m.uid === owned.uid ? { ...m, evolve: nextEvo } : m,
  );
  const island = {
    ...save.island,
    mana: save.island.mana - manaCost,
    crystal: save.island.crystal - crystalCost,
  };
  const costNote =
    crystalCost > 0
      ? `−골드 ${manaCost} · −크리스탈 ${crystalCost}`
      : `−골드 ${manaCost}`;

  return {
    save: { ...save, island, roster },
    message: `진화: ${describeOwned({ ...owned, evolve: nextEvo })} (${costNote})`,
  };
}

/**
 * Monster awaken (각성) — one-shot 0→1. Costs gold + crystal + element awaken mats.
 * Separate from evolve (0–2).
 */
export function runAwakenMonster(
  save: PlayerSave,
  uidOrIndex: string,
): LoopStepResult {
  const owned = resolveOwned(save, uidOrIndex);
  if (!owned) {
    return { save, message: `소환수를 찾을 수 없음: ${uidOrIndex}` };
  }
  const def = getMonster(owned.monsterId);
  if (!def) {
    return { save, message: `몬스터 데이터 없음: ${owned.monsterId}` };
  }
  const cur = owned.awaken ?? 0;
  if (cur >= MAX_MONSTER_AWAKEN) {
    return {
      save,
      message: `${describeOwned(owned)} 이미 각성 완료`,
    };
  }
  const needLv = monsterAwakenMinLevel(def.naturalStars);
  if (owned.level < needLv) {
    return {
      save,
      message: `각성 조건 미달 — Lv.${needLv} 필요 (현재 ${owned.level})`,
    };
  }
  const manaCost = monsterAwakenManaCost(cur);
  const crystalCost = monsterAwakenCrystalCost(cur);
  const matCost = monsterAwakenMatCost(cur);
  const mats = save.awakenMats ?? {};
  const haveMat = mats[def.element] ?? 0;
  if (save.island.mana < manaCost) {
    return {
      save,
      message: `골드 부족 (필요 ${manaCost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  if (save.island.crystal < crystalCost) {
    return {
      save,
      message: `크리스탈 부족 (필요 ${crystalCost}, 보유 ${save.island.crystal})`,
    };
  }
  if (haveMat < matCost) {
    return {
      save,
      message: `진화재료(${def.element}) 부족 (필요 ${matCost}, 보유 ${haveMat})`,
    };
  }
  const nextAwaken = cur + 1;
  const roster = save.roster.map((m) =>
    m.uid === owned.uid ? { ...m, awaken: nextAwaken } : m,
  );
  const island = {
    ...save.island,
    mana: save.island.mana - manaCost,
    crystal: save.island.crystal - crystalCost,
  };
  const awakenMats = {
    ...mats,
    [def.element]: haveMat - matCost,
  };
  return {
    save: { ...save, island, roster, awakenMats },
    message: `각성: ${describeOwned({ ...owned, awaken: nextAwaken })} (−골드 ${manaCost} · −크리스탈 ${crystalCost} · −재료 ${matCost})`,
  };
}

/**
 * Skill-up on the monster screen — raise one of S1/S2/S3 (cap MAX_SKILL_LEVEL).
 */
export function runSkillUp(
  save: PlayerSave,
  uidOrIndex: string,
  skillIndex: number,
): LoopStepResult {
  const owned = resolveOwned(save, uidOrIndex);
  if (!owned) {
    return { save, message: `소환수를 찾을 수 없음: ${uidOrIndex}` };
  }
  const idx = Math.floor(skillIndex);
  if (idx < 0 || idx > 2) {
    return { save, message: "스킬 슬롯은 0~2 (S1~S3)만 가능" };
  }
  const levels = normalizeSkillLevels(owned.skillLevels);
  const cur = levels[idx]!;
  if (cur >= MAX_SKILL_LEVEL) {
    return {
      save,
      message: `${describeOwned(owned)} S${idx + 1} 이미 최대(+${MAX_SKILL_LEVEL})`,
    };
  }
  const needLv = skillUpMinMonsterLevel(cur);
  if (owned.level < needLv) {
    return {
      save,
      message: `스킬업 조건 미달 — Lv.${needLv} 필요 (현재 ${owned.level})`,
    };
  }
  const cost = skillUpManaCost(idx, cur);
  if (save.island.mana < cost) {
    return {
      save,
      message: `골드 부족 (필요 ${cost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  const haveMats = save.skillMats ?? 0;
  if (haveMats < SKILL_UP_MAT_COST) {
    return {
      save,
      message: `스킬재료 부족 (필요 ${SKILL_UP_MAT_COST}, 보유 ${haveMats})`,
    };
  }

  const nextLevels: [number, number, number] = [...levels];
  nextLevels[idx] = cur + 1;
  const def = getMonster(owned.monsterId);
  const skillName = def?.skills[idx]?.nameKo ?? `S${idx + 1}`;
  const roster = save.roster.map((m) =>
    m.uid === owned.uid
      ? { ...m, skillLevels: nextLevels }
      : m,
  );
  const island = { ...save.island, mana: save.island.mana - cost };
  const updated = { ...owned, skillLevels: nextLevels };

  return {
    save: bumpDailyActivity(
      {
        ...save,
        island,
        roster,
        skillMats: haveMats - SKILL_UP_MAT_COST,
      },
      "skillUp",
    ),
    message: `스킬업: ${describeOwned(updated)} · ${skillName} → Lv.${nextLevels[idx]} (−골드 ${cost} · −스킬재료 ${SKILL_UP_MAT_COST})`,
  };
}

export function runEnhanceGear(
  save: PlayerSave,
  slot: GearSlot,
): LoopStepResult {
  const synced = syncSummonerMirrors(save);
  const gearNorm = getActiveGear(synced);
  const piece = gearNorm[slot];
  if (!piece) {
    return { save: withActiveGear(synced, gearNorm), message: "장착된 장비 없음" };
  }
  if (piece.enhance >= MAX_GEAR_ENHANCE) {
    return {
      save: withActiveGear(synced, gearNorm),
      message: `${describeGear(piece)} 이미 최대(+${MAX_GEAR_ENHANCE})`,
    };
  }
  const cost = gearEnhanceManaCost(piece.enhance);
  const crystalCost = gearEnhanceCrystalCost(piece.enhance);
  if (synced.island.mana < cost) {
    return {
      save: withActiveGear(synced, gearNorm),
      message: `골드 부족 (필요 ${cost}, 보유 ${Math.floor(synced.island.mana)})`,
    };
  }
  if ((synced.island.crystal ?? 0) < crystalCost) {
    return {
      save: withActiveGear(synced, gearNorm),
      message: `크리스탈 부족 (필요 ${crystalCost}, 보유 ${synced.island.crystal ?? 0})`,
    };
  }
  const next = bumpGearEnhance(piece);
  const gear = { ...gearNorm, [slot]: next };
  const island = {
    ...synced.island,
    mana: synced.island.mana - cost,
    crystal: (synced.island.crystal ?? 0) - crystalCost,
  };
  const costNote =
    crystalCost > 0
      ? `−골드 ${cost} · −크리스탈 ${crystalCost}`
      : `−골드 ${cost}`;
  return {
    save: bumpDailyActivity(withActiveGear({ ...synced, island }, gear), "enhanceGear"),
    message: `장비 강화: ${describeGear(next)} (${costNote})`,
  };
}

/** Re-affix a gear piece to another shallow set. */
export function runAffixGearSet(
  save: PlayerSave,
  slot: GearSlot,
  setId: GearSetId,
): LoopStepResult {
  const synced = syncSummonerMirrors(save);
  const gearNorm = getActiveGear(synced);
  const piece = gearNorm[slot];
  if (!piece) {
    return { save: withActiveGear(synced, gearNorm), message: "장착된 장비 없음" };
  }
  if (piece.setId === setId) {
    return {
      save: withActiveGear(synced, gearNorm),
      message: `${describeGear(piece)} 이미 ${getGearSet(setId)?.nameKo ?? setId} 세트`,
    };
  }
  if (synced.island.mana < GEAR_SET_AFFIX_MANA) {
    return {
      save: withActiveGear(synced, gearNorm),
      message: `골드 부족 (필요 ${GEAR_SET_AFFIX_MANA}, 보유 ${Math.floor(synced.island.mana)})`,
    };
  }
  const next = { ...piece, setId };
  const gear = { ...gearNorm, [slot]: next };
  const island = {
    ...synced.island,
    mana: synced.island.mana - GEAR_SET_AFFIX_MANA,
  };
  const active = summarizeGearSets(gear)
    .filter((s) => s.active2)
    .map(
      (s) =>
        `${s.nameKo}${s.active6 ? "6" : s.active4 ? "4" : "2"}`,
    )
    .join("·");
  return {
    save: withActiveGear({ ...synced, island }, gear),
    message: `세트 부여: ${describeGear(next)} (−골드 ${GEAR_SET_AFFIX_MANA})${active ? ` · 활성 ${active}` : ""}`,
  };
}

/** Equip a bag piece onto its slot; displaced piece returns to the bag. */
export function runEquipGearBag(
  save: PlayerSave,
  bagIndex: number,
): LoopStepResult {
  const synced = syncSummonerMirrors(save);
  const bag = [...(synced.gearBag ?? [])];
  const piece = bag[bagIndex];
  if (!piece) {
    return { save: synced, message: `가방 인덱스 없음: ${bagIndex}` };
  }
  const el = synced.activeSummoner ?? "light";
  const normPiece = normalizeGearPiece(piece, piece.slot);
  if (!canEquipGearOnElement(normPiece, el)) {
    return {
      save: synced,
      message: `${describeGear(normPiece)}는 ${SUMMONER_ELEMENT_LABEL[normPiece.element ?? "light"]} 소환사 전용 무기입니다`,
    };
  }
  const gearNorm = getActiveGear(synced);
  const displaced = gearNorm[normPiece.slot];
  bag.splice(bagIndex, 1);
  if (displaced) bag.push(displaced);
  const gear = { ...gearNorm, [normPiece.slot]: normPiece };
  return {
    save: withActiveGear({ ...synced, gearBag: bag }, gear),
    message: displaced
      ? `장비 장착: ${describeGear(normPiece)} · 해제 ${describeGear(displaced)} → 가방`
      : `장비 장착: ${describeGear(normPiece)}`,
  };
}

/** Sell a bag piece for mana (+ partial crystal if high enhance). */
export function runSellGearBag(
  save: PlayerSave,
  bagIndex: number,
): LoopStepResult {
  const bag = [...(save.gearBag ?? [])];
  const piece = bag[bagIndex];
  if (!piece) {
    return { save, message: `가방 인덱스 없음: ${bagIndex}` };
  }
  const gain = gearSellMana(piece);
  const crystalGain = gearSellCrystal(piece);
  bag.splice(bagIndex, 1);
  const island = {
    ...save.island,
    mana: save.island.mana + gain,
    crystal: (save.island.crystal ?? 0) + crystalGain,
  };
  const note =
    crystalGain > 0
      ? `+골드 ${gain} · +크리스탈 ${crystalGain}`
      : `+골드 ${gain}`;
  return {
    save: { ...save, island, gearBag: bag },
    message: `장비 판매: ${describeGear(piece)} (${note})`,
  };
}

/** Summoner awaken/transcend stub: permanent mana/skill/leader bonuses. */
export function runAwakenSummoner(save: PlayerSave): LoopStepResult {
  const synced = syncSummonerMirrors(save);
  const el = synced.activeSummoner;
  const active = synced.summoners[el];
  const cur = active.awaken;
  if (cur >= MAX_SUMMONER_AWAKEN) {
    return {
      save: synced,
      message: `${SUMMONER_ELEMENT_LABEL[el]} 소환사 각성 이미 최대(+${MAX_SUMMONER_AWAKEN})`,
    };
  }
  const needLv = awakenMinLevel(cur);
  if (active.level < needLv) {
    return {
      save: synced,
      message: `각성 해금: 소환사 Lv.${needLv}+ 필요 (현재 ${active.level})`,
    };
  }
  const manaCost = awakenManaCost(cur);
  const crystalCost = awakenCrystalCost(cur);
  const matCost = summonerAwakenMatCost(cur);
  const mats = synced.awakenMats ?? {};
  const haveMat = mats[el] ?? 0;
  if (synced.island.mana < manaCost) {
    return {
      save: synced,
      message: `골드 부족 (필요 ${manaCost}, 보유 ${Math.floor(synced.island.mana)})`,
    };
  }
  if (synced.island.crystal < crystalCost) {
    return {
      save: synced,
      message: `크리스탈 부족 (필요 ${crystalCost}, 보유 ${synced.island.crystal})`,
    };
  }
  if (haveMat < matCost) {
    return {
      save: synced,
      message: `${SUMMONER_ELEMENT_LABEL[el]} 정수 부족 (필요 ${matCost}, 보유 ${haveMat})`,
    };
  }
  const next = cur + 1;
  const summoners = {
    ...synced.summoners,
    [el]: { ...active, awaken: next },
  };
  const awakenMats = {
    ...mats,
    [el]: haveMat - matCost,
  };
  return {
    save: syncSummonerMirrors({
      ...synced,
      summoners,
      awakenMats,
      island: {
        ...synced.island,
        mana: synced.island.mana - manaCost,
        crystal: synced.island.crystal - crystalCost,
      },
    }),
    message: `${SUMMONER_ELEMENT_LABEL[el]} 소환사 각성 +${next} (−골드 ${manaCost} · −크리스탈 ${crystalCost} · −정수 ${matCost}) · 리더 공+${(awakenLeaderAtkPct(next) * 100).toFixed(1)}%`,
  };
}

/** Unlock one summoner skill-tree node. */
export function runUnlockSkillNode(
  save: PlayerSave,
  nodeId: string,
): LoopStepResult {
  if (!isSkillTreeNodeId(nodeId)) {
    return { save, message: `알 수 없는 스킬 노드: ${nodeId}` };
  }
  const unlocked = [...(save.skillTree ?? [])];
  const node = getSkillTreeNode(nodeId)!;
  const gate = canUnlockSkillNode(
    unlocked,
    nodeId as SkillTreeNodeId,
    save.island.summonerLevel,
  );
  if (!gate.ok) {
    return { save, message: gate.reason };
  }
  if (save.island.mana < node.manaCost) {
    return {
      save,
      message: `골드 부족 (필요 ${node.manaCost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  if (save.island.crystal < node.crystalCost) {
    return {
      save,
      message: `크리스탈 부족 (필요 ${node.crystalCost}, 보유 ${save.island.crystal})`,
    };
  }
  unlocked.push(nodeId);
  return {
    save: {
      ...save,
      skillTree: unlocked,
      island: {
        ...save.island,
        mana: save.island.mana - node.manaCost,
        crystal: save.island.crystal - node.crystalCost,
      },
    },
    message: `스킬 트리: ${node.nameKo} 해금 (−골드 ${node.manaCost}${node.crystalCost > 0 ? ` · −크리스탈 ${node.crystalCost}` : ""})`,
  };
}

/** Enhance a Phase 2 summoner magic skill (+0→+5). First +5 unlocks that branch. */
export function runEnhanceMagicSkill(
  save: PlayerSave,
  skillId: string,
  element?: SummonerElement,
): LoopStepResult {
  const synced = syncSummonerMirrors(save);
  const el = element ?? synced.activeSummoner;
  const kit = getSummonerKit(el);
  const allSkills = Object.values(kit.skills);
  const def = allSkills.find((s) => s.id === skillId);
  if (!def) {
    return { save: synced, message: `알 수 없는 마법 스킬: ${skillId}` };
  }
  const prog = { ...(synced.summonerMagic[el] ?? emptyMagicProgress()) };
  prog.ranks = { ...prog.ranks };
  // Upper skills locked until branch matches
  if (
    (def.slot === "A1" || def.slot === "A2") &&
    prog.branch !== "A"
  ) {
    return {
      save: synced,
      message: `${def.nameKo} — A 기초를 +${MAX_MAGIC_RANK}까지 강화해 해금`,
    };
  }
  if (
    (def.slot === "B1" || def.slot === "B2") &&
    prog.branch !== "B"
  ) {
    return {
      save: synced,
      message: `${def.nameKo} — B 기초를 +${MAX_MAGIC_RANK}까지 강화해 해금`,
    };
  }
  if (
    (def.slot === "A3" || def.slot === "A4") &&
    (prog.branch !== "A" || !magicTier2Unlocked(el, prog))
  ) {
    return {
      save: synced,
      message: `${def.nameKo} — A1·A2를 +${MAX_MAGIC_RANK}까지 강화해 해금`,
    };
  }
  if (
    (def.slot === "B3" || def.slot === "B4") &&
    (prog.branch !== "B" || !magicTier2Unlocked(el, prog))
  ) {
    return {
      save: synced,
      message: `${def.nameKo} — B1·B2를 +${MAX_MAGIC_RANK}까지 강화해 해금`,
    };
  }
  const cur = magicRank(prog, skillId);
  if (cur >= MAX_MAGIC_RANK) {
    return {
      save: synced,
      message: `${def.nameKo} 이미 최대(+${MAX_MAGIC_RANK})`,
    };
  }
  const needLv = magicEnhanceRequiredLevel(cur);
  const sumLv = synced.summoners[el]?.level ?? 1;
  if (sumLv < needLv) {
    return {
      save: synced,
      message: `${def.nameKo} — Lv.${needLv}`,
    };
  }
  const manaCost = magicEnhanceManaCost(cur);
  const crystalCost = magicEnhanceCrystalCost(cur);
  if (synced.island.mana < manaCost) {
    return {
      save: synced,
      message: `골드 부족 (필요 ${manaCost}, 보유 ${Math.floor(synced.island.mana)})`,
    };
  }
  if (synced.island.crystal < crystalCost) {
    return {
      save: synced,
      message: `크리스탈 부족 (필요 ${crystalCost}, 보유 ${synced.island.crystal})`,
    };
  }
  const beforeTier2 = magicTier2Unlocked(el, prog);
  prog.ranks[skillId] = cur + 1;
  const nextProg = tryUnlockMagicBranch(el, prog);
  const afterTier2 = magicTier2Unlocked(el, nextProg);
  const unlockedNote =
    !prog.branch && nextProg.branch
      ? ` · ${nextProg.branch} 상위 스킬 해금`
      : !beforeTier2 && afterTier2
        ? ` · ${nextProg.branch ?? ""} 심화 스킬 해금`
        : "";
  return {
    save: syncSummonerMirrors({
      ...synced,
      summonerMagic: { ...synced.summonerMagic, [el]: nextProg },
      island: {
        ...synced.island,
        mana: synced.island.mana - manaCost,
        crystal: synced.island.crystal - crystalCost,
      },
    }),
    message: `${SUMMONER_ELEMENT_LABEL[el]} ${def.nameKo} +${cur + 1}${unlockedNote} (−골드 ${manaCost}${crystalCost > 0 ? ` · −크리스탈 ${crystalCost}` : ""})`,
  };
}

export function runEnhanceSymbol(
  save: PlayerSave,
  idOrIndex: string,
): LoopStepResult {
  const sym = resolveSymbol(save, idOrIndex);
  if (!sym) {
    return { save, message: `상징을 찾을 수 없음: ${idOrIndex}` };
  }
  if (sym.enhance >= MAX_SYMBOL_ENHANCE) {
    return {
      save,
      message: `${describeSymbol(sym)} 이미 최대(+${MAX_SYMBOL_ENHANCE})`,
    };
  }
  const cost = symbolEnhanceManaCost(sym.enhance);
  if (save.island.mana < cost) {
    return {
      save,
      message: `골드 부족 (필요 ${cost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  const next = bumpSymbolEnhance(sym);
  const symbols = save.symbols.map((s) => (s.id === sym.id ? next : s));
  const island = { ...save.island, mana: save.island.mana - cost };
  return {
    save: bumpDailyActivity({ ...save, island, symbols }, "enhanceSymbol"),
    message: `상징 강화: ${describeSymbol(next)} (−골드 ${cost})`,
  };
}

/** Buy summon scrolls at magic shop stub. */
export function runBuyScroll(
  save: PlayerSave,
  count = 1,
  kind: ScrollKind = "normal",
  now = Date.now(),
): LoopStepResult {
  const n = Math.max(1, Math.min(20, Math.floor(count)));
  const label = SCROLL_KIND_LABEL[kind];
  const { sku, purchases } = catalogSkuForScrollBuy(kind, n);
  let working = syncShopDay(save, now);

  if (kind === "mystic" || kind === "premium") {
    const unit =
      kind === "mystic"
        ? SCROLL_MYSTIC_BUY_CRYSTAL_COST
        : SCROLL_PREMIUM_BUY_CRYSTAL_COST;
    const cost = unit * n;
    if (working.island.crystal < cost) {
      return {
        save: working,
        message: `크리스탈 부족 (필요 ${cost}, 보유 ${Math.floor(working.island.crystal)})`,
      };
    }
    const quota = tryConsumeCatalogQuota(working, sku, purchases, now);
    if (!quota.ok) return { save: quota.save, message: quota.message };
    working = quota.save;
    const island = { ...working.island, crystal: working.island.crystal - cost };
    const next = withScrollDelta({ ...working, island }, kind, n);
    return {
      save: bumpDailyActivity(next, "shop", 1, now),
      message: `상점: ${label} ${n}장 구매 (−크리스탈 ${cost}) · 보유 ${scrollCount(next, kind)}`,
    };
  }

  const cost = SCROLL_BUY_MANA_COST * n;
  if (working.island.mana < cost) {
    return {
      save: working,
      message: `골드 부족 (필요 ${cost}, 보유 ${Math.floor(working.island.mana)})`,
    };
  }
  const quota = tryConsumeCatalogQuota(working, sku, purchases, now);
  if (!quota.ok) return { save: quota.save, message: quota.message };
  working = quota.save;
  const island = { ...working.island, mana: working.island.mana - cost };
  const next = withScrollDelta({ ...working, island }, kind, n);
  return {
    save: bumpDailyActivity(next, "shop", 1, now),
    message: `상점: ${label} ${n}장 구매 (−골드 ${cost}) · 보유 ${scrollCount(next, kind)}`,
  };
}

/**
 * Imprint (각인): re-roll main option on slots 2/4/6 for 1 imprint stone.
 */
export function runImprintSymbol(
  save: PlayerSave,
  idOrIndex: string,
  rng: () => number = Math.random,
): LoopStepResult {
  const sym = resolveSymbol(save, idOrIndex);
  if (!sym) {
    return { save, message: `상징을 찾을 수 없음: ${idOrIndex}` };
  }
  if (!canImprintSymbol(sym)) {
    return {
      save,
      message: `${describeSymbol(sym)} 슬롯${sym.slot}은 각인 불가 (2/4/6만)`,
    };
  }
  const stones = save.imprintStones ?? 0;
  if (stones < SYMBOL_IMPRINT_STONE_COST) {
    return {
      save,
      message: `각인석 부족 (필요 ${SYMBOL_IMPRINT_STONE_COST}, 보유 ${stones})`,
    };
  }
  const next = imprintSymbolMain(sym, rng);
  if (!next) {
    return { save, message: "각인 실패" };
  }
  const symbols = save.symbols.map((s) => (s.id === sym.id ? next : s));
  return {
    save: bumpDailyActivity(
      {
        ...save,
        symbols,
        imprintStones: stones - SYMBOL_IMPRINT_STONE_COST,
      },
      "enhanceSymbol",
    ),
    message: `각인: ${describeSymbol(sym)} → ${describeSymbol(next)} (−각인석 ${SYMBOL_IMPRINT_STONE_COST})`,
  };
}

/**
 * Grind (연마): consume 1 grindstone + mana.
 * Prefers substat enhance when substats exist; otherwise rolls flat prefix.
 */
export function runGrindSymbol(
  save: PlayerSave,
  idOrIndex: string,
  rng: () => number = Math.random,
): LoopStepResult {
  const sym = resolveSymbol(save, idOrIndex);
  if (!sym) {
    return { save, message: `상징을 찾을 수 없음: ${idOrIndex}` };
  }
  if (!canGrindSymbol(sym)) {
    return { save, message: `${describeSymbol(sym)} 연마 불가` };
  }
  const stones = save.grindstones ?? 0;
  if (stones < SYMBOL_GRIND_STONE_COST) {
    return {
      save,
      message: `연마석 부족 (필요 ${SYMBOL_GRIND_STONE_COST}, 보유 ${stones})`,
    };
  }
  if (save.island.mana < SYMBOL_GRIND_MANA_COST) {
    return {
      save,
      message: `골드 부족 (필요 ${SYMBOL_GRIND_MANA_COST}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  const hasSubs = (sym.substats ?? []).length > 0;
  const next = hasSubs
    ? grindEnhanceSubstat(sym, rng)
    : grindSymbolPrefix(sym, rng);
  if (!next) {
    return { save, message: "연마 실패" };
  }
  const symbols = save.symbols.map((s) => (s.id === sym.id ? next : s));
  const island = {
    ...save.island,
    mana: save.island.mana - SYMBOL_GRIND_MANA_COST,
  };
  const mode = hasSubs ? "부옵션" : "접두어";
  return {
    save: bumpDailyActivity(
      {
        ...save,
        island,
        symbols,
        grindstones: stones - SYMBOL_GRIND_STONE_COST,
      },
      "grindSymbol",
    ),
    message: `연마(${mode}): ${describeSymbol(sym)} → ${describeSymbol(next)} (−연마석 ${SYMBOL_GRIND_STONE_COST} · −골드 ${SYMBOL_GRIND_MANA_COST})`,
  };
}

export function grindstoneCount(save: PlayerSave): number {
  return Math.max(0, Math.floor(save.grindstones ?? 0));
}

export function imprintStoneCount(save: PlayerSave): number {
  return Math.max(0, Math.floor(save.imprintStones ?? 0));
}

/** Starter mailbox catalog (claim once). */
export const MAIL_DEFS = [
  { id: "welcome_gift", mana: 500, energy: 0 },
  { id: "login_gift", mana: 0, energy: 20 },
] as const;

export type MailDefId = (typeof MAIL_DEFS)[number]["id"];

export function unclaimedMailIds(save: PlayerSave): string[] {
  const claimed = new Set(save.claimedMailIds ?? []);
  return MAIL_DEFS.filter((m) => !claimed.has(m.id)).map((m) => m.id);
}

export function unclaimedMailCount(save: PlayerSave): number {
  return unclaimedMailIds(save).length;
}

export function runClaimMail(
  save: PlayerSave,
  mailId: string,
): LoopStepResult {
  const def = MAIL_DEFS.find((m) => m.id === mailId);
  if (!def) {
    return { save, message: `알 수 없는 우편: ${mailId}` };
  }
  const claimed = save.claimedMailIds ?? [];
  if (claimed.includes(mailId)) {
    return { save, message: "이미 수령한 우편입니다" };
  }
  const max = save.island.energyMax ?? 100;
  const island = grantEnergy(
    {
      ...save.island,
      mana: save.island.mana + def.mana,
    },
    def.energy,
  );
  const bits: string[] = [];
  if (def.mana > 0) bits.push(`골드 +${def.mana}`);
  if (def.energy > 0) bits.push(`행동력 +${def.energy}`);
  return {
    save: {
      ...save,
      island,
      claimedMailIds: [...claimed, mailId],
    },
    message: `우편 수령: ${bits.join(" · ") || "보상 없음"}${
      def.energy > 0 && island.energy > max
        ? ` · 보유 ${Math.floor(island.energy)}/${max}`
        : ""
    }`,
  };
}

/** Equip inventory symbol onto monster (replaces same slot). */
export function runEquipSymbol(
  save: PlayerSave,
  monsterRef: string,
  symbolRef: string,
): LoopStepResult {
  const owned = resolveOwned(save, monsterRef);
  const sym = resolveSymbol(save, symbolRef);
  if (!owned) return { save, message: `소환수 없음: ${monsterRef}` };
  if (!sym) return { save, message: `상징 없음: ${symbolRef}` };

  const slotIdx = sym.slot - 1;
  const slots = [...(owned.symbolSlots ?? emptySymbolSlots())];

  // Unequip from any other monster first
  let roster = save.roster.map((m) => {
    const ss = [...(m.symbolSlots ?? emptySymbolSlots())];
    const cleared = ss.map((id) => (id === sym.id ? null : id));
    return { ...m, symbolSlots: cleared };
  });

  roster = roster.map((m) => {
    if (m.uid !== owned.uid) return m;
    const ss = [...(m.symbolSlots ?? emptySymbolSlots())];
    ss[slotIdx] = sym.id;
    return { ...m, symbolSlots: ss };
  });

  const updated = roster.find((m) => m.uid === owned.uid)!;
  return {
    save: { ...save, roster },
    message: `장착: ${describeOwned(updated)} ← ${describeSymbol(sym)}`,
  };
}

/** Unequip symbol from a monster slot (1–6). */
export function runUnequipSymbol(
  save: PlayerSave,
  monsterRef: string,
  slot: number,
): LoopStepResult {
  const owned = resolveOwned(save, monsterRef);
  if (!owned) return { save, message: `소환수 없음: ${monsterRef}` };
  if (slot < 1 || slot > 6) {
    return { save, message: "슬롯은 1~6입니다" };
  }
  const slotIdx = slot - 1;
  const slots = [...(owned.symbolSlots ?? emptySymbolSlots())];
  const symId = slots[slotIdx];
  if (!symId) {
    return { save, message: `슬롯 ${slot}이(가) 비어 있습니다` };
  }
  const sym = save.symbols.find((s) => s.id === symId);
  slots[slotIdx] = null;
  const roster = save.roster.map((m) =>
    m.uid === owned.uid ? { ...m, symbolSlots: slots } : m,
  );
  const updated = roster.find((m) => m.uid === owned.uid)!;
  return {
    save: { ...save, roster },
    message: sym
      ? `해제: ${describeOwned(updated)} ← ${describeSymbol(sym)}`
      : `해제: ${describeOwned(updated)} 슬롯 ${slot}`,
  };
}

/** Combat stats preview for enhance UI (base vs symbols applied). */
export function previewOwnedCombatStats(
  save: PlayerSave,
  monsterRef: string,
): {
  base: ReturnType<typeof scaledMonsterStats>;
  final: ReturnType<typeof applySymbolsToStats>;
  sets: ReturnType<typeof summarizeSymbolSets>;
} | null {
  const owned = resolveOwned(save, monsterRef);
  if (!owned) return null;
  const m = getMonster(owned.monsterId);
  if (!m) return null;
  const base = scaledMonsterStats(
    m,
    owned.level,
    owned.evolve ?? 0,
    owned.awaken ?? 0,
  );
  const equipped = equippedSymbols(save, owned);
  const final = applySymbolsToStats(base, equipped);
  const sets = summarizeSymbolSets(equipped);
  return { base, final, sets };
}

export function createStageBattle(
  stage: StageDef,
  save?: PlayerSave,
  opts?: {
    banEnemyIds?: string[];
    rng?: () => number;
    /** Scenario difficulty — scales enemy levels. */
    difficulty?: "normal" | "hard" | "hell";
    /** Override stage enemy roster (arena rivals, etc.). */
    enemyMonsterIds?: string[];
  },
): Battle {
  const activeEl = save?.activeSummoner ?? "light";
  const gear = save
    ? getActiveGear(save)
    : createEmptyGear();
  const allyMonsters: Unit[] = [];
  if (save?.party.length) {
    for (const uid of save.party.slice(0, 4)) {
      const owned = save.roster.find((m) => m.uid === uid);
      if (owned) allyMonsters.push(unitFromOwned(save, owned, "ally"));
    }
  }
  if (allyMonsters.length === 0) {
    const fallback = [
      "cinder_imp_fire",
      "dew_slime_water",
      "gale_bat_wind",
      "seal_apprentice_light",
    ];
    allyMonsters.push(
      ...fallback.map((id, i) => unitFromMonsterId(id, "ally", `a-${i}`)),
    );
  }

  const activeProfile = save
    ? getActiveSummoner(save)
    : { level: 1, exp: 0, awaken: 0 };
  const lvl = activeProfile.level;
  const awaken = activeProfile.awaken;
  const treeIds = save?.skillTree ?? [];
  const tree = skillTreeBonuses(treeIds);
  const magicProg =
    save?.summonerMagic?.[activeEl] ?? emptyMagicProgress();
  const robeHp =
    (gear.top?.summonerHpBonus ?? 0) +
    (gear.bottom?.summonerHpBonus ?? 0) +
    gearSetBonuses(gear).summonerHpBonus +
    tree.summonerHpBonus;
  const robeDef =
    (gear.top?.summonerDefBonus ?? 0) +
    (gear.bottom?.summonerDefBonus ?? 0) +
    gearSetBonuses(gear).summonerDefBonus;
  const leader = getSummonerLeader(activeEl);
  const awakenAtk = awakenLeaderAtkPct(awaken);
  const gearAtk = gearLeaderAtkPct(gear) + tree.leaderAtkBonus;
  for (const u of allyMonsters) {
    let atkMul = 1 + awakenAtk + gearAtk + (leader.atkPct ?? 0);
    if (leader.elementAtkPct && u.element === activeEl) {
      atkMul += leader.elementAtkPct;
    }
    const hpMul = 1 + (leader.hpPct ?? 0) + awakenAtk * 0.5;
    const spdMul = 1 + (leader.spdPct ?? 0);
    u.stats = {
      ...u.stats,
      atk: Math.round(u.stats.atk * atkMul),
      hp: Math.round(u.stats.hp * hpMul),
      spd: Math.round(u.stats.spd * spdMul),
      critRate: (u.stats.critRate ?? 0) + (leader.critRateFlat ?? 0),
      critDmg: (u.stats.critDmg ?? 0) + (leader.critDmgFlat ?? 0),
      accuracy: (u.stats.accuracy ?? 0) + (leader.accuracyFlat ?? 0),
    };
    u.hp = u.stats.hp;
    if (leader.damageTakenMul != null) {
      u.damageTakenMul = leader.damageTakenMul;
    }
  }
  const allySummonerUnit = makeUnit({
    id: "a-sum",
    name: `${SUMMONER_ELEMENT_LABEL[activeEl]} 소환사 Lv.${lvl}${awaken > 0 ? ` · 각성${awaken}` : ""}`,
    team: "ally",
    kind: "summoner",
    element: activeEl,
    stats: {
      hp:
        5000 +
        lvl * 200 +
        (gear.shoes?.manaMaxBonus ?? 0) * 2 +
        robeHp +
        awaken * 300,
      atk: 155 + lvl * 5,
      def:
        210 +
        Math.floor(gear.shoes?.enhance ?? 0) +
        Math.floor(lvl / 2) +
        robeDef +
        awaken * 15,
      spd: 98 + Math.floor(lvl / 5),
      critRate: 15,
      critDmg: 50,
    },
    skillCoeff: SKILL_DMG_MUL,
  });

  const banSet = new Set(
    (opts?.banEnemyIds ?? save?.arenaBanIds ?? [])
      .filter(Boolean)
      .map((id) => resolveMonsterId(id)),
  );
  let enemyIds =
    opts?.enemyMonsterIds && opts.enemyMonsterIds.length > 0
      ? opts.enemyMonsterIds
      : stage.enemyMonsterIds;
  if (stage.mode === "world_arena" && banSet.size > 0) {
    const filtered = enemyIds.filter(
      (id) => !banSet.has(id) && !banSet.has(resolveMonsterId(id)),
    );
    enemyIds = filtered.length > 0 ? filtered : enemyIds.slice(0, 1);
  }

  const diffBonus =
    opts?.difficulty === "hell" ? 4 : opts?.difficulty === "hard" ? 2 : 0;
  const enemyLevel = () =>
    1 + Math.floor(stage.stage / 2) + Math.floor(stage.map / 3) + diffBonus;

  const enemyMonsters = enemyIds.map((id, i) =>
    scaleScenarioEnemyHp(
      unitFromMonsterId(id, "enemy", `e-w1-${i}`, enemyLevel()),
      stage,
    ),
  );

  const enemyUnits: Unit[] = [
    makeUnit({
      id: "e-sum",
      name: "적 소환사",
      team: "enemy",
      kind: "summoner",
      element: "dark",
      stats: {
        hp: 4800 + diffBonus * 400,
        atk: 145 + diffBonus * 14,
        def: 210 + diffBonus * 20,
        spd: 88,
        critRate: 12,
        critDmg: 50,
      },
      skillCoeff: SKILL_DMG_MUL,
    }),
    ...enemyMonsters,
  ];

  const allyUnits = [allySummonerUnit, ...allyMonsters];
  const delta =
    estimateCombatPower(allyUnits) - estimateCombatPower(enemyUnits);
  const powerGapCap = amplifyCapFromPowerDelta(delta);
  const totalWaves = Math.max(1, stage.waves);

  const modules = modulesForStage(stage);
  const enemyProfile = enemySummonerProfile(stage);
  const unlockedAllyMagic = unlockedMagicSkills(activeEl, magicProg);
  const equippedMagicIds = new Set(
    (save.summonerMagicLoadouts?.[activeEl] ?? []).filter(
      (id): id is string => typeof id === "string",
    ),
  );
  const allyMagic = unlockedAllyMagic
    .filter((sk) =>
      // Preserve legacy saves until the player first changes their loadout.
      equippedMagicIds.size === 0 || equippedMagicIds.has(sk.id),
    )
    .map((sk) => ({
      id: sk.id,
      nameKo: sk.nameKo,
      manaCostFrac: sk.manaCostFrac,
      kind: sk.kind,
      power: magicSkillPower(sk, magicRank(magicProg, sk.id)),
      turns: sk.turns,
    }));
  const enemyEl: Element = "dark";
  const enemyMagic = unlockedMagicSkills(enemyEl, emptyMagicProgress()).map(
    (sk) => ({
      id: sk.id,
      nameKo: sk.nameKo,
      manaCostFrac: sk.manaCostFrac,
      kind: sk.kind,
      power: magicSkillPower(sk, 0),
      turns: sk.turns,
    }),
  );

  const ins = circleInscriptionBuffFromLevels(save?.circleInscriptions ?? {});
  return new Battle({
    boardSize: stage.boardSize,
    units: [...allyUnits, ...enemyUnits],
    allySummoner: buildSummonerState(
      "a-sum",
      gear,
      false,
      awaken,
      treeIds,
      allyMagic,
      activeEl,
      ins.startManaFlat,
    ),
    enemySummoner: buildSummonerState(
      "e-sum",
      createStarterGear(),
      enemyProfile.weakBoard,
      Math.min(5, enemyProfile.awaken + Math.floor(diffBonus / 2)),
      enemyProfile.skillTree,
      enemyMagic,
      enemyEl,
    ),
    powerGapAmplifyCap: powerGapCap,
    inscriptionAmplifyCapAdd: ins.amplifyCapAdd,
    inscriptionItemSpawnBonus: ins.itemSpawnBonus,
    totalWaves,
    modules,
    rng: opts?.rng,
    spawnWave: (wave) =>
      enemyIds.map((id, i) =>
        scaleScenarioEnemyHp(
          unitFromMonsterId(
            id,
            "enemy",
            `e-w${wave}-${i}`,
            enemyLevel() + (wave - 1),
          ),
          stage,
        ),
      ),
  });
}

/**
 * Summoners War extra-loot crystals: rare, not a guaranteed payout.
 * Cairos community data is ~4–5% for 1–2; scenario extras sit a bit higher.
 */
export function stageCrystalDropChance(stage: StageDef): number {
  switch (stage.mode) {
    case "scenario":
      return 0.08;
    case "weekday":
      return 0.06;
    case "depth":
    case "equip":
    case "trial":
      return 0.05;
    case "guild_raid":
      return 0.04;
    case "arena":
    case "world_arena":
      return 0;
    default:
      return 0.05;
  }
}

/** 0 on a miss; 1 most hits, 2 uncommon, 3 only on late scenario. */
export function rollStageCrystalDrop(
  stage: StageDef,
  rng: () => number,
): number {
  const chance = stageCrystalDropChance(stage);
  if (chance <= 0 || rng() >= chance) return 0;
  const lateScenario =
    stage.mode === "scenario" && (stage.map >= 8 || stage.stage >= 7);
  const qtyRoll = rng();
  if (qtyRoll < 0.82) return 1;
  if (lateScenario && qtyRoll >= 0.95) return 3;
  return 2;
}

/** Fully auto-resolve a battle (cap turns). */
export function resolveBattleAuto(
  battle: Battle,
  maxTurns = 80,
): { victory: boolean; turns: number } {
  let turns = 0;
  while (!battle.finishReason && turns < maxTurns) {
    battle.runAutoTurn();
    turns++;
  }
  return {
    victory: battle.finishReason === "ally_win",
    turns,
  };
}

export type ApplyRewardsOpts = {
  damageDealt?: number;
};

function raidChipFromCombat(damageDealt: number, raidBossHp: number): number {
  const raw = Math.round(Math.max(0, damageDealt) * RAID_COMBAT_TO_BOSS);
  return Math.max(0, Math.min(raidBossHp, raw));
}

function raidPayRatio(chip: number, victory: boolean): number {
  const ratio = RAID_DAMAGE_BASE > 0 ? chip / RAID_DAMAGE_BASE : 0;
  return victory ? Math.max(1, ratio) : Math.max(0, ratio);
}

function applyRaidHpMilestones(
  beforeHp: number,
  afterHp: number,
  claimedIn: number[],
): { claimed: number[]; extraJinmun: number; extraGlory: number; extras: string[] } {
  const claimed = new Set(claimedIn);
  const extras: string[] = [];
  let extraJinmun = 0;
  let extraGlory = 0;
  for (const pct of RAID_MILESTONE_PERCENTS) {
    if (claimed.has(pct)) continue;
    const threshold = Math.floor((RAID_BOSS_MAX_HP * pct) / 100);
    const crossed =
      pct === 0
        ? beforeHp > 0 && afterHp <= 0
        : beforeHp > threshold && afterHp <= threshold;
    if (!crossed) continue;
    claimed.add(pct);
    extraJinmun += RAID_MILESTONE_JINMUN;
    extraGlory += RAID_MILESTONE_GLORY;
    extras.push(
      `레이드${pct}% 마일스톤 진문+${RAID_MILESTONE_JINMUN}/영광+${RAID_MILESTONE_GLORY}`,
    );
  }
  return {
    claimed: [...claimed].sort((a, b) => b - a),
    extraJinmun,
    extraGlory,
    extras,
  };
}

function applyGuildRaidDefeatRewards(
  save: PlayerSave,
  stage: StageDef,
  damageDealt: number,
): { save: PlayerSave; reward: BattleReward } {
  const working = bumpDailyActivity(syncRaidWeek(save), "raid");
  const raidBossHp = working.raidBossHp ?? RAID_BOSS_MAX_HP;
  const chip = raidChipFromCombat(damageDealt, raidBossHp);
  const ratio = raidPayRatio(chip, false);
  const gloryGain = Math.round((stage.gloryReward ?? 0) * ratio);
  const jinmunGain = Math.round((stage.jinmunReward ?? 0) * ratio);
  const contributionGain =
    chip > 0 ? Math.max(1, Math.round(RAID_CONTRIB_BASE * ratio)) : 0;
  const afterHp = Math.max(0, raidBossHp - chip);
  const miles = applyRaidHpMilestones(
    raidBossHp,
    afterHp,
    working.raidMilestonesClaimed ?? [],
  );
  const extras: string[] = [];
  if (chip > 0) extras.push(`보스 HP ${afterHp}/${RAID_BOSS_MAX_HP} (−${chip})`);
  extras.push(...miles.extras);
  if (contributionGain > 0) extras.push(`기여도 +${contributionGain}`);
  return {
    save: {
      ...working,
      gloryPoints: (working.gloryPoints ?? 0) + gloryGain + miles.extraGlory,
      jinmunStones: (working.jinmunStones ?? 0) + jinmunGain + miles.extraJinmun,
      guildContribution: (working.guildContribution ?? 0) + contributionGain,
      guildRaidBest: Math.max(working.guildRaidBest ?? 0, contributionGain),
      raidBossHp: afterHp,
      raidMilestonesClaimed: miles.claimed,
    },
    reward: {
      mana: 0,
      glory: gloryGain + miles.extraGlory || undefined,
      jinmun: jinmunGain + miles.extraJinmun || undefined,
      contribution: contributionGain || undefined,
      raidDamage: chip,
      expNote: extras.join(" · ") || "패배",
      victory: false,
      expTracks: [],
    },
  };
}

export function applyRewards(
  save: PlayerSave,
  stage: StageDef,
  victory: boolean,
  rng: () => number = Math.random,
  difficulty: ScenarioDifficulty = "normal",
  opts?: ApplyRewardsOpts,
): { save: PlayerSave; reward: BattleReward } {
  if (!victory) {
    if (stage.mode === "guild_raid") {
      return applyGuildRaidDefeatRewards(save, stage, opts?.damageDealt ?? 0);
    }
    return {
      save,
      reward: {
        mana: 0,
        expNote: "패배 — 보상 없음",
        victory: false,
        expTracks: [],
      },
    };
  }

  const modeMul =
    stage.mode === "depth"
      ? 1.2
      : stage.mode === "arena"
        ? 0.6
        : stage.mode === "world_arena"
          ? 0.7
          : stage.mode === "guild_raid"
            ? 1.5
            : stage.mode === "equip"
              ? 1.15
              : 1;
  const manaGain = Math.round((180 + stage.stage * 60) * modeMul);
  let gloryGain = stage.gloryReward ?? 0;
  let jinmunGain = stage.jinmunReward ?? 0;
  const scenarioTable =
    stage.mode === "scenario"
      ? scenarioSymbolDropTable(difficulty, stage.stage)
      : null;
  const dropChance =
    stage.dropChance ?? scenarioTable?.dropChance ?? 0.65;
  const expGain = expForStage(stage, difficulty);
  const monsterExpGain = Math.max(1, Math.round(expGain * 0.75));

  let working = syncSummonerMirrors({
    ...save,
    island: {
      ...save.island,
      mana: save.island.mana + manaGain,
    },
  });
  working = bumpDailyActivity(working, "battle");
  if (stage.mode === "depth") working = bumpDailyActivity(working, "dungeon");
  else if (stage.mode === "arena") working = bumpDailyActivity(working, "arena");
  else if (stage.mode === "weekday") working = bumpDailyActivity(working, "weekday");
  else if (stage.mode === "equip") working = bumpDailyActivity(working, "equip");
  else if (stage.mode === "world_arena") {
    working = bumpDailyActivity(working, "warena");
  } else if (stage.mode === "guild_raid") {
    working = bumpDailyActivity(working, "raid");
  }

  const beforeAccountLv = accountSummonerLevel(
    working.summoners ?? createSummonerRoster(),
  );
  const beforeActive = getActiveSummoner(working);
  const beforeParty = working.party
    .map((uid) => working.roster.find((m) => m.uid === uid))
    .filter((m): m is OwnedMonster => !!m)
    .map((m) => ({
      uid: m.uid,
      monsterId: m.monsterId,
      level: m.level,
      exp: m.exp ?? 0,
      nameKo: describeOwned(m),
    }));

  const leveled = addActiveSummonerExp(working, expGain);
  working = leveled.save;

  const rosterAfter = working.roster.map((m) => {
    if (!working.party.includes(m.uid)) return m;
    return addOwnedMonsterExp(m, monsterExpGain).monster;
  });
  working = { ...working, roster: rosterAfter };

  const afterActive = getActiveSummoner(working);
  const afterAccountLv = accountSummonerLevel(
    working.summoners ?? createSummonerRoster(),
  );
  const expTracks: ExpTrackGain[] = [
    {
      kind: "user",
      id: "user",
      gained: expGain,
      beforeLevel: beforeAccountLv,
      beforeExp: beforeActive.exp,
      afterLevel: afterAccountLv,
      afterExp: afterActive.exp,
      expPerLevel: summonerExpToNext(afterAccountLv),
      levelsGained: Math.max(0, afterAccountLv - beforeAccountLv),
    },
    {
      kind: "summoner",
      id: working.activeSummoner ?? "light",
      element: working.activeSummoner ?? "light",
      gained: expGain,
      beforeLevel: beforeActive.level,
      beforeExp: beforeActive.exp,
      afterLevel: afterActive.level,
      afterExp: afterActive.exp,
      expPerLevel: summonerExpToNext(afterActive.level),
      levelsGained: leveled.levelsGained,
    },
    ...beforeParty.map((bp) => {
      const after = working.roster.find((m) => m.uid === bp.uid)!;
      const gainedLevels = Math.max(0, after.level - bp.level);
      return {
        kind: "monster" as const,
        id: bp.uid,
        nameKo: bp.nameKo,
        monsterId: bp.monsterId,
        gained: monsterExpGain,
        beforeLevel: bp.level,
        beforeExp: bp.exp,
        afterLevel: after.level,
        afterExp: after.exp ?? 0,
        expPerLevel: monsterExpToNext(after),
        levelsGained: gainedLevels,
      };
    }),
  ];

  let island = working.island;

  const dropStarWeights = scenarioTable?.starWeights ?? stage.starWeights;
  const dropQualityWeights =
    scenarioTable?.qualityWeights ?? stage.qualityWeights;
  const scenarioGearStars = scenarioTable
    ? (scenarioTable.starWeights.filter((r) => r.value <= 5) as {
        value: 1 | 2 | 3 | 4 | 5;
        w: number;
      }[])
    : null;

  const symbols = [...save.symbols];
  let symbol: SymbolInstance | undefined;
  if (rng() < dropChance) {
    if (symbols.length >= symbolBagCapacity(save)) {
      symbol = undefined;
    } else {
      const preferredSlot =
        stage.mode === "scenario" && stage.stage >= 1 && stage.stage <= 6
          ? (stage.stage as 1 | 2 | 3 | 4 | 5 | 6)
          : undefined;
      symbol = rollSymbolDrop(rng, `drop_${stage.id}_${symbols.length}`, {
        preferredSet: stage.dropSetId,
        preferredSlot,
        setPool: stage.dropSetPool,
        starWeights: dropStarWeights,
        qualityWeights: dropQualityWeights,
      });
      symbols.push(symbol);
    }
  }

  let gear = getActiveGear(working);
  let gearBag = [...(working.gearBag ?? [])].map((g) =>
    normalizeGearPiece(g, g.slot),
  );
  let gearDrop: GearPiece | undefined;
  let bagSoldNote = "";
  const defaultGearChance =
    stage.mode === "equip"
      ? 0.75
      : stage.mode === "scenario" ||
          stage.mode === "depth" ||
          stage.mode === "weekday" ||
          stage.mode === "trial"
        ? 0.18
        : 0;
  const gearChance = stage.gearDropChance ?? defaultGearChance;
  if (gearChance > 0 && rng() < gearChance) {
    gearDrop = rollGearDrop(
      rng,
      stage.mode === "equip" ? `equip_${stage.id}` : `gear_${stage.id}`,
      {
        preferredElement: working.activeSummoner,
        ...(scenarioGearStars
          ? {
              starWeights: scenarioGearStars,
              qualityWeights: scenarioTable!.qualityWeights,
            }
          : {}),
      },
    );
    if (
      stage.mode === "equip" &&
      stage.stage >= 2 &&
      gearDrop.enhance < MAX_GEAR_ENHANCE
    ) {
      gearDrop = bumpGearEnhance(gearDrop);
    }
    if (gearBag.length >= gearBagCapacity(working)) {
      const sold = gearBag.shift()!;
      const gain = gearSellMana(sold);
      const crystalGain = gearSellCrystal(sold);
      island = {
        ...island,
        mana: island.mana + gain,
        crystal: (island.crystal ?? 0) + crystalGain,
      };
      bagSoldNote =
        crystalGain > 0
          ? ` · 가방초과 판매 ${describeGear(sold)}(+${gain}/+크${crystalGain})`
          : ` · 가방초과 판매 ${describeGear(sold)}(+${gain})`;
    }
    gearBag.push(gearDrop);
  }

  let scrolls = save.scrolls;
  let scrollsPremium = save.scrollsPremium ?? 0;
  const dropRoll = rng();
  const mysticalChance =
    stage.mode === "weekday" ? 0.08 : stage.mode === "scenario" ? 0.07 : 0.05;
  const unknownChance =
    stage.mode === "weekday" ? 0.55 : stage.mode === "scenario" ? 0.45 : 0.4;
  if (dropRoll < mysticalChance) {
    scrollsPremium += 1;
  } else if (dropRoll < unknownChance) {
    scrolls += 1;
  }

  const crystalGain = rollStageCrystalDrop(stage, rng);
  if (crystalGain > 0) {
    island = {
      ...island,
      crystal: (island.crystal ?? 0) + crystalGain,
    };
  }

  const cleared = save.clearedStages.includes(stage.id)
    ? save.clearedStages
    : [...save.clearedStages, stage.id];
  const clearedHard =
    difficulty === "hard" || difficulty === "hell"
      ? save.clearedHardStages?.includes(stage.id)
        ? (save.clearedHardStages ?? [])
        : [...(save.clearedHardStages ?? []), stage.id]
      : (save.clearedHardStages ?? []);
  const clearedHell =
    difficulty === "hell"
      ? save.clearedHellStages?.includes(stage.id)
        ? (save.clearedHellStages ?? [])
        : [...(save.clearedHellStages ?? []), stage.id]
      : (save.clearedHellStages ?? []);

  let gloryPoints = (save.gloryPoints ?? 0) + gloryGain;
  let jinmunStones = (save.jinmunStones ?? 0) + jinmunGain;

  let contributionGain = 0;
  let guildContribution = save.guildContribution ?? 0;
  let guildRaidBest = save.guildRaidBest ?? 0;
  let raidBossHp = save.raidBossHp ?? RAID_BOSS_MAX_HP;
  let raidMilestonesClaimed = [...(save.raidMilestonesClaimed ?? [])];
  let raidDamageOut = 0;

  const extras: string[] = [`EXP +${expGain}`];
  if (crystalGain > 0) extras.push(`크리스탈 +${crystalGain}`);
  if (gloryGain > 0) extras.push(`영광 +${gloryGain}`);
  if (jinmunGain > 0) extras.push(`진문석 +${jinmunGain}`);

  if (stage.mode === "guild_raid") {
    const chip = raidChipFromCombat(opts?.damageDealt ?? 0, raidBossHp);
    raidDamageOut = chip;
    const ratio = raidPayRatio(chip, true);
    const nextGlory = Math.round((stage.gloryReward ?? 0) * ratio);
    const nextJinmun = Math.round((stage.jinmunReward ?? 0) * ratio);
    gloryPoints += nextGlory - gloryGain;
    jinmunStones += nextJinmun - jinmunGain;
    gloryGain = nextGlory;
    jinmunGain = nextJinmun;
    contributionGain = Math.max(1, Math.round(RAID_CONTRIB_BASE * ratio));
    guildContribution += contributionGain;
    guildRaidBest = Math.max(guildRaidBest, contributionGain);
    const beforeHp = raidBossHp;
    raidBossHp = Math.max(0, raidBossHp - chip);
    const miles = applyRaidHpMilestones(
      beforeHp,
      raidBossHp,
      raidMilestonesClaimed,
    );
    raidMilestonesClaimed = miles.claimed;
    jinmunStones += miles.extraJinmun;
    gloryPoints += miles.extraGlory;
    extras.push(...miles.extras);
    extras.push(`보스 HP ${raidBossHp}/${RAID_BOSS_MAX_HP} (−${chip})`);
  }

  let arenaSeasonWins = save.arenaSeasonWins ?? 0;
  if (stage.mode === "world_arena") {
    arenaSeasonWins += 1;
  }

  let trialTokens = save.trialTokens ?? 0;
  let trialTitleUnlocked = save.trialTitleUnlocked ?? false;
  if (stage.id === "trial_b3" && !save.clearedStages.includes("trial_b3")) {
    trialTokens += 1;
    trialTitleUnlocked = true;
    extras.push("시련 토큰 +1");
  }

  if (contributionGain > 0) extras.push(`기여도 +${contributionGain}`);
  if (stage.mode === "world_arena") extras.push(`시즌승 ${arenaSeasonWins}`);
  if (gearDrop) extras.push(`장비 ${describeGear(gearDrop)} → 가방`);
  if (scrollsPremium > (save.scrollsPremium ?? 0))
    extras.push(`${SCROLL_KIND_LABEL.premium} +1`);
  else if (scrolls > save.scrolls) extras.push(`${SCROLL_KIND_LABEL.normal} +1`);

  let awakenMats = { ...(working.awakenMats ?? {}) };
  let skillMats = working.skillMats ?? 0;
  const awakenDungeonElement = stage.id.match(/^weekday_awaken_(fire|water|wind|light|dark)$/)?.[1] as
    | Element
    | undefined;
  if (awakenDungeonElement) {
    const el = awakenDungeonElement;
    awakenMats = {
      ...awakenMats,
      [el]: (awakenMats[el] ?? 0) + WEEKDAY_EVOLVE_MAT_DROP,
    };
    extras.push(`${SUMMONER_ELEMENT_LABEL[el]} 정수 +${WEEKDAY_EVOLVE_MAT_DROP}`);
  } else if (stage.id === "weekday_skill") {
    skillMats += WEEKDAY_SKILL_MAT_DROP;
    extras.push(`스킬재료 +${WEEKDAY_SKILL_MAT_DROP}`);
  }

  const activeAfter = getActiveSummoner({ ...working, island });
  const levelNote =
    leveled.levelsGained > 0
      ? ` · 소환사 Lv.${activeAfter.level}(+${leveled.levelsGained})`
      : "";

  return {
    save: syncSummonerMirrors({
      ...working,
      island,
      symbols,
      gear,
      gearBag,
      clearedStages: cleared,
      clearedHardStages: clearedHard,
      clearedHellStages: clearedHell,
      scrolls,
      scrollsPremium,
      gloryPoints,
      jinmunStones,
      gloryLevels: working.gloryLevels ?? {},
      arenaBanIds: working.arenaBanIds ?? [],
      arenaSeasonWins,
      guildContribution,
      dojoDrills: working.dojoDrills ?? 0,
      guildName: working.guildName ?? null,
      guildCheckInDay: working.guildCheckInDay ?? null,
      guildRaidBest,
      seasonRewardsClaimed: working.seasonRewardsClaimed ?? 0,
      skillTree: working.skillTree ?? [],
      equipVaultWeekKey: working.equipVaultWeekKey ?? null,
      equipVaultWeekEntries: working.equipVaultWeekEntries ?? 0,
      awakenMats,
      skillMats,
      trialTokens,
      trialTitleUnlocked,
      raidBossHp,
      raidMilestonesClaimed,
      raidWeekKey: working.raidWeekKey ?? null,
      raidAttemptsDay: working.raidAttemptsDay ?? 0,
      raidAttemptDay: working.raidAttemptDay ?? null,
    }),
    reward: {
      mana: manaGain,
      crystal: crystalGain || undefined,
      glory: gloryGain || undefined,
      jinmun: jinmunGain || undefined,
      contribution: contributionGain || undefined,
      raidDamage: raidDamageOut || undefined,
      expNote: `${stage.nameKo} 클리어 · ${extras.join(" · ")}${bagSoldNote}${levelNote}`,
      symbol,
      gear: gearDrop,
      victory: true,
      summonerExp: expGain,
      levelsGained: leveled.levelsGained,
      expTracks,
      unlockedBuildingIds: leveled.unlockedBuildingIds,
    },
  };
}

/**
 * Full loop step: spend energy → fight → reward.
 */
export function runSortie(
  save: PlayerSave,
  stageId: string,
  opts?: {
    maxTurns?: number;
    rng?: () => number;
    banEnemyIds?: string[];
    enemyMonsterIds?: string[];
    rivalId?: string;
    now?: number;
    difficulty?: ScenarioDifficulty;
  },
): LoopStepResult {
  const stage = getStage(stageId);
  if (!stage) {
    return { save, message: `알 수 없는 스테이지: ${stageId}` };
  }
  const now = opts?.now ?? Date.now();
  let working = save;
  if (stage.mode === "equip") {
    working = syncEquipVaultWeek(working, now);
    if ((working.equipVaultWeekEntries ?? 0) >= EQUIP_VAULT_WEEKLY_LIMIT) {
      return {
        save: working,
        message: `장비 금고 주간 입장 한도 소진 (${EQUIP_VAULT_WEEKLY_LIMIT}회)`,
      };
    }
  }
  if (stage.mode === "arena") {
    working = syncArenaAttackDay(working, now);
    if ((working.arenaAttacksToday ?? 0) >= ARENA_ATTACKS_DAILY) {
      return {
        save: working,
        message: `오늘 아레나 공격 한도 소진 (${ARENA_ATTACKS_DAILY}회)`,
      };
    }
  }
  if (stage.mode === "guild_raid") {
    working = syncRaidAttemptDay(syncRaidWeek(working, now), now);
    if ((working.raidAttemptsDay ?? 0) >= RAID_ATTEMPTS_DAILY) {
      return {
        save: working,
        message: `오늘 레이드 시도 한도 소진 (${RAID_ATTEMPTS_DAILY}회)`,
      };
    }
  }
  const difficulty =
    stage.mode === "arena" ||
    stage.mode === "world_arena" ||
    stage.mode === "guild_raid"
      ? "normal"
      : (opts?.difficulty ?? "normal");
  const energyCost =
    stage.mode === "scenario"
      ? Math.ceil(
          stage.energyCost *
            (difficulty === "hell" ? 2 : difficulty === "hard" ? 1.5 : 1),
        )
      : stage.energyCost;
  const energy = Math.floor(working.island.energy);
  if (energyCost > 0 && energy < energyCost) {
    return {
      save: working,
      message: `에너지 부족 (필요 ${energyCost}, 보유 ${energy})`,
    };
  }
  if (!isStageUnlocked(working, stageId)) {
    if (
      stage.mode === "weekday" &&
      working.clearedStages.includes("garen_1_3") &&
      !isWeekdayStageOpenToday(stageId, now)
    ) {
      return {
        save: working,
        message: `오늘은 닫힌 요일 던전입니다 (${stage.nameKo})`,
      };
    }
    return {
      save: working,
      message: `콘텐츠 잠김 — 해금 조건을 확인하세요 (${stageId})`,
    };
  }
  if (!isDifficultyOpen(working, stage, difficulty)) {
    return {
      save: working,
      message: `이 난이도는 아직 열리지 않았습니다 (${stageId})`,
    };
  }

  const island =
    energyCost > 0
      ? spendEnergy(working.island, energyCost)
      : working.island;
  const mid: PlayerSave = {
    ...working,
    island,
    gloryPoints: working.gloryPoints ?? 0,
    jinmunStones: working.jinmunStones ?? 0,
    gloryLevels: working.gloryLevels ?? {},
    arenaBanIds: working.arenaBanIds ?? [],
    arenaSeasonWins: working.arenaSeasonWins ?? 0,
    guildContribution: working.guildContribution ?? 0,
    dojoDrills: working.dojoDrills ?? 0,
    guildName: working.guildName ?? null,
    guildCheckInDay: working.guildCheckInDay ?? null,
    guildRaidBest: working.guildRaidBest ?? 0,
    seasonRewardsClaimed: working.seasonRewardsClaimed ?? 0,
    summonerAwaken: working.summonerAwaken ?? 0,
    gearBag: working.gearBag ?? [],
    skillTree: working.skillTree ?? [],
    equipVaultWeekKey: working.equipVaultWeekKey ?? isoWeekKey(now),
    equipVaultWeekEntries:
      stage.mode === "equip"
        ? (working.equipVaultWeekEntries ?? 0) + 1
        : (working.equipVaultWeekEntries ?? 0),
    arenaAttacksToday:
      stage.mode === "arena"
        ? (working.arenaAttacksToday ?? 0) + 1
        : (working.arenaAttacksToday ?? 0),
    arenaAttackDay:
      stage.mode === "arena"
        ? (working.arenaAttackDay ?? todayKey(now))
        : (working.arenaAttackDay ?? null),
    raidAttemptsDay:
      stage.mode === "guild_raid"
        ? (working.raidAttemptsDay ?? 0) + 1
        : (working.raidAttemptsDay ?? 0),
    raidAttemptDay:
      stage.mode === "guild_raid"
        ? (working.raidAttemptDay ?? todayKey(now))
        : (working.raidAttemptDay ?? null),
    raidBossHp: working.raidBossHp ?? RAID_BOSS_MAX_HP,
    raidMilestonesClaimed: working.raidMilestonesClaimed ?? [],
    raidWeekKey: working.raidWeekKey ?? isoWeekKey(now),
  };

  let enemyMonsterIds = opts?.enemyMonsterIds;
  if (!enemyMonsterIds && stage.mode === "arena") {
    const rival = opts?.rivalId
      ? getArenaRivalDeck(opts.rivalId) ??
        pickArenaRival(`${todayKey(now)}:${stageId}`, opts?.rng)
      : pickArenaRival(`${todayKey(now)}:${stageId}`, opts?.rng);
    enemyMonsterIds = rival.enemyMonsterIds;
  }

  const battle = createStageBattle(stage, mid, {
    banEnemyIds: opts?.banEnemyIds ?? mid.arenaBanIds,
    rng: opts?.rng,
    enemyMonsterIds,
    difficulty,
  });
  const { victory, turns } = resolveBattleAuto(battle, opts?.maxTurns ?? 80);
  const { save: next, reward } = applyRewards(
    mid,
    stage,
    victory,
    opts?.rng,
    difficulty,
    { damageDealt: battle.allyDamageDealt },
  );
  return {
    save: next,
    message: victory
      ? `출정 승리 (${turns}턴) · ${reward.expNote}`
      : `출정 패배 (${turns}턴)`,
    reward,
    battleLog: [`turns=${turns}`, `finish=${battle.finishReason}`],
  };
}

/** World arena: ban up to 2 enemy monster ids before sortie. */
export function runSetArenaBans(
  save: PlayerSave,
  monsterIds: string[],
): LoopStepResult {
  const unique = [...new Set(monsterIds.map((id) => id.trim()).filter(Boolean))].slice(
    0,
    2,
  );
  return {
    save: { ...save, arenaBanIds: unique },
    message: unique.length
      ? `월드아레나 밴: ${unique.join(", ")}`
      : `월드아레나 밴 해제`,
  };
}

/** Scripted demo: collect → summon → gear → equip/enhance → sortie → collect. */
export function runDemoLoop(rng: () => number = () => 0.2): LoopStepResult[] {
  let save = createNewSave(0);
  const steps: LoopStepResult[] = [];

  const c1 = homeCollect(save, 3_600_000);
  steps.push(c1);
  save = c1.save;

  const sum = runSummon(save, "normal", rng);
  steps.push(sum);
  save = sum.save;

  const enh = runEnhance(save, "0");
  steps.push(enh);
  save = enh.save;

  const g = runEnhanceGear(
    withActiveGear(save, createStarterGear(save.activeSummoner ?? "light")),
    "shoes",
  );
  steps.push(g);
  save = g.save;

  const se = runEnhanceSymbol(save, "0");
  steps.push(se);
  save = se.save;

  const s1 = runSortie(save, "garen_1_1", { rng });
  steps.push(s1);
  save = s1.save;

  const c2 = homeCollect(save, 3_600_000 * 2);
  steps.push(c2);

  return steps;
}
