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
  boltWater: "/art/battle/fx/fx-bolt-water.webp",
  boltDark: "/art/battle/fx/fx-bolt-dark.webp",
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

function boltArt(element: CombatElement): string {
  if (element === "water") return ART.boltWater;
  if (element === "dark") return ART.boltDark;
  if (element === "fire") return ART.slashFire;
  if (element === "wind") return ART.slashWind;
  return ART.bolt;
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
    layers.push({ src: ART.slash1, cls: "skfx-img skfx-img--flash" });
    layers.push({ src: slash, cls: "skfx-img skfx-img--slash" });
    if (preset === "wind-cut") {
      layers.push({ src: ART.slashWind, cls: "skfx-img skfx-img--slash skfx-img--slash-b" });
    }
    layers.push({ src: ART.slash3, cls: "skfx-img skfx-img--trail" });
    if (opts?.role !== "cast") {
      layers.push({ src: hit, cls: "skfx-img skfx-img--burst" });
      layers.push({ src: ART.debris, cls: "skfx-img skfx-img--debris" });
    }
  } else if (preset === "light-beam") {
    layers.push({ src: ART.flash, cls: "skfx-img skfx-img--flash" });
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
    layers.push({ src: ART.heal, cls: "skfx-img skfx-img--rise" });
    layers.push({ src: ART.flash, cls: "skfx-img skfx-img--flash skfx-img--soft" });
  } else if (preset === "shield") {
    layers.push({ src: ART.shield, cls: "skfx-img skfx-img--ward" });
  } else if (preset === "buff") {
    layers.push({ src: ART.buff, cls: "skfx-img skfx-img--rise" });
  } else if (preset === "hex") {
    layers.push({ src: ART.hex, cls: "skfx-img skfx-img--hex" });
    layers.push({ src: ART.hitDark, cls: "skfx-img skfx-img--burst" });
  } else if (preset === "cast") {
    layers.push({ src: ART.cast, cls: "skfx-img skfx-img--cast" });
  } else {
    impactSeq();
  }

  if (opts?.crit) {
    layers.push({ src: ART.hitCrit, cls: "skfx-img skfx-img--crit" });
  }
  if (opts?.ult) {
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
  if (opts?.crit) wrap.classList.add("is-crit");
  if (opts?.ult) wrap.classList.add("is-ult");
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.setProperty("--skfx-ms", `${Math.max(80, ms)}ms`);
  for (const layer of presetLayers(preset, element, opts)) {
    appendFxImg(wrap, layer);
  }
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
  preloadBattleFx();
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
  const img = document.createElement("img");
  img.className = "skill-bolt-art";
  img.src = boltArt(element);
  img.alt = "";
  img.draggable = false;
  img.decoding = "async";
  img.setAttribute("aria-hidden", "true");
  bolt.appendChild(img);
  layer.appendChild(bolt);
  window.setTimeout(() => bolt.remove(), Math.max(80, ms + 40));
}

export type ArenaStoneVfxPower = "place" | "capture" | "capture-large";

function queryArenaStone(
  root: ParentNode,
  team: "ally" | "enemy",
): HTMLElement | null {
  return root.querySelector<HTMLElement>(
    `.arena-stone[data-arena-stone="${team}"]`,
  );
}

function arenaStoneElement(stone: HTMLElement): CombatElement {
  if (stone.classList.contains("el-fire")) return "fire";
  if (stone.classList.contains("el-water")) return "water";
  if (stone.classList.contains("el-wind")) return "wind";
  if (stone.classList.contains("el-light")) return "light";
  return "dark";
}

function arenaStoneAnchor(
  root: ParentNode,
  team: "ally" | "enemy",
): { x: number; y: number } | null {
  const stone = queryArenaStone(root, team);
  const art =
    stone?.querySelector<HTMLElement>(".magic-stone-img") ?? stone;
  if (!art) return null;
  const r = art.getBoundingClientRect();
  if (r.width < 1 && r.height < 1) return null;
  return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.38 };
}

function stonePlaceLayers(
  element: CombatElement,
  power: ArenaStoneVfxPower,
): SkfxLayer[] {
  const hit = hitArt(element);
  if (power === "place") {
    return [
      { src: ART.cast, cls: "skfx-img skfx-img--cast" },
      { src: ART.flash, cls: "skfx-img skfx-img--flash" },
      { src: ART.buff, cls: "skfx-img skfx-img--rise" },
      { src: hit, cls: "skfx-img skfx-img--burst skfx-img--soft" },
    ];
  }
  const layers: SkfxLayer[] = [
    { src: ART.shock, cls: "skfx-img skfx-img--shock" },
    { src: ART.flash, cls: "skfx-img skfx-img--flash" },
    { src: hit, cls: "skfx-img skfx-img--burst" },
    { src: ART.debris, cls: "skfx-img skfx-img--debris" },
    { src: ART.buff, cls: "skfx-img skfx-img--rise" },
  ];
  if (power === "capture-large") {
    layers.push({ src: ART.hitCrit, cls: "skfx-img skfx-img--crit" });
    layers.push({ src: ART.strikeUlt, cls: "skfx-img skfx-img--ult" });
  }
  return layers;
}

