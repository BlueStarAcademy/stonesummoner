import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSymbol } from "stonesummoner-data";
import {
  createNewSave,
  homeCollect,
  isStageUnlocked,
  listGear,
  listRoster,
  listSymbols,
  runBuyEnergy,
  runBuyGlory,
  runBuyScroll,
  runCraftEssence,
  runCraftScroll,
  runDemoLoop,
  runEnhance,
  runEnhanceGear,
  runEnhanceSymbol,
  runEquipSymbol,
  runEvolve,
  runFusion,
  runGrindSymbol,
  runImprintSymbol,
  runSetParty,
  runSkillUp,
  runSortie,
  runSummon,
  runUpgradeBuilding,
} from "./loop.js";

describe("game loop", () => {
  it("collects mana from pond", () => {
    const save = createNewSave(0);
    const r = homeCollect(save, 3_600_000);
    assert.ok(r.save.island.mana > save.island.mana);
    assert.match(r.message, /진액 연못/);
  });

  it("upgrades mana pond and grants crystal on clear", () => {
    let save = createNewSave(0);
    save = { ...save, island: { ...save.island, mana: 5000, energy: 50 } };
    const up = runUpgradeBuilding(save, "mana_pond");
    assert.match(up.message, /Lv\.2/);
    assert.equal(
      up.save.island.buildings.find((b) => b.id === "mana_pond")!.level,
      2,
    );
    save = up.save;
    const beforeCrystal = save.island.crystal;
    const r = runSortie(save, "garen_1_1", { rng: () => 0.1 });
    if (r.reward?.victory) {
      assert.ok((r.reward.crystal ?? 0) >= 1);
      assert.equal(r.save.island.crystal, beforeCrystal + (r.reward.crystal ?? 0));
    }
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
      assert.ok((r.reward.summonerExp ?? 0) > 0);
    }
  });

  it("runs phase2 arena glory and depth unlock", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      clearedStages: ["garen_1_1", "garen_1_2", "garen_1_3", "garen_1_4", "garen_1_5"],
      island: { ...save.island, mana: 8000, energy: 80, summonerLevel: 10 },
      gloryPoints: 100,
    };
    assert.equal(isStageUnlocked(save, "depth_hwalro"), true);
    assert.equal(isStageUnlocked(save, "tower_2_1"), true);
    assert.equal(isStageUnlocked(save, "arena_rookie"), true);

    const arena = runSortie(save, "arena_rookie", { rng: () => 0.1 });
    if (arena.reward?.victory) {
      assert.ok((arena.reward.glory ?? 0) >= 25);
      assert.ok(arena.save.gloryPoints >= save.gloryPoints);
    }

    const buy = runBuyGlory(save, "ancient_sword");
    assert.match(buy.message, /고대의 검/);
    assert.equal(buy.save.gloryLevels.ancient_sword, 1);
  });

  it("locks later stages until previous clear", () => {
    const save = createNewSave(0);
    assert.equal(isStageUnlocked(save, "garen_1_1"), true);
    assert.equal(isStageUnlocked(save, "garen_1_2"), false);
    const locked = runSortie(save, "garen_1_2", { rng: () => 0.1 });
    assert.match(locked.message, /잠김/);
  });

  it("fuses same-species and unlocks guild raid 13x13", () => {
    let save = createNewSave(0);
    const id = save.roster[0]!.monsterId;
    save = {
      ...save,
      island: { ...save.island, mana: 5000, summonerLevel: 17 },
      roster: [
        ...save.roster,
        {
          ...save.roster[0]!,
          uid: "fuse_donor",
          monsterId: id,
          level: 8,
          evolve: 0,
        },
      ],
      clearedStages: [
        "garen_1_1",
        "garen_1_2",
        "garen_1_3",
        "garen_1_4",
        "garen_1_5",
        "tower_2_1",
        "tower_2_2",
        "tower_2_3",
      ],
    };
    assert.equal(isStageUnlocked(save, "guild_raid_boss"), true);
    assert.equal(isStageUnlocked(save, "warena_qual"), true);

    const before = save.roster.length;
    const fuse = runFusion(save, "0", "fuse_donor");
    assert.match(fuse.message, /융합/);
    assert.equal(fuse.save.roster.length, before - 1);
    assert.equal(fuse.save.roster[0]!.evolve, 1);

    const raid = runSortie(
      { ...fuse.save, island: { ...fuse.save.island, energy: 20 } },
      "guild_raid_boss",
      { rng: () => 0.1, maxTurns: 120 },
    );
    assert.ok(raid.reward || /승리|패배|출정/.test(raid.message));
  });

  it("crafts scroll/essence and buys energy", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      jinmunStones: 5,
      island: {
        ...save.island,
        mana: 2000,
        crystal: 30,
        energy: 10,
        summonerLevel: 19,
      },
    };
    const energy = runBuyEnergy(save, 1);
    assert.match(energy.message, /에너지/);
    assert.equal(energy.save.island.crystal, 20);
    save = energy.save;

    const essence = runCraftEssence(save);
    assert.match(essence.message, /정수/);
    assert.equal(essence.save.jinmunStones, 4);
    save = essence.save;

    const craft = runCraftScroll(save);
    assert.match(craft.message, /제작/);
    assert.equal(craft.save.scrolls, save.scrolls + 1);
  });

  it("sets party from roster indices", () => {
    const save = createNewSave(0);
    const r = runSetParty(save, ["3", "0", "1"]);
    assert.equal(r.save.party.length, 3);
    assert.match(r.message, /파티 편성/);
  });

  it("evolves monster when level and costs met", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      roster: save.roster.map((m, i) =>
        i === 0 ? { ...m, level: 10, evolve: 0 } : m,
      ),
      island: { ...save.island, mana: 5000, crystal: 50 },
    };
    const blocked = runEvolve(
      {
        ...save,
        roster: save.roster.map((m, i) =>
          i === 0 ? { ...m, level: 5 } : m,
        ),
      },
      "0",
    );
    assert.match(blocked.message, /조건 미달/);

    const ok = runEvolve(save, "0");
    assert.match(ok.message, /진화/);
    assert.equal(ok.save.roster[0]!.evolve, 1);
    assert.ok(ok.save.island.mana < save.island.mana);
  });

  it("skills up S2 when level and mana met", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      roster: save.roster.map((m, i) =>
        i === 0
          ? { ...m, level: 5, skillLevels: [1, 1, 1] as [number, number, number] }
          : m,
      ),
      island: { ...save.island, mana: 3000 },
    };
    const blocked = runSkillUp(
      {
        ...save,
        roster: save.roster.map((m, i) =>
          i === 0 ? { ...m, level: 3 } : m,
        ),
      },
      "0",
      1,
    );
    assert.match(blocked.message, /조건 미달/);

    const ok = runSkillUp(save, "0", 1);
    assert.match(ok.message, /스킬업/);
    assert.equal(ok.save.roster[0]!.skillLevels[1], 2);
    assert.ok(ok.save.island.mana < save.island.mana);
  });

  it("buys scrolls and imprints symbol slot 4–6", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      island: { ...save.island, mana: 2000, crystal: 20 },
    };
    const buy = runBuyScroll(save, 2);
    assert.match(buy.message, /소환서 2장/);
    assert.equal(buy.save.scrolls, save.scrolls + 2);
    save = buy.save;

    const slot4 = { ...createSymbol("hwalro", 4, "imp_test"), mainStat: "CRI Dmg%", mainValue: 11 };
    save = { ...save, symbols: [...save.symbols, slot4] };
    const blocked = runImprintSymbol(save, "0"); // slot 1 starter
    assert.match(blocked.message, /각인 불가/);

    const ok = runImprintSymbol(save, "imp_test", () => 0.9);
    assert.match(ok.message, /각인/);
    assert.equal(ok.save.island.crystal, save.island.crystal - 8);
    const updated = ok.save.symbols.find((s) => s.id === "imp_test")!;
    assert.ok(
      updated.mainStat !== "CRI Dmg%" || updated.mainValue !== 11,
    );
  });

  it("grinds symbol prefix for mana", () => {
    let save = createNewSave(0);
    save = { ...save, island: { ...save.island, mana: 500 } };
    const ok = runGrindSymbol(save, "0", () => 0);
    assert.match(ok.message, /연마/);
    assert.equal(ok.save.island.mana, save.island.mana - 150);
    const sym = ok.save.symbols[0]!;
    assert.ok(sym.prefixStat);
    assert.ok((sym.prefixValue ?? 0) > 0);
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
