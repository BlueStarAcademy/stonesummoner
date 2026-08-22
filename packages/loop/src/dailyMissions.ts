import { todayKey } from "stonesummoner-home";
import { isStageUnlocked } from "./progress.js";
import {
  formatMissionRewardMessage,
  grantMissionReward,
  type MissionReward,
} from "./mainQuest.js";
import type { LoopStepResult, PlayerSave } from "./loop.js";

export const DAILY_ACTIVITY_KEYS = [
  "wish",
  "collect",
  "dojo",
  "battle",
  "dungeon",
  "arena",
  "weekday",
  "equip",
  "warena",
  "raid",
  "summon",
  "enhanceMon",
  "enhanceSymbol",
  "grindSymbol",
  "enhanceGear",
  "skillUp",
  "shop",
  "building",
  "guild",
] as const;

export type DailyActivityKey = (typeof DAILY_ACTIVITY_KEYS)[number];

export type DailyActivity = {
  day: string | null;
} & Record<DailyActivityKey, number>;

export const DAILY_MISSION_WISH = "wish";
export const DAILY_MISSION_DOJO = "dojo";
export const DAILY_MISSION_COLLECT = "collect";
export const DAILY_MISSION_SORTIE = "sortie";
export const DAILY_MISSION_WISH_MANA = 200;
export const DAILY_MISSION_WISH_ENERGY = 10;
export const DAILY_MISSION_DOJO_MANA = 150;
export const DAILY_MISSION_DOJO_ENERGY = 5;
export const DAILY_MISSION_COLLECT_MANA = 100;
export const DAILY_MISSION_COLLECT_ENERGY = 5;
export const DAILY_MISSION_SORTIE_MANA = 120;
export const DAILY_MISSION_SORTIE_ENERGY = 10;

const ALL_BONUS_MIN = 4;

export type DailyMissionId =
  | typeof DAILY_MISSION_WISH
  | typeof DAILY_MISSION_DOJO
  | typeof DAILY_MISSION_COLLECT
  | typeof DAILY_MISSION_SORTIE
  | "summon"
  | "enhanceMon"
  | "enhanceGear"
  | "enhanceSymbol"
  | "grindSymbol"
  | "shop"
  | "building"
  | "arena"
  | "weekday"
  | "equipDun"
  | "dungeon"
  | "skillUp"
  | "guild"
  | "raid"
  | "warena"
  | "all";

export type DailyMissionDef = {
  id: DailyMissionId;
  minLevel: number;
  requireStage?: string;
  unlock?: (save: PlayerSave) => boolean;
  goal: number | ((save: PlayerSave) => number);
  stat: DailyActivityKey | "all";
  goNav?: string;
  reward: MissionReward;
};

function accountLv(save: PlayerSave): number {
  return Math.max(1, Math.floor(save.island.summonerLevel ?? 1));
}

function scaledGoal(
  level: number,
  steps: readonly (readonly [number, number])[],
): number {
  let value = steps[0]?.[1] ?? 1;
  for (const [min, count] of steps) {
    if (level >= min) value = count;
  }
  return value;
}

