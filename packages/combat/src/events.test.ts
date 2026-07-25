import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Board } from "stonesummoner-board";
import {
  CIRCLE_EVENT_INTERVAL,
  rollCircleEvent,
  shouldRollCircleEvent,
} from "./circleEvents.js";
import { CAPTURE_SHOP_THRESHOLD, pickCaptureShopChoice } from "./captureShop.js";

describe("circle events & capture shop", () => {
  it("rolls events on interval", () => {
    assert.equal(shouldRollCircleEvent(0), false);
    assert.equal(shouldRollCircleEvent(CIRCLE_EVENT_INTERVAL), true);
    assert.ok(rollCircleEvent(() => 0));
  });

  it("picks capture shop choices", () => {
    assert.equal(CAPTURE_SHOP_THRESHOLD, 3);
    assert.ok(["mana", "amplify", "cleanse"].includes(pickCaptureShopChoice(() => 0)));
  });

  it("forceClear removes stones for meteor", () => {
    const b = new Board(5);
    b.play("black", { x: 2, y: 2 });
    assert.equal(b.forceClear({ x: 2, y: 2 }), true);
    assert.equal(b.at({ x: 2, y: 2 }), null);
  });
});
