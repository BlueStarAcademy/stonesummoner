/**
 * Uniform UI scale.
 *
 * Width drives the scale so the canvas always spans the screen edge to edge,
 * and the design canvas grows taller to absorb whatever height is left over.
 * Scaling by the smaller of both axes instead would letterbox every phone that
 * is proportionally taller than the design canvas.
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

/** Unitless scale so the design width fits the viewport (never upscales past 1). */
export function computeUiScale(vw = viewportSize().w): number {
  return Math.min(1, Math.max(0.7, vw / DESIGN_W));
}

/**
 * Height of the design canvas in unscaled px. Never shorter than the design
 * height, so short/landscape viewports keep a usable vertical budget.
 */
export function computeDesignHeight(vh = viewportSize().h, scale = computeUiScale()): number {
  return Math.max(DESIGN_H, vh / scale);
}

export function applyUiScale(): number {
  const { w, h } = viewportSize();
  const scale = computeUiScale(w);
  const designH = computeDesignHeight(h, scale);
  const root = document.documentElement;
  root.style.setProperty("--ui-scale", String(scale));
  root.style.setProperty("--design-w", `${DESIGN_W}px`);
  root.style.setProperty("--design-h", `${designH}px`);
  root.style.setProperty("--app-scale-w", `${DESIGN_W * scale}px`);
  root.style.setProperty("--app-scale-h", `${designH * scale}px`);
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
