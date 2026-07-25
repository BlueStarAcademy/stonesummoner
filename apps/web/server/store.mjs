import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_DAYS = 14;

function sessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

function newToken() {
  return crypto.randomBytes(32).toString("hex");
}

/** In-memory store for local dev without DATABASE_URL. */
function createMemoryStore() {
  const users = new Map();
  const sessions = new Map();
  const saves = new Map();

  return {
    mode: "memory",
    async health() {
      return { ok: true, db: "memory" };
    },
    async migrate() {},
    async createUser({ email, password, kind }) {
      const id = crypto.randomUUID();
      const password_hash = password
        ? await bcrypt.hash(password, 10)
        : null;
      const user = { id, email: email ?? null, password_hash, kind };
      if (email) {
        for (const u of users.values()) {
          if (u.email === email) {
            const err = new Error("EMAIL_TAKEN");
            throw err;
          }
        }
      }
      users.set(id, user);
      return { id, email: user.email, kind: user.kind };
    },
    async findUserByEmail(email) {
      for (const u of users.values()) {
        if (u.email === email) return u;
      }
      return null;
    },
    async getUser(id) {
      const u = users.get(id);
      return u ? { id: u.id, email: u.email, kind: u.kind } : null;
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
        if (u.kind === "demo") return { id: u.id, email: u.email, kind: u.kind };
      }
      return null;
    },
  };
}

function createPgStore(pool) {
  return {
    mode: "postgres",
    async health() {
      await pool.query("SELECT 1");
      return { ok: true, db: "postgres" };
    },
    async migrate() {
      const sqlPath = path.join(__dirname, "../sql/001_init.sql");
      const sql = fs.readFileSync(sqlPath, "utf8");
      await pool.query(sql);
    },
    async createUser({ email, password, kind }) {
      const id = crypto.randomUUID();
      const password_hash = password
        ? await bcrypt.hash(password, 10)
        : null;
      try {
        await pool.query(
          `INSERT INTO users (id, email, password_hash, kind) VALUES ($1, $2, $3, $4)`,
          [id, email ?? null, password_hash, kind],
        );
      } catch (e) {
        if (e?.code === "23505") {
          const err = new Error("EMAIL_TAKEN");
          throw err;
        }
        throw e;
      }
      return { id, email: email ?? null, kind };
    },
    async findUserByEmail(email) {
      const { rows } = await pool.query(
        `SELECT id, email, password_hash, kind FROM users WHERE email = $1`,
        [email],
      );
      return rows[0] ?? null;
    },
    async getUser(id) {
      const { rows } = await pool.query(
        `SELECT id, email, kind FROM users WHERE id = $1`,
        [id],
      );
      return rows[0] ?? null;
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
        `SELECT u.id, u.email, u.kind FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token = $1 AND s.expires_at > NOW()`,
        [token],
      );
      return rows[0] ?? null;
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
        `SELECT id, email, kind FROM users WHERE kind = 'demo' LIMIT 1`,
      );
      return rows[0] ?? null;
    },
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
  await store.migrate();
  console.log("[store] Postgres ready");
  return store;
}
