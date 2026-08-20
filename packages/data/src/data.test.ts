import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applySymbolsToStats,
  canGrindSymbol,
  symbolCombatMods,
  canImprintSymbol,
  CHAPTER1_STAGES,
  CAIROS_DRAGON_STAGES,
  CAIROS_GIANT_STAGES,
  CAIROS_NECRO_STAGES,
  DEPTH_STAGES,
  MAIN_QUEST_AREA_COUNT,
  MAIN_QUEST_PIN_LAYOUT,
  MAIN_QUEST_STAGES,
  STAGES_PER_AREA,
  canEquipGearOnElement,
  createEmptyGear,
  createStarterGear,
  createStarterHwalro,
  createSymbol,
  gearEnhanceCrystalCost,
  grindEnhanceSubstat,
  grindSymbolPrefix,
  gearEnhanceManaCost,
  gearSellCrystal,
  gearSellMana,
  gearSetBonuses,
  gearStarsToInvGrade,
  getMonster,
  getStage,
  bumpSymbolEnhance,
  imprintSymbolMain,
  mainStatAtEnhance,
  MAX_GEAR_ENHANCE,
  MONSTERS,
  normalizeSummonerGear,
  rollGearDrop,
  rollSymbolDrop,
  SCENARIO_NORMAL_STAR_WEIGHTS,
  scenarioSymbolDropTable,
  skillTreeBonuses,
  SKILL_TREE_NODES,
  stripUnenhancedStarterGear,
  summarizeGearSets,
  SYMBOL_SETS,
  summarizeSymbolSets,
} from "./index.js";

describe("phase1 data", () => {
  it("has 50 families x 5 elements and 16 symbol sets", () => {
    assert.equal(MONSTERS.length, 250);
    assert.equal(SYMBOL_SETS.length, 16);
    assert.ok(getMonster("wolf_fighter_fire"));
    assert.ok(getMonster("lotus_dancer_wind"));
    assert.ok(getMonster("abyss_priest_dark"));
    assert.ok(getMonster("magic_archer_fire"));
    assert.ok(getMonster("cinder_imp_fire"));
    // Legacy ids still resolve
    assert.equal(getMonster("fire_fang")?.id, "wolf_fighter_fire");
    assert.equal(getMonster("seokrang_fire")?.id, "wolf_fighter_fire");
    const families = new Set(MONSTERS.map((m) => m.familyId));
    assert.equal(families.size, 50);
    const byStars = [1, 2, 3, 4, 5].map(
      (s) =>
        new Set(
          MONSTERS.filter((m) => m.naturalStars === s).map((m) => m.familyId),
        ).size,
    );
    assert.deepEqual(byStars, [10, 10, 12, 12, 6]);
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
      assert.equal(m.skills[0]!.cooldown, 0);
      assert.ok(m.skills[0]!.effects.some((e) => e.kind === "damage"));
    }
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

  it("has Cairos giant/dragon/necro B1–B10 with set pools", () => {
    assert.equal(CAIROS_GIANT_STAGES.length, 10);
    assert.equal(CAIROS_DRAGON_STAGES.length, 10);
    assert.equal(CAIROS_NECRO_STAGES.length, 10);
    assert.equal(DEPTH_STAGES.length, 30);
    assert.ok(CAIROS_GIANT_STAGES[0]!.dropSetPool?.includes("myosu"));
    assert.ok(CAIROS_DRAGON_STAGES[0]!.dropSetPool?.includes("gyeongno"));
    assert.ok(CAIROS_NECRO_STAGES[0]!.dropSetPool?.includes("chimtu"));
    assert.ok(getStage("giant_b10")?.starWeights?.length);
  });

  it("rolls equip dungeon gear drops", () => {
    const g = rollGearDrop(() => 0.2, "test");
    assert.ok(g.slot);
    assert.ok(g.setId);
    assert.ok(g.stars >= 1 && g.stars <= 5);
    assert.ok(g.quality);
    assert.ok(g.nameKo.length > 0);
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
    assert.equal(gearStarsToInvGrade(5), "red");
    const drop = rollGearDrop(() => 0.01, "t", { preferredSlot: "weapon", preferredElement: "dark" });
    assert.equal(drop.slot, "weapon");
    assert.equal(drop.element, "dark");
    assert.ok(drop.stars >= 1 && drop.stars <= 5);
    assert.ok(drop.quality);
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
    assert.equal(summarizeSymbolSets(fourBogang)[0]!.effectKo, "아군 실드 3턴(체력의 30%)");
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

  it("aligns scenario and Cairos drops to SW-like tables (slightly better)", () => {
    const normal = scenarioSymbolDropTable("normal", 1);
    const hard = scenarioSymbolDropTable("hard", 1);
    const hell = scenarioSymbolDropTable("hell", 7);
    assert.ok(normal.dropChance >= 0.4 && normal.dropChance < 0.5);
    assert.ok(hard.starWeights.every((r) => r.value >= 2 && r.value <= 4));
    assert.ok(hell.starWeights.some((r) => r.value === 5));
    assert.ok(hell.qualityWeights.some((r) => r.value === "legend"));

    const b1 = getStage("giant_b1")!;
    const b10 = getStage("giant_b10")!;
    assert.ok(b1.starWeights!.every((r) => r.value <= 4));
    const b10Five = b10.starWeights!.find((r) => r.value === 5)!.w;
    const b10Six = b10.starWeights!.find((r) => r.value === 6)!.w;
    assert.ok(b10Five > b10Six, "B10 should still be mostly ★5 like SW");
    assert.ok(b10.qualityWeights!.every((r) => r.value !== "normal"));
    assert.ok(
      (b10.qualityWeights!.find((r) => r.value === "rare")?.w ?? 0) >= 55,
    );
  });
});
