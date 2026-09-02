/** Battle presentation FX — CSS choreography with Spine mount hooks. */

import { playSpineClip } from "./spineRuntime";

export type BattleFxKind =
  | "cast_place"
  | "stone_drop"
  | "capture"
  | "lunge"
  | "ult"
  | "hit";

export type BattleVfxId = "strike" | "strike-ult" | "hit" | "hit-crit";

const reduceMotion =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

const VFX_SRC: Record<BattleVfxId, string> = {
  strike: "/art/battle/fx/fx-strike.webp",
  "strike-ult": "/art/battle/fx/fx-strike-ult.webp",
  hit: "/art/battle/fx/fx-hit.webp",
  "hit-crit": "/art/battle/fx/fx-hit-crit.webp",
};

/**
 * Labeled x1 / x2 / x3 multipliers. x1 matches base FX timing; higher tiers
 * scale proportionally.
 */
export const BATTLE_SPEED_UNIT = 1;

/** Effective pace used by waits / FX (higher = faster). */
export function battlePace(speed: number): number {
  return Math.max(0.35, speed * BATTLE_SPEED_UNIT);
}

export function fxDurationMs(baseMs: number, speed: number): number {
  if (reduceMotion) return 40;
  return Math.max(40, Math.round(baseMs / battlePace(speed)));
}

/**
 * Viewport (getBoundingClientRect) → local px inside `el`.
 * Needed because `#app` is `transform: scale(var(--ui-scale))`.
 */
export function clientPointInElement(
  el: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  const rw = r.width || 1;
  const rh = r.height || 1;
  const lw = el.offsetWidth || rw;
  const lh = el.offsetHeight || rh;
  return {
    x: ((clientX - r.left) / rw) * lw,
    y: ((clientY - r.top) / rh) * lh,
  };
}

export function waitFx(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Add a transient class on a unit art node, then remove. */
export function pulseUnitClass(
  root: ParentNode,
  unitId: string,
  className: string,
  ms: number,
): void {
  const el = root.querySelector<HTMLElement>(
    `.battle-unit[data-unit="${CSS.escape(unitId)}"]`,
  );
  if (!el) return;
  const art = el.querySelector<HTMLElement>(".battle-unit-art");
  if (
    className === "fx-hit" ||
    className === "fx-hit-ice" ||
    className === "fx-hit-dark"
  ) {
    playSpineClip(unitId, "hit", { loop: false });
  }
  el.classList.add(className);
  if (art) art.style.animationDuration = `${Math.max(40, ms)}ms`;
  window.setTimeout(() => {
    el.classList.remove(className);
    if (art) {
      const stillFx = [...el.classList].some((c) => c.startsWith("fx-"));
      if (!stillFx) art.style.animationDuration = "";
    }
  }, ms);
}

/**
 * Spawn a painted VFX sprite over a battle unit (strike on attacker, hit on target).
 * Auto-removes after `ms`.
 */
export function spawnUnitVfx(
  root: ParentNode,
  unitId: string,
  vfx: BattleVfxId,
  ms: number,
): void {
  if (reduceMotion) return;
  const el = root.querySelector<HTMLElement>(
    `.battle-unit[data-unit="${CSS.escape(unitId)}"]`,
  );
  if (!el) return;
  // Attach to unit (not .battle-unit-art) so mask-image does not clip VFX.
  const img = document.createElement("img");
  img.className = `battle-vfx battle-vfx--${vfx}`;
  img.src = VFX_SRC[vfx];
  img.alt = "";
  img.draggable = false;
  img.decoding = "async";
  img.setAttribute("aria-hidden", "true");
  el.appendChild(img);
  window.setTimeout(() => img.remove(), Math.max(80, ms));
}

/** Board cell flash after place / capture (pick overlay grid). */
export function pulseBoardCell(
  root: ParentNode,
  x: number,
  y: number,
  className: string,
  ms: number,
): void {
  const el =
    root.querySelector<HTMLElement>(
      `.stone-pick-board .cell[data-x="${x}"][data-y="${y}"]`,
    ) ??
    root.querySelector<HTMLElement>(
      `.board-mini-grid .cell[data-x="${x}"][data-y="${y}"]`,
    ) ??
    root.querySelector<HTMLElement>(
      `.board-frame .board .cell[data-x="${x}"][data-y="${y}"]`,
    );
  if (!el) return;
  // classList rejects space-separated tokens — split multi-class strings.
  const tokens = className.split(/\s+/).filter(Boolean);
  if (!tokens.length) return;
  el.classList.add(...tokens);
  window.setTimeout(() => el.classList.remove(...tokens), ms);
}

export type CircleAbsorbKind = "safe" | "capture" | "shape";
export type ArenaStoneFxKind = "place" | "capture" | "capture-large" | "shape";

export function absorbKindFromStoneFx(kind: ArenaStoneFxKind): CircleAbsorbKind {
  if (kind === "shape") return "shape";
  if (kind === "capture" || kind === "capture-large") return "capture";
  return "safe";
}

/** Pulse the map ritual circle as mana is drawn into a summoner. */
export function pulseCircleAbsorb(
  root: ParentNode,
  team: "ally" | "enemy",
  kind: CircleAbsorbKind,
  ms: number,
): void {
  const frame = root.querySelector<HTMLElement>(".board-frame");
  if (!frame) return;
  const tokens = ["is-absorb", `is-absorb-${kind}`, `is-absorb-${team}`];
  if (kind === "capture") tokens.push("fx-capture-flash");
  if (kind === "shape") tokens.push("is-absorb-shape");
  frame.classList.add(...tokens);
  frame.style.setProperty("--absorb-ms", `${Math.max(40, ms)}ms`);
  const aura = frame.querySelector<HTMLElement>(".board-circle-aura");
  if (aura) aura.style.animationDuration = `${Math.max(40, ms)}ms`;
  window.setTimeout(() => {
    frame.classList.remove(...tokens);
    frame.style.removeProperty("--absorb-ms");
    if (aura) aura.style.animationDuration = "";
  }, ms);
}

/** Full-screen ult cut-in veil on the battle stage. */
export function playUltCutin(root: ParentNode, ms: number): void {
  const stage = root.querySelector<HTMLElement>(".battle-screen");
  if (!stage) return;
  stage.style.setProperty("--ult-cutin-ms", `${Math.max(80, ms)}ms`);
  stage.classList.add("is-ult-cutin");
  window.setTimeout(() => {
    stage.classList.remove("is-ult-cutin");
    stage.style.removeProperty("--ult-cutin-ms");
  }, ms);
}

/**
 * CSS anim hooks for WebP fallback. Spine mounts (registered packs only,
 * e.g. fire_fang) hide the WebP layer when ready — see spineRuntime.ts.
 */
export function mountUnitAnimHooks(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(".battle-unit[data-unit]").forEach((el) => {
    const art = el.querySelector(".battle-unit-art");
    if (!art || art.querySelector("[data-unit-anim]")) return;
    const side = el.closest(".battle-front.enemy")
      ? "front"
      : el.closest(".battle-front.ally")
        ? "back"
        : "front";
    const hook = document.createElement("span");
    hook.className = `unit-anim-hook facing-${side}`;
    hook.dataset.unitAnim = side;
    hook.setAttribute("aria-hidden", "true");
    art.appendChild(hook);
  });
}
