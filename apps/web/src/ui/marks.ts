/**
 * Decorative UI glyphs for apps/web.
 * Source is ASCII-only (\u escapes) so non-UTF-8 rewrites cannot wipe them to "?".
 * Do not put raw Hangul/CJK literals in this file -- only \uXXXX.
 */
export const MIDDOT = "\u00B7";
export const ARROW_DOWN = "\u2193";
export const ARROW_UP = "\u2191";
export const ARROW_LEFT = "\u2190";
export const ARROW_RIGHT = "\u2192";
export const MINUS = "\u2212";
export const CHECK = "\u2713";
export const STAR = "\u2605";
export const EM_DASH = "\u2014";
export const TIMES = "\u00D7";
export const RANGE = "\u2013"; // en-dash for ranges like 4-6

/**
 * Soft-rounded grade star (SVG). Color via CSS `currentColor` on `.mon-star`.
 * Prefer this over bare \u2605 in inventory / inspect / codex overlays.
 */
const MON_STAR_SVG =
  '<svg class="mon-star-ico" viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" ' +
  'd="M8 1.2l1.9 4.05 4.4.52-3.28 3.02.9 4.3L8 11l-3.92 2.09.9-4.3-3.28-3.02 4.4-.52z"/>' +
  "</svg>";

/** One grade-star chip for inventory / inspect / codex. */
export const MON_STAR_HTML =
  `<span class="mon-star" aria-hidden="true">${MON_STAR_SVG}</span>`;

/** Repeat grade stars (clamped to >= 0). */
export function monStarsHtml(count: number): string {
  const n = Math.max(0, Math.floor(count));
  if (n <= 0) return "";
  return MON_STAR_HTML.repeat(n);
}

/** Codex button seal - book icon (no CJK). */
export const CODEX_SEAL_HTML =
  '<svg class="mon-topbar-codex-ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M5 3.5h10.5A2.5 2.5 0 0 1 18 6v14.5H7.25A1.75 1.75 0 0 0 5.5 22.25V5A1.5 1.5 0 0 1 7 3.5H5zm2.5 1.5V18c.4-.16.84-.25 1.3-.25H16.5V6A1 1 0 0 0 15.5 5H7.5z"/>' +
  '<path fill="currentColor" opacity=".55" d="M7.5 5h8v1.25h-8z"/>' +
  "</svg>";

/** Locked codex cell mark - padlock (no CJK \u7981). */
export const CODEX_LOCK_HTML =
  '<svg class="codex-lock-ico" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M8 1.5A2.75 2.75 0 0 0 5.25 4.25V6H4.5A1.5 1.5 0 0 0 3 7.5v5A1.5 1.5 0 0 0 4.5 14h7A1.5 1.5 0 0 0 13 12.5v-5A1.5 1.5 0 0 0 11.5 6h-.75V4.25A2.75 2.75 0 0 0 8 1.5zm1.25 4.5h-2.5V4.25a1.25 1.25 0 1 1 2.5 0V6z"/>' +
  "</svg>";

/** Icon marks shown in stage cards / board / skills. */
export const Mark = {
  forbid: "\u7981",
  bait: "\u8A98",
  victory: "\u52DD",
  starDot: MIDDOT,
  grind: "\u78E8",
  imprint: "\u5370",
  fusion: "\u878D",
  wish: "\u9858",
  open: "\u958B",
  declare: "\u5BA3",
  dual: "\u96D9",
  clean: "\u6383",
  guard: "\u5B88",
  pond: "\u6C60",
  crystal: "\u6676",
  awaken: "\u89BA",
  energy: "\u80FD",
  summon: "\u53EC",
  checkIn: "\u51FA",
  rename: "\u540D",
  mana: "\u9B54",
  amplify: "\u589E",
  shield: "\u76FE",
  /** Board token abbreviations (syllables via \\u) */
  crit: "\uCE58",
  shieldCore: "\uC2E4",
  magnet: "\uC790",
  stride: "\uD589",
  seal: "\uBD09",
  ward: "\uC18D",
  lure: "\uBBF8",
  transform: "\uBCC0",
  stone: "\uB3CC",
  me: "\uB098",
  banOn: "\u7981",
  banOff: "\u53EF",
  /** Empty party slot label */
  partyEmpty: "\uBE48 \uCE78",
  boardA: "A\uAD6D",
  boardB: "B\uAD6D",
  /** Codex / illustrated catalog seal */
  codex: "\u5716",
} as const;
