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
  createStarterGear,
  createStarterHwalro,
  describeGear,
  describeSymbol,
  gearEnhanceCrystalCost,
  gearEnhanceManaCost,
  gearLeaderAtkPct,
  gearSellMana,
  gearSetBonuses,
  GEAR_SET_AFFIX_MANA,
  getGearSet,
  getGloryBuilding,
  getMonster,
  getSkillTreeNode,
  isSkillTreeNodeId,
  canUnlockSkillNode,
  MAX_GEAR_BAG,
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
  grindSymbolPrefix,
  MAX_GEAR_ENHANCE,
  MAX_SYMBOL_ENHANCE,
  symbolEnhanceManaCost,
  SYMBOL_IMPRINT_CRYSTAL_COST,
  SYMBOL_GRIND_MANA_COST,
  summarizeSymbolSets,
  ALL_STAGES,
  type GearPiece,
  type GearSetId,
  type GearSlot,
  type GloryBuildingId,
  type SkillTreeNodeId,
  type StageDef,
  type SummonerGear,
  type SymbolInstance,
} from "stonesummoner-data";
import {
  addSummonerExp,
  collectCrystal,
  collectMana,
  createStarterIsland,
  runWish,
  syncBuildingUnlocks,
  tickProduction,
  upgradeBuilding,
  type BuildingId,
  type IslandState,
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
  MAX_MONSTER_LEVEL,
  MAX_SKILL_LEVEL,
  nextUid,
  normalizeSkillLevels,
  pickSummonMonster,
  scaledMonsterStats,
  skillUpManaCost,
  skillUpMinMonsterLevel,
  defaultSkillLevels,
  SCROLL_BUY_MANA_COST,
  SUMMON_SCROLL_COST,
  type OwnedMonster,
} from "./roster.js";
import { expForStage, isStageUnlocked, stageUnlockLabel } from "./progress.js";

export type { OwnedMonster } from "./roster.js";
export {
  describeOwned,
  enhanceManaCost,
  evolveCrystalCost,
  evolveManaCost,
  evolveMinLevel,
  MAX_EVOLVE,
  MAX_MONSTER_LEVEL,
  MAX_SKILL_LEVEL,
  normalizeSkillLevels,
  skillUpManaCost,
  skillUpMinMonsterLevel,
  SCROLL_BUY_MANA_COST,
  SUMMON_SCROLL_COST,
} from "./roster.js";
export { isStageUnlocked, stageUnlockLabel } from "./progress.js";

export interface PlayerSave {
  island: IslandState;
  symbols: SymbolInstance[];
  clearedStages: string[];
  roster: OwnedMonster[];
  /** Up to 4 owned monster uids for battle. */
  party: string[];
  scrolls: number;
  gear: SummonerGear;
  /** Unequipped gear drops (equip vault bag). */
  gearBag: GearPiece[];
  /** Summoner awaken/transcend stub (0..MAX_SUMMONER_AWAKEN). */
  summonerAwaken: number;
  /** Unlocked summoner skill-tree node ids. */
  skillTree: string[];
  /** Phase 2: arena glory currency. */
  gloryPoints: number;
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
  /** Phase 2+: practice dojo drill count (묘수 미션 누적). */
  dojoDrills: number;
  /** Phase 2+: guild name (local stub, not realtime). */
  guildName: string | null;
  /** YYYY-MM-DD of last guild check-in. */
  guildCheckInDay: string | null;
  /** Best single guild-raid contribution gain. */
  guildRaidBest: number;
  /** World-arena season reward tiers claimed. */
  seasonRewardsClaimed: number;
}

export interface BattleReward {
  mana: number;
  crystal?: number;
  glory?: number;
  jinmun?: number;
  contribution?: number;
  expNote: string;
  symbol?: SymbolInstance;
  /** Equip dungeon wearable drop (stored in gearBag). */
  gear?: GearPiece;
  victory: boolean;
  summonerExp?: number;
  levelsGained?: number;
}

export interface LoopStepResult {
  save: PlayerSave;
  message: string;
  reward?: BattleReward;
  battleLog?: string[];
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
    .filter((s): s is SymbolInstance => !!s);
}

export const MAX_SUMMONER_AWAKEN = 5;

/** Mana cost to raise awaken → awaken+1 */
export function awakenManaCost(awaken: number): number {
  return 500 + awaken * 400;
}

