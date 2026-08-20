import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { amplifyCapFromPowerDelta, estimateCombatPower } from "./power.js";

describe("power / amplify cap", () => {
  it("estimates combat power from stats", () => {
    const p = estimateCombatPower([
      {
        stats: {
          hp: 500,
          atk: 100,
          def: 40,
          spd: 100,
          critRate: 15,
          critDmg: 50,
        },
      },
    ]);
    assert.ok(p > 500);
  });

  it("tightens amplify cap when underpowered", () => {
    assert.equal(amplifyCapFromPowerDelta(-1600), 1.1);
    assert.equal(amplifyCapFromPowerDelta(-800), 1.18);
    assert.equal(amplifyCapFromPowerDelta(0), 1.25);
  });
});
