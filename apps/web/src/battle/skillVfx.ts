/**
 * Skill-matched battle VFX — painted sprite playback (flash → slash/burst → debris).
 * Distinct art per skill kind × element; no CSS circles / squares.
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

export type SkillBoltKind =
  | CombatElement
  | "heal"
  | "buff"
  | "shield"
  | "slash"
  | "hex";

const ART = {
  slash1: "/art/battle/fx/fx-slash-1.webp",
  slash2: "/art/battle/fx/fx-slash-2.webp",
  slash3: "/art/battle/fx/fx-slash-3.webp",
  slashFire: "/art/battle/fx/fx-slash-fire.webp",
  slashWind: "/art/battle/fx/fx-slash-wind.webp",
  flash: "/art/battle/fx/fx-impact-1.webp",
  debris: "/art/battle/fx/fx-impact-3.webp",
  hitFire: "/art/battle/fx/fx-hit-fire.webp",
  hitWater: "/art/battle/fx/fx-hit-water.webp",
  hitWind: "/art/battle/fx/fx-hit-wind.webp",
  hitLight: "/art/battle/fx/fx-hit-light.webp",
  hitDark: "/art/battle/fx/fx-hit-dark.webp",
  hitCrit: "/art/battle/fx/fx-hit-crit.webp",
  strikeUlt: "/art/battle/fx/fx-strike-ult.webp",
  heal: "/art/battle/fx/fx-heal.webp",
  shield: "/art/battle/fx/fx-shield.webp",
  buff: "/art/battle/fx/fx-buff.webp",
  hex: "/art/battle/fx/fx-hex.webp",
  cast: "/art/battle/fx/fx-cast.webp",
  bolt: "/art/battle/fx/fx-bolt.webp",
  boltWater: "/art/battle/fx/fx-bolt-water.svg",
  boltDark: "/art/battle/fx/fx-bolt-dark.svg",
  boltFire: "/art/battle/fx/fx-bolt-fire.svg",
  boltWind: "/art/battle/fx/fx-bolt-wind.svg",
  boltLight: "/art/battle/fx/fx-bolt-light.svg",
  orbHeal: "/art/battle/fx/fx-orb-heal.svg",
  orbBuff: "/art/battle/fx/fx-orb-buff.svg",
  orbShield: "/art/battle/fx/fx-orb-shield.svg",
  shock: "/art/battle/fx/fx-shockwave.webp",
} as const;

type SkfxLayer = { src: string; cls: string };

let fxPreloaded = false;

function preloadBattleFx(): void {
  if (fxPreloaded || typeof Image === "undefined") return;
  fxPreloaded = true;
  for (const src of Object.values(ART)) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

function hitArt(element: CombatElement): string {
  if (element === "fire") return ART.hitFire;
  if (element === "water") return ART.hitWater;
  if (element === "wind") return ART.hitWind;
  if (element === "light") return ART.hitLight;
  return ART.hitDark;
}

function slashArt(element: CombatElement): string {
  if (element === "fire") return ART.slashFire;
  if (element === "wind") return ART.slashWind;
  return ART.slash2;
}

function boltArt(kind: SkillBoltKind): string {
  if (kind === "heal") return ART.orbHeal;
  if (kind === "buff") return ART.orbBuff;
  if (kind === "shield") return ART.orbShield;
  if (kind === "slash") return ART.slash2;
  if (kind === "hex") return ART.hex;
  if (kind === "water") return ART.boltWater;
  if (kind === "dark") return ART.boltDark;
  if (kind === "fire") return ART.boltFire;
  if (kind === "wind") return ART.boltWind;
  return ART.boltLight;
}

function supportBoltKind(kind: CombatSfxKind): SkillBoltKind {
  if (kind === "heal") return "heal";
  if (kind === "shield") return "shield";
  if (kind === "debuff") return "hex";
  return "buff";
}

function isOrbBolt(kind: SkillBoltKind): boolean {
  return kind === "heal" || kind === "buff" || kind === "shield";
}

function boltArc(dx: number, dy: number, kind: SkillBoltKind): number {
  const dist = Math.hypot(dx, dy);
  const mul =
    kind === "slash" || kind === "light" || kind === "wind"
      ? 0.06
      : kind === "fire"
        ? 0.18
        : kind === "water"
          ? 0.14
          : isOrbBolt(kind)
            ? 0.32
            : 0.2;
  return Math.min(96, Math.max(10, dist * mul));
}

function boltVolley(kind: SkillBoltKind): number {
  if (kind === "light" || kind === "heal" || kind === "buff" || kind === "shield") {
    return 1;
  }
  if (kind === "wind" || kind === "fire") return 2;
  return 1;
}

function boltPath(dx: number, dy: number, arc: number): string {
  const qx = Math.round(dx * 0.5);
  const qy = Math.round(dy * 0.5 - arc);
  return `M 0 0 Q ${qx} ${qy} ${Math.round(dx)} ${Math.round(dy)}`;
}

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

function presetLayers(
  preset: SkillVfxPreset,
  element: CombatElement,
  opts?: { crit?: boolean; ult?: boolean; role?: "cast" | "hit" },
): SkfxLayer[] {
  const hit = hitArt(element);
  const slash = slashArt(element);
  const layers: SkfxLayer[] = [];

  const impactSeq = () => {
    layers.push({ src: ART.flash, cls: "skfx-img skfx-img--flash" });
    layers.push({ src: hit, cls: "skfx-img skfx-img--burst" });
    layers.push({ src: ART.debris, cls: "skfx-img skfx-img--debris" });
  };

  if (preset === "slash" || preset === "wind-cut") {
    if (opts?.role === "cast") {
      layers.push({ src: slash, cls: "skfx-img skfx-img--slash" });
      layers.push({ src: ART.slash3, cls: "skfx-img skfx-img--trail" });
    } else {
      layers.push({ src: slash, cls: "skfx-img skfx-img--slash" });
      if (preset === "wind-cut") {
        layers.push({ src: ART.slashWind, cls: "skfx-img skfx-img--slash skfx-img--slash-b" });
      }
      layers.push({ src: ART.slash3, cls: "skfx-img skfx-img--trail" });
      layers.push({ src: hit, cls: "skfx-img skfx-img--burst" });
      layers.push({ src: ART.debris, cls: "skfx-img skfx-img--debris" });
    }
  } else if (preset === "light-beam") {
    layers.push({ src: ART.hitLight, cls: "skfx-img skfx-img--beam" });
    layers.push({ src: hit, cls: "skfx-img skfx-img--burst" });
    layers.push({ src: ART.debris, cls: "skfx-img skfx-img--debris" });
  } else if (
    preset === "fire-nova" ||
    preset === "ice-nova" ||
    preset === "wind-storm" ||
    preset === "dark-void" ||
    preset === "light-burst"
  ) {
    layers.push({ src: ART.shock, cls: "skfx-img skfx-img--shock" });
    impactSeq();
    if (preset === "wind-storm") {
      layers.push({ src: ART.slashWind, cls: "skfx-img skfx-img--slash" });
    }
  } else if (preset === "heal") {
    layers.push({ src: ART.heal, cls: "skfx-img skfx-img--heal-bloom" });
    layers.push({ src: ART.heal, cls: "skfx-img skfx-img--heal-motes" });
  } else if (preset === "shield") {
    layers.push({ src: ART.shield, cls: "skfx-img skfx-img--ward" });
  } else if (preset === "buff") {
    layers.push({ src: ART.buff, cls: "skfx-img skfx-img--empower" });
    layers.push({ src: ART.cast, cls: "skfx-img skfx-img--empower-ring" });
  } else if (preset === "hex") {
    layers.push({ src: ART.hex, cls: "skfx-img skfx-img--hex" });
  } else if (preset === "cast") {
    layers.push({ src: ART.cast, cls: "skfx-img skfx-img--cast" });
    layers.push({ src: ART.cast, cls: "skfx-img skfx-img--cast skfx-img--cast-b" });
  } else {
    impactSeq();
  }

  if (opts?.crit && opts?.role !== "cast") {
    layers.push({ src: ART.hitCrit, cls: "skfx-img skfx-img--crit" });
  }
  if (opts?.ult && opts?.role !== "cast") {
    layers.push({ src: ART.strikeUlt, cls: "skfx-img skfx-img--ult" });
  }
  return layers;
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

function appendFxImg(wrap: HTMLElement, layer: SkfxLayer): void {
  const img = document.createElement("img");
  img.className = layer.cls;
  img.src = layer.src;
  img.alt = "";
  img.draggable = false;
  img.decoding = "async";
  img.setAttribute("aria-hidden", "true");
  wrap.appendChild(img);
}

function spawnFxMotes(wrap: HTMLElement, kind: "heal" | "buff", ms: number): void {
  const n = kind === "heal" ? 10 : 8;
  const step = Math.max(0.04, (ms / 1000) * 0.07);
  for (let i = 0; i < n; i++) {
    const mote = document.createElement("span");
    mote.className = `skfx-mote skfx-mote--${kind}`;
    mote.style.setProperty("--mote-x", `${-46 + i * 10}%`);
    mote.style.setProperty("--mote-delay", `${(i * step).toFixed(2)}s`);
    wrap.appendChild(mote);
  }
}

export function spawnSkillFx(
  root: ParentNode,
  unitId: string,
  preset: SkillVfxPreset,
  ms: number,
  opts?: {
    element?: CombatElement;
    crit?: boolean;
    ult?: boolean;
    role?: "cast" | "hit";
  },
): void {
  if (reduceMotion) return;
  preloadBattleFx();
  const el = queryUnit(root, unitId);
  if (!el) return;
  const element = opts?.element ?? "light";
  const wrap = document.createElement("span");
  wrap.className = `skill-fx skill-fx--${preset} skill-fx--${element}`;
  if (preset === "slash" || preset === "wind-cut") wrap.classList.add("is-melee");
  if (opts?.role === "cast") wrap.classList.add("is-cast");
  if (opts?.crit && opts?.role !== "cast") wrap.classList.add("is-crit");
  if (opts?.ult && opts?.role !== "cast") wrap.classList.add("is-ult");
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.setProperty("--skfx-ms", `${Math.max(80, ms)}ms`);
  for (const layer of presetLayers(preset, element, opts)) {
    appendFxImg(wrap, layer);
  }
  if (preset === "heal") spawnFxMotes(wrap, "heal", ms);
  if (preset === "buff") spawnFxMotes(wrap, "buff", ms);
  el.appendChild(wrap);
  window.setTimeout(() => wrap.remove(), Math.max(80, Math.round(ms * 1.4)));
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
  kind: SkillBoltKind,
  ms: number,
  opts?: { ghost?: boolean; delayMs?: number },
): void {
  if (reduceMotion) return;
  if (fromId === toId) return;
  preloadBattleFx();
  const layer = skillFxLayer(root);
  if (!layer) return;
  const from = unitAnchor(root, fromId);
  const to = unitAnchor(root, toId);
  if (!from || !to) return;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.hypot(dx, dy) < 10) return;
  const layerRect = layer.getBoundingClientRect();
  const x0 = from.x - layerRect.left;
  const y0 = from.y - layerRect.top;
  const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
  const orb = isOrbBolt(kind);
  const arc = boltArc(dx, dy, kind);
  const delayMs = Math.max(0, opts?.delayMs ?? 0);
  const bolt = document.createElement("span");
  bolt.className = `skill-bolt skill-bolt--${kind}${orb ? " is-orb" : " is-arc"}${opts?.ghost ? " is-ghost" : ""}`;
  bolt.setAttribute("aria-hidden", "true");
  bolt.style.left = `${Math.round(x0)}px`;
  bolt.style.top = `${Math.round(y0)}px`;
  bolt.style.setProperty("--dx", `${Math.round(dx)}px`);
  bolt.style.setProperty("--dy", `${Math.round(dy)}px`);
  bolt.style.setProperty("--rot", `${rot}deg`);
  bolt.style.setProperty("--bolt-ms", `${Math.max(80, ms)}ms`);
  if (delayMs) bolt.style.animationDelay = `${delayMs}ms`;
  bolt.style.offsetPath = `path("${boltPath(dx, dy, arc)}")`;
  if (orb) bolt.style.offsetRotate = "0deg";
  const wake = document.createElement("span");
  wake.className = "skill-bolt-wake";
  bolt.appendChild(wake);
  const img = document.createElement("img");
  img.className = "skill-bolt-art";
  img.src = boltArt(kind);
  img.alt = "";
  img.draggable = false;
  img.decoding = "async";
  img.setAttribute("aria-hidden", "true");
  bolt.appendChild(img);
  layer.appendChild(bolt);
  window.setTimeout(() => bolt.remove(), Math.max(80, ms + delayMs + 80));
}

function spawnBoltFlight(
  root: ParentNode,
  fromId: string,
  toId: string,
  kind: SkillBoltKind,
  ms: number,
): void {
  spawnTravelBolt(root, fromId, toId, kind, ms);
  const volley = boltVolley(kind);
  if (volley < 2) return;
  spawnTravelBolt(root, fromId, toId, kind, Math.round(ms * 0.9), {
    ghost: true,
    delayMs: Math.round(ms * 0.12),
  });
}

function pulseBattleSlam(
  root: ParentNode,
  ms: number,
  ult?: boolean,
): void {
  if (reduceMotion) return;
  const stage =
    (root as ParentNode & { querySelector?: Document["querySelector"] })
      .querySelector?.<HTMLElement>(".battle-screen") ?? null;
  if (!stage) return;
  const cls = ult ? "is-ult-impact" : "is-skill-slam";
  stage.classList.add(cls);
  window.setTimeout(() => stage.classList.remove(cls), Math.max(80, ms));
}

export type CircleAbsorbPower = "safe" | "capture" | "capture-large" | "shape";

function queryTeamSummoner(
  root: ParentNode,
  team: "ally" | "enemy",
): HTMLElement | null {
  return root.querySelector<HTMLElement>(
    `.battle-lane.${team} .battle-unit--summoner`,
  );
}

/** Head sparkle on the summoner while the circle inscribes. */
export function spawnCircleAbsorbVfx(
  root: ParentNode,
  team: "ally" | "enemy",
  power: CircleAbsorbPower,
  ms: number,
): void {
  if (reduceMotion) return;
  const summoner = queryTeamSummoner(root, team);
  if (summoner) {
    summoner.classList.add("is-mana-intake", `is-mana-intake--${power}`);
    window.setTimeout(() => {
      summoner.classList.remove(
        "is-mana-intake",
        `is-mana-intake--${power}`,
      );
    }, Math.max(80, ms));
  }
  spawnCircleRite(root, ms, power);
}

