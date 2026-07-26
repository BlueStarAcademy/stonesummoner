import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public/art/ui/nav");

function frame(id, accent = "#c9a227") {
  return `
  <defs>
    <radialGradient id="${id}Aura" cx="50%" cy="48%" r="50%">
      <stop stop-color="${accent}" stop-opacity=".38"/>
      <stop offset=".55" stop-color="${accent}" stop-opacity=".1"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}Gold" x1="14" y1="10" x2="58" y2="62" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8D6"/>
      <stop offset=".28" stop-color="#F0D878"/>
      <stop offset=".62" stop-color="#C9A227"/>
      <stop offset="1" stop-color="#7A5A18"/>
    </linearGradient>
    <linearGradient id="${id}Disc" x1="18" y1="14" x2="54" y2="58" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2A2216"/>
      <stop offset="1" stop-color="#12100A"/>
    </linearGradient>
    <linearGradient id="${id}Ink" x1="22" y1="18" x2="50" y2="54" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F5EDD8"/>
      <stop offset=".55" stop-color="#E8D9A8"/>
      <stop offset="1" stop-color="#A89050"/>
    </linearGradient>
    <filter id="${id}Depth" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#000" flood-opacity=".55"/>
    </filter>
  </defs>
  <circle cx="36" cy="36" r="34" fill="url(#${id}Aura)"/>
  <circle cx="36" cy="36" r="27.5" fill="url(#${id}Disc)" stroke="url(#${id}Gold)" stroke-width="2"/>
  <circle cx="36" cy="36" r="23.5" fill="none" stroke="#FFF4C8" stroke-width=".7" opacity=".28" stroke-dasharray="2.2 4.5"/>
  <g stroke="url(#${id}Gold)" stroke-width="1.4" stroke-linecap="round" opacity=".75">
    <path d="M36 10.5v4.2"/><path d="M36 57.3v4.2"/><path d="M10.5 36h4.2"/><path d="M57.3 36h4.2"/>
  </g>`;
}

