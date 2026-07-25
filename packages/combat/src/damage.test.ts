import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clampAmplify,
  computeDamage,
  elementMultiplier,
} from "./damage.js";

describe("damage", () => {
  it("applies element advantage", () => {
    assert.equal(elementMultiplier("fire", "wind"), 1.15);
    assert.equal(elementMultiplier("fire", "water"), 0.85);
    assert.equal(elementMultiplier("fire", "fire"), 1);
  });

  it("scales with amplify", () => {
    const low = computeDamage({
      atk: 100,
      skillCoeff: 1,
      attackerElement: "fire",
      defenderElement: "fire",
      defenderDef: 0,
      amplify: 1,
      critRate: 0,
      critDmg: 50,
      rng: () => 0.5,
    });
    const high = computeDamage({
      atk: 100,
      skillCoeff: 1,
      attackerElement: "fire",
      defenderElement: "fire",
      defenderDef: 0,
      amplify: 1.25,
      critRate: 0,
      critDmg: 50,
      rng: () => 0.5,
    });
    assert.ok(high.damage > low.damage);
  });

  it("clamps amplify", () => {
    assert.equal(clampAmplify(2, 1.25, 1.25), 1.25);
    assert.equal(clampAmplify(0.5, 1.25, 1.25), 0.85);
  });
});
