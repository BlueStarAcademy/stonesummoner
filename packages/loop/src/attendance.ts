import { todayKey } from "stonesummoner-home";
import type { LoopStepResult, PlayerSave } from "./loop.js";
import {
  formatMissionRewardMessage,
  grantMissionReward,
  type MissionReward,
} from "./mainQuest.js";

export type AttendanceReward = MissionReward;

export const ATTENDANCE_CYCLE_DAYS = 30;

/** Milestone days (weekly / finale) for UI emphasis. */
export const ATTENDANCE_MILESTONE_DAYS = new Set([7, 14, 15, 21, 28, 30]);

/**
 * 30-day login calendar — modest daily gold (~daily-mission scale) with weekly spikes.
 * `mana` is displayed as gold in the client.
 */
export const ATTENDANCE_REWARDS: readonly AttendanceReward[] = [
  { mana: 500, energy: 5 },
  { mana: 550, energy: 5 },
  { mana: 600, energy: 8 },
  { mana: 650, energy: 8 },
  { mana: 700, energy: 10 },
  { mana: 750, energy: 10 },
  { mana: 900, energy: 15, crystal: 10, grindstones: 1 },
  { mana: 600, energy: 8 },
  { mana: 650, energy: 8 },
  { mana: 700, energy: 10, jinmun: 1 },
  { mana: 750, energy: 10 },
  { mana: 800, energy: 12 },
  { mana: 850, energy: 12 },
  { mana: 1_100, energy: 20, crystal: 15, grindstones: 1 },
  { mana: 800, scrollsPremium: 1 },
  { mana: 850, energy: 12 },
  { mana: 900, energy: 12 },
  { mana: 950, energy: 15 },
  { mana: 1_000, energy: 15, jinmun: 2 },
  { mana: 1_050, energy: 15 },
  { mana: 1_300, energy: 25, crystal: 20, grindstones: 1 },
  { mana: 950, energy: 15 },
  { mana: 1_000, energy: 15 },
  { mana: 1_050, energy: 18 },
  { mana: 1_100, energy: 18 },
  { mana: 1_150, energy: 18, jinmun: 2 },
  { mana: 1_200, energy: 20 },
  { mana: 1_500, energy: 30, crystal: 25, grindstones: 1 },
  { mana: 1_100, energy: 20 },
  { mana: 2_000, energy: 40, scrollsPremium: 1, crystal: 30 },
] as const;

function clampDayIndex(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(ATTENDANCE_CYCLE_DAYS, Math.floor(n)));
}

export function attendanceDayIndex(save: PlayerSave): number {
  return clampDayIndex(save.attendanceDayIndex ?? 1);
}

export function attendanceStreak(save: PlayerSave): number {
  return Math.max(0, Math.floor(save.attendanceStreak ?? 0));
}

export function attendanceRewardForDay(day: number): AttendanceReward {
  const idx = clampDayIndex(day) - 1;
  return ATTENDANCE_REWARDS[idx] ?? ATTENDANCE_REWARDS[0]!;
}

export function canClaimAttendance(save: PlayerSave, now = Date.now()): boolean {
  const day = todayKey(now);
  return (save.attendanceLastClaimDay ?? null) !== day;
}

function yesterdayKey(day: string): string {
  const t = new Date(`${day}T00:00:00.000Z`).getTime() - 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

function nextStreak(prevDay: string | null, today: string, prevStreak: number): number {
  if (!prevDay) return 1;
  return prevDay === yesterdayKey(today) ? prevStreak + 1 : 1;
}

export function runClaimAttendance(
  save: PlayerSave,
  now = Date.now(),
): LoopStepResult {
  const today = todayKey(now);
  if ((save.attendanceLastClaimDay ?? null) === today) {
    return { save, message: "오늘 이미 출석 보상을 수령했습니다" };
  }
  const dayIndex = attendanceDayIndex(save);
  const reward = attendanceRewardForDay(dayIndex);
  const streak = nextStreak(
    save.attendanceLastClaimDay ?? null,
    today,
    attendanceStreak(save),
  );
  const nextIndex =
    dayIndex >= ATTENDANCE_CYCLE_DAYS ? 1 : dayIndex + 1;
  const next = grantMissionReward(save, reward);
  return {
    save: {
      ...next,
      attendanceDayIndex: nextIndex,
      attendanceStreak: streak,
      attendanceLastClaimDay: today,
    },
    message: `출석 ${dayIndex}일차: ${formatMissionRewardMessage(reward)} · 연속 ${streak}일`,
  };
}
