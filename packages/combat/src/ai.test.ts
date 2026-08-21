import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickDefaultTarget, rankStoneSuggestions } from "./ai.js";
import { makeUnit } from "./battle.js";

describe("ai helpers", () => {
  it("ranks top 3 stone suggestions by capture then center", () => {
    const legal = [
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 1, y: 1 },
      { x: 4, y: 4 },
    ];
    const ranked = rankStoneSuggestions(legal, 5, (p) => ({
      capturedCount: p.x === 1 && p.y === 1 ? 2 : 0,
      hasToken: p.x === 4,
    }));
    assert.equal(ranked.length, 3);
    assert.equal(ranked[0]!.point.x, 1);
    assert.equal(ranked[0]!.capturedCount, 2);
    assert.equal(ranked[0]!.manaGain, 0);
    assert.equal(ranked[0]!.captureManaFrac, 0.24);
    assert.equal(ranked[0]!.captureDamageBonus, 0.2);
  });

  it("ranks bait lure above empty center when no capture", () => {
    const legal = [
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 4, y: 0 },
    ];
    const ranked = rankStoneSuggestions(legal, 5, (p) => ({
      capturedCount: 0,
      hasToken: false,
      baitLure: p.x === 4 && p.y === 0,
    }));
    assert.equal(ranked[0]!.point.x, 4);
  });

  it("never targets summoners", () => {
    const units = [
      makeUnit({
        id: "e-sum",
        name: "S",
        team: "enemy",
        kind: "summoner",
        element: "dark",
        stats: { hp: 100, atk: 1, def: 1, spd: 1, critRate: 0, critDmg: 50 },
        skillCoeff: 1,
      }),
      makeUnit({
        id: "e-m",
        name: "M",
        team: "enemy",
        kind: "monster",
        element: "fire",
        stats: { hp: 50, atk: 1, def: 1, spd: 1, critRate: 0, critDmg: 50 },
        skillCoeff: 1,
      }),
    ];
    const t = pickDefaultTarget(units);
    assert.equal(t?.id, "e-m");
  });
});
