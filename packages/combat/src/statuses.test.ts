import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addStatus,
  advanceUnitStatuses,
  hasStatus,
  listUnitStatuses,
  removeStatuses,
  tickUnitStatuses,
} from "./statuses.js";
import type { Unit } from "./types.js";

function unit(partial: Partial<Unit> = {}): Unit {
  return {
    id: "u1",
    name: "Unit",
    team: "ally",
    kind: "monster",
    element: "fire",
    stats: { hp: 100, atk: 10, def: 10, spd: 10, critRate: 10, critDmg: 50 },
    hp: 100,
    atb: 0,
    skillCoeff: 1,
    alive: true,
    ...partial,
  };
}

describe("listUnitStatuses", () => {
  it("returns nothing for a clean living unit", () => {
    assert.deepEqual(listUnitStatuses(unit()), []);
  });

  it("hides statuses on KO", () => {
    assert.deepEqual(
      listUnitStatuses(
        unit({ alive: false, atkBuffPct: 0.3, atkBuffTicks: 2 }),
      ),
      [],
    );
  });

  it("lists buffs then control then debuffs", () => {
    const icons = listUnitStatuses(
      unit({
        atkBuffPct: 0.25,
        atkBuffTicks: 3,
        shieldHp: 40,
        shieldTurns: 2,
        stunnedTurns: 1,
        atkDebuffPct: 0.2,
        atkDebuffTicks: 2,
        dotTicks: 4,
      }),
    );
    assert.deepEqual(
      icons.map((s) => s.id),
      ["atk-up", "shield", "atk-down", "stun", "dot"],
    );
    assert.equal(icons[0]?.ticks, 3);
    assert.equal(icons[1]?.polarity, "buff");
    assert.equal(icons[3]?.polarity, "debuff");
  });

  it("shows shield without a turn chip when only HP remains", () => {
    const icons = listUnitStatuses(unit({ shieldHp: 12 }));
    assert.deepEqual(icons, [{ id: "shield", ticks: 0, polarity: "buff" }]);
  });

  it("does not expose permanent equipment passives as unit icons", () => {
    const icons = listUnitStatuses(
      unit({
        shieldHp: 12,
        shieldTurns: 3,
        shieldStatusVisible: false,
        statusImmuneTurns: 1,
        statusImmuneIsPassive: true,
        counterChance: 15,
        lifestealPct: 35,
      }),
    );
    assert.deepEqual(icons, []);
  });

  it("tracks source, replace/stack semantics, owner turns, and dispellability", () => {
    const target = unit();
    addStatus(target, {
      kind: "atk_up",
      sourceUnitId: "caster-a",
      polarity: "buff",
      turns: 2,
      stacking: "replace",
      dispellable: true,
      amount: 0.2,
    });
    addStatus(target, {
      kind: "atk_up",
      sourceUnitId: "caster-b",
      polarity: "buff",
      turns: 3,
      stacking: "replace",
      dispellable: true,
      amount: 0.3,
    });
    addStatus(target, {
      kind: "dot",
      sourceUnitId: "caster-a",
      polarity: "debuff",
      turns: 2,
      stacking: "stack",
      dispellable: true,
      value: 10,
    });
    addStatus(target, {
      kind: "dot",
      sourceUnitId: "caster-b",
      polarity: "debuff",
      turns: 2,
      stacking: "stack",
      dispellable: false,
      value: 20,
    });
    assert.equal(target.statuses?.filter((status) => status.kind === "atk_up").length, 1);
    assert.equal(target.statuses?.find((status) => status.kind === "atk_up")?.sourceUnitId, "caster-b");
    assert.equal(target.statuses?.filter((status) => status.kind === "dot").length, 2);
    advanceUnitStatuses(target);
    assert.equal(target.atkBuffTicks, 2);
    assert.equal(removeStatuses(target, "debuff", 2).length, 1);
    assert.equal(target.statuses?.filter((status) => status.kind === "dot").length, 1);
  });
});

describe("burn and poison ticks", () => {
  it("ticks burn from ATK snapshot and poison from max HP", () => {
    const burned = unit({ stats: { hp: 1000, atk: 200, def: 50, spd: 100, critRate: 0, critDmg: 150 } });
    const poisoned = unit({ stats: { hp: 1000, atk: 200, def: 50, spd: 100, critRate: 0, critDmg: 150 } });
    addStatus(burned, {
      kind: "burn",
      sourceUnitId: "src",
      polarity: "debuff",
      turns: 2,
      stacking: "stack",
      dispellable: true,
      amount: 0.12,
      value: 24,
    });
    addStatus(poisoned, {
      kind: "poison",
      sourceUnitId: "src",
      polarity: "debuff",
      turns: 2,
      stacking: "stack",
      dispellable: true,
      amount: 0.05,
      value: 50,
    });
    assert.equal(tickUnitStatuses(burned).dotDamage, 24);
    assert.equal(tickUnitStatuses(poisoned).dotDamage, 50);
  });

  it("blocks immuneStatusKinds and cleanses burn/poison", () => {
    const target = unit({ immuneStatusKinds: ["burn"] });
    addStatus(target, {
      kind: "burn",
      sourceUnitId: "src",
      polarity: "debuff",
      turns: 2,
      stacking: "stack",
      dispellable: true,
      value: 10,
    });
    assert.equal(hasStatus(target, "burn"), false);
    addStatus(target, {
      kind: "poison",
      sourceUnitId: "src",
      polarity: "debuff",
      turns: 2,
      stacking: "stack",
      dispellable: true,
      value: 10,
    });
    assert.equal(hasStatus(target, "poison"), true);
    removeStatuses(target, "debuff", 1);
    assert.equal(hasStatus(target, "poison"), false);
  });
});
