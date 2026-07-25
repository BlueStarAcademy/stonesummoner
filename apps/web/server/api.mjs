import cookieParser from "cookie-parser";

const COOKIE = "ss_session";

function cookieOpts(req) {
  const secure =
    process.env.NODE_ENV === "production" ||
    req.secure ||
    req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 14 * 24 * 60 * 60 * 1000,
  };
}

function setSession(res, req, token) {
  res.cookie(COOKIE, token, cookieOpts(req));
}

function clearSession(res, req) {
  res.clearCookie(COOKIE, { ...cookieOpts(req), maxAge: 0 });
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
  app.use(cookieParser());

  app.get("/api/health", async (_req, res) => {
    try {
      const h = await store.health();
      res.json(h);
    } catch (e) {
      res.status(503).json({ ok: false, db: store.mode, error: String(e) });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? "");
    if (!email || !email.includes("@") || password.length < 6) {
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
    const user = { id: userRow.id, email: userRow.email, kind: userRow.kind };
    const { token } = await store.createSession(user.id);
    setSession(res, req, token);
    res.json({ user });
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
    const user = await requireUser(store, req, res);
    if (!user) return;
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
