import {
  ALL_STAGES,
  ARENA_STAGES,
  CAIROS_DRAGON_STAGES,
  CAIROS_GIANT_STAGES,
  CAIROS_NECRO_STAGES,
  CHALLENGE_TOWER_STAGES,
  EQUIP_STAGES,
  MAIN_QUEST_AREA_COUNT,
  MAIN_QUEST_STAGES,
  TRIAL_STAGES,
  WEEKDAY_STAGES,
  WORLD_ARENA_STAGES,
  getStage,
  isWeekdayStageOpenToday,
  stagesForMap,
  type StageDef,
} from "stonesummoner-data";
import {
  isChallengeTowerContentUnlocked,
  isChallengeTowerStageCleared,
  isChallengeTowerStageUnlocked,
} from "./challengeTower.js";
import type { PlayerSave } from "./loop.js";

export type ScenarioDifficulty = "normal" | "hard" | "hell";

/**
 * Summoners War mid/late scenario XP ratios (e.g. Faimon / Aiden):
 * Normal : Hard : Hell ≈ 1 : 1.7 : 3.5.
 * Early-map player XP (Garen ~1 : 7 : 15) is an outlier — do not use it.
 */
export const SCENARIO_DIFF_EXP_MUL: Record<ScenarioDifficulty, number> = {
  normal: 1,
  hard: 1.7,
  hell: 3.5,
};

/** SW scenario energy costs are 3 / 4 / 5 → relative to Normal. */
export const SCENARIO_DIFF_ENERGY_MUL: Record<ScenarioDifficulty, number> = {
  normal: 1,
  hard: 4 / 3,
  hell: 5 / 3,
};

/** Enemy level bonus vs Normal (SW mid-map ≈ +5 Hard, +10 Hell). */
export const SCENARIO_DIFF_ENEMY_LEVEL_BONUS: Record<
  ScenarioDifficulty,
  number
> = {
  normal: 0,
  hard: 5,
  hell: 10,
};

/**
 * Extra combat stat mul on top of level.
 * Normal stays a softer story clear; Hell is clearly tougher than Hard.
 */
export const SCENARIO_DIFF_ENEMY_STAT_MUL: Record<ScenarioDifficulty, number> =
  {
    normal: 0.85,
    hard: 1.15,
    hell: 1.5,
  };

export function scenarioDiffExpMul(difficulty: ScenarioDifficulty): number {
  return SCENARIO_DIFF_EXP_MUL[difficulty];
}

export function scenarioDiffEnergyMul(difficulty: ScenarioDifficulty): number {
  return SCENARIO_DIFF_ENERGY_MUL[difficulty];
}

export function scenarioDiffEnemyLevelBonus(
  difficulty: ScenarioDifficulty,
): number {
  return SCENARIO_DIFF_ENEMY_LEVEL_BONUS[difficulty];
}

export function scenarioDiffEnemyStatMul(
  difficulty: ScenarioDifficulty,
): number {
  return SCENARIO_DIFF_ENEMY_STAT_MUL[difficulty];
}

function clearedForDifficulty(
  save: PlayerSave,
  difficulty: ScenarioDifficulty,
): string[] {
  if (difficulty === "hard") return save.clearedHardStages ?? [];
  if (difficulty === "hell") return save.clearedHellStages ?? [];
  return save.clearedStages;
}

