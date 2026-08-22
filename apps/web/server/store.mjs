import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { createMemorySocialOps, createPgSocialOps } from "./socialStore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_DAYS = 14;

function sessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

function newToken() {
  return crypto.randomBytes(32).toString("hex");
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? null,
    kind: u.kind,
    nickname: u.nickname ?? null,
  };
}

/** In-memory store for local dev without DATABASE_URL. */
function createMemoryStore() {
  const users = new Map();
  const sessions = new Map();
  const saves = new Map();
  const social = createMemorySocialOps();

  return {
    mode: "memory",
    async health() {
      return { ok: true, db: "memory" };
    },
    async migrate() {},
    async createUser({ email, password, kind, nickname = null }) {
      const id = crypto.randomUUID();
      const password_hash = password ? await bcrypt.hash(password, 10) : null;
      if (email) {
        for (const u of users.values()) {
          if (u.email === email) {
            throw new Error("EMAIL_TAKEN");
          }
        }
      }
      if (nickname) {
        for (const u of users.values()) {
          if (u.nickname === nickname) {
            throw new Error("NICKNAME_TAKEN");
          }
        }
      }
      const user = {
        id,
        email: email ?? null,
        password_hash,
        kind,
        nickname: nickname ?? null,
      };
      users.set(id, user);
      return publicUser(user);
    },
    async findUserByEmail(email) {
      for (const u of users.values()) {
        if (u.email === email) return u;
      }
      return null;
    },
    async isEmailTaken(email) {
      return Boolean(await this.findUserByEmail(email));
    },
    async isNicknameTaken(nickname, excludeUserId = null) {
      for (const u of users.values()) {
        if (u.nickname === nickname && u.id !== excludeUserId) return true;
      }
      return false;
    },
    async findUserByNickname(nickname) {
      for (const u of users.values()) {
        if (u.nickname === nickname) {
          return { ...publicUser(u), createdAt: u.created_at ?? null };
        }
      }
      return null;
    },
    async getUser(id) {
      return publicUser(users.get(id));
    },
    async setNickname(userId, nickname) {
      const u = users.get(userId);
      if (!u) throw new Error("NOT_FOUND");
      for (const other of users.values()) {
        if (other.nickname === nickname && other.id !== userId) {
          throw new Error("NICKNAME_TAKEN");
        }
      }
      u.nickname = nickname;
      return publicUser(u);
    },
    async verifyPassword(user, password) {
      if (!user?.password_hash) return false;
      return bcrypt.compare(password, user.password_hash);
    },
    async createSession(userId) {
      const token = newToken();
      const expires_at = sessionExpiry();
      sessions.set(token, { token, user_id: userId, expires_at });
      return { token, expires_at };
    },
    async userFromToken(token) {
      const s = sessions.get(token);
      if (!s || s.expires_at < new Date()) {
        if (s) sessions.delete(token);
        return null;
      }
      return this.getUser(s.user_id);
    },
    async deleteSession(token) {
      sessions.delete(token);
    },
    async getSave(userId) {
      return saves.get(userId) ?? null;
    },
    async putSave(userId, payload) {
      saves.set(userId, payload);
      return payload;
    },
    async findDemoUser() {
      for (const u of users.values()) {
        if (u.kind === "demo") return publicUser(u);
      }
      return null;
    },
    ...social,
  };
}

