import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Board } from "./board.js";

describe("Board basics", () => {
  it("creates empty 9x9", () => {
    const b = new Board(9);
    assert.equal(b.size, 9);
    assert.equal(b.emptyPoints().length, 81);
  });

  it("places a stone", () => {
    const b = new Board(9);
    const r = b.play("black", { x: 4, y: 4 });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.capturedCount, 0);
      assert.equal(b.at({ x: 4, y: 4 }), "black");
    }
  });

  it("rejects occupied", () => {
    const b = new Board(9);
    b.play("black", { x: 0, y: 0 });
    const r = b.play("white", { x: 0, y: 0 });
    assert.deepEqual(r, { ok: false, reason: "occupied" });
  });

  it("rejects out of bounds", () => {
    const b = new Board(9);
    const r = b.play("black", { x: 9, y: 0 });
    assert.deepEqual(r, { ok: false, reason: "out_of_bounds" });
  });
});

describe("Capture", () => {
  it("captures a single surrounded stone", () => {
    // . B .
    // B W B  -> black plays bottom to capture W
    // . . .
    const b = new Board(9);
    b.play("black", { x: 1, y: 0 });
    b.play("white", { x: 1, y: 1 });
    b.play("black", { x: 0, y: 1 });
    b.play("black", { x: 2, y: 1 });
    const r = b.play("black", { x: 1, y: 2 });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.capturedCount, 1);
      assert.equal(b.at({ x: 1, y: 1 }), null);
    }
  });

  it("counts liberties", () => {
    const b = new Board(9);
    b.play("black", { x: 0, y: 0 });
    assert.equal(b.liberties({ x: 0, y: 0 }).length, 2);
  });
});

describe("Suicide and ko", () => {
  it("forbids suicide", () => {
    // Fill around (1,1) leaving only that empty for white suicide
    const b = new Board(9);
    b.play("black", { x: 1, y: 0 });
    b.play("black", { x: 0, y: 1 });
    b.play("black", { x: 2, y: 1 });
    b.play("black", { x: 1, y: 2 });
    const r = b.play("white", { x: 1, y: 1 });
    assert.deepEqual(r, { ok: false, reason: "suicide" });
  });

  it("allows capturing move that would look like suicide", () => {
    // Snapback-ready: white at 1,1 with one liberty; black fills and captures
    const b = new Board(9);
    b.play("white", { x: 1, y: 1 });
    b.play("black", { x: 1, y: 0 });
    b.play("black", { x: 0, y: 1 });
    b.play("black", { x: 2, y: 1 });
    const r = b.play("black", { x: 1, y: 2 });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.capturedCount, 1);
  });

  it("enforces simple ko", () => {
    // Classic ko shape on small region
    //   . B W .
    //   B W . W
    //   . B W .
    const b = new Board(9);
    // Setup positions carefully
    b.play("black", { x: 1, y: 0 });
    b.play("white", { x: 2, y: 0 });
    b.play("black", { x: 0, y: 1 });
    b.play("white", { x: 1, y: 1 });
    b.play("white", { x: 3, y: 1 });
    b.play("black", { x: 1, y: 2 });
    b.play("white", { x: 2, y: 2 });
    // Black captures at (2,1)
    const cap = b.play("black", { x: 2, y: 1 });
    assert.equal(cap.ok, true);
    if (cap.ok) {
      assert.equal(cap.capturedCount, 1);
      assert.equal(b.at({ x: 1, y: 1 }), null);
    }
    // White immediate retake at (1,1) is ko
    const ko = b.play("white", { x: 1, y: 1 });
    assert.deepEqual(ko, { ok: false, reason: "ko" });
    // White can play elsewhere then retake
    b.play("white", { x: 8, y: 8 });
    b.play("black", { x: 8, y: 7 });
    const retake = b.play("white", { x: 1, y: 1 });
    assert.equal(retake.ok, true);
  });
});

describe("legalMoves", () => {
  it("returns playable points", () => {
    const b = new Board(5);
    const moves = b.legalMoves("black");
    assert.equal(moves.length, 25);
    b.play("black", { x: 2, y: 2 });
    assert.equal(b.legalMoves("white").length, 24);
  });
});
