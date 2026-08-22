import { FRIEND_CAP } from "./socialStore.mjs";

export { FRIEND_CAP };
export const FRIEND_ENERGY_GIFT = 10;
export const FRIENDSHIP_SEND_GAIN = 5;
export const FRIEND_ONLINE_MS = 3 * 60 * 1000;
export const FRIEND_HOUR_MS = 60 * 60 * 1000;
export const FRIEND_DAY_MS = 24 * FRIEND_HOUR_MS;
export const FRIEND_MONTH_MS = 30 * FRIEND_DAY_MS;
export const FRIEND_LONG_MS = 6 * FRIEND_MONTH_MS;

let store = null;
const persistAt = new Map();

export function bindSocial(nextStore) {
  store = nextStore;
}

function requireStore() {
  if (!store) throw new Error("social store unbound");
  return store;
}

function todayKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

export function userIdFromActor(actorId) {
  if (!String(actorId ?? "").startsWith("user:")) return null;
  return String(actorId).slice(5) || null;
}

/**
 * @returns {{ kind: "online" | "hours" | "days" | "months" | "long", n?: number }}
 */
export function classifyLastSeen(lastSeenMs, now = Date.now(), online = false) {
  const seen = Number(lastSeenMs) || 0;
  if (online || (seen > 0 && now - seen < FRIEND_ONLINE_MS)) {
    return { kind: "online" };
  }
  if (seen <= 0) return { kind: "long" };
  const elapsed = Math.max(0, now - seen);
  if (elapsed > FRIEND_LONG_MS) return { kind: "long" };
  if (elapsed < FRIEND_DAY_MS) {
    return { kind: "hours", n: Math.max(1, Math.floor(elapsed / FRIEND_HOUR_MS)) };
  }
  if (elapsed < FRIEND_MONTH_MS) {
    return { kind: "days", n: Math.max(1, Math.floor(elapsed / FRIEND_DAY_MS)) };
  }
  return {
    kind: "months",
    n: Math.max(1, Math.min(6, Math.floor(elapsed / FRIEND_MONTH_MS))),
  };
}

export async function touchProfile(uid, patch = {}, opts = {}) {
  if (!uid) return null;
  const db = requireStore();
  const now = Date.now();
  const last = persistAt.get(uid) ?? 0;
  const touchSeen = opts.seen !== false;
  const nick = patch.nick != null ? String(patch.nick).trim() : "";
  const force = Boolean(opts.force || nick || patch.guildName !== undefined || patch.level != null);
  if (!force && touchSeen && now - last < 45_000) {
    const cached = await db.getSocialProfile(uid);
    if (cached) return cached;
  }
  persistAt.set(uid, now);
  return db.upsertSocialProfile(uid, {
    nick: patch.nick,
    level: patch.level,
    guildName: patch.guildName,
    userId: patch.userId ?? userIdFromActor(uid),
    lastSeen: now,
    touchSeen,
  });
}

export async function getProfile(uid) {
  if (!uid) return null;
  return requireStore().getSocialProfile(uid);
}

export async function findUidByNick(nickRaw) {
  const row = await requireStore().findSocialProfileByNick(nickRaw);
  return row?.actorId ?? null;
}

export async function areFriends(a, b) {
  return requireStore().areFriends(a, b);
}

export async function friendStatus(me, them) {
  if (!me || !them || me === them) return "self";
  const db = requireStore();
  if (await db.areFriends(me, them)) return "friends";
  if (await db.hasFriendRequest(me, them)) return "pending_out";
  if (await db.hasFriendRequest(them, me)) return "pending_in";
  return "none";
}

async function publicCard(uid, me, onlineSet, now = Date.now(), statusHint) {
  const db = requireStore();
  const row = (await db.getSocialProfile(uid)) ?? {
    actorId: uid,
    uid,
    nick: uid.slice(-6),
    level: 1,
    guildName: null,
    lastSeen: 0,
  };
  const online = Boolean(onlineSet?.has(uid));
  const seen = classifyLastSeen(row.lastSeen, now, online);
  return {
    uid,
    nick: row.nick || uid.slice(-6),
    level: row.level ?? 1,
    guildName: row.guildName ?? null,
    online: seen.kind === "online",
    lastSeen: row.lastSeen ?? 0,
    seen,
    status: statusHint ?? (me ? await friendStatus(me, uid) : "none"),
  };
}