function createPgStore(pool) {
  const social = createPgSocialOps(pool);
  return {
    mode: "postgres",
    async health() {
      await pool.query("SELECT 1");
      return { ok: true, db: "postgres" };
    },
    async migrate() {
      for (const name of ["001_init.sql", "002_nickname.sql", "003_social.sql"]) {
        const sqlPath = path.join(__dirname, "../sql", name);
        const sql = fs.readFileSync(sqlPath, "utf8");
        await pool.query(sql);
      }
    },
    async createUser({ email, password, kind, nickname = null }) {
      const id = crypto.randomUUID();
      const password_hash = password ? await bcrypt.hash(password, 10) : null;
      try {
        await pool.query(
          `INSERT INTO users (id, email, password_hash, kind, nickname)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, email ?? null, password_hash, kind, nickname ?? null],
        );
      } catch (e) {
        if (e?.code === "23505") {
          const detail = String(e?.detail ?? e?.constraint ?? "");
          if (detail.includes("nickname")) {
            throw new Error("NICKNAME_TAKEN");
          }
          throw new Error("EMAIL_TAKEN");
        }
        throw e;
      }
      return { id, email: email ?? null, kind, nickname: nickname ?? null };
    },
    async findUserByEmail(email) {
      const { rows } = await pool.query(
        `SELECT id, email, password_hash, kind, nickname FROM users WHERE email = $1`,
        [email],
      );
      return rows[0] ?? null;
    },
    async isEmailTaken(email) {
      const { rows } = await pool.query(
        `SELECT 1 FROM users WHERE email = $1 LIMIT 1`,
        [email],
      );
      return rows.length > 0;
    },
    async isNicknameTaken(nickname, excludeUserId = null) {
      const { rows } = await pool.query(
        excludeUserId
          ? `SELECT 1 FROM users WHERE nickname = $1 AND id <> $2 LIMIT 1`
          : `SELECT 1 FROM users WHERE nickname = $1 LIMIT 1`,
        excludeUserId ? [nickname, excludeUserId] : [nickname],
      );
      return rows.length > 0;
    },
    async findUserByNickname(nickname) {
      const { rows } = await pool.query(
        `SELECT id, email, kind, nickname, created_at FROM users WHERE nickname = $1 LIMIT 1`,
        [nickname],
      );
      return rows[0]
        ? {
            id: rows[0].id,
            email: rows[0].email,
            kind: rows[0].kind,
            nickname: rows[0].nickname ?? null,
            createdAt: rows[0].created_at ?? null,
          }
        : null;
    },
    async getUser(id) {
      const { rows } = await pool.query(
        `SELECT id, email, kind, nickname FROM users WHERE id = $1`,
        [id],
      );
      return rows[0]
        ? {
            id: rows[0].id,
            email: rows[0].email,
            kind: rows[0].kind,
            nickname: rows[0].nickname ?? null,
          }
        : null;
    },
    async setNickname(userId, nickname) {
      const cur = await this.getUser(userId);
      if (!cur) throw new Error("NOT_FOUND");
      try {
        const { rows } = await pool.query(
          `UPDATE users SET nickname = $2
           WHERE id = $1
           RETURNING id, email, kind, nickname`,
          [userId, nickname],
        );
        if (!rows[0]) throw new Error("NOT_FOUND");
        return {
          id: rows[0].id,
          email: rows[0].email,
          kind: rows[0].kind,
          nickname: rows[0].nickname ?? null,
        };
      } catch (e) {
        if (e?.code === "23505") throw new Error("NICKNAME_TAKEN");
        throw e;
      }
    },
    async verifyPassword(user, password) {
      if (!user?.password_hash) return false;
      return bcrypt.compare(password, user.password_hash);
    },
    async createSession(userId) {
      const token = newToken();
      const expires_at = sessionExpiry();
      await pool.query(
        `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
        [token, userId, expires_at],
      );
      return { token, expires_at };
    },
    async userFromToken(token) {
      const { rows } = await pool.query(
        `SELECT u.id, u.email, u.kind, u.nickname FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token = $1 AND s.expires_at > NOW()`,
        [token],
      );
      if (!rows[0]) return null;
      return {
        id: rows[0].id,
        email: rows[0].email,
        kind: rows[0].kind,
        nickname: rows[0].nickname ?? null,
      };
    },
    async deleteSession(token) {
      await pool.query(`DELETE FROM sessions WHERE token = $1`, [token]);
    },
    async getSave(userId) {
      const { rows } = await pool.query(
        `SELECT payload FROM saves WHERE user_id = $1`,
        [userId],
      );
      return rows[0]?.payload ?? null;
    },
    async putSave(userId, payload) {
      await pool.query(
        `INSERT INTO saves (user_id, payload, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
        [userId, JSON.stringify(payload)],
      );
      return payload;
    },
    async findDemoUser() {
      const { rows } = await pool.query(
        `SELECT id, email, kind, nickname FROM users WHERE kind = 'demo' LIMIT 1`,
      );
      return rows[0]
        ? {
            id: rows[0].id,
            email: rows[0].email,
            kind: rows[0].kind,
            nickname: rows[0].nickname ?? null,
          }
        : null;
    },
    ...social,
  };
}

export async function createStore() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[store] DATABASE_URL unset — using in-memory store");
    return createMemoryStore();
  }
  const pool = new pg.Pool({
    connectionString: url,
    ssl: process.env.PGSSL === "0" ? false : { rejectUnauthorized: false },
  });
  const store = createPgStore(pool);
  try {
    await store.migrate();
    console.log("[store] Postgres ready");
    return store;
  } catch (e) {
    await pool.end().catch(() => {});
    const isProd =
      Boolean(process.env.RAILWAY_ENVIRONMENT) ||
      process.env.NODE_ENV === "production";
    if (isProd) throw e;
    console.warn(
      `[store] Postgres unavailable (${e.code ?? e.message}) — falling back to in-memory store`,
    );
    return createMemoryStore();
  }
}
