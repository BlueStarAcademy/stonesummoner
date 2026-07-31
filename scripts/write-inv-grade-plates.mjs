/**
 * Inventory grade backplates: gray → green → blue → purple → red.
 * Usage: node scripts/write-inv-grade-plates.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/public/art/ui/inv-grade",
);

const GRADES = {
  gray: {
    hi: "#8A8A88",
    mid: "#4A4A48",
    lo: "#1C1C1A",
    rim: "#C8C8C0",
    glow: "#9A9A9A",
    ink: "#E8E8E0",
  },
  green: {
    hi: "#8FD86A",
    mid: "#3A8A38",
    lo: "#102810",
    rim: "#C8F0A0",
    glow: "#A3DA58",
    ink: "#E8FFD0",
  },
  blue: {
    hi: "#6AB0FF",
    mid: "#2868C0",
    lo: "#0C1830",
    rim: "#A8D0FF",
    glow: "#4D97FF",
    ink: "#D8ECFF",
  },
  purple: {
    hi: "#C48AFF",
    mid: "#6830B0",
    lo: "#180828",
    rim: "#E0C0FF",
    glow: "#B46BFF",
    ink: "#F0E0FF",
  },
  red: {
    hi: "#FF7A6A",
    mid: "#C03028",
    lo: "#280808",
    rim: "#FFC0B8",
    glow: "#FF4D4D",
    ink: "#FFE0D8",
  },
};

function plate(id, c) {
  // Thin grade rim (~3–4px on a 56px slot). Portrait area stays open.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-rim" x1="8" y1="4" x2="104" y2="108" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6"/>
      <stop offset=".3" stop-color="${c.hi}"/>
      <stop offset=".55" stop-color="${c.rim}"/>
      <stop offset=".82" stop-color="${c.mid}"/>
      <stop offset="1" stop-color="${c.lo}"/>
    </linearGradient>
    <linearGradient id="${id}-bevel" x1="16" y1="8" x2="64" y2="40" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6" stop-opacity=".65"/>
      <stop offset="1" stop-color="${c.glow}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}-well" cx="50%" cy="48%" r="62%">
      <stop stop-color="#1A140C" stop-opacity=".12"/>
      <stop offset="1" stop-color="#0A0806" stop-opacity=".22"/>
    </radialGradient>
    <radialGradient id="${id}-aura" cx="50%" cy="42%" r="58%">
      <stop stop-color="${c.glow}" stop-opacity=".16"/>
      <stop offset=".65" stop-color="${c.glow}" stop-opacity=".04"/>
      <stop offset="1" stop-color="${c.glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="112" height="112" rx="14" fill="url(#${id}-aura)"/>
  <rect x="6" y="6" width="100" height="100" rx="11" fill="url(#${id}-well)"/>
  <!-- Outer rim ring: ~4u thick (~2px @56) -->
  <path fill="url(#${id}-rim)" fill-rule="evenodd" d="M12 4h88a8 8 0 0 1 8 8v88a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V12a8 8 0 0 1 8-8Zm4 4a5 5 0 0 0-5 5v82a5 5 0 0 0 5 5h80a5 5 0 0 0 5-5V13a5 5 0 0 0-5-5H16Z"/>
  <rect x="4" y="4" width="104" height="104" rx="12" fill="none" stroke="#FFF8D6" stroke-opacity=".28" stroke-width=".75"/>
  <rect x="8.5" y="8.5" width="95" height="95" rx="9.5" fill="none" stroke="${c.rim}" stroke-opacity=".4" stroke-width=".8"/>
  <path d="M14 12 H58 Q70 12 70 22" fill="none" stroke="url(#${id}-bevel)" stroke-width="2" stroke-linecap="round" opacity=".5"/>
  <path d="M14 20 V14 H20M92 14 H98 V20M14 92 V98 H20M92 98 H98 V92" stroke="${c.ink}" stroke-opacity=".4" stroke-width="1.25" stroke-linecap="round"/>
</svg>
`;
}

fs.mkdirSync(outDir, { recursive: true });
for (const [id, colors] of Object.entries(GRADES)) {
  fs.writeFileSync(path.join(outDir, `${id}.svg`), plate(id, colors), "utf8");
}
console.log("wrote", Object.keys(GRADES).length, "inv-grade plates ->", outDir);
