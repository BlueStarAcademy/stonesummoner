import {
  ATTENDANCE_CYCLE_DAYS,
  ATTENDANCE_DAYS_PER_ROW,
  ATTENDANCE_MILESTONE_DAYS,
  ATTENDANCE_REWARDS,
  attendanceDayIndex,
  attendanceRewardForDay,
  attendanceStreak,
  canClaimAttendance,
  type AttendanceReward,
  type PlayerSave,
} from "stonesummoner-loop";

export type AttendanceCellState = "claimed" | "today" | "upcoming";

export function attendanceCellState(
  day: number,
  save: PlayerSave,
): AttendanceCellState {
  const next = attendanceDayIndex(save);
  if (day < next) return "claimed";
  if (day === next) return "today";
  return "upcoming";
}

export type AttendanceChipHelpers = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  fmtRes: (n: number) => string;
  escapeHtml: (s: string) => string;
};

type RewardIcon = { src: string; amount: number; title: string };

function rewardIcons(reward: AttendanceReward, h: AttendanceChipHelpers): RewardIcon[] {
  const out: RewardIcon[] = [];
  const push = (src: string, n: number | undefined, title: string): void => {
    if (!n) return;
    out.push({ src, amount: n, title });
  };
  push("/art/ui/res/gold.svg", reward.mana, h.t("res.gold"));
  push("/art/ui/res/crystal.svg", reward.crystal, h.t("res.crystal"));
  push("/art/ui/res/energy.svg", reward.energy, h.t("res.energy"));
  push("/art/ui/res/jinmun.svg", reward.jinmun, h.t("res.jinmun"));
  push("/art/ui/res/grindstone.webp", reward.grindstones, h.t("ui.grindstone"));
  push(
    "/art/ui/res/imprint-stone.webp",
    reward.imprintStones,
    h.t("ui.imprintStone"),
  );
  push("/art/ui/res/scroll.svg", reward.scrolls, h.t("res.scrollNormal"));
  push(
    "/art/ui/res/scroll-premium.webp",
    reward.scrollsPremium,
    h.t("res.scrollPremium"),
  );
  push(
    "/art/ui/res/scroll-mystic.webp",
    reward.scrollsMystic,
    h.t("res.scrollMystic"),
  );
  return out;
}

function primaryRewardIcon(
  reward: AttendanceReward,
  h: AttendanceChipHelpers,
): RewardIcon {
  const icons = rewardIcons(reward, h);
  const priority = [
    "/art/ui/res/scroll-mystic.webp",
    "/art/ui/res/scroll-premium.webp",
    "/art/ui/res/scroll.svg",
    "/art/ui/res/crystal.svg",
    "/art/ui/res/jinmun.svg",
    "/art/ui/res/grindstone.webp",
    "/art/ui/res/imprint-stone.webp",
    "/art/ui/res/energy.svg",
    "/art/ui/res/gold.svg",
  ];
  for (const src of priority) {
    const hit = icons.find((x) => x.src === src);
    if (hit) return hit;
  }
  return icons[0] ?? {
    src: "/art/ui/res/gold.svg",
    amount: 0,
    title: h.t("res.gold"),
  };
}

export function attendanceRewardChips(
  reward: AttendanceReward,
  h: AttendanceChipHelpers,
  opts?: { large?: boolean },
): string {
  const icon = primaryRewardIcon(reward, h);
  const chipClass = opts?.large
    ? "res-cost-chip res-cost-chip--attendance-hero"
    : "res-cost-chip";
  return `<span class="${chipClass}" title="${h.escapeHtml(icon.title)}"><img class="res-ico" src="${icon.src}" width="${opts?.large ? 28 : 16}" height="${opts?.large ? 28 : 16}" alt="" draggable="false" /><strong>+${h.fmtRes(icon.amount)}</strong></span>`;
}

export function renderAttendanceCell(
  day: number,
  save: PlayerSave,
  h: AttendanceChipHelpers,
): string {
  const state = attendanceCellState(day, save);
  const reward = ATTENDANCE_REWARDS[day - 1] ?? ATTENDANCE_REWARDS[0]!;
  const primary = primaryRewardIcon(reward, h);
  const milestone = ATTENDANCE_MILESTONE_DAYS.has(day);
  const finale = day === ATTENDANCE_CYCLE_DAYS;
  const claimable = state === "today" && canClaimAttendance(save);
  const tag = claimable ? "button" : "div";
  const claimAttrs = claimable
    ? ` type="button" id="btn-attendance-claim-cell"`
    : "";
  const check =
    state === "claimed"
      ? `<span class="attendance-cell-check" aria-hidden="true"></span>`
      : "";
  const milestoneMark =
    milestone && state !== "claimed"
      ? `<span class="attendance-cell-milestone" aria-hidden="true"></span>`
      : "";
  const premium =
    primary.src.includes("scroll-premium")
      ? " is-premium-reward"
      : "";
  return `<${tag} class="attendance-cell is-${state}${claimable ? " is-claimable" : ""}${milestone ? " is-milestone" : ""}${finale ? " is-finale" : ""}${premium}" data-att-day="${day}"${claimAttrs} title="${h.escapeHtml(primary.title)}">
    <span class="attendance-cell-day">${day}</span>
    <span class="attendance-cell-art">
      <span class="attendance-cell-glow" aria-hidden="true"></span>
      <img class="attendance-cell-ico" src="${primary.src}" width="36" height="36" alt="" draggable="false" />
    </span>
    <span class="attendance-cell-amt">+${h.fmtRes(primary.amount)}</span>
    ${milestoneMark}
    ${check}
  </${tag}>`;
}

function renderAttendanceWeek(
  weekIndex: number,
  startDay: number,
  save: PlayerSave,
  h: AttendanceChipHelpers,
): string {
  const weekKey =
    weekIndex === 1 ? "ui.attendance.week1" : "ui.attendance.week2";
  const cells: string[] = [];
  for (let d = startDay; d < startDay + ATTENDANCE_DAYS_PER_ROW; d++) {
    cells.push(renderAttendanceCell(d, save, h));
  }
  return `<section class="attendance-week" aria-label="${h.escapeHtml(h.t(weekKey))}">
    <div class="attendance-week-head">
      <span class="attendance-week-label">${h.escapeHtml(h.t(weekKey))}</span>
      <span class="attendance-week-line" aria-hidden="true"></span>
    </div>
    <div class="attendance-grid">${cells.join("")}</div>
  </section>`;
}

export function renderAttendanceGrid(
  save: PlayerSave,
  h: AttendanceChipHelpers,
): string {
  const week1 = renderAttendanceWeek(1, 1, save, h);
  const week2 = renderAttendanceWeek(
    2,
    ATTENDANCE_DAYS_PER_ROW + 1,
    save,
    h,
  );
  return `<div class="attendance-board" id="attendance-board">${week1}${week2}</div>`;
}

export function attendanceSheetMeta(save: PlayerSave): {
  streak: number;
  dayIndex: number;
  canClaim: boolean;
  todayReward: AttendanceReward;
  progressPct: number;
} {
  const dayIndex = attendanceDayIndex(save);
  return {
    streak: attendanceStreak(save),
    dayIndex,
    canClaim: canClaimAttendance(save),
    todayReward: attendanceRewardForDay(dayIndex),
    progressPct: Math.round(
      (Math.max(0, dayIndex - 1) / ATTENDANCE_CYCLE_DAYS) * 100,
    ),
  };
}
