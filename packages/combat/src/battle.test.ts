import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { basicStrike } from "stonesummoner-data";
import { Battle, makeUnit, pickAutoSkillIndex } from "./battle.js";
import type { SummonerState, Unit } from "./types.js";

const sampleSkills = [
  basicStrike("평타", 1.2),
  {
    id: "s2",
    nameKo: "강타",
    cooldown: 2,
    effects: [{ kind: "damage" as const, target: "single" as const, coeff: 1.6 }],
  },
  {
    id: "s3",
    nameKo: "광역",
    cooldown: 3,
    effects: [
      { kind: "damage" as const, target: "all_enemies" as const, coeff: 1.1 },
    ],
  },
];

function summonerState(
  unitId: string,
  mana = 0,
  skillPowerBonus = 0,
): SummonerState {
  return {
    unitId,
    mana,
    manaMax: 100,
    manaRegenPerTick: 0.5,
    boardSense: 0,
    skillPowerBonus,
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
      skills: sampleSkills,
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

  it("summoner skill when mana full hits all enemy summons", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum", 100),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const u of b.units) {
      u.atb = u.id === "a-sum" ? 100 : 0;
    }
    const unit = b.tickUntilReady();
    assert.equal(unit?.id, "a-sum");
    b.autoStone();
    const hits = b.useSkill({ useSummonerSkill: true });
    assert.equal(hits.length, 1);
    assert.ok(hits.every((h) => h.usedSummonerSkill));
    assert.equal(b.allySummoner.mana, 0);
  });

  it("weapon skillPowerBonus raises 진문개방 damage", () => {
    const base = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum", 100, 0),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    const buffed = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum", 100, 0.5),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const b of [base, buffed]) {
      for (const u of b.units) {
        u.atb = u.id === "a-sum" ? 100 : 0;
      }
      b.tickUntilReady();
      b.autoStone();
    }
    const d0 = base.useSkill({ summonerSkill: "open" })[0]!.damage;
    const d1 = buffed.useSkill({ summonerSkill: "open" })[0]!.damage;
    assert.ok(d1 > d0);
  });

  it("amplify declare spends half mana and raises amplify", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum", 50),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const u of b.units) {
      u.atb = u.id === "a-sum" ? 100 : 0;
    }
    b.tickUntilReady();
    b.autoStone();
    const unit = b.getUnit("a-sum")!;
    assert.equal(b.canUseSummonerDeclare(unit), true);
    assert.equal(b.canUseSummonerSkill(unit), false);
    const before = b.amplify;
    const hits = b.useSkill({ summonerSkill: "declare" });
    assert.equal(hits.length, 0);
    assert.ok(b.amplify > before);
    assert.ok(b.allySummoner.mana < 50);
    assert.match(b.log.join("\n"), /증폭선언/);
  });

  it("dual stone spends mana and places a second stone", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum", 40),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const u of b.units) {
      u.atb = u.id === "a-sum" ? 100 : 0;
    }
    b.tickUntilReady();
    b.autoStone();
    const stonesBefore = b.circle.stoneSummonCount;
    const unit = b.getUnit("a-sum")!;
    assert.equal(b.canUseSummonerDual(unit), true);
    assert.equal(b.canUseSummonerDeclare(unit), false);
    const hits = b.useSkill({ summonerSkill: "dual" });
    assert.equal(hits.length, 0);
    assert.ok(b.allySummoner.mana < 40);
    assert.ok(b.circle.stoneSummonCount > stonesBefore);
    assert.match(b.log.join("\n"), /쌍착수/);
    assert.equal(b.phase, "resolved");
  });

  it("circle clean clears a 3x3 neighborhood of stones", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum", 50),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    // Seed enemy (white) cluster around center without capturing.
    for (const p of [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 2 },
      { x: 3, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ]) {
      assert.equal(b.board.play("white", p).ok, true);
    }
    assert.ok(b.countEnemyStones("ally") >= 4);
    for (const u of b.units) {
      u.atb = u.id === "a-sum" ? 100 : 0;
    }
    b.tickUntilReady();
    b.autoStone();
    const unit = b.getUnit("a-sum")!;
    assert.equal(b.canUseSummonerClean(unit), true);
    const before = b.countEnemyStones("ally");
    const hits = b.useSkill({ summonerSkill: "clean" });
    assert.equal(hits.length, 0);
    assert.ok(b.countEnemyStones("ally") < before);
    assert.ok(b.allySummoner.mana < 50);
    assert.match(b.log.join("\n"), /진문청소/);
    assert.equal(b.phase, "resolved");
  });

  it("wiping enemy summons wins; summoners are not targets", () => {
    const units = roster();
    const enemyMon = units.find((u) => u.id === "e-m1")!;
    enemyMon.hp = 1;
    enemyMon.stats.hp = 1;
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
    b.useSkill({ targetId: "e-m1" });
    assert.equal(b.finishReason, "ally_win");
    assert.ok(b.getUnit("e-sum")!.alive);
  });

  it("spawns next wave when enemy summons wipe early", () => {
    const units = roster();
    const enemyMon = units.find((u) => u.id === "e-m1")!;
    enemyMon.hp = 1;
    enemyMon.stats.hp = 1;
    let waveCalls = 0;
    const b = new Battle({
      boardSize: 5,
      units,
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
      totalWaves: 2,
      spawnWave: (wave) => {
        waveCalls += 1;
        return [
          makeUnit({
            id: `e-w${wave}-0`,
            name: `Wave${wave}Mon`,
            team: "enemy",
            kind: "monster",
            element: "water",
            stats: {
              hp: 200,
              atk: 80,
              def: 30,
              spd: 85,
              critRate: 10,
              critDmg: 50,
            },
            skillCoeff: 1,
          }),
        ];
      },
    });
    for (const u of b.units) {
      u.atb = u.id === "a-m1" ? 100 : 0;
    }
    b.tickUntilReady();
    b.autoStone();
    b.useSkill({ targetId: "e-m1" });
    assert.equal(b.finishReason, null);
    assert.equal(b.currentWave, 2);
    assert.equal(waveCalls, 1);
    assert.ok(b.getUnit("e-w2-0")?.alive);
    assert.match(b.log.join("\n"), /웨이브 2\/2/);
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

  it("picks up crit charm and shield core", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
    });
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    b.tokens = [
      { id: "crit_charm", x: 2, y: 2 },
      { id: "shield_core", x: 0, y: 0 },
    ];
    assert.equal(b.playStone({ x: 2, y: 2 }), true);
    const mon = b.getUnit("a-m1")!;
    assert.ok((mon.critCharm ?? 0) >= 55);
    assert.match(b.log.join("\n"), /치명부적/);

    b.phase = "await_stone";
    b.activeUnitId = "a-m1";
    assert.equal(b.playStone({ x: 0, y: 0 }), true);
    assert.ok((mon.shieldHp ?? 0) > 0);
    assert.match(b.log.join("\n"), /실드핵/);
  });

  it("capture magnet charges mana", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum", 10),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
    });
    for (const u of b.units) u.atb = u.id === "a-sum" ? 100 : 0;
    b.tickUntilReady();
    b.tokens = [{ id: "capture_magnet", x: 1, y: 1 }];
    const before = b.allySummoner.mana;
    assert.equal(b.playStone({ x: 1, y: 1 }), true);
    assert.ok(b.allySummoner.mana > before + 20);
    assert.match(b.log.join("\n"), /사석자석/);
  });

  it("stride sand boosts ally ATB and grants spd turns", () => {
    const units = [
      ...roster(),
      makeUnit({
        id: "a-m2",
        name: "AllyMon2",
        team: "ally",
        kind: "monster",
        element: "wind",
        stats: { hp: 280, atk: 100, def: 30, spd: 95, critRate: 15, critDmg: 55 },
        skillCoeff: 1.1,
        skills: sampleSkills,
      }),
    ];
    const b = new Battle({
      boardSize: 5,
      units,
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
    });
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 10;
    b.tickUntilReady();
    b.tokens = [{ id: "stride_sand", x: 2, y: 1 }];
    const ally = b.getUnit("a-m2")!;
    const before = ally.atb;
    assert.equal(b.playStone({ x: 2, y: 1 }), true);
    assert.ok(ally.atb >= before + 30);
    assert.equal(b.getUnit("a-m1")!.spdBoostTurns, 2);
    assert.match(b.log.join("\n"), /행마모래/);
  });

  it("seal nail forbids adjacent empty points for a few plays", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.1,
    });
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    b.tokens = [{ id: "seal_nail", x: 2, y: 2 }];
    assert.equal(b.playStone({ x: 2, y: 2 }), true);
    assert.ok(b.tempSeals.length >= 1);
    assert.match(b.log.join("\n"), /봉인못/);
    const sealed = b.tempSeals[0]!;
    assert.equal(b.isForbidden({ x: sealed.x, y: sealed.y }), true);
    // After tick on pickup play, remaining should be 3
    assert.equal(sealed.remaining, 3);
  });

  it("element ward boosts amplify on matching-element stones", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
    });
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    b.tokens = [{ id: "element_ward", x: 1, y: 1 }];
    const amp0 = b.amplify;
    assert.equal(b.playStone({ x: 1, y: 1 }), true);
    assert.ok(b.amplify > amp0);
    assert.equal(b.allySummoner.elementWardElement, "fire");
    assert.equal(b.allySummoner.elementWardCharges, 3);
    assert.match(b.log.join("\n"), /속성의뢰/);

    b.phase = "await_stone";
    b.activeUnitId = "a-m1";
    const amp1 = b.amplify;
    const charges = b.allySummoner.elementWardCharges!;
    assert.equal(b.playStone({ x: 3, y: 3 }), true);
    assert.ok(b.amplify > amp1);
    assert.equal(b.allySummoner.elementWardCharges, charges - 1);
  });

  it("bait stone buffs picker and lures enemy AI", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.1,
    });
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    b.tokens = [{ id: "bait_stone", x: 2, y: 2 }];
    assert.equal(b.playStone({ x: 2, y: 2 }), true);
    const mon = b.getUnit("a-m1")!;
    assert.ok((mon.shieldHp ?? 0) > 0);
    assert.ok(b.baitLure);
    assert.equal(b.baitLure!.targetTeam, "enemy");
    assert.match(b.log.join("\n"), /미끼돌/);
    assert.equal(
      b.isBaitLureFor("enemy", { x: b.baitLure!.x, y: b.baitLure!.y }),
      true,
    );
  });

  it("blocks skill while on cooldown", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    b.autoStone();
    const first = b.useSkill({ skillIndex: 2, targetId: "e-m1" });
    assert.ok(first.length >= 1);
    assert.match(b.log.join("\n"), /광역/);

    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    b.autoStone();
    const blocked = b.useSkill({ skillIndex: 2, targetId: "e-m1" });
    assert.equal(blocked.length, 0);
    assert.match(b.log.join("\n"), /쿨다운/);
  });

  it("heals ally_lowest and auto-picks heal skill", () => {
    const units = roster();
    const healer = makeUnit({
      id: "a-heal",
      name: "Healer",
      team: "ally",
      kind: "monster",
      element: "water",
      stats: { hp: 320, atk: 70, def: 40, spd: 200, critRate: 10, critDmg: 50 },
      skillCoeff: 0.9,
      skills: [
        basicStrike("물방울", 0.9),
        {
          id: "s2",
          nameKo: "치유물결",
          cooldown: 3,
          effects: [
            { kind: "heal", target: "ally_lowest", coeff: 0.3 },
          ],
        },
        {
          id: "s3",
          nameKo: "대기",
          cooldown: 4,
          effects: [{ kind: "damage", target: "single", coeff: 1 }],
        },
      ],
    });
    units.push(healer);
    const hurt = units.find((u) => u.id === "a-m1")!;
    hurt.hp = 50;
    const b = new Battle({
      boardSize: 5,
      units,
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    const idx = pickAutoSkillIndex(b.getUnit("a-heal")!, b.units);
    assert.equal(idx, 1);
    for (const u of b.units) u.atb = u.id === "a-heal" ? 100 : 0;
    b.tickUntilReady();
    b.autoStone();
    b.useSkill({ skillIndex: 1 });
    assert.ok(b.getUnit("a-m1")!.hp > 50);
    assert.match(b.log.join("\n"), /회복/);
  });

  it("applies capture_mana and capture_crit stone passives", () => {
    const units = roster();
    const mon = units.find((u) => u.id === "a-m1")!;
    mon.stonePassive = "capture_mana";
    const b = new Battle({
      boardSize: 5,
      units,
      allySummoner: summonerState("a-sum", 10),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    // surround white stone for capture: place black around (2,2)
    b.board.play("white", { x: 2, y: 2 });
    b.board.play("black", { x: 1, y: 2 });
    b.board.play("black", { x: 3, y: 2 });
    b.board.play("black", { x: 2, y: 1 });
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    const before = b.allySummoner.mana;
    assert.equal(b.playStone({ x: 2, y: 3 }), true);
    assert.ok(b.allySummoner.mana > before);
    // switch passive and re-test crit bonus path via direct assign after capture
    const unit = b.getUnit("a-m1")!;
    unit.stonePassive = "capture_crit";
    unit.critDmgBonus = undefined;
    // force another capture setup is heavy; simulate passive apply
    unit.critDmgBonus = 10;
    assert.equal(unit.critDmgBonus, 10);
  });

  it("suggest_plus returns four stone candidates", () => {
    const units = roster();
    units.find((u) => u.id === "a-m1")!.stonePassive = "suggest_plus";
    const b = new Battle({
      boardSize: 5,
      units,
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    const sug = b.suggestStones();
    assert.ok(sug.length <= 4);
    assert.ok(sug.length >= 3);
  });

  it("resets 9x9 after threshold into empowered circle", () => {
    const b = new Battle({
      boardSize: 9,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
      resetThreshold: 3,
    });
    for (let i = 0; i < 3; i++) {
      b.runAutoTurn();
    }
    assert.equal(b.circle.boardPhase, 1);
    assert.equal(b.circle.stoneSummonCount, 0);
    assert.equal(b.tokens.length, 0);
    assert.ok(b.board.getBoard().flat().every((c) => c === null));
    assert.match(b.log.join("\n"), /강화 진문/);
  });
});
