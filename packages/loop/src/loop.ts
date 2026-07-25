import {
  amplifyCapFromPowerDelta,
  Battle,
  estimateCombatPower,
  makeUnit,
  type SummonerState,
  type Unit,
} from "stonesummoner-combat";
import {
  applySymbolsToStats,
  bumpGearEnhance,
  bumpSymbolEnhance,
  CHAPTER1_STAGES,
  createStarterGear,
  createStarterHwalro,
  describeGear,
  describeSymbol,
  gearEnhanceManaCost,
  getMonster,
  MAX_GEAR_ENHANCE,
  MAX_SYMBOL_ENHANCE,
  rollSymbolDrop,
  symbolEnhanceManaCost,
  type GearSlot,
  type StageDef,
  type SummonerGear,
  type SymbolInstance,
} from "stonesummoner-data";
import {
  addSummonerExp,
  collectMana,
  createStarterIsland,
  tickProduction,
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
  nextUid,
  pickSummonMonster,
  scaledMonsterStats,
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
}

export interface BattleReward {
  mana: number;
  expNote: string;
  symbol?: SymbolInstance;
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

function buildSummonerState(
  unitId: string,
  gear: SummonerGear,
  weakBoard = false,
): SummonerState {
  const regen =
    0.85 +
    gear.accessory.manaRegenBonus +
    gear.orb.manaRegenBonus;
  const manaMax =
    100 + gear.accessory.manaMaxBonus + gear.orb.manaMaxBonus;
  const boardSense = weakBoard
    ? 0.02
    : 0.05 + gear.accessory.boardSenseBonus + gear.orb.boardSenseBonus;
  const startPct =
    0.2 + gear.accessory.startManaPct + gear.orb.startManaPct;
  return {
    unitId,
    mana: Math.min(manaMax, manaMax * startPct),
    manaMax,
    manaRegenPerTick: regen,
    boardSense,
  };
}

function unitFromOwned(
  save: PlayerSave,
  owned: OwnedMonster,
  team: "ally" | "enemy",
): Unit {
  const m = getMonster(owned.monsterId);
  if (!m) throw new Error(`Unknown monster ${owned.monsterId}`);
  const base = scaledMonsterStats(m, owned.level, owned.evolve ?? 0);
  const stats = applySymbolsToStats(base, equippedSymbols(save, owned));
  const evoTag = (owned.evolve ?? 0) > 0 ? ` E${owned.evolve}` : "";
  return makeUnit({
    id: owned.uid,
    name: `${m.nameKo} Lv.${owned.level}${evoTag}`,
    team,
    kind: "monster",
    element: m.element,
    stats: { ...stats },
    skillCoeff: m.skillCoeff + (owned.evolve ?? 0) * 0.05,
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

export function listStages(): StageDef[] {
  return CHAPTER1_STAGES;
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
  return [
    `장신구 ${describeGear(save.gear.accessory)} · regen+${save.gear.accessory.manaRegenBonus.toFixed(2)} max+${save.gear.accessory.manaMaxBonus}`,
    `마법구 ${describeGear(save.gear.orb)} · sense+${save.gear.orb.boardSenseBonus.toFixed(2)}`,
  ];
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

export function runEnhanceGear(
  save: PlayerSave,
  slot: GearSlot,
): LoopStepResult {
  const piece = save.gear[slot];
  if (piece.enhance >= MAX_GEAR_ENHANCE) {
    return {
      save,
      message: `${describeGear(piece)} 이미 최대(+${MAX_GEAR_ENHANCE})`,
    };
  }
  const cost = gearEnhanceManaCost(piece.enhance);
  if (save.island.mana < cost) {
    return {
      save,
      message: `마나 부족 (필요 ${cost}, 보유 ${Math.floor(save.island.mana)})`,
    };
  }
  const next = bumpGearEnhance(piece);
  const gear = { ...save.gear, [slot]: next };
  const island = { ...save.island, mana: save.island.mana - cost };
  return {
    save: { ...save, island, gear },
    message: `장비 강화: ${describeGear(next)} (−마나 ${cost})`,
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

export function createStageBattle(
  stage: StageDef,
  save?: PlayerSave,
): Battle {
  const gear = save?.gear ?? createStarterGear();
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
  const allySummonerUnit = makeUnit({
    id: "a-sum",
    name: `서머너 Lv.${lvl}`,
    team: "ally",
    kind: "summoner",
    element: "light",
    stats: {
      hp: 500 + lvl * 20 + gear.accessory.manaMaxBonus * 2,
      atk: 85 + lvl * 3,
      def: 42 + Math.floor(gear.accessory.enhance) + Math.floor(lvl / 2),
      spd: 98 + Math.floor(lvl / 5),
      critRate: 15,
      critDmg: 50,
    },
    skillCoeff: 1,
  });

  const enemyMonsters = stage.enemyMonsterIds.map((id, i) =>
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

  return new Battle({
    boardSize: stage.boardSize,
    units: [...allyUnits, ...enemyUnits],
    allySummoner: buildSummonerState("a-sum", gear, false),
    enemySummoner: buildSummonerState(
      "e-sum",
      createStarterGear(),
      true,
    ),
    powerGapAmplifyCap: powerGapCap,
    totalWaves,
    spawnWave: (wave) =>
      stage.enemyMonsterIds.map((id, i) =>
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

  const manaGain = 180 + stage.stage * 60;
  const expGain = expForStage(stage);
  let island = {
    ...save.island,
    mana: save.island.mana + manaGain,
  };
  const leveled = addSummonerExp(island, expGain);
  island = leveled.island;

  const symbols = [...save.symbols];
  let symbol: SymbolInstance | undefined;
  if (rng() < 0.65) {
    symbol = rollSymbolDrop(rng, `drop_${stage.id}_${symbols.length}`);
    symbols.push(symbol);
  }

  let scrolls = save.scrolls;
  if (rng() < 0.4) scrolls += 1;

  const cleared = save.clearedStages.includes(stage.id)
    ? save.clearedStages
    : [...save.clearedStages, stage.id];

  const levelNote =
    leveled.levelsGained > 0
      ? ` · 서머너 Lv.${island.summonerLevel}(+${leveled.levelsGained})`
      : "";

  return {
    save: { ...save, island, symbols, clearedStages: cleared, scrolls },
    reward: {
      mana: manaGain,
      expNote: `${stage.nameKo} 클리어 · EXP +${expGain}${levelNote}`,
      symbol,
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
  opts?: { maxTurns?: number; rng?: () => number },
): LoopStepResult {
  const stage = CHAPTER1_STAGES.find((s) => s.id === stageId);
  if (!stage) {
    return { save, message: `알 수 없는 스테이지: ${stageId}` };
  }
  const energy = Math.floor(save.island.energy);
  if (energy < stage.energyCost) {
    return {
      save,
      message: `에너지 부족 (필요 ${stage.energyCost}, 보유 ${energy})`,
    };
  }
  if (!isStageUnlocked(save, stageId)) {
    return {
      save,
      message: `스테이지 잠김 — 이전 스테이지를 클리어하세요 (${stageId})`,
    };
  }

  const island = {
    ...save.island,
    energy: energy - stage.energyCost,
    energyUpdatedAt: Date.now(),
  };
  const mid: PlayerSave = { ...save, island };

  const battle = createStageBattle(stage, mid);
  const { victory, turns } = resolveBattleAuto(battle, opts?.maxTurns ?? 140);
  const { save: next, reward } = applyRewards(mid, stage, victory, opts?.rng);

  const dropLine = reward.symbol
    ? ` · 상징 드롭 ${reward.symbol.setId}(${reward.symbol.slot})`
    : "";
  const expLine = reward.summonerExp
    ? ` · EXP +${reward.summonerExp}`
    : "";

  return {
    save: next,
    reward,
    battleLog: battle.log.slice(-12),
    message: victory
      ? `승리 (${turns}턴) · 마나 +${reward.mana}${dropLine}${expLine}`
      : `패배 (${turns}턴) · ${battle.finishReason ?? "timeout"}`,
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
