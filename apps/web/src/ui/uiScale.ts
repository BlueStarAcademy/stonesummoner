/**
 * Uniform UI scale: design canvas (430×780) fits inside the visual viewport.
 * Same proportions on every device; letterboxed when aspect ratios differ.
 */
export const DESIGN_W = 430;
export const DESIGN_H = 780;

function viewportSize(): { w: number; h: number } {
  const vv = window.visualViewport;
  return {
    w: Math.max(1, vv?.width ?? window.innerWidth),
    h: Math.max(1, vv?.height ?? window.innerHeight),
  };
}

/** Unitless scale so the design canvas fits in the viewport (never upscales past 1). */
export function computeUiScale(vw = viewportSize().w, vh = viewportSize().h): number {
  const raw = Math.min(vw / DESIGN_W, vh / DESIGN_H);
  return Math.min(1, Math.max(0.7, raw));
}

export function applyUiScale(): number {
  const { w, h } = viewportSize();
  const scale = computeUiScale(w, h);
  const root = document.documentElement;
  root.style.setProperty("--ui-scale", String(scale));
  root.style.setProperty("--design-w", `${DESIGN_W}px`);
  root.style.setProperty("--design-h", `${DESIGN_H}px`);
  root.style.setProperty("--app-scale-w", `${DESIGN_W * scale}px`);
  root.style.setProperty("--app-scale-h", `${DESIGN_H * scale}px`);
  root.dataset.uiScale = scale.toFixed(4);
  return scale;
}

/** Bind resize / visualViewport listeners once. */
export function initUiScale(): void {
  applyUiScale();
  const onChange = () => applyUiScale();
  window.addEventListener("resize", onChange, { passive: true });
  window.addEventListener("orientationchange", onChange, { passive: true });
  window.visualViewport?.addEventListener("resize", onChange, { passive: true });
  window.visualViewport?.addEventListener("scroll", onChange, { passive: true });
}