export function awakenCrystalCost(awaken: number): number {
  return 3 + awaken * 2;
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
): SummonerState {
  const g = normalizeSummonerGear(gear);
  const pieces = [g.weapon, g.robe, g.accessory, g.orb, g.cloak, g.ring];
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
    mana: Math.min(manaMax, manaMax * startPct),
    manaMax,
    manaRegenPerTick: regen,
    boardSense,
    skillPowerBonus,
    declareCostMul: tree.declareCostMul,
    dualCostMul: tree.dualCostMul,
    cleanCostMul: tree.cleanCostMul,
    declarePowerBonus: tree.declarePowerBonus,
    cleanAmpBonus: tree.cleanAmpBonus,
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
  const weakBoard = !isPvp && stage.stage <= 2;
  const skillTree: string[] = [];
  if (stage.stage >= 2 || isPvp) skillTree.push("root_power");
  if (stage.stage >= 3 || isPvp) skillTree.push("root_mana");
  if (stage.stage >= 4 || (isPvp && stage.stage >= 2)) {
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
    return {
      ...sk,
      effects: sk.effects.map((e) => {
        if (e.kind === "damage" || e.kind === "heal" || e.kind === "shield") {
          return { ...e, coeff: e.coeff + evoBump + skBump };
        }
        if (e.kind === "mana") {
          return { ...e, amount: Math.round(e.amount * (1 + skBump)) };
        }
        return { ...e };
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
  const base = scaledMonsterStats(m, owned.level, owned.evolve ?? 0);
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
  const skillLevels = normalizeSkillLevels(owned.skillLevels);
  return makeUnit({
    id: owned.uid,
    name: `${m.nameKo} Lv.${owned.level}${evoTag}`,
    team,
    kind: "monster",
    element: m.element,
    stats: { ...stats },
    skillCoeff: m.skillCoeff + (owned.evolve ?? 0) * 0.05 + (skillLevels[0]! - 1) * 0.08,
    skills: skillsForMonster(m, owned.evolve ?? 0, skillLevels),
    stonePassive: m.stonePassiveId,
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
    element: m.element,
    stats: { ...stats },
    skillCoeff: m.skillCoeff,
    skills: skillsForMonster(m, 0),
    stonePassive: m.stonePassiveId,
  });
}

export function createNewSave(now = Date.now()): PlayerSave {
  const { roster, party, scrolls } = createStarterRoster();
  const gear = createStarterGear();
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
    roster,
    party,
    scrolls,
    gear,
    gearBag: [],
    summonerAwaken: 0,
    skillTree: [],
    gloryPoints: 0,
    jinmunStones: 0,
    gloryLevels: {},
    arenaBanIds: [],
    arenaSeasonWins: 0,
    guildContribution: 0,
    dojoDrills: 0,
    guildName: null,
    guildCheckInDay: null,
    guildRaidBest: 0,
    seasonRewardsClaimed: 0,
  };
}

/** Prefixed demo save for test entry (extra mana/scrolls/levels). */
export function createDemoSave(now = Date.now()): PlayerSave {
  const save = createNewSave(now);
  return {
    ...save,
    scrolls: 20,
    gloryPoints: 120,
    jinmunStones: 5,
    island: {
      ...save.island,
      mana: 5000,
      crystal: 30,
      energy: save.island.energyMax,
      summonerLevel: 10,
      summonerExp: 40,
    },
    roster: save.roster.map((m, i) =>
      i === 0 ? { ...m, level: 8, evolve: 0 } : { ...m, level: 5 },
    ),
    clearedStages: ["garen_1_1", "garen_1_2", "garen_1_3", "garen_1_4", "garen_1_5"],
  };
}

export function homeCollect(save: PlayerSave, now = Date.now()): LoopStepResult {
  let island = tickProduction(save.island, now);
  const before = island.mana;
  island = collectMana(island, "mana_pond", now);
  const gained = Math.floor(island.mana - before);
  return {
    save: { ...save, island },
    message: `진액 연못 수집: 마나 +${gained} (보유 ${Math.floor(island.mana)})`,
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
      message: "수정 광맥 해금 필요 (서머너 Lv.10)",
    };
  }
  const before = island.crystal;
  island = collectCrystal(island, "crystal_mine", now);
  const gained = island.crystal - before;
  return {
    save: { ...save, island },
    message: `수정 광맥 수집: 크리스탈 +${gained} (보유 ${island.crystal})`,
  };
}

export function runDailyWish(
  save: PlayerSave,
  now = Date.now(),
  rng: () => number = Math.random,
): LoopStepResult {
  const r = runWish(save.island, now, rng);
  return {
    save: {
      ...save,
      island: r.island,
      scrolls: save.scrolls + r.scrollGain,
    },
    message: r.message,
  };
}

/** Upgrade a production building (mana pond / crystal mine). */
export function runUpgradeBuilding(
  save: PlayerSave,
  buildingId: BuildingId = "mana_pond",
): LoopStepResult {
  const island = tickProduction(save.island);
  const r = upgradeBuilding(island, buildingId);
  return {
    save: { ...save, island: r.island },
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
    save: {
      ...save,
      gloryPoints: save.gloryPoints - cost,
      gloryLevels,
      island,
    },
    message: `영광: ${def.nameKo} Lv.${nextLv} (−영광 ${cost}) · ${def.effectKo}`,
  };
}

export const FUSION_MANA_COST = 800;
export const ENERGY_CRYSTAL_COST = 10;
export const ENERGY_BUY_AMOUNT = 20;
/** 제작소: 진문석 + 마나 → 소환서 */
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
      message: "융합의 별 해금 필요 (서머너 Lv.17)",
    };
  }
  const a = resolveOwned(save, refA);
  const b = resolveOwned(save, refB);
  if (!a || !b) return { save, message: "융합 재료 몬스터를 찾을 수 없음" };
  if (a.uid === b.uid) return { save, message: "같은 몬스터는 융합할 수 없음" };
  if (a.monsterId !== b.monsterId) {
    return { save, message: "동일 종만 융합 가능 (스텁)" };
  }
  if (island.mana < FUSION_MANA_COST) {
    return {
      save: { ...save, island },
      message: `마나 부족 (필요 ${FUSION_MANA_COST}, 보유 ${Math.floor(island.mana)})`,
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
    message: `융합: ${describeOwned(kept)} (−마나 ${FUSION_MANA_COST}, 재료 1소모)`,
  };
}

