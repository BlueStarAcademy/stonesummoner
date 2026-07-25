import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CHAPTER1_STAGES, getStage } from "./scenario.js";
import { MONSTERS, getMonster } from "./monsters.js";
import { SYMBOL_SETS, createStarterHwalro } from "./symbols.js";

describe("phase1 data", () => {
  it("has 8 monsters and 3 symbol sets", () => {
    assert.equal(MONSTERS.length, 8);
    assert.equal(SYMBOL_SETS.length, 3);
    assert.ok(getMonster("fire_fang"));
  });

  it("chapter1 boards progress 5 then 7", () => {
    assert.equal(CHAPTER1_STAGES.length, 4);
    assert.equal(getStage("garen_1_1")?.boardSize, 5);
    assert.equal(getStage("garen_1_4")?.boardSize, 7);
  });

  it("creates starter symbol", () => {
    const s = createStarterHwalro(2);
    assert.equal(s.setId, "hwalro");
    assert.equal(s.slot, 2);
  });
});