function spawnCircleRite(
  root: ParentNode,
  ms: number,
  power: CircleAbsorbPower,
): void {
  const host = root as ParentNode & { querySelector?: Document["querySelector"] };
  const absorb =
    host.querySelector?.<HTMLElement>(".board-circle-absorb") ?? null;
  if (!absorb) return;
  const rite = document.createElement("span");
  rite.className = `circle-rite circle-rite--${power}`;
  rite.setAttribute("aria-hidden", "true");
  rite.style.setProperty("--rite-ms", `${Math.max(80, ms)}ms`);
  const bloom = document.createElement("span");
  bloom.className = "circle-rite-bloom";
  rite.appendChild(bloom);
  const sparkN =
    power === "capture-large" || power === "shape"
      ? 12
      : power === "capture"
        ? 10
        : 8;
  for (let i = 0; i < sparkN; i++) {
    const spark = document.createElement("i");
    spark.className = "circle-rite-spark";
    spark.style.setProperty("--spark-i", String(i));
    spark.style.setProperty("--spark-n", String(sparkN));
    rite.appendChild(spark);
  }
  const ringA = document.createElement("span");
  ringA.className = "circle-rite-ring";
  const ringB = document.createElement("span");
  ringB.className = "circle-rite-ring is-inner";
  rite.appendChild(ringA);
  rite.appendChild(ringB);
  absorb.appendChild(rite);
  window.setTimeout(() => rite.remove(), Math.max(80, ms + 40));
}

