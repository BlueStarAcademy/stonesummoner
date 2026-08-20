/**
 * Skill-matched battle VFX — CSS choreography (cast → travel → impact).
 * Distinct presets per skill kind × element so hits are not one shared spark.
 */

import type { CombatElement, CombatSfxKind } from "../audio";
import {
  fxDurationMs,
  playUltCutin,
  pulseUnitClass,
  waitFx,
} from "./fx";

const reduceMotion =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export type SkillVfxPreset =
  | "slash"
  | "fire-burst"
  | "fire-nova"
  | "ice-burst"
  | "ice-nova"
  | "wind-cut"
  | "wind-storm"
  | "light-beam"
  | "light-burst"
  | "dark-burst"
  | "dark-void"
  | "heal"
  | "shield"
  | "buff"
  | "hex"
  | "cast";

export type SkillVfxFamily = "melee" | "bolt" | "nova" | "support";

const PRESET_PARTS: Record<SkillVfxPreset, readonly string[]> = {
  slash: [
    "sfx-slash",
    "sfx-slash sfx-slash-b",
    "sfx-core",
    "sfx-spark sfx-p1",
    "sfx-spark sfx-p2",
    "sfx-spark sfx-p3",
  ],
  "fire-burst": [
    "sfx-flare",
    "sfx-core",
    "sfx-ring",
    "sfx-ember sfx-p1",
    "sfx-ember sfx-p2",
    "sfx-ember sfx-p3",
    "sfx-ember sfx-p4",
    "sfx-ember sfx-p5",
  ],
  "fire-nova": [
    "sfx-ring",
    "sfx-ring sfx-ring-b",
    "sfx-flare",
    "sfx-core",
    "sfx-ember sfx-p1",
    "sfx-ember sfx-p2",
    "sfx-ember sfx-p3",
    "sfx-ember sfx-p4",
  ],
  "ice-burst": [
    "sfx-ring sfx-frost",
    "sfx-core",
    "sfx-shard sfx-p1",
    "sfx-shard sfx-p2",
    "sfx-shard sfx-p3",
    "sfx-shard sfx-p4",
    "sfx-shard sfx-p5",
  ],
  "ice-nova": [
    "sfx-ring sfx-frost",
    "sfx-ring sfx-ring-b sfx-frost",
    "sfx-core",
    "sfx-shard sfx-p1",
    "sfx-shard sfx-p2",
    "sfx-shard sfx-p3",
    "sfx-crystal",
  ],
  "wind-cut": [
    "sfx-slash sfx-wind",
    "sfx-slash sfx-slash-b sfx-wind",
    "sfx-slash sfx-slash-c sfx-wind",
    "sfx-spark sfx-p1",
    "sfx-spark sfx-p2",
    "sfx-spark sfx-p3",
  ],
  "wind-storm": [
    "sfx-swirl",
    "sfx-ring",
    "sfx-slash sfx-wind",
    "sfx-slash sfx-slash-b sfx-wind",
    "sfx-spark sfx-p1",
    "sfx-spark sfx-p2",
  ],
  "light-beam": [
    "sfx-beam",
    "sfx-flare",
    "sfx-core",
    "sfx-ray sfx-p1",
    "sfx-ray sfx-p2",
    "sfx-ray sfx-p3",
  ],
  "light-burst": [
    "sfx-flare",
    "sfx-core",
    "sfx-ring",
    "sfx-ray sfx-p1",
    "sfx-ray sfx-p2",
    "sfx-ray sfx-p3",
    "sfx-ray sfx-p4",
  ],
  "dark-burst": [
    "sfx-core",
    "sfx-wisp sfx-p1",
    "sfx-wisp sfx-p2",
    "sfx-wisp sfx-p3",
    "sfx-wisp sfx-p4",
    "sfx-ring",
  ],
  "dark-void": [
    "sfx-swirl sfx-void",
    "sfx-core",
    "sfx-ring",
    "sfx-wisp sfx-p1",
    "sfx-wisp sfx-p2",
    "sfx-wisp sfx-p3",
  ],
  heal: [
    "sfx-ring sfx-soft",
    "sfx-core sfx-soft",
    "sfx-orb sfx-p1",
    "sfx-orb sfx-p2",
    "sfx-orb sfx-p3",
    "sfx-orb sfx-p4",
    "sfx-orb sfx-p5",
  ],
  shield: ["sfx-dome", "sfx-ring sfx-soft", "sfx-core sfx-soft"],
  buff: ["sfx-rune", "sfx-ring sfx-soft", "sfx-core sfx-soft", "sfx-spark sfx-p1", "sfx-spark sfx-p2"],
  hex: ["sfx-sigil", "sfx-ring", "sfx-wisp sfx-p1", "sfx-wisp sfx-p2", "sfx-wisp sfx-p3"],
  cast: ["sfx-ring sfx-soft", "sfx-core", "sfx-spark sfx-p1", "sfx-spark sfx-p2"],
};

function uniqueIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function skillVfxFamily(
  kind: CombatSfxKind,
  element: CombatElement,
  ult?: boolean,
): SkillVfxFamily {
  if (
    kind === "heal" ||
    kind === "shield" ||
    kind === "buff" ||
    kind === "amplify" ||
    kind === "dual-stone" ||
    kind === "board-clean"
  ) {
    return "support";
  }
  if (kind === "debuff") return "support";
  if (kind === "aoe" || ult) return "nova";
  if (element === "fire" || element === "wind") return "melee";
  return "bolt";
}

export function impactPreset(
  kind: CombatSfxKind,
  element: CombatElement,
  family: SkillVfxFamily,
): SkillVfxPreset {
  if (kind === "heal") return "heal";
  if (kind === "shield") return "shield";
  if (kind === "buff" || kind === "amplify") return "buff";
  if (kind === "debuff") return element === "water" ? "ice-burst" : "hex";
  if (kind === "dual-stone" || kind === "board-clean") return "buff";
  if (family === "nova") {
    if (element === "fire") return "fire-nova";
    if (element === "water") return "ice-nova";
    if (element === "wind") return "wind-storm";
    if (element === "light") return "light-burst";
    return "dark-void";
  }
  if (element === "fire") return "fire-burst";
  if (element === "water") return "ice-burst";
  if (element === "wind") return "wind-cut";
  if (element === "light") return "light-beam";
  return "dark-burst";
}

function casterPreset(family: SkillVfxFamily, element: CombatElement): SkillVfxPreset {
  if (family === "melee") {
    return element === "wind" ? "wind-cut" : "slash";
  }
  if (family === "nova") {
    if (element === "fire") return "fire-burst";
    if (element === "water") return "ice-burst";
    if (element === "wind") return "wind-cut";
    if (element === "light") return "light-burst";
    return "dark-burst";
  }
  return "cast";
}

function queryUnit(root: ParentNode, unitId: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(
    `.battle-unit[data-unit="${CSS.escape(unitId)}"]`,
  );
}

function skillFxLayer(root: ParentNode): HTMLElement | null {
  const host = root as ParentNode & { querySelector?: Document["querySelector"] };
  if (typeof host.querySelector !== "function") return null;
  return (
    host.querySelector<HTMLElement>(".skill-fx-layer") ??
    host.querySelector<HTMLElement>(".dmg-layer") ??
    host.querySelector<HTMLElement>(".battle-layout")
  );
}

export function spawnSkillFx(
  root: ParentNode,
  unitId: string,
  preset: SkillVfxPreset,
  ms: number,
  opts?: { element?: CombatElement; crit?: boolean; ult?: boolean },
): void {
  if (reduceMotion) return;
  const el = queryUnit(root, unitId);
  if (!el) return;
  const wrap = document.createElement("span");
  wrap.className = `skill-fx skill-fx--${preset} skill-fx--${opts?.element ?? "light"}`;
  if (opts?.crit) wrap.classList.add("is-crit");
  if (opts?.ult) wrap.classList.add("is-ult");
  wrap.setAttribute("aria-hidden", "true");
  for (const cls of PRESET_PARTS[preset]) {
    const part = document.createElement("i");
    part.className = cls;
    wrap.appendChild(part);
  }
  wrap.style.setProperty("--skfx-ms", `${Math.max(80, ms)}ms`);
  el.appendChild(wrap);
  window.setTimeout(() => wrap.remove(), Math.max(80, ms));
}

function unitAnchor(
  root: ParentNode,
  unitId: string,
): { x: number; y: number } | null {
  const unit = queryUnit(root, unitId);
  const art =
    unit?.querySelector<HTMLElement>(".battle-unit-art") ?? unit;
  if (!art) return null;
  const r = art.getBoundingClientRect();
  if (r.width < 1 && r.height < 1) return null;
  return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.42 };
}

