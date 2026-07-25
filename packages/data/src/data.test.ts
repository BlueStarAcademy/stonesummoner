import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applySymbolsToStats,
  canGrindSymbol,
  canImprintSymbol,
  CHAPTER1_STAGES,
  createStarterGear,
  createStarterHwalro,
  createSymbol,
  gearEnhanceCrystalCost,
  gearEnhanceManaCost,
  gearSetBonuses,
  getMonster,
  getStage,
  grindSymbolPrefix,
  imprintSymbolMain,
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
  it("has 10 monsters and 8 symbol sets", () => {
    assert.equal(MONSTERS.length, 10);
    assert.equal(SYMBOL_SETS.length, 8);
    assert.ok(getMonster("fire_fang"));
    assert.ok(getMonster("mist_shaman"));
    assert.ok(getMonster("abyss_priest"));
  });

  it("gives each monster three skills", () => {
    for (const m of MONSTERS) {
      assert.equal(m.skills.length, 3);
      assert.equal(m.skills[0]!.cooldown, 0);
      assert.ok(m.skills[0]!.effects.some((e) => e.kind === "damage"));
    }
  });

  it("chapter1 boards progress 5 → 7 → 9", () => {
    assert.equal(CHAPTER1_STAGES.length, 5);
    assert.equal(getStage("garen_1_1")?.boardSize, 5);
    assert.equal(getStage("garen_1_4")?.boardSize, 7);
    assert.equal(getStage("garen_1_5")?.boardSize, 9);
    assert.equal(getStage("depth_hwalro")?.mode, "depth");
    assert.equal(getStage("arena_rookie")?.mode, "arena");
    assert.equal(getStage("guild_raid_boss")?.boardSize, 13);
    assert.equal(getStage("warena_qual")?.mode, "world_arena");
    assert.equal(getStage("equip_vault_1")?.mode, "equip");
    assert.equal(getStage("equip_vault_boss")?.gearDropChance, 1);
  });

  it("rolls equip dungeon gear drops", () => {
    const g = rollGearDrop(() => 0.2, "test");
    assert.ok(g.slot);
    assert.ok(g.setId);
    assert.ok(g.nameKo.length > 0);
    assert.ok(g.enhance >= 0);
  });

  it("aggregates shallow skill tree bonuses", () => {
    assert.equal(SKILL_TREE_NODES.length, 13);
    const b = skillTreeBonuses(["root_mana", "dual_mastery"]);
    assert.ok(b.manaRegenBonus >= 0.05);
    assert.equal(b.dualCostMul, 0.85);
    const apex = skillTreeBonuses([
      "root_power",
      "power_focus",
      "declare_mastery",
      "root_mana",
      "mana_pool",
      "abyss_well",
      "root_sense",
      "sense_start",
      "sense_tide",
    ]);
    assert.equal(apex.declareCostMul, 0.85);
    assert.ok(apex.manaMaxBonus >= 32);
    assert.ok(apex.declarePowerBonus >= 0.07);
    assert.ok(apex.boardSenseBonus >= 0.1);
  });

  it("creates starter symbol", () => {
    const s = createStarterHwalro(2);
    assert.equal(s.setId, "hwalro");
    assert.equal(s.slot, 2);
  });

  it("creates starter gear with six slots", () => {
    const g = createStarterGear();
    assert.equal(g.weapon.slot, "weapon");
    assert.equal(g.robe.slot, "robe");
    assert.equal(g.accessory.slot, "accessory");
    assert.equal(g.orb.slot, "orb");
    assert.equal(g.cloak.slot, "cloak");
    assert.equal(g.ring.slot, "ring");
    assert.ok(g.weapon.skillPowerBonus > 0);
    assert.ok(g.robe.summonerHpBonus > 0);
    assert.ok(g.cloak.leaderAtkBonus > 0);
    assert.ok(g.ring.leaderAtkBonus > 0);
    assert.ok(gearEnhanceManaCost(0) > 0);
    assert.ok(gearEnhanceManaCost(14) > gearEnhanceManaCost(9));
    assert.equal(MAX_GEAR_ENHANCE, 15);
    assert.equal(gearEnhanceCrystalCost(11), 0);
    assert.equal(gearEnhanceCrystalCost(12), 1);
    assert.equal(gearEnhanceCrystalCost(14), 3);
    const sets = summarizeGearSets(g);
    assert.ok(sets.find((s) => s.setId === "assault")?.active2);
    assert.ok(sets.find((s) => s.setId === "guardian")?.active2);
    const bonus = gearSetBonuses(g);
    assert.ok(bonus.skillPowerBonus > 0);
    assert.ok(bonus.summonerHpBonus > 0);
  });

  it("applies tempo set and 6pc bonuses", () => {
    const g = createStarterGear();
    for (const slot of [
      "weapon",
      "robe",
      "accessory",
      "orb",
      "cloak",
      "ring",
    ] as const) {
      g[slot] = { ...g[slot], setId: "tempo" };
    }
    const prog = summarizeGearSets(g).find((s) => s.setId === "tempo")!;
    assert.equal(prog.count, 6);
    assert.equal(prog.active2, true);
    assert.equal(prog.active4, true);
    assert.equal(prog.active6, true);
    const bonus = gearSetBonuses(g);
    assert.ok(bonus.startManaPct >= 0.08);
    assert.ok(bonus.skillPowerBonus >= 0.03);
    assert.ok(bonus.manaRegenBonus >= 0.05);
    assert.ok(bonus.leaderAtkBonus >= 0.008);
  });

  it("normalizes legacy two-slot gear", () => {
    const g = normalizeSummonerGear({
      accessory: {
        id: "acc",
        slot: "accessory",
        nameKo: "구회로",
        enhance: 2,
        manaRegenBonus: 0.2,
        manaMaxBonus: 20,
        boardSenseBonus: 0,
        startManaPct: 0.07,
      } as never,
      orb: {
        id: "orb",
        slot: "orb",
        nameKo: "구수정",
        enhance: 1,
        manaRegenBonus: 0,
        manaMaxBonus: 0,
        boardSenseBonus: 0.1,
        startManaPct: 0,
      } as never,
    });
    assert.equal(g.weapon.slot, "weapon");
    assert.equal(g.robe.slot, "robe");
    assert.equal(g.accessory.enhance, 2);
    assert.equal(g.cloak.slot, "cloak");
    assert.equal(g.ring.slot, "ring");
    assert.ok(g.cloak.leaderAtkBonus > 0);
    assert.equal(g.accessory.skillPowerBonus, 0);
    assert.equal(g.weapon.skillPowerBonus > 0, true);
  });

  it("applies hwalro 2-set hp bonus", () => {
    const base = {
      hp: 1000,
      atk: 100,
      def: 50,
      spd: 100,
      critRate: 15,
      critDmg: 50,
    };
    const s1 = {
      ...createStarterHwalro(1),
      id: "a",
      mainStat: "ATK+",
      mainValue: 0,
    };
    const s2 = {
      ...createStarterHwalro(2),
      id: "b",
      mainStat: "HP+",
      mainValue: 0,
    };
    const out = applySymbolsToStats(base, [s1, s2]);
    assert.equal(out.hp, 1150);
    const prog = summarizeSymbolSets([s1, s2]);
    assert.equal(prog.length, 1);
    assert.equal(prog[0]!.nameKo, "활로");
    assert.equal(prog[0]!.active, true);
  });

  it("rolls imprintable mains for slots 4–6", () => {
    const s = createSymbol("hwalro", 4, "t");
    assert.equal(canImprintSymbol(s), true);
    assert.equal(canImprintSymbol(createSymbol("hwalro", 1, "x")), false);
    const next = imprintSymbolMain(s, () => 0.99);
    assert.ok(next);
    assert.notEqual(
      `${next!.mainStat}:${next!.mainValue}`,
      `${s.mainStat}:${s.mainValue}`,
    );
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
    };
    const flat = {
      ...ground!,
      enhance: 0,
      mainStat: "ATK+",
      mainValue: 0,
      prefixStat: "HP+",
      prefixValue: 100,
    };
    const enhanced = { ...flat, enhance: 15 };
    const a = applySymbolsToStats(base, [flat]);
    const b = applySymbolsToStats(base, [enhanced]);
    assert.equal(a.hp, 1100);
    assert.equal(b.hp, 1100);
  });

  it("rolls phase1 symbol drops across sets", () => {
    const sets = new Set(
      Array.from({ length: 40 }, (_, i) =>
        rollSymbolDrop(() => (i % 10) / 10, `t${i}`).setId,
      ),
    );
    assert.ok(sets.has("hwalro"));
    assert.ok(sets.has("yongmaeng") || sets.has("haengma"));
  });
});
