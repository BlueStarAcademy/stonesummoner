/**
 * Premium symbol SVGs matching bottom-nav medal language:
 * aura → bronze disc → gold rim → dashed ring → cream/gold ink glyph.
 * Set color appears as aura only (like mission/monster nav seals).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../public/art/ui/symbol");

const SETS = [
  { id: "hwalro", accent: "#6cbc7a" },
  { id: "yongmaeng", accent: "#e07040" },
  { id: "mussang", accent: "#d0b070" },
  { id: "haengma", accent: "#4aa0d0" },
  { id: "jipjung", accent: "#9a70d0" },
  { id: "gunhim", accent: "#c9a227" },
  { id: "yeongyeol", accent: "#70b8a0" },
  { id: "bogang", accent: "#8ec8f0" },
  { id: "hwangyeok", accent: "#e09050" },
  { id: "ssangnip", accent: "#e8e0c8" },
  { id: "eungjing", accent: "#c05040" },
  { id: "tagae", accent: "#a03050" },
  { id: "pamyeol", accent: "#5a4068" },
  { id: "myosu", accent: "#6060a8" },
  { id: "gyeongno", accent: "#e05030" },
  { id: "chimtu", accent: "#c04070" },
];

/** Rarity stone plates — body color changes; rim stays gold metal. */
const RARITIES = [
  {
    id: "normal",
    aura: "#9a9a9a",
    faceHi: "#5a5a58",
    faceMid: "#2e2e2c",
    faceLo: "#121210",
    well: "#0a0a0a",
    dash: "#d8d8d0",
  },
  {
    id: "magic",
    aura: "#a3da58",
    faceHi: "#3a5a28",
    faceMid: "#1a2e14",
    faceLo: "#0a1408",
    well: "#061008",
    dash: "#c8f0a0",
  },
  {
    id: "rare",
    aura: "#4d97ff",
    faceHi: "#284868",
    faceMid: "#142838",
    faceLo: "#081018",
    well: "#060c14",
    dash: "#a8d0ff",
  },
  {
    id: "epic",
    aura: "#b46bff",
    faceHi: "#482868",
    faceMid: "#281438",
    faceLo: "#140818",
    well: "#100614",
    dash: "#e0c0ff",
  },
  {
    id: "legendary",
    aura: "#ff4d4d",
    faceHi: "#682828",
    faceMid: "#381414",
    faceLo: "#180808",
    well: "#140606",
    dash: "#ffc0c0",
  },
  {
    id: "mythic",
    aura: "#ffd700",
    faceHi: "#6a5820",
    faceMid: "#3a2e10",
    faceLo: "#1a1408",
    well: "#120e06",
    dash: "#fff4c8",
  },
];

/** Unique SW-like silhouettes in 72x72 (scaled from nav canvas). */
const SLOT = {
  1: {
    outer: "M18 12 L60 10 L64 36 L60 62 L18 60 L8 36 Z",
    inner: "M24 20 L56 18 L58 36 L56 54 L24 52 L18 36 Z",
  },
  2: {
    outer: "M36 6 L64 22 L58 62 L14 62 L8 22 Z",
    inner: "M36 16 L56 28 L52 56 L20 56 L16 28 Z",
  },
  3: {
    outer: "M12 10 L54 12 L64 36 L54 60 L12 62 L8 36 Z",
    inner: "M18 18 L50 20 L56 36 L50 52 L18 54 L16 36 Z",
  },
  4: {
    outer: "M36 8 L62 24 L56 54 L36 64 L16 54 L10 24 Z",
    inner: "M36 18 L54 30 L50 50 L36 58 L22 50 L18 30 Z",
  },
  5: {
    outer: "M14 12 L58 12 L64 32 L54 52 L36 64 L18 52 L8 32 Z",
    inner: "M20 20 L52 20 L56 32 L48 48 L36 58 L24 48 L16 32 Z",
  },
  6: {
    outer: "M10 20 L36 8 L62 20 L58 46 L36 64 L14 46 Z",
    inner: "M18 26 L36 16 L54 26 L50 44 L36 58 L22 44 Z",
  },
};

/**
 * Nav-medal glyph language: gold strokes + cream ink fills + dark volume.
 * Coordinates centered on 36,36 (72 viewBox).
 */
