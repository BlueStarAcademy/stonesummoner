/** Battle presentation FX — CSS choreography with Spine mount hooks. */

export type BattleFxKind = "cast_place" | "stone_drop" | "capture" | "lunge" | "ult" | "hit";

const reduceMotion =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export function fxDurationMs(baseMs: number, speed: number): number {
  if (reduceMotion) return 40;
  return Math.max(40, Math.round(baseMs / Math.max(0.5, speed)));
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
  el.classList.add(className);
  window.setTimeout(() => el.classList.remove(className), ms);
}

/** Board cell flash after place / capture. */
export function pulseBoardCell(
  root: ParentNode,
  x: number,
  y: number,
  className: string,
  ms: number,
): void {
  const el = root.querySelector<HTMLElement>(
    `.board .cell[data-x="${x}"][data-y="${y}"]`,
  );
  if (!el) return;
  el.classList.add(className);
  window.setTimeout(() => el.classList.remove(className), ms);
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
