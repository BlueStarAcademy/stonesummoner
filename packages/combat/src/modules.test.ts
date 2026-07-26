import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getStage } from "stonesummoner-data";
import { Battle, makeUnit } from "./battle.js";
import {
  BRILLIANT_MISSION_GOAL,
  modulesForStage,
} from "./modules.js";
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

describe("Modules E/F/G/H", () => {
  it("maps stage modes to module flags (H)", () => {
    const depth = getStage("depth_hwalro");
    const trial = getStage("trial_jinmun");
    const arena = getStage("arena_rookie");
    const raid = getStage("guild_raid_boss");
    assert.ok(depth && trial && arena && raid);
    assert.deepEqual(modulesForStage(depth), { moduleB: true });
    assert.equal(modulesForStage(trial).moduleG, true);
    assert.equal(modulesForStage(trial).forbidZone, true);
    assert.equal(modulesForStage(arena).manaRace, true);
    assert.equal(modulesForStage(raid).moduleF, true);
    const equip = getStage("equip_vault_1");
    assert.ok(equip);
    assert.equal(modulesForStage(equip).moduleD, true);
    assert.equal(modulesForStage(equip).moduleG, true);
  });

  it("enables dual boards for guild raid modules", () => {
    const mods = modulesForStage(getStage("guild_raid_boss")!);
    assert.equal(mods.dualBoard, true);
    const b = new Battle({
      boardSize: 5,
      units: units(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      modules: { dualBoard: true },
      rng: () => 0.1,
    });
    assert.equal(b.boards.length, 2);
    assert.equal(b.boardLabel, "A국");
    assert.equal(b.switchBoard("테스트"), true);
    assert.equal(b.boardLabel, "B국");
    assert.equal(b.activeBoardIndex, 1);
  });

  it("blocks forbidden zone plays", () => {
    const b = new Battle({
      boardSize: 5,
      units: units(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      modules: { forbidZone: true },
      rng: () => 0.1,
    });
    assert.equal(b.forbiddenZone.length, 1);
    const u = b.tickUntilReady();
    assert.ok(u);
    assert.equal(b.playStone({ x: 2, y: 2 }), false);
    assert.match(b.log.join("\n"), /금기구역/);
  });

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
      b.log.some((l) => /속성 테두리|소환사 착수/.test(l)),
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

  it("counts brilliant moves for module G", () => {
    const b = new Battle({
      boardSize: 5,
      units: units(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      modules: { moduleG: true },
      rng: () => 0.1,
    });
    assert.equal(b.brilliantGoal, BRILLIANT_MISSION_GOAL);
    assert.match(b.log.join("\n"), /묘수 미션/);

    const u = b.tickUntilReady();
    assert.ok(u);
    const top = b.suggestStones(u)[0]?.point;
    assert.ok(top);
    assert.equal(b.playStone(top), true);
    assert.equal(b.brilliantCount, 1);
    assert.ok(b.log.some((l) => /묘수!/.test(l)));
  });

  it("awards mana race when ally hits full mana", () => {
    const b = new Battle({
      boardSize: 5,
      units: units(),
      allySummoner: {
        ...summonerState("a-sum", 90),
        manaRegenPerTick: 0,
      },
      enemySummoner: {
        ...summonerState("e-sum"),
        manaRegenPerTick: 0,
      },
      modules: { manaRace: true, moduleE: true },
      circleElement: "water",
      rng: () => 0.1,
    });
    const u = b.tickUntilReady();
    assert.ok(u);
    assert.equal(u.kind, "summoner");
    assert.equal(b.manaRaceWinner, null);
    assert.equal(b.playStone({ x: 1, y: 1 }), true);
    assert.ok(b.allySummoner.mana >= b.allySummoner.manaMax);
    assert.equal(b.manaRaceWinner, "ally");
    assert.ok(b.log.some((l) => /맞마나 레이스: 아군/.test(l)));
  });
});
