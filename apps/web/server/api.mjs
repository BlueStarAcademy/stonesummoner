import cookieParser from "cookie-parser";
import { validateNickname } from "../shared/nickname.mjs";

const COOKIE = "ss_session";

/** Capacitor WebView + local Vite; extend with CORS_ORIGINS (comma-separated). */
function allowedCorsOrigins() {
  const defaults = [
    "capacitor://localhost",
    "http://localhost",
    "https://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ];
  const extra = String(process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...defaults, ...extra]);
}

function requestOrigin(req) {
  return String(req.headers.origin ?? "").trim();
}

/** Cross-site (Capacitor → Railway) needs SameSite=None; Secure. */
function isCrossSiteAuth(req) {
  const origin = requestOrigin(req);
  if (!origin) return false;
  if (/^(capacitor|https?):\/\/localhost\b/i.test(origin)) return true;
  try {
    return new URL(origin).host !== String(req.headers.host ?? "");
  } catch {
    return allowedCorsOrigins().has(origin);
  }
}

function cookieOpts(req) {
  const secure =
    process.env.NODE_ENV === "production" ||
    req.secure ||
    req.headers["x-forwarded-proto"] === "https";
  const crossSite = isCrossSiteAuth(req);
  return {
    httpOnly: true,
    sameSite: crossSite ? "none" : "lax",
    // SameSite=None requires Secure; Capacitor cloud sync expects HTTPS API.
    secure: crossSite ? true : secure,
    path: "/",
    maxAge: 14 * 24 * 60 * 60 * 1000,
  };
}

export function corsForApi(req, res, next) {
  const origin = requestOrigin(req);
  if (origin && allowedCorsOrigins().has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    );
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}

function setSession(res, req, token) {
  res.cookie(COOKIE, token, cookieOpts(req));
}

function clearSession(res, req) {
  res.clearCookie(COOKIE, { ...cookieOpts(req), maxAge: 0 });
}

function isValidEmail(email) {
  return Boolean(email) && email.includes("@") && email.length <= 254;
}

async function requireUser(store, req, res) {
  const token = req.cookies?.[COOKIE];
  if (!token) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  const user = await store.userFromToken(token);
  if (!user) {
    clearSession(res, req);
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return user;
}

export function mountApi(app, store) {
  app.use("/api", corsForApi);
  app.use(cookieParser());

  app.get("/api/health", async (_req, res) => {
    try {
      const h = await store.health();
      res.json({
        ...h,
        ephemeral: store.mode === "memory",
      });
    } catch (e) {
      res.status(503).json({ ok: false, db: store.mode, error: String(e) });
    }
  });

  app.post("/api/auth/check-email", async (req, res) => {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    if (!isValidEmail(email)) {
      res.status(400).json({ available: false, error: "email_invalid" });
      return;
    }
    const taken = await store.isEmailTaken(email);
    res.json({ available: !taken, error: taken ? "email_taken" : null });
  });

  app.post("/api/auth/check-nickname", async (req, res) => {
    const parsed = validateNickname(req.body?.nickname);
    if (!parsed.ok) {
      res.status(400).json({ available: false, error: parsed.error });
      return;
    }
    const token = req.cookies?.[COOKIE];
    const me = token ? await store.userFromToken(token) : null;
    const taken = await store.isNicknameTaken(parsed.nickname, me?.id ?? null);
    res.json({
      available: !taken,
      error: taken ? "nickname_taken" : null,
      nickname: parsed.nickname,
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? "");
    if (!isValidEmail(email) || password.length < 6) {
      res.status(400).json({ error: "invalid_credentials" });
      return;
    }
    try {
      const user = await store.createUser({
        email,
        password,
        kind: "user",
      });
      const { token } = await store.createSession(user.id);
      setSession(res, req, token);
      res.json({ user });
    } catch (e) {
      if (e.message === "EMAIL_TAKEN") {
        res.status(409).json({ error: "email_taken" });
        return;
      }
      console.error(e);
      res.status(500).json({ error: "server_error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? "");
    const userRow = await store.findUserByEmail(email);
    if (!userRow || !(await store.verifyPassword(userRow, password))) {
      res.status(401).json({ error: "invalid_credentials" });
      return;
    }
    const user = await store.getUser(userRow.id);
    const { token } = await store.createSession(user.id);
    setSession(res, req, token);
    res.json({ user });
  });

  app.post("/api/auth/nickname", async (req, res) => {
    const user = await requireUser(store, req, res);
    if (!user) return;
    if (user.kind !== "user") {
      res.status(400).json({ error: "nickname_not_allowed" });
      return;
    }
    const parsed = validateNickname(req.body?.nickname);
    if (!parsed.ok) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    try {
      const updated = await store.setNickname(user.id, parsed.nickname);
      res.json({ user: updated });
    } catch (e) {
      if (e.message === "NICKNAME_TAKEN") {
        res.status(409).json({ error: "nickname_taken" });
        return;
      }
      if (e.message === "NICKNAME_LOCKED") {
        res.status(409).json({ error: "nickname_locked" });
        return;
      }
      console.error(e);
      res.status(500).json({ error: "server_error" });
    }
  });

  app.post("/api/auth/guest", async (req, res) => {
    try {
      const user = await store.createUser({ kind: "guest" });
      const { token } = await store.createSession(user.id);
      setSession(res, req, token);
      res.json({ user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "server_error" });
    }
  });

  app.post("/api/auth/demo", async (req, res) => {
    try {
      let user = await store.findDemoUser();
      if (!user) {
        user = await store.createUser({ kind: "demo" });
      }
      const { token } = await store.createSession(user.id);
      setSession(res, req, token);
      res.json({ user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "server_error" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const token = req.cookies?.[COOKIE];
    if (token) await store.deleteSession(token);
    clearSession(res, req);
    res.json({ ok: true });
  });

  app.get("/api/me", async (req, res) => {
    const token = req.cookies?.[COOKIE];
    if (!token) {
      res.json({ user: null });
      return;
    }
    const user = await store.userFromToken(token);
    if (!user) {
      clearSession(res, req);
      res.json({ user: null });
      return;
    }
    res.json({ user });
  });

  app.get("/api/save", async (req, res) => {
    const user = await requireUser(store, req, res);
    if (!user) return;
    const payload = await store.getSave(user.id);
    res.json({ save: payload });
  });

  app.put("/api/save", async (req, res) => {
    const user = await requireUser(store, req, res);
    if (!user) return;
    const payload = req.body?.save;
    if (!payload || typeof payload !== "object") {
      res.status(400).json({ error: "invalid_save" });
      return;
    }
    await store.putSave(user.id, payload);
    res.json({ ok: true });
  });
}
