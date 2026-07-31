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
 * Slot silhouettes (72×72) — SW-like distinct plates, balanced & centered:
 * 1 circle  2 house↑  3 triangle↑  4 trapezoid↓  5 hexagon  6 diamond
 */
const SLOT = {
  1: {
    outer: "M36 5a31 31 0 1 1 0 62a31 31 0 1 1 0-62",
    inner: "M36 14a22 22 0 1 1 0 44a22 22 0 1 1 0-44",
    edge: "M12 26a26 26 0 0 1 48 0a31 31 0 0 0-48 0",
  },
  2: {
    outer: "M36 2 L66 28 L58 66 L14 66 L6 28 Z",
    inner: "M36 12 L56 32 L50 58 L22 58 L16 32 Z",
    edge: "M36 2 L66 28 L56 32 L36 12 L16 32 L6 28 Z",
  },
  3: {
    outer: "M36 6 L64 62 L8 62 Z",
    inner: "M36 18 L52 54 L20 54 Z",
    edge: "M36 6 L64 62 L8 62 Z M36 18 L20 54 L52 54 Z",
  },
  4: {
    outer: "M6 8 L66 8 L50 64 L22 64 Z",
    inner: "M16 16 L56 16 L45 56 L27 56 Z",
    edge: "M6 8 L66 8 L56 16 L16 16 Z",
  },
  5: {
    outer: "M36 4 L62 18 L62 50 L36 68 L10 50 L10 18 Z",
    inner: "M36 14 L52 24 L52 46 L36 58 L20 46 L20 24 Z",
    edge: "M36 4 L62 18 L52 24 L36 14 L20 24 L10 18 Z",
  },
  6: {
    outer: "M36 4 L68 36 L36 68 L4 36 Z",
    inner: "M36 14 L56 36 L36 58 L16 36 Z",
    edge: "M36 4 L68 36 L56 36 L36 14 L16 36 L4 36 Z",
  },
};

/**
 * Ultra-detail set glyphs (SW rune mark language):
 * dark volume shell → accent ink face → cream highlight → gold rim/gems/sparks.
 * Coordinates centered on 36,36 (72 viewBox).
 */
