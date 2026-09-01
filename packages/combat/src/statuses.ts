import type {
  StatusInstance,
  StatusKind,
  StatusPolarity,
  Unit,
} from "./types.js";

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
  | "crit-down"
  | "cdmg-down"
  | "acc-down"
  | "stun"
  | "freeze"
  | "sleep"
  | "provoke"
  | "dot"
  | "burn"
  | "poison"
  | "hot"
  | "heal-block"
  | "silence"
  | "damage-reduction"
  | "damage-share"
  | "reflect";

export type UnitStatusPolarity = "buff" | "debuff";

export interface UnitStatusIcon {
  id: UnitStatusId;
  ticks: number;
  polarity: UnitStatusPolarity;
}

const MAX_ICONS = 8;
let statusSequence = 0;

const LEGACY_STATUS_FIELDS = [
  ["atk_up", "buff", "atkBuffPct", "atkBuffTicks"],
  ["def_up", "buff", "defBuffPct", "defBuffTicks"],
  ["spd_up", "buff", "spdBuffPct", "spdBuffTicks"],
  ["crit_up", "buff", "critRateBuff", "critRateBuffTicks"],
  ["crit_dmg_up", "buff", "critDmgBuff", "critDmgBuffTicks"],
  ["accuracy_up", "buff", "accuracyBuff", "accuracyBuffTicks"],
  ["atk_down", "debuff", "atkDebuffPct", "atkDebuffTicks"],
  ["def_down", "debuff", "defDebuffPct", "defDebuffTicks"],
  ["spd_down", "debuff", "spdDebuffPct", "spdDebuffTicks"],
  ["crit_down", "debuff", "critRateDebuff", "critRateDebuffTicks"],
  ["crit_dmg_down", "debuff", "critDmgDebuff", "critDmgDebuffTicks"],
  ["accuracy_down", "debuff", "accuracyDebuff", "accuracyDebuffTicks"],
] as const;

function nextStatusId(kind: StatusKind, sourceUnitId: string): string {
  statusSequence += 1;
  return `${kind}:${sourceUnitId}:${statusSequence}`;
}

/** Import legacy fields once. Afterwards `statuses` is authoritative. */
export function ensureStatuses(unit: Unit): StatusInstance[] {
  if (unit.statuses) return unit.statuses;
  const statuses: StatusInstance[] = [];
  for (const [kind, polarity, amountKey, turnsKey] of LEGACY_STATUS_FIELDS) {
    const amount = Number(unit[amountKey] ?? 0);
    const turns = Number(unit[turnsKey] ?? 0);
    if (amount > 0 && turns > 0) {
      statuses.push({
        id: nextStatusId(kind, unit.id),
        kind,
        sourceUnitId: unit.id,
        polarity,
        turns,
        stacking: "replace",
        dispellable: true,
        stacks: 1,
        amount,
      });
    }
  }
  const controls: Array<[StatusKind, number]> = [
    ["stun", unit.stunnedTurns ?? 0],
    ["freeze", unit.frozenTurns ?? 0],
    ["sleep", unit.sleepingTurns ?? 0],
    ["heal_block", unit.healBlockTurns ?? 0],
    ["silence", unit.silenceTurns ?? 0],
  ];
  for (const [kind, turns] of controls) {
    if (turns > 0) {
      statuses.push({
        id: nextStatusId(kind, unit.id),
        kind,
        sourceUnitId: unit.id,
        polarity: "debuff",
        turns,
        stacking: "replace",
        dispellable: true,
        stacks: 1,
      });
    }
  }
  if ((unit.dotTicks ?? 0) > 0) {
    statuses.push({
      id: nextStatusId("dot", unit.id),
      kind: "dot",
      sourceUnitId: unit.id,
      polarity: "debuff",
      turns: unit.dotTicks!,
      stacking: "stack",
      dispellable: true,
      stacks: 1,
      amount: unit.dotAtkCoeff,
      value: (unit.dotSourceAtk ?? 0) * (unit.dotAtkCoeff ?? 0),
    });
  }
  if ((unit.provokeTicks ?? 0) > 0) {
    statuses.push({
      id: nextStatusId("provoke", unit.provokeTargetId ?? unit.id),
      kind: "provoke",
      sourceUnitId: unit.provokeTargetId ?? unit.id,
      linkedUnitId: unit.provokeTargetId,
      polarity: "debuff",
      turns: unit.provokeTicks!,
      stacking: "replace",
      dispellable: true,
      stacks: 1,
    });
  }
  if (
    (unit.statusImmuneTurns ?? 0) > 0 &&
    !unit.statusImmuneIsPassive
  ) {
    statuses.push({
      id: nextStatusId("immunity", unit.id),
      kind: "immunity",
      sourceUnitId: unit.id,
      polarity: "buff",
      turns: unit.statusImmuneTurns!,
      stacking: "replace",
      dispellable: true,
      stacks: 1,
    });
  }
  unit.statuses = statuses;
  syncLegacyStatuses(unit);
  return statuses;
}