function glyph(setId, uid) {
  const g = `url(#${uid}-gold)`;
  const ink = `url(#${uid}-ink)`;
  switch (setId) {
    case "hwalro":
      // Flame petal — gold outline, cream body
      return `
      <path d="M36 16c7 9 14 16 14 26 0 8-6 14-14 14s-14-6-14-14c0-10 7-17 14-26z"
        fill="#1A2218" stroke="${g}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M36 24c4.5 6 9 11 9 18 0 5-4 9-9 9s-9-4-9-9c0-7 4.5-12 9-18z"
        fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <ellipse cx="32" cy="28" rx="2.4" ry="3.6" fill="#FFF8D6" opacity=".55"/>
      <circle cx="36" cy="40" r="2.8" fill="${g}"/>`;
    case "yongmaeng":
      // Spear / fatal mark
      return `
      <path d="M36 14 40 34h10l-8 8 3 14-9-7-9 7 3-14-8-8h10z"
        fill="#2A1C10" stroke="${g}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M36 20 38.5 33h6.5l-5 5 2 9-4.5-4-4.5 4 2-9-5-5H33.5z"
        fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <circle cx="36" cy="36" r="2.6" fill="${g}"/>`;
    case "haengma":
      // Wing / swift
      return `
      <path d="M14 38c8-14 14-20 22-20s14 6 22 20c-8-6-14-8-22-8s-14 2-22 8z"
        fill="#1A2030" stroke="${g}" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M20 42c7-8 12-10 16-10s9 2 16 10" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M26 46c5-5 8-5 10-5s5 0 10 5" fill="none" stroke="${g}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="36" cy="30" r="2.4" fill="${g}"/>`;
    case "gunhim":
      // Shield + cross
      return `
      <path d="M36 14 52 20v16c0 12-8 18-16 22-8-4-16-10-16-22V20z"
        fill="#1A1810" stroke="${g}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M36 20 46 24v12c0 8-5.5 12.5-10 15.5-4.5-3-10-7.5-10-15.5V24z"
        fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M28 34h16M36 26v16" stroke="#5A4214" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M28 34h16M36 26v16" stroke="${g}" stroke-width="1.8" stroke-linecap="round"/>`;
    case "yeongyeol":
      // Linked rings / endure bond
      return `
      <circle cx="28" cy="36" r="11" fill="none" stroke="${g}" stroke-width="2.4"/>
      <circle cx="44" cy="36" r="11" fill="none" stroke="${g}" stroke-width="2.4"/>
      <circle cx="28" cy="36" r="6.5" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <circle cx="44" cy="36" r="6.5" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M33 36h6" stroke="${g}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="36" cy="36" r="2.2" fill="${g}"/>`;
    case "mussang":
      // Crossed blades
      return `
      <path d="M20 18 34 36 24 56l6 2 8-16 8 16 6-2-10-20 14-18-6-2-12 14L28 16z"
        fill="#2A1C10" stroke="${g}" stroke-width="1.7" stroke-linejoin="round"/>
      <path d="M26 22 34 34 28 48l3 1 5-12 5 12 3-1-6-14 8-12-3-1-7 9-7-10z"
        fill="${ink}" stroke="#5A4214" stroke-width=".9"/>
      <circle cx="36" cy="36" r="3.4" fill="#1A140C" stroke="${g}" stroke-width="1.6"/>
      <circle cx="36" cy="36" r="1.4" fill="${g}"/>`;
    case "chimtu":
      // Piercing diamond / rage
      return `
      <path d="M36 12 50 36 36 60 22 36Z" fill="#241018" stroke="${g}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M36 20 44 36 36 52 28 36Z" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <circle cx="36" cy="36" r="4.2" fill="#1A140C" stroke="${g}" stroke-width="1.5"/>
      <circle cx="36" cy="36" r="1.8" fill="${g}"/>
      <path d="M36 14v6M36 52v6" stroke="${g}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
    case "bogang":
      // Braced plate / shield crest
      return `
      <path d="M20 28h32v14c0 9-7 14-16 18-9-4-16-9-16-18z"
        fill="#182028" stroke="${g}" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M26 20h20v10H26z" fill="${ink}" stroke="#5A4214" stroke-width="1.1"/>
      <path d="M26 34h20v8c0 5-4.5 8-10 10.5-5.5-2.5-10-5.5-10-10.5z"
        fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M30 38h12" stroke="${g}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="36" cy="25" r="2.2" fill="${g}"/>`;
    case "hwangyeok":
      // Rebound crescent / counter slash
      return `
      <path d="M18 42c4-16 14-26 28-28 2 10-2 20-10 28"
        fill="none" stroke="${g}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M22 44c3-12 10-20 20-22" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>
      <path d="M46 18 54 22 48 30z" fill="${ink}" stroke="${g}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M20 48 28 44 24 54z" fill="${g}" stroke="#5A4214" stroke-width="1" stroke-linejoin="round"/>
      <circle cx="36" cy="36" r="3" fill="#1A140C" stroke="${g}" stroke-width="1.4"/>`;
    case "ssangnip":
      // Twin pillars / immunity
      return `
      <path d="M20 52V24l8-6 8 6v28z" fill="#1A1810" stroke="${g}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M36 52V24l8-6 8 6v28z" fill="#1A1810" stroke="${g}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M24 48V28l4-3 4 3v20z" fill="${ink}" stroke="#5A4214" stroke-width=".9"/>
      <path d="M40 48V28l4-3 4 3v20z" fill="${ink}" stroke="#5A4214" stroke-width=".9"/>
      <path d="M18 52h36" stroke="${g}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="36" cy="18" r="2.4" fill="${g}"/>`;
    case "eungjing":
      // Nemesis — rising gauge flame
      return `
      <path d="M22 50h28v4H22z" fill="#1A140C" stroke="${g}" stroke-width="1.5"/>
      <path d="M26 50V34l10-16 10 16v16z" fill="#241018" stroke="${g}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M30 48V36l6-10 6 10v12z" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M36 22v8" stroke="${g}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="36" cy="18" r="2.5" fill="${g}"/>`;
    case "tagae":
      // Fang / lifesteal droplet
      return `
      <path d="M36 14c10 10 16 18 16 28 0 10-7 16-16 16s-16-6-16-16c0-10 6-18 16-28z"
        fill="#241018" stroke="${g}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M36 22c6 7 10 13 10 20 0 6-4.5 10-10 10s-10-4-10-10c0-7 4-13 10-20z"
        fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M36 30v18" stroke="#5A4214" stroke-width="3" stroke-linecap="round"/>
      <path d="M36 30v18" stroke="${g}" stroke-width="1.6" stroke-linecap="round"/>
      <ellipse cx="32" cy="26" rx="2.2" ry="3" fill="#FFF8D6" opacity=".5"/>`;
    case "pamyeol":
      // Destroy — cracked hex
      return `
      <path d="M36 14 52 24v20L36 58 20 44V24z" fill="#1A1420" stroke="${g}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M36 20 46 26v14L36 50 26 40V26z" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M28 28 44 44M40 26 30 42" stroke="#5A4214" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M28 28 44 44M40 26 30 42" stroke="${g}" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="36" cy="36" r="2.5" fill="${g}"/>`;
    case "jipjung":
      // Focus crosshair
      return `
      <circle cx="36" cy="36" r="16" fill="none" stroke="${g}" stroke-width="2.2"/>
      <circle cx="36" cy="36" r="9.5" fill="none" stroke="${ink}" stroke-width="1.8"/>
      <circle cx="36" cy="36" r="3.6" fill="#1A140C" stroke="${g}" stroke-width="1.5"/>
      <circle cx="36" cy="36" r="1.5" fill="${g}"/>
      <path d="M36 14v7M36 51v7M14 36h7M51 36h7"
        stroke="${g}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M24 24 28 28M48 24 44 28M24 48 28 44M48 48 44 44"
        stroke="${ink}" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>`;
    case "myosu":
      // Spiral / despair stun
      return `
      <circle cx="36" cy="36" r="16" fill="#181428" stroke="${g}" stroke-width="2"/>
      <path d="M36 20c10 0 14 8 14 14 0 10-8 14-14 14s-12-6-12-12 6-10 12-10 8 4 8 8-3 6-8 6"
        fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="36" cy="36" r="3.2" fill="${g}"/>
      <path d="M28 28 32 32M44 28 40 32M28 44 32 40M44 44 40 40"
        stroke="${g}" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>`;
    case "gyeongno":
      // Violent — double arrow / extra turn
      return `
      <path d="M20 40 36 16 52 40h-8l-8 16-8-16z" fill="#241010" stroke="${g}" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M26 38 36 22 46 38h-5l-5 10-5-10z" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M24 48h24" stroke="${g}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M28 54h16" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="36" cy="34" r="2.2" fill="${g}"/>`;
    default:
      return `<circle cx="36" cy="36" r="10" fill="${ink}" stroke="${g}" stroke-width="1.6"/>`;
  }
}