function glyph(setId, uid) {
  const g = `url(#${uid}-gold)`;
  const ink = `url(#${uid}-ink)`;
  const shine = `url(#${uid}-shine)`;
  const core = `url(#${uid}-core)`;
  const deep = `url(#${uid}-deep)`;
  switch (setId) {
    case "hwalro":
      return `
      <ellipse cx="36" cy="52" rx="14" ry="5" fill="${deep}" opacity=".55"/>
      <path d="M22 48c2-16 7-26 14-36 7 10 12 20 14 36-5-4-9-5-14-5s-9 1-14 5z"
        fill="${deep}" stroke="${g}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M26 46c2-12 5-20 10-28 5 8 8 16 10 28-3.5-3-6.5-4-10-4s-6.5 1-10 4z"
        fill="${ink}" stroke="#5A4214" stroke-width="1.1"/>
      <path d="M30 44c1.5-8 3.5-14 6-20 2.5 6 4.5 12 6 20-2-2-4-2.5-6-2.5s-4 .5-6 2.5z"
        fill="#FFF8D6" opacity=".5"/>
      <path d="M28 34c3-2 8-3 13-1" fill="none" stroke="${shine}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
      <path d="M20 40 16 34M52 40 56 34M24 28 20 22M48 28 52 22"
        stroke="${g}" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>
      <circle cx="36" cy="46" r="5" fill="${deep}" stroke="${g}" stroke-width="1.5"/>
      <circle cx="36" cy="46" r="2.6" fill="${core}"/>
      <circle cx="36" cy="46" r="1.1" fill="#FFF8D6"/>
      <ellipse cx="32" cy="26" rx="2.4" ry="4" fill="${shine}" opacity=".85"/>`;
    case "yongmaeng":
      return `
      <path d="M36 8 42 26h14l-11 9 5 20-14-11-14 11 5-20-11-9h14z"
        fill="${deep}" stroke="${g}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M36 14 40 28h9l-7 5.5 3 13-8-6.5-8 6.5 3-13-7-5.5h9z"
        fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M36 8v10" stroke="${g}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M18 30 12 26M54 30 60 26M20 36h-7M52 36h7"
        stroke="${g}" stroke-width="1.7" stroke-linecap="round" opacity=".8"/>
      <path d="M28 22 36 18 44 22" fill="none" stroke="${shine}" stroke-width="1.4" stroke-linecap="round" opacity=".65"/>
      <circle cx="36" cy="36" r="4.2" fill="${deep}" stroke="${g}" stroke-width="1.5"/>
      <circle cx="36" cy="36" r="2.2" fill="${core}"/>
      <circle cx="36" cy="36" r=".9" fill="#FFF8D6"/>
      <ellipse cx="31" cy="22" rx="2.2" ry="3.2" fill="${shine}" opacity=".75"/>`;
    case "mussang":
      return `
      <path d="M16 14 34 36 20 60l8 2.5 10-20 10 20 8-2.5-14-24 18-22-8-2.5-14 17L28 12z"
        fill="${deep}" stroke="${g}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M22 18 34 34 24 52l5 1.2 7-14 7 14 5-1.2-9-17 11-15-5-1.2-9 11-8-12z"
        fill="${ink}" stroke="#5A4214" stroke-width=".95"/>
      <path d="M24 20 30 28M42 20 48 28" stroke="${shine}" stroke-width="1.3" stroke-linecap="round" opacity=".55"/>
      <circle cx="36" cy="36" r="6.2" fill="${deep}" stroke="${g}" stroke-width="1.8"/>
      <circle cx="36" cy="36" r="4" fill="${ink}" stroke="#5A4214" stroke-width=".9"/>
      <circle cx="36" cy="36" r="2.2" fill="${core}"/>
      <circle cx="36" cy="36" r=".95" fill="#FFF8D6"/>
      <ellipse cx="27" cy="20" rx="2.6" ry="1.5" fill="${shine}" opacity=".7" transform="rotate(-38 27 20)"/>`;
    case "haengma":
      return `
      <path d="M10 42c10-20 18-28 26-28s16 8 26 28c-10-9-17-12-26-12S20 33 10 42z"
        fill="${deep}" stroke="${g}" stroke-width="2.1" stroke-linejoin="round"/>
      <path d="M16 44c8-12 14-16 20-16s12 4 20 16" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M22 48c6-7 10-9 14-9s8 2 14 9" fill="none" stroke="${g}" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M26 52c4.5-4.5 7-5 10-5s5.5.5 10 5" fill="none" stroke="${ink}" stroke-width="1.4" stroke-linecap="round" opacity=".85"/>
      <path d="M18 36 14 30M54 36 58 30M24 30 20 24M48 30 52 24"
        stroke="${g}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
      <circle cx="36" cy="26" r="4.2" fill="${deep}" stroke="${g}" stroke-width="1.6"/>
      <circle cx="36" cy="26" r="2.2" fill="${core}"/>
      <circle cx="36" cy="26" r=".9" fill="#FFF8D6"/>
      <ellipse cx="28" cy="34" rx="3.5" ry="1.6" fill="${shine}" opacity=".6" transform="rotate(-16 28 34)"/>`;
    case "jipjung":
      return `
      <circle cx="36" cy="36" r="20" fill="none" stroke="${g}" stroke-width="2.4"/>
      <circle cx="36" cy="36" r="20" fill="none" stroke="${shine}" stroke-width=".8" opacity=".35" stroke-dasharray="2 3"/>
      <circle cx="36" cy="36" r="14" fill="none" stroke="${ink}" stroke-width="2"/>
      <circle cx="36" cy="36" r="8" fill="${deep}" stroke="${g}" stroke-width="1.7"/>
      <circle cx="36" cy="36" r="4.5" fill="${ink}" stroke="#5A4214" stroke-width=".9"/>
      <circle cx="36" cy="36" r="2.2" fill="${core}"/>
      <circle cx="36" cy="36" r=".95" fill="#FFF8D6"/>
      <path d="M36 10v9M36 53v9M10 36h9M53 36h9" stroke="${g}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M20 20 26 26M52 20 46 26M20 52 26 46M52 52 46 46"
        stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>
      <circle cx="36" cy="14" r="1.7" fill="${g}"/><circle cx="36" cy="58" r="1.7" fill="${g}"/>
      <circle cx="14" cy="36" r="1.7" fill="${g}"/><circle cx="58" cy="36" r="1.7" fill="${g}"/>
      <ellipse cx="30" cy="24" rx="2.2" ry="1.2" fill="${shine}" opacity=".55"/>`;
    case "gunhim":
      return `
      <path d="M36 8 58 17v20c0 15-11 24-22 28C15 61 14 52 14 37V17z"
        fill="${deep}" stroke="${g}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M36 14 50 21v16c0 11-8 17.5-14 21-6-3.5-14-10-14-21V21z"
        fill="${ink}" stroke="#5A4214" stroke-width="1.05"/>
      <path d="M24 34h24M36 22v24" stroke="#2A2010" stroke-width="3.8" stroke-linecap="round"/>
      <path d="M24 34h24M36 22v24" stroke="${g}" stroke-width="2.1" stroke-linecap="round"/>
      <circle cx="36" cy="34" r="4.5" fill="${deep}" stroke="${g}" stroke-width="1.5"/>
      <circle cx="36" cy="34" r="2.4" fill="${core}"/>
      <circle cx="36" cy="34" r="1" fill="#FFF8D6"/>
      <circle cx="24" cy="24" r="1.5" fill="${g}"/><circle cx="48" cy="24" r="1.5" fill="${g}"/>
      <circle cx="24" cy="44" r="1.5" fill="${g}"/><circle cx="48" cy="44" r="1.5" fill="${g}"/>
      <ellipse cx="29" cy="20" rx="4.5" ry="2.2" fill="${shine}" opacity=".6" transform="rotate(-18 29 20)"/>`;
    case "yeongyeol":
      return `
      <circle cx="26" cy="36" r="14.5" fill="none" stroke="${g}" stroke-width="2.8"/>
      <circle cx="46" cy="36" r="14.5" fill="none" stroke="${g}" stroke-width="2.8"/>
      <circle cx="26" cy="36" r="9.5" fill="${ink}" stroke="#5A4214" stroke-width="1.15"/>
      <circle cx="46" cy="36" r="9.5" fill="${ink}" stroke="#5A4214" stroke-width="1.15"/>
      <circle cx="26" cy="36" r="4.5" fill="${deep}" stroke="${g}" stroke-width="1.3"/>
      <circle cx="46" cy="36" r="4.5" fill="${deep}" stroke="${g}" stroke-width="1.3"/>
      <circle cx="26" cy="36" r="2" fill="${core}"/><circle cx="46" cy="36" r="2" fill="${core}"/>
      <path d="M31 36h10" stroke="${g}" stroke-width="2.8" stroke-linecap="round"/>
      <circle cx="36" cy="36" r="3.2" fill="${g}"/>
      <circle cx="36" cy="36" r="1.3" fill="#FFF8D6"/>
      <ellipse cx="22" cy="28" rx="3.2" ry="1.7" fill="${shine}" opacity=".55"/>
      <ellipse cx="50" cy="28" rx="3.2" ry="1.7" fill="${shine}" opacity=".45"/>`;
    case "bogang":
      return `
      <path d="M16 28h40v18c0 11-9 17-20 22-11-5-20-11-20-22z"
        fill="${deep}" stroke="${g}" stroke-width="2.1" stroke-linejoin="round"/>
      <path d="M22 14h28v14H22z" fill="${ink}" stroke="#5A4214" stroke-width="1.25" stroke-linejoin="round"/>
      <path d="M22 34h28v12c0 7-6 11.5-14 15-8-3.5-14-8-14-15z"
        fill="${ink}" stroke="#5A4214" stroke-width="1.05"/>
      <path d="M26 40h20" stroke="${g}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M28 18h16M32 14v10" stroke="${g}" stroke-width="1.7" stroke-linecap="round" opacity=".9"/>
      <circle cx="36" cy="20" r="3" fill="${deep}" stroke="${g}" stroke-width="1.2"/>
      <circle cx="36" cy="20" r="1.3" fill="${core}"/>
      <path d="M20 32 16 28M52 32 56 28" stroke="${g}" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="28" cy="32" rx="3.8" ry="1.7" fill="${shine}" opacity=".5"/>`;
    case "hwangyeok":
      return `
      <path d="M14 46c6-20 18-32 34-34 2 14-3 25-13 34" fill="none" stroke="${g}" stroke-width="3" stroke-linecap="round"/>
      <path d="M18 48c5-16 14-25 26-27" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M46 14 60 22 50 36z" fill="${ink}" stroke="${g}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M16 52 30 44 22 60z" fill="${g}" stroke="#5A4214" stroke-width="1.15" stroke-linejoin="round"/>
      <path d="M48 18 54 22" stroke="${shine}" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>
      <circle cx="36" cy="36" r="5.2" fill="${deep}" stroke="${g}" stroke-width="1.6"/>
      <circle cx="36" cy="36" r="2.8" fill="${core}"/>
      <circle cx="36" cy="36" r="1.1" fill="#FFF8D6"/>
      <ellipse cx="42" cy="22" rx="2.6" ry="1.5" fill="${shine}" opacity=".65" transform="rotate(28 42 22)"/>`;
    case "ssangnip":
      return `
      <path d="M16 56V20l10-10 10 10v36z" fill="${deep}" stroke="${g}" stroke-width="1.95" stroke-linejoin="round"/>
      <path d="M36 56V20l10-10 10 10v36z" fill="${deep}" stroke="${g}" stroke-width="1.95" stroke-linejoin="round"/>
      <path d="M20 52V26l6-5 6 5v26z" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M40 52V26l6-5 6 5v26z" fill="${ink}" stroke="#5A4214" stroke-width="1"/>
      <path d="M14 56h44" stroke="${g}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M18 16h12M42 16h12" stroke="${g}" stroke-width="1.9" stroke-linecap="round"/>
      <circle cx="36" cy="12" r="3.6" fill="${deep}" stroke="${g}" stroke-width="1.4"/>
      <circle cx="36" cy="12" r="1.7" fill="${core}"/>
      <path d="M24 34h4M44 34h4M24 44h4M44 44h4" stroke="${g}" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="24" cy="28" rx="2.2" ry="4.2" fill="${shine}" opacity=".5"/>`;
    case "eungjing":
      return `
      <path d="M18 54h36v6H18z" fill="${deep}" stroke="${g}" stroke-width="1.7"/>
      <path d="M22 54V30l14-20 14 20v24z" fill="${deep}" stroke="${g}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M28 52V34l8-12 8 12v18z" fill="${ink}" stroke="#5A4214" stroke-width="1.05"/>
      <path d="M36 14v12" stroke="${g}" stroke-width="2.3" stroke-linecap="round"/>
      <circle cx="36" cy="12" r="3.6" fill="${deep}" stroke="${g}" stroke-width="1.35"/>
      <circle cx="36" cy="12" r="1.6" fill="${core}"/>
      <path d="M24 42h24M26 48h20" stroke="${g}" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>
      <path d="M20 36 16 30M52 36 56 30" stroke="${g}" stroke-width="1.4" stroke-linecap="round" opacity=".65"/>
      <ellipse cx="31" cy="26" rx="2.2" ry="3.4" fill="${shine}" opacity=".6"/>`;
    case "tagae":
      return `
      <path d="M36 8c14 13 20 22 20 33 0 13-9 19-20 19S16 54 16 41c0-11 6-20 20-33z"
        fill="${deep}" stroke="${g}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M36 16c9 9 13 16 13 25 0 9-6 13-13 13s-13-4-13-13c0-9 4-16 13-25z"
        fill="${ink}" stroke="#5A4214" stroke-width="1.05"/>
      <path d="M36 26v24" stroke="#3A1810" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M36 26v24" stroke="${g}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M28 34 36 50 44 34" fill="none" stroke="#5A4214" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M28 34 36 50 44 34" fill="none" stroke="${shine}" stroke-width=".7" opacity=".5"/>
      <circle cx="36" cy="30" r="3.2" fill="${deep}" stroke="${g}" stroke-width="1.2"/>
      <circle cx="36" cy="30" r="1.4" fill="${core}"/>
      <ellipse cx="30" cy="22" rx="2.6" ry="3.6" fill="${shine}" opacity=".65"/>`;
    case "pamyeol":
      return `
      <path d="M36 8 56 21v26L36 62 16 47V21z" fill="${deep}" stroke="${g}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M36 14 50 24v20L36 56 22 44V24z" fill="${ink}" stroke="#5A4214" stroke-width="1.05"/>
      <path d="M24 24 48 48M48 22 26 46" stroke="#2A1830" stroke-width="3" stroke-linecap="round"/>
      <path d="M24 24 48 48M48 22 26 46" stroke="${g}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M30 18 34 28M42 18 38 28" stroke="${shine}" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>
      <circle cx="36" cy="36" r="4.2" fill="${deep}" stroke="${g}" stroke-width="1.4"/>
      <circle cx="36" cy="36" r="2.1" fill="${core}"/>
      <circle cx="36" cy="36" r=".9" fill="#FFF8D6"/>
      <ellipse cx="29" cy="18" rx="3.2" ry="1.6" fill="${shine}" opacity=".55" transform="rotate(-22 29 18)"/>`;
    case "myosu":
      return `
      <circle cx="36" cy="36" r="20" fill="${deep}" stroke="${g}" stroke-width="2.3"/>
      <circle cx="36" cy="36" r="15.5" fill="none" stroke="${ink}" stroke-width="1.6" opacity=".85"/>
      <path d="M36 16c14 0 18 10 18 18 0 14-10 18-18 18s-16-8-16-16 8-14 16-14 12 6 12 12-5 9-12 9-7-3.5-7-7 2.5-5 7-5"
        fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M36 22c8 0 10 5 10 9 0 7-5 9-10 9s-8-3.5-8-7 3.5-6 8-6"
        fill="none" stroke="${g}" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>
      <circle cx="36" cy="36" r="5" fill="${deep}" stroke="${g}" stroke-width="1.5"/>
      <circle cx="36" cy="36" r="2.6" fill="${core}"/>
      <circle cx="36" cy="36" r="1.1" fill="#FFF8D6"/>
      <path d="M24 24 30 30M48 24 42 30M24 48 30 42M48 48 42 42"
        stroke="${g}" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>
      <ellipse cx="29" cy="20" rx="2.6" ry="1.4" fill="${shine}" opacity=".5"/>`;
    case "gyeongno":
      return `
      <path d="M16 44 36 8 56 44h-10l-10 20-10-20z" fill="${deep}" stroke="${g}" stroke-width="2.1" stroke-linejoin="round"/>
      <path d="M24 42 36 18 48 42h-7l-5 12-5-12z" fill="${ink}" stroke="#5A4214" stroke-width="1.05"/>
      <path d="M20 52h32" stroke="${g}" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M24 58h24" stroke="${ink}" stroke-width="2.1" stroke-linecap="round"/>
      <path d="M28 28 36 16 44 28" fill="none" stroke="${shine}" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>
      <circle cx="36" cy="34" r="3.6" fill="${deep}" stroke="${g}" stroke-width="1.35"/>
      <circle cx="36" cy="34" r="1.7" fill="${core}"/>
      <path d="M18 36 12 30M54 36 60 30" stroke="${g}" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="31" cy="22" rx="2.4" ry="3.2" fill="${shine}" opacity=".6"/>`;
    case "chimtu":
      return `
      <path d="M36 6 56 36 36 66 16 36Z" fill="${deep}" stroke="${g}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M36 14 48 36 36 58 24 36Z" fill="${ink}" stroke="#5A4214" stroke-width="1.05"/>
      <path d="M36 8v10M36 54v10" stroke="${g}" stroke-width="1.9" stroke-linecap="round" opacity=".85"/>
      <path d="M20 28 14 24M52 28 58 24M20 44 14 48M52 44 58 48"
        stroke="${g}" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>
      <circle cx="36" cy="36" r="6.2" fill="${deep}" stroke="${g}" stroke-width="1.7"/>
      <circle cx="36" cy="36" r="3.6" fill="${ink}" stroke="#5A4214" stroke-width=".85"/>
      <circle cx="36" cy="36" r="1.8" fill="${core}"/>
      <circle cx="36" cy="36" r=".85" fill="#FFF8D6"/>
      <ellipse cx="31" cy="22" rx="2.2" ry="3.4" fill="${shine}" opacity=".6"/>`;
    default:
      return `<circle cx="36" cy="36" r="14" fill="${ink}" stroke="${g}" stroke-width="2"/>`;
  }
}