/** Buy energy with crystal (shop / emergency refill). */
export function runBuyEnergy(
  save: PlayerSave,
  packs = 1,
): LoopStepResult {
  const n = Math.max(1, Math.min(10, Math.floor(packs)));
  const cost = ENERGY_CRYSTAL_COST * n;
  const gain = ENERGY_BUY_AMOUNT * n;
  if (save.island.crystal < cost) {
    return {
      save,
      message: `크리스탈 부족 (필요 ${cost}, 보유 ${save.island.crystal})`,
    };
  }
  const max = save.island.energyMax ?? 100;
  const energy = Math.min(max, save.island.energy + gain);
  return {
    save: {
      ...save,
      island: {
        ...save.island,
        crystal: save.island.crystal - cost,
        energy,
      },
    },
    message: `에너지 +${Math.floor(energy - save.island.energy)} (−크리스탈 ${cost}) · 보유 ${Math.floor(energy)}/${max}`,
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
      message: "제작소 해금 필요 (서머너 Lv.19)",
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
      message: `마나 부족 (필요 ${CRAFT_SCROLL_MANA}, 보유 ${Math.floor(island.mana)})`,
    };
  }
  return {
    save: {
      ...save,
      island: { ...island, mana: island.mana - CRAFT_SCROLL_MANA },
      jinmunStones: (save.jinmunStones ?? 0) - CRAFT_SCROLL_JINMUN,
      scrolls: save.scrolls + 1,
    },
    message: `제작: 소환서 +1 (−진문석 ${CRAFT_SCROLL_JINMUN} · −마나 ${CRAFT_SCROLL_MANA})`,
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
      message: "정수 공방 해금 필요 (서머너 Lv.12)",
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
    message: `상징 판매: ${describeSymbol(sym)} · 마나 +${gain}`,
  };
}

/** Practice dojo: drill → mana/exp; every 3rd drill grants 진문석 (묘수 미션). */
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
      message: "마법진 도장 해금 필요 (서머너 Lv.8)",
    };
  }
  const manaGain = 120 + island.summonerLevel * 8;
  island = { ...island, mana: island.mana + manaGain };
  const leveled = addSummonerExp(island, 15);
  const dojoDrills = (save.dojoDrills ?? 0) + 1;
  let jinmunStones = save.jinmunStones ?? 0;
  let missionNote = "";
  if (dojoDrills % 3 === 0) {
    jinmunStones += 1;
    missionNote = " · 묘수 미션 클리어 진문석 +1";
  }
  return {
    save: {
      ...save,
      island: leveled.island,
      dojoDrills,
      jinmunStones,
    },
    message: `도장 수련: 마나 +${manaGain} · EXP +15 · 수련 ${dojoDrills}회${
      leveled.levelsGained > 0
        ? ` · 서머너 Lv.${leveled.island.summonerLevel}`
        : ""
    }${missionNote}`,
  };
}

/** Join or rename local guild (non-realtime stub). */
export function runJoinGuild(
  save: PlayerSave,
  name: string,
): LoopStepResult {
  let island = syncBuildingUnlocks(tickProduction(save.island));
  if (
    !island.buildings.some((b) => b.id === "guild_hall") &&
    island.summonerLevel < 12
  ) {
    return {
      save: { ...save, island },
      message: "길드 홀 해금 필요 (서머너 Lv.12)",
    };
  }
  const trimmed = name.trim().slice(0, 16);
  if (!trimmed) {
    return { save: { ...save, island }, message: "길드 이름을 입력하세요" };
  }
  return {
    save: { ...save, island, guildName: trimmed },
    message: `길드 가입: ${trimmed}`,
  };
}

/** Daily guild check-in → glory + contribution. */
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
      message: "길드 홀 해금 필요 (서머너 Lv.12)",
    };
  }
  if (!save.guildName) {
    return {
      save: { ...save, island },
      message: "먼저 길드에 가입하세요",
    };
  }
  const day = new Date(now).toISOString().slice(0, 10);
  if (save.guildCheckInDay === day) {
    return {
      save: { ...save, island },
      message: `오늘 이미 출석했습니다 (${save.guildName})`,
    };
  }
  const gloryGain = 8;
  const contribGain = 15;
  return {
    save: {
      ...save,
      island,
      guildCheckInDay: day,
      gloryPoints: (save.gloryPoints ?? 0) + gloryGain,
      guildContribution: (save.guildContribution ?? 0) + contribGain,
    },
    message: `길드 출석 (${save.guildName}): 영광 +${gloryGain} · 기여 +${contribGain}`,
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
  const gear = normalizeSummonerGear(save.gear);
  const leader = (gearLeaderAtkPct(gear) * 100).toFixed(1);
  const sets = summarizeGearSets(gear)
    .filter((s) => s.count > 0)
    .map(
      (s) =>
        `${s.nameKo} ${s.count}${s.active6 ? "(6)" : s.active4 ? "(4)" : s.active2 ? "(2)" : ""}`,
    )
    .join(" · ");
  return [
    `무기 ${describeGear(gear.weapon)} · 스킬+${(gear.weapon.skillPowerBonus * 100).toFixed(0)}%`,
    `로브 ${describeGear(gear.robe)} · HP+${gear.robe.summonerHpBonus} DEF+${gear.robe.summonerDefBonus}`,
    `장신구 ${describeGear(gear.accessory)} · regen+${gear.accessory.manaRegenBonus.toFixed(2)} max+${gear.accessory.manaMaxBonus}`,
    `마법구 ${describeGear(gear.orb)} · sense+${gear.orb.boardSenseBonus.toFixed(2)}`,
    `망토 ${describeGear(gear.cloak)} · HP+${gear.cloak.summonerHpBonus} 리더+${(gear.cloak.leaderAtkBonus * 100).toFixed(1)}%`,
    `반지 ${describeGear(gear.ring)} · 스킬+${(gear.ring.skillPowerBonus * 100).toFixed(0)}% 리더+${(gear.ring.leaderAtkBonus * 100).toFixed(1)}%`,
    `세트 ${sets || "없음"}`,
    `리더 합산 ATK +${leader}%`,
    `가방 ${(save.gearBag ?? []).length}/${MAX_GEAR_BAG}`,
  ];
}