function sharedDefs(uid, accent) {
  return `
    <radialGradient id="${uid}-aura" cx="50%" cy="42%" r="58%">
      <stop stop-color="${accent}" stop-opacity=".55"/>
      <stop offset=".42" stop-color="${accent}" stop-opacity=".18"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${uid}-gold" x1="14" y1="10" x2="58" y2="62" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6"/>
      <stop offset=".28" stop-color="#F0D878"/>
      <stop offset=".62" stop-color="#C9A227"/>
      <stop offset="1" stop-color="#7A5A18"/>
    </linearGradient>
    <linearGradient id="${uid}-disc" x1="18" y1="14" x2="54" y2="58" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3A2E1A"/>
      <stop offset="1" stop-color="#14100A"/>
    </linearGradient>
    <linearGradient id="${uid}-ink" x1="22" y1="16" x2="52" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF6E0"/>
      <stop offset=".35" stop-color="${accent}"/>
      <stop offset=".75" stop-color="#E8D9A8"/>
      <stop offset="1" stop-color="#8A7038"/>
    </linearGradient>
    <linearGradient id="${uid}-shine" x1="20" y1="14" x2="40" y2="34" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF6D0" stop-opacity=".9"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <filter id="${uid}-depth" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" flood-color="#000" flood-opacity=".6"/>
    </filter>`;
}

