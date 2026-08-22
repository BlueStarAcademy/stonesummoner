import crypto from "node:crypto";

export const FRIEND_CAP = 50;

function orderedPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

function userIdFromActor(actorId) {
  if (!actorId?.startsWith("user:")) return null;
  const id = actorId.slice(5);
  return id || null;
}

function emptyProfile(actorId) {
  return {
    actorId,
    uid: actorId,
    userId: userIdFromActor(actorId),
    nick: "",
    level: 1,
    guildName: null,
    lastSeen: 0,
  };
}

function rowFromMemory(p) {
  if (!p) return null;
  return {
    actorId: p.actorId,
    uid: p.actorId,
    userId: p.userId ?? null,
    nick: p.nick || "",
    level: p.level ?? 1,
    guildName: p.guildName ?? null,
    lastSeen: p.lastSeen ?? 0,
  };
}

export function createMemorySocialOps() {
  /** @type {Map<string, ReturnType<typeof emptyProfile>>} */
  const profiles = new Map();
  /** @type {Set<string>} */
  const links = new Set();
  /** @type {Set<string>} */
  const requests = new Set();
  /** @type {Set<string>} */
  const energySent = new Set();
  /** @type {Map<string, { id: string, from: string, energy: number }[]>} */
  const inbox = new Map();

  function linkKey(a, b) {
    const [x, y] = orderedPair(a, b);
    return `${x}|${y}`;
  }

  function reqKey(from, to) {
    return `${from}>${to}`;
  }

  return {
    async upsertSocialProfile(actorId, patch = {}) {
      const prev = profiles.get(actorId) ?? emptyProfile(actorId);
      const nick = String(patch.nick ?? prev.nick ?? "").trim().slice(0, 12);
      const level = Math.max(1, Math.floor(Number(patch.level ?? prev.level) || 1));
      const guildName =
        patch.guildName === undefined
          ? prev.guildName
          : patch.guildName
            ? String(patch.guildName).trim().slice(0, 16)
            : null;
      const lastSeen =
        patch.touchSeen === false
          ? typeof patch.lastSeen === "number"
            ? patch.lastSeen
            : prev.lastSeen
          : Math.max(prev.lastSeen ?? 0, Number(patch.lastSeen) || Date.now());
      const next = {
        actorId,
        uid: actorId,
        userId: patch.userId ?? prev.userId ?? userIdFromActor(actorId),
        nick: nick || prev.nick,
        level,
        guildName,
        lastSeen,
      };
      profiles.set(actorId, next);
      return rowFromMemory(next);
    },

    async getSocialProfile(actorId) {
      return rowFromMemory(profiles.get(actorId));
    },

    async findSocialProfileByNick(nickRaw) {
      const nick = String(nickRaw ?? "").trim();
      if (!nick) return null;
      for (const row of profiles.values()) {
        if (row.nick === nick) return rowFromMemory(row);
      }
      return null;
    },

    async countFriends(actorId) {
      let n = 0;
      for (const key of links) {
        const [a, b] = key.split("|");
        if (a === actorId || b === actorId) n += 1;
      }
      return n;
    },

    async areFriends(a, b) {
      if (!a || !b || a === b) return false;
      return links.has(linkKey(a, b));
    },

    async hasFriendRequest(from, to) {
      return requests.has(reqKey(from, to));
    },

    async listFriendIds(actorId) {
      const ids = [];
      for (const key of links) {
        const [a, b] = key.split("|");
        if (a === actorId) ids.push(b);
        else if (b === actorId) ids.push(a);
      }
      return ids;
    },

    async listIncomingIds(actorId) {
      const ids = [];
      for (const key of requests) {
        const [from, to] = key.split(">");
        if (to === actorId) ids.push(from);
      }
      return ids;
    },

    async listOutgoingIds(actorId) {
      const ids = [];
      for (const key of requests) {
        const [from, to] = key.split(">");
        if (from === actorId) ids.push(to);
      }
      return ids;
    },

    async insertFriendRequest(from, to) {
      requests.add(reqKey(from, to));
    },

    async deleteFriendRequest(from, to) {
      requests.delete(reqKey(from, to));
    },

    async insertFriendLink(a, b) {
      links.add(linkKey(a, b));
      requests.delete(reqKey(a, b));
      requests.delete(reqKey(b, a));
    },

    async deleteFriendLink(a, b) {
      links.delete(linkKey(a, b));
      requests.delete(reqKey(a, b));
      requests.delete(reqKey(b, a));
    },

    async hasEnergySent(from, to, dayKey) {
      return energySent.has(`${dayKey}|${from}|${to}`);
    },

    async markEnergySent(from, to, dayKey) {
      energySent.add(`${dayKey}|${from}|${to}`);
    },

    async pushEnergyGift(to, from, energy) {
      const id = `g${crypto.randomUUID()}`;
      const list = inbox.get(to) ?? [];
      list.push({ id, from, energy });
      inbox.set(to, list);
      return id;
    },

    async takeEnergyGifts(to) {
      const list = inbox.get(to) ?? [];
      inbox.delete(to);
      return list;
    },
  };
}