export function hasStatus(unit: Unit, kind: StatusKind): boolean {
  return ensureStatuses(unit).some((status) => status.kind === kind && status.turns > 0);
}

export function statusesOf(
  unit: Unit,
  polarity?: StatusPolarity,
): StatusInstance[] {
  return ensureStatuses(unit).filter(
    (status) => status.turns > 0 && (!polarity || status.polarity === polarity),
  );
}

export function addStatus(
  unit: Unit,
  input: Omit<StatusInstance, "id" | "stacks"> &
    Partial<Pick<StatusInstance, "id" | "stacks">>,
): StatusInstance {
  const statuses = ensureStatuses(unit);
  if (unit.immuneStatusKinds?.includes(input.kind)) {
    return statuses.find((status) => status.kind === input.kind) ?? {
      ...input,
      id: input.id ?? nextStatusId(input.kind, input.sourceUnitId),
      stacks: input.stacks ?? 1,
    };
  }
  if (input.stacking !== "stack") {
    const current = statuses.find((status) => status.kind === input.kind);
    if (current) {
      current.turns =
        input.stacking === "extend"
          ? current.turns + input.turns
          : Math.max(current.turns, input.turns);
      current.amount = Math.max(current.amount ?? 0, input.amount ?? 0) || undefined;
      current.value = Math.max(current.value ?? 0, input.value ?? 0) || undefined;
      current.sourceUnitId = input.sourceUnitId;
      current.linkedUnitId = input.linkedUnitId;
      current.dispellable = input.dispellable;
      syncLegacyStatuses(unit);
      return current;
    }
  }
  const status: StatusInstance = {
    ...input,
    id: input.id ?? nextStatusId(input.kind, input.sourceUnitId),
    stacks: input.stacks ?? 1,
  };
  statuses.push(status);
  syncLegacyStatuses(unit);
  return status;
}

const STRIP_PRIORITY: StatusKind[] = [
  "immunity",
  "shield",
  "damage_share",
  "reflect",
  "damage_reduction",
  "spd_up",
  "atk_up",
  "def_up",
  "crit_up",
  "crit_dmg_up",
  "accuracy_up",
  "hot",
];
const CLEANSE_PRIORITY: StatusKind[] = [
  "stun",
  "freeze",
  "sleep",
  "provoke",
  "silence",
  "heal_block",
  "def_down",
  "spd_down",
  "atk_down",
  "crit_down",
  "crit_dmg_down",
  "accuracy_down",
  "dot",
  "burn",
  "poison",
];

export function removeStatuses(
  unit: Unit,
  polarity: StatusPolarity,
  count = Number.POSITIVE_INFINITY,
): StatusInstance[] {
  const statuses = ensureStatuses(unit);
  const priority = polarity === "buff" ? STRIP_PRIORITY : CLEANSE_PRIORITY;
  const candidates = statuses
    .filter((status) => status.polarity === polarity && status.dispellable)
    .sort(
      (a, b) =>
        priority.indexOf(a.kind) - priority.indexOf(b.kind) ||
        a.turns - b.turns,
    );
  const removed = candidates.slice(0, Math.max(0, count));
  const ids = new Set(removed.map((status) => status.id));
  unit.statuses = statuses.filter((status) => !ids.has(status.id));
  syncLegacyStatuses(unit);
  return removed;
}

export function removeStatusKind(unit: Unit, kind: StatusKind): void {
  unit.statuses = ensureStatuses(unit).filter((status) => status.kind !== kind);
  syncLegacyStatuses(unit);
}

/** Mirror authoritative instances into old fields used by the app during migration. */
export function syncLegacyStatuses(unit: Unit): void {
  const statuses = unit.statuses ?? [];
  const amount = (kind: StatusKind) =>
    statuses
      .filter((status) => status.kind === kind)
      .reduce((sum, status) => sum + (status.amount ?? 0), 0);
  const turns = (kind: StatusKind) =>
    statuses
      .filter((status) => status.kind === kind)
      .reduce((max, status) => Math.max(max, status.turns), 0);
  for (const [kind, , amountKey, turnsKey] of LEGACY_STATUS_FIELDS) {
    (unit as unknown as Record<string, unknown>)[amountKey] = amount(kind);
    (unit as unknown as Record<string, unknown>)[turnsKey] = turns(kind);
  }
  unit.stunnedTurns = turns("stun");
  unit.frozenTurns = turns("freeze");
  unit.sleepingTurns = turns("sleep");
  unit.healBlockTurns = turns("heal_block");
  unit.silenceTurns = turns("silence");
  const dots = statuses.filter((status) => status.kind === "dot");
  unit.dotTicks = dots.reduce((max, status) => Math.max(max, status.turns), 0);
  unit.dotAtkCoeff = dots.reduce((sum, status) => sum + (status.amount ?? 0), 0);
  unit.dotSourceAtk = dots.length ? dots.reduce((sum, status) => sum + (status.value ?? 0), 0) : 0;
  const provoke = statuses.find((status) => status.kind === "provoke");
  unit.provokeTicks = provoke?.turns ?? 0;
  unit.provokeTargetId = provoke?.linkedUnitId;
  if (!unit.statusImmuneIsPassive) unit.statusImmuneTurns = turns("immunity");
  unit.hotTurns = turns("hot");
  unit.hotAmount = statuses
    .filter((status) => status.kind === "hot")
    .reduce((sum, status) => sum + (status.value ?? 0), 0);
  unit.damageReductionTurns = turns("damage_reduction");
  unit.damageTakenMul = statuses.some((status) => status.kind === "damage_reduction")
    ? 1 -
      Math.max(
        ...statuses
          .filter((status) => status.kind === "damage_reduction")
          .map((status) => status.amount ?? 0),
      )
    : undefined;
  const share = statuses.find((status) => status.kind === "damage_share");
  unit.damageShareTurns = share?.turns ?? 0;
  unit.damageSharePct = share?.amount;
  unit.damageShareTargetId = share?.linkedUnitId;
  const reflect = statuses.find((status) => status.kind === "reflect");
  unit.reflectTurns = reflect?.turns ?? 0;
  unit.reflectPct = reflect?.amount;
}

