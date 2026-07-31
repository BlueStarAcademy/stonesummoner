/**
 * Premium symbol SVGs:
 * - Distinct geometric plates per slot (1–6) matching the equip board mockup
 * - High-detail set glyphs (cream/gold ink + volume)
 * - Rounded board frame with 4-point star backdrop
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
    faceHi: "#6a6a66",
    faceMid: "#323230",
    faceLo: "#141412",
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

/**
 * Slot silhouettes (72×72) — clearly distinct, mockup-matched:
 * 1 trapezoid↑  2 house↑  3 parallelogram/  4 trapezoid↓  5 house↓  6 parallelogram\
 */
const SLOT = {
  1: {
    outer: "M22 8 L50 8 L66 64 L6 64 Z",
    inner: "M27 16 L45 16 L56 56 L16 56 Z",
    edge: "M22 8 L50 8 L45 16 L27 16 Z",
  },
  2: {
    outer: "M36 2 L66 28 L58 66 L14 66 L6 28 Z",
    inner: "M36 12 L56 32 L50 58 L22 58 L16 32 Z",
    edge: "M36 2 L66 28 L56 32 L36 12 L16 32 L6 28 Z",
  },
  3: {
    outer: "M10 14 L54 4 L62 58 L18 68 Z",
    inner: "M18 20 L50 12 L55 52 L23 60 Z",
    edge: "M10 14 L54 4 L50 12 L18 20 Z",
  },
  4: {
    outer: "M6 8 L66 8 L50 64 L22 64 Z",
    inner: "M16 16 L56 16 L45 56 L27 56 Z",
    edge: "M6 8 L66 8 L56 16 L16 16 Z",
  },
  5: {
    outer: "M14 6 L58 6 L66 44 L36 70 L6 44 Z",
    inner: "M22 14 L50 14 L56 40 L36 60 L16 40 Z",
    edge: "M14 6 L58 6 L50 14 L22 14 Z",
  },
  6: {
    outer: "M10 4 L54 14 L62 68 L18 58 Z",
    inner: "M17 12 L49 20 L55 60 L23 52 Z",
    edge: "M10 4 L54 14 L49 20 L17 12 Z",
  },
};

/**
 * High-detail set glyphs — layered volume, gold rim, cream ink, specular.
 * Coordinates centered on 36,36 (72 viewBox).
 */
