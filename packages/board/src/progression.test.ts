import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Board } from "./board.js";
import {
  amplifyCapForPhase,
  COMBAT_BOARD_SIZES,
  createCirclePhaseState,
  registerStoneSummon,
  resetBoardInPlace,
} from "./progression.js";

describe("Board sizes", () => {
  it("supports 5 and 7", () => {
    assert.deepEqual([...COMBAT_BOARD_SIZES], [5, 7]);
    assert.equal(new Board(5).emptyPoints().length, 25);
    assert.equal(new Board(7).emptyPoints().length, 49);
  });
});

describe("Empowered circle progression", () => {
  it("does not reset on 5x5 even after many summons", () => {
    let state = createCirclePhaseState(5);
    for (let i = 0; i < 60; i++) {
      const r = registerStoneSummon(state);
      state = r.state;
      assert.equal(r.shouldReset, false);
    }
    assert.equal(state.boardPhase, 0);
    assert.equal(state.stoneSummonCount, 60);
  });

  it("resets 7x7 after 50 summons and raises phase", () => {
    let state = createCirclePhaseState(7);
    for (let i = 0; i < 49; i++) {
      const r = registerStoneSummon(state);
      state = r.state;
      assert.equal(r.shouldReset, false);
    }
    const hit = registerStoneSummon(state);
    assert.equal(hit.shouldReset, true);
    assert.equal(hit.state.boardPhase, 1);
    assert.equal(hit.state.stoneSummonCount, 0);
    assert.equal(amplifyCapForPhase(hit.state.boardPhase), 1.3);
  });

  it("clear empties the board for empowered reset", () => {
    const b = new Board(7);
    b.play("black", { x: 3, y: 3 });
    b.play("white", { x: 2, y: 2 });
    resetBoardInPlace(b);
    assert.equal(b.emptyPoints().length, 49);
    assert.equal(b.getKoPoint(), null);
  });
});
