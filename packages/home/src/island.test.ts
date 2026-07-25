import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PHASE1_BUILDINGS,
  collectMana,
  createStarterIsland,
  hasBuilding,
  tickProduction,
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
    // 1 hour later
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
});
