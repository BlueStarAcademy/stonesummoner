/**
 * Skill-matched battle VFX — painted sprite playback (flash → slash/burst → debris).
 * Distinct art per skill kind × element; no CSS circles / squares.
 */

import type { CombatElement, CombatSfxKind } from "../audio";
import { dematteArtImg } from "../ui/dematteArt";
import {
  clientPointInElement,
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
  boltFire: "/art/battle/fx/fx-bolt-fire.webp",
  boltWind: "/art/battle/fx/fx-bolt-wind.webp",
  boltLight: "/art/battle/fx/fx-bolt-light.webp",
  boltWater: "/art/battle/fx/fx-bolt-water.webp",
  boltDark: "/art/battle/fx/fx-bolt-dark.webp",
  orbHeal: "/art/battle/fx/fx-orb-heal.webp",
  orbBuff: "/art/battle/fx/fx-orb-buff.webp",
  orbShield: "/art/battle/fx/fx-orb-shield.webp",
  shock: "/art/battle/fx/fx-shockwave.webp",
} as const;

type SkfxLayer = { src: string; cls: string };

export interface SkillVfxProfile {
  id: string;
  variant: 0 | 1 | 2 | 3;
  artSrc: string | null;
}

const skillVfxProfiles = new Map<string, SkillVfxProfile>();

function skillArtSrc(vfxId: string | undefined): string | null {
  if (!vfxId) return null;
  const parts = vfxId.split(":");
  if (parts[0] === "monster" && parts.length === 4) {
    return `/art/monster/skill/${parts[1]}-${parts[2]}-${parts[3]}.webp`;
  }
  if (parts[0] === "summoner" && parts[1] && !parts[1].startsWith("legacy-")) {
    return `/art/summoner/skill/${parts[1]}.webp`;
  }
  return null;
}

function profileVariant(id: string): 0 | 1 | 2 | 3 {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash) % 4 as 0 | 1 | 2 | 3;
}

export function resolveSkillVfxProfile(
  vfxId: string | undefined,
): SkillVfxProfile {
  const id = vfxId ?? "fallback";
  const cached = skillVfxProfiles.get(id);
  if (cached) return cached;
  const profile = {
    id,
    variant: profileVariant(id),
    artSrc: skillArtSrc(vfxId),
  } satisfies SkillVfxProfile;
  skillVfxProfiles.set(id, profile);
  return profile;
}

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
  if (kind === "fire") return ART.boltFire;
  if (kind === "wind") return ART.boltWind;
  if (kind === "light") return ART.boltLight;
  if (kind === "water") return ART.boltWater;
  if (kind === "dark") return ART.boltDark;
  return ART.bolt;
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

function boltPath(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  arc: number,
): string {
  const qx = Math.round(x0 + (x1 - x0) * 0.5);
  const qy = Math.round(y0 + (y1 - y0) * 0.5 - arc);
  return `M ${Math.round(x0)} ${Math.round(y0)} Q ${qx} ${qy} ${Math.round(x1)} ${Math.round(y1)}`;
}

