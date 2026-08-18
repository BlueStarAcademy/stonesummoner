import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Board } from "stonesummoner-board";
import { pickExpertStone } from "./stoneTactic.js";

describe("expert stone tactics", () => {
  it("captures a surrounded enemy stone", () => {
    const b = new Board(5);
    b.play("black", { x: 2, y: 2 });
    b.play("white", { x: 2, y: 1 });
    b.play("white", { x: 1, y: 2 });
    b.play("white", { x: 3, y: 2 });
    const pick = pickExpertStone(b, "white", b.legalMoves("white"));
    assert.deepEqual(pick, { x: 2, y: 3 });
  });

  it("saves its own group in atari instead of a distant empty", () => {
    const b = new Board(7);
    b.play("white", { x: 3, y: 3 });
    b.play("black", { x: 3, y: 2 });
    b.play("black", { x: 2, y: 3 });
    b.play("black", { x: 4, y: 3 });
    const legal = b.legalMoves("white");
    const pick = pickExpertStone(b, "white", legal);
    assert.deepEqual(pick, { x: 3, y: 4 });
  });

  it("keeps two liberties when the move is not a capture", () => {
    const b = new Board(7);
    b.play("white", { x: 3, y: 3 });
    b.play("black", { x: 2, y: 2 });
    const pick = pickExpertStone(b, "white", b.legalMoves("white"));
    assert.ok(pick);
    const trial = b.clone();
    const r = trial.play("white", pick);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    const group = trial.group(pick);
    const libs = trial.libertiesOfGroup(group).length;
    assert.ok(r.capturedCount > 0 || libs >= 2);
  });

  it("opens near tengen on an empty 7x7", () => {
    const b = new Board(7);
    const pick = pickExpertStone(b, "white", b.legalMoves("white"));
    assert.ok(pick);
    const dist = Math.abs(pick.x - 3) + Math.abs(pick.y - 3);
    assert.ok(dist <= 2);
  });
});