export function listGearBag(save: PlayerSave): string[] {
  const bag = save.gearBag ?? [];
  if (bag.length === 0) return ["(가방 비어 있음)"];
  return bag.map(
    (p, i) =>
      `[${i}] ${describeGear(p)} · 판매 +${gearSellMana(p)} · 슬롯 ${p.slot}`,
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
      return { save, message: `몬스터 없음: ${ref}` };
    }
    if (uids.includes(owned.uid)) {
      return { save, message: "같은 몬스터를 중복 편성할 수 없습니다" };
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
export function runSummon(
  save: PlayerSave,
  rng: () => number = Math.random,
): LoopStepResult {
  if (save.scrolls < SUMMON_SCROLL_COST) {
    return {
      save,
      message: `소환서 부족 (필요 ${SUMMON_SCROLL_COST}, 보유 ${save.scrolls})`,
    };
  }
  const def = pickSummonMonster(rng);
  const owned: OwnedMonster = {
    uid: nextUid("sum"),
    monsterId: def.id,
    level: 1,
    symbolSlots: emptySymbolSlots(),
    evolve: 0,
    skillLevels: defaultSkillLevels(),
  };
  const roster = [...save.roster, owned];
  let party = [...save.party];
  if (party.length < 4) party.push(owned.uid);

  return {
    save: {
      ...save,
      scrolls: save.scrolls - SUMMON_SCROLL_COST,
      roster,
      party,
    },
    message: `소환 성공: ${describeOwned(owned)} (소환서 ${save.scrolls - 1})`,
  };
}

/**
 * Enhance at 강화진 — spend mana, +1 level (cap MAX_MONSTER_LEVEL).
 */
export function runEnhance(
  save: PlayerSave,
  uidOrIndex: string,
): LoopStepResult {
  const owned = resolveOwned(save, uidOrIndex);
  if (!owned) {
    return { save, message: `몬스터를 찾을 수 없음: ${uidOrIndex}` };
  }
  if (owned.level >= MAX_MONSTER_LEVEL) {
    return {
      save,
      message: `${describeOwned(owned)} 이미 최대 레벨(${MAX_MONSTER_LEVEL})`,
    };
  }

  const cost = enhanceManaCost(owned.level);
  if (save.island.mana < cost) {
    return {
      save,
      message: `마나 부족 (필요 ${cost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }

  const nextLevel = owned.level + 1;
  const roster = save.roster.map((m) =>
    m.uid === owned.uid ? { ...m, level: nextLevel } : m,
  );
  const island = { ...save.island, mana: save.island.mana - cost };

  return {
    save: { ...save, island, roster },
    message: `강화: ${describeOwned({ ...owned, level: nextLevel })} (−마나 ${cost})`,
  };
}

/**
 * Evolve at 강화진 — raise evolve stage (cap MAX_EVOLVE).
 * Requires level gate + mana (+ crystal from 2nd evolve).
 */
export function runEvolve(
  save: PlayerSave,
  uidOrIndex: string,
): LoopStepResult {
  const owned = resolveOwned(save, uidOrIndex);
  if (!owned) {
    return { save, message: `몬스터를 찾을 수 없음: ${uidOrIndex}` };
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
      message: `마나 부족 (필요 ${manaCost}, 보유 ${Math.floor(save.island.mana)})`,
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
      ? `−마나 ${manaCost} · −크리스탈 ${crystalCost}`
      : `−마나 ${manaCost}`;

  return {
    save: { ...save, island, roster },
    message: `진화: ${describeOwned({ ...owned, evolve: nextEvo })} (${costNote})`,
  };
}

/**
 * Skill-up at 강화진 — raise one of S1/S2/S3 (cap MAX_SKILL_LEVEL).
 */
export function runSkillUp(
  save: PlayerSave,
  uidOrIndex: string,
  skillIndex: number,
): LoopStepResult {
  const owned = resolveOwned(save, uidOrIndex);
  if (!owned) {
    return { save, message: `몬스터를 찾을 수 없음: ${uidOrIndex}` };
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
      message: `마나 부족 (필요 ${cost}, 보유 ${Math.floor(save.island.mana)})`,
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
    save: { ...save, island, roster },
    message: `스킬업: ${describeOwned(updated)} · ${skillName} → Lv.${nextLevels[idx]} (−마나 ${cost})`,
  };
}

export function runEnhanceGear(
  save: PlayerSave,
  slot: GearSlot,
): LoopStepResult {
  const gearNorm = normalizeSummonerGear(save.gear);
  const piece = gearNorm[slot];
  if (piece.enhance >= MAX_GEAR_ENHANCE) {
    return {
      save: { ...save, gear: gearNorm },
      message: `${describeGear(piece)} 이미 최대(+${MAX_GEAR_ENHANCE})`,
    };
  }
  const cost = gearEnhanceManaCost(piece.enhance);
  const crystalCost = gearEnhanceCrystalCost(piece.enhance);
  if (save.island.mana < cost) {
    return {
      save: { ...save, gear: gearNorm },
      message: `마나 부족 (필요 ${cost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  if ((save.island.crystal ?? 0) < crystalCost) {
    return {
      save: { ...save, gear: gearNorm },
      message: `크리스탈 부족 (필요 ${crystalCost}, 보유 ${save.island.crystal ?? 0})`,
    };
  }
  const next = bumpGearEnhance(piece);
  const gear = { ...gearNorm, [slot]: next };
  const island = {
    ...save.island,
    mana: save.island.mana - cost,
    crystal: (save.island.crystal ?? 0) - crystalCost,
  };
  const costNote =
    crystalCost > 0
      ? `−마나 ${cost} · −크리스탈 ${crystalCost}`
      : `−마나 ${cost}`;
  return {
    save: { ...save, island, gear },
    message: `장비 강화: ${describeGear(next)} (${costNote})`,
  };
}

/** Re-affix a gear piece to another shallow set. */
export function runAffixGearSet(
  save: PlayerSave,
  slot: GearSlot,
  setId: GearSetId,
): LoopStepResult {
  const gearNorm = normalizeSummonerGear(save.gear);
  const piece = gearNorm[slot];
  if (piece.setId === setId) {
    return {
      save: { ...save, gear: gearNorm },
      message: `${describeGear(piece)} 이미 ${getGearSet(setId)?.nameKo ?? setId} 세트`,
    };
  }
  if (save.island.mana < GEAR_SET_AFFIX_MANA) {
    return {
      save: { ...save, gear: gearNorm },
      message: `마나 부족 (필요 ${GEAR_SET_AFFIX_MANA}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  const next = { ...piece, setId };
  const gear = { ...gearNorm, [slot]: next };
  const island = {
    ...save.island,
    mana: save.island.mana - GEAR_SET_AFFIX_MANA,
  };
  const active = summarizeGearSets(gear)
    .filter((s) => s.active2)
    .map(
      (s) =>
        `${s.nameKo}${s.active6 ? "6" : s.active4 ? "4" : "2"}`,
    )
    .join("·");
  return {
    save: { ...save, island, gear },
    message: `세트 부여: ${describeGear(next)} (−마나 ${GEAR_SET_AFFIX_MANA})${active ? ` · 활성 ${active}` : ""}`,
  };
}

/** Equip a bag piece onto its slot; displaced piece returns to the bag. */
export function runEquipGearBag(
  save: PlayerSave,
  bagIndex: number,
): LoopStepResult {
  const bag = [...(save.gearBag ?? [])];
  const piece = bag[bagIndex];
  if (!piece) {
    return { save, message: `가방 인덱스 없음: ${bagIndex}` };
  }
  const gearNorm = normalizeSummonerGear(save.gear);
  const displaced = gearNorm[piece.slot];
  bag.splice(bagIndex, 1);
  bag.push(displaced);
  const gear = { ...gearNorm, [piece.slot]: piece };
  return {
    save: { ...save, gear, gearBag: bag },
    message: `장비 장착: ${describeGear(piece)} · 해제 ${describeGear(displaced)} → 가방`,
  };
}

/** Sell a bag piece for mana. */
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
  bag.splice(bagIndex, 1);
  const island = { ...save.island, mana: save.island.mana + gain };
  return {
    save: { ...save, island, gearBag: bag },
    message: `장비 판매: ${describeGear(piece)} (+마나 ${gain})`,
  };
}

/** Summoner awaken/transcend stub: permanent mana/skill/leader bonuses. */
export function runAwakenSummoner(save: PlayerSave): LoopStepResult {
  const cur = save.summonerAwaken ?? 0;
  if (cur >= MAX_SUMMONER_AWAKEN) {
    return {
      save,
      message: `서머너 각성 이미 최대(+${MAX_SUMMONER_AWAKEN})`,
    };
  }
  const needLv = awakenMinLevel(cur);
  if (save.island.summonerLevel < needLv) {
    return {
      save,
      message: `각성 해금: 서머너 Lv.${needLv}+ 필요 (현재 ${save.island.summonerLevel})`,
    };
  }
  const manaCost = awakenManaCost(cur);
  const crystalCost = awakenCrystalCost(cur);
  if (save.island.mana < manaCost) {
    return {
      save,
      message: `마나 부족 (필요 ${manaCost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  if (save.island.crystal < crystalCost) {
    return {
      save,
      message: `크리스탈 부족 (필요 ${crystalCost}, 보유 ${save.island.crystal})`,
    };
  }
  const next = cur + 1;
  return {
    save: {
      ...save,
      summonerAwaken: next,
      island: {
        ...save.island,
        mana: save.island.mana - manaCost,
        crystal: save.island.crystal - crystalCost,
      },
    },
    message: `서머너 각성 +${next} (−마나 ${manaCost} · −크리스탈 ${crystalCost}) · 리더 공+${(awakenLeaderAtkPct(next) * 100).toFixed(1)}%`,
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
      message: `마나 부족 (필요 ${node.manaCost}, 보유 ${Math.floor(save.island.mana)})`,
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
    message: `스킬 트리: ${node.nameKo} 해금 (−마나 ${node.manaCost}${node.crystalCost > 0 ? ` · −크리스탈 ${node.crystalCost}` : ""})`,
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
      message: `마나 부족 (필요 ${cost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  const next = bumpSymbolEnhance(sym);
  const symbols = save.symbols.map((s) => (s.id === sym.id ? next : s));
  const island = { ...save.island, mana: save.island.mana - cost };
  return {
    save: { ...save, island, symbols },
    message: `상징 강화: ${describeSymbol(next)} (−마나 ${cost})`,
  };
}

/** Buy summon scrolls at magic shop stub (mana). */
export function runBuyScroll(
  save: PlayerSave,
  count = 1,
): LoopStepResult {
  const n = Math.max(1, Math.min(20, Math.floor(count)));
  const cost = SCROLL_BUY_MANA_COST * n;
  if (save.island.mana < cost) {
    return {
      save,
      message: `마나 부족 (필요 ${cost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  const island = { ...save.island, mana: save.island.mana - cost };
  const scrolls = save.scrolls + n;
  return {
    save: { ...save, island, scrolls },
    message: `상점: 소환서 ${n}장 구매 (−마나 ${cost}) · 보유 ${scrolls}`,
  };
}

/**
 * Imprint (각인 스텁): re-roll main option on slots 4–6 for crystal.
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
      message: `${describeSymbol(sym)} 슬롯${sym.slot}은 각인 불가 (4–6만)`,
    };
  }
  if (save.island.crystal < SYMBOL_IMPRINT_CRYSTAL_COST) {
    return {
      save,
      message: `크리스탈 부족 (필요 ${SYMBOL_IMPRINT_CRYSTAL_COST}, 보유 ${save.island.crystal})`,
    };
  }
  const next = imprintSymbolMain(sym, rng);
  if (!next) {
    return { save, message: "각인 실패" };
  }
  const symbols = save.symbols.map((s) => (s.id === sym.id ? next : s));
  const island = {
    ...save.island,
    crystal: save.island.crystal - SYMBOL_IMPRINT_CRYSTAL_COST,
  };
  return {
    save: { ...save, island, symbols },
    message: `각인: ${describeSymbol(sym)} → ${describeSymbol(next)} (−크리스탈 ${SYMBOL_IMPRINT_CRYSTAL_COST})`,
  };
}

/**
 * Grind (연마 스텁): apply / re-roll flat prefix that does not scale with enhance.
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
  if (save.island.mana < SYMBOL_GRIND_MANA_COST) {
    return {
      save,
      message: `마나 부족 (필요 ${SYMBOL_GRIND_MANA_COST}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  const next = grindSymbolPrefix(sym, rng);
  if (!next) {
    return { save, message: "연마 실패" };
  }
  const symbols = save.symbols.map((s) => (s.id === sym.id ? next : s));
  const island = {
    ...save.island,
    mana: save.island.mana - SYMBOL_GRIND_MANA_COST,
  };
  return {
    save: { ...save, island, symbols },
    message: `연마: ${describeSymbol(sym)} → ${describeSymbol(next)} (−마나 ${SYMBOL_GRIND_MANA_COST})`,
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
  if (!owned) return { save, message: `몬스터 없음: ${monsterRef}` };
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
  if (!owned) return { save, message: `몬스터 없음: ${monsterRef}` };
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
  const base = scaledMonsterStats(m, owned.level, owned.evolve ?? 0);
  const equipped = equippedSymbols(save, owned);
  const final = applySymbolsToStats(base, equipped);
  const sets = summarizeSymbolSets(equipped);
  return { base, final, sets };
}

export function createStageBattle(
  stage: StageDef,
  save?: PlayerSave,
  opts?: { banEnemyIds?: string[]; rng?: () => number },
): Battle {
  const gear = normalizeSummonerGear(save?.gear ?? createStarterGear());
  const allyMonsters: Unit[] = [];
  if (save?.party.length) {
    for (const uid of save.party.slice(0, 4)) {
      const owned = save.roster.find((m) => m.uid === uid);
      if (owned) allyMonsters.push(unitFromOwned(save, owned, "ally"));
    }
  }
  if (allyMonsters.length === 0) {
    const fallback = ["fire_fang", "dew_healer", "gale_scout", "seal_scholar"];
    allyMonsters.push(
      ...fallback.map((id, i) => unitFromMonsterId(id, "ally", `a-${i}`)),
    );
  }

  const lvl = save?.island.summonerLevel ?? 1;
  const awaken = save?.summonerAwaken ?? 0;
  const treeIds = save?.skillTree ?? [];
  const tree = skillTreeBonuses(treeIds);
  const robeHp =
    (gear.robe.summonerHpBonus ?? 0) +
    (gear.cloak.summonerHpBonus ?? 0) +
    gearSetBonuses(gear).summonerHpBonus +
    tree.summonerHpBonus;
  const robeDef =
    (gear.robe.summonerDefBonus ?? 0) +
    (gear.cloak.summonerDefBonus ?? 0) +
    gearSetBonuses(gear).summonerDefBonus;
  const leaderPct =
    awakenLeaderAtkPct(awaken) +
    gearLeaderAtkPct(gear) +
    tree.leaderAtkBonus;
  if (leaderPct > 0) {
    for (const u of allyMonsters) {
      u.stats = {
        ...u.stats,
        atk: Math.round(u.stats.atk * (1 + leaderPct)),
        hp: Math.round(u.stats.hp * (1 + leaderPct * 0.5)),
      };
      u.hp = u.stats.hp;
    }
  }
  const allySummonerUnit = makeUnit({
    id: "a-sum",
    name: `서머너 Lv.${lvl}${awaken > 0 ? ` · 각성${awaken}` : ""}`,
    team: "ally",
    kind: "summoner",
    element: "light",
    stats: {
      hp:
        500 +
        lvl * 20 +
        gear.accessory.manaMaxBonus * 2 +
        robeHp +
        awaken * 30,
      atk: 85 + lvl * 3,
      def:
        42 +
        Math.floor(gear.accessory.enhance) +
        Math.floor(lvl / 2) +
        robeDef +
        awaken * 3,
      spd: 98 + Math.floor(lvl / 5),
      critRate: 15,
      critDmg: 50,
    },
    skillCoeff: 1,
  });

  const banSet = new Set(
    (opts?.banEnemyIds ?? save?.arenaBanIds ?? []).filter(Boolean),
  );
  let enemyIds = stage.enemyMonsterIds;
  if (stage.mode === "world_arena" && banSet.size > 0) {
    const filtered = enemyIds.filter((id) => !banSet.has(id));
    enemyIds = filtered.length > 0 ? filtered : enemyIds.slice(0, 1);
  }

  const enemyMonsters = enemyIds.map((id, i) =>
    unitFromMonsterId(id, "enemy", `e-w1-${i}`, 1 + Math.floor(stage.stage / 2)),
  );

  const enemyUnits: Unit[] = [
    makeUnit({
      id: "e-sum",
      name: "적 서머너",
      team: "enemy",
      kind: "summoner",
      element: "dark",
      stats: { hp: 480, atk: 80, def: 42, spd: 88, critRate: 12, critDmg: 50 },
      skillCoeff: 1,
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

  return new Battle({
    boardSize: stage.boardSize,
    units: [...allyUnits, ...enemyUnits],
    allySummoner: buildSummonerState("a-sum", gear, false, awaken, treeIds),
    enemySummoner: buildSummonerState(
      "e-sum",
      createStarterGear(),
      enemyProfile.weakBoard,
      enemyProfile.awaken,
      enemyProfile.skillTree,
    ),
    powerGapAmplifyCap: powerGapCap,
    totalWaves,
    modules,
    rng: opts?.rng,
    spawnWave: (wave) =>
      enemyIds.map((id, i) =>
        unitFromMonsterId(
          id,
          "enemy",
          `e-w${wave}-${i}`,
          1 + Math.floor(stage.stage / 2) + (wave - 1),
        ),
      ),
  });
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

export function applyRewards(
  save: PlayerSave,
  stage: StageDef,
  victory: boolean,
  rng: () => number = Math.random,
): { save: PlayerSave; reward: BattleReward } {
  if (!victory) {
    return {
      save,
      reward: { mana: 0, expNote: "패배 — 보상 없음", victory: false },
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
  let crystalGain = 1 + Math.floor(stage.stage / 2);
  if (stage.mode === "weekday") crystalGain += 3;
  if (stage.mode === "depth") crystalGain += 1;
  if (stage.mode === "equip") crystalGain += 4;
  const gloryGain = stage.gloryReward ?? 0;
  const jinmunGain = stage.jinmunReward ?? 0;
  const dropChance = stage.dropChance ?? 0.65;
  const expGain = expForStage(stage);

  let island = {
    ...save.island,
    mana: save.island.mana + manaGain,
    crystal: save.island.crystal + crystalGain,
  };
  const leveled = addSummonerExp(island, expGain);
  island = leveled.island;

  const symbols = [...save.symbols];
  let symbol: SymbolInstance | undefined;
  if (rng() < dropChance) {
    symbol = rollSymbolDrop(
      rng,
      `drop_${stage.id}_${symbols.length}`,
      stage.dropSetId,
    );
    symbols.push(symbol);
  }

  let gear = normalizeSummonerGear(save.gear);
  let gearBag = [...(save.gearBag ?? [])];
  let gearDrop: GearPiece | undefined;
  let bagSoldNote = "";
  if (stage.mode === "equip") {
    const gearChance = stage.gearDropChance ?? 0.75;
    if (rng() < gearChance) {
      gearDrop = rollGearDrop(rng, `equip_${stage.id}`);
      if (stage.stage >= 2 && gearDrop.enhance < MAX_GEAR_ENHANCE) {
        gearDrop = bumpGearEnhance(gearDrop);
      }
      if (gearBag.length >= MAX_GEAR_BAG) {
        const sold = gearBag.shift()!;
        const gain = gearSellMana(sold);
        island = { ...island, mana: island.mana + gain };
        bagSoldNote = ` · 가방초과 판매 ${describeGear(sold)}(+${gain})`;
      }
      gearBag.push(gearDrop);
    }
  }

  let scrolls = save.scrolls;
  if (rng() < (stage.mode === "weekday" ? 0.55 : 0.4)) scrolls += 1;

  const cleared = save.clearedStages.includes(stage.id)
    ? save.clearedStages
    : [...save.clearedStages, stage.id];

  const gloryPoints = (save.gloryPoints ?? 0) + gloryGain;
  const jinmunStones = (save.jinmunStones ?? 0) + jinmunGain;

  let contributionGain = 0;
  let guildContribution = save.guildContribution ?? 0;
  let guildRaidBest = save.guildRaidBest ?? 0;
  if (stage.mode === "guild_raid") {
    contributionGain = 40 + jinmunGain * 5 + gloryGain * 2;
    guildContribution += contributionGain;
    guildRaidBest = Math.max(guildRaidBest, contributionGain);
  }

  let arenaSeasonWins = save.arenaSeasonWins ?? 0;
  if (stage.mode === "world_arena") {
    arenaSeasonWins += 1;
  }

  const extras: string[] = [
    `EXP +${expGain}`,
    `크리스탈 +${crystalGain}`,
  ];
  if (gloryGain > 0) extras.push(`영광 +${gloryGain}`);
  if (jinmunGain > 0) extras.push(`진문석 +${jinmunGain}`);
  if (contributionGain > 0) extras.push(`기여도 +${contributionGain}`);
  if (stage.mode === "world_arena") extras.push(`시즌승 ${arenaSeasonWins}`);
  if (gearDrop) extras.push(`장비 ${describeGear(gearDrop)} → 가방`);
  const levelNote =
    leveled.levelsGained > 0
      ? ` · 서머너 Lv.${island.summonerLevel}(+${leveled.levelsGained})`
      : "";

  return {
    save: {
      ...save,
      island,
      symbols,
      gear,
      gearBag,
      clearedStages: cleared,
      scrolls,
      gloryPoints,
      jinmunStones,
      gloryLevels: save.gloryLevels ?? {},
      arenaBanIds: save.arenaBanIds ?? [],
      arenaSeasonWins,
      guildContribution,
      dojoDrills: save.dojoDrills ?? 0,
      guildName: save.guildName ?? null,
      guildCheckInDay: save.guildCheckInDay ?? null,
      guildRaidBest,
      seasonRewardsClaimed: save.seasonRewardsClaimed ?? 0,
      summonerAwaken: save.summonerAwaken ?? 0,
      skillTree: save.skillTree ?? [],
    },
    reward: {
      mana: manaGain,
      crystal: crystalGain,
      glory: gloryGain || undefined,
      jinmun: jinmunGain || undefined,
      contribution: contributionGain || undefined,
      expNote: `${stage.nameKo} 클리어 · ${extras.join(" · ")}${bagSoldNote}${levelNote}`,
      symbol,
      gear: gearDrop,
      victory: true,
      summonerExp: expGain,
      levelsGained: leveled.levelsGained,
    },
  };
}

/**
 * Full loop step: spend energy → fight → reward.
 */
export function runSortie(
  save: PlayerSave,
  stageId: string,
  opts?: { maxTurns?: number; rng?: () => number; banEnemyIds?: string[] },
): LoopStepResult {
  const stage = getStage(stageId);
  if (!stage) {
    return { save, message: `알 수 없는 스테이지: ${stageId}` };
  }
  const energy = Math.floor(save.island.energy);
  if (stage.energyCost > 0 && energy < stage.energyCost) {
    return {
      save,
      message: `에너지 부족 (필요 ${stage.energyCost}, 보유 ${energy})`,
    };
  }
  if (!isStageUnlocked(save, stageId)) {
    return {
      save,
      message: `콘텐츠 잠김 — 해금 조건을 확인하세요 (${stageId})`,
    };
  }

  const island = {
    ...save.island,
    energy: save.island.energy - stage.energyCost,
  };
  const mid: PlayerSave = {
    ...save,
    island,
    gloryPoints: save.gloryPoints ?? 0,
    jinmunStones: save.jinmunStones ?? 0,
    gloryLevels: save.gloryLevels ?? {},
    arenaBanIds: save.arenaBanIds ?? [],
    arenaSeasonWins: save.arenaSeasonWins ?? 0,
    guildContribution: save.guildContribution ?? 0,
    dojoDrills: save.dojoDrills ?? 0,
    guildName: save.guildName ?? null,
    guildCheckInDay: save.guildCheckInDay ?? null,
    guildRaidBest: save.guildRaidBest ?? 0,
    seasonRewardsClaimed: save.seasonRewardsClaimed ?? 0,
    summonerAwaken: save.summonerAwaken ?? 0,
    gearBag: save.gearBag ?? [],
    skillTree: save.skillTree ?? [],
  };
  const battle = createStageBattle(stage, mid, {
    banEnemyIds: opts?.banEnemyIds ?? mid.arenaBanIds,
    rng: opts?.rng,
  });
  const { victory, turns } = resolveBattleAuto(battle, opts?.maxTurns ?? 80);
  const { save: next, reward } = applyRewards(mid, stage, victory, opts?.rng);
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

  const sum = runSummon(save, rng);
  steps.push(sum);
  save = sum.save;

  const enh = runEnhance(save, "0");
  steps.push(enh);
  save = enh.save;

  const g = runEnhanceGear(save, "accessory");
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
