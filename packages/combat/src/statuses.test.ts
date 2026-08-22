import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { listUnitStatuses } from "./statuses.js";
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
});