const icons = {
  battle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
${frame("bt", "#c9a227")}
  <g filter="url(#btDepth)">
    <path d="M24 22.5 36 48.5 48 22.5" fill="none" stroke="url(#btGold)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M20 18.5h9.5l-1.5 8.5L18.8 24.5z" fill="url(#btInk)" stroke="#5A4214" stroke-width="1"/>
    <path d="M52 18.5h-9.5l1.5 8.5 9.2-2.5z" fill="url(#btInk)" stroke="#5A4214" stroke-width="1"/>
    <circle cx="36" cy="36" r="5.2" fill="#1A140C" stroke="url(#btGold)" stroke-width="1.6"/>
    <circle cx="36" cy="36" r="2.1" fill="url(#btGold)"/>
    <path d="M29 53.5h14" stroke="url(#btGold)" stroke-width="2.4" stroke-linecap="round"/>
  </g>
</svg>`,

  monster: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
${frame("mn", "#7dcea0")}
  <g filter="url(#mnDepth)">
    <path d="M22 30c0-8 5.5-14.5 14-16.5 8.5 2 14 8.5 14 16.5 0 11-6.5 20-14 20S22 41 22 30z" fill="#1A2218" stroke="url(#mnGold)" stroke-width="1.8"/>
    <path d="M27 18.5 31 26M45 18.5 41 26" stroke="url(#mnGold)" stroke-width="2" stroke-linecap="round"/>
    <path d="M28 28.5 32.5 34 28 39.5M44 28.5 39.5 34 44 39.5" fill="none" stroke="url(#mnInk)" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="36" cy="35" r="4.6" fill="url(#mnGold)" stroke="#5A4214" stroke-width="1"/>
    <circle cx="36" cy="35" r="1.8" fill="#102018"/>
    <path d="M29 45c2.2 3.2 11.8 3.2 14 0" stroke="url(#mnGold)" stroke-width="1.8" stroke-linecap="round"/>
  </g>
</svg>`,

  mission: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
${frame("ms", "#4aa0d0")}
  <g filter="url(#msDepth)">
    <path d="M24 16h24v6H24z" fill="url(#msGold)" stroke="#5A4214" stroke-width="1"/>
    <path d="M27 22h18v28c0 1.8-1.8 2.8-3.2 1.9L36 46.2 30.2 51.9C28.8 52.8 27 51.8 27 50V22z" fill="#F3E8C8" stroke="url(#msGold)" stroke-width="1.5"/>
    <path d="M31 28h10M31 33h8M31 38h6" stroke="#8A6A2888" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="41" cy="42" r="6" fill="#C04538" stroke="#5A180C" stroke-width="1"/>
    <path d="M41 38.2l1.2 2.5 2.7.3-2 1.9.6 2.7L41 44.3l-2.5 1.3.6-2.7-2-1.9 2.7-.3z" fill="#FFF1C0"/>
  </g>
</svg>`,

  community: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
${frame("cm", "#7dcea0")}
  <g filter="url(#cmDepth)">
    <path d="M22 48V28.5l7-5.5 7 5.5V48" fill="#1A2218" stroke="url(#cmGold)" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M36 48V28.5l7-5.5 7 5.5V48" fill="#162018" stroke="url(#cmGold)" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M22 28.5h28" stroke="url(#cmGold)" stroke-width="1.4" opacity=".7"/>
    <circle cx="29" cy="36" r="3.2" fill="url(#cmInk)" stroke="#5A4214" stroke-width=".8"/>
    <circle cx="43" cy="36" r="3.2" fill="url(#cmInk)" stroke="#5A4214" stroke-width=".8"/>
    <path d="M36 18.5c-2.2 0-4 1.5-4 3.4 0 2.8 4 5.6 4 5.6s4-2.8 4-5.6c0-1.9-1.8-3.4-4-3.4z" fill="url(#cmGold)" stroke="#5A4214" stroke-width="1"/>
    <path d="M20 50.5h32" stroke="url(#cmGold)" stroke-width="2.4" stroke-linecap="round"/>
  </g>
</svg>`,

  shop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
${frame("sp", "#c9a227")}
  <g filter="url(#spDepth)">
    <path d="M21 30.5h30v20.5c0 2-1.6 3.5-3.5 3.5h-23c-1.9 0-3.5-1.5-3.5-3.5V30.5z" fill="#2A1C10" stroke="url(#spGold)" stroke-width="1.7"/>
    <path d="M19 30.5 24 19.5h24l5 11" fill="url(#spGold)" stroke="#5A4214" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M32 30.5v8.5a4 4 0 0 0 8 0v-8.5" fill="none" stroke="url(#spInk)" stroke-width="2" stroke-linecap="round"/>
    <circle cx="36" cy="24" r="3.4" fill="#8EC8F0" stroke="#E8F6FF" stroke-width="1"/>
    <path d="M25 40.5h8M25 45.5h12" stroke="#C9A22766" stroke-width="1.5" stroke-linecap="round"/>
  </g>
</svg>`,

  settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
${frame("st", "#c9a227")}
  <g filter="url(#stDepth)">
    <path d="M39.03 24.18L40.03 20.31L44.25 22.06L42.21 25.50L46.50 29.79L49.94 27.75L51.69 31.97L47.82 32.97L47.82 39.03L51.69 40.03L49.94 44.25L46.50 42.21L42.21 46.50L44.25 49.94L40.03 51.69L39.03 47.82L32.97 47.82L31.97 51.69L27.75 49.94L29.79 46.50L25.50 42.21L22.06 44.25L20.31 40.03L24.18 39.03L24.18 32.97L20.31 31.97L22.06 27.75L25.50 29.79L29.79 25.50L27.75 22.06L31.97 20.31L32.97 24.18Z" fill="url(#stGold)" stroke="#5A4214" stroke-width="1.15" stroke-linejoin="round"/>
    <circle cx="36" cy="36" r="7.6" fill="#1A140C" stroke="url(#stInk)" stroke-width="1.5"/>
    <circle cx="36" cy="36" r="3.4" fill="url(#stGold)" stroke="#5A4214" stroke-width="1"/>
    <circle cx="36" cy="36" r="1.4" fill="#FFF6D0"/>
  </g>
</svg>`,

  mail: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
${frame("ml", "#c9a227")}
  <g filter="url(#mlDepth)">
    <rect x="16" y="24" width="40" height="26" rx="4" fill="url(#mlGold)" stroke="#5A4214" stroke-width="1.3"/>
    <path d="M18 26.2 36 39.5 54 26.2" fill="none" stroke="#FFF6D0" stroke-width="2" stroke-linejoin="round"/>
    <path d="M18 48.5 30.5 37.5M54 48.5 41.5 37.5" stroke="#5A421455" stroke-width="1.4"/>
    <circle cx="45" cy="42" r="7" fill="#C04538" stroke="#5A180C" stroke-width="1"/>
    <path d="M45 37.6l1.4 2.9 3.1.35-2.3 2.1.65 3.1L45 44.5l-2.85 1.55.65-3.1-2.3-2.1 3.1-.35z" fill="#FFF1C0"/>
  </g>
</svg>`,

  notif: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" aria-hidden="true">
${frame("nt", "#e8d9a8")}
  <g filter="url(#ntDepth)">
    <path d="M36 16.5c-1.4 0-2.5 1.1-2.5 2.5v1.1C26.8 21.4 22 26.6 22 33.2v6.2l-3.2 4.8c-.55.8.1 1.9 1 1.9h32.4c.9 0 1.55-1.1 1-1.9l-3.2-4.8v-6.2c0-6.6-4.8-11.8-11.5-13.1v-1.1c0-1.4-1.1-2.5-2.5-2.5z" fill="url(#ntGold)" stroke="#5A4214" stroke-width="1.2"/>
    <path d="M30.5 48.8a5.5 5.5 0 0 0 11 0" fill="url(#ntGold)" stroke="#5A4214" stroke-width="1.1"/>
    <circle cx="36" cy="20.5" r="1.8" fill="#FFF6D0"/>
    <path d="M36 25.5v6" stroke="#FFF6C8aa" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="48" cy="22" r="5.4" fill="#E84848" stroke="#FFF1C0" stroke-width="1.3"/>
  </g>
</svg>`,
};

for (const [name, svg] of Object.entries(icons)) {
  fs.writeFileSync(path.join(dir, `${name}.svg`), `${svg.trim()}\n`, "utf8");
  console.log("wrote", name);
}