export const DAILY_MISSIONS: readonly DailyMissionDef[] = [
  {
    id: DAILY_MISSION_COLLECT,
    minLevel: 1,
    goal: 1,
    stat: "collect",
    goNav: "home",
    reward: {
      mana: DAILY_MISSION_COLLECT_MANA,
      energy: DAILY_MISSION_COLLECT_ENERGY,
    },
  },
  {
    id: "summon",
    minLevel: 1,
    goal: 1,
    stat: "summon",
    goNav: "summon",
    reward: { mana: 150, energy: 5 },
  },
  {
    id: "enhanceMon",
    minLevel: 1,
    goal: 1,
    stat: "enhanceMon",
    goNav: "enhance",
    reward: { mana: 150, energy: 5 },
  },
  {
    id: DAILY_MISSION_SORTIE,
    minLevel: 1,
    goal: (save) => scaledGoal(accountLv(save), [[1, 3], [10, 5], [20, 10]]),
    stat: "battle",
    goNav: "stages",
    reward: {
      mana: DAILY_MISSION_SORTIE_MANA,
      energy: DAILY_MISSION_SORTIE_ENERGY,
    },
  },
  {
    id: "enhanceGear",
    minLevel: 3,
    goal: 1,
    stat: "enhanceGear",
    goNav: "summoner",
    reward: { mana: 180, energy: 5 },
  },
  {
    id: "shop",
    minLevel: 4,
    goal: 1,
    stat: "shop",
    goNav: "shop",
    reward: { mana: 120, energy: 5 },
  },
  {
    id: "building",
    minLevel: 4,
    goal: 1,
    stat: "building",
    goNav: "home",
    reward: { mana: 160, energy: 5 },
  },
  {
    id: "arena",
    minLevel: 1,
    unlock: (save) => isStageUnlocked(save, "arena_rookie"),
    goal: (save) => scaledGoal(accountLv(save), [[1, 2], [15, 4]]),
    stat: "arena",
    goNav: "stages:arena",
    reward: { mana: 200, energy: 10 },
  },
  {
    id: "enhanceSymbol",
    minLevel: 5,
    goal: 1,
    stat: "enhanceSymbol",
    goNav: "enhance:symbols",
    reward: { mana: 200, energy: 5 },
  },
  {
    id: "weekday",
    minLevel: 1,
    requireStage: "garen_1_3",
    goal: 1,
    stat: "weekday",
    goNav: "stages:cadence",
    reward: { mana: 180, jinmun: 1 },
  },
  {
    id: "equipDun",
    minLevel: 1,
    requireStage: "garen_1_4",
    goal: 1,
    stat: "equip",
    goNav: "stages:equip",
    reward: { mana: 220, energy: 5 },
  },
  {
    id: DAILY_MISSION_WISH,
    minLevel: 7,
    goal: 1,
    stat: "wish",
    goNav: "wish",
    reward: {
      mana: DAILY_MISSION_WISH_MANA,
      energy: DAILY_MISSION_WISH_ENERGY,
    },
  },
  {
    id: DAILY_MISSION_DOJO,
    minLevel: 8,
    goal: 1,
    stat: "dojo",
    goNav: "dojo",
    reward: {
      mana: DAILY_MISSION_DOJO_MANA,
      energy: DAILY_MISSION_DOJO_ENERGY,
    },
  },
  {
    id: "dungeon",
    minLevel: 1,
    requireStage: "garen_1_5",
    goal: (save) => scaledGoal(accountLv(save), [[1, 2], [20, 5]]),
    stat: "dungeon",
    goNav: "stages:depth",
    reward: { mana: 250, grindstones: 1, energy: 10 },
  },
  {
    id: "grindSymbol",
    minLevel: 1,
    requireStage: "garen_1_5",
    goal: 1,
    stat: "grindSymbol",
    goNav: "enhance:symbols",
    reward: { mana: 180, energy: 5 },
  },
  {
    id: "skillUp",
    minLevel: 10,
    goal: 1,
    stat: "skillUp",
    goNav: "enhance",
    reward: { mana: 200, energy: 5 },
  },
  {
    id: "guild",
    minLevel: 12,
    goal: 1,
    stat: "guild",
    goNav: "guild",
    reward: { mana: 200, crystal: 10 },
  },
  {
    id: "raid",
    minLevel: 12,
    unlock: (save) => isStageUnlocked(save, "guild_raid_boss"),
    goal: 1,
    stat: "raid",
    goNav: "stages:guild",
    reward: { mana: 280, energy: 10 },
  },
  {
    id: "warena",
    minLevel: 12,
    unlock: (save) => isStageUnlocked(save, "warena_qual"),
    goal: 1,
    stat: "warena",
    goNav: "stages:warena",
    reward: { mana: 260, energy: 10 },
  },
  {
    id: "all",
    minLevel: 1,
    goal: 1,
    stat: "all",
    reward: { mana: 400, crystal: 20, energy: 20 },
  },
];

export const DAILY_MISSION_REWARDS: Record<DailyMissionId, MissionReward> =
  Object.fromEntries(DAILY_MISSIONS.map((m) => [m.id, m.reward])) as Record<
    DailyMissionId,
    MissionReward
  >;

