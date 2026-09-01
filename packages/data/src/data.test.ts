import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applySymbolsToStats,
  effectiveSymbolSetCounts,
  canGrindSymbol,
  symbolCombatMods,
  describeSkillVfx,
  skillIconPath,
  canImprintSymbol,
  CHAPTER1_STAGES,
  CAIROS_DRAGON_STAGES,
  CAIROS_GIANT_STAGES,
  CAIROS_NECRO_STAGES,
  CHALLENGE_TOWER_HARD_STAGES,
  CHALLENGE_TOWER_NORMAL_STAGES,
  DEPTH_STAGES,
  MAIN_QUEST_AREA_COUNT,
  MAIN_QUEST_PIN_LAYOUT,
  MAIN_QUEST_STAGES,
  STAGES_PER_AREA,
  bumpGearEnhance,
  canEquipGearOnElement,
  createEmptyGear,
  createStarterGear,
  createStarterHwalro,
  createSymbol,
  emptyGearAffixTotals,
  EQUIP_STAGES,
  gearActiveAffixes,
  gearAffixTotals,
  GEAR_AFFIXES,
  GEAR_STAT_KEYS,
  getGearAffix,
  gearArtFilename,
  gearArtStem,
  getGearMaterial,
  gearEnhanceCrystalCost,
  gearEnhanceStepMul,
  grindEnhanceSubstat,
  grindSymbolPrefix,
  gearEnhanceManaCost,
  gearSellCrystal,
  gearSellMana,
  gearSetBonuses,
  gearStarsToInvGrade,
  gearStarsToQuality,
  normalizeGearPiece,
  getMonster,
  getStage,
  getSummonerKit,
  bumpSymbolEnhance,
  imprintSymbolMain,
  mainStatAtEnhance,
  MAX_GEAR_ENHANCE,
  FAMILY_KIT_PROFILES,
  MONSTERS,
  normalizeSummonerGear,
  rollGearDrop,
  rollSymbolDrop,
  SCENARIO_NORMAL_STAR_WEIGHTS,
  scenarioSymbolDropTable,
  magicEnhanceRequiredLevel,
  skillTreeBonuses,
  SKILL_TREE_NODES,
  stripUnenhancedStarterGear,
  summarizeGearSets,
  SYMBOL_SETS,
  summarizeSymbolSets,
  WEEKDAY_STAGES,
  isWeekdayStageOpenToday,
  SKILL_DMG_MUL,
} from "./index.js";

