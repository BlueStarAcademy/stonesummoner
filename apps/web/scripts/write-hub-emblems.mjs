import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("public/art/hub");

/** Portrait-tile frame matching summoner/profile art (rounded square). */
const wrap = (bgFrom, bgTo, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none">
  <defs>
    <linearGradient id="bg" x1="40" y1="24" x2="200" y2="220" gradientUnits="userSpaceOnUse">
      <stop stop-color="${bgFrom}"/>
      <stop offset="1" stop-color="${bgTo}"/>
    </linearGradient>
    <linearGradient id="rim" x1="40" y1="40" x2="200" y2="200">
      <stop offset="0%" stop-color="#e8d9a8"/>
      <stop offset="50%" stop-color="#c4a0f0"/>
      <stop offset="100%" stop-color="#e8d9a8"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="52" fill="url(#bg)"/>
  <rect x="10" y="10" width="220" height="220" rx="44" stroke="url(#rim)" stroke-width="2" opacity=".35"/>
  ${inner}
</svg>
`;

const emblems = {
  summon: [
    "#241848",
    "#100c1c",
    '<circle cx="120" cy="120" r="42" stroke="#c4a0f0" stroke-width="3"/><path d="M120 68 L162 158 H78 Z" stroke="#e8d9a8" stroke-width="2.2" opacity=".9"/><circle cx="120" cy="120" r="8" fill="#e8d9a8"/>',
  ],
  forge: [
    "#3a1810",
    "#1a0c08",
    '<path d="M70 155 H170 L155 178 H85 Z" fill="#e07040" opacity=".9"/><rect x="106" y="70" width="28" height="78" rx="5" fill="#e8d9a8"/><path d="M96 78 H144" stroke="#c9a227" stroke-width="7" stroke-linecap="round"/><path d="M92 55 C110 38 130 38 148 55" stroke="#f0a070" stroke-width="4" fill="none"/>',
  ],
  shop: [
    "#0e2438",
    "#081420",
    '<path d="M72 100 H168 L156 175 H84 Z" stroke="#8ec8f0" stroke-width="3" fill="#1a284088"/><path d="M90 100 C90 72 150 72 150 100" stroke="#e8d9a8" stroke-width="3" fill="none"/><circle cx="120" cy="138" r="14" stroke="#c9a227" stroke-width="2.5"/><path d="M120 128 V148 M110 138 H130" stroke="#c9a227" stroke-width="2.5"/>',
  ],
  pond: [
    "#2a200c",
    "#120e08",
    '<ellipse cx="120" cy="158" rx="58" ry="24" fill="#c9a22744" stroke="#e8d9a8" stroke-width="2"/><path d="M120 52 C92 98 80 128 120 175 C160 128 148 98 120 52 Z" fill="#e8d9a8" opacity=".9"/><path d="M120 78 C106 108 102 128 120 155" stroke="#8a6a18" stroke-width="2.5" opacity=".5"/>',
  ],
  mine: [
    "#0e2438",
    "#081420",
    '<path d="M120 52 L170 155 H70 Z" fill="#8ec8f0" opacity=".95"/><path d="M120 78 L148 142 H92 Z" fill="#4aa0d0" opacity=".75"/><path d="M98 125 H142" stroke="#e8d9a8" stroke-width="2" opacity=".65"/><circle cx="120" cy="100" r="5" fill="#f5e6b8"/>',
  ],
  wish: [
    "#1a1430",
    "#0c0818",
    '<path d="M120 48 L134 100 H186 L144 130 L160 182 L120 150 L80 182 L96 130 L54 100 H106 Z" fill="#c4a0f0" opacity=".95"/><circle cx="120" cy="120" r="20" stroke="#e8d9a8" stroke-width="2" fill="#120e1c88"/>',
  ],
  glory: [
    "#2a200c",
    "#120e08",
    '<circle cx="120" cy="100" r="32" stroke="#e8d9a8" stroke-width="3" fill="#c9a22733"/><path d="M82 155 C94 132 146 132 158 155 L152 182 H88 Z" fill="#e8d9a8" opacity=".9"/><path d="M98 95 L120 68 L142 95" stroke="#f5e6b8" stroke-width="2.5" fill="none"/>',
  ],
  fusion: [
    "#2a1810",
    "#140c08",
    '<circle cx="92" cy="120" r="36" stroke="#f0a070" stroke-width="3" fill="#e0704033"/><circle cx="148" cy="120" r="36" stroke="#8ec8f0" stroke-width="3" fill="#4aa0d033"/><circle cx="120" cy="120" r="16" fill="#e8d9a8" opacity=".95"/>',
  ],
  party: [
    "#102818",
    "#081410",
    '<circle cx="82" cy="92" r="22" fill="#6cbc7a88" stroke="#9ed8a8" stroke-width="2.5"/><circle cx="158" cy="92" r="22" fill="#6cbc7a88" stroke="#9ed8a8" stroke-width="2.5"/><circle cx="82" cy="158" r="22" fill="#6cbc7a88" stroke="#9ed8a8" stroke-width="2.5"/><circle cx="158" cy="158" r="22" fill="#6cbc7a88" stroke="#9ed8a8" stroke-width="2.5"/>',
  ],
  guild: [
    "#102818",
    "#081410",
    '<path d="M78 68 H162 V155 L120 188 L78 155 Z" stroke="#7dcea0" stroke-width="3" fill="#1a302488"/><path d="M98 98 H142 M98 120 H142 M98 142 H128" stroke="#e8d9a8" stroke-width="3.5" stroke-linecap="round" opacity=".85"/>',
  ],
  dojo: [
    "#0e2438",
    "#081420",
    '<circle cx="120" cy="120" r="56" stroke="#8ec8f0" stroke-width="3.5"/><circle cx="120" cy="120" r="32" stroke="#e8d9a8" stroke-width="2.5" stroke-dasharray="7 5"/><path d="M120 78 V162 M78 120 H162" stroke="#4aa0d0" stroke-width="2.5" opacity=".75"/><circle cx="120" cy="120" r="10" fill="#e8d9a8"/>',
  ],
};

fs.mkdirSync(outDir, { recursive: true });
for (const [name, [from, to, inner]] of Object.entries(emblems)) {
  fs.writeFileSync(path.join(outDir, `emblem-${name}.svg`), wrap(from, to, inner));
}
console.log("wrote", Object.keys(emblems).length, "emblems");
