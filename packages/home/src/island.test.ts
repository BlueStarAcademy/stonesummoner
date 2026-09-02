import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ENERGY_MAX,
  PHASE1_BUILDINGS,
  PHASE_BUILDINGS,
  addSummonerExp,
  buildingUpgradeManaCost,
  collectCrystal,
  collectMana,
  createStarterIsland,
  energyMaxForLevel,
  energyRegenRemainingMs,
  grantEnergy,
  hasBuilding,
  maxProdBuildingLevelForAccount,
  productionCrystalCap,
  productionCrystalPerHour,
  productionStorageCap,
  runWish,
  spendEnergy,
  syncBuildingUnlocks,
  tickProduction,
  upgradeBuilding,
} from "./island.js";

describe("Phase1 island", () => {
  it("starts with four buildings", () => {
    const island = createStarterIsland(0);
    assert.equal(PHASE1_BUILDINGS.length, 4);
    assert.ok(hasBuilding(island, "summon_hearth"));
    assert.ok(hasBuilding(island, "power_circle"));
    assert.ok(hasBuilding(island, "gateway"));
    assert.ok(hasBuilding(island, "mana_pond"));
  });

  it("produces mana over time and collects", () => {
    const t0 = 0;
    let island = createStarterIsland(t0);
    island = tickProduction(island, 3_600_000);
    const pond = island.buildings.find((b) => b.id === "mana_pond")!;
    assert.ok(pond.storedMana > 400);
    const before = island.mana;
    island = collectMana(island, "mana_pond", 3_600_000);
    assert.ok(island.mana > before);
    const after = island.buildings.find((b) => b.id === "mana_pond")!;
    assert.equal(after.storedMana, 0);
  });

  it("respects storage cap", () => {
    let island = createStarterIsland(0);
    island = tickProduction(island, 3_600_000 * 100);
    const pond = island.buildings.find((b) => b.id === "mana_pond")!;
    assert.equal(pond.storedMana, 4000);
  });

  it("upgrades mana pond rate and storage cap", () => {
    let island = createStarterIsland(0);
    island = { ...island, mana: 8000, summonerLevel: 3 };
    const cost = buildingUpgradeManaCost(1);
    const r = upgradeBuilding(island, "mana_pond");
    assert.match(r.message, /골드 연못 Lv\.2/);
    assert.equal(r.island.mana, 8000 - cost);
    const pond = r.island.buildings.find((b) => b.id === "mana_pond")!;
    assert.equal(pond.level, 2);
    const def = PHASE1_BUILDINGS.find((b) => b.id === "mana_pond")!;
    assert.equal(productionStorageCap(def, 2), 8000);

    island = tickProduction(r.island, 3_600_000 * 100);
    const full = island.buildings.find((b) => b.id === "mana_pond")!;
    assert.equal(full.storedMana, 8000);
  });

  it("caps production upgrades to account level", () => {
    assert.equal(buildingUpgradeManaCost(1), 3300);
    assert.equal(buildingUpgradeManaCost(2), 8200);
    assert.equal(maxProdBuildingLevelForAccount(1), 1);
    assert.equal(maxProdBuildingLevelForAccount(2), 1);
    assert.equal(maxProdBuildingLevelForAccount(3), 2);
    assert.equal(maxProdBuildingLevelForAccount(5), 3);
    assert.equal(maxProdBuildingLevelForAccount(8), 4);
    assert.equal(maxProdBuildingLevelForAccount(12), 5);
    assert.equal(maxProdBuildingLevelForAccount(17), 6);
    assert.equal(maxProdBuildingLevelForAccount(20), 6);
    assert.equal(maxProdBuildingLevelForAccount(47), 10);
    let island = createStarterIsland(0);
    island = { ...island, mana: 20_000 };
    const blocked = upgradeBuilding(island, "mana_pond");
    assert.equal(
      island.buildings.find((b) => b.id === "mana_pond")!.level,
      1,
    );
    assert.match(blocked.message, /소환사 Lv\.3/);
    island = { ...island, summonerLevel: 3 };
    const r = upgradeBuilding(island, "mana_pond");
    assert.equal(r.island.buildings.find((b) => b.id === "mana_pond")!.level, 2);
  });

  it("unlocks crystal mine and wish at high summoner level", () => {
    let island = createStarterIsland(0);
    island = { ...island, summonerLevel: 10 };
    island = syncBuildingUnlocks(island, 0);
    assert.ok(hasBuilding(island, "crystal_mine"));
    assert.ok(hasBuilding(island, "wish_temple"));
    const wish = runWish(island, Date.UTC(2026, 0, 1), () => 0.1);
    assert.match(wish.message, /소원/);
    assert.equal(wish.island.lastWishDay, "2026-01-01");
    assert.equal(wish.island.wishUsesToday, 1);
    assert.ok((wish.island.wishCooldownUntil ?? 0) > Date.UTC(2026, 0, 1));
    assert.ok(wish.reward);
    assert.equal(wish.reward?.kind, "mana");

    const blocked = runWish(wish.island, Date.UTC(2026, 0, 1, 0, 30), () => 0.1);
    assert.match(blocked.message, /쿨타임/);
    assert.equal(blocked.reward, undefined);

    const afterCool = runWish(
      wish.island,
      Date.UTC(2026, 0, 1, 1, 0),
      () => 0.1,
    );
    assert.ok(afterCool.reward);
    assert.equal(afterCool.island.wishUsesToday, 2);

    const third = runWish(afterCool.island, Date.UTC(2026, 0, 1, 2, 0), () => 0.1);
    assert.ok(third.reward);
    assert.equal(third.island.wishUsesToday, 3);
    const capped = runWish(third.island, Date.UTC(2026, 0, 1, 5, 0), () => 0.1);
    assert.match(capped.message, /3회/);
    assert.equal(capped.reward, undefined);
  });

  it("produces crystals slowly like SW mine and keeps leftover after collect", () => {
    const def = PHASE_BUILDINGS.find((b) => b.id === "crystal_mine")!;
    assert.equal(productionCrystalPerHour(def, 1), 0.1);
    assert.equal(productionCrystalCap(def, 1), 3);
    assert.equal(productionCrystalPerHour(def, 10), 1);
    assert.equal(productionCrystalCap(def, 10), 30);

    let island = createStarterIsland(0);
    island = { ...island, summonerLevel: 10 };
    island = syncBuildingUnlocks(island, 0);
    const hour = 3_600_000;
    island = tickProduction(island, 10 * hour);
    const mine = island.buildings.find((b) => b.id === "crystal_mine")!;
    assert.equal(mine.storedCrystal, 1);

    island = tickProduction(island, 15 * hour);
    const mid = island.buildings.find((b) => b.id === "crystal_mine")!;
    assert.equal(mid.storedCrystal, 1.5);
    const before = island.crystal;
    island = collectCrystal(island, "crystal_mine", 15 * hour);
    assert.equal(island.crystal, before + 1);
    const leftover = island.buildings.find((b) => b.id === "crystal_mine")!;
    assert.equal(leftover.storedCrystal, 0.5);

    island = tickProduction(island, 200 * hour);
    const full = island.buildings.find((b) => b.id === "crystal_mine")!;
    assert.equal(full.storedCrystal, 3);
  });

  it("regens energy 1 per 5 minutes up to max", () => {
    let island = createStarterIsland(0);
    island = { ...island, energy: 20, energyUpdatedAt: 0 };
    island = tickProduction(island, 300_000);
    assert.equal(island.energy, 21);
    assert.equal(island.energyUpdatedAt, 300_000);
    island = tickProduction(island, 900_000);
    assert.equal(island.energy, 23);
    island = tickProduction(island, 300_000 * 100);
    assert.equal(island.energy, island.energyMax);
  });

  it("tracks countdown to next energy and starts timer when leaving max", () => {
    let island = createStarterIsland(0);
    island = { ...island, energy: 20, energyUpdatedAt: 0 };
    assert.equal(energyRegenRemainingMs(island, 45_000), 255_000);
    assert.equal(energyRegenRemainingMs(island, 300_000), 0);
    island = { ...island, energy: island.energyMax!, energyUpdatedAt: 0 };
    assert.equal(energyRegenRemainingMs(island, 30_000), null);
    const spent = spendEnergy(island, 3, 90_000);
    assert.equal(spent.energy, island.energyMax! - 3);
    assert.equal(spent.energyUpdatedAt, 90_000);
    assert.equal(energyRegenRemainingMs(spent, 90_000), 300_000);
  });

  it("levels summoner from exp", () => {
    const island = createStarterIsland(0);
    const r = addSummonerExp(island, 510);
    assert.equal(r.levelsGained, 2);
    assert.equal(r.island.summonerLevel, 3);
    assert.equal(r.island.summonerExp, 0);
  });

  it("scales energy max with summoner level", () => {
    assert.equal(energyMaxForLevel(1), ENERGY_MAX);
    assert.equal(energyMaxForLevel(2), ENERGY_MAX + 2);
    assert.equal(energyMaxForLevel(10), ENERGY_MAX + 18);
    const island = createStarterIsland(0);
    const r = addSummonerExp(island, 510);
    assert.equal(r.island.energyMax, energyMaxForLevel(3));
  });

  it("preserves overflow energy above max during regen ticks", () => {
    let island = createStarterIsland(0);
    island = {
      ...island,
      energy: 120,
      energyMax: 100,
      energyUpdatedAt: 0,
    };
    island = tickProduction(island, 180_000 * 10);
    assert.equal(island.energy, 120);
    assert.equal(energyRegenRemainingMs(island, 180_000 * 10), null);
  });

  it("lets granted energy exceed the regen cap even when below max", () => {
    let island = createStarterIsland(0);
    island = { ...island, energy: 95, energyMax: 100 };
    island = grantEnergy(island, 20);
    assert.equal(island.energy, 115);
    island = tickProduction(island, 180_000 * 10);
    assert.equal(island.energy, 115);
  });
});
