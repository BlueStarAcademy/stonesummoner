/** Ship skill WebP lock — only approved painted installs may write entries. */
import fs from "node:fs";
import path from "node:path";

export const SKILL_SHIP_DIRS = {
  monster: "apps/web/public/art/monster/skill",
  ui: "apps/web/public/art/ui/skill",
  summoner: "apps/web/public/art/summoner/skill",
};

export function shipDir(root, kind = "monster") {
  return path.join(root, SKILL_SHIP_DIRS[kind] ?? SKILL_SHIP_DIRS.monster);
}

export function lockManifestPath(root, kind = "monster") {
  return path.join(shipDir(root, kind), ".skill-art-lock.json");
}

export function readLock(root, kind = "monster") {
  const p = lockManifestPath(root, kind);
  if (!fs.existsSync(p)) return { version: 1, locked: {} };
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return { version: 1, locked: {} };
  }
}

export function writeLock(root, kind, data) {
  const p = lockManifestPath(root, kind);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function isLocked(root, kind, fileName) {
  const data = readLock(root, kind);
  const entry = data.locked?.[fileName];
  return entry === "painted";
}

export function lockFile(root, kind, fileName, source = "painted") {
  const data = readLock(root, kind);
  data.locked ??= {};
  data.locked[fileName] = source;
  writeLock(root, kind, data);
}