export function emptyDailyActivity(day: string | null = null): DailyActivity {
  const counts = Object.fromEntries(
    DAILY_ACTIVITY_KEYS.map((key) => [key, 0]),
  ) as Record<DailyActivityKey, number>;
  return { day, ...counts };
}

export function normalizeDailyActivity(
  raw: unknown,
  day: string | null = null,
): DailyActivity {
  const next = emptyDailyActivity(day);
  if (!raw || typeof raw !== "object") return next;
  const o = raw as Record<string, unknown>;
  next.day = typeof o.day === "string" ? o.day : (o.day === null ? null : day);
  for (const key of DAILY_ACTIVITY_KEYS) {
    if (typeof o[key] === "number" && Number.isFinite(o[key])) {
      next[key] = Math.max(0, Math.floor(o[key]));
    }
  }
  return next;
}

function seedDailyActivity(save: PlayerSave, day: string): DailyActivity {
  const act = emptyDailyActivity(day);
  const island = save.island;
  if (
    island.lastWishDay === day ||
    (island.wishDayKey === day && (island.wishUsesToday ?? 0) > 0)
  ) {
    act.wish = Math.max(1, island.wishUsesToday ?? 1);
  }
  if (save.dojoDrillDay === day) {
    act.dojo = Math.max(0, save.dojoDrillsToday ?? 0);
  }
  if (save.guildCheckInDay === day) act.guild = 1;
  return act;
}

export function syncDailyActivity(
  save: PlayerSave,
  now = Date.now(),
): PlayerSave {
  const day = todayKey(now);
  if (save.dailyActivity?.day === day) return save;
  return { ...save, dailyActivity: seedDailyActivity(save, day) };
}

export function bumpDailyActivity(
  save: PlayerSave,
  key: DailyActivityKey,
  n = 1,
  now = Date.now(),
): PlayerSave {
  const add = Math.max(0, Math.floor(n));
  if (add <= 0) return save;
  const synced = syncDailyActivity(save, now);
  const day = synced.dailyActivity?.day ?? todayKey(now);
  const activity = {
    ...emptyDailyActivity(day),
    ...synced.dailyActivity,
    day,
  };
  activity[key] = (activity[key] ?? 0) + add;
  return { ...synced, dailyActivity: activity };
}

function activityForDay(save: PlayerSave, day: string): DailyActivity {
  const cur = save.dailyActivity;
  if (cur?.day === day) {
    return { ...emptyDailyActivity(day), ...cur, day };
  }
  return seedDailyActivity(save, day);
}

/** Keep the better of two same-day daily/main mission states after a reconnect. */
export function mergeDailyMissionState(
  primary: PlayerSave,
  secondary: PlayerSave | null,
  now = Date.now(),
): PlayerSave {
  if (!secondary) return primary;
  const day = todayKey(now);
  const a = activityForDay(primary, day);
  const b = activityForDay(secondary, day);
  const dailyActivity = emptyDailyActivity(day);
  for (const key of DAILY_ACTIVITY_KEYS) {
    dailyActivity[key] = Math.max(a[key] ?? 0, b[key] ?? 0);
  }
  return {
    ...primary,
    dailyActivity,
    claimedMissionKeys: [
      ...new Set([
        ...(primary.claimedMissionKeys ?? []),
        ...(secondary.claimedMissionKeys ?? []),
      ]),
    ],
    claimedMainQuestIds: [
      ...new Set([
        ...(primary.claimedMainQuestIds ?? []),
        ...(secondary.claimedMainQuestIds ?? []),
      ]),
    ],
  };
}

export function dailyActivityCount(
  save: PlayerSave,
  key: DailyActivityKey,
  now = Date.now(),
): number {
  const day = todayKey(now);
  const cur = save.dailyActivity;
  if (cur?.day === day) return Math.max(0, cur[key] ?? 0);
  return seedDailyActivity(save, day)[key] ?? 0;
}

export function getDailyMission(id: string): DailyMissionDef | undefined {
  return DAILY_MISSIONS.find((m) => m.id === id);
}

