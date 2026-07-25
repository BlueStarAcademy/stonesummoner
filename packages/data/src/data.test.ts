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
  gearEnhanceManaCost,
  getMonster,
  getStage,
  grindSymbolPrefix,
  imprintSymbolMain,
  MONSTERS,
  rollSymbolDrop,
  SYMBOL_SETS,
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
  });

  it("creates starter symbol", () => {
    const s = createStarterHwalro(2);
    assert.equal(s.setId, "hwalro");
    assert.equal(s.slot, 2);
  });

  it("creates starter gear with two slots", () => {
    const g = createStarterGear();
    assert.equal(g.accessory.slot, "accessory");
    assert.equal(g.orb.slot, "orb");
    assert.ok(gearEnhanceManaCost(0) > 0);
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
