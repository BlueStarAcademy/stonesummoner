/**
 * Symbol set × slot (1–6) icons — distinct piece silhouettes per slot.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/public/art/ui/symbol",
);

const sets = {
  hwalro: "#6cbc7a",
  yongmaeng: "#e07040",
  haengma: "#4aa0d0",
  gunhim: "#c9a227",
  mussang: "#d0b070",
  chimtu: "#c04070",
  bogang: "#8ec8f0",
  jipjung: "#9a70d0",
};

/** Distinct rune-like silhouettes for slots 1–6 (SW-inspired). */
function slotPath(slot) {
  switch (slot) {
    case 1: // blade / ATK — tall hexagon point up
      return "M32 8 L48 18 L48 38 L32 52 L16 38 L16 18 Z";
    case 2: // HP — diamond
      return "M32 6 L54 32 L32 58 L10 32 Z";
    case 3: // DEF — shield
      return "M32 8 L50 16 L50 36 C50 48 40 56 32 58 C24 56 14 48 14 36 L14 16 Z";
    case 4: // CRI — cross plate
      return "M24 10 H40 V24 H54 V40 H40 V54 H24 V40 H10 V24 H24 Z";
    case 5: // HP alt — rounded hex
      return "M20 16 H44 L54 32 L44 48 H20 L10 32 Z";
    case 6: // SPD — circle with fins
      return "M32 10 C44 10 52 20 52 32 C52 44 44 54 32 54 C20 54 12 44 12 32 C12 20 20 10 32 10 Z";
    default:
      return "M32 10 L48 20 L48 40 L32 54 L16 40 L16 20 Z";
  }
}

function slotAccent(slot) {
  switch (slot) {
    case 1:
      return '<path d="M32 20 L36 30 H28 Z" fill="#fff4c8" opacity=".95"/>';
    case 2:
      return '<circle cx="32" cy="32" r="7" fill="#fff4c8" opacity=".9"/>';
    case 3:
      return '<path d="M32 22 V42 M24 30 H40" stroke="#fff4c8" stroke-width="2.4" opacity=".9"/>';
    case 4:
      return '<circle cx="32" cy="32" r="5" fill="#fff4c8"/>';
    case 5:
      return '<path d="M22 32 H42 M32 22 V42" stroke="#fff4c8" stroke-width="2" opacity=".85"/>';
    case 6:
      return '<path d="M22 32 H42 M32 18 L38 28 L32 26 L26 28 Z" fill="#fff4c8" opacity=".92"/>';
    default:
      return "";
  }
}

function icon(setId, fill, slot) {
  const gid = `${setId}-s${slot}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="${gid}-g" x1="10" y1="6" x2="54" y2="58">
      <stop stop-color="#fff4c8"/>
      <stop offset=".42" stop-color="${fill}"/>
      <stop offset="1" stop-color="#2a1c0c"/>
    </linearGradient>
    <filter id="${gid}-f" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#000" flood-opacity=".5"/>
    </filter>
  </defs>
  <g filter="url(#${gid}-f)">
    <path d="${slotPath(slot)}" fill="url(#${gid}-g)" stroke="#f5e6b8" stroke-width="1.8"/>
    <circle cx="32" cy="32" r="11" fill="#0e0b1666" stroke="#fff4c855" stroke-width="1"/>
    ${slotAccent(slot)}
  </g>
</svg>
`;
}

fs.mkdirSync(outDir, { recursive: true });
let n = 0;
for (const [id, fill] of Object.entries(sets)) {
  for (let slot = 1; slot <= 6; slot++) {
    fs.writeFileSync(
      path.join(outDir, `${id}-${slot}.svg`),
      icon(id, fill, slot),
      "utf8",
    );
    n++;
  }
  // keep set overview icon (slot-agnostic)
  fs.writeFileSync(
    path.join(outDir, `${id}.svg`),
    icon(id, fill, 1).replaceAll(`${id}-s1`, id),
    "utf8",
  );
  n++;
}

const gear = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="gear-g" x1="12" y1="8" x2="52" y2="56">
      <stop stop-color="#fff4c8"/>
      <stop offset=".5" stop-color="#c9a227"/>
      <stop offset="1" stop-color="#5a4010"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="34" r="22" fill="url(#gear-g)" stroke="#f5e6b8" stroke-width="2"/>
  <path d="M22 28 H42 L46 36 H18 Z" fill="#1a140a88" stroke="#fff4c8" stroke-width="1.4"/>
  <rect x="26" y="18" width="12" height="10" rx="2" fill="#fff4c8"/>
  <circle cx="32" cy="40" r="4" fill="#fff4c8"/>
</svg>
`;
fs.writeFileSync(path.join(outDir, "gear.svg"), gear, "utf8");
console.log("wrote", n + 1, "icons to", outDir);
