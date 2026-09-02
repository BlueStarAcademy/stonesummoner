import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { basicStrike } from "stonesummoner-data";
import { Battle, makeUnit, pickAutoSkillIndex } from "./battle.js";
import { addStatus, hasStatus, statusesOf } from "./statuses.js";
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
  it("applies modern Cairos Giant, Dragon, and Necro boss rules", () => {
    const giantUnits = roster();
    giantUnits.push(
      makeUnit({
        id: "a-m2",
        name: "AllyTwo",
        team: "ally",
        kind: "monster",
        element: "wind",
        stats: { hp: 300, atk: 100, def: 30, spd: 80, critRate: 15, critDmg: 50 },
        skillCoeff: 1,
      }),
    );
    const giant = new Battle({
      boardSize: 5,
      units: giantUnits,
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
      dungeonBoss: { kind: "giant", unitId: "e-m1", abyss: true },
    });
    const hit = (
      giant as unknown as {
        applyHit: (
          attacker: Unit,
          target: Unit,
          coeff: number,
          summoner: boolean,
        ) => unknown;
      }
    ).applyHit.bind(giant);
    const attacker = giant.getUnit("a-m1")!;
    const boss = giant.getUnit("e-m1")!;
    const allyTwo = giant.getUnit("a-m2")!;
    for (let n = 0; n < 7; n++) hit(attacker, boss, 0.01, false);
    assert.ok(attacker.hp < attacker.stats.hp);
    assert.ok(allyTwo.hp < allyTwo.stats.hp);

    const necro = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
      dungeonBoss: { kind: "necro", unitId: "e-m1", abyss: true },
    });
    const necroHit = (
      necro as unknown as {
        applyHit: (
          attacker: Unit,
          target: Unit,
          coeff: number,
          summoner: boolean,
        ) => unknown;
      }
    ).applyHit.bind(necro);
    const necroBoss = necro.getUnit("e-m1")!;
    const before = necroBoss.hp;
    for (let n = 0; n < 7; n++) {
      necroHit(necro.getUnit("a-m1")!, necroBoss, 0.4, false);
    }
    assert.equal(necroBoss.hp, before);
    necroHit(necro.getUnit("a-m1")!, necroBoss, 0.4, false);
    assert.ok(necroBoss.hp < before);

    const dragon = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
      dungeonBoss: { kind: "dragon", unitId: "e-m1", abyss: true },
    });
    const dragonBoss = dragon.getUnit("e-m1")!;
    dragonBoss.defDebuffPct = 0.5;
    dragonBoss.defDebuffTicks = 2;
    dragon.phase = "await_skill";
    dragon.activeUnitId = dragonBoss.id;
    dragon.useSkill({ targetId: "a-m1" });
    assert.equal(dragonBoss.defDebuffPct, 0);
    assert.equal(dragonBoss.defDebuffTicks, 0);
  });

  it("applies a Shield-set start shield only to its wearer", () => {
    const units = roster();
    units.find((u) => u.id === "a-m1")!.startShieldPct = 0.15;
    units.push(
      makeUnit({
        id: "a-m2",
        name: "UnshieldedAlly",
        team: "ally",
        kind: "monster",
        element: "wind",
        stats: { hp: 400, atk: 90, def: 30, spd: 80, critRate: 15, critDmg: 50 },
        skillCoeff: 1,
      }),
    );
    const b = new Battle({
      boardSize: 5,
      units,
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
    });
    assert.equal(b.getUnit("a-m1")!.shieldHp, 45);
    assert.equal(b.getUnit("a-m2")!.shieldHp ?? 0, 0);
  });

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
    assert.ok(hits[0]!.skillId === "s1" || hits[0]!.skillId === "basic");
    assert.deepEqual(hits[0]!.effectKinds, ["damage"]);
    assert.equal(b.attackTurnCount, 1);
  });

  it("returns presentation metadata for a non-damaging skill", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    const unit = b.getUnit("a-m1")!;
    unit.skills = [
      ...unit.skills!,
      {
        id: "s4",
        vfxId: "monster:test:fire:s4",
        nameKo: "강화",
        cooldown: 2,
        effects: [
          {
            kind: "buff",
            target: "self",
            axis: "atk",
            amount: 0.2,
            turns: 2,
          },
        ],
      },
    ];
    unit.skillCd = [0, 0, 0, 0];
    for (const u of b.units) u.atb = 0;
    unit.atb = 100;
    assert.equal(b.tickUntilReady()?.id, "a-m1");
    assert.equal(b.autoStone(), true);
    const result = b.useSkill({ skillIndex: 3 });
    assert.equal(result.length, 0);
    assert.equal(b.lastSkillPresentation?.targetIds[0], "a-m1");
    assert.equal(b.lastSkillPresentation?.skillId, "s4");
    assert.equal(b.lastSkillPresentation?.vfxId, "monster:test:fire:s4");
    assert.deepEqual(b.lastSkillPresentation?.effectKinds, ["buff"]);
  });

  it("tracks ally damage actually applied to enemies", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const u of b.units) u.atb = 0;
    b.getUnit("a-m1")!.atb = 100;
    b.tickUntilReady();
    b.autoStone();
    const hpBefore = b.getUnit("e-m1")!.hp;
    b.useSkill({ targetId: "e-m1" });
    const hpAfter = b.getUnit("e-m1")!.hp;
    assert.ok(b.allyDamageDealt > 0);
    assert.equal(b.allyDamageDealt, hpBefore - hpAfter);
  });

  it("skips stone when the same team acts again (Go alternation)", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const u of b.units) u.atb = 0;
    b.getUnit("a-m1")!.atb = 100;
    const u1 = b.tickUntilReady();
    assert.equal(u1?.id, "a-m1");
    assert.equal(b.phase, "await_stone");
    assert.equal(b.autoStone(), true);
    assert.equal(b.lastStoneTeam, "ally");
    b.useSkill();
    // Same team again (summoner) — no stone.
    for (const u of b.units) u.atb = 0;
    b.getUnit("a-sum")!.atb = 100;
    const u2 = b.tickUntilReady();
    assert.equal(u2?.id, "a-sum");
    assert.equal(b.phase, "await_skill");
    assert.equal(b.lastStoneTeam, "ally");
  });

  it("places a stone on an enemy monster turn (not only summoners)", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const u of b.units) u.atb = 0;
    b.getUnit("a-m1")!.atb = 100;
    b.tickUntilReady();
    assert.equal(b.autoStone(), true);
    assert.equal(b.lastStoneTeam, "ally");
    b.useSkill();
    for (const u of b.units) u.atb = 0;
    b.getUnit("e-m1")!.atb = 100;
    const enemyMon = b.tickUntilReady();
    assert.equal(enemyMon?.id, "e-m1");
    assert.equal(enemyMon?.kind, "monster");
    assert.equal(b.phase, "await_stone");
    assert.equal(b.needsStoneFor("enemy"), true);
    assert.equal(b.autoStone(), true);
    assert.equal(b.lastStoneTeam, "enemy");
    assert.ok(b.lastStoneReport);
    assert.equal(b.lastStoneReport?.team, "enemy");
  });

  it("safe place grants mana without combat buff chips", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.1,
    });
    for (const u of b.units) u.atb = 0;
    b.getUnit("a-m1")!.atb = 100;
    b.tickUntilReady();
    const mana0 = b.allySummoner.mana;
    const amplify0 = b.currentAmplify();
    assert.equal(b.autoStone(), true);
    assert.ok(b.allySummoner.mana >= mana0 + 10);
    assert.equal(b.currentAmplify(), amplify0);
    assert.deepEqual(b.activeBoardBuffs("ally"), []);
    assert.match(b.log.join("\n"), /일반 소환: 마력/);
    const kinds = (b.lastStoneReport?.chips ?? []).map((c) => c.kind);
    assert.ok(kinds.includes("mana"));
    assert.equal(kinds.includes("atk"), false);
    assert.equal(kinds.includes("spd"), false);
    assert.equal(b.lastStoneReport?.showResultSheet, false);
    const mon = b.getUnit("a-m1")!;
    assert.equal(mon.atkBuffPct ?? 0, 0);
    assert.equal(mon.spdBuffPct ?? 0, 0);
    b.useSkill();
    for (const u of b.units) u.atb = 0;
    b.getUnit("a-sum")!.atb = 100;
    b.tickUntilReady();
    assert.equal(b.phase, "await_skill");
  });

  it("does not turn shape completion into a combat buff", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      modules: { moduleB: true },
      rng: () => 0.5,
    });
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    const amplify0 = b.currentAmplify();
    assert.equal(b.playStone({ x: 0, y: 0 }), true);
    assert.ok(b.lastStoneReport?.chips.some((chip) => chip.kind === "shape"));
    assert.equal(b.currentAmplify(), amplify0);
    assert.deepEqual(b.activeBoardBuffs("ally"), []);
    assert.equal(b.getUnit("a-m1")!.shieldHp ?? 0, 0);
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
      allySummoner: summonerState("a-sum", 32),
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

  it("circle guard shields wounded ally monsters", () => {
    const units = roster();
    const monSeed = units.find((u) => u.id === "a-m1")!;
    monSeed.hp = Math.floor(monSeed.stats.hp * 0.4);
    const b = new Battle({
      boardSize: 5,
      units,
      allySummoner: summonerState("a-sum", 40),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const u of b.units) {
      u.atb = u.id === "a-sum" ? 100 : 0;
    }
    b.tickUntilReady();
    b.autoStone();
    const unit = b.getUnit("a-sum")!;
    const mon = b.getUnit("a-m1")!;
    assert.equal(b.canUseSummonerGuard(unit), true);
    assert.equal(b.allyMonstersWounded("ally", 0.55), true);
    const beforeShield = mon.shieldHp ?? 0;
    const hits = b.useSkill({ summonerSkill: "guard" });
    assert.equal(hits.length, 0);
    assert.ok((mon.shieldHp ?? 0) > beforeShield);
    assert.ok(b.allySummoner.mana < 40);
    assert.match(b.log.join("\n"), /진문수호/);
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
    assert.equal(b.phase, "await_wave");
    assert.equal(b.currentWave, 1);
    assert.equal(waveCalls, 0);
    assert.equal(b.resolveWaveTransition(), true);
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
    assert.equal(b.activeBoardBuffs("ally")[0]?.critRateBonus, 75);
    assert.match(b.log.join("\n"), /치명부적/);
    const critChips = b.lastStoneReport?.chips ?? [];
    assert.ok(critChips.some((c) => c.kind === "token" && c.id === "crit_charm"));
    assert.ok(critChips.some((c) => c.kind === "crit"));

    b.phase = "await_stone";
    b.activeUnitId = "a-m1";
    assert.equal(b.playStone({ x: 0, y: 0 }), true);
    const shieldBuff = b.activeBoardBuffs("ally")[0];
    assert.ok((shieldBuff?.shieldByUnit?.["a-m1"] ?? 0) > 0);
    assert.ok((shieldBuff?.shieldByUnit?.["a-sum"] ?? 0) > 0);
    assert.match(b.log.join("\n"), /실드핵/);
    const shieldChips = b.lastStoneReport?.chips ?? [];
    assert.ok(shieldChips.some((c) => c.kind === "token" && c.id === "shield_core"));
    assert.ok(shieldChips.some((c) => c.kind === "shield"));
  });

  it("heal orb restores ally hp", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
    });
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    const mon = b.getUnit("a-m1")!;
    mon.hp = 100;
    b.tokens = [{ id: "heal_orb", x: 2, y: 2 }];
    assert.equal(b.playStone({ x: 2, y: 2 }), true);
    assert.ok(mon.hp > 100);
    assert.match(b.log.join("\n"), /회복구/);
    const chips = b.lastStoneReport?.chips ?? [];
    assert.ok(chips.some((c) => c.kind === "token" && c.id === "heal_orb"));
    assert.ok(chips.some((c) => c.kind === "heal" && (c.n ?? 0) > 0));
    assert.equal(b.lastStoneReport?.showResultSheet, true);
  });

  it("hp bomb damages enemy monsters", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
    });
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    const foe = b.getUnit("e-m1")!;
    const before = foe.hp;
    b.tokens = [{ id: "hp_bomb", x: 1, y: 1 }];
    assert.equal(b.playStone({ x: 1, y: 1 }), true);
    assert.ok(foe.hp < before);
    assert.match(b.log.join("\n"), /마력폭탄/);
    const chips = b.lastStoneReport?.chips ?? [];
    assert.ok(chips.some((c) => c.kind === "token" && c.id === "hp_bomb"));
    assert.ok(chips.some((c) => c.kind === "dmg" && (c.n ?? 0) > 0));
    assert.equal(b.lastStoneReport?.showResultSheet, true);
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
    assert.equal(b.activeBoardBuffs("ally")[0]?.damageBonus, 0.14);
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
    assert.ok(ally.atb >= before + 45);
    assert.equal(b.activeBoardBuffs("ally")[0]?.spdPct, 0.4);
    assert.ok(b.getUnit("a-sum")!.atb >= 50);
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

  it("element ward grants a team buff only until the next stone", () => {
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
    assert.equal(b.amplify, amp0);
    assert.equal(b.activeBoardBuffs("ally")[0]?.damageBonus, 0.08);
    assert.match(b.log.join("\n"), /속성의뢰/);

    b.phase = "await_stone";
    b.activeUnitId = "a-m1";
    const amp1 = b.amplify;
    assert.equal(b.playStone({ x: 3, y: 3 }), true);
    assert.equal(b.amplify, amp1);
    assert.deepEqual(b.activeBoardBuffs("ally"), []);
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
    const buff = b.activeBoardBuffs("ally")[0];
    assert.ok((buff?.shieldByUnit?.["a-m1"] ?? 0) > 0);
    assert.ok((buff?.shieldByUnit?.["a-sum"] ?? 0) > 0);
    assert.ok(b.baitLure);
    assert.equal(b.baitLure!.targetTeam, "enemy");
    assert.match(b.log.join("\n"), /미끼돌/);
    assert.equal(
      b.isBaitLureFor("enemy", { x: b.baitLure!.x, y: b.baitLure!.y }),
      true,
    );
  });

  it("transform dust flips adjacent stone colors", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
    });
    for (const u of b.units) u.atb = u.id === "e-m1" ? 100 : 0;
    b.tickUntilReady();
    assert.equal(b.playStone({ x: 1, y: 2 }), true);
    assert.equal(b.board.at({ x: 1, y: 2 }), "white");
    assert.deepEqual(b.lastEnemyStone, { x: 1, y: 2, boardIndex: 0 });

    b.phase = "await_stone";
    b.activeUnitId = "a-m1";
    b.tokens = [{ id: "transform_dust", x: 2, y: 2 }];
    assert.equal(b.playStone({ x: 2, y: 2 }), true);
    assert.equal(b.board.at({ x: 1, y: 2 }), "black");
    assert.equal(b.lastEnemyStone, null);
    assert.match(b.log.join("\n"), /변환가루/);
  });

  it("remembers the last enemy stone for placement hints", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const u of b.units) u.atb = u.id === "e-m1" ? 100 : 0;
    b.tickUntilReady();
    assert.equal(b.playStone({ x: 2, y: 2 }), true);
    assert.deepEqual(b.lastEnemyStone, { x: 2, y: 2, boardIndex: 0 });

    b.phase = "await_stone";
    b.activeUnitId = "e-m1";
    assert.equal(b.playStone({ x: 3, y: 3 }), true);
    assert.deepEqual(b.lastEnemyStone, { x: 3, y: 3, boardIndex: 0 });

    b.phase = "await_stone";
    b.activeUnitId = "a-m1";
    // Surround and capture the last enemy stone at (3,3).
    b.board.play("black", { x: 2, y: 3 });
    b.board.play("black", { x: 4, y: 3 });
    b.board.play("black", { x: 3, y: 2 });
    assert.equal(b.playStone({ x: 3, y: 4 }), true);
    assert.equal(b.board.at({ x: 3, y: 3 }), null);
    assert.equal(b.lastEnemyStone, null);
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

  it("skill cooldown ticks only on the monster's own turn", () => {
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
    b.useSkill({ skillIndex: 2, targetId: "e-m1" });
    const cdAfterUse = b.getUnit("a-m1")!.skillCd?.[2] ?? 0;
    assert.ok(cdAfterUse > 0);

    for (const u of b.units) u.atb = u.id === "e-m1" ? 100 : 0;
    b.tickUntilReady();
    b.autoStone();
    const cdAfterEnemy = b.getUnit("a-m1")!.skillCd?.[2] ?? 0;
    assert.equal(cdAfterEnemy, cdAfterUse);

    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    b.autoStone();
    const cdAfterAlly = b.getUnit("a-m1")!.skillCd?.[2] ?? 0;
    assert.equal(cdAfterAlly, cdAfterUse - 1);
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

    const critUnits = roster();
    critUnits.find((u) => u.id === "a-m1")!.stonePassive = "capture_crit";
    const critBattle = new Battle({
      boardSize: 5,
      units: critUnits,
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    critBattle.board.play("white", { x: 2, y: 2 });
    critBattle.board.play("black", { x: 1, y: 2 });
    critBattle.board.play("black", { x: 3, y: 2 });
    critBattle.board.play("black", { x: 2, y: 1 });
    for (const u of critBattle.units) u.atb = u.id === "a-m1" ? 100 : 0;
    critBattle.tickUntilReady();
    assert.equal(critBattle.playStone({ x: 2, y: 3 }), true);
    assert.equal(critBattle.activeBoardBuffs("ally")[0]?.critDmgBonus, 10);
    assert.equal(critBattle.getUnit("a-m1")!.critDmgBonus ?? 0, 0);
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

  it("resets 7x7 after threshold into empowered circle", () => {
    const b = new Battle({
      boardSize: 7,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
      resetThreshold: 3,
    });
    for (let i = 0; i < 3; i++) {
      const team = i % 2 === 0 ? "ally" : "enemy";
      for (const u of b.units) u.atb = 0;
      const actor = b.units.find(
        (u) => u.team === team && u.kind === "monster" && u.alive,
      )!;
      actor.atb = 100;
      // Ensure this team must place (Go alternation).
      b.lastStoneTeam = team === "ally" ? "enemy" : "ally";
      b.tickUntilReady();
      assert.equal(b.phase, "await_stone");
      assert.equal(b.autoStone(), true);
      b.useSkill();
    }
    assert.equal(b.circle.boardPhase, 1);
    assert.equal(b.circle.stoneSummonCount, 0);
    assert.equal(b.tokens.length, 0);
    assert.ok(b.board.getBoard().flat().every((c) => c === null));
    assert.match(b.log.join("\n"), /강화 진문/);
    assert.equal(b.openingBonusPending, true);
    assert.match(b.log.join("\n"), /포석 보너스/);
  });

  it("wipes the circle when no legal stone remains", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (let y = 0; y < b.board.size; y++) {
      for (let x = 0; x < b.board.size; x++) {
        const color = (x + y) % 2 === 0 ? "black" : "white";
        assert.equal(b.board.forcePlace(color, { x, y }), true);
      }
    }
    assert.equal(b.board.emptyPoints().length, 0);
    assert.equal(b.board.legalMoves("black").length, 0);
    assert.equal(b.board.legalMoves("white").length, 0);

    for (const u of b.units) u.atb = 0;
    b.getUnit("a-m1")!.atb = 100;
    b.lastStoneTeam = "enemy";
    const unit = b.tickUntilReady();
    assert.equal(unit?.id, "a-m1");
    assert.equal(b.phase, "await_stone");
    assert.ok(b.board.emptyPoints().length > 0);
    assert.ok(b.boardClearSeq >= 1);
    assert.equal(b.autoStone(), true);
    assert.equal(b.phase, "await_skill");
    assert.match(b.log.join("\n"), /진문 붕괴/);
  });

  it("autoStone unsticks a full circle without waiting for the next tick", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (let y = 0; y < b.board.size; y++) {
      for (let x = 0; x < b.board.size; x++) {
        const color = (x + y) % 2 === 0 ? "black" : "white";
        assert.equal(b.board.forcePlace(color, { x, y }), true);
      }
    }
    assert.equal(b.board.legalMoves("white").length, 0);
    b.phase = "await_stone";
    b.activeUnitId = "e-m1";
    assert.equal(b.autoStone(), true);
    assert.equal(b.phase, "await_skill");
    assert.ok(b.boardClearSeq >= 1);
  });

  it("applies opening bonus on the next stone after reset", () => {
    const b = new Battle({
      boardSize: 7,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
      resetThreshold: 2,
    });
    for (let i = 0; i < 2; i++) {
      const team = i % 2 === 0 ? "ally" : "enemy";
      for (const u of b.units) u.atb = 0;
      const actor = b.units.find(
        (u) => u.team === team && u.kind === "monster" && u.alive,
      )!;
      actor.atb = 100;
      b.lastStoneTeam = team === "ally" ? "enemy" : "ally";
      b.tickUntilReady();
      assert.equal(b.autoStone(), true);
      b.useSkill();
    }
    assert.equal(b.openingBonusPending, true);
    const sug = b.suggestStones(b.getUnit("a-m1")!);
    assert.ok(sug.length >= 1);
    const top = sug[0]!.point;
    const cx = 3;
    const cy = 3;
    const topDist = Math.abs(top.x - cx) + Math.abs(top.y - cy);
    assert.ok(topDist <= 4);

    for (const u of b.units) u.atb = 0;
    b.getUnit("a-m1")!.atb = 100;
    b.lastStoneTeam = "enemy";
    b.tickUntilReady();
    const amp0 = b.amplify;
    assert.equal(b.playStone(top), true);
    assert.equal(b.openingBonusPending, false);
    assert.equal(b.amplify, amp0);
    assert.match(b.log.join("\n"), /포석 안내 종료/);
  });

  it("keeps capture power for every ally action through the next placement", () => {
    const b = new Battle({
      boardSize: 7,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    b.getUnit("e-m1")!.stats.hp = 5000;
    b.getUnit("e-m1")!.hp = 5000;
    b.board.play("white", { x: 2, y: 2 });
    b.board.play("black", { x: 2, y: 1 });
    b.board.play("black", { x: 1, y: 2 });
    b.board.play("black", { x: 3, y: 2 });
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    const mana0 = b.allySummoner.mana;
    assert.equal(b.playStone({ x: 2, y: 3 }), true);
    assert.equal(b.activeBoardBuffs("ally")[0]?.damageBonus, 0.18);
    assert.ok(b.allySummoner.mana >= mana0 + 20);
    const captureChips = (b.lastStoneReport?.chips ?? []).filter(
      (c) => c.kind === "atk" || c.kind === "spd" || c.kind === "crit" || c.kind === "capture",
    );
    assert.equal(captureChips.length, 1);
    assert.equal(captureChips[0]?.kind, "capture");
    b.useSkill({ targetId: "e-m1" });
    assert.equal(b.activeBoardBuffs("ally")[0]?.damageBonus, 0.18);

    b.allySummoner.mana = 100;
    for (const u of b.units) u.atb = u.id === "a-sum" ? 100 : 0;
    assert.equal(b.tickUntilReady()?.id, "a-sum");
    assert.equal(b.phase, "await_skill");
    assert.ok(b.useSkill({ summonerSkill: "open" }).length > 0);
    assert.equal(b.activeBoardBuffs("ally")[0]?.damageBonus, 0.18);

    b.lastStoneTeam = "enemy";
    for (const u of b.units) u.atb = u.id === "a-m1" ? 100 : 0;
    b.tickUntilReady();
    assert.equal(b.phase, "await_stone");
    assert.equal(b.autoStone(), true);
    assert.deepEqual(b.activeBoardBuffs("ally"), []);
  });

  it("counts remaining actions until the next ally stone", () => {
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    b.getUnit("e-m1")!.stats.hp = 5000;
    b.getUnit("e-m1")!.hp = 5000;
    for (const u of b.units) u.atb = 0;
    b.getUnit("a-m1")!.atb = 100;
    b.tickUntilReady();
    assert.equal(b.phase, "await_stone");
    assert.equal(b.turnsUntilStone("ally"), 0);
    assert.equal(b.autoStone(), true);
    b.useSkill({ targetId: "e-m1" });
    assert.ok(b.turnsUntilStone("ally") > 0);
    for (const u of b.units) u.atb = 0;
    b.getUnit("e-m1")!.atb = 100;
    b.tickUntilReady();
    assert.equal(b.phase, "await_stone");
    assert.equal(b.turnsUntilStone("enemy"), 0);
    assert.ok(b.turnsUntilStone("ally") >= 1);
  });

  it("composed ult refunds mana and buffs when tree nodes unlocked", () => {
    const sm = summonerState("a-sum", 100, 0.1);
    sm.skillTreeUnlocked = ["root_mana", "abyss_well", "root_power", "leader_aura"];
    const b = new Battle({
      boardSize: 5,
      units: roster(),
      allySummoner: sm,
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.5,
    });
    for (const u of b.units) u.atb = u.id === "a-sum" ? 100 : 0;
    b.tickUntilReady();
    b.autoStone();
    const hits = b.useSkill({ summonerSkill: "open" });
    assert.ok(hits.length >= 1);
    assert.ok(b.allySummoner.mana > 0); // refund from mana branch
    assert.match(b.log.join("\n"), /진문개방 \[.*mana/);
    const mon = b.getUnit("a-m1")!;
    assert.ok((mon.atkBuffPct ?? 0) > 0);
  });
});

describe("diverse skill runtime", () => {
  function combatWithSkill(
    effects: NonNullable<Unit["skills"]>[number]["effects"],
  ) {
    const units = roster();
    units.push(
      makeUnit({
        id: "a-m2",
        name: "AllyTwo",
        team: "ally",
        kind: "monster",
        element: "wind",
        stats: { hp: 400, atk: 80, def: 80, spd: 80, critRate: 0, critDmg: 50 },
        skillCoeff: 1,
        hp: 80,
      }),
    );
    units[1]!.skills = [{ id: "test", nameKo: "test", cooldown: 0, effects }];
    const battle = new Battle({
      boardSize: 5,
      units,
      allySummoner: summonerState("a-sum"),
      enemySummoner: summonerState("e-sum"),
      rng: () => 0.99,
    });
    battle.phase = "await_skill";
    battle.activeUnitId = "a-m1";
    return battle;
  }

  it("uses source scaling and defense ignore", () => {
    const base = combatWithSkill([
      { kind: "damage", target: "single", coeff: 0.5, source: "def" },
    ]);
    base.getUnit("a-m1")!.stats.def = 1000;
    base.getUnit("e-m1")!.stats.def = 1000;
    const hp0 = base.getUnit("e-m1")!.hp;
    base.useSkill({ targetId: "e-m1", skillIndex: 0 });
    const defScaled = hp0 - base.getUnit("e-m1")!.hp;

    const ignored = combatWithSkill([
      {
        kind: "damage",
        target: "single",
        coeff: 0.5,
        source: "def",
        ignoreDef: 1,
      },
    ]);
    ignored.getUnit("a-m1")!.stats.def = 1000;
    ignored.getUnit("e-m1")!.stats.def = 1000;
    const hp1 = ignored.getUnit("e-m1")!.hp;
    ignored.useSkill({ targetId: "e-m1", skillIndex: 0 });
    assert.ok(hp1 - ignored.getUnit("e-m1")!.hp > defScaled);
  });

  it("applies heal, shield, buffs, HoT, ATB and cooldown decrease", () => {
    const battle = combatWithSkill([
      { kind: "heal", target: "all_allies", coeff: 0.2 },
      { kind: "shield", target: "all_allies", coeff: 0.1 },
      { kind: "buff", target: "all_allies", axis: "spd", amount: 0.3, turns: 2 },
      { kind: "hot", target: "all_allies", coeff: 0.1, turns: 2 },
      { kind: "atb", target: "all_allies", amount: 25 },
      { kind: "cooldown", target: "all_allies", direction: "decrease", amount: 1 },
    ]);
    battle.getUnit("a-m2")!.skills = sampleSkills;
    battle.getUnit("a-m2")!.skillCd = [2, 2, 2];
    battle.useSkill({ targetId: "a-m2", skillIndex: 0 });
    const ally = battle.getUnit("a-m2")!;
    assert.equal(ally.hp, 160);
    assert.equal(ally.shieldHp, 40);
    assert.equal(ally.spdBuffPct, 0.3);
    assert.equal(ally.atb, 25);
    assert.deepEqual(ally.skillCd, [1, 1, 1]);
    assert.equal(hasStatus(ally, "hot"), true);
  });

  it("lands hostile effects after activation and clamped resistance", () => {
    const battle = combatWithSkill([
      { kind: "debuff", target: "single", axis: "spd", amount: 0.3, turns: 2 },
      { kind: "dot", target: "single", coeff: 0.2, turns: 2 },
      { kind: "cc", target: "single", cc: "freeze", turns: 1, chance: 1 },
      { kind: "heal_block", target: "single", turns: 2, chance: 1 },
      { kind: "silence", target: "single", turns: 2, chance: 1 },
      { kind: "provoke", target: "single", turns: 2, chance: 1 },
      { kind: "cooldown", target: "single", direction: "increase", amount: 2 },
    ]);
    const enemy = battle.getUnit("e-m1")!;
    enemy.skillCd = [0, 0, 0];
    battle.useSkill({ targetId: enemy.id, skillIndex: 0 });
    assert.equal(enemy.spdDebuffPct, 0.3);
    assert.equal(statusesOf(enemy).filter((status) => status.kind === "dot").length, 1);
    assert.equal(hasStatus(enemy, "freeze"), true);
    assert.equal(hasStatus(enemy, "heal_block"), true);
    assert.equal(hasStatus(enemy, "silence"), true);
    assert.equal(enemy.provokeTargetId, "a-m1");
    assert.deepEqual(enemy.skillCd, [2, 2, 2]);

    const resisted = combatWithSkill([
      { kind: "cc", target: "single", cc: "stun", turns: 1, chance: 1 },
    ]);
    resisted.getUnit("e-m1")!.stats.resistance = 100;
    (resisted as unknown as { rng: () => number }).rng = () => 0.1;
    resisted.useSkill({ targetId: "e-m1", skillIndex: 0 });
    assert.equal(hasStatus(resisted.getUnit("e-m1")!, "stun"), false);

    const immune = combatWithSkill([
      { kind: "dot", target: "single", coeff: 1, turns: 2 },
    ]);
    addStatus(immune.getUnit("e-m1")!, {
      kind: "immunity",
      sourceUnitId: "e-m1",
      polarity: "buff",
      turns: 2,
      stacking: "replace",
      dispellable: true,
    });
    immune.useSkill({ targetId: "e-m1", skillIndex: 0 });
    assert.equal(hasStatus(immune.getUnit("e-m1")!, "dot"), false);
  });

  it("applies SPD debuff to actual ATB gain", () => {
    const battle = combatWithSkill([
      { kind: "debuff", target: "single", axis: "spd", amount: 0.5, turns: 2 },
    ]);
    battle.useSkill({ targetId: "e-m1", skillIndex: 0 });
    for (const unit of battle.units) unit.atb = 0;
    battle.tickUntilReady(1);
    assert.equal(battle.getUnit("e-m1")!.atb, 4.25);
  });

  it("strips and cleanses by priority and count", () => {
    const strip = combatWithSkill([
      { kind: "strip", target: "single", count: 1 },
    ]);
    const enemy = strip.getUnit("e-m1")!;
    addStatus(enemy, {
      kind: "atk_up",
      sourceUnitId: enemy.id,
      polarity: "buff",
      turns: 3,
      stacking: "replace",
      dispellable: true,
      amount: 0.5,
    });
    addStatus(enemy, {
      kind: "immunity",
      sourceUnitId: enemy.id,
      polarity: "buff",
      turns: 3,
      stacking: "replace",
      dispellable: true,
    });
    strip.useSkill({ targetId: enemy.id, skillIndex: 0 });
    assert.equal(hasStatus(enemy, "immunity"), false);
    assert.equal(hasStatus(enemy, "atk_up"), true);

    const cleanse = combatWithSkill([
      { kind: "cleanse", target: "all_allies", count: 1 },
    ]);
    const ally = cleanse.getUnit("a-m2")!;
    addStatus(ally, {
      kind: "atk_down",
      sourceUnitId: "e-m1",
      polarity: "debuff",
      turns: 3,
      stacking: "replace",
      dispellable: true,
      amount: 0.5,
    });
    addStatus(ally, {
      kind: "sleep",
      sourceUnitId: "e-m1",
      polarity: "debuff",
      turns: 2,
      stacking: "replace",
      dispellable: true,
    });
    cleanse.useSkill({ skillIndex: 0 });
    assert.equal(hasStatus(ally, "sleep"), false);
    assert.equal(hasStatus(ally, "atk_down"), true);
  });

  it("revives dead allies and AUTO prioritizes revive, heal, cleanse, then strip", () => {
    const reviveSkill = {
      id: "revive",
      nameKo: "revive",
      cooldown: 3,
      effects: [{ kind: "revive" as const, target: "ally_lowest" as const, hpFraction: 0.4 }],
    };
    const battle = combatWithSkill(reviveSkill.effects);
    const ally = battle.getUnit("a-m2")!;
    ally.alive = false;
    ally.hp = 0;
    battle.useSkill({ targetId: ally.id, skillIndex: 0 });
    assert.equal(ally.alive, true);
    assert.equal(ally.hp, 160);

    const chooser = battle.getUnit("a-m1")!;
    chooser.skills = [
      sampleSkills[0]!,
      { id: "heal", nameKo: "heal", cooldown: 0, effects: [{ kind: "heal", target: "ally_lowest", coeff: 0.2 }] },
      reviveSkill,
    ];
    chooser.skillCd = [0, 0, 0];
    ally.alive = false;
    assert.equal(pickAutoSkillIndex(chooser, battle.units), 2);
    ally.alive = true;
    ally.hp = 10;
    assert.equal(pickAutoSkillIndex(chooser, battle.units), 1);
  });

  it("obeys provoke, wakes sleep on damage, and expires reduction/share/reflect", () => {
    const battle = combatWithSkill([
      { kind: "damage", target: "single", coeff: 0.1 },
    ]);
    const attacker = battle.getUnit("a-m1")!;
    const enemy = battle.getUnit("e-m1")!;
    addStatus(attacker, {
      kind: "provoke",
      sourceUnitId: enemy.id,
      linkedUnitId: enemy.id,
      polarity: "debuff",
      turns: 1,
      stacking: "replace",
      dispellable: true,
    });
    addStatus(enemy, {
      kind: "sleep",
      sourceUnitId: attacker.id,
      polarity: "debuff",
      turns: 2,
      stacking: "replace",
      dispellable: true,
    });
    battle.useSkill({ targetId: "e-sum", skillIndex: 0 });
    assert.equal(hasStatus(enemy, "sleep"), false);
    assert.equal(hasStatus(attacker, "provoke"), false);

    for (const kind of ["damage_reduction", "damage_share", "reflect"] as const) {
      addStatus(enemy, {
        kind,
        sourceUnitId: enemy.id,
        polarity: "buff",
        turns: 1,
        stacking: "replace",
        dispellable: true,
        amount: 0.25,
      });
    }
    const advance = combatWithSkill([{ kind: "heal", target: "self", coeff: 0 }]);
    const actor = advance.getUnit("a-m1")!;
    actor.statuses = enemy.statuses?.map((status) => ({ ...status }));
    advance.useSkill({ skillIndex: 0 });
    assert.equal(hasStatus(actor, "damage_reduction"), false);
    assert.equal(hasStatus(actor, "damage_share"), false);
    assert.equal(hasStatus(actor, "reflect"), false);
  });

  it("reduces, shares, and reflects incoming damage while statuses are active", () => {
    const battle = combatWithSkill([
      { kind: "damage", target: "single", coeff: 0.2 },
    ]);
    const attacker = battle.getUnit("a-m1")!;
    const target = battle.getUnit("e-m1")!;
    const partner = makeUnit({
      id: "e-m2",
      name: "EnemyTwo",
      team: "enemy",
      kind: "monster",
      element: "water",
      stats: { hp: 500, atk: 10, def: 10, spd: 10, critRate: 0, critDmg: 50 },
      skillCoeff: 1,
    });
    battle.units.push(partner);
    addStatus(target, {
      kind: "damage_reduction",
      sourceUnitId: target.id,
      polarity: "buff",
      turns: 2,
      stacking: "replace",
      dispellable: true,
      amount: 0.5,
    });
    addStatus(target, {
      kind: "damage_share",
      sourceUnitId: partner.id,
      linkedUnitId: partner.id,
      polarity: "buff",
      turns: 2,
      stacking: "replace",
      dispellable: true,
      amount: 0.5,
    });
    addStatus(target, {
      kind: "reflect",
      sourceUnitId: target.id,
      polarity: "buff",
      turns: 2,
      stacking: "replace",
      dispellable: true,
      amount: 0.5,
    });
    const attackerHp = attacker.hp;
    battle.useSkill({ targetId: target.id, skillIndex: 0 });
    assert.ok(target.hp < target.stats.hp);
    assert.ok(partner.hp < partner.stats.hp);
    assert.ok(attacker.hp < attackerHp);
  });
});
