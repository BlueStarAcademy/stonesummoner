import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Battle, makeUnit } from "./battle.js";
import type { SummonerState, Unit } from "./types.js";

function summonerState(unitId: string, mana = 40): SummonerState {
  return {
    unitId,
    mana,
    manaMax: 100,
    manaRegenPerTick: 1,
    boardSense: 0,
  };
}

function units(): Unit[] {
  return [
    makeUnit({
      id: "a-sum",
      name: "AllySummoner",
      team: "ally",
      kind: "summoner",
      element: "fire",
      stats: { hp: 500, atk: 80, def: 40, spd: 120, critRate: 15, critDmg: 50 },
      skillCoeff: 1,
    }),
    makeUnit({
      id: "a-m1",
      name: "AllyFire",
      team: "ally",
      kind: "monster",
      element: "fire",
      stats: { hp: 300, atk: 120, def: 30, spd: 90, critRate: 20, critDmg: 60 },
      skillCoeff: 1.2,
    }),
    makeUnit({
      id: "e-sum",
      name: "EnemySummoner",
      team: "enemy",
      kind: "summoner",
      element: "dark",
      stats: { hp: 500, atk: 70, def: 40, spd: 80, critRate: 10, critDmg: 50 },
      skillCoeff: 1,
    }),
    makeUnit({
      id: "e-m1",
      name: "EnemyMon",
      team: "enemy",
      kind: "monster",
      element: "water",
      stats: { hp: 280, atk: 100, def: 35, spd: 85, critRate: 15, critDmg: 50 },
      skillCoeff: 1.1,
    }),
  ];
}

describe("Modules E/F", () => {
  it("enables module E affinity and summoner stone bonus", () => {
    const b = new Battle({
      boardSize: 5,
      units: units(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      modules: { moduleE: true },
      circleElement: "fire",
      rng: () => 0.1,
    });
    assert.equal(b.circleElement, "fire");
    assert.match(b.log.join("\n"), /속성진/);

    const u = b.tickUntilReady();
    assert.ok(u);
    const beforeAmp = b.amplify;
    const beforeMana = b.allySummoner.mana;
    assert.equal(b.playStone({ x: 2, y: 2 }), true);
    assert.ok(b.amplify >= beforeAmp);
    assert.ok(b.allySummoner.mana >= beforeMana);
    assert.ok(
      b.log.some((l) => /속성 테두리|서머너 착수/.test(l)),
      b.log.slice(-8).join(" | "),
    );
  });

  it("enables module F victory point and mana seal", () => {
    const b = new Battle({
      boardSize: 5,
      units: units(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      modules: { moduleF: true },
      rng: () => 0.1,
    });
    assert.equal(b.manaSealed, true);
    assert.deepEqual(b.victoryPoint, { x: 2, y: 2 });
    assert.match(b.log.join("\n"), /필승점/);

    const u = b.tickUntilReady();
    assert.ok(u);
    assert.equal(b.playStone({ x: 2, y: 2 }), true);
    assert.equal(b.victoryPointClaimed, true);
    assert.equal(b.manaSealed, false);
    assert.ok(b.log.some((l) => /필승점 해금/.test(l)));
  });
});
