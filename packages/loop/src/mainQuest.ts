import type { LoopStepResult, PlayerSave } from "./loop.js";

export type MissionReward = {
  mana?: number;
  crystal?: number;
  energy?: number;
  jinmun?: number;
  grindstones?: number;
  scrolls?: number;
  scrollsPremium?: number;
  scrollsMystic?: number;
};

export type MainQuestId =
  | "forest1"
  | "forest3"
  | "forest5"
  | "giantB1"
  | "forestBoss"
  | "towerBoss"
  | "giantB5"
  | "ruinsBoss"
  | "dragonB1"
  | "flameBoss"
  | "necroB1"
  | "giantB10"
  | "endBoss";

export type MainQuestDef = {
  id: MainQuestId;
  stageId: string;
  goRegion: string;
  reward: MissionReward;
};

/** One-time story rewards: scenario bosses + Cairos symbol-dungeon floors. */
export const MAIN_QUESTS: readonly MainQuestDef[] = [
  {
    id: "forest1",
    stageId: "garen_1_1",
    goRegion: "mq1",
    reward: { mana: 300, energy: 10 },
  },
  {
    id: "forest3",
    stageId: "garen_1_3",
    goRegion: "mq1",
    reward: { mana: 500, crystal: 20 },
  },
  {
    id: "forest5",
    stageId: "garen_1_5",
    goRegion: "mq1",
    reward: { mana: 800, grindstones: 2 },
  },
  {
    id: "giantB1",
    stageId: "giant_b1",
    goRegion: "depth",
    reward: { mana: 600, grindstones: 3 },
  },
  {
    id: "forestBoss",
    stageId: "garen_1_7",
    goRegion: "mq1",
    reward: { mana: 1000, jinmun: 2, scrolls: 1 },
  },
  {
    id: "towerBoss",
    stageId: "tower_2_7",
    goRegion: "mq2",
    reward: { mana: 1500, crystal: 50, jinmun: 3 },
  },
  {
    id: "giantB5",
    stageId: "giant_b5",
    goRegion: "depth",
    reward: { mana: 1200, grindstones: 5 },
  },
  {
    id: "ruinsBoss",
    stageId: "ruins_3_7",
    goRegion: "mq3",
    reward: { mana: 2000, scrollsPremium: 1 },
  },
  {
    id: "dragonB1",
    stageId: "dragon_b1",
    goRegion: "depth",
    reward: { mana: 1500, grindstones: 5, jinmun: 3 },
  },
  {
    id: "flameBoss",
    stageId: "flame_5_7",
    goRegion: "mq5",
    reward: { mana: 2500, crystal: 80, jinmun: 5 },
  },
  {
    id: "necroB1",
    stageId: "necro_b1",
    goRegion: "depth",
    reward: { mana: 2000, grindstones: 8 },
  },
  {
    id: "giantB10",
    stageId: "giant_b10",
    goRegion: "depth",
    reward: { mana: 3000, crystal: 100, scrollsPremium: 1 },
  },
  {
    id: "endBoss",
    stageId: "end_13_7",
    goRegion: "mq13",
    reward: { mana: 5000, crystal: 200, jinmun: 10, scrollsMystic: 1 },
  },
];

export function getMainQuest(id: string): MainQuestDef | undefined {
  return MAIN_QUESTS.find((q) => q.id === id);
}

export function isMainQuestClaimed(save: PlayerSave, id: string): boolean {
  return (save.claimedMainQuestIds ?? []).includes(id);
}

export function isMainQuestComplete(save: PlayerSave, id: string): boolean {
  const quest = getMainQuest(id);
  if (!quest) return false;
  return (save.clearedStages ?? []).includes(quest.stageId);
}

/** Previous quest must be cleared before this one is visible as unlocked. */
export function isMainQuestUnlocked(save: PlayerSave, id: string): boolean {
  const idx = MAIN_QUESTS.findIndex((q) => q.id === id);
  if (idx < 0) return false;
  if (idx === 0) return true;
  const prev = MAIN_QUESTS[idx - 1]!;
  return isMainQuestComplete(save, prev.id);
}

export function claimableMainQuestIds(save: PlayerSave): MainQuestId[] {
  return MAIN_QUESTS.filter(
    (q) =>
      isMainQuestUnlocked(save, q.id) &&
      isMainQuestComplete(save, q.id) &&
      !isMainQuestClaimed(save, q.id),
  ).map((q) => q.id);
}

export function claimableMainQuestCount(save: PlayerSave): number {
  return claimableMainQuestIds(save).length;
}

export function grantMissionReward(
  save: PlayerSave,
  reward: MissionReward,
): PlayerSave {
  const max = save.island.energyMax ?? 100;
  return {
    ...save,
    island: {
      ...save.island,
      mana: save.island.mana + (reward.mana ?? 0),
      crystal: save.island.crystal + (reward.crystal ?? 0),
      energy: Math.min(max, save.island.energy + (reward.energy ?? 0)),
    },
    jinmunStones: (save.jinmunStones ?? 0) + (reward.jinmun ?? 0),
    grindstones: (save.grindstones ?? 0) + (reward.grindstones ?? 0),
    scrolls: (save.scrolls ?? 0) + (reward.scrolls ?? 0),
    scrollsPremium: (save.scrollsPremium ?? 0) + (reward.scrollsPremium ?? 0),
    scrollsMystic: (save.scrollsMystic ?? 0) + (reward.scrollsMystic ?? 0),
  };
}

export function formatMissionRewardMessage(reward: MissionReward): string {
  const bits: string[] = [];
  if (reward.mana) bits.push(`골드 +${reward.mana}`);
  if (reward.crystal) bits.push(`크리스탈 +${reward.crystal}`);
  if (reward.energy) bits.push(`행동력 +${reward.energy}`);
  if (reward.jinmun) bits.push(`진문석 +${reward.jinmun}`);
  if (reward.grindstones) bits.push(`연마석 +${reward.grindstones}`);
  if (reward.scrolls) bits.push(`소환서 +${reward.scrolls}`);
  if (reward.scrollsPremium) bits.push(`고급 소환서 +${reward.scrollsPremium}`);
  if (reward.scrollsMystic) bits.push(`신성 소환서 +${reward.scrollsMystic}`);
  return bits.join(" · ");
}

/** Claim a completed one-time main quest reward. */
export function runClaimMainQuest(
  save: PlayerSave,
  questId: string,
): LoopStepResult {
  const quest = getMainQuest(questId);
  if (!quest) {
    return { save, message: `미지원 메인 퀘스트: ${questId}` };
  }
  if (!isMainQuestUnlocked(save, quest.id)) {
    return { save, message: "아직 해금되지 않은 메인 퀘스트입니다" };
  }
  if (!isMainQuestComplete(save, quest.id)) {
    return { save, message: "메인 퀘스트가 아직 완료되지 않았습니다" };
  }
  if (isMainQuestClaimed(save, quest.id)) {
    return { save, message: "이미 수령한 메인 퀘스트 보상입니다" };
  }
  const next = grantMissionReward(save, quest.reward);
  return {
    save: {
      ...next,
      claimedMainQuestIds: [...(save.claimedMainQuestIds ?? []), quest.id],
    },
    message: `메인 퀘스트 보상: ${formatMissionRewardMessage(quest.reward)}`,
  };
}
