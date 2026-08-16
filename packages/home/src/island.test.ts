import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ENERGY_MAX,
  PHASE1_BUILDINGS,
  addSummonerExp,
  buildingUpgradeManaCost,
  collectMana,
  createStarterIsland,
  energyMaxForLevel,
  energyRegenRemainingMs,
  hasBuilding,
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
    island = { ...island, mana: 5000 };
    const cost = buildingUpgradeManaCost(1);
    const r = upgradeBuilding(island, "mana_pond");
    assert.match(r.message, /골드 연못 Lv\.2/);
    assert.equal(r.island.mana, 5000 - cost);
    const pond = r.island.buildings.find((b) => b.id === "mana_pond")!;
    assert.equal(pond.level, 2);
    const def = PHASE1_BUILDINGS.find((b) => b.id === "mana_pond")!;
    assert.equal(productionStorageCap(def, 2), 8000);

    island = tickProduction(r.island, 3_600_000 * 100);
    const full = island.buildings.find((b) => b.id === "mana_pond")!;
    assert.equal(full.storedMana, 8000);
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
  });

  it("regens energy 1 per 3 minutes up to max", () => {
    let island = createStarterIsland(0);
    island = { ...island, energy: 50, energyUpdatedAt: 0 };
    island = tickProduction(island, 180_000);
    assert.equal(island.energy, 51);
    assert.equal(island.energyUpdatedAt, 180_000);
    island = tickProduction(island, 540_000);
    assert.equal(island.energy, 53);
    island = tickProduction(island, 180_000 * 100);
    assert.equal(island.energy, island.energyMax);
  });

  it("tracks countdown to next energy and starts timer when leaving max", () => {
    let island = createStarterIsland(0);
    island = { ...island, energy: 50, energyUpdatedAt: 0 };
    assert.equal(energyRegenRemainingMs(island, 45_000), 135_000);
    assert.equal(energyRegenRemainingMs(island, 180_000), 0);
    island = { ...island, energy: island.energyMax!, energyUpdatedAt: 0 };
    assert.equal(energyRegenRemainingMs(island, 30_000), null);
    const spent = spendEnergy(island, 3, 90_000);
    assert.equal(spent.energy, island.energyMax! - 3);
    assert.equal(spent.energyUpdatedAt, 90_000);
    assert.equal(energyRegenRemainingMs(spent, 90_000), 180_000);
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
});
