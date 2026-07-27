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
} as const;