function glyph(setId, uid) {
  const g = `url(#${uid}-gold)`;
  const ink = `url(#${uid}-ink)`;
  const shine = `url(#${uid}-shine)`;
  switch (setId) {
    case "hwalro":
      // Living flame — triple petal + core ember
      return `
      <path d="M36 12c4 6 9 12 11 20 2 8-2 16-11 22-9-6-13-14-11-22 2-8 7-14 11-20z"
        fill="#142018" stroke="${g}" stroke-width="2.1" stroke-linejoin="round"/>
      <path d="M28 30c2-8 5-14 8-18 3 4 6 10 8 18 1 6-1 12-8 17-7-5-9-11-8-17z"
        fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M32 34c1.2-5 2.8-9 4-12 1.2 3 2.8 7 4 12 .6 4-.6 8-4 11-3.4-3-4.6-7-4-11z"
        fill="#FFF8D6" opacity=".55"/>
      <ellipse cx="33" cy="28" rx="2.2" ry="4" fill="${shine}" opacity=".85"/>
      <circle cx="36" cy="42" r="3.4" fill="#1A140C" stroke="${g}" stroke-width="1.4"/>
      <circle cx="36" cy="42" r="1.5" fill="${g}"/>`;
    case "yongmaeng":
      // Fatal spearhead + wing barbs
      return `
      <path d="M36 10 42 30h12l-9 8 4 16-13-9-13 9 4-16-9-8h12z"
        fill="#24140C" stroke="${g}" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M36 16 40 32h8l-6 5.5 2.5 11-6.5-4.5-6.5 4.5 2.5-11-6-5.5h8z"
        fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M36 10v8" stroke="${g}" stroke-width="2" stroke-linecap="round"/>
      <path d="M22 34h-6M50 34h6" stroke="${g}" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>
      <circle cx="36" cy="36" r="3.2" fill="#1A140C" stroke="${g}" stroke-width="1.4"/>
      <circle cx="36" cy="36" r="1.3" fill="${g}"/>
      <ellipse cx="32" cy="24" rx="2" ry="3" fill="${shine}" opacity=".7"/>`;
    case "mussang":
      // Crossed blades with jewel hub
      return `
      <path d="M18 16 34 36 22 58l7 2 9-18 9 18 7-2-12-22 16-20-7-2-13 16L28 14z"
        fill="#22180C" stroke="${g}" stroke-width="1.7" stroke-linejoin="round"/>
      <path d="M24 20 34 34 26 50l4 1 6-13 6 13 4-1-8-16 10-14-4-1-8 10-8-11z"
        fill="${ink}" stroke="#5A4214" stroke-width=".95"/>
      <circle cx="36" cy="36" r="5" fill="#1A140C" stroke="${g}" stroke-width="1.7"/>
      <circle cx="36" cy="36" r="2.4" fill="${ink}" stroke="#5A4214" stroke-width=".8"/>
      <circle cx="36" cy="36" r="1.1" fill="${g}"/>
      <ellipse cx="28" cy="22" rx="2.5" ry="1.4" fill="${shine}" opacity=".65" transform="rotate(-40 28 22)"/>`;
    case "haengma":
      // Swift wing — layered feathers
      return `
      <path d="M12 40c9-18 16-24 24-24s15 6 24 24c-9-8-16-10-24-10s-15 2-24 10z"
        fill="#101828" stroke="${g}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M18 42c7-10 13-13 18-13s11 3 18 13" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M24 46c5-6 9-7 12-7s7 1 12 7" fill="none" stroke="${g}" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M28 50c4-4 6-4 8-4s4 0 8 4" fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>
      <circle cx="36" cy="28" r="3.2" fill="#1A140C" stroke="${g}" stroke-width="1.5"/>
      <circle cx="36" cy="28" r="1.3" fill="${g}"/>
      <ellipse cx="30" cy="34" rx="3" ry="1.5" fill="${shine}" opacity=".55" transform="rotate(-18 30 34)"/>`;
    case "jipjung":
      // Focus — ornate crosshair
      return `
      <circle cx="36" cy="36" r="18" fill="none" stroke="${g}" stroke-width="2.3"/>
      <circle cx="36" cy="36" r="12.5" fill="none" stroke="${ink}" stroke-width="1.9"/>
      <circle cx="36" cy="36" r="6.5" fill="#141018" stroke="${g}" stroke-width="1.6"/>
      <circle cx="36" cy="36" r="3" fill="${ink}" stroke="#5A4214" stroke-width=".8"/>
      <circle cx="36" cy="36" r="1.3" fill="${g}"/>
      <path d="M36 12v8M36 52v8M12 36h8M52 36h8" stroke="${g}" stroke-width="2.3" stroke-linecap="round"/>
      <path d="M22 22 27 27M50 22 45 27M22 50 27 45M50 50 45 45"
        stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="36" cy="18" r="1.4" fill="${g}"/><circle cx="36" cy="54" r="1.4" fill="${g}"/>
      <circle cx="18" cy="36" r="1.4" fill="${g}"/><circle cx="54" cy="36" r="1.4" fill="${g}"/>`;
    case "gunhim":
      // Guard tower shield
      return `
      <path d="M36 10 56 18v18c0 14-10 22-20 26-10-4-20-12-20-26V18z"
        fill="#18160E" stroke="${g}" stroke-width="2.1" stroke-linejoin="round"/>
      <path d="M36 16 48 22v14c0 10-7 16-12 19.5-5-3.5-12-9.5-12-19.5V22z"
        fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M26 34h20M36 24v20" stroke="#3A2C10" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M26 34h20M36 24v20" stroke="${g}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="36" cy="34" r="3.6" fill="#1A140C" stroke="${g}" stroke-width="1.4"/>
      <circle cx="36" cy="34" r="1.4" fill="${g}"/>
      <ellipse cx="30" cy="22" rx="4" ry="2" fill="${shine}" opacity=".55" transform="rotate(-20 30 22)"/>`;
    case "yeongyeol":
      // Linked rings / bond
      return `
      <circle cx="27" cy="36" r="13" fill="none" stroke="${g}" stroke-width="2.6"/>
      <circle cx="45" cy="36" r="13" fill="none" stroke="${g}" stroke-width="2.6"/>
      <circle cx="27" cy="36" r="8" fill="${ink}" stroke="#5A4214" stroke-width="1.1"/>
      <circle cx="45" cy="36" r="8" fill="${ink}" stroke="#5A4214" stroke-width="1.1"/>
      <circle cx="27" cy="36" r="3.2" fill="#1A140C" stroke="${g}" stroke-width="1.2"/>
      <circle cx="45" cy="36" r="3.2" fill="#1A140C" stroke="${g}" stroke-width="1.2"/>
      <path d="M32 36h8" stroke="${g}" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="36" cy="36" r="2.6" fill="${g}"/>
      <ellipse cx="24" cy="30" rx="3" ry="1.6" fill="${shine}" opacity=".5"/>`;
    case "bogang":
      // Braced crest / barrier plate
      return `
      <path d="M18 30h36v16c0 10-8 16-18 20-10-4-18-10-18-20z"
        fill="#101820" stroke="${g}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M24 16h24v12H24z" fill="${ink}" stroke="#5A4214" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M24 36h24v10c0 6-5.5 10-12 13-6.5-3-12-7-12-13z"
        fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M28 40h16" stroke="${g}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M30 20h12M33 16v8" stroke="${g}" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>
      <circle cx="36" cy="22" r="2.4" fill="${g}"/>
      <ellipse cx="28" cy="34" rx="3.5" ry="1.6" fill="${shine}" opacity=".45"/>`;
    case "hwangyeok":
      // Rebound crescents + tip
      return `
      <path d="M16 44c5-18 16-28 30-30 2 12-2 22-11 30"
        fill="none" stroke="${g}" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M20 46c4-14 12-22 22-24" fill="none" stroke="${ink}" stroke-width="2.1" stroke-linecap="round"/>
      <path d="M48 16 58 22 50 32z" fill="${ink}" stroke="${g}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M18 50 28 44 22 56z" fill="${g}" stroke="#5A4214" stroke-width="1.1" stroke-linejoin="round"/>
      <circle cx="36" cy="36" r="4" fill="#1A140C" stroke="${g}" stroke-width="1.5"/>
      <circle cx="36" cy="36" r="1.6" fill="${g}"/>
      <ellipse cx="42" cy="24" rx="2.4" ry="1.4" fill="${shine}" opacity=".6" transform="rotate(30 42 24)"/>`;
    case "ssangnip":
      // Twin pillars / will
      return `
      <path d="M18 54V22l9-8 9 8v32z" fill="#18160E" stroke="${g}" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M36 54V22l9-8 9 8v32z" fill="#18160E" stroke="${g}" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M22 50V28l5-4 5 4v22z" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M40 50V28l5-4 5 4v22z" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M16 54h40" stroke="${g}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M20 18h10M42 18h10" stroke="${g}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="36" cy="14" r="2.8" fill="${g}"/>
      <ellipse cx="25" cy="30" rx="2" ry="4" fill="${shine}" opacity=".45"/>`;
    case "eungjing":
      // Rising gauge / nemesis
      return `
      <path d="M20 52h32v5H20z" fill="#1A140C" stroke="${g}" stroke-width="1.6"/>
      <path d="M24 52V32l12-18 12 18v20z" fill="#241018" stroke="${g}" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M29 50V34l7-11 7 11v16z" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M36 18v10" stroke="${g}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="36" cy="14" r="3" fill="#1A140C" stroke="${g}" stroke-width="1.3"/>
      <circle cx="36" cy="14" r="1.2" fill="${g}"/>
      <path d="M26 44h20" stroke="${g}" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="32" cy="28" rx="2" ry="3.2" fill="${shine}" opacity=".55"/>`;
    case "tagae":
      // Vampire fang droplet
      return `
      <path d="M36 10c12 12 18 20 18 30 0 12-8 18-18 18S18 52 18 40c0-10 6-18 18-30z"
        fill="#241018" stroke="${g}" stroke-width="2.1" stroke-linejoin="round"/>
      <path d="M36 18c8 8 12 15 12 22 0 8-5.5 12-12 12s-12-4-12-12c0-7 4-14 12-22z"
        fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M36 28v20" stroke="#3A2010" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M36 28v20" stroke="${g}" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M30 36 36 48 42 36" fill="none" stroke="#5A4214" stroke-width="1.4" stroke-linejoin="round"/>
      <ellipse cx="31" cy="24" rx="2.4" ry="3.4" fill="${shine}" opacity=".6"/>`;
    case "pamyeol":
      // Destroy — cracked hex
      return `
      <path d="M36 10 54 22v24L36 60 18 46V22z" fill="#16101C" stroke="${g}" stroke-width="2.1" stroke-linejoin="round"/>
      <path d="M36 16 48 25v18L36 54 24 43V25z" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M26 26 46 46M44 24 28 44" stroke="#2A1830" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M26 26 46 46M44 24 28 44" stroke="${g}" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="36" cy="36" r="3.2" fill="#1A140C" stroke="${g}" stroke-width="1.3"/>
      <circle cx="36" cy="36" r="1.2" fill="${g}"/>
      <ellipse cx="30" cy="20" rx="3" ry="1.5" fill="${shine}" opacity=".5" transform="rotate(-25 30 20)"/>`;
    case "myosu":
      // Spiral maze / despair
      return `
      <circle cx="36" cy="36" r="18" fill="#141020" stroke="${g}" stroke-width="2.2"/>
      <path d="M36 18c12 0 16 9 16 16 0 12-9 16-16 16s-14-7-14-14 7-12 14-12 10 5 10 10-4 8-10 8-6-3-6-6 2-4 6-4"
        fill="none" stroke="${ink}" stroke-width="2.3" stroke-linecap="round"/>
      <circle cx="36" cy="36" r="4" fill="#1A140C" stroke="${g}" stroke-width="1.4"/>
      <circle cx="36" cy="36" r="1.6" fill="${g}"/>
      <path d="M26 26 31 31M46 26 41 31M26 46 31 41M46 46 41 41"
        stroke="${g}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
      <ellipse cx="30" cy="22" rx="2.5" ry="1.3" fill="${shine}" opacity=".45"/>`;
    case "gyeongno":
      // Violent — double chevron / extra turn
      return `
      <path d="M18 42 36 12 54 42h-9l-9 18-9-18z" fill="#241010" stroke="${g}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M25 40 36 20 47 40h-6l-5 11-5-11z" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M22 50h28" stroke="${g}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M26 56h20" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="36" cy="34" r="2.8" fill="#1A140C" stroke="${g}" stroke-width="1.3"/>
      <circle cx="36" cy="34" r="1.1" fill="${g}"/>
      <ellipse cx="32" cy="24" rx="2.2" ry="3" fill="${shine}" opacity=".55"/>`;
    case "chimtu":
      // Piercing diamond / rage
      return `
      <path d="M36 8 54 36 36 64 18 36Z" fill="#241018" stroke="${g}" stroke-width="2.1" stroke-linejoin="round"/>
      <path d="M36 16 46 36 36 56 26 36Z" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M36 10v8M36 54v8" stroke="${g}" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
      <circle cx="36" cy="36" r="5.2" fill="#1A140C" stroke="${g}" stroke-width="1.6"/>
      <circle cx="36" cy="36" r="2.4" fill="${ink}" stroke="#5A4214" stroke-width=".8"/>
      <circle cx="36" cy="36" r="1.1" fill="${g}"/>
      <ellipse cx="32" cy="24" rx="2" ry="3.2" fill="${shine}" opacity=".55"/>`;
    default:
      return `<circle cx="36" cy="36" r="12" fill="${ink}" stroke="${g}" stroke-width="1.8"/>`;
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
      <stop stop-color="#FFF6D0" stop-opacity=".95"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <filter id="${uid}-depth" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" flood-color="#000" flood-opacity=".6"/>
    </filter>`;
}

function plateSvg(rarity, slot) {
  const uid = `plt${rarity.id}s${slot}`;
  const { outer, inner, edge } = SLOT[slot];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
  <defs>
    <radialGradient id="${uid}-aura" cx="50%" cy="42%" r="55%">
      <stop stop-color="${rarity.aura}" stop-opacity=".55"/>
      <stop offset=".5" stop-color="${rarity.aura}" stop-opacity=".16"/>
      <stop offset="1" stop-color="${rarity.aura}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${uid}-face" x1="14" y1="8" x2="58" y2="64" gradientUnits="userSpaceOnUse">
      <stop stop-color="${rarity.faceHi}"/>
      <stop offset=".38" stop-color="${rarity.faceMid}"/>
      <stop offset="1" stop-color="${rarity.faceLo}"/>
    </linearGradient>
    <linearGradient id="${uid}-gold" x1="14" y1="10" x2="58" y2="62" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6"/>
      <stop offset=".28" stop-color="#F0D878"/>
      <stop offset=".62" stop-color="#C9A227"/>
      <stop offset="1" stop-color="#7A5A18"/>
    </linearGradient>
    <linearGradient id="${uid}-bevel" x1="16" y1="8" x2="40" y2="30" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6" stop-opacity=".75"/>
      <stop offset="1" stop-color="${rarity.aura}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${uid}-shine" x1="18" y1="12" x2="42" y2="36" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF6D0" stop-opacity=".9"/>
      <stop offset="1" stop-color="${rarity.aura}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${uid}-gem" cx="38%" cy="32%" r="70%">
      <stop stop-color="${rarity.faceHi}" stop-opacity=".92"/>
      <stop offset=".55" stop-color="${rarity.well}"/>
      <stop offset="1" stop-color="#000" stop-opacity=".88"/>
    </radialGradient>
    <filter id="${uid}-depth" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity=".58"/>
    </filter>
  </defs>
  <circle cx="36" cy="36" r="28" fill="url(#${uid}-aura)"/>
  <g filter="url(#${uid}-depth)">
    <path d="${outer}" fill="none" stroke="#0A0806" stroke-width="5.6" stroke-linejoin="round" opacity=".94"/>
    <path d="${outer}" fill="url(#${uid}-face)" stroke="url(#${uid}-gold)" stroke-width="3.1" stroke-linejoin="round"/>
    <path d="${outer}" fill="none" stroke="#FFF8D6" stroke-width="1.2" opacity=".34" transform="translate(0 .55)"/>
    <path d="${edge}" fill="url(#${uid}-bevel)" opacity=".55"/>
    <path d="${inner}" fill="url(#${uid}-gem)" stroke="${rarity.dash}" stroke-width="1" stroke-opacity=".55"/>
    <path d="${inner}" fill="none" stroke="#FFF8D6" stroke-width=".7" opacity=".2" transform="translate(0 .35)"/>
    <ellipse cx="27" cy="18" rx="7.5" ry="3.2" fill="url(#${uid}-shine)" transform="rotate(-24 27 18)" opacity=".82"/>
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
  <circle cx="36" cy="36" r="18" fill="url(#${uid}-aura)" opacity=".8"/>
  <g filter="url(#${uid}-depth)" transform="translate(36 36) scale(0.78) translate(-36 -36)">
    ${glyph(set.id, uid)}
  </g>
</svg>
`;
}

/** Empty socket — gold beveled plate silhouette (mockup language). */
function emptySvg(slot) {
  const uid = `emptys${slot}`;
  const { outer, inner, edge } = SLOT[slot];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="${uid}-face" x1="14" y1="8" x2="58" y2="64" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E8C84A"/>
      <stop offset=".35" stop-color="#C9A227"/>
      <stop offset=".7" stop-color="#8A6A20"/>
      <stop offset="1" stop-color="#4A3810"/>
    </linearGradient>
    <linearGradient id="${uid}-gold" x1="14" y1="10" x2="58" y2="62" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6"/>
      <stop offset=".3" stop-color="#F0D878"/>
      <stop offset=".65" stop-color="#C9A227"/>
      <stop offset="1" stop-color="#7A5A18"/>
    </linearGradient>
    <linearGradient id="${uid}-bevel" x1="16" y1="8" x2="40" y2="28" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6" stop-opacity=".8"/>
      <stop offset="1" stop-color="#C9A227" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${uid}-well" cx="42%" cy="34%" r="68%">
      <stop stop-color="#3A2C14" stop-opacity=".95"/>
      <stop offset=".55" stop-color="#14100A"/>
      <stop offset="1" stop-color="#050402"/>
    </radialGradient>
    <filter id="${uid}-depth" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.4" flood-color="#000" flood-opacity=".55"/>
    </filter>
  </defs>
  <g filter="url(#${uid}-depth)">
    <path d="${outer}" fill="none" stroke="#0A0806" stroke-width="5.4" stroke-linejoin="round" opacity=".92"/>
    <path d="${outer}" fill="url(#${uid}-face)" stroke="url(#${uid}-gold)" stroke-width="3" stroke-linejoin="round"/>
    <path d="${outer}" fill="none" stroke="#FFF8D6" stroke-width="1.1" opacity=".3" transform="translate(0 .5)"/>
    <path d="${edge}" fill="url(#${uid}-bevel)" opacity=".5"/>
    <path d="${inner}" fill="url(#${uid}-well)" stroke="#C9A227" stroke-width="1" stroke-opacity=".4"/>
    <path d="M36 28v16M28 36h16" stroke="url(#${uid}-gold)" stroke-width="2.1" stroke-linecap="round" opacity=".55"/>
  </g>
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
  <g filter="url(#${uid}-depth)" transform="translate(36 36) scale(0.68) translate(-36 -36)">
    ${glyph(set.id, uid)}
  </g>
</svg>
`;
}

/** Board frame: 4-point star + rounded panel (mockup). Wells are soft seats only. */
function circleFrameSvg() {
  // 2×3 grid centers — center column sits slightly inward on Y for house slots
  const wells = [
    [58, 86],
    [120, 74],
    [182, 86],
    [58, 158],
    [120, 170],
    [182, 158],
  ];
  const wellsXml = wells
    .map(
      ([cx, cy]) => `
    <g opacity=".9">
      <ellipse cx="${cx}" cy="${cy}" rx="30" ry="28" fill="url(#cfWell)" stroke="url(#cfGold)" stroke-width="1.2" opacity=".55"/>
      <ellipse cx="${cx}" cy="${cy}" rx="22" ry="20" fill="#050402" fill-opacity=".55"/>
      <ellipse cx="${cx - 6}" cy="${cy - 8}" rx="10" ry="4" fill="#FFF6D0" opacity=".05" transform="rotate(-24 ${cx} ${cy})"/>
    </g>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none" aria-hidden="true">
  <defs>
    <radialGradient id="cfMist" cx="50%" cy="48%" r="58%">
      <stop stop-color="#C9A227" stop-opacity=".2"/>
      <stop offset=".5" stop-color="#8A6A28" stop-opacity=".07"/>
      <stop offset="1" stop-color="#1a1408" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cfBoard" cx="40%" cy="28%" r="80%">
      <stop stop-color="#3A2E1C"/>
      <stop offset=".5" stop-color="#1C160E"/>
      <stop offset="1" stop-color="#0A0805"/>
    </radialGradient>
    <linearGradient id="cfGold" x1="36" y1="20" x2="210" y2="220" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6"/>
      <stop offset=".3" stop-color="#E8C84A"/>
      <stop offset=".65" stop-color="#C9A227"/>
      <stop offset="1" stop-color="#6A4A14"/>
    </linearGradient>
    <linearGradient id="cfStar" x1="40" y1="20" x2="200" y2="220" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2A2214"/>
      <stop offset=".5" stop-color="#16120C"/>
      <stop offset="1" stop-color="#0A0805"/>
    </linearGradient>
    <radialGradient id="cfWell" cx="40%" cy="30%" r="70%">
      <stop stop-color="#2A2214"/>
      <stop offset="1" stop-color="#0A0805"/>
    </radialGradient>
    <filter id="cfDepth" x="-18%" y="-18%" width="136%" height="136%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".55"/>
    </filter>
  </defs>
  <circle cx="120" cy="120" r="118" fill="url(#cfMist)"/>
  <!-- 4-point star backdrop -->
  <path d="M120 8 L148 72 L232 120 L148 168 L120 232 L92 168 L8 120 L92 72 Z"
    fill="url(#cfStar)" stroke="url(#cfGold)" stroke-width="1.6" opacity=".92"/>
  <path d="M120 28 L140 78 L212 120 L140 162 L120 212 L100 162 L28 120 L100 78 Z"
    fill="none" stroke="#C9A227" stroke-width=".9" opacity=".28"/>
  <g filter="url(#cfDepth)">
    <rect x="34" y="42" width="172" height="156" rx="22" ry="22"
      fill="url(#cfBoard)" stroke="url(#cfGold)" stroke-width="3.2"/>
    <rect x="40" y="48" width="160" height="144" rx="18" ry="18"
      fill="none" stroke="#0A0805" stroke-width="2" opacity=".7"/>
    <rect x="44" y="52" width="152" height="136" rx="15" ry="15"
      fill="none" stroke="#F0D878" stroke-width=".8" opacity=".18"/>
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
      "utf8",
    );
  }
}

for (const set of SETS) {
  fs.writeFileSync(path.join(outDir, `${set.id}.svg`), sealSvg(set), "utf8");
  for (let slot = 1; slot <= 6; slot++) {
    fs.writeFileSync(
      path.join(outDir, `${set.id}-${slot}.svg`),
      equippedSvg(set, slot),
      "utf8",
    );
  }
}
for (let slot = 1; slot <= 6; slot++) {
  fs.writeFileSync(path.join(outDir, `empty-${slot}.svg`), emptySvg(slot), "utf8");
}
fs.writeFileSync(path.join(outDir, "circle-frame.svg"), circleFrameSvg(), "utf8");

console.log(
  `wrote symbol art -> ${outDir} (plates ${RARITIES.length * 6}, marks ${SETS.length * 6}, seals ${SETS.length}, empty 6, frame 1)`,
);