export async function listFriends(uid, onlineSet) {
  const ids = await requireStore().listFriendIds(uid);
  const now = Date.now();
  const out = [];
  for (const id of ids) {
    out.push(await publicCard(id, uid, onlineSet, now, "friends"));
  }
  out.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return (b.lastSeen ?? 0) - (a.lastSeen ?? 0);
  });
  return out;
}

export async function listIncoming(uid, onlineSet) {
  const ids = await requireStore().listIncomingIds(uid);
  const now = Date.now();
  const out = [];
  for (const id of ids) {
    out.push(await publicCard(id, uid, onlineSet, now, "pending_in"));
  }
  return out;
}

export async function listOutgoing(uid, onlineSet) {
  const ids = await requireStore().listOutgoingIds(uid);
  const now = Date.now();
  const out = [];
  for (const id of ids) {
    out.push(await publicCard(id, uid, onlineSet, now, "pending_out"));
  }
  return out;
}

export async function requestFriend(me, target) {
  const db = requireStore();
  if (!me || !target) return { ok: false, error: "not_found" };
  if (me === target) return { ok: false, error: "self" };
  const profile = await db.getSocialProfile(target);
  if (!profile) return { ok: false, error: "not_found" };
  if (await db.areFriends(me, target)) return { ok: false, error: "already" };
  if ((await db.countFriends(me)) >= FRIEND_CAP) return { ok: false, error: "full" };
  if ((await db.countFriends(target)) >= FRIEND_CAP) return { ok: false, error: "full" };
  if (await db.hasFriendRequest(me, target)) return { ok: false, error: "pending" };
  if (await db.hasFriendRequest(target, me)) {
    return acceptFriend(me, target);
  }
  await db.insertFriendRequest(me, target);
  return { ok: true, status: "pending_out" };
}

export async function acceptFriend(me, from) {
  const db = requireStore();
  if (!(await db.hasFriendRequest(from, me))) return { ok: false, error: "not_found" };
  if ((await db.countFriends(me)) >= FRIEND_CAP || (await db.countFriends(from)) >= FRIEND_CAP) {
    return { ok: false, error: "full" };
  }
  await db.insertFriendLink(me, from);
  return { ok: true, status: "friends" };
}

export async function rejectFriend(me, from) {
  await requireStore().deleteFriendRequest(from, me);
  return { ok: true };
}

export async function removeFriend(me, them) {
  await requireStore().deleteFriendLink(me, them);
  return { ok: true };
}

export async function sendEnergyGift(me, them) {
  const db = requireStore();
  if (!(await db.areFriends(me, them))) return { ok: false, error: "not_friends" };
  const day = todayKey();
  if (await db.hasEnergySent(me, them, day)) return { ok: false, error: "already_sent" };
  await db.markEnergySent(me, them, day);
  await db.pushEnergyGift(them, me, FRIEND_ENERGY_GIFT);
  return { ok: true, energy: FRIEND_ENERGY_GIFT, friendship: FRIENDSHIP_SEND_GAIN };
}

export async function takeEnergyGifts(uid) {
  return requireStore().takeEnergyGifts(uid);
}

export async function socialState(uid, onlineSet) {
  const gifts = await takeEnergyGifts(uid);
  return {
    ok: true,
    friends: await listFriends(uid, onlineSet),
    incoming: await listIncoming(uid, onlineSet),
    outgoing: await listOutgoing(uid, onlineSet),
    gifts,
  };
}

export async function profilePayload(me, uid, onlineSet) {
  const row = await getProfile(uid);
  if (!row) return null;
  const card = await publicCard(uid, me, onlineSet);
  return {
    ok: true,
    uid: card.uid,
    nick: card.nick,
    level: card.level,
    guildName: card.guildName,
    status: card.status,
    friends: card.status === "friends",
    online: card.online,
    lastSeen: card.lastSeen,
    seen: card.seen,
  };
}