export function spawnTravelBolt(
  root: ParentNode,
  fromId: string,
  toId: string,
  element: CombatElement,
  ms: number,
): void {
  if (reduceMotion) return;
  const layer = skillFxLayer(root);
  if (!layer) return;
  const from = unitAnchor(root, fromId);
  const to = unitAnchor(root, toId);
  if (!from || !to) return;
  const layerRect = layer.getBoundingClientRect();
  const x0 = from.x - layerRect.left;
  const y0 = from.y - layerRect.top;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
  const bolt = document.createElement("span");
  bolt.className = `skill-bolt skill-bolt--${element}`;
  bolt.setAttribute("aria-hidden", "true");
  bolt.style.left = `${Math.round(x0)}px`;
  bolt.style.top = `${Math.round(y0)}px`;
  bolt.style.setProperty("--dx", `${Math.round(dx)}px`);
  bolt.style.setProperty("--dy", `${Math.round(dy)}px`);
  bolt.style.setProperty("--rot", `${rot}deg`);
  bolt.style.setProperty("--bolt-ms", `${Math.max(80, ms)}ms`);
  const core = document.createElement("i");
  core.className = "skill-bolt-core";
  const trail = document.createElement("i");
  trail.className = "skill-bolt-trail";
  bolt.appendChild(trail);
  bolt.appendChild(core);
  layer.appendChild(bolt);
  window.setTimeout(() => bolt.remove(), Math.max(80, ms + 40));
}

function spawnAoeField(
  root: ParentNode,
  targetIds: string[],
  element: CombatElement,
  ms: number,
  ult?: boolean,
): void {
  if (reduceMotion || targetIds.length < 2) return;
  const layer = skillFxLayer(root);
  if (!layer) return;
  const layerRect = layer.getBoundingClientRect();
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const id of targetIds) {
    const a = unitAnchor(root, id);
    if (!a) continue;
    sx += a.x;
    sy += a.y;
    n += 1;
  }
  if (!n) return;
  const field = document.createElement("span");
  field.className = `skill-field skill-field--${element}${ult ? " is-ult" : ""}`;
  field.setAttribute("aria-hidden", "true");
  field.style.left = `${Math.round(sx / n - layerRect.left)}px`;
  field.style.top = `${Math.round(sy / n - layerRect.top)}px`;
  field.style.setProperty("--field-ms", `${Math.max(80, ms)}ms`);
  const ring = document.createElement("i");
  ring.className = "skill-field-ring";
  const ringB = document.createElement("i");
  ringB.className = "skill-field-ring skill-field-ring-b";
  field.appendChild(ring);
  field.appendChild(ringB);
  layer.appendChild(field);
  window.setTimeout(() => field.remove(), Math.max(80, ms + 40));
}

export type SkillVfxPlayOpts = {
  kind: CombatSfxKind;
  element: CombatElement;
  speed: number;
  ult?: boolean;
  crit?: boolean;
  onImpact?: () => void;
  playCasterClip?: (
    unitId: string,
    clip: "run" | "attack" | "cast" | "ult",
    opts?: { loop?: boolean },
  ) => void;
};

/**
 * Full skill presentation: caster motion, optional projectile, per-target impact.
 */
