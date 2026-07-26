/**
 * Generates square skill-slot icons for each monster skill (S1–S3).
 * Output: apps/web/public/art/monster/skill/{monsterId}-s{1|2|3}.svg
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../public/art/monster/skill");
fs.mkdirSync(outDir, { recursive: true });

const EL = {
  fire: { bg: ["#2a1410", "#100806"], accent: ["#FFE2A8", "#E07040", "#8A2818"], glow: "#E07040" },
  water: { bg: ["#102028", "#081018"], accent: ["#C8F0FF", "#4AA8E0", "#185888"], glow: "#4AA8E0" },
  wind: { bg: ["#142418", "#081208"], accent: ["#D8FFE0", "#58C878", "#287848"], glow: "#58C878" },
  light: { bg: ["#282418", "#141008"], accent: ["#FFF4C8", "#E8C84A", "#887818"], glow: "#E8C84A" },
  dark: { bg: ["#1c1428", "#0c0814"], accent: ["#E0D0FF", "#8A68D0", "#402878"], glow: "#8A68D0" },
};

/** @type {Array<{ monsterId: string, element: keyof typeof EL, skills: Array<{ slot: 1|2|3, motif: string }> }>} */
const CATALOG = [
  {
    monsterId: "fire_fang",
    element: "fire",
    skills: [
      { slot: 1, motif: "claws" },
      { slot: 2, motif: "fire_strike" },
      { slot: 3, motif: "inferno" },
    ],
  },
  {
    monsterId: "dew_healer",
    element: "water",
    skills: [
      { slot: 1, motif: "droplet" },
      { slot: 2, motif: "heal_wave" },
      { slot: 3, motif: "purify" },
    ],
  },
  {
    monsterId: "gale_scout",
    element: "wind",
    skills: [
      { slot: 1, motif: "slash" },
      { slot: 2, motif: "slow_wind" },
      { slot: 3, motif: "wind_mark" },
    ],
  },
  {
    monsterId: "shield_tortoise",
    element: "water",
    skills: [
      { slot: 1, motif: "bash" },
      { slot: 2, motif: "taunt" },
      { slot: 3, motif: "ironwall" },
    ],
  },
  {
    monsterId: "ash_archer",
    element: "fire",
    skills: [
      { slot: 1, motif: "arrows" },
      { slot: 2, motif: "weakpoint" },
      { slot: 3, motif: "arrow_rain" },
    ],
  },
  {
    monsterId: "mist_shaman",
    element: "wind",
    skills: [
      { slot: 1, motif: "mist_orb" },
      { slot: 2, motif: "buff_aura" },
      { slot: 3, motif: "regen_mist" },
    ],
  },
  {
    monsterId: "seal_scholar",
    element: "light",
    skills: [
      { slot: 1, motif: "seal_strike" },
      { slot: 2, motif: "seal_point" },
      { slot: 3, motif: "rune_read" },
    ],
  },
  {
    monsterId: "capture_hound",
    element: "dark",
    skills: [
      { slot: 1, motif: "bite" },
      { slot: 2, motif: "chase" },
      { slot: 3, motif: "stone_burst" },
    ],
  },
  {
    monsterId: "thunder_lancer",
    element: "light",
    skills: [
      { slot: 1, motif: "pierce" },
      { slot: 2, motif: "charge" },
      { slot: 3, motif: "thunder" },
    ],
  },
  {
    monsterId: "abyss_priest",
    element: "dark",
    skills: [
      { slot: 1, motif: "curse" },
      { slot: 2, motif: "silence" },
      { slot: 3, motif: "abyss_eye" },
    ],
  },
];

function uid(prefix, monsterId, slot) {
  return `${prefix}_${monsterId}_s${slot}`.replace(/[^a-z0-9_]/gi, "");
}

