import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  acceptFriend,
  areFriends,
  bindSocial,
  classifyLastSeen,
  listFriends,
  removeFriend,
  requestFriend,
  FRIEND_DAY_MS,
  FRIEND_HOUR_MS,
  FRIEND_LONG_MS,
  FRIEND_MONTH_MS,
  FRIEND_ONLINE_MS,
} from "./social.mjs";
import { createMemorySocialOps } from "./socialStore.mjs";

describe("classifyLastSeen", () => {
  const now = Date.parse("2026-08-22T00:00:00Z");

  it("marks recent presence as online", () => {
    assert.equal(classifyLastSeen(now - 1_000, now, false).kind, "online");
    assert.equal(classifyLastSeen(now - FRIEND_ONLINE_MS + 1, now, false).kind, "online");
    assert.equal(classifyLastSeen(0, now, true).kind, "online");
  });

  it("uses hours then days then months", () => {
    assert.deepEqual(classifyLastSeen(now - 5 * FRIEND_HOUR_MS, now), {
      kind: "hours",
      n: 5,
    });
    assert.deepEqual(classifyLastSeen(now - 3 * FRIEND_DAY_MS, now), {
      kind: "days",
      n: 3,
    });
    assert.deepEqual(classifyLastSeen(now - 4 * FRIEND_MONTH_MS, now), {
      kind: "months",
      n: 4,
    });
  });

  it("shows six months but not over as months, then long ago", () => {
    assert.deepEqual(classifyLastSeen(now - FRIEND_LONG_MS, now), {
      kind: "months",
      n: 6,
    });
    assert.equal(
      classifyLastSeen(now - FRIEND_LONG_MS - FRIEND_DAY_MS, now).kind,
      "long",
    );
    assert.equal(classifyLastSeen(0, now, false).kind, "long");
  });
});

describe("friend add/remove", () => {
  it("stores friends and removes them", async () => {
    const db = createMemorySocialOps();
    bindSocial(db);
    const a = "user:aaa";
    const b = "user:bbb";
    await db.upsertSocialProfile(a, { nick: "Alpha", level: 10, touchSeen: true });
    await db.upsertSocialProfile(b, { nick: "Beta", level: 8, touchSeen: true });
    const req = await requestFriend(a, b);
    assert.equal(req.ok, true);
    assert.equal(req.status, "pending_out");
    const acc = await acceptFriend(b, a);
    assert.equal(acc.ok, true);
    assert.equal(await areFriends(a, b), true);
    const listed = await listFriends(a, new Set([a]));
    assert.equal(listed.length, 1);
    assert.equal(listed[0].nick, "Beta");
    await removeFriend(a, b);
    assert.equal(await areFriends(a, b), false);
    assert.equal((await listFriends(a)).length, 0);
  });
});