export function dailyMissionGoal(
  save: PlayerSave,
  def: DailyMissionDef,
): number {
  return typeof def.goal === "function" ? def.goal(save) : def.goal;
}

export function isDailyMissionUnlocked(
  save: PlayerSave,
  def: DailyMissionDef,
): boolean {
  if (def.stat === "all") return false;
  if (accountLv(save) < def.minLevel) return false;
  if (
    def.requireStage &&
    !(save.clearedStages ?? []).includes(def.requireStage)
  ) {
    return false;
  }
  if (def.unlock && !def.unlock(save)) return false;
  return true;
}

export function unlockedDailyMissions(save: PlayerSave): DailyMissionDef[] {
  return DAILY_MISSIONS.filter(
    (m) => m.stat !== "all" && isDailyMissionUnlocked(save, m),
  );
}

export function visibleDailyMissions(save: PlayerSave): DailyMissionDef[] {
  const list = unlockedDailyMissions(save);
  const bonus = DAILY_MISSIONS.find((m) => m.stat === "all");
  if (bonus && list.length >= ALL_BONUS_MIN) return [...list, bonus];
  return list;
}

export function dailyMissionProgress(
  save: PlayerSave,
  def: DailyMissionDef,
  now = Date.now(),
): number {
  if (def.stat === "all") {
    const others = unlockedDailyMissions(save);
    if (others.length === 0) return 0;
    const done = others.filter(
      (m) => dailyMissionProgress(save, m, now) >= dailyMissionGoal(save, m),
    ).length;
    return done >= others.length ? 1 : 0;
  }
  return dailyActivityCount(save, def.stat, now);
}

export function dailyMissionClaimKey(
  missionId: string,
  dayKey: string,
): string {
  return `${missionId}:${dayKey}`;
}

export function isDailyMissionClaimed(
  save: PlayerSave,
  missionId: string,
  day = todayKey(),
): boolean {
  const key = dailyMissionClaimKey(missionId, day);
  return (save.claimedMissionKeys ?? []).includes(key);
}

export function isDailyMissionComplete(
  save: PlayerSave,
  missionId: string,
  now = Date.now(),
): boolean {
  const def = getDailyMission(missionId);
  if (!def) return false;
  if (def.stat !== "all" && !isDailyMissionUnlocked(save, def)) return false;
  if (def.stat === "all" && unlockedDailyMissions(save).length < ALL_BONUS_MIN) {
    return false;
  }
  return dailyMissionProgress(save, def, now) >= dailyMissionGoal(save, def);
}

export function claimableDailyMissionIds(
  save: PlayerSave,
  now = Date.now(),
): DailyMissionId[] {
  const day = todayKey(now);
  return visibleDailyMissions(save)
    .filter(
      (def) =>
        isDailyMissionComplete(save, def.id, now) &&
        !isDailyMissionClaimed(save, def.id, day),
    )
    .map((def) => def.id);
}

export function claimableDailyMissionCount(
  save: PlayerSave,
  now = Date.now(),
): number {
  return claimableDailyMissionIds(save, now).length;
}

export function runClaimDailyMission(
  save: PlayerSave,
  missionId: string,
  now = Date.now(),
): LoopStepResult {
  const day = todayKey(now);
  const def = getDailyMission(missionId);
  if (!def) {
    return { save, message: `미지원 미션: ${missionId}` };
  }
  if (!isDailyMissionComplete(save, missionId, now)) {
    return { save, message: "일일 미션이 아직 완료되지 않았습니다" };
  }
  if (isDailyMissionClaimed(save, missionId, day)) {
    return { save, message: "오늘 이미 수령한 미션 보상입니다" };
  }
  const synced = syncDailyActivity(save, now);
  const next = grantMissionReward(synced, def.reward);
  const key = dailyMissionClaimKey(missionId, day);
  return {
    save: {
      ...next,
      claimedMissionKeys: [...(synced.claimedMissionKeys ?? []), key],
    },
    message: `일일 미션 보상: ${formatMissionRewardMessage(def.reward)}`,
  };
}