/** Motif path fragments (64×64 artboard). */
function motifPaths(motif, a1, a2, a3, glow) {
  switch (motif) {
    case "claws":
      return `
      <path d="M18 16L14 44H20L22 28L26 44H32L28 22L34 44H40L36 16H30L26 34L22 16H18Z" fill="url(#${a1})" stroke="${glow}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M42 18L40 42H46L48 18H42Z" fill="url(#${a2})" opacity=".9"/>`;
    case "fire_strike":
      return `
      <path d="M34 8L16 36H30L26 56L50 28H34V8Z" fill="url(#${a1})" stroke="#FFD0A0" stroke-width="1.3" stroke-linejoin="round"/>
      <circle cx="24" cy="22" r="3" fill="#FFE2A8" opacity=".8"/>`;
    case "inferno":
      return `
      <ellipse cx="32" cy="46" rx="18" ry="6" fill="${glow}" opacity=".25"/>
      <path d="M32 10C24 22 18 28 18 38C18 46 24 52 32 52C40 52 46 46 46 38C46 28 40 22 32 10Z" fill="url(#${a1})" stroke="#FFD0A0" stroke-width="1.2"/>
      <path d="M32 22C28 28 26 32 26 38C26 42 28 45 32 45C36 45 38 42 38 38C38 32 36 28 32 22Z" fill="#FFE2A8" opacity=".55"/>`;
    case "droplet":
      return `
      <path d="M32 10C32 10 18 28 18 40C18 48 24 54 32 54C40 54 46 48 46 40C46 28 32 10 32 10Z" fill="url(#${a1})" stroke="#C8F0FF" stroke-width="1.3"/>
      <ellipse cx="26" cy="34" rx="4" ry="6" fill="#fff" opacity=".35"/>`;
    case "heal_wave":
      return `
      <path d="M10 40C18 28 24 28 32 40C40 52 46 52 54 40" stroke="url(#${a1})" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M10 30C18 18 24 18 32 30C40 42 46 42 54 30" stroke="${glow}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>
      <circle cx="32" cy="22" r="5" fill="#C8F0FF"/>
      <path d="M32 18V26M28 22H36" stroke="#185888" stroke-width="2" stroke-linecap="round"/>`;
    case "purify":
      return `
      <circle cx="32" cy="32" r="16" fill="url(#${a1})" opacity=".35"/>
      <path d="M32 14L36 28L50 28L38 36L42 50L32 42L22 50L26 36L14 28L28 28Z" fill="url(#${a2})" stroke="#C8F0FF" stroke-width="1.2" stroke-linejoin="round"/>`;
    case "slash":
      return `
      <path d="M12 48L48 12" stroke="url(#${a1})" stroke-width="7" stroke-linecap="round"/>
      <path d="M16 52L52 16" stroke="#D8FFE0" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
      <path d="M20 44L44 20" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>`;
    case "slow_wind":
      return `
      <circle cx="32" cy="32" r="18" fill="none" stroke="url(#${a1})" stroke-width="3" stroke-dasharray="6 5"/>
      <path d="M22 32H42M32 22V42" stroke="${glow}" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>
      <path d="M18 26C26 20 38 20 46 26" stroke="#D8FFE0" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M18 38C26 44 38 44 46 38" stroke="#D8FFE0" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case "wind_mark":
      return `
      <path d="M32 12L40 28L56 30L44 42L48 58L32 48L16 58L20 42L8 30L24 28Z" fill="url(#${a1})" stroke="#D8FFE0" stroke-width="1.2" stroke-linejoin="round"/>
      <circle cx="32" cy="34" r="6" fill="#081208" stroke="${glow}" stroke-width="2"/>`;
    case "bash":
      return `
      <ellipse cx="32" cy="40" rx="16" ry="10" fill="url(#${a1})"/>
      <rect x="22" y="16" width="20" height="24" rx="6" fill="url(#${a2})" stroke="#C8F0FF" stroke-width="1.2"/>
      <path d="M26 28H38M26 34H38" stroke="#185888" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
    case "taunt":
      return `
      <path d="M32 14L48 48H16L32 14Z" fill="url(#${a1})" stroke="#C8F0FF" stroke-width="1.3" stroke-linejoin="round"/>
      <circle cx="32" cy="36" r="3.5" fill="#102028"/>
      <rect x="30.5" y="24" width="3" height="8" rx="1.5" fill="#102028"/>`;
    case "ironwall":
      return `
      <path d="M32 10L50 18V34C50 46 40 54 32 56C24 54 14 46 14 34V18L32 10Z" fill="url(#${a1})" stroke="#C8F0FF" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M32 18L42 22V34C42 42 36 48 32 50C28 48 22 42 22 34V22L32 18Z" fill="#fff" opacity=".18"/>
      <path d="M26 32H38M32 26V38" stroke="#185888" stroke-width="2.2" stroke-linecap="round"/>`;
    case "arrows":
      return `
      <path d="M18 40L40 18L46 24L24 46L18 40Z" fill="url(#${a1})"/>
      <path d="M40 18L50 14L46 24" fill="url(#${a2})" stroke="#FFE2A8" stroke-width="1"/>
      <path d="M22 44L14 52" stroke="#FFE2A8" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M14 36L28 22" stroke="${glow}" stroke-width="2" stroke-linecap="round" opacity=".55"/>`;
    case "weakpoint":
      return `
      <circle cx="32" cy="32" r="18" fill="none" stroke="url(#${a1})" stroke-width="3"/>
      <circle cx="32" cy="32" r="10" fill="none" stroke="${glow}" stroke-width="2"/>
      <circle cx="32" cy="32" r="3.5" fill="#FFE2A8"/>
      <path d="M32 10V18M32 46V54M10 32H18M46 32H54" stroke="#FFE2A8" stroke-width="2.2" stroke-linecap="round"/>`;
    case "arrow_rain":
      return `
      <path d="M20 14L24 28L18 28L26 44" stroke="url(#${a1})" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M32 10L36 26L30 26L38 44" stroke="url(#${a2})" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M44 14L48 28L42 28L50 44" stroke="url(#${a1})" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M16 50H48" stroke="${glow}" stroke-width="2" stroke-linecap="round" opacity=".45"/>`;
    case "mist_orb":
      return `
      <circle cx="32" cy="32" r="16" fill="url(#${a1})" opacity=".85"/>
      <circle cx="26" cy="28" r="5" fill="#fff" opacity=".28"/>
      <path d="M14 44C20 38 28 38 32 44C36 50 44 50 50 44" stroke="#D8FFE0" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>`;
    case "buff_aura":
      return `
      <circle cx="32" cy="34" r="14" fill="url(#${a1})" opacity=".4"/>
      <path d="M32 12L36 24H48L38 32L42 44L32 36L22 44L26 32L16 24H28Z" fill="url(#${a2})" stroke="#D8FFE0" stroke-width="1.1"/>
      <path d="M32 28V40M26 34H38" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`;
    case "regen_mist":
      return `
      <path d="M12 42C18 30 26 30 32 42C38 54 46 54 52 42" fill="url(#${a1})" opacity=".45"/>
      <path d="M16 34C22 24 28 24 32 34C36 44 42 44 48 34" stroke="${glow}" stroke-width="2.5" fill="none"/>
      <circle cx="32" cy="22" r="7" fill="url(#${a2})"/>
      <path d="M32 17V27M27 22H37" stroke="#081208" stroke-width="2.2" stroke-linecap="round"/>`;
    case "seal_strike":
      return `
      <rect x="18" y="18" width="28" height="28" rx="4" fill="url(#${a1})" stroke="#FFF4C8" stroke-width="1.4" transform="rotate(12 32 32)"/>
      <path d="M26 32H38M32 26V38" stroke="#141008" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="5" fill="none" stroke="#FFF4C8" stroke-width="1.5"/>`;
    case "seal_point":
      return `
      <circle cx="32" cy="32" r="20" fill="none" stroke="url(#${a1})" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="4" fill="#FFF4C8"/>
      <path d="M32 12V22M32 42V52M12 32H22M42 32H52" stroke="${glow}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M20 20L26 26M44 20L38 26M20 44L26 38M44 44L38 38" stroke="#FFF4C8" stroke-width="1.6" stroke-linecap="round"/>`;
    case "rune_read":
      return `
      <rect x="14" y="12" width="36" height="40" rx="4" fill="url(#${a1})" stroke="#FFF4C8" stroke-width="1.3"/>
      <path d="M22 22H42M22 30H38M22 38H42" stroke="#141008" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
      <circle cx="40" cy="30" r="3" fill="#FFF4C8"/>`;
    case "bite":
      return `
      <path d="M16 28C16 20 24 14 32 14C40 14 48 20 48 28V34C42 30 36 30 32 34C28 30 22 30 16 34V28Z" fill="url(#${a1})" stroke="#E0D0FF" stroke-width="1.2"/>
      <path d="M20 36L24 48L28 38L32 50L36 38L40 48L44 36" fill="url(#${a2})" stroke="#E0D0FF" stroke-width="1"/>`;
    case "chase":
      return `
      <path d="M14 36L28 20L34 26L20 42Z" fill="url(#${a1})"/>
      <path d="M30 32L44 18L50 24L36 38Z" fill="url(#${a2})" opacity=".85"/>
      <path d="M22 46H48" stroke="${glow}" stroke-width="3" stroke-linecap="round" opacity=".5"/>
      <path d="M40 40L52 40L46 48Z" fill="#E0D0FF"/>`;
    case "stone_burst":
      return `
      <circle cx="32" cy="32" r="8" fill="url(#${a1})" stroke="#E0D0FF" stroke-width="1.3"/>
      <path d="M32 12L34 24L32 22L30 24Z" fill="#E0D0FF"/>
      <path d="M52 32L40 34L42 32L40 30Z" fill="#E0D0FF"/>
      <path d="M32 52L30 40L32 42L34 40Z" fill="#E0D0FF"/>
      <path d="M12 32L24 30L22 32L24 34Z" fill="#E0D0FF"/>
      <path d="M46 18L38 26M18 18L26 26M18 46L26 38M46 46L38 38" stroke="${glow}" stroke-width="2.2" stroke-linecap="round"/>`;
    case "pierce":
      return `
      <path d="M14 40L42 12L50 20L22 48Z" fill="url(#${a1})" stroke="#FFF4C8" stroke-width="1.2"/>
      <path d="M42 12L54 8L50 20" fill="url(#${a2})"/>
      <path d="M18 44L10 54" stroke="#FFF4C8" stroke-width="2.4" stroke-linecap="round"/>`;
    case "charge":
      return `
      <path d="M12 34L36 18L44 26L28 40L40 44L20 52L24 40Z" fill="url(#${a1})" stroke="#FFF4C8" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M40 20L54 14" stroke="${glow}" stroke-width="3" stroke-linecap="round"/>
      <path d="M38 28L50 24" stroke="#FFF4C8" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
    case "thunder":
      return `
      <path d="M34 8L18 34H30L26 56L48 28H34V8Z" fill="url(#${a1})" stroke="#FFF4C8" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M44 12L48 20M50 16L54 22" stroke="#FFF4C8" stroke-width="2" stroke-linecap="round" opacity=".75"/>`;
    case "curse":
      return `
      <path d="M32 12C24 12 18 20 18 30C18 42 28 52 32 54C36 52 46 42 46 30C46 20 40 12 32 12Z" fill="url(#${a1})" stroke="#E0D0FF" stroke-width="1.3"/>
      <path d="M26 28C28 24 36 24 38 28" stroke="#0c0814" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <circle cx="26" cy="26" r="2.2" fill="#0c0814"/>
      <circle cx="38" cy="26" r="2.2" fill="#0c0814"/>
      <path d="M26 38C28 42 36 42 38 38" stroke="#0c0814" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    case "silence":
      return `
      <circle cx="32" cy="28" r="12" fill="url(#${a1})" stroke="#E0D0FF" stroke-width="1.3"/>
      <path d="M24 42H40V46C40 50 36 52 32 52C28 52 24 50 24 46V42Z" fill="url(#${a2})"/>
      <path d="M20 20L44 44" stroke="#E0D0FF" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M20 20L44 44" stroke="#0c0814" stroke-width="1.4" stroke-linecap="round"/>`;
    case "abyss_eye":
      return `
      <ellipse cx="32" cy="32" rx="22" ry="14" fill="url(#${a1})" stroke="#E0D0FF" stroke-width="1.4"/>
      <circle cx="32" cy="32" r="8" fill="#0c0814" stroke="${glow}" stroke-width="2"/>
      <circle cx="32" cy="32" r="3.5" fill="#E0D0FF"/>
      <circle cx="34" cy="30" r="1.2" fill="#fff"/>`;
    default:
      return `<circle cx="32" cy="32" r="14" fill="url(#${a1})"/>`;
  }
}