function sharedDefs(uid, accent) {
  return `
    <radialGradient id="${uid}-aura" cx="50%" cy="42%" r="58%">
      <stop stop-color="${accent}" stop-opacity=".62"/>
      <stop offset=".4" stop-color="${accent}" stop-opacity=".22"/>
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
      <stop stop-color="#FFF8E8"/>
      <stop offset=".28" stop-color="${accent}"/>
      <stop offset=".7" stop-color="#E8D9A8"/>
      <stop offset="1" stop-color="#8A7038"/>
    </linearGradient>
    <radialGradient id="${uid}-core" cx="38%" cy="32%" r="70%">
      <stop stop-color="#FFF8D6"/>
      <stop offset=".45" stop-color="${accent}"/>
      <stop offset="1" stop-color="#3A2810"/>
    </radialGradient>
    <radialGradient id="${uid}-deep" cx="40%" cy="30%" r="75%">
      <stop stop-color="#2A2214"/>
      <stop offset=".55" stop-color="#14100A"/>
      <stop offset="1" stop-color="#060408"/>
    </radialGradient>
    <linearGradient id="${uid}-shine" x1="20" y1="14" x2="40" y2="34" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF6D0" stop-opacity=".95"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <filter id="${uid}-depth" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1.4" stdDeviation="1.5" flood-color="#000" flood-opacity=".65"/>
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
    <path d="${edge}" fill="url(#${uid}-bevel)" opacity=".55" fill-rule="evenodd"/>
    <path d="${inner}" fill="url(#${uid}-gem)" stroke="${rarity.dash}" stroke-width="1" stroke-opacity=".55"/>
    <path d="${inner}" fill="none" stroke="#FFF8D6" stroke-width=".7" opacity=".2" transform="translate(0 .35)"/>
    <ellipse cx="27" cy="18" rx="7.5" ry="3.2" fill="url(#${uid}-shine)" transform="rotate(-24 27 18)" opacity=".82"/>
  </g>
</svg>
`;
}