export async function playSkillVfx(
  root: ParentNode,
  hits: Array<{ attackerId: string; targetId: string }>,
  opts: SkillVfxPlayOpts,
): Promise<void> {
  if (!hits.length) return;
  const attackerId = hits[0]!.attackerId;
  const targets = uniqueIds(hits.map((h) => h.targetId));
  const family = skillVfxFamily(opts.kind, opts.element, opts.ult);
  const impact = impactPreset(opts.kind, opts.element, family);
  const cast = casterPreset(family, opts.element);
  const hitClass =
    opts.kind === "heal"
      ? "fx-hit-heal"
      : opts.kind === "shield" || opts.kind === "buff"
        ? "fx-hit-ward"
        : opts.element === "water"
          ? "fx-hit-ice"
          : opts.element === "dark"
            ? "fx-hit-dark"
            : "fx-hit";

  const pulse = (id: string, cls: string, ms: number) =>
    pulseUnitClass(root, id, cls, ms);

  if (opts.ult) {
    const cutMs = fxDurationMs(640, opts.speed);
    const impactMs = fxDurationMs(720, opts.speed);
    playUltCutin(root, cutMs);
    pulse(attackerId, "fx-ult", cutMs);
    spawnSkillFx(root, attackerId, family === "nova" ? impact : cast, cutMs, {
      element: opts.element,
      ult: true,
      crit: opts.crit,
    });
    opts.playCasterClip?.(attackerId, "ult");
    const hitAt = Math.floor(cutMs * 0.42);
    window.setTimeout(() => {
      spawnAoeField(root, targets, opts.element, impactMs, true);
      targets.forEach((id, i) => {
        window.setTimeout(() => {
          pulse(id, hitClass, fxDurationMs(420, opts.speed));
          spawnSkillFx(root, id, impact, impactMs, {
            element: opts.element,
            ult: true,
            crit: opts.crit,
          });
        }, i * 70);
      });
      opts.onImpact?.();
    }, hitAt);
    await waitFx(cutMs + fxDurationMs(180, opts.speed));
    return;
  }

  if (family === "melee") {
    const lungeMs = fxDurationMs(520, opts.speed);
    const impactMs = fxDurationMs(560, opts.speed);
    pulse(attackerId, "fx-lunge", lungeMs);
    spawnSkillFx(root, attackerId, cast, lungeMs, {
      element: opts.element,
      crit: opts.crit,
    });
    opts.playCasterClip?.(attackerId, "run", { loop: false });
    const hitAt = Math.floor(lungeMs * 0.38);
    window.setTimeout(() => {
      opts.playCasterClip?.(attackerId, "attack");
      targets.forEach((id, i) => {
        window.setTimeout(() => {
          pulse(id, hitClass, fxDurationMs(380, opts.speed));
          spawnSkillFx(root, id, impact, impactMs, {
            element: opts.element,
            crit: opts.crit,
          });
        }, i * 55);
      });
      opts.onImpact?.();
    }, hitAt);
    await waitFx(lungeMs + fxDurationMs(140, opts.speed));
    return;
  }

  if (family === "bolt") {
    const chargeMs = fxDurationMs(360, opts.speed);
    const flyMs = fxDurationMs(280, opts.speed);
    const impactMs = fxDurationMs(580, opts.speed);
    pulse(attackerId, "fx-cast-skill", chargeMs);
    spawnSkillFx(root, attackerId, "cast", chargeMs, { element: opts.element });
    opts.playCasterClip?.(attackerId, "cast");
    const launchAt = Math.floor(chargeMs * 0.55);
    window.setTimeout(() => {
      for (const id of targets) {
        spawnTravelBolt(root, attackerId, id, opts.element, flyMs);
      }
    }, launchAt);
    window.setTimeout(() => {
      targets.forEach((id, i) => {
        window.setTimeout(() => {
          pulse(id, hitClass, fxDurationMs(400, opts.speed));
          spawnSkillFx(root, id, impact, impactMs, {
            element: opts.element,
            crit: opts.crit,
          });
        }, i * 50);
      });
      opts.onImpact?.();
    }, launchAt + flyMs);
    await waitFx(launchAt + flyMs + fxDurationMs(420, opts.speed));
    return;
  }

  if (family === "nova") {
    const chargeMs = fxDurationMs(480, opts.speed);
    const impactMs = fxDurationMs(680, opts.speed);
    pulse(attackerId, "fx-cast-skill", chargeMs);
    spawnSkillFx(root, attackerId, cast, chargeMs, {
      element: opts.element,
      ult: opts.ult,
    });
    opts.playCasterClip?.(attackerId, "cast");
    const hitAt = Math.floor(chargeMs * 0.62);
    window.setTimeout(() => {
      spawnAoeField(root, targets, opts.element, impactMs, opts.ult);
      targets.forEach((id, i) => {
        window.setTimeout(() => {
          pulse(id, hitClass, fxDurationMs(420, opts.speed));
          spawnSkillFx(root, id, impact, impactMs, {
            element: opts.element,
            crit: opts.crit,
          });
        }, i * 75);
      });
      opts.onImpact?.();
    }, hitAt);
    await waitFx(chargeMs + fxDurationMs(360, opts.speed));
    return;
  }

  const chargeMs = fxDurationMs(420, opts.speed);
  const impactMs = fxDurationMs(700, opts.speed);
  pulse(attackerId, "fx-cast-skill", chargeMs);
  spawnSkillFx(root, attackerId, "cast", chargeMs, { element: opts.element });
  if (opts.kind === "buff" || opts.kind === "amplify") {
    spawnSkillFx(root, attackerId, "buff", chargeMs, { element: opts.element });
  }
  opts.playCasterClip?.(attackerId, "cast");
  const hitAt = Math.floor(chargeMs * 0.48);
  window.setTimeout(() => {
    const ids = targets.length ? targets : [attackerId];
    ids.forEach((id, i) => {
      window.setTimeout(() => {
        pulse(id, hitClass, fxDurationMs(420, opts.speed));
        spawnSkillFx(root, id, impact, impactMs, { element: opts.element });
      }, i * 80);
    });
    opts.onImpact?.();
  }, hitAt);
  await waitFx(chargeMs + fxDurationMs(380, opts.speed));
}
