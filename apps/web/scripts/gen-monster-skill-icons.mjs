/**
 * Skill icons: element-colored frame/bg + role/skill motif (no ornate junk).
 * Output:
 *   /art/monster/skill/{familyId}-{element}-s{1|2|3}.svg
 *   /art/ui/skill/{damage,heal,mana,shield}.svg
 *   /art/summoner/skill/{skillId}.svg
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monsterOut = path.resolve(__dirname, "../public/art/monster/skill");
const uiOut = path.resolve(__dirname, "../public/art/ui/skill");
const summonerOut = path.resolve(__dirname, "../public/art/summoner/skill");
for (const d of [monsterOut, uiOut, summonerOut]) fs.mkdirSync(d, { recursive: true });

const ELEMENTS = ["fire", "water", "wind", "light", "dark"];

/** @type {Record<string, { bg: string[], frame: string[], accent: string[], glow: string, gem: string }>} */
const EL = {
  fire: {
    bg: ["#3a1810", "#140806"],
    frame: ["#FFB06A", "#E07040", "#8A2818"],
    accent: ["#FFE2A8", "#FF7A3A", "#B03018"],
    glow: "#FF6A30",
    gem: "#FF6A3A",
  },
  water: {
    bg: ["#102838", "#061018"],
    frame: ["#A8E8FF", "#3AA8E0", "#185888"],
    accent: ["#E0F8FF", "#4AB8F0", "#1878A8"],
    glow: "#3EC8FF",
    gem: "#3EC8FF",
  },
  wind: {
    bg: ["#142818", "#081208"],
    frame: ["#B8FFC8", "#48C870", "#287848"],
    accent: ["#E0FFE8", "#58D878", "#289858"],
    glow: "#58E088",
    gem: "#5EE08A",
  },
  light: {
    bg: ["#2c2410", "#141008"],
    frame: ["#FFF0A8", "#E8C84A", "#887818"],
    accent: ["#FFF8D0", "#F0D060", "#A89028"],
    glow: "#F0D050",
    gem: "#FFE26A",
  },
  dark: {
    bg: ["#221430", "#0c0814"],
    frame: ["#D8C0FF", "#8A68D0", "#402878"],
    accent: ["#F0E4FF", "#A078E8", "#583898"],
    glow: "#A078F0",
    gem: "#B48CFF",
  },
};

/** familyId → role (from FAMILY_ROSTER). */
const FAMILIES = [
  ["stone_golem", "tank"],
  ["forest_sprite", "support"],
  ["venom_stinger", "debuffer"],
  ["cinder_imp", "attacker"],
  ["dew_slime", "support"],
  ["gale_bat", "debuffer"],
  ["sand_lizard", "attacker"],
  ["moss_turtle", "tank"],
  ["crow_scout", "capturer"],
  ["bone_thrall", "attacker"],
  ["mace_soldier", "tank"],
  ["heal_priest", "support"],
  ["magic_archer", "attacker"],
  ["shadow_thief", "debuffer"],
  ["thunder_spear", "attacker"],
  ["frost_witch", "debuffer"],
  ["stone_fist", "tank"],
  ["herb_alchemist", "support"],
  ["capture_hound", "capturer"],
  ["seal_apprentice", "stonesage"],
  ["flame_warrior", "attacker"],
  ["abyss_pirate", "attacker"],
  ["gale_rider", "attacker"],
  ["sanctuary_guard", "tank"],
  ["abyss_hexer", "debuffer"],
  ["dew_healer", "support"],
  ["seal_elder", "stonesage"],
  ["wolf_fighter", "attacker"],
  ["lotus_dancer", "support"],
  ["scout_sniper", "debuffer"],
  ["steel_armor", "tank"],
  ["mana_captor", "capturer"],
  ["magma_knight", "attacker"],
  ["glacier_mage", "debuffer"],
  ["storm_spearmaster", "attacker"],
  ["angel_healer", "support"],
  ["demon_hexer", "debuffer"],
  ["rune_scholar", "stonesage"],
  ["golden_guardian", "tank"],
  ["shadow_assassin", "attacker"],
  ["holy_judge", "debuffer"],
  ["abyss_priest", "debuffer"],
  ["wyrm_rider", "attacker"],
  ["capture_lord", "capturer"],
  ["dragon_knight", "attacker"],
  ["primordial_hierophant", "stonesage"],
  ["doom_oracle", "debuffer"],
  ["sky_warden", "tank"],
  ["eternal_healer", "support"],
  ["absolute_captor", "capturer"],
];

