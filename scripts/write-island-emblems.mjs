/**
 * Transparent fantasy seal icons for island spots.
 * Inspired by auth hero gold/mystic atmosphere + summon-circle rings.
 * No opaque plate — soft glow fades to fully transparent.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/public/art/hub",
);

function seal(id, glow, accent, symbol) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none">
  <defs>
    <radialGradient id="${id}-aura" cx="50%" cy="48%" r="50%">
      <stop offset="0%" stop-color="${glow}" stop-opacity=".55"/>
      <stop offset="42%" stop-color="${glow}" stop-opacity=".18"/>
      <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-gold" x1="48" y1="36" x2="192" y2="204">
      <stop offset="0%" stop-color="#fff8d6"/>
      <stop offset="28%" stop-color="#f0d878"/>
      <stop offset="62%" stop-color="#c9a227"/>
      <stop offset="100%" stop-color="#7a5a18"/>
    </linearGradient>
    <linearGradient id="${id}-metal" x1="70" y1="50" x2="170" y2="190">
      <stop offset="0%" stop-color="#fff4c8"/>
      <stop offset="45%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#5a4010"/>
    </linearGradient>
    <filter id="${id}-depth" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#000" flood-opacity=".55"/>
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="${glow}" flood-opacity=".35"/>
    </filter>
  </defs>
  <circle cx="120" cy="120" r="112" fill="url(#${id}-aura)"/>
  <g filter="url(#${id}-depth)" fill="none">
    <circle cx="120" cy="120" r="86" stroke="url(#${id}-gold)" stroke-width="2.2" opacity=".95"/>
    <circle cx="120" cy="120" r="76" stroke="#fff4c8" stroke-width="0.8" opacity=".28" stroke-dasharray="3 7"/>
    <circle cx="120" cy="120" r="66" stroke="url(#${id}-gold)" stroke-width="1.3" opacity=".55"/>
    <g stroke="url(#${id}-gold)" stroke-width="1.4" opacity=".7" stroke-linecap="round">
      <path d="M120 28 L120 42"/>
      <path d="M120 198 L120 212"/>
      <path d="M28 120 L42 120"/>
      <path d="M198 120 L212 120"/>
      <path d="M52 52 L64 64"/>
      <path d="M176 176 L188 188"/>
      <path d="M188 52 L176 64"/>
      <path d="M64 176 L52 188"/>
    </g>
    ${symbol}
  </g>
</svg>
`;
}

const emblems = {
  summon: seal(
    "summon",
    "#9a70d0",
    "#c4a0f0",
    `<circle cx="120" cy="120" r="34" stroke="url(#summon-gold)" stroke-width="2.4"/>
     <path d="M120 78 L154 148 H86 Z" stroke="url(#summon-metal)" stroke-width="2.6" fill="#c9a22728"/>
     <circle cx="120" cy="120" r="6" fill="url(#summon-gold)"/>
     <circle cx="120" cy="78" r="3.2" fill="#fff4c8"/>`,
  ),
  forge: seal(
    "forge",
    "#e07040",
    "#f0a070",
    `<path d="M82 152 H158 L148 172 H92 Z" fill="url(#forge-metal)" opacity=".95"/>
     <rect x="110" y="82" width="20" height="64" rx="3" fill="url(#forge-gold)"/>
     <path d="M100 90 H140" stroke="url(#forge-metal)" stroke-width="7" stroke-linecap="round"/>
     <path d="M98 68 C112 52 128 52 142 68" stroke="#ffb080" stroke-width="3.5" fill="none"/>
     <path d="M114 62 L120 46 L126 62" fill="#ffe0a8"/>`,
  ),
  gate: seal(
    "gate",
    "#d09050",
    "#e8c080",
    `<path d="M84 168 V102 C84 78 156 78 156 102 V168" stroke="url(#gate-gold)" stroke-width="3.2" fill="#c9a22718"/>
     <path d="M100 168 V112 C100 96 140 96 140 112 V168" stroke="url(#gate-metal)" stroke-width="2.4" fill="#fff4c812"/>
     <circle cx="130" cy="134" r="3.5" fill="#fff4c8"/>
     <path d="M102 82 L120 62 L138 82" stroke="url(#gate-gold)" stroke-width="2.8" fill="none" stroke-linejoin="round"/>`,
  ),
  shop: seal(
    "shop",
    "#6ab0e0",
    "#9fd0f0",
    `<path d="M78 112 H162 L152 168 H88 Z" stroke="url(#shop-metal)" stroke-width="2.6" fill="#8ec8f018"/>
     <path d="M94 112 C94 84 146 84 146 112" stroke="url(#shop-gold)" stroke-width="2.8" fill="none"/>
     <circle cx="120" cy="140" r="12" stroke="url(#shop-gold)" stroke-width="2.4" fill="#c9a22722"/>
     <path d="M120 131 V149 M111 140 H129" stroke="url(#shop-gold)" stroke-width="2.4" stroke-linecap="round"/>`,
  ),
  pond: seal(
    "pond",
    "#c9a227",
    "#e8d080",
    `<ellipse cx="120" cy="156" rx="48" ry="18" fill="#c9a22722" stroke="url(#pond-gold)" stroke-width="1.8"/>
     <path d="M120 62 C98 100 90 126 120 164 C150 126 142 100 120 62 Z" fill="url(#pond-metal)" stroke="url(#pond-gold)" stroke-width="1.8"/>
     <path d="M120 84 C110 112 108 130 120 150" stroke="#8a6a18" stroke-width="2.2" opacity=".4"/>`,
  ),
  mine: seal(
    "mine",
    "#5ac0f0",
    "#8ec8f0",
    `<path d="M120 62 L164 158 H76 Z" fill="url(#mine-metal)" stroke="url(#mine-gold)" stroke-width="1.6"/>
     <path d="M120 84 L146 146 H94 Z" fill="#3a88b888"/>
     <path d="M102 128 H138" stroke="#fff4c8" stroke-width="1.8" opacity=".65"/>
     <circle cx="120" cy="104" r="5" fill="#fff4c8"/>`,
  ),
  wish: seal(
    "wish",
    "#b090f0",
    "#d0b8ff",
    `<path d="M120 58 L131 98 H174 L140 122 L152 164 L120 140 L88 164 L100 122 L66 98 H109 Z" fill="url(#wish-metal)" stroke="url(#wish-gold)" stroke-width="1.4"/>
     <circle cx="120" cy="120" r="16" fill="#12081c44" stroke="url(#wish-gold)" stroke-width="1.8"/>
     <circle cx="120" cy="120" r="4.5" fill="#fff4c8"/>`,
  ),
  glory: seal(
    "glory",
    "#e8d080",
    "#f5e6b8",
    `<circle cx="120" cy="104" r="28" fill="#c9a22722" stroke="url(#glory-gold)" stroke-width="2.6"/>
     <path d="M90 150 C100 130 140 130 150 150 L144 172 H96 Z" fill="url(#glory-metal)"/>
     <path d="M104 100 L120 76 L136 100" stroke="#fff4c8" stroke-width="2.6" fill="none" stroke-linejoin="round"/>
     <circle cx="120" cy="104" r="7" fill="#fff4c8"/>`,
  ),
  dojo: seal(
    "dojo",
    "#6ab0e0",
    "#9fd0f0",
    `<circle cx="120" cy="120" r="42" stroke="url(#dojo-metal)" stroke-width="2.8"/>
     <circle cx="120" cy="120" r="26" stroke="url(#dojo-gold)" stroke-width="1.8" stroke-dasharray="5 5"/>
     <path d="M120 90 V150 M90 120 H150" stroke="#5ab0e0" stroke-width="2.2" opacity=".85"/>
     <circle cx="120" cy="120" r="7" fill="url(#dojo-gold)"/>`,
  ),
  guild: seal(
    "guild",
    "#70d0a0",
    "#9ed8b0",
    `<path d="M82 76 H158 V144 L120 172 L82 144 Z" stroke="url(#guild-metal)" stroke-width="2.8" fill="#7dcea018"/>
     <path d="M102 102 H138 M102 120 H138 M102 138 H128" stroke="url(#guild-gold)" stroke-width="3" stroke-linecap="round"/>
     <circle cx="120" cy="86" r="4.5" fill="#fff4c8"/>`,
  ),
  fusion: seal(
    "fusion",
    "#e09070",
    "#f0b090",
    `<circle cx="96" cy="120" r="28" fill="#e0704022" stroke="#f0a070" stroke-width="2.6"/>
     <circle cx="144" cy="120" r="28" fill="#4aa0d022" stroke="#8ec8f0" stroke-width="2.6"/>
     <circle cx="120" cy="120" r="12" fill="url(#fusion-gold)"/>
     <circle cx="120" cy="120" r="4" fill="#5a4010"/>`,
  ),
  party: seal(
    "party",
    "#70d090",
    "#9ed8a8",
    `<circle cx="90" cy="98" r="18" fill="#6cbc7a22" stroke="url(#party-metal)" stroke-width="2.2"/>
     <circle cx="150" cy="98" r="18" fill="#6cbc7a22" stroke="url(#party-metal)" stroke-width="2.2"/>
     <circle cx="90" cy="148" r="18" fill="#6cbc7a22" stroke="url(#party-metal)" stroke-width="2.2"/>
     <circle cx="150" cy="148" r="18" fill="#6cbc7a22" stroke="url(#party-metal)" stroke-width="2.2"/>
     <circle cx="120" cy="123" r="9" fill="url(#party-gold)"/>`,
  ),
};

fs.mkdirSync(outDir, { recursive: true });
for (const [name, svg] of Object.entries(emblems)) {
  fs.writeFileSync(path.join(outDir, `emblem-${name}.svg`), svg, "utf8");
}
console.log("wrote", Object.keys(emblems).length, "transparent seal emblems");