function plateSvg(rarity, slot) {
  const uid = `plt${rarity.id}s${slot}`;
  const { outer, inner } = SLOT[slot];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
  <defs>
    <radialGradient id="${uid}-aura" cx="50%" cy="42%" r="55%">
      <stop stop-color="${rarity.aura}" stop-opacity=".55"/>
      <stop offset=".5" stop-color="${rarity.aura}" stop-opacity=".16"/>
      <stop offset="1" stop-color="${rarity.aura}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${uid}-face" x1="14" y1="8" x2="58" y2="64" gradientUnits="userSpaceOnUse">
      <stop stop-color="${rarity.faceHi}"/>
      <stop offset=".4" stop-color="${rarity.faceMid}"/>
      <stop offset="1" stop-color="${rarity.faceLo}"/>
    </linearGradient>
    <linearGradient id="${uid}-gold" x1="14" y1="10" x2="58" y2="62" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6"/>
      <stop offset=".28" stop-color="#F0D878"/>
      <stop offset=".62" stop-color="#C9A227"/>
      <stop offset="1" stop-color="#7A5A18"/>
    </linearGradient>
    <linearGradient id="${uid}-shine" x1="18" y1="12" x2="42" y2="36" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF6D0" stop-opacity=".85"/>
      <stop offset="1" stop-color="${rarity.aura}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${uid}-gem" cx="38%" cy="32%" r="70%">
      <stop stop-color="${rarity.faceHi}" stop-opacity=".9"/>
      <stop offset=".55" stop-color="${rarity.well}"/>
      <stop offset="1" stop-color="#000" stop-opacity=".85"/>
    </radialGradient>
    <filter id="${uid}-depth" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="1.6" stdDeviation="1.3" flood-color="#000" flood-opacity=".55"/>
    </filter>
  </defs>
  <circle cx="36" cy="36" r="28" fill="url(#${uid}-aura)"/>
  <g filter="url(#${uid}-depth)">
    <path d="${outer}" fill="none" stroke="#0A0806" stroke-width="5.4" stroke-linejoin="round" opacity=".92"/>
    <path d="${outer}" fill="url(#${uid}-face)" stroke="url(#${uid}-gold)" stroke-width="3" stroke-linejoin="round"/>
    <path d="${outer}" fill="none" stroke="#FFF8D6" stroke-width="1.15" opacity=".32" transform="translate(0 .6)"/>
    <path d="${inner}" fill="url(#${uid}-gem)" stroke="${rarity.dash}" stroke-width="1" stroke-opacity=".55"/>
    <path d="${inner}" fill="none" stroke="#FFF8D6" stroke-width=".7" opacity=".18" transform="translate(0 .4)"/>
    <ellipse cx="26" cy="19" rx="8" ry="3.4" fill="url(#${uid}-shine)" transform="rotate(-26 26 19)" opacity=".8"/>
  </g>
</svg>
`;
}

/** Glyph-only overlay — sits on top of rarity plate. */
function equippedSvg(set, slot) {
  const uid = `${set.id}s${slot}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
  <defs>
    ${sharedDefs(uid, set.accent)}
  </defs>
  <circle cx="36" cy="36" r="20" fill="url(#${uid}-aura)" opacity=".85"/>
  <g filter="url(#${uid}-depth)" transform="translate(36 36) scale(0.8) translate(-36 -36)">
    ${glyph(set.id, uid)}
  </g>
</svg>
`;
}

/** Soft equip hint — frame wells already draw the socket; keep this light. */
function emptySvg(slot) {
  const uid = `emptys${slot}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="${uid}-gold" x1="14" y1="10" x2="58" y2="62" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6"/>
      <stop offset=".4" stop-color="#C9A227"/>
      <stop offset="1" stop-color="#7A5A18"/>
    </linearGradient>
  </defs>
  <circle cx="36" cy="36" r="14" fill="#050402" fill-opacity=".35" stroke="url(#${uid}-gold)" stroke-width="1.2" opacity=".55"/>
  <path d="M36 28v16M28 36h16" stroke="url(#${uid}-gold)" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
</svg>
`;
}

/** Exact nav-medal shell + set glyph (chip / modal seal). */
function sealSvg(set) {
  const uid = `${set.id}seal`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
  <defs>
    ${sharedDefs(uid, set.accent)}
  </defs>
  <circle cx="36" cy="36" r="34" fill="url(#${uid}-aura)"/>
  <circle cx="36" cy="36" r="28.2" fill="none" stroke="#0A0806" stroke-width="4.5" opacity=".85"/>
  <circle cx="36" cy="36" r="27.5" fill="url(#${uid}-disc)" stroke="url(#${uid}-gold)" stroke-width="2.4"/>
  <circle cx="36" cy="36" r="23.5" fill="none" stroke="#FFF4C8" stroke-width=".85" opacity=".32" stroke-dasharray="2.2 4.5"/>
  <g stroke="url(#${uid}-gold)" stroke-width="1.5" stroke-linecap="round" opacity=".8">
    <path d="M36 10.5v4.2"/><path d="M36 57.3v4.2"/><path d="M10.5 36h4.2"/><path d="M57.3 36h4.2"/>
  </g>
  <g filter="url(#${uid}-depth)" transform="translate(36 36) scale(0.7) translate(-36 -36)">
    ${glyph(set.id, uid)}
  </g>
</svg>
`;
}

