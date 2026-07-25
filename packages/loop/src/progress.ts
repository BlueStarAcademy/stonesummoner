import { CHAPTER1_STAGES, type StageDef } from "stonesummoner-data";
import type { PlayerSave } from "./loop.js";

/** First uncleared stage in chapter order is the frontier; earlier ones unlocked. */
export function isStageUnlocked(save: PlayerSave, stageId: string): boolean {
  const stages = CHAPTER1_STAGES;
  const idx = stages.findIndex((s) => s.id === stageId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  const prev = stages[idx - 1]!;
  return save.clearedStages.includes(prev.id);
}

export function stageUnlockLabel(save: PlayerSave, stage: StageDef): string {
  if (save.clearedStages.includes(stage.id)) return "클리어";
  if (isStageUnlocked(save, stage.id)) return "해금";
  return "잠김";
}

export function expForStage(stage: StageDef): number {
  return 40 + stage.stage * 25;
}
