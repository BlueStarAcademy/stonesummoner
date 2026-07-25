import {
  ALL_STAGES,
  CHAPTER1_STAGES,
  CHAPTER2_STAGES,
  getStage,
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

/** Content unlock rules (Phase 1–2). */
export function isStageUnlocked(save: PlayerSave, stageId: string): boolean {
  const stage = getStage(stageId);
  if (!stage) return false;

  switch (stage.mode) {
    case "scenario":
      if (stage.map === 1) return chainUnlocked(save, CHAPTER1_STAGES, stageId);
      if (stage.map === 2) {
        if (!save.clearedStages.includes("garen_1_5")) return false;
        return chainUnlocked(save, CHAPTER2_STAGES, stageId);
      }
      return false;
    case "depth":
      return save.clearedStages.includes("garen_1_5");
    case "arena":
      return (
        save.island.summonerLevel >= 5 ||
        save.clearedStages.includes("garen_1_3")
      );
    case "weekday":
      return save.clearedStages.includes("garen_1_3");
    case "trial":
      return save.clearedStages.includes("garen_1_5");
    default:
      return false;
  }
}

export function stageUnlockLabel(save: PlayerSave, stage: StageDef): string {
  if (save.clearedStages.includes(stage.id)) return "클리어";
  if (isStageUnlocked(save, stage.id)) return "해금";
  return "잠김";
}

export function expForStage(stage: StageDef): number {
  const base = 40 + stage.stage * 25;
  if (stage.mode === "depth") return base + 30;
  if (stage.mode === "arena") return Math.floor(base * 0.5);
  if (stage.mode === "trial") return base + 20;
  return base;
}

export function listAllStages(): StageDef[] {
  return ALL_STAGES;
}