function pgProfile(row) {
  if (!row) return null;
  const last = row.last_seen ? new Date(row.last_seen).getTime() : 0;
  return {
    actorId: row.actor_id,
    uid: row.actor_id,
    userId: row.user_id ?? null,
    nick: row.nick || "",
    level: Number(row.level) || 1,
    guildName: row.guild_name ?? null,
    lastSeen: Number.isFinite(last) ? last : 0,
  };
}

export function createPgSocialOps(pool) {
  return {
    async upsertSocialProfile(actorId, patch = {}) {
      const userId = patch.userId ?? userIdFromActor(actorId);
      const nick = String(patch.nick ?? "").trim().slice(0, 12);
      const level = Math.max(1, Math.floor(Number(patch.level) || 1));
      const guildName =
        patch.guildName === undefined
          ? undefined
          : patch.guildName
            ? String(patch.guildName).trim().slice(0, 16)
            : null;
      const touchSeen = patch.touchSeen !== false;
      const lastSeen =
        typeof patch.lastSeen === "number" && Number.isFinite(patch.lastSeen)
          ? new Date(patch.lastSeen)
          : new Date();
      const { rows } = await pool.query(
        `INSERT INTO social_profiles (actor_id, user_id, nick, level, guild_name, last_seen)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (actor_id) DO UPDATE SET
           user_id = COALESCE(EXCLUDED.user_id, social_profiles.user_id),
           nick = CASE
             WHEN EXCLUDED.nick = '' THEN social_profiles.nick
             ELSE EXCLUDED.nick
           END,
           level = GREATEST(EXCLUDED.level, 1),
           guild_name = CASE
             WHEN $7::boolean THEN EXCLUDED.guild_name
             ELSE social_profiles.guild_name
           END,
           last_seen = CASE
             WHEN $8::boolean THEN GREATEST(social_profiles.last_seen, EXCLUDED.last_seen)
             ELSE social_profiles.last_seen
           END
         RETURNING actor_id, user_id, nick, level, guild_name, last_seen`,
        [
          actorId,
          userId,
          nick,
          level,
          guildName === undefined ? null : guildName,
          lastSeen,
          guildName !== undefined,
          touchSeen,
        ],
      );
      return pgProfile(rows[0]);
    },

    async getSocialProfile(actorId) {
      const { rows } = await pool.query(
        `SELECT actor_id, user_id, nick, level, guild_name, last_seen
         FROM social_profiles WHERE actor_id = $1`,
        [actorId],
      );
      return pgProfile(rows[0]);
    },

    async findSocialProfileByNick(nickRaw) {
      const nick = String(nickRaw ?? "").trim();
      if (!nick) return null;
      const { rows } = await pool.query(
        `SELECT actor_id, user_id, nick, level, guild_name, last_seen
         FROM social_profiles WHERE nick = $1
         ORDER BY last_seen DESC NULLS LAST
         LIMIT 1`,
        [nick],
      );
      return pgProfile(rows[0]);
    },

    async countFriends(actorId) {
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS n FROM friend_links WHERE user_a = $1 OR user_b = $1`,
        [actorId],
      );
      return rows[0]?.n ?? 0;
    },

    async areFriends(a, b) {
      if (!a || !b || a === b) return false;
      const [x, y] = orderedPair(a, b);
      const { rows } = await pool.query(
        `SELECT 1 FROM friend_links WHERE user_a = $1 AND user_b = $2 LIMIT 1`,
        [x, y],
      );
      return rows.length > 0;
    },

    async hasFriendRequest(from, to) {
      const { rows } = await pool.query(
        `SELECT 1 FROM friend_requests WHERE from_id = $1 AND to_id = $2 LIMIT 1`,
        [from, to],
      );
      return rows.length > 0;
    },

    async listFriendIds(actorId) {
      const { rows } = await pool.query(
        `SELECT CASE WHEN user_a = $1 THEN user_b ELSE user_a END AS other
         FROM friend_links WHERE user_a = $1 OR user_b = $1`,
        [actorId],
      );
      return rows.map((r) => r.other);
    },

    async listIncomingIds(actorId) {
      const { rows } = await pool.query(
        `SELECT from_id FROM friend_requests WHERE to_id = $1`,
        [actorId],
      );
      return rows.map((r) => r.from_id);
    },

    async listOutgoingIds(actorId) {
      const { rows } = await pool.query(
        `SELECT to_id FROM friend_requests WHERE from_id = $1`,
        [actorId],
      );
      return rows.map((r) => r.to_id);
    },

    async insertFriendRequest(from, to) {
      await pool.query(
        `INSERT INTO friend_requests (from_id, to_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [from, to],
      );
    },

    async deleteFriendRequest(from, to) {
      await pool.query(
        `DELETE FROM friend_requests WHERE from_id = $1 AND to_id = $2`,
        [from, to],
      );
    },

    async insertFriendLink(a, b) {
      const [x, y] = orderedPair(a, b);
      await pool.query("BEGIN");
      try {
        await pool.query(
          `INSERT INTO friend_links (user_a, user_b) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [x, y],
        );
        await pool.query(
          `DELETE FROM friend_requests
           WHERE (from_id = $1 AND to_id = $2) OR (from_id = $2 AND to_id = $1)`,
          [a, b],
        );
        await pool.query("COMMIT");
      } catch (e) {
        await pool.query("ROLLBACK");
        throw e;
      }
    },

    async deleteFriendLink(a, b) {
      const [x, y] = orderedPair(a, b);
      await pool.query("BEGIN");
      try {
        await pool.query(
          `DELETE FROM friend_links WHERE user_a = $1 AND user_b = $2`,
          [x, y],
        );
        await pool.query(
          `DELETE FROM friend_requests
           WHERE (from_id = $1 AND to_id = $2) OR (from_id = $2 AND to_id = $1)`,
          [a, b],
        );
        await pool.query("COMMIT");
      } catch (e) {
        await pool.query("ROLLBACK");
        throw e;
      }
    },

    async hasEnergySent(from, to, dayKey) {
      const { rows } = await pool.query(
        `SELECT 1 FROM friend_energy_sent
         WHERE from_id = $1 AND to_id = $2 AND day_key = $3 LIMIT 1`,
        [from, to, dayKey],
      );
      return rows.length > 0;
    },

    async markEnergySent(from, to, dayKey) {
      await pool.query(
        `INSERT INTO friend_energy_sent (from_id, to_id, day_key)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [from, to, dayKey],
      );
    },

    async pushEnergyGift(to, from, energy) {
      const id = `g${crypto.randomUUID()}`;
      await pool.query(
        `INSERT INTO friend_energy_inbox (id, to_id, from_id, energy)
         VALUES ($1, $2, $3, $4)`,
        [id, to, from, energy],
      );
      return id;
    },

    async takeEnergyGifts(to) {
      const { rows } = await pool.query(
        `DELETE FROM friend_energy_inbox WHERE to_id = $1
         RETURNING id, from_id, energy`,
        [to],
      );
      return rows.map((r) => ({ id: r.id, from: r.from_id, energy: r.energy }));
    },
  };
}