function spawnAoeField(
  root: ParentNode,
  targetIds: string[],
  element: CombatElement,
  ms: number,
  ult?: boolean,
): void {
  if (reduceMotion) return;
  preloadBattleFx();
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
  const img = document.createElement("img");
  img.className = "skill-field-art";
  img.src = ART.shock;
  img.alt = "";
  img.draggable = false;
  img.decoding = "async";
  img.setAttribute("aria-hidden", "true");
  field.appendChild(img);
  const burst = document.createElement("img");
  burst.className = "skill-field-burst";
  burst.src = hitArt(element);
  burst.alt = "";
  burst.draggable = false;
  burst.decoding = "async";
  burst.setAttribute("aria-hidden", "true");
  field.appendChild(burst);
  layer.appendChild(field);
  window.setTimeout(() => field.remove(), Math.max(80, Math.round(ms * 1.25)));
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
  preloadBattleFx();
  const attackerId = hits[0]!.attackerId;
  const targets = uniqueIds(hits.map((h) => h.targetId));
  const family = skillVfxFamily(opts.kind, opts.element, opts.ult);
  const impact = impactPreset(opts.kind, opts.element, family);
  const hitClass =
    opts.kind === "heal"
      ? "fx-hit-heal"
      : opts.kind === "buff" || opts.kind === "amplify"
        ? "fx-empower"
        : opts.kind === "shield"
          ? "fx-hit-ward"
          : opts.element === "water"
            ? "fx-hit-ice"
            : opts.element === "dark"
              ? "fx-hit-dark"
              : "fx-hit";

  const pulse = (id: string, cls: string, ms: number) =>
    pulseUnitClass(root, id, cls, ms);

  const flinchMs = fxDurationMs(280, opts.speed);
  const supportSelf =
    opts.kind === "heal" ||
    opts.kind === "buff" ||
    opts.kind === "shield" ||
    opts.kind === "amplify";
  const strikeTarget = (id: string, delay: number, impactMs: number) => {
    window.setTimeout(() => {
      if (id !== attackerId || supportSelf) pulse(id, hitClass, flinchMs);
      spawnSkillFx(root, id, impact, impactMs, {
        element: opts.element,
        ult: opts.ult,
        crit: opts.crit,
        role: "hit",
      });
    }, delay);
  };

  if (opts.ult) {
    const cutMs = fxDurationMs(720, opts.speed);
    const flyMs = fxDurationMs(380, opts.speed);
    const impactMs = fxDurationMs(720, opts.speed);
    playUltCutin(root, cutMs);
    pulse(attackerId, "fx-ult", cutMs);
    spawnSkillFx(root, attackerId, "cast", cutMs, {
      element: opts.element,
      role: "cast",
    });
    opts.playCasterClip?.(attackerId, "ult");
    const launchAt = Math.floor(cutMs * 0.5);
    window.setTimeout(() => {
      for (const id of targets) {
        spawnBoltFlight(root, attackerId, id, opts.element, flyMs);
      }
    }, launchAt);
    const impactAt = launchAt + flyMs;
    window.setTimeout(() => {
      spawnAoeField(root, targets, opts.element, impactMs, true);
      pulseBattleSlam(root, fxDurationMs(420, opts.speed), true);
      targets.forEach((id, i) => strikeTarget(id, i * 90, impactMs));
      opts.onImpact?.();
    }, impactAt);
    await waitFx(impactAt + impactMs + Math.max(0, (targets.length - 1) * 90));
    return;
  }

  if (family === "melee") {
    const lungeMs = fxDurationMs(480, opts.speed);
    const impactMs = fxDurationMs(560, opts.speed);
    const swing: SkillVfxPreset = opts.element === "wind" ? "wind-cut" : "slash";
    pulse(attackerId, "fx-lunge", lungeMs);
    spawnSkillFx(root, attackerId, "cast", Math.floor(lungeMs * 0.7), {
      element: opts.element,
      role: "cast",
    });
    opts.playCasterClip?.(attackerId, "run", { loop: false });
    const hitAt = Math.floor(lungeMs * 0.42);
    window.setTimeout(() => {
      opts.playCasterClip?.(attackerId, "attack");
      spawnSkillFx(root, attackerId, swing, fxDurationMs(360, opts.speed), {
        element: opts.element,
        role: "cast",
      });
      targets.forEach((id, i) => strikeTarget(id, i * 60, impactMs));
      opts.onImpact?.();
    }, hitAt);
    await waitFx(hitAt + impactMs + Math.max(0, (targets.length - 1) * 60));
    return;
  }

  if (family === "bolt") {
    const chargeMs = fxDurationMs(420, opts.speed);
    const flyMs = fxDurationMs(460, opts.speed);
    const impactMs = fxDurationMs(560, opts.speed);
    pulse(attackerId, "fx-cast-skill", chargeMs);
    spawnSkillFx(root, attackerId, "cast", chargeMs, {
      element: opts.element,
      role: "cast",
    });
    opts.playCasterClip?.(attackerId, "cast");
    const launchAt = Math.floor(chargeMs * 0.58);
    window.setTimeout(() => {
      for (const id of targets) {
        spawnBoltFlight(root, attackerId, id, opts.element, flyMs);
      }
    }, launchAt);
    const impactAt = launchAt + flyMs;
    window.setTimeout(() => {
      targets.forEach((id, i) => strikeTarget(id, i * 70, impactMs));
      opts.onImpact?.();
    }, impactAt);
    await waitFx(impactAt + impactMs + Math.max(0, (targets.length - 1) * 70));
    return;
  }

  if (family === "nova") {
    const chargeMs = fxDurationMs(520, opts.speed);
    const flyMs = fxDurationMs(400, opts.speed);
    const impactMs = fxDurationMs(640, opts.speed);
    pulse(attackerId, "fx-cast-skill", chargeMs);
    spawnSkillFx(root, attackerId, "cast", chargeMs, {
      element: opts.element,
      role: "cast",
    });
    opts.playCasterClip?.(attackerId, "cast");
    const launchAt = Math.floor(chargeMs * 0.55);
    window.setTimeout(() => {
      for (const id of targets) {
        spawnBoltFlight(root, attackerId, id, opts.element, flyMs);
      }
    }, launchAt);
    const impactAt = launchAt + flyMs;
    window.setTimeout(() => {
      spawnAoeField(root, targets, opts.element, impactMs, opts.ult);
      targets.forEach((id, i) => strikeTarget(id, i * 90, impactMs));
      opts.onImpact?.();
    }, impactAt);
    await waitFx(impactAt + impactMs + Math.max(0, (targets.length - 1) * 90));
    return;
  }

  const chargeMs = fxDurationMs(440, opts.speed);
  const flyMs = fxDurationMs(420, opts.speed);
  const impactMs = fxDurationMs(620, opts.speed);
  pulse(attackerId, "fx-cast-skill", chargeMs);
  spawnSkillFx(root, attackerId, "cast", chargeMs, {
    element: opts.element,
    role: "cast",
  });
  opts.playCasterClip?.(attackerId, "cast");
  const ids = targets.length ? targets : [attackerId];
  const remote = ids.filter((id) => id !== attackerId);
  const launchAt = Math.floor(chargeMs * 0.52);
  const boltKind = supportBoltKind(opts.kind);
  window.setTimeout(() => {
    for (const id of remote) {
      spawnBoltFlight(root, attackerId, id, boltKind, flyMs);
    }
  }, launchAt);
  const impactAt = remote.length ? launchAt + flyMs : Math.floor(chargeMs * 0.55);
  window.setTimeout(() => {
    ids.forEach((id, i) => strikeTarget(id, i * 80, impactMs));
    opts.onImpact?.();
  }, impactAt);
  await waitFx(impactAt + impactMs + Math.max(0, (ids.length - 1) * 80));
}