function stoneRivalHitLayers(
  element: CombatElement,
  large: boolean,
): SkfxLayer[] {
  const layers: SkfxLayer[] = [
    { src: ART.hex, cls: "skfx-img skfx-img--hex" },
    { src: hitArt(element), cls: "skfx-img skfx-img--burst" },
  ];
  if (large) {
    layers.push({ src: ART.debris, cls: "skfx-img skfx-img--debris" });
    layers.push({ src: ART.hitCrit, cls: "skfx-img skfx-img--crit" });
  }
  return layers;
}

function spawnStoneToStoneBolt(
  root: ParentNode,
  fromTeam: "ally" | "enemy",
  toTeam: "ally" | "enemy",
  element: CombatElement,
  ms: number,
): void {
  const layer = skillFxLayer(root);
  if (!layer) return;
  const from = arenaStoneAnchor(root, fromTeam);
  const to = arenaStoneAnchor(root, toTeam);
  if (!from || !to) return;
  const layerRect = layer.getBoundingClientRect();
  const x0 = from.x - layerRect.left;
  const y0 = from.y - layerRect.top;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
  const bolt = document.createElement("span");
  bolt.className = `skill-bolt skill-bolt--${element} skill-bolt--stone`;
  bolt.setAttribute("aria-hidden", "true");
  bolt.style.left = `${Math.round(x0)}px`;
  bolt.style.top = `${Math.round(y0)}px`;
  bolt.style.setProperty("--dx", `${Math.round(dx)}px`);
  bolt.style.setProperty("--dy", `${Math.round(dy)}px`);
  bolt.style.setProperty("--rot", `${rot}deg`);
  bolt.style.setProperty("--bolt-ms", `${Math.max(80, ms)}ms`);
  const img = document.createElement("img");
  img.className = "skill-bolt-art";
  img.src = boltArt(element);
  img.alt = "";
  img.draggable = false;
  img.decoding = "async";
  img.setAttribute("aria-hidden", "true");
  bolt.appendChild(img);
  layer.appendChild(bolt);
  window.setTimeout(() => bolt.remove(), Math.max(80, ms + 40));
}

/** Painted skill-style burst on a planted arena stone. Capture hits the rival. */
export function spawnArenaStoneVfx(
  root: ParentNode,
  team: "ally" | "enemy",
  power: ArenaStoneVfxPower,
  ms: number,
): void {
  if (reduceMotion) return;
  preloadBattleFx();
  const stone = queryArenaStone(root, team);
  if (!stone) return;
  const element = arenaStoneElement(stone);
  const wrap = document.createElement("span");
  wrap.className = `arena-stone-fx arena-stone-fx--${power} arena-stone-fx--${element}`;
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.setProperty("--skfx-ms", `${Math.max(80, ms)}ms`);
  for (const layer of stonePlaceLayers(element, power)) {
    appendFxImg(wrap, layer);
  }
  stone.appendChild(wrap);
  window.setTimeout(() => wrap.remove(), Math.max(80, ms));

  if (power === "place") return;

  const rivalTeam = team === "ally" ? "enemy" : "ally";
  const rival = queryArenaStone(root, rivalTeam);
  if (rival) {
    const hit = document.createElement("span");
    hit.className = `arena-stone-fx arena-stone-fx--struck arena-stone-fx--${element}`;
    hit.setAttribute("aria-hidden", "true");
    hit.style.setProperty("--skfx-ms", `${Math.max(80, ms)}ms`);
    for (const layer of stoneRivalHitLayers(element, power === "capture-large")) {
      appendFxImg(hit, layer);
    }
    rival.appendChild(hit);
    window.setTimeout(() => hit.remove(), Math.max(80, ms));
  }
  spawnStoneToStoneBolt(
    root,
    team,
    rivalTeam,
    element,
    Math.min(Math.max(80, ms), 460),
  );
}

function spawnAoeField(
  root: ParentNode,
  targetIds: string[],
  element: CombatElement,
  ms: number,
  ult?: boolean,
): void {
  if (reduceMotion || targetIds.length < 2) return;
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
  preloadBattleFx();
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
      role: "cast",
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
      role: "cast",
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
    spawnSkillFx(root, attackerId, "cast", chargeMs, {
      element: opts.element,
      role: "cast",
    });
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
      role: "cast",
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
  spawnSkillFx(root, attackerId, "cast", chargeMs, {
    element: opts.element,
    role: "cast",
  });
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
