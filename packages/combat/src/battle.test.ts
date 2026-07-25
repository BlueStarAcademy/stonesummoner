import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Battle, makeUnit } from "./battle.js";
import type { SummonerState, Unit } from "./types.js";

function summonerState(unitId: string, mana = 0): SummonerState {
  return {
    unitId,
    mana,
    manaMax: 100,
    manaRegenPerTick: 0.5,
    boardSense: 0,
  };
}

function roster(): Unit[] {
  return [
    makeUnit({
      id: "a-sum",
      name: "AllySummoner",
      team: "ally",
      kind: "summoner",
      element: "light",
      stats: { hp: 500, atk: 80, def: 40, spd: 100, critRate: 15, critDmg: 50 },
      skillCoeff: 1,
    }),
    makeUnit({
      id: "a-m1",
      name: "AllyMon",
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

describe("Battle flow", () => {
  it("runs stone then skill on a turn", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    const unit = b.tickUntilReady();
    assert.ok(unit);
    assert.equal(b.phase, "await_stone");
    assert.equal(b.autoStone(), true);
    assert.equal(b.phase, "await_skill");
    const hits = b.useSkill();
    assert.ok(hits.length >= 1);
    assert.ok(hits[0]!.damage > 0);
  });

  it("summoner skill when mana full hits all enemies", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum", 100),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    // Force ally summoner turn
    for (const u of b.units) {
      u.atb = u.id === "a-sum" ? 100 : 0;
    }
    const unit = b.tickUntilReady();
    assert.equal(unit?.id, "a-sum");
    b.autoStone();
    const hits = b.useSkill({ useSummonerSkill: true });
    assert.equal(hits.length, 2);
    assert.ok(hits.every((h) => h.usedSummonerSkill));
    assert.equal(b.allySummoner.mana, 0);
  });

  it("enemy summoner death is ally win", () => {
    const units = roster();
    const enemySum = units.find((u) => u.id === "e-sum")!;
    enemySum.hp = 1;
    enemySum.stats.hp = 1;
    const b = new Battle({
      boardSize: 5,
      units,
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const u of b.units) {
      u.atb = u.id === "a-m1" ? 100 : 0;
    }
    b.tickUntilReady();
    b.autoStone();
    b.useSkill({ targetId: "e-sum" });
    assert.equal(b.finishReason, "ally_win");
  });

  it("auto turns progress battle", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (let i = 0; i < 20 && !b.finishReason; i++) {
      b.runAutoTurn();
    }
    assert.ok(b.log.length > 0);
  });
});