function buildSvg(monsterId, element, slot, motif) {
  const pal = EL[element];
  const idBg = uid("bg", monsterId, slot);
  const idA1 = uid("a1", monsterId, slot);
  const idA2 = uid("a2", monsterId, slot);
  const idA3 = uid("a3", monsterId, slot);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="${idBg}" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
      <stop stop-color="${pal.bg[0]}"/><stop offset="1" stop-color="${pal.bg[1]}"/>
    </linearGradient>
    <linearGradient id="${idA1}" x1="16" y1="10" x2="50" y2="54" gradientUnits="userSpaceOnUse">
      <stop stop-color="${pal.accent[0]}"/><stop offset=".45" stop-color="${pal.accent[1]}"/><stop offset="1" stop-color="${pal.accent[2]}"/>
    </linearGradient>
    <linearGradient id="${idA2}" x1="20" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
      <stop stop-color="${pal.accent[0]}"/><stop offset="1" stop-color="${pal.accent[1]}"/>
    </linearGradient>
    <linearGradient id="${idA3}" x1="24" y1="18" x2="44" y2="46" gradientUnits="userSpaceOnUse">
      <stop stop-color="${pal.accent[1]}"/><stop offset="1" stop-color="${pal.accent[2]}"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#${idBg})"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" stroke="${pal.glow}" stroke-opacity=".35" stroke-width="1.5"/>
  <circle cx="32" cy="32" r="24" fill="${pal.glow}" fill-opacity=".10"/>
  ${motifPaths(motif, idA1, idA2, idA3, pal.glow)}
</svg>
`;
}

let count = 0;
for (const mon of CATALOG) {
  for (const sk of mon.skills) {
    const file = path.join(outDir, `${mon.monsterId}-s${sk.slot}.svg`);
    fs.writeFileSync(file, buildSvg(mon.monsterId, mon.element, sk.slot, sk.motif), "utf8");
    count += 1;
  }
}

console.log(`wrote ${count} skill icons -> ${outDir}`);
