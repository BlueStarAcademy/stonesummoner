/** Battle presentation FX — CSS choreography with Spine mount hooks. */

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
 * Labeled x1 / x2 / x3 multipliers. x1 is intentionally slower than raw
 * wall-clock so combat is readable by default.
 */
export const BATTLE_SPEED_UNIT = 0.5;

/** Effective pace used by waits / FX (higher = faster). */
export function battlePace(speed: number): number {
  return Math.max(0.35, speed * BATTLE_SPEED_UNIT);
}

export function fxDurationMs(baseMs: number, speed: number): number {
  if (reduceMotion) return 40;
  return Math.max(40, Math.round(baseMs / battlePace(speed)));
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
  el.classList.add(className);
  if (art) art.style.animationDuration = `${Math.max(40, ms)}ms`;
  window.setTimeout(() => {
    el.classList.remove(className);
    if (art) art.style.animationDuration = "";
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
      `.board-frame .board .cell[data-x="${x}"][data-y="${y}"]`,
    );
  if (!el) return;
  // classList rejects space-separated tokens — split multi-class strings.
  const tokens = className.split(/\s+/).filter(Boolean);
  if (!tokens.length) return;
  el.classList.add(...tokens);
  window.setTimeout(() => el.classList.remove(...tokens), ms);
}

export type ArenaStoneFxKind = "place" | "capture" | "capture-large" | "shape";

/** Flare a persistent map stone; place/capture also fire a beam at the rival. */
export function pulseArenaStone(
  root: ParentNode,
  team: "ally" | "enemy",
  kind: ArenaStoneFxKind,
  ms: number,
): void {
  const stone = root.querySelector<HTMLElement>(
    `.arena-stone[data-arena-stone="${team}"]`,
  );
  if (!stone) return;
  const frame = stone.closest(".board-frame");
  const tokens = ["is-flare"];
  if (kind === "capture" || kind === "capture-large") tokens.push("is-capture");
  if (kind === "capture-large") tokens.push("is-capture-large");
  if (kind === "shape") tokens.push("is-shape");
  stone.classList.add(...tokens);
  const img = stone.querySelector<HTMLElement>(".magic-stone-img");
  if (img) img.style.animationDuration = `${Math.max(40, ms)}ms`;
  const beam =
    kind === "shape"
      ? null
      : team === "ally"
        ? "is-beam-from-ally"
        : "is-beam-from-enemy";
  const beamPower =
    kind === "capture-large"
      ? "is-beam-capture-large"
      : kind === "capture"
        ? "is-beam-capture"
        : null;
  if (beam) frame?.classList.add(beam);
  if (beamPower) frame?.classList.add(beamPower);
  const rivalTeam = team === "ally" ? "enemy" : "ally";
  const rival =
    kind === "capture" || kind === "capture-large"
      ? root.querySelector<HTMLElement>(
          `.arena-stone[data-arena-stone="${rivalTeam}"]`,
        )
      : null;
  rival?.classList.add("is-struck");
  window.setTimeout(() => {
    stone.classList.remove(...tokens);
    if (img) img.style.animationDuration = "";
    if (beam) frame?.classList.remove(beam);
    if (beamPower) frame?.classList.remove(beamPower);
    rival?.classList.remove("is-struck");
  }, ms);
}

/** Full-screen ult cut-in veil on the battle stage. */
export function playUltCutin(root: ParentNode, ms: number): void {
  const stage = root.querySelector<HTMLElement>(".battle-screen");
  if (!stage) return;
  stage.classList.add("is-ult-cutin");
  window.setTimeout(() => stage.classList.remove("is-ult-cutin"), ms);
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