/** Glyph overlay on rarity plate — medallion seat + detailed mark. */
function equippedSvg(set, slot) {
  const uid = `${set.id}s${slot}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
  <defs>
    ${sharedDefs(uid, set.accent)}
  </defs>
  <circle cx="36" cy="36" r="20" fill="url(#${uid}-aura)" opacity=".85"/>
  <circle cx="36" cy="36" r="17.5" fill="url(#${uid}-deep)" stroke="url(#${uid}-gold)" stroke-width="1.6" opacity=".92"/>
  <circle cx="36" cy="36" r="15.2" fill="none" stroke="#FFF8D6" stroke-width=".7" opacity=".22"/>
  <g filter="url(#${uid}-depth)" transform="translate(36 36) scale(0.72) translate(-36 -36)">
    ${glyph(set.id, uid)}
  </g>
</svg>
`;
}


/** Empty socket — premium gold plate with dark well (matches filled plate language). */
function emptySvg(slot) {
  const uid = `emptys${slot}`;
  const { outer, inner, edge } = SLOT[slot];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
  <defs>
    <radialGradient id="${uid}-aura" cx="50%" cy="42%" r="55%">
      <stop stop-color="#C9A227" stop-opacity=".42"/>
      <stop offset=".55" stop-color="#C9A227" stop-opacity=".12"/>
      <stop offset="1" stop-color="#C9A227" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${uid}-face" x1="14" y1="8" x2="58" y2="64" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F0D878"/>
      <stop offset=".32" stop-color="#C9A227"/>
      <stop offset=".68" stop-color="#8A6A20"/>
      <stop offset="1" stop-color="#3A2C10"/>
    </linearGradient>
    <linearGradient id="${uid}-gold" x1="14" y1="10" x2="58" y2="62" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6"/>
      <stop offset=".28" stop-color="#F0D878"/>
      <stop offset=".62" stop-color="#C9A227"/>
      <stop offset="1" stop-color="#7A5A18"/>
    </linearGradient>
    <linearGradient id="${uid}-bevel" x1="16" y1="8" x2="40" y2="30" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6" stop-opacity=".88"/>
      <stop offset="1" stop-color="#C9A227" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${uid}-shine" x1="18" y1="12" x2="42" y2="36" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF6D0" stop-opacity=".9"/>
      <stop offset="1" stop-color="#C9A227" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${uid}-well" cx="40%" cy="32%" r="70%">
      <stop stop-color="#4A3A1C" stop-opacity=".98"/>
      <stop offset=".45" stop-color="#1A140C"/>
      <stop offset="1" stop-color="#050402"/>
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
    <path d="${edge}" fill="url(#${uid}-bevel)" opacity=".58" fill-rule="evenodd"/>
    <path d="${inner}" fill="url(#${uid}-well)" stroke="#C9A227" stroke-width="1.1" stroke-opacity=".55"/>
    <path d="${inner}" fill="none" stroke="#FFF8D6" stroke-width=".7" opacity=".18" transform="translate(0 .35)"/>
    <ellipse cx="27" cy="20" rx="7" ry="3" fill="url(#${uid}-shine)" transform="rotate(-24 27 20)" opacity=".75"/>
    <text x="36" y="41" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, 'Times New Roman', serif" font-size="16" font-weight="700" fill="url(#${uid}-gold)" opacity=".4">${slot}</text>
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
