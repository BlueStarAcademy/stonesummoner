import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getMonster } from "stonesummoner-data";
import {
  clampAmplify,
  computeDamage,
  defenseMitigation,
  elementMultiplier,
  elementRelation,
  ELEMENT_ADVANTAGE_CRIT_BONUS,
} from "./damage.js";

describe("damage", () => {
  it("applies SW fire/water/wind triangle", () => {
    assert.equal(elementRelation("fire", "wind"), "advantage");
    assert.equal(elementRelation("wind", "water"), "advantage");
    assert.equal(elementRelation("water", "fire"), "advantage");
    assert.equal(elementRelation("fire", "water"), "disadvantage");
    assert.equal(elementRelation("wind", "fire"), "disadvantage");
    assert.equal(elementRelation("water", "wind"), "disadvantage");
    assert.equal(elementMultiplier("fire", "wind"), 1.15);
    assert.equal(elementMultiplier("fire", "water"), 0.85);
    assert.equal(elementMultiplier("fire", "fire"), 1);
  });

  it("applies SW light/dark mutual advantage", () => {
    assert.equal(elementRelation("light", "dark"), "advantage");
    assert.equal(elementRelation("dark", "light"), "advantage");
    assert.equal(elementRelation("light", "fire"), "neutral");
    assert.equal(elementRelation("dark", "water"), "neutral");
    assert.equal(elementMultiplier("light", "dark"), 1.15);
    assert.equal(elementMultiplier("dark", "light"), 1.15);
  });

  it("uses Summoners War defense mitigation", () => {
    assert.ok(Math.abs(defenseMitigation(0) - 1000 / 1140) < 1e-9);
    const mid = defenseMitigation(180);
    assert.ok(mid > 0.52 && mid < 0.58);
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

  it("grants SW advantage crit bonus", () => {
    assert.equal(ELEMENT_ADVANTAGE_CRIT_BONUS, 15);
    // rng just below base critRate → no crit without bonus; with +15 it crits
    const disadv = computeDamage({
      atk: 100,
      skillCoeff: 1,
      attackerElement: "fire",
      defenderElement: "water",
      defenderDef: 0,
      amplify: 1,
      critRate: 10,
      critDmg: 50,
      rng: () => 0.2,
    });
    assert.equal(disadv.crit, false);
    assert.equal(disadv.elementRelation, "disadvantage");
    const adv = computeDamage({
      atk: 100,
      skillCoeff: 1,
      attackerElement: "fire",
      defenderElement: "wind",
      defenderDef: 0,
      amplify: 1,
      critRate: 10,
      critDmg: 50,
      rng: () => 0.2,
    });
    assert.equal(adv.crit, true);
    assert.equal(adv.elementRelation, "advantage");
  });

  it("takes several S1 hits to KO an even 3-star attacker", () => {
    const mon = getMonster("wolf_fighter_fire")!;
    const s1 = mon.skills[0]!.effects.find((e) => e.kind === "damage");
    assert.ok(s1 && s1.kind === "damage");
    const hit = computeDamage({
      atk: mon.baseStats.atk,
      skillCoeff: s1.coeff,
      attackerElement: "fire",
      defenderElement: "fire",
      defenderDef: mon.baseStats.def,
      amplify: 1,
      critRate: 0,
      critDmg: 50,
      rng: () => 0.5,
    });
    const hitsToKill = mon.baseStats.hp / hit.damage;
    assert.ok(hitsToKill >= 6 && hitsToKill <= 10, `hitsToKill=${hitsToKill}`);
  });

  it("clamps amplify", () => {
    assert.equal(clampAmplify(2, 1.25, 1.25), 1.25);
    assert.equal(clampAmplify(0.5, 1.25, 1.25), 0.85);
  });
});