function chainUnlocked(
  save: PlayerSave,
  stages: StageDef[],
  stageId: string,
): boolean {
  const idx = stages.findIndex((s) => s.id === stageId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  return save.clearedStages.includes(stages[idx - 1]!.id);
}

function chainUnlockedOnClears(
  cleared: string[],
  stages: StageDef[],
  stageId: string,
): boolean {
  const idx = stages.findIndex((s) => s.id === stageId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  return cleared.includes(stages[idx - 1]!.id);
}

function mapBossId(map: number): string | undefined {
  const stages = stagesForMap(map);
  return stages[stages.length - 1]?.id;
}

function chapter2Cleared(save: PlayerSave): boolean {
  const boss = mapBossId(2);
  return boss ? save.clearedStages.includes(boss) : false;
}

function cairosChainFor(stageId: string): StageDef[] | null {
  if (stageId.startsWith("giant_")) return CAIROS_GIANT_STAGES;
  if (stageId.startsWith("dragon_")) return CAIROS_DRAGON_STAGES;
  if (stageId.startsWith("necro_")) return CAIROS_NECRO_STAGES;
  return null;
}

function awakenChainFor(stageId: string): StageDef[] | null {
  const match = stageId.match(
    /^weekday_awaken_(fire|water|wind|light|dark)_b\d+$/,
  );
  if (!match) return null;
  const prefix = `weekday_awaken_${match[1]}_`;
  return WEEKDAY_STAGES.filter((stage) => stage.id.startsWith(prefix));
}

/** Linear floor/stage list used by the result-screen "next" button. */
export function stageProgressionChain(stage: StageDef): StageDef[] | null {
  switch (stage.mode) {
    case "scenario":
      return MAIN_QUEST_STAGES;
    case "depth":
      return cairosChainFor(stage.id);
    case "trial":
      return TRIAL_STAGES;
    case "challenge_tower":
      return CHALLENGE_TOWER_STAGES;
    case "equip":
      return EQUIP_STAGES;
    case "weekday":
      return awakenChainFor(stage.id);
    case "world_arena":
      return WORLD_ARENA_STAGES;
    case "arena":
      return ARENA_STAGES;
    default:
      return null;
  }
}

/** Next unlocked stage in the same chain, or null at the end / if still locked. */
export function nextStageInProgression(
  save: PlayerSave,
  stage: StageDef,
  difficulty: ScenarioDifficulty = "normal",
): StageDef | null {
  const chain = stageProgressionChain(stage);
  if (!chain) return null;
  const index = chain.findIndex((candidate) => candidate.id === stage.id);
  if (index < 0) return null;
  const next = chain[index + 1] ?? null;
  return next && isStageUnlockedForDifficulty(save, next.id, difficulty)
    ? next
    : null;
}

/** Whether a stage was cleared on the given scenario difficulty track. */
export function isStageClearedOnDifficulty(
  save: PlayerSave,
  stageId: string,
  difficulty: ScenarioDifficulty,
): boolean {
  const stage = getStage(stageId);
  if (stage?.mode === "challenge_tower") {
    return isChallengeTowerStageCleared(save, stageId);
  }
  return clearedForDifficulty(save, difficulty).includes(stageId);
}

/** Hard/Hell for a scenario map open only after every stage on that map is cleared. */
export function isDifficultyOpen(
  save: PlayerSave,
  stage: StageDef,
  difficulty: ScenarioDifficulty,
): boolean {
  if (difficulty === "normal") return true;
  if (stage.mode === "scenario") {
    const mapStages = stagesForMap(stage.map);
    if (!mapStages.length) return false;
    if (difficulty === "hard") {
      return mapStages.every((s) => save.clearedStages.includes(s.id));
    }
    return mapStages.every((s) =>
      (save.clearedHardStages ?? []).includes(s.id),
    );
  }
  if (difficulty === "hard") return save.clearedStages.includes(stage.id);
  return (save.clearedHardStages ?? []).includes(stage.id);
}

/** Content unlock rules (Phase 1–2+). Normal track only — use with difficulty for scenario hard/hell. */
export function isStageUnlocked(save: PlayerSave, stageId: string): boolean {
  return isStageUnlockedForDifficulty(save, stageId, "normal");
}

/** Stage unlock for a scenario difficulty track (normal / hard / hell). */
export function isStageUnlockedForDifficulty(
  save: PlayerSave,
  stageId: string,
  difficulty: ScenarioDifficulty = "normal",
): boolean {
  const stage = getStage(stageId);
  if (!stage) return false;

  if (stage.mode === "scenario" && difficulty !== "normal") {
    if (stage.map < 1 || stage.map > MAIN_QUEST_AREA_COUNT) return false;
    const cleared = clearedForDifficulty(save, difficulty);
    if (stage.map > 1) {
      const prevBoss = mapBossId(stage.map - 1);
      if (!prevBoss || !cleared.includes(prevBoss)) return false;
    }
    return chainUnlockedOnClears(cleared, stagesForMap(stage.map), stageId);
  }

  switch (stage.mode) {
    case "scenario": {
      if (stage.map < 1 || stage.map > MAIN_QUEST_AREA_COUNT) return false;
      if (stage.map > 1) {
        const prevBoss = mapBossId(stage.map - 1);
        if (!prevBoss || !save.clearedStages.includes(prevBoss)) return false;
      }
      return chainUnlocked(save, stagesForMap(stage.map), stageId);
    }
    case "depth": {
      if (!save.clearedStages.includes("garen_1_5")) return false;
      const chain = cairosChainFor(stageId);
      if (!chain) return true;
      return chainUnlocked(save, chain, stageId);
    }
    case "arena":
      return (
        save.island.summonerLevel >= 5 ||
        save.clearedStages.includes("garen_1_3")
      );
    case "weekday":
      if (
        !save.clearedStages.includes("garen_1_3") ||
        !isWeekdayStageOpenToday(stage.id)
      ) {
        return false;
      }
      return awakenChainFor(stage.id)
        ? chainUnlocked(save, awakenChainFor(stage.id)!, stage.id)
        : true;
    case "trial":
      if (!save.clearedStages.includes("garen_1_5")) return false;
      return chainUnlocked(save, TRIAL_STAGES, stageId);
    case "challenge_tower":
      return isChallengeTowerStageUnlocked(save, stageId);
    case "equip":
      if (!save.clearedStages.includes("garen_1_4")) return false;
      return chainUnlocked(save, EQUIP_STAGES, stageId);
    case "world_arena":
      if (!chapter2Cleared(save) && save.island.summonerLevel < 12) return false;
      return chainUnlocked(save, WORLD_ARENA_STAGES, stageId);
    case "guild_raid":
      if (!save.guildName) return false;
      return chapter2Cleared(save) || save.clearedStages.includes("garen_1_5");
    default:
      return false;
  }
}

export function stageUnlockLabel(
  save: PlayerSave,
  stage: StageDef,
  difficulty: ScenarioDifficulty = "normal",
): string {
  if (isStageClearedOnDifficulty(save, stage.id, difficulty)) return "클리어";
  if (stage.mode === "weekday" && !isWeekdayStageOpenToday(stage.id)) {
    return "오늘은 닫힘";
  }
  if (stage.mode === "challenge_tower") {
    if (isChallengeTowerStageCleared(save, stage.id)) return "클리어";
    if (!isChallengeTowerContentUnlocked(save)) return "잠김";
    if (isChallengeTowerStageUnlocked(save, stage.id)) return "해금";
    return "잠김";
  }
  if (isStageUnlockedForDifficulty(save, stage.id, difficulty)) return "해금";
  return "잠김";
}

export function expForStage(
  stage: StageDef,
  difficulty: ScenarioDifficulty = "normal",
): number {
  const base = 40 + stage.map * 8 + stage.stage * 20;
  if (stage.mode === "scenario") {
    return Math.round(base * scenarioDiffExpMul(difficulty));
  }
  if (stage.mode === "depth") return base + 30;
  if (stage.mode === "arena") return Math.floor(base * 0.5);
  if (stage.mode === "trial") return base + 20;
  if (stage.mode === "challenge_tower") return base + 25 + stage.stage * 2;
  if (stage.mode === "equip") return base + 35;
  if (stage.mode === "world_arena") return base + 40;
  if (stage.mode === "guild_raid") return base + 80;
  return base;
}

export function listAllStages(): StageDef[] {
  return ALL_STAGES;
}
