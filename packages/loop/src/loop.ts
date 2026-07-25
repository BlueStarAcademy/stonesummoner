import { Battle, makeUnit, type SummonerState, type Unit } from "stonesummoner-combat";
import {
  CHAPTER1_STAGES,
  createStarterHwalro,
  getMonster,
  type StageDef,
  type SymbolInstance,
} from "stonesummoner-data";
import {
  collectMana,
  createStarterIsland,
  tickProduction,
  type IslandState,
} from "stonesummoner-home";
import {
  createStarterRoster,
  describeOwned,
  enhanceManaCost,
  MAX_MONSTER_LEVEL,
  nextUid,
  pickSummonMonster,
  scaledMonsterStats,
  SUMMON_SCROLL_COST,
  type OwnedMonster,
} from "./roster.js";

export type { OwnedMonster } from "./roster.js";
export {
  describeOwned,
  enhanceManaCost,
  MAX_MONSTER_LEVEL,
  SUMMON_SCROLL_COST,
} from "./roster.js";

export interface PlayerSave {
  island: IslandState;
  symbols: SymbolInstance[];
  clearedStages: string[];
  roster: OwnedMonster[];
  /** Up to 4 owned monster uids for battle. */
  party: string[];
  scrolls: number;
}

export interface BattleReward {
  mana: number;
  expNote: string;
  symbol?: SymbolInstance;
  victory: boolean;
}

export interface LoopStepResult {
  save: PlayerSave;
  message: string;
  reward?: BattleReward;
  battleLog?: string[];
}

function summonerState(unitId: string, mana = 25): SummonerState {
  return {
    unitId,
    mana,
    manaMax: 100,
    manaRegenPerTick: 0.9,
    boardSense: 0.1,
  };
}

function unitFromOwned(owned: OwnedMonster, team: "ally" | "enemy"): Unit {
  const m = getMonster(owned.monsterId);
  if (!m) throw new Error(`Unknown monster ${owned.monsterId}`);
  const stats = scaledMonsterStats(m, owned.level);
  return makeUnit({
    id: owned.uid,
    name: `${m.nameKo} Lv.${owned.level}`,
    team,
    kind: "monster",
    element: m.element,
    stats: { ...stats },
    skillCoeff: m.skillCoeff,
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
  const stats = scaledMonsterStats(m, level);
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
  return {
    island: createStarterIsland(now),
    symbols: [],
    clearedStages: [],
    roster,
    party,
    scrolls,
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
    return `[${i}] ${inParty} ${describeOwned(m)} (${m.uid})`;
  });
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
  const byIndex = /^\d+$/.test(uidOrIndex);
  const owned = byIndex
    ? save.roster[Number(uidOrIndex)]
    : save.roster.find((m) => m.uid === uidOrIndex);

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

export function createStageBattle(
  stage: StageDef,
  save?: PlayerSave,
): Battle {
  const allyMonsters: Unit[] = [];
  if (save?.party.length) {
    for (const uid of save.party.slice(0, 4)) {
      const owned = save.roster.find((m) => m.uid === uid);
      if (owned) allyMonsters.push(unitFromOwned(owned, "ally"));
    }
  }
  if (allyMonsters.length === 0) {
    const fallback = ["fire_fang", "dew_healer", "gale_scout", "seal_scholar"];
    allyMonsters.push(
      ...fallback.map((id, i) => unitFromMonsterId(id, "ally", `a-${i}`)),
    );
  }

  const units: Unit[] = [
    makeUnit({
      id: "a-sum",
      name: "서머너",
      team: "ally",
      kind: "summoner",
      element: "light",
      stats: { hp: 520, atk: 90, def: 45, spd: 100, critRate: 15, critDmg: 50 },
      skillCoeff: 1,
    }),
    ...allyMonsters,
    makeUnit({
      id: "e-sum",
      name: "적 서머너",
      team: "enemy",
      kind: "summoner",
      element: "dark",
      stats: { hp: 480, atk: 80, def: 42, spd: 88, critRate: 12, critDmg: 50 },
      skillCoeff: 1,
    }),
    ...stage.enemyMonsterIds.map((id, i) =>
      unitFromMonsterId(id, "enemy", `e-${i}`, 1 + Math.floor(stage.stage / 2)),
    ),
  ];

  return new Battle({
    boardSize: stage.boardSize,
    units,
    allySummoner: summonerState("a-sum"),
    enemySummoner: summonerState("e-sum"),
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
  const island = {
    ...save.island,
    mana: save.island.mana + manaGain,
  };

  const symbols = [...save.symbols];
  let symbol: SymbolInstance | undefined;
  if (rng() < 0.65) {
    const slot = ([1, 2, 3, 4, 5, 6] as const)[Math.floor(rng() * 6)]!;
    symbol = createStarterHwalro(slot);
    symbol = { ...symbol, id: `drop_${stage.id}_${slot}` };
    symbols.push(symbol);
  }

  // Stage clear bonus: +1 scroll occasionally
  let scrolls = save.scrolls;
  if (rng() < 0.4) scrolls += 1;

  const cleared = save.clearedStages.includes(stage.id)
    ? save.clearedStages
    : [...save.clearedStages, stage.id];

  return {
    save: { ...save, island, symbols, clearedStages: cleared, scrolls },
    reward: {
      mana: manaGain,
      expNote: `${stage.nameKo} 클리어`,
      symbol,
      victory: true,
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
  if (save.island.energy < stage.energyCost) {
    return {
      save,
      message: `에너지 부족 (필요 ${stage.energyCost}, 보유 ${save.island.energy})`,
    };
  }

  const island = {
    ...save.island,
    energy: save.island.energy - stage.energyCost,
  };
  const mid: PlayerSave = { ...save, island };

  const battle = createStageBattle(stage, mid);
  const { victory, turns } = resolveBattleAuto(battle, opts?.maxTurns ?? 80);
  const { save: next, reward } = applyRewards(mid, stage, victory, opts?.rng);

  const dropLine = reward.symbol
    ? ` · 상징 드롭 ${reward.symbol.setId}(${reward.symbol.slot})`
    : "";

  return {
    save: next,
    reward,
    battleLog: battle.log.slice(-12),
    message: victory
      ? `승리 (${turns}턴) · 마나 +${reward.mana}${dropLine}`
      : `패배 (${turns}턴) · ${battle.finishReason ?? "timeout"}`,
  };
}

/** Scripted demo: collect → summon → enhance → clear 1-1 → collect. */
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

  const s1 = runSortie(save, "garen_1_1", { rng });
  steps.push(s1);
  save = s1.save;

  const c2 = homeCollect(save, 3_600_000 * 2);
  steps.push(c2);

  return steps;
}
