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

/**
 * Faceted ice-crystal gem (SVG). Color via CSS `currentColor` on `.sum-awaken-gem`.
 * Used for summoner awaken so it stays distinct from monster grade stars.
 */
const SUM_AWAKEN_GEM_SVG =
  '<svg class="sum-awaken-gem-ico" viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M8 1.05L13.85 4.5v7L8 14.95 2.15 11.5v-7z"/>' +
  '<path fill="none" stroke="#061018" stroke-opacity=".42" stroke-width=".6" d="M8 1.05L13.85 4.5v7L8 14.95 2.15 11.5v-7z"/>' +
  '<path fill="#fff" fill-opacity=".3" d="M8 3.1l3.1 1.75v3.4L8 10 4.9 8.25v-3.4z"/>' +
  '<path fill="none" stroke="#fff" stroke-opacity=".42" stroke-width=".55" d="M8 1.05v13.9M2.15 4.5l11.7 7M13.85 4.5l-11.7 7"/>' +
  '<path fill="#fff" fill-opacity=".78" d="M5.55 3.4l1.12 1.32-1.52-.32z"/>' +
  "</svg>";

/** One awaken gem chip. Pass `empty` for unfilled slots. */
export function sumAwakenGemHtml(empty = false): string {
  return `<span class="sum-awaken-gem${empty ? " is-empty" : ""}" aria-hidden="true">${SUM_AWAKEN_GEM_SVG}</span>`;
}

/** Summoner awaken meter (filled gems + empty slots up to `max`). */
export function sumAwakenGemsHtml(filled: number, max = 5): string {
  const n = Math.max(0, Math.floor(filled));
  const cap = Math.max(n, Math.max(0, Math.floor(max)));
  if (cap <= 0) return "";
  let html = "";
  for (let i = 0; i < cap; i++) html += sumAwakenGemHtml(i >= n);
  return `<span class="sum-awaken-gems">${html}</span>`;
}

/** Codex button seal - ornate tome glyph (no CJK). */
export const CODEX_SEAL_HTML =
  '<svg class="mon-topbar-codex-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
  '<defs>' +
  '<linearGradient id="codexSealGold" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">' +
  '<stop stop-color="#FFF6D0"/><stop offset=".45" stop-color="#E8C84A"/><stop offset="1" stop-color="#9A7018"/>' +
  "</linearGradient>" +
  '<linearGradient id="codexSealPage" x1="8" y1="5" x2="18" y2="20" gradientUnits="userSpaceOnUse">' +
  '<stop stop-color="#F7EFD8"/><stop offset="1" stop-color="#D8C49A"/>' +
  "</linearGradient>" +
  "</defs>" +
  '<path fill="url(#codexSealGold)" d="M5.2 3.4h9.2c1.5 0 2.7 1.2 2.7 2.7v13.2c0 .7-.6 1.3-1.3 1.3H6.8c-1.1 0-2-.9-2-2V5.1c0-.9.8-1.7 1.7-1.7h-.3z"/>' +
  '<path fill="url(#codexSealPage)" d="M7.1 5.1h8.6c.6 0 1.1.5 1.1 1.1v11.8c0 .3-.2.5-.5.5H8.4c-.7 0-1.3-.6-1.3-1.3V5.1z"/>' +
  '<path fill="url(#codexSealGold)" opacity=".9" d="M4.4 4.2c0-.7.6-1.3 1.3-1.3h.8v16.6h-.8c-.7 0-1.3-.6-1.3-1.3V4.2z"/>' +
  '<path fill="#8A2818" opacity=".55" d="M9.2 8.2h5.8v1.1H9.2zm0 2.6h5.8v1.1H9.2zm0 2.6h4.2v1.1H9.2z"/>' +
  '<circle cx="17.6" cy="11.2" r="1.15" fill="#FFF6D0" opacity=".85"/>' +
  '<path fill="none" stroke="#FFF6D0" stroke-width="1.1" stroke-linecap="round" opacity=".7" d="M17.6 9.6v-1.3"/>' +
  "</svg>";

/** Locked codex cell mark - padlock (no CJK \u7981). */
export const CODEX_LOCK_HTML =
  '<svg class="codex-lock-ico" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M8 1.5A2.75 2.75 0 0 0 5.25 4.25V6H4.5A1.5 1.5 0 0 0 3 7.5v5A1.5 1.5 0 0 0 4.5 14h7A1.5 1.5 0 0 0 13 12.5v-5A1.5 1.5 0 0 0 11.5 6h-.75V4.25A2.75 2.75 0 0 0 8 1.5zm1.25 4.5h-2.5V4.25a1.25 1.25 0 1 1 2.5 0V6z"/>' +
  "</svg>";

/** Icon marks shown in stage cards / board / skills. Hangul only (no Hanja). */
export const Mark = {
  forbid: "\uAE08",
  bait: "\uBBF8",
  victory: "\uC2B9",
  starDot: MIDDOT,
  grind: "\uC5F0",
  imprint: "\uAC01",
  fusion: "\uC735",
  wish: "\uC6D0",
  open: "\uAC1C",
  declare: "\uC120",
  dual: "\uC30D",
  clean: "\uCCAD",
  guard: "\uC218",
  pond: "\uBABB",
  crystal: "\uC815",
  awaken: "\uAC01",
  energy: "\uAE30",
  summon: "\uC18C",
  checkIn: "\uCD9C",
  rename: "\uBA85",
  mana: "\uB9C8",
  amplify: "\uC99D",
  shield: "\uBC29",
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
  banOn: "\uAE08",
  banOff: "\uAC00",
  /** Empty party slot label */
  partyEmpty: "\uBE48 \uCE78",
  boardA: "A\uAD6D",
  boardB: "B\uAD6D",
  /** Codex / illustrated catalog seal */
  codex: "\uB3C4",
} as const;
