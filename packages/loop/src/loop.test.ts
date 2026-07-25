import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createNewSave,
  homeCollect,
  listGear,
  listRoster,
  listSymbols,
  runDemoLoop,
  runEnhance,
  runEnhanceGear,
  runEnhanceSymbol,
  runEquipSymbol,
  runSortie,
  runSummon,
} from "./loop.js";

describe("game loop", () => {
  it("collects mana from pond", () => {
    const save = createNewSave(0);
    const r = homeCollect(save, 3_600_000);
    assert.ok(r.save.island.mana > save.island.mana);
    assert.match(r.message, /진액 연못/);
  });

  it("runs sortie with energy cost and reward", () => {
    let save = createNewSave(0);
    save = { ...save, island: { ...save.island, energy: 50 } };
    const r = runSortie(save, "garen_1_1", { rng: () => 0.1 });
    assert.equal(r.save.island.energy, 47);
    assert.ok(r.reward);
    if (r.reward?.victory) {
      assert.ok(r.reward.mana > 0);
      assert.ok(r.save.clearedStages.includes("garen_1_1"));
    }
  });

  it("summons and enhances monsters", () => {
    let save = createNewSave(0);
    assert.equal(save.roster.length, 4);
    assert.equal(save.scrolls, 5);

    const sum = runSummon(save, () => 0.1);
    assert.match(sum.message, /소환 성공/);
    assert.equal(sum.save.scrolls, 4);
    assert.equal(sum.save.roster.length, 5);
    save = sum.save;

    const before = save.roster[0]!.level;
    const enh = runEnhance(save, "0");
    assert.match(enh.message, /강화/);
    assert.equal(enh.save.roster[0]!.level, before + 1);
    assert.ok(enh.save.island.mana < save.island.mana);
  });

  it("enhances gear and symbols, equips drops", () => {
    let save = createNewSave(0);
    assert.ok(save.gear.accessory);
    assert.equal(listGear(save).length, 2);
    assert.ok(listSymbols(save).length >= 2);

    const g = runEnhanceGear(save, "orb");
    assert.match(g.message, /장비 강화/);
    assert.equal(g.save.gear.orb.enhance, 1);
    save = g.save;

    const se = runEnhanceSymbol(save, "0");
    assert.match(se.message, /상징 강화/);
    assert.equal(se.save.symbols[0]!.enhance, 1);
    save = se.save;

    // Drop a symbol then equip on monster 1
    save = {
      ...save,
      symbols: [
        ...save.symbols,
        {
          id: "extra_s3",
          setId: "hwalro",
          slot: 3,
          stars: 6,
          enhance: 0,
          mainStat: "DEF+",
          mainValue: 22,
        },
      ],
    };
    const eq = runEquipSymbol(save, "1", String(save.symbols.length - 1));
    assert.match(eq.message, /장착/);
    assert.equal(eq.save.roster[1]!.symbolSlots[2], "extra_s3");
  });

  it("lists roster", () => {
    const lines = listRoster(createNewSave(0));
    assert.equal(lines.length, 4);
    assert.match(lines[0]!, /불꽃잡이|Lv/);
  });

  it("demo loop completes full home cycle", () => {
    const steps = runDemoLoop(() => 0.1);
    assert.equal(steps.length, 7);
    assert.match(steps[0]!.message, /진액/);
    assert.match(steps[1]!.message, /소환/);
    assert.match(steps[2]!.message, /강화/);
    assert.match(steps[3]!.message, /장비/);
    assert.match(steps[4]!.message, /상징/);
    assert.match(steps[5]!.message, /승리|패배/);
    assert.match(steps[6]!.message, /진액/);
  });
});
