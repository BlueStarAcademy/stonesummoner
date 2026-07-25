import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applySymbolsToStats,
  CHAPTER1_STAGES,
  createStarterGear,
  createStarterHwalro,
  gearEnhanceManaCost,
  getMonster,
  getStage,
  MONSTERS,
  rollSymbolDrop,
  SYMBOL_SETS,
} from "./index.js";

describe("phase1 data", () => {
  it("has 8 monsters and 3 symbol sets", () => {
    assert.equal(MONSTERS.length, 8);
    assert.equal(SYMBOL_SETS.length, 3);
    assert.ok(getMonster("fire_fang"));
  });

  it("chapter1 boards progress 5 → 7 → 9", () => {
    assert.equal(CHAPTER1_STAGES.length, 5);
    assert.equal(getStage("garen_1_1")?.boardSize, 5);
    assert.equal(getStage("garen_1_4")?.boardSize, 7);
    assert.equal(getStage("garen_1_5")?.boardSize, 9);
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