function motionPathSupported(): boolean {
  return typeof CSS !== "undefined" && CSS.supports("offset-distance", "0%");
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

function isSupportImpactKind(kind: CombatSfxKind): boolean {
  return (
    kind === "heal" ||
    kind === "shield" ||
    kind === "buff" ||
    kind === "amplify"
  );
}

function isSupportPreset(preset: SkillVfxPreset): boolean {
  return preset === "heal" || preset === "shield" || preset === "buff";
}

function supportPulseClass(kind: CombatSfxKind): string {
  if (kind === "heal") return "fx-support-heal";
  if (kind === "shield") return "fx-support-ward";
  return "fx-support-buff";
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
  opts?: {
    crit?: boolean;
    ult?: boolean;
    role?: "cast" | "hit";
    vfxId?: string;
  },
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
    layers.push({ src: ART.shock, cls: "skfx-img skfx-img--aura-glow skfx-img--aura-glow-heal" });
    layers.push({ src: ART.heal, cls: "skfx-img skfx-img--aura-ring skfx-img--aura-ring-heal" });
  } else if (preset === "shield") {
    layers.push({ src: ART.shield, cls: "skfx-img skfx-img--ward" });
    layers.push({ src: ART.shock, cls: "skfx-img skfx-img--aura-glow skfx-img--aura-glow-shield" });
    layers.push({ src: ART.shield, cls: "skfx-img skfx-img--aura-ring skfx-img--aura-ring-shield" });
  } else if (preset === "buff") {
    layers.push({ src: ART.buff, cls: "skfx-img skfx-img--empower" });
    layers.push({ src: ART.buff, cls: "skfx-img skfx-img--empower-b" });
    layers.push({ src: ART.shock, cls: "skfx-img skfx-img--aura-glow skfx-img--aura-glow-buff" });
    layers.push({ src: ART.buff, cls: "skfx-img skfx-img--aura-ring skfx-img--aura-ring-buff" });
  } else if (preset === "hex") {
    layers.push({ src: ART.hex, cls: "skfx-img skfx-img--hex" });
  } else if (preset === "cast") {
    layers.push({ src: ART.cast, cls: "skfx-img skfx-img--cast" });
    layers.push({ src: ART.cast, cls: "skfx-img skfx-img--cast skfx-img--cast-b" });
  } else if (opts?.role === "cast") {
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

function scheduleFxDematte(img: HTMLImageElement): void {
  const run = () => {
    if (!img.src.includes("/art/battle/fx/")) return;
    dematteArtImg(img);
  };
  if (img.complete) run();
  else img.addEventListener("load", run, { once: true });
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
  scheduleFxDematte(img);
}

function supportAuraArt(preset: SkillVfxPreset): { glow: string; ring: string } {
  if (preset === "heal") return { glow: ART.shock, ring: ART.heal };
  if (preset === "shield") return { glow: ART.shock, ring: ART.shield };
  return { glow: ART.shock, ring: ART.buff };
}

function spawnSupportAuraRings(wrap: HTMLElement, preset: SkillVfxPreset): void {
  const art = supportAuraArt(preset);
  appendFxImg(wrap, {
    src: art.glow,
    cls: `skfx-img skfx-img--aura-glow skfx-img--aura-glow-${preset}`,
  });
  appendFxImg(wrap, {
    src: art.ring,
    cls: `skfx-img skfx-img--aura-ring skfx-img--aura-ring-${preset}`,
  });
}

function spawnSupportCasterCore(
  wrap: HTMLElement,
  preset: SkillVfxPreset,
  element: CombatElement,
): void {
  if (preset === "cast") {
    appendFxImg(wrap, { src: ART.cast, cls: "skfx-img skfx-img--cast" });
    appendFxImg(wrap, {
      src: slashArt(element),
      cls: "skfx-img skfx-img--rise skfx-img--soft",
    });
    return;
  }
  const orbSrc =
    preset === "heal" ? ART.orbHeal : preset === "shield" ? ART.orbShield : ART.orbBuff;
  appendFxImg(wrap, { src: ART.cast, cls: "skfx-img skfx-img--cast" });
  appendFxImg(wrap, { src: orbSrc, cls: "skfx-img skfx-img--rise" });
}

/** Offensive cast channel on the caster — distinct from hit burst / flinch. */
function spawnOffensiveCasterFx(
  root: ParentNode,
  unitId: string,
  element: CombatElement,
  ms: number,
): void {
  if (reduceMotion) return;
  const el = queryUnit(root, unitId);
  if (!el) return;
  const wrap = document.createElement("span");
  wrap.className = `skill-caster-fx skill-caster-fx--cast skill-caster-fx--${element}`;
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.setProperty("--skfx-ms", `${Math.max(80, ms)}ms`);
  spawnSupportCasterCore(wrap, "cast", element);
  el.appendChild(wrap);
  window.setTimeout(() => wrap.remove(), Math.max(80, Math.round(ms * 1.35)));
}

function spawnCasterBodyFx(
  root: ParentNode,
  unitId: string,
  element: CombatElement,
  ms: number,
  opts?: { vfxId?: string; pulseMs?: number },
): void {
  const pulseMs = opts?.pulseMs ?? ms;
  pulseUnitClass(root, unitId, "fx-cast-skill", pulseMs);
  spawnCastGatherVfx(root, unitId, element, ms);
  spawnOffensiveCasterFx(root, unitId, element, ms);
  spawnSkillFx(root, unitId, "cast", ms, {
    element,
    role: "cast",
    vfxId: opts?.vfxId,
  });
}

export function spawnSupportCasterFx(
  root: ParentNode,
  unitId: string,
  preset: SkillVfxPreset,
  ms: number,
  opts?: {
    element?: CombatElement;
  },
): void {
  if (reduceMotion) return;
  if (!isSupportPreset(preset)) return;
  const el = queryUnit(root, unitId);
  if (!el) return;
  const element = opts?.element ?? "light";
  const wrap = document.createElement("span");
  wrap.className = `skill-caster-fx skill-caster-fx--${preset} skill-caster-fx--${element}`;
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.setProperty("--skfx-ms", `${Math.max(80, ms)}ms`);
  spawnSupportCasterCore(wrap, preset, element);
  el.appendChild(wrap);
  window.setTimeout(() => wrap.remove(), Math.max(80, Math.round(ms * 1.35)));
}

function spawnFxMotes(
  _wrap: HTMLElement,
  _kind: "heal" | "buff" | "shield",
  _ms: number,
  _circular = false,
): void {
  /* Painted aura layers replace CSS dot motes. */
}

export function spawnSupportAuraFx(
  root: ParentNode,
  unitId: string,
  preset: SkillVfxPreset,
  ms: number,
  opts?: {
    element?: CombatElement;
    vfxId?: string;
    role?: "recipient";
  },
): void {
  if (reduceMotion) return;
  if (!isSupportPreset(preset)) return;
  preloadBattleFx();
  const el = queryUnit(root, unitId);
  if (!el) return;
  const element = opts?.element ?? "light";
  const wrap = document.createElement("span");
  wrap.className = `skill-support-aura skill-support-aura--${preset} skill-support-aura--${element} is-recipient`;
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.setProperty("--skfx-ms", `${Math.max(80, ms)}ms`);
  spawnSupportAuraRings(wrap, preset);
  if (preset === "heal" || preset === "buff") {
    spawnFxMotes(wrap, preset, ms, true);
  } else if (preset === "shield") {
    spawnFxMotes(wrap, "shield", ms, true);
  }
  el.appendChild(wrap);
  window.setTimeout(() => wrap.remove(), Math.max(80, Math.round(ms * 1.5)));
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
    vfxId?: string;
  },
): void {
  if (reduceMotion) return;
  preloadBattleFx();
  const el = queryUnit(root, unitId);
  if (!el) return;
  const element = opts?.element ?? "light";
  const wrap = document.createElement("span");
  wrap.className = `skill-fx skill-fx--${preset} skill-fx--${element}`;
  if (opts?.vfxId) wrap.dataset.vfxId = opts.vfxId;
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

function spawnCasterChannelRelease(
  root: ParentNode,
  unitId: string,
  element: CombatElement,
  ms: number,
): void {
  if (reduceMotion) return;
  const unit = queryUnit(root, unitId);
  if (!unit) return;
  const release = document.createElement("span");
  release.className = `skill-caster-release skill-caster-release--${element}`;
  release.setAttribute("aria-hidden", "true");
  release.style.setProperty("--release-ms", `${Math.max(80, ms)}ms`);
  appendFxImg(release, { src: ART.flash, cls: "skfx-img skfx-img--flash" });
  appendFxImg(release, {
    src: hitArt(element),
    cls: "skfx-img skfx-img--burst skfx-img--soft",
  });
  unit.appendChild(release);
  window.setTimeout(() => release.remove(), Math.max(80, ms + 40));
}

function casterReleasePulse(
  root: ParentNode,
  attackerId: string,
  element: CombatElement,
  ms: number,
): void {
  pulseUnitClass(root, attackerId, "fx-cast-release", ms);
  spawnCasterChannelRelease(root, attackerId, element, ms);
}

function spawnCastGatherVfx(
  root: ParentNode,
  unitId: string,
  element: CombatElement,
  ms: number,
): void {
  if (reduceMotion) return;
  const unit = queryUnit(root, unitId);
  if (!unit) return;
  const aura = document.createElement("span");
  aura.className = `skill-cast-gather skill-cast-gather--${element}`;
  aura.setAttribute("aria-hidden", "true");
  aura.style.setProperty("--skfx-ms", `${Math.max(120, ms)}ms`);
  appendFxImg(aura, { src: ART.cast, cls: "skfx-img skfx-img--cast" });
  appendFxImg(aura, {
    src: ART.shock,
    cls: "skfx-img skfx-img--aura-glow skfx-img--soft",
  });
  unit.appendChild(aura);
  window.setTimeout(() => aura.remove(), Math.max(120, ms + 60));
}

function spawnTravelBeam(
  root: ParentNode,
  fromId: string,
  toId: string,
  element: CombatElement,
  ms: number,
  orbBolt?: boolean,
): void {
  if (reduceMotion) return;
  if (fromId === toId) return;
  const layer = skillFxLayer(root);
  if (!layer) return;
  const from = unitAnchor(root, fromId);
  const to = unitAnchor(root, toId);
  if (!from || !to) return;
  const p0 = clientPointInElement(layer, from.x, from.y);
  const p1 = clientPointInElement(layer, to.x, to.y);
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 12) return;
  const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
  const beam = document.createElement("span");
  beam.className = `skill-travel-beam skill-travel-beam--${element}${orbBolt ? " is-orb" : ""}`;
  beam.setAttribute("aria-hidden", "true");
  beam.style.left = `${Math.round(p0.x)}px`;
  beam.style.top = `${Math.round(p0.y)}px`;
  beam.style.width = `${Math.round(dist)}px`;
  beam.style.setProperty("--beam-rot", `${rot}deg`);
  beam.style.setProperty("--beam-ms", `${Math.max(80, ms)}ms`);
  layer.appendChild(beam);
  window.setTimeout(() => beam.remove(), Math.max(80, ms + 80));
}

function spawnMeleeDashVfx(
  root: ParentNode,
  fromId: string,
  toId: string,
  element: CombatElement,
  ms: number,
): void {
  if (reduceMotion) return;
  if (fromId === toId) return;
  const unit = queryUnit(root, fromId);
  if (!unit) return;
  const streak = document.createElement("span");
  streak.className = `skill-melee-trail skill-melee-trail--${element}`;
  streak.setAttribute("aria-hidden", "true");
  streak.style.setProperty("--dash-ms", `${Math.max(120, ms)}ms`);
  appendFxImg(streak, { src: slashArt(element), cls: "skfx-img skfx-img--slash" });
  appendFxImg(streak, { src: ART.slash3, cls: "skfx-img skfx-img--trail" });
  unit.appendChild(streak);
  window.setTimeout(() => streak.remove(), Math.max(120, ms + 60));
}

function spawnTrapRingVfx(
  root: ParentNode,
  targetId: string,
  element: CombatElement,
  ms: number,
): void {
  if (reduceMotion) return;
  const layer = skillFxLayer(root);
  if (!layer) return;
  const anchor = unitAnchor(root, targetId);
  if (!anchor) return;
  const p = clientPointInElement(layer, anchor.x, anchor.y);
  const ring = document.createElement("span");
  ring.className = `skill-trap-hex skill-trap-hex--${element}`;
  ring.setAttribute("aria-hidden", "true");
  ring.style.left = `${Math.round(p.x)}px`;
  ring.style.top = `${Math.round(p.y)}px`;
  ring.style.setProperty("--trap-ms", `${Math.max(120, ms)}ms`);
  appendFxImg(ring, { src: ART.hex, cls: "skfx-img skfx-img--hex" });
  appendFxImg(ring, {
    src: ART.shock,
    cls: "skfx-img skfx-img--aura-ring skfx-img--soft",
  });
  layer.appendChild(ring);
  window.setTimeout(
    () => ring.remove(),
    Math.max(120, Math.round(ms * 1.35)),
  );
}

export function spawnTravelBolt(
  root: ParentNode,
  fromId: string,
  toId: string,
  kind: SkillBoltKind,
  ms: number,
  opts?: { ghost?: boolean; delayMs?: number; orb?: boolean },
): void {
  if (reduceMotion) return;
  if (fromId === toId) return;
  preloadBattleFx();
  const layer = skillFxLayer(root);
  if (!layer) return;
  const from = unitAnchor(root, fromId);
  const to = unitAnchor(root, toId);
  if (!from || !to) return;
  const p0 = clientPointInElement(layer, from.x, from.y);
  const p1 = clientPointInElement(layer, to.x, to.y);
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  if (Math.hypot(dx, dy) < 10) return;
  const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
  const orb = opts?.orb || isOrbBolt(kind);
  const arc = boltArc(dx, dy, kind);
  const delayMs = Math.max(0, opts?.delayMs ?? 0);
  const bolt = document.createElement("span");
  bolt.className = `skill-bolt skill-bolt--${kind}${orb ? " is-orb" : " is-arc"}${opts?.ghost ? " is-ghost" : ""}`;
  bolt.setAttribute("aria-hidden", "true");
  bolt.style.setProperty("--dx", `${Math.round(dx)}px`);
  bolt.style.setProperty("--dy", `${Math.round(dy)}px`);
  bolt.style.setProperty("--rot", `${rot}deg`);
  bolt.style.setProperty("--bolt-ms", `${Math.max(80, ms)}ms`);
  if (delayMs) bolt.style.animationDelay = `${delayMs}ms`;
  if (motionPathSupported()) {
    bolt.style.left = "0px";
    bolt.style.top = "0px";
    bolt.style.setProperty("offset-position", "0 0");
    bolt.style.offsetPath = `path("${boltPath(p0.x, p0.y, p1.x, p1.y, arc)}")`;
  } else {
    bolt.style.left = `${Math.round(p0.x)}px`;
    bolt.style.top = `${Math.round(p0.y)}px`;
  }
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
  scheduleFxDematte(img);
  layer.appendChild(bolt);
  window.setTimeout(() => bolt.remove(), Math.max(80, ms + delayMs + 80));
}

function spawnBoltFlight(
  root: ParentNode,
  fromId: string,
  toId: string,
  kind: SkillBoltKind,
  ms: number,
  orbBolt?: boolean,
  _element?: CombatElement,
): void {
  spawnTravelBolt(root, fromId, toId, kind, ms, { orb: orbBolt });
  const volley = orbBolt ? 1 : boltVolley(kind);
  if (volley < 2) return;
  spawnTravelBolt(root, fromId, toId, kind, Math.round(ms * 0.9), {
    ghost: true,
    delayMs: Math.round(ms * 0.12),
    orb: orbBolt,
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
  appendFxImg(rite, { src: ART.shock, cls: "skfx-img skfx-img--shock" });
  appendFxImg(rite, { src: ART.cast, cls: "skfx-img skfx-img--cast skfx-img--soft" });
  if (power === "capture" || power === "capture-large" || power === "shape") {
    appendFxImg(rite, {
      src: ART.debris,
      cls: "skfx-img skfx-img--debris skfx-img--soft",
    });
  }
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
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const id of targetIds) {
    const a = unitAnchor(root, id);
    if (!a) continue;
    const p = clientPointInElement(layer, a.x, a.y);
    sx += p.x;
    sy += p.y;
    n += 1;
  }
  if (!n) return;
  const field = document.createElement("span");
  field.className = `skill-field skill-field--${element}${ult ? " is-ult" : ""}`;
  field.setAttribute("aria-hidden", "true");
  field.style.left = `${Math.round(sx / n)}px`;
  field.style.top = `${Math.round(sy / n)}px`;
  field.style.setProperty("--field-ms", `${Math.max(80, ms)}ms`);
  const img = document.createElement("img");
  img.className = "skill-field-art";
  img.src = ART.shock;
  img.alt = "";
  img.draggable = false;
  img.decoding = "async";
  img.setAttribute("aria-hidden", "true");
  field.appendChild(img);
  scheduleFxDematte(img);
  const burst = document.createElement("img");
  burst.className = "skill-field-burst";
  burst.src = hitArt(element);
  burst.alt = "";
  burst.draggable = false;
  burst.decoding = "async";
  burst.setAttribute("aria-hidden", "true");
  field.appendChild(burst);
  scheduleFxDematte(burst);
  layer.appendChild(field);
  window.setTimeout(() => field.remove(), Math.max(80, Math.round(ms * 1.25)));
}

export type SkillVfxPlayOpts = {
  kind: CombatSfxKind;
  element: CombatElement;
  speed: number;
  ult?: boolean;
  crit?: boolean;
  vfxFamily?: SkillVfxFamily;
  orbBolt?: boolean;
  vfxId?: string;
  onImpact?: () => void;
  playCasterClip?: (
    unitId: string,
    clip: "run" | "attack" | "cast" | "ult",
    opts?: { loop?: boolean },
  ) => void;
};

async function playSupportSkillVfx(
  root: ParentNode,
  attackerId: string,
  targets: string[],
  opts: SkillVfxPlayOpts,
  impact: SkillVfxPreset,
): Promise<void> {
  const chargeMs = fxDurationMs(440, opts.speed);
  const flyMs = fxDurationMs(420, opts.speed);
  const impactMs = fxDurationMs(620, opts.speed);
  const pulseClass = supportPulseClass(opts.kind);
  const glowMs = fxDurationMs(360, opts.speed);
  const casterReleaseMs = fxDurationMs(320, opts.speed);

  const pulse = (id: string, cls: string, ms: number) =>
    pulseUnitClass(root, id, cls, ms);

  const supportRecipient = (id: string, delay: number, auraMs: number) => {
    window.setTimeout(() => {
      pulse(id, pulseClass, glowMs);
      spawnSupportAuraFx(root, id, impact, auraMs, {
        element: opts.element,
        role: "recipient",
      });
      if (opts.orbBolt && id !== attackerId) {
        spawnTrapRingVfx(root, id, opts.element, auraMs);
      }
    }, delay);
  };

  const supportCasterRelease = (delay: number, ms: number) => {
    window.setTimeout(() => {
      pulse(attackerId, "fx-support-cast", ms);
      spawnSupportCasterFx(root, attackerId, impact, ms, {
        element: opts.element,
      });
    }, delay);
  };

  pulse(attackerId, "fx-cast-skill", chargeMs);
  spawnCastGatherVfx(root, attackerId, opts.element, chargeMs);
  spawnSupportCasterFx(root, attackerId, impact, chargeMs, {
    element: opts.element,
  });
  opts.playCasterClip?.(attackerId, "cast");
  const ids = targets.length ? targets : [attackerId];
  const recipients = ids.filter((id) => id !== attackerId);
  const selfTargeted = ids.includes(attackerId);
  const launchAt = Math.floor(chargeMs * 0.52);
  const boltKind = supportBoltKind(opts.kind);
  window.setTimeout(() => {
    for (const id of recipients) {
      spawnBoltFlight(root, attackerId, id, boltKind, flyMs, opts.orbBolt, opts.element);
    }
  }, launchAt);
  const impactAt = recipients.length ? launchAt + flyMs : Math.floor(chargeMs * 0.55);
  window.setTimeout(() => {
    recipients.forEach((id, i) => supportRecipient(id, i * 80, impactMs));
    if (selfTargeted) {
      supportCasterRelease(0, casterReleaseMs);
      const selfDelay =
        recipients.length > 0
          ? recipients.length * 80
          : Math.floor(casterReleaseMs * 0.35);
      supportRecipient(attackerId, selfDelay, impactMs);
    } else if (recipients.length > 0) {
      supportCasterRelease(0, casterReleaseMs);
    }
    opts.onImpact?.();
  }, impactAt);
  const tail =
    impactAt +
    impactMs +
    Math.max(0, (recipients.length + (selfTargeted ? 1 : 0) - 1) * 80);
  await waitFx(tail);
}

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
  const family = opts.vfxFamily ?? skillVfxFamily(opts.kind, opts.element, opts.ult);
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
  const strikeTarget = (id: string, delay: number, impactMs: number) => {
    if (id === attackerId) return;
    window.setTimeout(() => {
      pulse(id, hitClass, flinchMs);
      spawnSkillFx(root, id, impact, impactMs, {
        element: opts.element,
        ult: opts.ult,
        crit: opts.crit,
        role: "hit",
        vfxId: opts.vfxId,
      });
      if (opts.orbBolt) {
        spawnTrapRingVfx(root, id, opts.element, impactMs);
      }
    }, delay);
  };

  if (isSupportImpactKind(opts.kind) && !opts.ult) {
    await playSupportSkillVfx(root, attackerId, targets, opts, impact);
    return;
  }

  if (opts.ult) {
    const cutMs = fxDurationMs(720, opts.speed);
    const flyMs = fxDurationMs(380, opts.speed);
    const impactMs = fxDurationMs(720, opts.speed);
    playUltCutin(root, cutMs);
    pulse(attackerId, "fx-ult", cutMs);
    spawnCasterBodyFx(root, attackerId, opts.element, cutMs, {
      vfxId: opts.vfxId,
      pulseMs: cutMs,
    });
    opts.playCasterClip?.(attackerId, "ult");
    const launchAt = Math.floor(cutMs * 0.5);
    window.setTimeout(() => {
      for (const id of targets) {
        spawnBoltFlight(root, attackerId, id, opts.element, flyMs, opts.orbBolt);
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
    pulse(attackerId, "fx-lunge", lungeMs);
    spawnCasterBodyFx(
      root,
      attackerId,
      opts.element,
      Math.floor(lungeMs * 0.7),
      { vfxId: opts.vfxId, pulseMs: lungeMs },
    );
    opts.playCasterClip?.(attackerId, "run", { loop: false });
    const hitAt = Math.floor(lungeMs * 0.42);
    window.setTimeout(() => {
      for (const id of targets) {
        spawnMeleeDashVfx(root, attackerId, id, opts.element, fxDurationMs(320, opts.speed));
      }
      opts.playCasterClip?.(attackerId, "attack");
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
    spawnCasterBodyFx(root, attackerId, opts.element, chargeMs, {
      vfxId: opts.vfxId,
    });
    opts.playCasterClip?.(attackerId, "cast");
    const launchAt = Math.floor(chargeMs * 0.58);
    window.setTimeout(() => {
      casterReleasePulse(
        root,
        attackerId,
        opts.element,
        fxDurationMs(280, opts.speed),
      );
      for (const id of targets) {
        spawnBoltFlight(root, attackerId, id, opts.element, flyMs, opts.orbBolt);
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
    spawnCasterBodyFx(root, attackerId, opts.element, chargeMs, {
      vfxId: opts.vfxId,
    });
    opts.playCasterClip?.(attackerId, "cast");
    const launchAt = Math.floor(chargeMs * 0.55);
    window.setTimeout(() => {
      for (const id of targets) {
        spawnBoltFlight(root, attackerId, id, opts.element, flyMs, opts.orbBolt);
      }
    }, launchAt);
    const impactAt = launchAt + flyMs;
    window.setTimeout(() => {
      casterReleasePulse(
        root,
        attackerId,
        opts.element,
        fxDurationMs(300, opts.speed),
      );
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
  spawnCasterBodyFx(root, attackerId, opts.element, chargeMs, {
    vfxId: opts.vfxId,
  });
  opts.playCasterClip?.(attackerId, "cast");
  const ids = targets.length ? targets : [attackerId];
  const remote = ids.filter((id) => id !== attackerId);
  const launchAt = Math.floor(chargeMs * 0.52);
  const boltKind = supportBoltKind(opts.kind);
  window.setTimeout(() => {
    casterReleasePulse(
      root,
      attackerId,
      opts.element,
      fxDurationMs(280, opts.speed),
    );
    for (const id of remote) {
      spawnBoltFlight(root, attackerId, id, boltKind, flyMs, opts.orbBolt, opts.element);
    }
  }, launchAt);
  const impactAt = remote.length ? launchAt + flyMs : Math.floor(chargeMs * 0.55);
  window.setTimeout(() => {
    ids.forEach((id, i) => strikeTarget(id, i * 80, impactMs));
    opts.onImpact?.();
  }, impactAt);
  await waitFx(impactAt + impactMs + Math.max(0, (ids.length - 1) * 80));
}