function circleFrameSvg() {
  // Warm bronze / gold socket board — matches game gold UI language.
  const wells = [
    [43.2, 76.8],
    [120, 38.4],
    [196.8, 76.8],
    [43.2, 163.2],
    [120, 201.6],
    [196.8, 163.2],
  ];
  const wellR = 33;
  const wellsXml = wells
    .map(
      ([cx, cy], i) => `
    <g>
      <circle cx="${cx}" cy="${cy}" r="${wellR + 5}" fill="url(#cfWellRim)" stroke="url(#cfGold)" stroke-width="1.8"/>
      <circle cx="${cx}" cy="${cy}" r="${wellR}" fill="url(#cfWell)" stroke="#0A0806" stroke-width="2.4"/>
      <circle cx="${cx}" cy="${cy}" r="${wellR - 4}" fill="none" stroke="#C9A227" stroke-width="1" opacity=".28" stroke-dasharray="2.5 4"/>
      <circle cx="${cx}" cy="${cy}" r="${wellR - 9}" fill="#050402" fill-opacity=".65"/>
      <ellipse cx="${cx - 7}" cy="${cy - 9}" rx="13" ry="5.5" fill="#FFF6D0" opacity=".07" transform="rotate(-28 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#C9A227" fill-opacity=".22" font-family="Georgia, serif" font-size="11" font-weight="700">${i + 1}</text>
    </g>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none" aria-hidden="true">
  <defs>
    <radialGradient id="cfMist" cx="50%" cy="48%" r="58%">
      <stop stop-color="#C9A227" stop-opacity=".22"/>
      <stop offset=".45" stop-color="#8A6A28" stop-opacity=".08"/>
      <stop offset="1" stop-color="#1a1408" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cfBoard" cx="42%" cy="30%" r="78%">
      <stop stop-color="#3A2E1C"/>
      <stop offset=".48" stop-color="#1C160E"/>
      <stop offset="1" stop-color="#0A0805"/>
    </radialGradient>
    <linearGradient id="cfGold" x1="36" y1="20" x2="210" y2="220" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6"/>
      <stop offset=".3" stop-color="#E8C84A"/>
      <stop offset=".65" stop-color="#C9A227"/>
      <stop offset="1" stop-color="#6A4A14"/>
    </linearGradient>
    <linearGradient id="cfEdge" x1="50" y1="24" x2="190" y2="210" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F0D878"/>
      <stop offset=".5" stop-color="#A88840"/>
      <stop offset="1" stop-color="#5A4218"/>
    </linearGradient>
    <radialGradient id="cfWell" cx="38%" cy="30%" r="72%">
      <stop stop-color="#1A140C"/>
      <stop offset=".55" stop-color="#0A0805"/>
      <stop offset="1" stop-color="#020100"/>
    </radialGradient>
    <radialGradient id="cfWellRim" cx="40%" cy="28%" r="70%">
      <stop stop-color="#5A4820"/>
      <stop offset="1" stop-color="#2A1C0C"/>
    </radialGradient>
    <filter id="cfDepth" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity=".6"/>
    </filter>
  </defs>
  <circle cx="120" cy="120" r="118" fill="url(#cfMist)"/>
  <g filter="url(#cfDepth)">
    <circle cx="120" cy="120" r="108" fill="url(#cfBoard)" stroke="url(#cfGold)" stroke-width="3.6"/>
    <circle cx="120" cy="120" r="102" fill="none" stroke="#0A0805" stroke-width="2.2" opacity=".75"/>
    <circle cx="120" cy="120" r="96" fill="none" stroke="url(#cfEdge)" stroke-width="1.3" opacity=".65"/>
    <circle cx="120" cy="120" r="88" fill="none" stroke="#F0D878" stroke-width=".75" opacity=".2" stroke-dasharray="3 6"/>
    <g stroke="#C9A227" stroke-width="1.15" stroke-linecap="round" opacity=".28">
      <path d="M72 72 Q120 104 168 72"/>
      <path d="M72 168 Q120 136 168 168"/>
      <path d="M58 102 Q120 120 58 138"/>
      <path d="M182 102 Q120 120 182 138"/>
    </g>
    <circle cx="120" cy="120" r="24" fill="#080604" stroke="url(#cfGold)" stroke-width="2"/>
    <circle cx="120" cy="120" r="14" fill="#120E08" stroke="#F0D878" stroke-width="1.1" opacity=".55"/>
    <circle cx="120" cy="120" r="4" fill="#F0D878" fill-opacity=".7"/>
    ${wellsXml}
  </g>
</svg>
`;
}

fs.mkdirSync(outDir, { recursive: true });

for (const rarity of RARITIES) {
  for (let slot = 1; slot <= 6; slot++) {
    fs.writeFileSync(
      path.join(outDir, `plate-${rarity.id}-${slot}.svg`),
      plateSvg(rarity, slot),
    );
  }
}

for (const set of SETS) {
  fs.writeFileSync(path.join(outDir, `${set.id}.svg`), sealSvg(set));
  for (let slot = 1; slot <= 6; slot++) {
    fs.writeFileSync(path.join(outDir, `${set.id}-${slot}.svg`), equippedSvg(set, slot));
  }
}
for (let slot = 1; slot <= 6; slot++) {
  fs.writeFileSync(path.join(outDir, `empty-${slot}.svg`), emptySvg(slot));
}
fs.writeFileSync(path.join(outDir, "circle-frame.svg"), circleFrameSvg());

console.log(
  `wrote symbol art -> ${outDir} (plates ${RARITIES.length * 6}, marks ${SETS.length * 6}, seals ${SETS.length}, empty 6, frame 1)`,
);