describe("phase1 data", () => {
  it("has 75 families x 5 elements and 17 symbol sets", () => {
    assert.equal(MONSTERS.length, 375);
    assert.equal(SYMBOL_SETS.length, 17);
    assert.ok(getMonster("wolf_fighter_fire"));
    assert.ok(getMonster("lotus_dancer_wind"));
    assert.ok(getMonster("abyss_priest_dark"));
    assert.ok(getMonster("magic_archer_fire"));
    assert.ok(getMonster("cinder_imp_fire"));
    assert.ok(getMonster("ember_wisp_fire"));
    assert.ok(getMonster("sanctuary_oracle_light"));
    // Legacy ids still resolve
    assert.equal(getMonster("fire_fang")?.id, "wolf_fighter_fire");
    assert.equal(getMonster("seokrang_fire")?.id, "wolf_fighter_fire");
    const families = new Set(MONSTERS.map((m) => m.familyId));
    assert.equal(families.size, 75);
    const byStars = [1, 2, 3, 4, 5].map(
      (s) =>
        new Set(
          MONSTERS.filter((m) => m.naturalStars === s).map((m) => m.familyId),
        ).size,
    );
    assert.deepEqual(byStars, [15, 15, 17, 17, 11]);
    for (const fam of families) {
      const variants = MONSTERS.filter((m) => m.familyId === fam);
      assert.equal(variants.length, 5);
      const name = variants[0]!.nameKo;
      assert.ok(variants.every((v) => v.nameKo === name));
      const els = new Set(variants.map((v) => v.element));
      assert.equal(els.size, 5);
    }
  });

  it("gives each monster three skills", () => {
    for (const m of MONSTERS) {
      assert.equal(m.skills.length, 3);
      assert.equal(m.skills[0]!.id, "s1");
      assert.equal(m.skills[0]!.cooldown, 0);
      assert.ok(m.skills[0]!.effects.some((e) => e.kind === "damage"));
      assert.ok(m.skills[0]!.descKo);
      assert.ok(m.skills[1]!.descKo);
      assert.ok(m.skills[2]!.descKo);
      assert.ok(m.skills[1]!.vfxFamily);
      assert.ok(m.skills[2]!.vfxFamily);
      assert.ok(m.skills.every((skill) => skill.vfxId?.startsWith("monster:")));
    }
  });

  it("keeps five display roles evenly distributed without changing balance identity", () => {
    const families = MONSTERS.filter((monster) => monster.element === "fire");
    const counts = Object.fromEntries(
      ["attacker", "hp", "defense", "speed", "support"].map((role) => [
        role,
        families.filter((family) => family.role === role).length,
      ]),
    );
    assert.deepEqual(counts, {
      attacker: 15,
      hp: 15,
      defense: 15,
      speed: 15,
      support: 15,
    });
    assert.equal(new Set(families.map((family) => family.role)).size, 5);
    for (const family of families) {
      assert.equal(family.familyIdentity, family.balanceArchetype);
      assert.ok(family.combatTags.includes(family.familyIdentity));
    }
    assert.equal(getMonster("seal_elder_fire")?.familyIdentity, "stonesage");
    assert.equal(getMonster("capture_lord_fire")?.familyIdentity, "capturer");
    assert.equal(getMonster("doom_oracle_fire")?.familyIdentity, "debuffer");
  });

  it("defines distinct profiles for all 75 families", () => {
    assert.equal(Object.keys(FAMILY_KIT_PROFILES).length, 75);
    const familyIds = new Set(MONSTERS.map((monster) => monster.familyId));
    assert.deepEqual(
      new Set(Object.keys(FAMILY_KIT_PROFILES)),
      familyIds,
    );
    const allSignatures = Object.values(FAMILY_KIT_PROFILES).map((profile) =>
      JSON.stringify({ s2: profile.s2, s3: profile.s3 }),
    );
    assert.equal(new Set(allSignatures).size, 75);
    for (const role of ["attacker", "hp", "defense", "speed", "support"] as const) {
      const signatures = Object.values(FAMILY_KIT_PROFILES)
        .filter((profile) => profile.role === role)
        .map((profile) =>
          JSON.stringify({
            s2: profile.s2,
            s3: profile.s3,
          }),
        );
      assert.equal(signatures.length, 15);
      assert.equal(new Set(signatures).size, signatures.length);
    }
  });

  it("keeps S1 offensive, varies later kits, and represents every planned mechanic", () => {
    const allSkills = MONSTERS.flatMap((monster) => monster.skills);
    for (const monster of MONSTERS) {
      const [s1, s2, s3] = monster.skills;
      assert.ok(s1.effects.some((effect) => effect.kind === "damage"));
      assert.ok(s1.effects.some((effect) => effect.kind !== "damage"));
      assert.equal(s1.cooldown, 0);
      assert.ok(s2.cooldown >= 2 && s2.cooldown <= 6);
      assert.ok(s3.cooldown >= 2 && s3.cooldown <= 6);
    }
    const damageShare =
      allSkills.filter((skill) =>
        skill.effects.some((effect) => effect.kind === "damage"),
      ).length / allSkills.length;
    assert.ok(damageShare <= 0.7, `damage skill share ${damageShare}`);

    const represented = new Set(
      allSkills.flatMap((skill) => skill.effects.map((effect) => effect.kind)),
    );
    for (const kind of [
      "heal",
      "buff",
      "debuff",
      "dot",
      "strip",
      "cleanse",
      "cc",
      "hot",
      "heal_block",
      "silence",
      "atb",
      "revive",
      "cooldown",
      "damage_share",
      "reflect",
      "provoke",
      "immunity",
    ]) {
      assert.ok(represented.has(kind), `missing effect kind ${kind}`);
    }
    const damageEffects = allSkills.flatMap((skill) =>
      skill.effects.filter((effect) => effect.kind === "damage"),
    );
    assert.deepEqual(
      new Set(damageEffects.map((effect) => effect.source ?? "atk")),
      new Set(["atk", "maxHp", "def", "spd", "targetMaxHp"]),
    );
    assert.ok(damageEffects.some((effect) => (effect.ignoreDef ?? 0) > 0));
  });

  it("preserves natural stars, stat curves, and established damage budgets", () => {
    assert.equal(SKILL_DMG_MUL, 3.4);
    assert.deepEqual(
      [1, 2, 3, 4, 5].map(
        (stars) =>
          new Set(
            MONSTERS.filter((monster) => monster.naturalStars === stars).map(
              (monster) => monster.familyId,
            ),
          ).size,
      ),
      [15, 15, 17, 17, 11],
    );
    assert.deepEqual(getMonster("stone_golem_fire")?.baseStats, {
      hp: 3800,
      atk: 110,
      def: 250,
      spd: 92,
      critRate: 20,
      critDmg: 55,
      accuracy: 0,
      resistance: 25,
    });
    assert.deepEqual(getMonster("wolf_fighter_fire")?.baseStats, {
      hp: 3750,
      atk: 264,
      def: 180,
      spd: 102,
      critRate: 28,
      critDmg: 65,
      accuracy: 0,
      resistance: 15,
    });
    assert.deepEqual(getMonster("absolute_captor_wind")?.baseStats, {
      hp: 5300,
      atk: 290,
      def: 240,
      spd: 119,
      critRate: 25,
      critDmg: 55,
      accuracy: 8,
      resistance: 15,
    });

    const bases: Record<string, readonly [number, number?, number?]> = {
      attacker: [1.15, 1.7, 1.2],
      support: [0.9],
      tank: [0.95, 1.2],
      debuffer: [1, 1.35, 1.05],
      stonesage: [1, 1.25, 1.1],
      capturer: [1.1, 1.5, 1.6],
    };
    const expectedCoeff = (stars: number, base: number) =>
      Math.round((base + (stars - 3) * 0.08) * SKILL_DMG_MUL * 100) / 100;
    for (const monster of MONSTERS) {
      for (const [slot, skill] of monster.skills.entries()) {
        const damage = skill.effects.find((effect) => effect.kind === "damage");
        if (!damage || damage.kind !== "damage") continue;
        let base = bases[monster.balanceArchetype]![slot];
        if (
          slot === 2 &&
          monster.balanceArchetype === "attacker" &&
          (monster.element === "water" || monster.element === "dark")
        ) {
          base = 1.85;
        }
        assert.ok(base !== undefined, `${monster.id} gained a new damage budget`);
        assert.equal(
          damage.coeff,
          expectedCoeff(monster.naturalStars, base),
          `${monster.id} changed its legacy S${slot + 1} coefficient`,
        );
      }
    }
  });

  it("assigns unique visual identities to every runtime skill", () => {
    const monsterVfxIds = MONSTERS.flatMap((m) =>
      m.skills.map((skill) => skill.vfxId),
    );
    assert.equal(monsterVfxIds.length, 1125);
    assert.equal(new Set(monsterVfxIds).size, 1125);

    const summonerVfxIds = Object.values(
      ["fire", "water", "wind", "light", "dark"] as const,
    ).flatMap((element) =>
      Object.values(getSummonerKit(element).skills).map((skill) => skill.vfxId),
    );
    assert.equal(summonerVfxIds.length, 50);
    assert.equal(new Set(summonerVfxIds).size, 50);
    assert.ok(summonerVfxIds.every((id) => id?.startsWith("summoner:")));

    const sample = MONSTERS.find((m) => m.id === "magma_knight_fire")!.skills[2]!;
    const descriptor = describeSkillVfx(sample.vfxId!, {
      vfxFamily: sample.vfxFamily,
      element: "fire",
      slot: "s3",
    });
    assert.equal(descriptor.assetStem, "magma_knight-fire-s3");
    assert.equal(descriptor.intensity, "ultimate");
    assert.equal(descriptor.motion, sample.vfxFamily);
    assert.equal(
      skillIconPath(sample.vfxId),
      "/art/monster/skill/magma_knight-fire-s3.webp",
    );
    assert.equal(
      skillIconPath("summoner:fire_amp"),
      "/art/summoner/skill/fire_amp.webp",
    );
    assert.equal(skillIconPath("monster:magma_knight:fire:s4"), null);
    assert.equal(skillIconPath("monster:../damage:fire:s1"), null);
  });

  it("family s2/s3 differ by element", () => {
    const impFire = getMonster("cinder_imp_fire")!;
    const impWater = getMonster("cinder_imp_water")!;
    const lizardFire = getMonster("sand_lizard_fire")!;
    assert.notEqual(impFire.skills[1]!.descKo, impWater.skills[1]!.descKo);
    assert.notEqual(impFire.skills[1]!.nameKo, impWater.skills[1]!.nameKo);
    assert.notEqual(impFire.skills[2]!.descKo, impWater.skills[2]!.descKo);
    assert.notEqual(impFire.skills[1]!.nameKo, lizardFire.skills[1]!.nameKo);
    assert.notEqual(
      impFire.skills[1]!.descKo,
      lizardFire.skills[1]!.descKo,
      "same-role families keep distinct mechanics",
    );
  });

  it("summoner magic skills have unique flavor and vfx hints", () => {
    const fire = getSummonerKit("fire");
    const water = getSummonerKit("water");
    assert.ok(fire.skills.A.descKo);
    assert.ok(fire.skills.A.vfxFamily);
    assert.notEqual(fire.skills.A.descKo, water.skills.A.descKo);
    assert.notEqual(fire.skills.B.nameKo, water.skills.B.nameKo);
  });

  it("uses Summoners War-like HP/ATK and S1 coefficients", () => {
    const attacker = getMonster("wolf_fighter_fire");
    assert.ok(attacker);
    assert.ok(attacker.baseStats.hp >= 3500);
    assert.ok(attacker.baseStats.hp / attacker.baseStats.atk >= 10);
    const s1 = attacker.skills[0]!.effects.find((e) => e.kind === "damage");
    assert.ok(s1 && s1.kind === "damage");
    assert.ok(s1.coeff >= 3.4 && s1.coeff <= 4.2);
  });

  it("chapter1 boards progress 5 → 7", () => {
    assert.equal(CHAPTER1_STAGES.length, 7);
    assert.equal(getStage("garen_1_1")?.boardSize, 5);
    assert.equal(getStage("garen_1_4")?.boardSize, 7);
    assert.equal(getStage("garen_1_5")?.boardSize, 7);
    assert.equal(getStage("garen_1_7")?.boardSize, 7);
    assert.equal(getStage("giant_b1")?.mode, "depth");
    assert.equal(getStage("arena_rookie")?.mode, "arena");
    assert.equal(getStage("guild_raid_boss")?.boardSize, 7);
    assert.equal(getStage("warena_qual")?.mode, "world_arena");
    assert.equal(getStage("equip_vault_1")?.mode, "equip");
    assert.equal(getStage("equip_vault_boss")?.gearDropChance, 1);
  });

  it("main quest has 13 area pins with 7 stages each", () => {
    assert.equal(MAIN_QUEST_AREA_COUNT, 13);
    assert.equal(STAGES_PER_AREA, 7);
    assert.equal(MAIN_QUEST_STAGES.length, 13 * 7);
    assert.equal(MAIN_QUEST_PIN_LAYOUT.length, 13);
    assert.equal(CHAPTER1_STAGES.length, 7);
    assert.ok(getStage("garen_1_7"));
    assert.ok(getStage("tower_2_7"));
    assert.ok(getStage("ruins_3_7"));
    assert.ok(getStage("end_13_7"));
    assert.equal(
      MAIN_QUEST_PIN_LAYOUT.every((p) =>
        MAIN_QUEST_STAGES.some((s) => s.map === p.map),
      ),
      true,
    );
  });

  it("maps each scenario area to SW-order symbol set", () => {
    const expected: Record<number, string> = {
      1: "hwalro",
      2: "yongmaeng",
      3: "mussang",
      4: "haengma",
      5: "jipjung",
      6: "gunhim",
      7: "yeongyeol",
      8: "bogang",
      9: "hwangyeok",
      10: "ssangnip",
      11: "eungjing",
      12: "tagae",
      13: "pamyeol",
    };
    for (const [map, setId] of Object.entries(expected)) {
      const stage = MAIN_QUEST_STAGES.find((s) => s.map === Number(map));
      assert.equal(stage?.dropSetId, setId, `map ${map}`);
    }
  });

  it("uses explicit modern scenario difficulty profiles", () => {
    for (const stage of MAIN_QUEST_STAGES) {
      assert.equal(stage.waves, 3);
      assert.ok(stage.balanceProfile?.startsWith("sw-modern-scenario-"));
      const normal = stage.difficultyBalance?.normal;
      const hard = stage.difficultyBalance?.hard;
      const hell = stage.difficultyBalance?.hell;
      assert.ok(normal && hard && hell);
      assert.equal(normal.energyCost, stage.stage === 7 ? 4 : 3);
      assert.equal(hard.energyCost, stage.stage === 7 ? 5 : 4);
      assert.equal(hell.energyCost, stage.stage === 7 ? 6 : 5);
      assert.ok(normal.enemyLevel < hard.enemyLevel);
      assert.ok(hard.enemyLevel <= hell.enemyLevel);
      assert.ok(normal.monsterExpPool > 0);
      assert.ok(hell.monsterExpPool >= hard.monsterExpPool);
    }
  });

  it("has modern Cairos B1–B10 plus Abyss Normal/Hard with set pools", () => {
    assert.equal(CAIROS_GIANT_STAGES.length, 12);
    assert.equal(CAIROS_DRAGON_STAGES.length, 12);
    assert.equal(CAIROS_NECRO_STAGES.length, 12);
    assert.equal(DEPTH_STAGES.length, 36);
    assert.ok(CAIROS_GIANT_STAGES[0]!.dropSetPool?.includes("myosu"));
    assert.ok(CAIROS_DRAGON_STAGES[0]!.dropSetPool?.includes("gyeongno"));
    assert.ok(CAIROS_NECRO_STAGES[0]!.dropSetPool?.includes("chimtu"));
    assert.ok(getStage("giant_b10")?.starWeights?.length);
    assert.equal(getStage("giant_abyss_normal")?.cairosTier, "abyss_normal");
    assert.equal(getStage("giant_abyss_hard")?.cairosTier, "abyss_hard");
    assert.ok(
      getStage("giant_abyss_hard")?.dropSetPool?.includes("muhyeong"),
    );
  });

  it("builds five B1-B10 awakening boss dungeons with weekday rotation", () => {
    const awakening = WEEKDAY_STAGES.filter((stage) => stage.awakenElement);
    assert.equal(awakening.length, 50);
    for (const element of ["fire", "water", "wind", "light", "dark"]) {
      const floors = awakening.filter(
        (stage) => stage.awakenElement === element,
      );
      assert.equal(floors.length, 10);
      assert.deepEqual(
        floors.map((stage) => stage.stage),
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      );
      for (const stage of floors) {
        assert.equal(stage.enemyWaves?.length, 4);
        assert.equal(stage.enemyWaves?.at(-1)?.[0], stage.bossMonsterId);
        assert.equal(stage.bossArtId, `awaken-${element}`);
        assert.ok(stage.awakenEssenceDrops?.length);
        assert.ok((stage.awakenExpReward ?? 0) >= 10);
        assert.equal(stage.dropChance, 0);
        assert.equal(stage.gearDropChance, 0);
      }
    }
    assert.equal(
      getStage("weekday_awaken_fire")?.id,
      "weekday_awaken_fire_b1",
    );

    const monday = new Date(2026, 7, 31, 12).getTime();
    const tuesday = new Date(2026, 8, 1, 12).getTime();
    const saturday = new Date(2026, 8, 5, 12).getTime();
    assert.equal(isWeekdayStageOpenToday("weekday_awaken_dark_b10", monday), true);
    assert.equal(isWeekdayStageOpenToday("weekday_awaken_fire_b1", monday), false);
    assert.equal(isWeekdayStageOpenToday("weekday_awaken_fire_b1", tuesday), true);
    for (const element of ["fire", "water", "wind", "light", "dark"]) {
      assert.equal(
        isWeekdayStageOpenToday(`weekday_awaken_${element}_b1`, saturday),
        true,
      );
    }
  });

  it("defines independent Normal and Hard tower ladders", () => {
    assert.equal(CHALLENGE_TOWER_NORMAL_STAGES.length, 100);
    assert.equal(CHALLENGE_TOWER_HARD_STAGES.length, 100);
    assert.equal(CHALLENGE_TOWER_NORMAL_STAGES[0]!.id, "toa_f1");
    assert.equal(CHALLENGE_TOWER_HARD_STAGES[0]!.id, "toa_hard_f1");
    for (const stage of [
      ...CHALLENGE_TOWER_NORMAL_STAGES,
      ...CHALLENGE_TOWER_HARD_STAGES,
    ]) {
      assert.equal(stage.waves, 3);
      assert.ok(stage.energyCost >= 3 && stage.energyCost <= 8);
      assert.ok(stage.balanceProfile);
      assert.ok(stage.rewardTable);
    }
  });

  it("gives custom reward modes explicit non-synthetic balance fields", () => {
    for (const stage of [
      ...EQUIP_STAGES,
      getStage("trial_b1")!,
      getStage("trial_b2")!,
      getStage("trial_b3")!,
      getStage("guild_raid_boss")!,
    ]) {
      assert.equal(typeof stage.enemyLevel, "number");
      assert.equal(typeof stage.accountExpReward, "number");
      assert.equal(typeof stage.monsterExpPool, "number");
      assert.ok(stage.balanceProfile);
      assert.ok(stage.rewardTable);
    }
  });

  it("builds every Giant floor as a four-wave final boss encounter", () => {
    for (const stage of CAIROS_GIANT_STAGES) {
      assert.equal(stage.waves, 4);
      assert.equal(stage.enemyWaves?.length, stage.waves);
      assert.equal(stage.enemyWaves?.at(-1)?.[0], stage.bossMonsterId);
      assert.equal(stage.bossMonsterId, "stone_golem_dark");
      assert.equal(stage.bossArtId, "cairos-giant");
      assert.ok((stage.bossHpMultiplier ?? 0) >= 2);
      assert.ok(
        stage.qualityWeights?.every(
          ({ value }) => value === "rare" || value === "epic" || value === "legend",
        ),
      );
    }
  });

  it("rolls equip dungeon gear drops", () => {
    const g = rollGearDrop(() => 0.2, "test");
    assert.ok(g.slot);
    assert.ok(g.setId);
    assert.ok(g.stars >= 1 && g.stars <= 5);
    assert.ok(g.quality);
    assert.ok(g.nameKo.length > 0);
  });

  it("keeps the gear affix table consistent", () => {
    const ids = new Set<string>();
    for (const def of GEAR_AFFIXES) {
      assert.equal(ids.has(def.id), false, `duplicate affix ${def.id}`);
      ids.add(def.id);
      assert.ok(def.weight > 0, `${def.id} needs a positive weight`);
      assert.ok(def.minStars === 4 || def.minStars === 5);
      assert.ok(def.value[0] > 0 && def.value[1] >= def.value[0]);
      assert.ok(def.kind === "econ" || def.kind === "combat");
      assert.equal(getGearAffix(def.id)?.id, def.id);
      if (def.slots) assert.ok(def.slots.length > 0);
    }
    // Every ★4 slot must have at least one eligible affix.
    for (const slot of ["weapon", "top", "bottom", "shoes", "ring", "necklace"] as const) {
      const pool = GEAR_AFFIXES.filter(
        (def) => def.minStars === 4 && (!def.slots || def.slots.includes(slot)),
      );
      assert.ok(pool.length >= 2, `${slot} affix pool too small`);
    }
    // "Battle gold doubled" must be reachable at the top roll.
    const surge = getGearAffix("goldSurge")!;
    assert.equal(surge.minStars, 5);
    assert.equal(surge.value[1], 1);
  });

  it("rolls stat variance, substats and affixes from the piece seed", () => {
    const piece = normalizeGearPiece({
      id: "t_roll",
      slot: "necklace",
      nameKo: "t",
      enhance: 0,
      setId: "sense",
      stars: 5,
      materialId: "cloth",
      rollSeed: 123456,
    });
    assert.equal(piece.rollSeed, 123456);
    assert.ok(piece.rollPct >= 0.85 && piece.rollPct <= 1.22);
    assert.ok(piece.subStats.length >= 2, "★5 rolls 2+ substats");
    assert.equal(piece.affixes.length, 2, "★5 rolls 2 affixes");
    assert.notEqual(piece.affixes[0]!.id, piece.affixes[1]!.id);
    for (const sub of piece.subStats) {
      assert.ok(GEAR_STAT_KEYS.includes(sub.stat));
      assert.ok(sub.value > 0);
    }
    // Same seed reproduces the identical piece after a save round trip.
    const again = normalizeGearPiece({ ...piece });
    assert.deepEqual(again.subStats, piece.subStats);
    assert.deepEqual(again.affixes, piece.affixes);
    assert.equal(again.rollPct, piece.rollPct);
    assert.equal(again.boardSenseBonus, piece.boardSenseBonus);
    // A different seed gives different rolls.
    const other = normalizeGearPiece({ ...piece, rollSeed: 999983 });
    assert.notDeepEqual(other.affixes, piece.affixes);
  });

  it("keeps substats off the axes a slot already carries", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const shoes = normalizeGearPiece({
        id: `t_sub_${seed}`,
        slot: "shoes",
        nameKo: "t",
        enhance: 0,
        setId: "mana",
        stars: 5,
        materialId: "leather",
        rollSeed: seed * 7919,
      });
      for (const sub of shoes.subStats) {
        assert.ok(
          sub.stat === "skillPowerBonus" ||
            sub.stat === "summonerHpBonus" ||
            sub.stat === "summonerDefBonus" ||
            sub.stat === "leaderAtkBonus",
          `shoes should not roll ${sub.stat} as a substat`,
        );
      }
    }
  });

  it("grants affixes only from ★4 and keeps legacy pieces stable", () => {
    const stars = [1, 2, 3, 4, 5] as const;
    const counts = stars.map((s) => {
      const piece = normalizeGearPiece({
        id: `t_affix_s${s}`,
        slot: "ring",
        nameKo: "t",
        enhance: 0,
        setId: "assault",
        stars: s,
        materialId: "plate",
      });
      return piece.affixes.length;
    });
    assert.deepEqual(counts, [0, 0, 0, 1, 2]);
    // Legacy save with no rollSeed derives a stable seed from the id.
    const legacyA = normalizeGearPiece({
      id: "legacy_ring",
      slot: "ring",
      nameKo: "t",
      enhance: 3,
      setId: "assault",
      stars: 5,
      materialId: "plate",
    });
    const legacyB = normalizeGearPiece({
      id: "legacy_ring",
      slot: "ring",
      nameKo: "t",
      enhance: 3,
      setId: "assault",
      stars: 5,
      materialId: "plate",
    });
    assert.equal(legacyA.rollSeed, legacyB.rollSeed);
    assert.deepEqual(legacyA.affixes, legacyB.affixes);
    assert.equal(legacyA.enhance, 3);
  });

  it("aggregates affixes once per id at the best roll", () => {
    assert.deepEqual(gearAffixTotals(createEmptyGear()), emptyGearAffixTotals());

    const seedPiece = (slot: "weapon" | "necklace", seed: number) =>
      normalizeGearPiece({
        id: `t_gold_${slot}_${seed}`,
        slot,
        nameKo: "t",
        enhance: 0,
        setId: "sense",
        stars: 5,
        element: slot === "weapon" ? "light" : undefined,
        materialId: slot === "weapon" ? undefined : "cloth",
        rollSeed: seed,
      });
    const findGoldSurge = (slot: "weapon" | "necklace") => {
      for (let seed = 1; seed < 5000; seed++) {
        const piece = seedPiece(slot, seed * 31);
        if (piece.affixes.some((a) => a.id === "goldSurge")) return piece;
      }
      return null;
    };
    const weapon = findGoldSurge("weapon");
    const necklace = findGoldSurge("necklace");
    assert.ok(weapon, "goldSurge should be rollable on a ★5 weapon");
    assert.ok(necklace, "goldSurge should be rollable on a ★5 necklace");

    const gear = { ...createEmptyGear(), weapon, necklace };
    const active = gearActiveAffixes(gear);
    const ids = active.map((a) => a.id);
    assert.equal(new Set(ids).size, ids.length, "each affix id fires once");

    const best = Math.max(
      weapon.affixes.find((a) => a.id === "goldSurge")!.value,
      necklace.affixes.find((a) => a.id === "goldSurge")!.value,
    );
    assert.equal(
      active.find((a) => a.id === "goldSurge")!.value,
      best,
      "keeps the highest roll",
    );
    assert.equal(gearAffixTotals(gear).battleGoldMul, 1 + best);
  });

  it("doubles battle gold at a max goldSurge roll", () => {
    const surge = getGearAffix("goldSurge")!;
    const gear = {
      ...createEmptyGear(),
      necklace: {
        ...normalizeGearPiece({
          id: "t_surge",
          slot: "necklace",
          nameKo: "t",
          enhance: 0,
          setId: "sense",
          stars: 5,
          materialId: "cloth",
        }),
        affixes: [{ id: "goldSurge" as const, value: surge.value[1] }],
      },
    };
    assert.equal(gearAffixTotals(gear).battleGoldMul, 2);
  });

  it("stacks vault floors toward higher gear grades", () => {
    assert.equal(EQUIP_STAGES.length, 5);
    EQUIP_STAGES.forEach((stage, i) => {
      assert.equal(stage.mode, "equip");
      assert.equal(stage.stage, i + 1);
      assert.ok(stage.gearStarWeights && stage.gearStarWeights.length > 0);
      if (i > 0) {
        assert.ok(
          stage.energyCost > EQUIP_STAGES[i - 1]!.energyCost,
          "deeper floors cost more energy",
        );
      }
    });
    const top = EQUIP_STAGES[4]!;
    assert.equal(top.gearMinStars, 4);
    assert.ok(top.bossMonsterId);
    assert.ok((top.bossHpMultiplier ?? 0) > 1);
    // A pessimistic rng still yields an affixed ★4 on the top floor.
    const drop = rollGearDrop(() => 0.001, "vault5", {
      starWeights: top.gearStarWeights,
      minStars: top.gearMinStars,
    });
    assert.ok(drop.stars >= 4);
    assert.ok(drop.affixes.length >= 1);
  });

  it("aggregates shallow skill tree bonuses", () => {
    assert.ok(SKILL_TREE_NODES.length > 0);
    const b = skillTreeBonuses(SKILL_TREE_NODES.slice(0, 3).map((n) => n.id));
    assert.ok(typeof b === "object");
  });

  it("creates starter gear with six slots", () => {
    const g = createStarterGear("fire");
    assert.ok(g.weapon);
    assert.equal(g.weapon.element, "fire");
    assert.ok(g.top && g.bottom && g.shoes && g.ring && g.necklace);
    assert.equal(g.weapon.stars, 1);
    assert.equal(g.weapon.quality, "normal");
  });

  it("creates empty gear and strips unenhanced starter ids", () => {
    const empty = createEmptyGear();
    assert.equal(empty.weapon, null);
    assert.equal(empty.top, null);
    const stripped = stripUnenhancedStarterGear(createStarterGear("fire"));
    assert.equal(stripped.weapon, null);
    assert.equal(stripped.necklace, null);
    const kept = stripUnenhancedStarterGear({
      ...createStarterGear("fire"),
      weapon: { ...createStarterGear("fire").weapon!, enhance: 1 },
    });
    assert.equal(kept.weapon?.enhance, 1);
    assert.equal(kept.top, null);
  });

  it("migrates legacy robe/orb slots", () => {
    const starter = createStarterGear("light");
    const g = normalizeSummonerGear({
      weapon: { ...starter.weapon!, id: "legacy_wpn" },
      robe: { ...starter.top!, id: "legacy_robe", slot: "robe" as never },
      orb: { ...starter.necklace!, id: "legacy_orb", slot: "orb" as never },
    } as never);
    assert.equal(g.top?.slot, "top");
    assert.equal(g.necklace?.slot, "necklace");
  });

  it("locks weapons to summoner element and maps stars to inv grade", () => {
    const fire = createStarterGear("fire").weapon!;
    assert.equal(canEquipGearOnElement(fire, "fire"), true);
    assert.equal(canEquipGearOnElement(fire, "water"), false);
    assert.equal(canEquipGearOnElement(createStarterGear("fire").top!, "water"), true);
    assert.equal(gearStarsToInvGrade(1), "gray");
    assert.equal(gearStarsToInvGrade(3), "blue");
    assert.equal(gearStarsToInvGrade(5), "red");
    assert.equal(gearStarsToQuality(1), "normal");
    assert.equal(gearStarsToQuality(3), "rare");
    assert.equal(gearStarsToQuality(5), "legend");
    const drop = rollGearDrop(() => 0.01, "t", { preferredSlot: "weapon", preferredElement: "dark" });
    assert.equal(drop.slot, "weapon");
    assert.equal(drop.element, "dark");
    assert.ok(drop.stars >= 1 && drop.stars <= 5);
    assert.ok(drop.quality);
    const armorDrop = rollGearDrop(() => 0.5, "t_armor", { preferredSlot: "top" });
    assert.equal(armorDrop.slot, "top");
    assert.ok(armorDrop.materialId);
  });

  it("scales gear enhance stat bumps by level", () => {
    const base = normalizeGearPiece({
      id: "t_enh",
      slot: "top",
      nameKo: "t",
      enhance: 0,
      setId: "guardian",
      stars: 3,
      quality: "rare",
      materialId: "plate",
    });
    const plus1 = normalizeGearPiece({ ...base, enhance: 1 });
    const plus12 = normalizeGearPiece({ ...base, enhance: 12 });
    const plus11 = normalizeGearPiece({ ...base, enhance: 11 });
    const earlyStep = plus1.summonerHpBonus - base.summonerHpBonus;
    const lateStep = plus12.summonerHpBonus - plus11.summonerHpBonus;
    assert.ok(earlyStep > 0);
    assert.ok(lateStep > earlyStep * 1.8, `late ${lateStep} vs early ${earlyStep}`);
    assert.ok(gearEnhanceStepMul(0) < gearEnhanceStepMul(14));
  });

  it("reapplies enhance bonuses when normalizing gear", () => {
    let piece = normalizeGearPiece({
      id: "t_norm_enh",
      slot: "top",
      nameKo: "t",
      enhance: 0,
      setId: "guardian",
      stars: 4,
      quality: "epic",
      materialId: "chain",
    });
    for (let i = 0; i < 8; i++) piece = bumpGearEnhance(piece);
    const norm = normalizeGearPiece(piece);
    assert.equal(norm.enhance, 8);
    assert.equal(norm.summonerHpBonus, piece.summonerHpBonus);
    assert.equal(norm.summonerDefBonus, piece.summonerDefBonus);
  });

  it("scales gear stats steeply by star grade", () => {
    const low = normalizeGearPiece({
      id: "t_low",
      slot: "top",
      nameKo: "t",
      enhance: 0,
      setId: "guardian",
      stars: 1,
      quality: "legend",
      materialId: "cloth",
    });
    const high = normalizeGearPiece({
      id: "t_high",
      slot: "top",
      nameKo: "t",
      enhance: 0,
      setId: "guardian",
      stars: 5,
      quality: "normal",
      materialId: "cloth",
    });
    assert.equal(low.quality, "normal");
    assert.equal(high.quality, "legend");
    const hpRatio = high.summonerHpBonus / low.summonerHpBonus;
    assert.ok(hpRatio >= 3.8, `expected steep ★5/★1 hp ratio, got ${hpRatio}`);
    assert.ok(high.skillPowerBonus >= low.skillPowerBonus);
  });

  it("maps gear art stems and material stat bias", () => {
    const cloth = normalizeGearPiece({
      id: "t_cloth",
      slot: "top",
      nameKo: "t",
      enhance: 0,
      setId: "guardian",
      stars: 3,
      quality: "normal",
      materialId: "cloth",
    });
    const plate = normalizeGearPiece({
      id: "t_plate",
      slot: "top",
      nameKo: "t",
      enhance: 0,
      setId: "guardian",
      stars: 3,
      quality: "normal",
      materialId: "plate",
    });
    assert.ok(plate.summonerHpBonus > cloth.summonerHpBonus);
    assert.equal(gearArtStem(cloth), "top-cloth-s3");
    assert.equal(
      gearArtFilename(createStarterGear("fire").weapon!),
      "weapon-fire-s1.webp",
    );
    assert.equal(getGearMaterial("leather").nameKo, "가죽");
  });

  it("applies hwalro 2-set hp bonus", () => {
    const base = {
      hp: 1000,
      atk: 100,
      def: 50,
      spd: 100,
      critRate: 15,
      critDmg: 50,
      accuracy: 0,
      resistance: 15,
    };
    const s1 = {
      ...createSymbol("hwalro", 1, "a", {
        stars: 6,
        quality: "normal",
        mainStat: "ATK+",
      }),
      mainValue: 0,
      substats: [],
    };
    const s2 = {
      ...createSymbol("hwalro", 2, "b", {
        stars: 6,
        quality: "normal",
        mainStat: "ATK+",
      }),
      mainValue: 0,
      substats: [],
    };
    const out = applySymbolsToStats(base, [s1, s2]);
    assert.equal(out.hp, 1150);
    const prog = summarizeSymbolSets([s1, s2]);
    assert.equal(prog.length, 1);
    assert.equal(prog[0]!.nameKo, "활로");
    assert.equal(prog[0]!.active, true);
    assert.equal(prog[0]!.completions, 1);
    assert.equal(prog[0]!.effectKo, "체력 +15%");
  });

  it("uses an Intangible symbol to fill one missing equipped set piece", () => {
    const violent = [1, 2, 3].map((slot) =>
      createSymbol("gyeongno", slot as 1 | 2 | 3, `v${slot}`),
    );
    const intangible = createSymbol("muhyeong", 4, "intangible");
    const counts = effectiveSymbolSetCounts([...violent, intangible]);
    assert.equal(counts.gyeongno, 4);
    assert.equal(symbolCombatMods([...violent, intangible]).violentChance, 22);
    const progress = summarizeSymbolSets([...violent, intangible]);
    assert.equal(progress.find((set) => set.setId === "gyeongno")?.active, true);
    assert.equal(progress.find((set) => set.setId === "muhyeong")?.active, false);
  });

  it("doubles 2-set bonuses at 4 pieces (hwalro +30% hp)", () => {
    const base = {
      hp: 1000,
      atk: 100,
      def: 50,
      spd: 100,
      critRate: 15,
      critDmg: 50,
      accuracy: 0,
      resistance: 15,
    };
    const blank = (setId: "hwalro" | "mussang" | "gunhim", slot: 1 | 2 | 3 | 4, id: string) => ({
      ...createSymbol(setId, slot, id),
      mainStat: "ATK+",
      mainValue: 0,
      substats: [],
    });
    const fourHwalro = [1, 2, 3, 4].map((slot) =>
      blank("hwalro", slot as 1 | 2 | 3 | 4, `h${slot}`),
    );
    const hp = applySymbolsToStats(base, fourHwalro);
    assert.equal(hp.hp, 1300);
    const hwalroProg = summarizeSymbolSets(fourHwalro);
    assert.equal(hwalroProg[0]!.completions, 2);
    assert.equal(hwalroProg[0]!.effectKo, "체력 +30%");

    const fourMussang = [1, 2, 3, 4].map((slot) =>
      blank("mussang", slot as 1 | 2 | 3 | 4, `m${slot}`),
    );
    const crit = applySymbolsToStats(base, fourMussang);
    assert.equal(crit.critRate, 39);
    assert.equal(summarizeSymbolSets(fourMussang)[0]!.effectKo, "치명확률 +24%");

    const fourGunhim = [1, 2, 3, 4].map((slot) =>
      blank("gunhim", slot as 1 | 2 | 3 | 4, `g${slot}`),
    );
    const def = applySymbolsToStats(base, fourGunhim);
    assert.equal(def.def, 65);
    assert.equal(summarizeSymbolSets(fourGunhim)[0]!.effectKo, "방어력 +30%");

    const fourBogang = [1, 2, 3, 4].map((slot) => ({
      ...createSymbol("bogang", slot as 1 | 2 | 3 | 4, `b${slot}`),
      mainStat: "ATK+",
      mainValue: 0,
      substats: [],
    }));
    const mods = symbolCombatMods(fourBogang);
    assert.equal(mods.startShieldPct, 0.3);
    assert.equal(summarizeSymbolSets(fourBogang)[0]!.effectKo, "착용자 실드 3턴(체력의 30%)");
  });

  it("applies SW set bonuses (mussang/chimtu/jipjung)", () => {
    const base = {
      hp: 1000,
      atk: 100,
      def: 50,
      spd: 100,
      critRate: 15,
      critDmg: 100,
      accuracy: 0,
      resistance: 15,
    };
    const blank = (
      setId: "mussang" | "chimtu" | "jipjung",
      slot: 1 | 2 | 3 | 4,
      id: string,
    ) => ({
      ...createSymbol(setId, slot, id),
      mainStat: "ATK+",
      mainValue: 0,
      substats: [],
    });
    const mussang = applySymbolsToStats(base, [
      blank("mussang", 1, "m1"),
      blank("mussang", 2, "m2"),
    ]);
    assert.equal(mussang.critRate, 27);
    const chimtu = applySymbolsToStats(base, [
      blank("chimtu", 1, "c1"),
      blank("chimtu", 2, "c2"),
      blank("chimtu", 3, "c3"),
      blank("chimtu", 4, "c4"),
    ]);
    assert.equal(chimtu.critDmg, 140);
    const jipjung = applySymbolsToStats(base, [
      blank("jipjung", 1, "j1"),
      blank("jipjung", 2, "j2"),
    ]);
    assert.equal(jipjung.accuracy, 20);
    assert.equal(jipjung.critRate, 15);
  });

  it("uses Spokland main values by stars", () => {
    assert.equal(mainStatAtEnhance("ATK+", 6, 0), 22);
    assert.equal(mainStatAtEnhance("HP+", 6, 0), 360);
    assert.equal(mainStatAtEnhance("SPD+", 6, 0), 7);
  });

  it("returns Spokland Max at +15", () => {
    assert.equal(mainStatAtEnhance("HP+", 6, 15), 2448);
    assert.equal(mainStatAtEnhance("ATK+", 6, 15), 160);
    assert.equal(mainStatAtEnhance("ATK%", 6, 15), 63);
  });

  it("unlocks or powers substats at +3/+6/+9/+12", () => {
    let s = createSymbol("hwalro", 1, "enh", {
      quality: "normal",
      rng: () => 0.1,
    });
    assert.equal(s.substats.length, 0);
    const rng = () => 0.25;
    for (let i = 0; i < 3; i++) s = bumpSymbolEnhance(s, rng);
    assert.equal(s.enhance, 3);
    assert.equal(s.substats.length, 1);
    for (let i = 0; i < 3; i++) s = bumpSymbolEnhance(s, rng);
    assert.equal(s.enhance, 6);
    assert.equal(s.substats.length, 2);
    for (let i = 0; i < 3; i++) s = bumpSymbolEnhance(s, rng);
    assert.equal(s.enhance, 9);
    assert.equal(s.substats.length, 3);
    for (let i = 0; i < 3; i++) s = bumpSymbolEnhance(s, rng);
    assert.equal(s.enhance, 12);
    assert.equal(s.substats.length, 4);

    let legend = createSymbol("hwalro", 2, "leg", {
      quality: "legend",
      rng: () => 0.2,
    });
    assert.equal(legend.substats.length, 4);
    const vals = legend.substats.map((x) => x.value);
    legend = { ...legend, enhance: 2 };
    legend = bumpSymbolEnhance(legend, () => 0);
    assert.equal(legend.enhance, 3);
    assert.equal(legend.substats.length, 4);
    assert.ok(
      legend.substats.some((sub, i) => sub.value > vals[i]!),
      "expected one substat powered at +3 when already at max",
    );
  });

  it("rolls imprintable mains for slots 2/4/6", () => {
    const s = createSymbol("hwalro", 4, "t");
    assert.equal(canImprintSymbol(s), true);
    assert.equal(canImprintSymbol(createSymbol("hwalro", 1, "x")), false);
    assert.equal(canImprintSymbol(createSymbol("hwalro", 2, "s2")), true);
    const next = imprintSymbolMain(s, () => 0.99);
    assert.ok(next);
    assert.notEqual(next!.mainStat, s.mainStat);
  });

  it("grinds a flat prefix that does not scale with enhance", () => {
    const s = createSymbol("hwalro", 1, "g");
    assert.equal(canGrindSymbol(s), true);
    const ground = grindSymbolPrefix(s, () => 0);
    assert.ok(ground?.prefixStat);
    assert.ok((ground!.prefixValue ?? 0) > 0);

    const base = {
      hp: 1000,
      atk: 100,
      def: 50,
      spd: 100,
      critRate: 15,
      critDmg: 50,
      accuracy: 0,
      resistance: 15,
    };
    const flat = {
      ...ground!,
      enhance: 0,
      mainStat: "ATK+" as const,
      mainValue: 0,
      substats: [],
      prefixStat: "HP+",
      prefixValue: 100,
    };
    const enhanced = { ...flat, enhance: 15 };
    const a = applySymbolsToStats(base, [flat]);
    const b = applySymbolsToStats(base, [enhanced]);
    assert.equal(a.hp, 1100);
    assert.equal(b.hp, 1100);
  });

  it("enhances an existing substat via grindstone helper", () => {
    const s = {
      ...createSymbol("hwalro", 4, "g2"),
      substats: [{ stat: "SPD+", value: 5 }],
    };
    const next = grindEnhanceSubstat(s, () => 0);
    assert.ok(next);
    assert.ok((next!.substats?.[0]?.value ?? 0) > 5);
  });

  it("rolls symbol drops with quality and stars", () => {
    const drop = rollSymbolDrop(() => 0.5, "t0", {
      preferredSet: "hwalro",
      setPool: ["hwalro"],
      starWeights: [{ value: 5, w: 1 }],
      qualityWeights: [{ value: "epic", w: 1 }],
    });
    assert.equal(drop.setId, "hwalro");
    assert.equal(drop.stars, 5);
    assert.equal(drop.quality, "epic");
    assert.equal(drop.substats.length, 3);
  });

  it("scenario normal star table is almost only ★1 with rare ★2", () => {
    assert.deepEqual(
      SCENARIO_NORMAL_STAR_WEIGHTS.map((r) => r.value),
      [1, 2, 3],
    );
    const total = SCENARIO_NORMAL_STAR_WEIGHTS.reduce((n, r) => n + r.w, 0);
    const one = SCENARIO_NORMAL_STAR_WEIGHTS.find((r) => r.value === 1)!.w;
    assert.ok(one / total >= 0.75);
    const drop = rollSymbolDrop(() => 0.01, "n0", {
      preferredSet: "hwalro",
      setPool: ["hwalro"],
      starWeights: SCENARIO_NORMAL_STAR_WEIGHTS,
    });
    assert.ok(drop.stars >= 1 && drop.stars <= 3);
  });

  it("caps scenario symbols at ★3 and starts Cairos from ★3 upward by floor", () => {
    const normal = scenarioSymbolDropTable("normal", 1);
    const hard = scenarioSymbolDropTable("hard", 1);
    const hell = scenarioSymbolDropTable("hell", 7);
    assert.ok(normal.dropChance >= 0.4 && normal.dropChance < 0.5);
    for (const table of [normal, hard, hell]) {
      assert.ok(table.starWeights.every((r) => r.value >= 1 && r.value <= 3));
      assert.ok(table.starWeights.some((r) => r.value === 3));
    }
    assert.ok(hell.qualityWeights.some((r) => r.value === "legend"));

    const b1 = getStage("giant_b1")!;
    const b5 = getStage("giant_b5")!;
    const b10 = getStage("giant_b10")!;
    assert.ok(b1.starWeights!.every((r) => r.value >= 3));
    assert.ok(b1.starWeights!.every((r) => r.value <= 4));
    assert.ok(b5.starWeights!.some((r) => r.value === 6));
    assert.deepEqual(b10.starWeights, [{ value: 6, w: 100 }]);
    assert.ok(b10.qualityWeights!.every((r) => r.value !== "normal"));
    assert.ok(
      (b10.qualityWeights!.find((r) => r.value === "rare")?.w ?? 0) >= 55,
    );
  });

  it("gates magic skill enhance ranks by summoner level", () => {
    assert.equal(magicEnhanceRequiredLevel(0), 1);
    assert.equal(magicEnhanceRequiredLevel(1), 5);
    assert.equal(magicEnhanceRequiredLevel(2), 10);
    assert.equal(magicEnhanceRequiredLevel(3), 15);
    assert.equal(magicEnhanceRequiredLevel(4), 20);
  });
});
