/**
 * Symbol-set icons for stage reward display (transparent seal style).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/public/art/ui/symbol",
);

const sets = {
  hwalro: { fill: "#6cbc7a", glyph: "H" }, // energy / hp
  yongmaeng: { fill: "#e07040", glyph: "F" }, // fatal
  haengma: { fill: "#4aa0d0", glyph: "S" }, // swift
  gunhim: { fill: "#c9a227", glyph: "G" }, // guard
  mussang: { fill: "#d0b070", glyph: "B" }, // blade
  chimtu: { fill: "#c04070", glyph: "R" }, // rage
  bogang: { fill: "#8ec8f0", glyph: "D" }, // shield
  jipjung: { fill: "#9a70d0", glyph: "C" }, // focus
};

function icon(id, fill, glyph) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="${id}-g" x1="12" y1="8" x2="52" y2="56">
      <stop stop-color="#fff4c8"/>
      <stop offset=".45" stop-color="${fill}"/>
      <stop offset="1" stop-color="#3a2810"/>
    </linearGradient>
    <filter id="${id}-s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".45"/>
    </filter>
  </defs>
  <g filter="url(#${id}-s)">
    <circle cx="32" cy="32" r="26" fill="url(#${id}-g)" stroke="#f5e6b8" stroke-width="2"/>
    <circle cx="32" cy="32" r="18" fill="#0e0b1688" stroke="#fff4c866" stroke-width="1.2"/>
    <path d="M32 14 L38 26 H50 L40 34 L44 48 L32 40 L20 48 L24 34 L14 26 H26 Z" fill="#fff4c8" opacity=".92"/>
  </g>
</svg>
`;
}

fs.mkdirSync(outDir, { recursive: true });
for (const [id, meta] of Object.entries(sets)) {
  fs.writeFileSync(path.join(outDir, `${id}.svg`), icon(id, meta.fill, meta.glyph), "utf8");
}

// Simple gear drop icon
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
console.log("wrote", Object.keys(sets).length + 1, "icons");
