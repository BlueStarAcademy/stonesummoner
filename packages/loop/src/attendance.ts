import { todayKey } from "stonesummoner-home";
import type { LoopStepResult, PlayerSave } from "./loop.js";
import {
  formatMissionRewardMessage,
  grantMissionReward,
  type MissionReward,
} from "./mainQuest.js";

export type AttendanceReward = MissionReward;

export const ATTENDANCE_CYCLE_DAYS = 14;
export const ATTENDANCE_DAYS_PER_ROW = 7;

/** Milestone days for UI emphasis (weekly finale + cycle finale). */
export const ATTENDANCE_MILESTONE_DAYS = new Set([7, 14]);

/**
 * 14-day login calendar — one reward per day, varied composition.
 * Day 7: premium scroll ×1 · Day 14: premium scroll ×2.
 */
export const ATTENDANCE_REWARDS: readonly AttendanceReward[] = [
  { mana: 600 },
  { energy: 10 },
  { crystal: 8 },
  { mana: 850 },
  { energy: 15 },
  { jinmun: 1 },
  { scrollsPremium: 1 },
  { mana: 1_000 },
  { grindstones: 1 },
  { crystal: 12 },
  { mana: 1_200 },
  { energy: 25 },
  { jinmun: 2 },
  { scrollsPremium: 2 },
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
