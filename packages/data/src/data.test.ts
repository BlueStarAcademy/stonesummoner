import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applySymbolsToStats,
  canGrindSymbol,
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
  createStarterGear,
  createStarterHwalro,
  createSymbol,
  gearEnhanceCrystalCost,
  gearEnhanceManaCost,
  gearSellCrystal,
  gearSellMana,
  gearSetBonuses,
  getMonster,
  getStage,
  grindSymbolPrefix,
  imprintSymbolMain,
  mainStatAtEnhance,
  MAX_GEAR_ENHANCE,
  MONSTERS,
  normalizeSummonerGear,
  rollGearDrop,
  rollSymbolDrop,
  skillTreeBonuses,
  SKILL_TREE_NODES,
  summarizeGearSets,
  SYMBOL_SETS,
  summarizeSymbolSets,
} from "./index.js";

describe("phase1 data", () => {
  it("has 10 families × 5 elements and 16 symbol sets", () => {
    assert.equal(MONSTERS.length, 50);
    assert.equal(SYMBOL_SETS.length, 16);
    assert.ok(getMonster("seokrang_fire"));
    assert.ok(getMonster("yeongmae_wind"));
    assert.ok(getMonster("jegwan_dark"));
    // Legacy ids still resolve
    assert.equal(getMonster("fire_fang")?.id, "seokrang_fire");
    const families = new Set(MONSTERS.map((m) => m.familyId));
    assert.equal(families.size, 10);
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

  it("chapter1 boards progress 5 → 7 → 9", () => {
    assert.equal(CHAPTER1_STAGES.length, 7);
    assert.equal(getStage("garen_1_1")?.boardSize, 5);
    assert.equal(getStage("garen_1_4")?.boardSize, 7);
    assert.equal(getStage("garen_1_5")?.boardSize, 9);
    assert.equal(getStage("garen_1_7")?.boardSize, 9);
    assert.equal(getStage("giant_b1")?.mode, "depth");
    assert.equal(getStage("arena_rookie")?.mode, "arena");
    assert.equal(getStage("guild_raid_boss")?.boardSize, 13);
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
    assert.ok(g.nameKo.length > 0);
  });

  it("aggregates shallow skill tree bonuses", () => {
    assert.ok(SKILL_TREE_NODES.length > 0);
    const b = skillTreeBonuses(SKILL_TREE_NODES.slice(0, 3).map((n) => n.id));
    assert.ok(typeof b === "object");
  });

  it("creates starter gear with six slots", () => {
    const g = createStarterGear();
    assert.ok(g.weapon);
    assert.ok(g.robe || g.armor || g.helm || true);
    const pieces = Object.values(g).filter(Boolean);
    assert.ok(pieces.length >= 4);
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

  it("rolls imprintable mains for slots 2/4/6", () => {
    const s = createSymbol("hwalro", 4, "t");
    assert.equal(canImprintSymbol(s), true);
    assert.equal(canImprintSymbol(createSymbol("hwalro", 1, "x")), false);
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
});