/** Role × slot → motif matching skill name suffixes (타격/치유/도발…). */
const ROLE_MOTIFS = {
  attacker: ["strike", "heavy_blow", "burst"],
  support: ["bolt", "heal_cross", "aegis"],
  tank: ["crush", "taunt", "barrier"],
  debuffer: ["curse", "weaken", "rupture"],
  capturer: ["snare", "track", "bind"],
  stonesage: ["seal", "siphon", "gate"],
};

function uid(prefix, key) {
  return `${prefix}_${String(key)}`.replace(/[^a-z0-9_]/gi, "");
}

/** Rich motifs on 64×64 board (centered into 128). */
function motifPaths(motif, a1, a2, glow) {
  switch (motif) {
    case "strike":
      return `
      <path d="M14 42L40 10L50 18L28 46Z" fill="url(#${a1})" stroke="${glow}" stroke-width="1.4"/>
      <path d="M40 10L54 6L50 18" fill="url(#${a2})"/>
      <path d="M18 48L10 58" stroke="${glow}" stroke-width="3" stroke-linecap="round"/>
      <path d="M22 36L34 22" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>`;
    case "heavy_blow":
      return `
      <path d="M18 14L12 48H20L23 30L28 48H36L31 22L38 48H46L40 14H32L28 36L23 14H18Z" fill="url(#${a1})" stroke="${glow}" stroke-width="1.3" stroke-linejoin="round"/>
      <circle cx="48" cy="20" r="3" fill="#fff" opacity=".55"/>
      <circle cx="52" cy="28" r="1.8" fill="${glow}" opacity=".7"/>`;
    case "burst":
      return `
      <ellipse cx="32" cy="48" rx="18" ry="6" fill="${glow}" opacity=".28"/>
      <path d="M32 8C22 22 14 30 14 40C14 50 22 56 32 56C42 56 50 50 50 40C50 30 42 22 32 8Z" fill="url(#${a1})" stroke="${glow}" stroke-width="1.4"/>
      <path d="M32 18C26 28 22 34 22 40C22 46 26 50 32 50C38 50 42 46 42 40C42 34 38 28 32 18Z" fill="#fff" opacity=".35"/>
      <path d="M48 14L54 10M50 22L58 20" stroke="${glow}" stroke-width="2" stroke-linecap="round" opacity=".75"/>`;
    case "bolt":
      return `
      <path d="M28 8L14 34H27L22 56L48 26H33L38 8H28Z" fill="url(#${a1})" stroke="${glow}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M30 14L22 30H30L28 42L40 26H32L34 14H30Z" fill="#fff" opacity=".28"/>`;
    case "heal_cross":
      return `
      <circle cx="32" cy="32" r="20" fill="url(#${a1})" opacity=".28"/>
      <path d="M14 42C20 30 28 30 32 42C36 54 44 54 50 42" stroke="url(#${a2})" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".8"/>
      <rect x="26" y="16" width="12" height="32" rx="3" fill="url(#${a1})"/>
      <rect x="16" y="26" width="32" height="12" rx="3" fill="url(#${a1})"/>
      <rect x="28" y="18" width="8" height="28" rx="2" fill="#fff" opacity=".35"/>
      <rect x="18" y="28" width="28" height="8" rx="2" fill="#fff" opacity=".35"/>`;
    case "aegis":
      return `
      <path d="M32 10L50 18V34C50 46 40 54 32 56C24 54 14 46 14 34V18L32 10Z" fill="url(#${a1})" stroke="${glow}" stroke-width="1.5"/>
      <path d="M32 16L44 22V34C44 43 37 50 32 52C27 50 20 43 20 34V22L32 16Z" fill="#fff" opacity=".18"/>
      <path d="M26 30H38M32 24V40" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>`;
    case "crush":
      return `
      <ellipse cx="32" cy="44" rx="18" ry="10" fill="url(#${a1})" opacity=".85"/>
      <rect x="20" y="12" width="24" height="30" rx="7" fill="url(#${a2})" stroke="${glow}" stroke-width="1.4"/>
      <path d="M25 24H39M25 32H39" stroke="#081018" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
      <path d="M16 48H48" stroke="${glow}" stroke-width="2.5" stroke-linecap="round" opacity=".4"/>`;
    case "taunt":
      return `
      <path d="M32 10L52 50H12L32 10Z" fill="url(#${a1})" stroke="${glow}" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="32" cy="38" r="4" fill="#0a0810"/>
      <rect x="30" y="22" width="4" height="10" rx="2" fill="#0a0810"/>
      <path d="M18 52H46" stroke="${glow}" stroke-width="2" stroke-linecap="round" opacity=".35"/>`;
    case "barrier":
      return `
      <path d="M32 8L54 18V36C54 50 42 58 32 60C22 58 10 50 10 36V18L32 8Z" fill="url(#${a1})" stroke="${glow}" stroke-width="1.5"/>
      <path d="M32 16L46 22V36C46 46 38 52 32 54C26 52 18 46 18 36V22L32 16Z" fill="#fff" opacity=".16"/>
      <path d="M24 34H40M32 26V42" stroke="#fff" stroke-width="2.8" stroke-linecap="round" opacity=".8"/>`;
    case "curse":
      return `
      <path d="M32 8C22 8 14 18 14 30C14 44 26 56 32 58C38 56 50 44 50 30C50 18 42 8 32 8Z" fill="url(#${a1})" stroke="${glow}" stroke-width="1.4"/>
      <path d="M24 28C27 22 37 22 40 28" stroke="#0a0810" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <circle cx="24" cy="24" r="2.4" fill="#0a0810"/>
      <circle cx="40" cy="24" r="2.4" fill="#0a0810"/>
      <path d="M24 40C27 46 37 46 40 40" stroke="#0a0810" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    case "weaken":
      return `
      <circle cx="32" cy="32" r="18" fill="none" stroke="url(#${a1})" stroke-width="3.2"/>
      <path d="M20 20L44 44M44 20L20 44" stroke="url(#${a2})" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M20 20L44 44M44 20L20 44" stroke="#0a0810" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="5" fill="${glow}" opacity=".85"/>`;
    case "rupture":
      return `
      <path d="M10 50L28 18L36 24L22 50Z" fill="url(#${a1})"/>
      <path d="M28 44L46 12L54 18L40 46Z" fill="url(#${a2})" opacity=".9"/>
      <path d="M18 54H50" stroke="${glow}" stroke-width="2.6" stroke-linecap="round" opacity=".45"/>
      <circle cx="48" cy="16" r="2.2" fill="#fff" opacity=".55"/>`;
    case "snare":
      return `
      <circle cx="32" cy="32" r="18" fill="none" stroke="url(#${a1})" stroke-width="2.8"/>
      <circle cx="32" cy="32" r="10" fill="none" stroke="${glow}" stroke-width="2"/>
      <path d="M32 8V18M32 46V56M8 32H18M46 32H56" stroke="url(#${a2})" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="3.5" fill="#fff"/>`;
    case "track":
      return `
      <path d="M12 40L28 16L36 24L22 44Z" fill="url(#${a1})"/>
      <path d="M30 36L46 14L54 22L40 42Z" fill="url(#${a2})" opacity=".88"/>
      <path d="M16 50H52" stroke="${glow}" stroke-width="3" stroke-linecap="round" opacity=".45"/>
      <path d="M44 44L56 44L50 52Z" fill="#fff" opacity=".75"/>`;
    case "bind":
      return `
      <ellipse cx="32" cy="32" rx="22" ry="14" fill="url(#${a1})" opacity=".35"/>
      <path d="M14 24C22 18 42 18 50 24" stroke="url(#${a2})" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M14 32C22 26 42 26 50 32" stroke="${glow}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M14 40C22 34 42 34 50 40" stroke="url(#${a2})" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="5" fill="#fff" opacity=".7"/>`;
    case "seal":
      return `
      <rect x="14" y="14" width="36" height="36" rx="5" fill="url(#${a1})" stroke="${glow}" stroke-width="1.5" transform="rotate(12 32 32)"/>
      <circle cx="32" cy="32" r="8" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>
      <path d="M26 32H38M32 26V38" stroke="#0a0810" stroke-width="2.4" stroke-linecap="round"/>`;
    case "siphon":
      return `
      <circle cx="32" cy="28" r="14" fill="url(#${a1})" opacity=".9"/>
      <circle cx="27" cy="24" r="4.5" fill="#fff" opacity=".3"/>
      <path d="M20 44C26 36 38 36 44 44" stroke="url(#${a2})" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M32 40V54" stroke="${glow}" stroke-width="3" stroke-linecap="round"/>
      <path d="M26 50H38" stroke="${glow}" stroke-width="2.4" stroke-linecap="round"/>`;
    case "gate":
      return `
      <path d="M16 12H48V52H16Z" fill="url(#${a1})" opacity=".25"/>
      <path d="M20 14H30V50H20Z" fill="url(#${a2})" stroke="${glow}" stroke-width="1.3"/>
      <path d="M34 14H44V50H34Z" fill="url(#${a2})" stroke="${glow}" stroke-width="1.3"/>
      <circle cx="32" cy="32" r="6" fill="${glow}"/>
      <circle cx="32" cy="32" r="2.5" fill="#fff" opacity=".8"/>`;
    case "open_gate":
      return motifPaths("gate", a1, a2, glow);
    case "declare":
      return `
      <path d="M32 8L50 20V40L32 52L14 40V20Z" fill="url(#${a1})" stroke="${glow}" stroke-width="1.4"/>
      <path d="M32 18V42M24 28H40" stroke="#0a0810" stroke-width="2.8" stroke-linecap="round"/>`;
    case "dual_cast":
      return `
      <circle cx="22" cy="32" r="13" fill="url(#${a1})" opacity=".9"/>
      <circle cx="42" cy="32" r="13" fill="url(#${a2})" opacity=".9"/>
      <path d="M22 32H42" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`;
    case "cleanse":
      return `
      <circle cx="32" cy="32" r="18" fill="none" stroke="url(#${a1})" stroke-width="3"/>
      <path d="M20 32L28 40L46 20" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "guard":
      return motifPaths("barrier", a1, a2, glow);
    case "amplify":
      return `
      <path d="M12 42L32 10L52 42Z" fill="url(#${a1})" stroke="${glow}" stroke-width="1.4"/>
      <path d="M20 42L32 22L44 42" fill="url(#${a2})" opacity=".7"/>
      <path d="M32 28V50" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`;
    case "freeze":
      return `
      <path d="M32 8V56M12 18L52 46M52 18L12 46" stroke="url(#${a1})" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="8" fill="url(#${a2})" opacity=".8"/>`;
    case "haste":
      return `
      <path d="M12 38L30 12L38 22L28 36H52L34 58L26 48L36 38Z" fill="url(#${a1})" stroke="${glow}" stroke-width="1.3"/>`;
    case "mana_orb":
      return `
      <circle cx="32" cy="32" r="18" fill="url(#${a1})" opacity=".85"/>
      <circle cx="26" cy="26" r="6" fill="#fff" opacity=".3"/>
      <path d="M22 40H42M26 46H38" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/>`;
    case "shield":
      return motifPaths("barrier", a1, a2, glow);
    case "damage":
      return motifPaths("strike", a1, a2, glow);
    case "heal":
      return motifPaths("heal_cross", a1, a2, glow);
    default:
      return `<circle cx="32" cy="32" r="16" fill="url(#${a1})" stroke="${glow}" stroke-width="1.5"/>`;
  }
}

/**
 * Clean element frame: metallic border + dark bg. No rune rings / gold studs / flourishes.
 */
function buildSvg(key, element, motif) {
  const pal = EL[element] ?? EL.light;
  const idBg = uid("bg", key);
  const idA1 = uid("a1", key);
  const idA2 = uid("a2", key);
  const idGlow = uid("gl", key);
  const idFrame = uid("fr", key);
  const idFrameDark = uid("fd", key);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="${idBg}" x1="20" y1="16" x2="108" y2="112" gradientUnits="userSpaceOnUse">
      <stop stop-color="${pal.bg[0]}"/><stop offset="1" stop-color="${pal.bg[1]}"/>
    </linearGradient>
    <radialGradient id="${idGlow}" cx="50%" cy="45%" r="45%">
      <stop stop-color="${pal.glow}" stop-opacity=".40"/><stop offset="1" stop-color="${pal.glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${idA1}" x1="28" y1="16" x2="100" y2="108" gradientUnits="userSpaceOnUse">
      <stop stop-color="${pal.accent[0]}"/><stop offset=".45" stop-color="${pal.accent[1]}"/><stop offset="1" stop-color="${pal.accent[2]}"/>
    </linearGradient>
    <linearGradient id="${idA2}" x1="36" y1="24" x2="96" y2="100" gradientUnits="userSpaceOnUse">
      <stop stop-color="${pal.accent[0]}"/><stop offset="1" stop-color="${pal.accent[1]}"/>
    </linearGradient>
    <linearGradient id="${idFrame}" x1="8" y1="6" x2="120" y2="122" gradientUnits="userSpaceOnUse">
      <stop stop-color="${pal.frame[0]}"/><stop offset=".45" stop-color="${pal.frame[1]}"/><stop offset="1" stop-color="${pal.frame[2]}"/>
    </linearGradient>
    <linearGradient id="${idFrameDark}" x1="24" y1="24" x2="104" y2="104" gradientUnits="userSpaceOnUse">
      <stop stop-color="${pal.frame[2]}"/><stop offset="1" stop-color="${pal.frame[1]}"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="16" fill="url(#${idBg})"/>
  <circle cx="64" cy="60" r="36" fill="url(#${idGlow})"/>
  <g transform="translate(32,30)">${motifPaths(motif, idA1, idA2, pal.glow)}</g>
  <rect x="5" y="5" width="118" height="118" rx="14" fill="none" stroke="url(#${idFrame})" stroke-width="6"/>
  <rect x="10" y="10" width="108" height="108" rx="11" fill="none" stroke="url(#${idFrameDark})" stroke-width="2"/>
  <rect x="13" y="13" width="102" height="102" rx="9" fill="none" stroke="#050308" stroke-opacity=".55" stroke-width="1.5"/>
</svg>
`;
}

let monsterCount = 0;
for (const [familyId, role] of FAMILIES) {
  const motifs = ROLE_MOTIFS[role] ?? ROLE_MOTIFS.attacker;
  for (const el of ELEMENTS) {
    for (let slot = 1; slot <= 3; slot++) {
      const motif = motifs[slot - 1];
      const key = `${familyId}_${el}_s${slot}`;
      const file = path.join(monsterOut, `${familyId}-${el}-s${slot}.svg`);
      fs.writeFileSync(file, buildSvg(key, el, motif), "utf8");
      monsterCount += 1;
    }
  }
  // Family default (no element) → mid/natural look using light for fallbacks
  for (let slot = 1; slot <= 3; slot++) {
    const motif = motifs[slot - 1];
    const key = `${familyId}_s${slot}`;
    fs.writeFileSync(
      path.join(monsterOut, `${familyId}-s${slot}.svg`),
      buildSvg(key, "light", motif),
      "utf8",
    );
  }
}

const UI_SKILLS = [
  { id: "damage", element: "fire", motif: "damage" },
  { id: "heal", element: "water", motif: "heal" },
  { id: "mana", element: "light", motif: "mana_orb" },
  { id: "shield", element: "wind", motif: "shield" },
];
for (const u of UI_SKILLS) {
  fs.writeFileSync(
    path.join(uiOut, `${u.id}.svg`),
    buildSvg(`ui_${u.id}`, u.element, u.motif),
    "utf8",
  );
}

const SUMMONER_SKILLS = [
  { id: "open", element: "light", motif: "gate" },
  { id: "declare", element: "fire", motif: "declare" },
  { id: "dual", element: "wind", motif: "dual_cast" },
  { id: "clean", element: "water", motif: "cleanse" },
  { id: "guard", element: "light", motif: "guard" },
  { id: "fire_open", element: "fire", motif: "gate" },
  { id: "fire_rage", element: "fire", motif: "amplify" },
  { id: "fire_scorch", element: "fire", motif: "burst" },
  { id: "fire_magma", element: "fire", motif: "heavy_blow" },
  { id: "fire_charge", element: "fire", motif: "track" },
  { id: "fire_amp", element: "fire", motif: "amplify" },
  { id: "fire_nova", element: "fire", motif: "burst" },
  { id: "fire_meteor", element: "fire", motif: "heavy_blow" },
  { id: "fire_bloodlust", element: "fire", motif: "amplify" },
  { id: "fire_overheat", element: "fire", motif: "declare" },
  { id: "water_open", element: "water", motif: "gate" },
  { id: "water_heal", element: "water", motif: "heal_cross" },
  { id: "water_freeze", element: "water", motif: "freeze" },
  { id: "water_tide", element: "water", motif: "siphon" },
  { id: "water_veil", element: "water", motif: "barrier" },
  { id: "water_cycle", element: "water", motif: "mana_orb" },
  { id: "water_abyss", element: "water", motif: "freeze" },
  { id: "water_geyser", element: "water", motif: "burst" },
  { id: "water_bastion", element: "water", motif: "barrier" },
  { id: "water_spring", element: "water", motif: "heal_cross" },
  { id: "wind_open", element: "wind", motif: "gate" },
  { id: "wind_dual", element: "wind", motif: "dual_cast" },
  { id: "wind_storm", element: "wind", motif: "burst" },
  { id: "wind_blade", element: "wind", motif: "strike" },
  { id: "wind_clean", element: "wind", motif: "cleanse" },
  { id: "wind_haste", element: "wind", motif: "haste" },
  { id: "wind_tempest", element: "wind", motif: "burst" },
  { id: "wind_pierce", element: "wind", motif: "strike" },
  { id: "wind_purge", element: "wind", motif: "cleanse" },
  { id: "wind_gale", element: "wind", motif: "haste" },
  { id: "light_open", element: "light", motif: "gate" },
  { id: "light_guard", element: "light", motif: "guard" },
  { id: "light_judge", element: "light", motif: "aegis" },
  { id: "light_smite", element: "light", motif: "bolt" },
  { id: "light_bind", element: "light", motif: "bind" },
  { id: "light_aegis", element: "light", motif: "barrier" },
  { id: "light_radiance", element: "light", motif: "burst" },
  { id: "light_lance", element: "light", motif: "bolt" },
  { id: "light_renew", element: "light", motif: "heal_cross" },
  { id: "light_sanctum", element: "light", motif: "aegis" },
  { id: "dark_open", element: "dark", motif: "gate" },
  { id: "dark_curse", element: "dark", motif: "curse" },
  { id: "dark_void", element: "dark", motif: "rupture" },
  { id: "dark_drain", element: "dark", motif: "siphon" },
  { id: "dark_despair", element: "dark", motif: "weaken" },
  { id: "dark_veil", element: "dark", motif: "mana_orb" },
  { id: "dark_rift", element: "dark", motif: "rupture" },
  { id: "dark_reap", element: "dark", motif: "strike" },
  { id: "dark_hex", element: "dark", motif: "curse" },
  { id: "dark_eclipse", element: "dark", motif: "weaken" },
];
for (const s of SUMMONER_SKILLS) {
  fs.writeFileSync(
    path.join(summonerOut, `${s.id}.svg`),
    buildSvg(`sum_${s.id}`, s.element, s.motif),
    "utf8",
  );
}

console.log(
  `wrote ${monsterCount} element skill SVGs (+${FAMILIES.length * 3} family defaults), ${UI_SKILLS.length} ui, ${SUMMONER_SKILLS.length} summoner`,
);