/** Resolve periodic payloads at the start of this unit's turn. */
export function tickUnitStatuses(unit: Unit): {
  dotDamage: number;
  hotHeal: number;
} {
  const statuses = ensureStatuses(unit);
  const dotDamage = statuses
    .filter((status) => status.kind === "dot" || status.kind === "burn" || status.kind === "poison")
    .reduce((sum, status) => sum + Math.max(0, status.value ?? 0), 0);
  const hotHeal = statuses
    .filter((status) => status.kind === "hot")
    .reduce((sum, status) => sum + Math.max(0, status.value ?? 0), 0);
  return {
    dotDamage: Math.round(dotDamage),
    hotHeal: Math.round(hotHeal),
  };
}

/** Expire durations after this unit acts (or loses its action to control). */
export function advanceUnitStatuses(
  unit: Unit,
  statusIds?: ReadonlySet<string>,
): number {
  const statuses = ensureStatuses(unit);
  for (const status of statuses) {
    if (!statusIds || statusIds.has(status.id)) status.turns -= 1;
  }
  const expiredShield = statuses
    .filter((status) => status.kind === "shield" && status.turns <= 0)
    .reduce((sum, status) => sum + Math.max(0, status.value ?? 0), 0);
  unit.statuses = statuses.filter((status) => status.turns > 0);
  syncLegacyStatuses(unit);
  return Math.round(expiredShield);
}

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

function burnTurns(u: Unit): number {
  return ensureStatuses(u)
    .filter((s) => s.kind === "burn")
    .reduce((max, s) => Math.max(max, s.turns), 0);
}
function poisonTurns(u: Unit): number {
  return ensureStatuses(u)
    .filter((s) => s.kind === "poison")
    .reduce((max, s) => Math.max(max, s.turns), 0);
}

export function listUnitStatuses(u: Unit): UnitStatusIcon[] {
  if (!u.alive) return [];
  ensureStatuses(u);
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
  push(out, "crit-down", u.critRateDebuffTicks ?? 0, "debuff", (u.critRateDebuff ?? 0) > 0);
  push(out, "cdmg-down", u.critDmgDebuffTicks ?? 0, "debuff", (u.critDmgDebuff ?? 0) > 0);
  push(out, "acc-down", u.accuracyDebuffTicks ?? 0, "debuff", (u.accuracyDebuff ?? 0) > 0);
  push(out, "stun", u.stunnedTurns ?? 0, "debuff", (u.stunnedTurns ?? 0) > 0);
  push(out, "freeze", u.frozenTurns ?? 0, "debuff", (u.frozenTurns ?? 0) > 0);
  push(out, "sleep", u.sleepingTurns ?? 0, "debuff", (u.sleepingTurns ?? 0) > 0);
  push(
    out,
    "provoke",
    u.provokeTicks ?? 0,
    "debuff",
    (u.provokeTicks ?? 0) > 0,
  );
  push(out, "dot", u.dotTicks ?? 0, "debuff", (u.dotTicks ?? 0) > 0);
  push(out, "burn", burnTurns(u), "debuff", burnTurns(u) > 0);
  push(out, "poison", poisonTurns(u), "debuff", poisonTurns(u) > 0);
  push(out, "hot", u.hotTurns ?? 0, "buff", (u.hotTurns ?? 0) > 0);
  push(out, "heal-block", u.healBlockTurns ?? 0, "debuff", (u.healBlockTurns ?? 0) > 0);
  push(out, "silence", u.silenceTurns ?? 0, "debuff", (u.silenceTurns ?? 0) > 0);
  push(out, "damage-reduction", u.damageReductionTurns ?? 0, "buff", (u.damageReductionTurns ?? 0) > 0);
  push(out, "damage-share", u.damageShareTurns ?? 0, "buff", (u.damageShareTurns ?? 0) > 0);
  push(out, "reflect", u.reflectTurns ?? 0, "buff", (u.reflectTurns ?? 0) > 0);
  return out.slice(0, MAX_ICONS);
}
