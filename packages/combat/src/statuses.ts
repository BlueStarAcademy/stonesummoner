import type { Unit } from "./types.js";

export type UnitStatusId =
  | "atk-up"
  | "def-up"
  | "spd-up"
  | "crit-up"
  | "cdmg-up"
  | "acc-up"
  | "shield"
  | "immune"
  | "atk-down"
  | "def-down"
  | "spd-down"
  | "stun"
  | "provoke"
  | "dot";

export type UnitStatusPolarity = "buff" | "debuff";

export interface UnitStatusIcon {
  id: UnitStatusId;
  ticks: number;
  polarity: UnitStatusPolarity;
}

const MAX_ICONS = 8;

function push(
  out: UnitStatusIcon[],
  id: UnitStatusId,
  ticks: number,
  polarity: UnitStatusPolarity,
  active: boolean,
): void {
  if (!active) return;
  out.push({
    id,
    ticks: Math.max(0, Math.floor(ticks)),
    polarity,
  });
}

/** Active combat statuses for unit-head icons (Summoners War–style strip). */
export function listUnitStatuses(u: Unit): UnitStatusIcon[] {
  if (!u.alive) return [];
  const out: UnitStatusIcon[] = [];
  push(out, "atk-up", u.atkBuffTicks ?? 0, "buff", (u.atkBuffPct ?? 0) > 0);
  push(out, "def-up", u.defBuffTicks ?? 0, "buff", (u.defBuffPct ?? 0) > 0);
  push(
    out,
    "spd-up",
    Math.max(u.spdBuffTicks ?? 0, u.spdBoostTurns ?? 0),
    "buff",
    (u.spdBuffPct ?? 0) > 0 || (u.spdBoostTurns ?? 0) > 0,
  );
  push(
    out,
    "crit-up",
    u.critRateBuffTicks ?? 0,
    "buff",
    (u.critRateBuff ?? 0) > 0,
  );
  push(
    out,
    "cdmg-up",
    u.critDmgBuffTicks ?? 0,
    "buff",
    (u.critDmgBuff ?? 0) > 0,
  );
  push(
    out,
    "acc-up",
    u.accuracyBuffTicks ?? 0,
    "buff",
    (u.accuracyBuff ?? 0) > 0,
  );
  push(
    out,
    "shield",
    u.shieldTurns ?? 0,
    "buff",
    (u.shieldHp ?? 0) > 0 && (u.shieldStatusVisible ?? true),
  );
  push(
    out,
    "immune",
    u.statusImmuneTurns ?? 0,
    "buff",
    (u.statusImmuneTurns ?? 0) > 0 && !u.statusImmuneIsPassive,
  );
  push(
    out,
    "atk-down",
    u.atkDebuffTicks ?? 0,
    "debuff",
    (u.atkDebuffPct ?? 0) > 0,
  );
  push(
    out,
    "def-down",
    u.defDebuffTicks ?? 0,
    "debuff",
    (u.defDebuffPct ?? 0) > 0,
  );
  push(
    out,
    "spd-down",
    u.spdDebuffTicks ?? 0,
    "debuff",
    (u.spdDebuffPct ?? 0) > 0,
  );
  push(out, "stun", u.stunnedTurns ?? 0, "debuff", (u.stunnedTurns ?? 0) > 0);
  push(
    out,
    "provoke",
    u.provokeTicks ?? 0,
    "debuff",
    (u.provokeTicks ?? 0) > 0,
  );
  push(out, "dot", u.dotTicks ?? 0, "debuff", (u.dotTicks ?? 0) > 0);
  return out.slice(0, MAX_ICONS);
}
