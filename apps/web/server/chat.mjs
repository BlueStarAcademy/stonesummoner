import { containsProfanity } from "../shared/nickname.mjs";
import {
  areFriends,
  listFriends,
  touchProfile,
} from "./social.mjs";

export const CHAT_CHANNEL_CAP = 100;
export const CHAT_CHANNEL_COUNT = 6;
export const CHAT_MSG_MAX = 80;
export const CHAT_HISTORY = 50;
export const CHAT_STALE_MS = 35_000;
export const CHAT_SEND_COOLDOWN_MS = 800;

/** @typedef {"world" | "friends" | "guild"} ChatTab */
/** @typedef {{ id: number, userId: string, nick: string, text: string, at: number }} ChatMsg */
/** @typedef {{ tab: ChatTab, channelId: number, peerUid: string | null, guildKey: string | null, lastSeen: number, nick: string, uid: string }} ChatPresence */

/** @type {Map<string, ChatMsg[]>} */
const messagesByRoom = new Map();
/** @type {Map<string, ChatPresence>} */
const presence = new Map();
/** @type {Map<string, number>} */
const lastSendAt = new Map();

let msgSeq = 0;
let sweepTimer = null;

function nowMs() {
  return Date.now();
}

function channelIds() {
  return Array.from({ length: CHAT_CHANNEL_COUNT }, (_, i) => i + 1);
}

function isChannelId(id) {
  return Number.isInteger(id) && id >= 1 && id <= CHAT_CHANNEL_COUNT;
}

function isTab(tab) {
  return tab === "world" || tab === "friends" || tab === "guild";
}

export function actorId(user, token) {
  if (user?.kind === "demo") return `demo:${String(token ?? "")}`;
  return `user:${user.id}`;
}

export function chatNickForUser(user, token) {
  const nick = String(user?.nickname ?? "").trim();
  if (nick) return nick.slice(0, 12);
  const seed =
    user?.kind === "demo"
      ? String(token ?? user?.id ?? "")
      : String(user?.id ?? "");
  const short = seed.replace(/-/g, "").slice(0, 4).toLowerCase() || "0000";
  if (user?.kind === "demo") return `Demo-${short}`;
  if (user?.kind === "guest") return `Guest-${short}`;
  return `Player-${short}`;
}

export function normalizeGuildKey(name) {
  const s = String(name ?? "").trim();
  return s ? s.slice(0, 16) : "";
}

function worldRoom(id) {
  return `world:${id}`;
}

function guildRoom(key) {
  return `guild:${key}`;
}

function dmRoom(a, b) {
  return a < b ? `dm:${a}:${b}` : `dm:${b}:${a}`;
}

function roomFor(row) {
  if (row.tab === "guild") {
    return row.guildKey ? guildRoom(row.guildKey) : null;
  }
  if (row.tab === "friends") {
    return row.peerUid ? dmRoom(row.uid, row.peerUid) : null;
  }
  return worldRoom(row.channelId);
}

function msgs(room) {
  if (!room) return [];
  let list = messagesByRoom.get(room);
  if (!list) {
    list = [];
    messagesByRoom.set(room, list);
  }
  return list;
}

function sanitizeText(raw) {
  return String(raw ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, CHAT_MSG_MAX);
}

export function sweepPresence() {
  const cutoff = nowMs() - CHAT_STALE_MS;
  for (const [uid, row] of presence) {
    if (row.lastSeen < cutoff) presence.delete(uid);
  }
}

export function startChatSweeper() {
  if (sweepTimer) return;
  sweepTimer = setInterval(sweepPresence, 8_000);
  if (typeof sweepTimer.unref === "function") sweepTimer.unref();
}

export function onlineUids() {
  sweepPresence();
  return [...presence.keys()];
}

function countWorldUsers(channelId) {
  let n = 0;
  for (const row of presence.values()) {
    if (row.tab === "world" && row.channelId === channelId) n += 1;
  }
  return n;
}

export function listChannels() {
  return channelIds().map((id) => {
    const users = countWorldUsers(id);
    return { id, users, full: users >= CHAT_CHANNEL_CAP };
  });
}

function firstOpenChannel(exceptId = 0) {
  const channels = listChannels();
  return (
    channels.find((c) => c.id !== exceptId && !c.full) ??
    channels.find((c) => !c.full) ??
    null
  );
}

function publicMessages(userId, room, after) {
  const list = room ? msgs(room) : [];
  const lastId = list.length ? list[list.length - 1].id : 0;
  const oldest = list[0]?.id ?? 0;
  const reset = list.length > 0 && (after < oldest || after > lastId);
  const slice = reset
    ? list.slice(-CHAT_HISTORY)
    : list.filter((m) => m.id > after);
  const newest = slice.length ? slice[slice.length - 1].id : reset ? lastId : after;
  return {
    reset,
    after: newest,
    messages: slice.map((m) => ({
      id: m.id,
      uid: m.userId,
      nick: m.nick,
      text: m.text,
      at: m.at,
      self: m.userId === userId,
    })),
  };
}

async function snapshotFor(row, after, forceReset = false) {
  const room = roomFor(row);
  const packed = publicMessages(row.uid, room, after);
  const online = new Set(onlineUids());
  const friends = await listFriends(row.uid, online);
  return {
    ok: true,
    tab: row.tab,
    channelId: row.channelId,
    peerUid: row.peerUid,
    selfUid: row.uid,
    reset: forceReset || packed.reset,
    after: packed.after,
    channels: listChannels(),
    friends,
    messages: packed.messages,
  };
}

