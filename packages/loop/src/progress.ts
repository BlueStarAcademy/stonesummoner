import {
  ALL_STAGES,
  CAIROS_DRAGON_STAGES,
  CAIROS_GIANT_STAGES,
  CAIROS_NECRO_STAGES,
  EQUIP_STAGES,
  MAIN_QUEST_AREA_COUNT,
  TRIAL_STAGES,
  WORLD_ARENA_STAGES,
  getStage,
  isWeekdayStageOpenToday,
  stagesForMap,
  type StageDef,
} from "stonesummoner-data";
import type { PlayerSave } from "./loop.js";

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

/** Content unlock rules (Phase 1–2+). */
export function isStageUnlocked(save: PlayerSave, stageId: string): boolean {
  const stage = getStage(stageId);
  if (!stage) return false;

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
      return (
        save.clearedStages.includes("garen_1_3") &&
        isWeekdayStageOpenToday(stageId)
      );
    case "trial":
      if (!save.clearedStages.includes("garen_1_5")) return false;
      return chainUnlocked(save, TRIAL_STAGES, stageId);
    case "equip":
      if (!save.clearedStages.includes("garen_1_4")) return false;
      return chainUnlocked(save, EQUIP_STAGES, stageId);
    case "world_arena":
      if (!chapter2Cleared(save) && save.island.summonerLevel < 12) return false;
      return chainUnlocked(save, WORLD_ARENA_STAGES, stageId);
    case "guild_raid":
      return chapter2Cleared(save) || save.clearedStages.includes("garen_1_5");
    default:
      return false;
  }
}

export function stageUnlockLabel(save: PlayerSave, stage: StageDef): string {
  if (save.clearedStages.includes(stage.id)) return "클리어";
  if (stage.mode === "weekday" && !isWeekdayStageOpenToday(stage.id)) {
    return "오늘은 닫힘";
  }
  if (isStageUnlocked(save, stage.id)) return "해금";
  return "잠김";
}

export function expForStage(stage: StageDef): number {
  const base = 40 + stage.map * 8 + stage.stage * 20;
  if (stage.mode === "depth") return base + 30;
  if (stage.mode === "arena") return Math.floor(base * 0.5);
  if (stage.mode === "trial") return base + 20;
  if (stage.mode === "equip") return base + 35;
  if (stage.mode === "world_arena") return base + 40;
  if (stage.mode === "guild_raid") return base + 80;
  return base;
}

export function listAllStages(): StageDef[] {
  return ALL_STAGES;
}