async function applyProfile(user, token, profile) {
  const uid = actorId(user, token);
  const nick = chatNickForUser(user, token);
  const level = Math.max(1, Math.floor(Number(profile?.level) || 1));
  const guildKey = normalizeGuildKey(profile?.guildName ?? "");
  await touchProfile(uid, {
    nick,
    level,
    guildName: guildKey || null,
    userId: user?.kind === "demo" ? null : user?.id,
  });
  return { uid, nick, level, guildKey: guildKey || null };
}

/**
 * @returns {{ ok: true, snapshot: object } | { ok: false, error: string, suggested?: number, channels?: object[] }}
 */
export async function joinChannel(user, body, token) {
  sweepPresence();
  const { uid, nick, guildKey } = await applyProfile(user, token, body?.profile);
  const tab = isTab(body?.tab) ? body.tab : "world";
  let channelId = isChannelId(Number(body?.channel))
    ? Number(body.channel)
    : 1;
  let peerUid =
    typeof body?.peer === "string" && body.peer && body.peer !== uid
      ? body.peer
      : null;

  if (tab === "world") {
    const prev = presence.get(uid);
    if (prev && prev.tab === "world" && prev.channelId === channelId) {
      prev.lastSeen = nowMs();
      prev.nick = nick;
      prev.guildKey = guildKey;
      return { ok: true, snapshot: await snapshotFor(prev, 0, true) };
    }
    if (countWorldUsers(channelId) >= CHAT_CHANNEL_CAP) {
      const fallback = firstOpenChannel(channelId);
      if (!fallback) {
        return { ok: false, error: "channel_full", channels: listChannels() };
      }
      if (!prev || prev.tab !== "world") channelId = fallback.id;
      else {
        return {
          ok: false,
          error: "channel_full",
          suggested: fallback.id,
          channels: listChannels(),
        };
      }
    }
  }

  if (tab === "friends") {
    if (peerUid && !(await areFriends(uid, peerUid))) peerUid = null;
    if (!peerUid) {
      const pals = await listFriends(uid);
      peerUid = pals[0]?.uid ?? null;
    }
  }

  const row = {
    uid,
    tab,
    channelId,
    peerUid: tab === "friends" ? peerUid : null,
    guildKey,
    lastSeen: nowMs(),
    nick,
  };
  presence.set(uid, row);
  return { ok: true, snapshot: await snapshotFor(row, 0, true) };
}

export function leaveChannel(user, token) {
  presence.delete(actorId(user, token));
}

export async function pollChannel(user, after, token, query = {}) {
  sweepPresence();
  const id = actorId(user, token);
  let row = presence.get(id);
  if (!row) return null;
  row.lastSeen = nowMs();
  row.nick = chatNickForUser(user, token);
  await touchProfile(id, { nick: row.nick }, { seen: true });
  if (isTab(query.tab) && query.tab !== row.tab) {
    return null;
  }
  if (query.tab === "friends" && typeof query.peer === "string") {
    const peer = query.peer && query.peer !== id ? query.peer : null;
    if (peer && (await areFriends(id, peer)) && row.peerUid !== peer) {
      row.peerUid = peer;
      row.tab = "friends";
      return snapshotFor(row, 0, true);
    }
  }
  const since = Number.isFinite(after) ? after : 0;
  return snapshotFor(row, since);
}

/**
 * @returns {{ ok: true, snapshot: object, message: object } | { ok: false, error: string }}
 */
export async function sendMessage(user, textRaw, token) {
  sweepPresence();
  const id = actorId(user, token);
  const row = presence.get(id);
  if (!row) return { ok: false, error: "not_joined" };
  if (row.tab === "guild" && !row.guildKey) return { ok: false, error: "no_guild" };
  if (row.tab === "friends") {
    if (!row.peerUid) return { ok: false, error: "need_peer" };
    if (!(await areFriends(id, row.peerUid))) return { ok: false, error: "not_friends" };
  }
  const room = roomFor(row);
  if (!room) {
    return {
      ok: false,
      error: row.tab === "guild" ? "no_guild" : "need_peer",
    };
  }
  const text = sanitizeText(textRaw);
  if (!text) return { ok: false, error: "text_invalid" };
  if (containsProfanity(text)) return { ok: false, error: "text_blocked" };
  const t = nowMs();
  const prevSend = lastSendAt.get(id) ?? 0;
  if (t - prevSend < CHAT_SEND_COOLDOWN_MS) {
    return { ok: false, error: "rate_limited" };
  }
  row.lastSeen = t;
  row.nick = chatNickForUser(user, token);
  lastSendAt.set(id, t);
  const msg = {
    id: ++msgSeq,
    userId: id,
    nick: row.nick,
    text,
    at: t,
  };
  const list = msgs(room);
  list.push(msg);
  if (list.length > CHAT_HISTORY) {
    messagesByRoom.set(room, list.slice(-CHAT_HISTORY));
  }
  const snapshot = await snapshotFor(row, msg.id - 1);
  const message = snapshot.messages.find((m) => m.id === msg.id) ?? {
    id: msg.id,
    uid: msg.userId,
    nick: msg.nick,
    text: msg.text,
    at: msg.at,
    self: true,
  };
  return { ok: true, snapshot, message };
}
