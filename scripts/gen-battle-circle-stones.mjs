/**
 * Generate premium themed battle magic-circle + magic-stone WebPs (SVG → sharp).
 * Style aligned with hub summon-circle (stone rings, gold metal, crystal accents).
 *
 * Prefer painted dematte pipeline when _src PNGs exist:
 *   node scripts/process-battle-circles.mjs
 *   node scripts/process-battle-stones.mjs
 *   node scripts/process-battle-marks.mjs
 *
 * Usage:
 *   node scripts/gen-battle-circle-stones.mjs           # circles + stones
 *   node scripts/gen-battle-circle-stones.mjs --circles # circles only
 *   node scripts/gen-battle-circle-stones.mjs --stones  # stones only
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const circleDir = path.join(root, "apps/web/public/art/battle/circle");
const stoneDir = path.join(root, "apps/web/public/art/battle/stone");

/** @type {Record<string, { stone: string; stone2: string; metal: string; glow: string; accent: string; crystal: string; motif: string }>} */
const CIRCLES = {
  "map-01": {
    stone: "#2a3a32",
    stone2: "#1a2822",
    metal: "#d0d8a8",
    glow: "#7ec8ff",
    accent: "#a8e0c0",
    crystal: "#90e8ff",
    motif: "moon",
  },
  "map-02": {
    stone: "#3a3a42",
    stone2: "#242430",
    metal: "#d0b878",
    glow: "#e0c070",
    accent: "#c9a227",
    crystal: "#f0d878",
    motif: "tower",
  },
  "map-03": {
    stone: "#4a3a28",
    stone2: "#302418",
    metal: "#d8c090",
    glow: "#40c8b0",
    accent: "#70d0c0",
    crystal: "#60e8d0",
    motif: "ruin",
  },
  "map-04": {
    stone: "#2a3838",
    stone2: "#1a2828",
    metal: "#a8c0a0",
    glow: "#88c898",
    accent: "#b0d8c0",
    crystal: "#a0e0b8",
    motif: "mist",
  },
  "map-05": {
    stone: "#2a2018",
    stone2: "#181208",
    metal: "#e09040",
    glow: "#ff6030",
    accent: "#ffb060",
    crystal: "#ff8040",
    motif: "flame",
  },
  "map-06": {
    stone: "#283848",
    stone2: "#182430",
    metal: "#d0e8f8",
    glow: "#80d0ff",
    accent: "#e8f8ff",
    crystal: "#b0e8ff",
    motif: "frost",
  },
  "map-07": {
    stone: "#2a2838",
    stone2: "#181820",
    metal: "#e8d060",
    glow: "#a070ff",
    accent: "#ffe060",
    crystal: "#c090ff",
    motif: "thunder",
  },
  "map-08": {
    stone: "#1a2830",
    stone2: "#101820",
    metal: "#60a090",
    glow: "#20c8b8",
    accent: "#40e0d0",
    crystal: "#40e8d8",
    motif: "abyss",
  },
  "map-09": {
    stone: "#303038",
    stone2: "#1e1e28",
    metal: "#c9a227",
    glow: "#f0d878",
    accent: "#8870ff",
    crystal: "#c4a0f0",
    motif: "seal",
  },
  "map-10": {
    stone: "#4a3820",
    stone2: "#302418",
    metal: "#f0d060",
    glow: "#ffc040",
    accent: "#ffe0a0",
    crystal: "#ffe080",
    motif: "desert",
  },
  "map-11": {
    stone: "#1e3028",
    stone2: "#122018",
    metal: "#80c060",
    glow: "#c070ff",
    accent: "#e0a0ff",
    crystal: "#d090ff",
    motif: "jungle",
  },
  "map-12": {
    stone: "#181820",
    stone2: "#0c0c14",
    metal: "#808090",
    glow: "#e040a0",
    accent: "#ff70c0",
    crystal: "#ff60b0",
    motif: "obsidian",
  },
  "map-13": {
    stone: "#2a2428",
    stone2: "#181418",
    metal: "#f0e0b0",
    glow: "#ff4050",
    accent: "#c9a227",
    crystal: "#ff7080",
    motif: "end",
  },
  "cairos-giant": {
    stone: "#3a3028",
    stone2: "#241e18",
    metal: "#d0a060",
    glow: "#ffb040",
    accent: "#ffe0a0",
    crystal: "#ffc060",
    motif: "giant",
  },
  "cairos-dragon": {
    stone: "#281818",
    stone2: "#180c0c",
    metal: "#c06030",
    glow: "#ff4020",
    accent: "#ff9060",
    crystal: "#ff6030",
    motif: "dragon",
  },
  "cairos-necro": {
    stone: "#242830",
    stone2: "#14181e",
    metal: "#a8b090",
    glow: "#60e040",
    accent: "#a0ff70",
    crystal: "#80f050",
    motif: "necro",
  },
  arena: {
    stone: "#3a3028",
    stone2: "#241e18",
    metal: "#e0a040",
    glow: "#ff4040",
    accent: "#c9a227",
    crystal: "#ff7060",
    motif: "arena",
  },
  depth: {
    stone: "#1e2430",
    stone2: "#121820",
    metal: "#7080a0",
    glow: "#40c0e0",
    accent: "#80e0ff",
    crystal: "#60d8f0",
    motif: "depth",
  },
  equip: {
    stone: "#302828",
    stone2: "#1e1818",
    metal: "#c08040",
    glow: "#ff8030",
    accent: "#ffc070",
    crystal: "#ff9040",
    motif: "forge",
  },
  weekday: {
    stone: "#2a3040",
    stone2: "#1a2030",
    metal: "#90b0d0",
    glow: "#60a0ff",
    accent: "#c0d8ff",
    crystal: "#80b8ff",
    motif: "train",
  },
};

const STONES = {
  fire: { core: "#ff8040", mid: "#e06028", deep: "#6a2810", glow: "#ff6030", spark: "#ffe0a0" },
  water: { core: "#70d8ff", mid: "#3080d0", deep: "#102848", glow: "#40b0ff", spark: "#e0f8ff" },
  wind: { core: "#c0ff80", mid: "#50a040", deep: "#183018", glow: "#80e050", spark: "#f0ffe0" },
  light: { core: "#fff6d0", mid: "#f0d878", deep: "#6a4a10", glow: "#ffe080", spark: "#ffffff" },
  dark: { core: "#e8b0ff", mid: "#7040c0", deep: "#201030", glow: "#a070ff", spark: "#f0e0ff" },
  enemy: { core: "#d8c8ff", mid: "#5a40c8", deep: "#181028", glow: "#8870ff", spark: "#f0e8ff" },
};

function motifPaths(motif, metal, glow, crystal) {
  switch (motif) {
    case "moon":
      return `<path d="M512 455 C470 475 465 545 512 575 C488 530 488 485 512 455 Z" fill="${crystal}" opacity=".55"/>
        <circle cx="512" cy="512" r="22" fill="none" stroke="${metal}" stroke-width="3" opacity=".75"/>`;
    case "tower":
      return `<rect x="496" y="460" width="32" height="70" rx="3" fill="${metal}" opacity=".5"/>
        <path d="M484 460 L512 430 L540 460 Z" fill="${crystal}" opacity=".6"/>`;
    case "ruin":
      return `<path d="M450 560 L512 440 L574 560 Z" fill="none" stroke="${glow}" stroke-width="4" opacity=".6"/>
        <circle cx="512" cy="520" r="14" fill="${crystal}" opacity=".5"/>`;
    case "mist":
      return `<ellipse cx="512" cy="500" rx="64" ry="18" fill="${glow}" opacity=".3"/>
        <ellipse cx="512" cy="530" rx="80" ry="14" fill="${metal}" opacity=".25"/>`;
    case "flame":
      return `<path d="M512 430 C538 480 554 500 512 575 C470 500 486 480 512 430 Z" fill="${crystal}" opacity=".65"/>`;
    case "frost":
      return `<g stroke="${crystal}" stroke-width="3" opacity=".7" fill="none">
        <path d="M512 440 L512 580 M440 510 L584 510"/>
        <path d="M460 460 L564 560 M564 460 L460 560"/>
      </g>`;
    case "thunder":
      return `<path d="M528 435 L475 505 H518 L492 575 L575 490 H520 Z" fill="${crystal}" opacity=".65"/>`;
    case "abyss":
      return `<circle cx="512" cy="512" r="36" fill="none" stroke="${glow}" stroke-width="4" opacity=".55"/>
        <circle cx="512" cy="512" r="14" fill="${crystal}" opacity=".5"/>`;
    case "seal":
      return `<rect x="478" y="478" width="68" height="68" rx="6" fill="none" stroke="${metal}" stroke-width="4" opacity=".65" transform="rotate(45 512 512)"/>
        <circle cx="512" cy="512" r="12" fill="${crystal}" opacity=".6"/>`;
    case "desert":
      return `<path d="M440 540 Q512 450 584 540" fill="none" stroke="${metal}" stroke-width="5" opacity=".55"/>
        <circle cx="512" cy="480" r="18" fill="${crystal}" opacity=".5"/>`;
    case "jungle":
      return `<path d="M512 445 C536 480 552 520 512 575 C472 520 488 480 512 445 Z" fill="${glow}" opacity=".4"/>
        <path d="M460 512 Q512 470 564 512" stroke="${metal}" stroke-width="3" fill="none" opacity=".55"/>`;
    case "obsidian":
      return `<path d="M512 445 L575 512 L512 579 L449 512 Z" fill="${glow}" opacity=".35" stroke="${metal}" stroke-width="3"/>`;
    case "end":
      return `<path d="M512 440 L555 575 H469 Z" fill="none" stroke="${metal}" stroke-width="4" opacity=".6"/>
        <circle cx="512" cy="500" r="10" fill="${crystal}" opacity=".75"/>`;
    case "giant":
      return `<circle cx="512" cy="512" r="42" fill="none" stroke="${metal}" stroke-width="6" opacity=".55"/>
        <circle cx="512" cy="512" r="16" fill="${crystal}" opacity=".5"/>`;
    case "dragon":
      return `<path d="M455 545 C475 465 549 465 569 545" fill="none" stroke="${glow}" stroke-width="5" opacity=".6"/>
        <path d="M490 505 L512 455 L534 505" fill="${metal}" opacity=".5"/>`;
    case "necro":
      return `<ellipse cx="512" cy="505" rx="30" ry="40" fill="none" stroke="${glow}" stroke-width="4" opacity=".55"/>
        <circle cx="500" cy="495" r="4" fill="${metal}"/><circle cx="524" cy="495" r="4" fill="${metal}"/>`;
    case "arena":
      return `<path d="M460 512 H564 M512 455 V569" stroke="${metal}" stroke-width="4" opacity=".5"/>
        <circle cx="512" cy="512" r="30" fill="none" stroke="${crystal}" stroke-width="3" opacity=".55"/>`;
    case "depth":
      return `<circle cx="512" cy="512" r="44" fill="none" stroke="${glow}" stroke-width="2" opacity=".4" stroke-dasharray="6 8"/>
        <circle cx="512" cy="512" r="24" fill="none" stroke="${metal}" stroke-width="3" opacity=".55"/>`;
    case "forge":
      return `<rect x="470" y="535" width="84" height="22" rx="4" fill="${metal}" opacity=".55"/>
        <rect x="500" y="455" width="24" height="80" rx="3" fill="${crystal}" opacity=".5"/>`;
    case "train":
    default:
      return `<circle cx="512" cy="512" r="28" fill="none" stroke="${metal}" stroke-width="3" opacity=".55"/>
        <circle cx="512" cy="512" r="8" fill="${crystal}" opacity=".7"/>`;
  }
}

function cardinalCrystal(cx, cy, crystal, metal, rot = 0) {
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})">
    <rect x="-14" y="-28" width="28" height="56" rx="4" fill="${metal}" opacity=".55"/>
    <rect x="-8" y="-20" width="16" height="40" rx="3" fill="${crystal}" opacity=".85"/>
    <circle cx="0" cy="0" r="5" fill="#fff" opacity=".45"/>
  </g>`;
}

function circleSvg(id, theme) {
  const { stone, stone2, metal, glow, accent, crystal, motif } = theme;
  const safe = id.replace(/[^a-z0-9-]/gi, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" fill="none">
  <defs>
    <radialGradient id="${safe}-aura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${glow}" stop-opacity="0"/>
      <stop offset="58%" stop-color="${glow}" stop-opacity=".08"/>
      <stop offset="76%" stop-color="${accent}" stop-opacity=".32"/>
      <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${safe}-disk" cx="50%" cy="46%" r="52%">
      <stop offset="0%" stop-color="${stone2}" stop-opacity=".98"/>
      <stop offset="55%" stop-color="${stone}" stop-opacity=".96"/>
      <stop offset="82%" stop-color="${stone}" stop-opacity=".9"/>
      <stop offset="100%" stop-color="${stone2}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${safe}-well" cx="50%" cy="50%" r="40%">
      <stop offset="0%" stop-color="#06040c" stop-opacity=".97"/>
      <stop offset="65%" stop-color="#0e0c16" stop-opacity=".9"/>
      <stop offset="100%" stop-color="${stone2}" stop-opacity=".15"/>
    </radialGradient>
    <linearGradient id="${safe}-gold" x1="180" y1="160" x2="840" y2="860">
      <stop offset="0%" stop-color="#fff8e0"/>
      <stop offset="28%" stop-color="${metal}"/>
      <stop offset="62%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#5a4010"/>
    </linearGradient>
    <linearGradient id="${safe}-ring" x1="120" y1="120" x2="900" y2="900">
      <stop offset="0%" stop-color="#f5e6b8"/>
      <stop offset="35%" stop-color="${glow}"/>
      <stop offset="70%" stop-color="${metal}"/>
      <stop offset="100%" stop-color="#f5e6b8"/>
    </linearGradient>
    <filter id="${safe}-glow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <circle cx="512" cy="512" r="502" fill="url(#${safe}-aura)"/>
  <circle cx="512" cy="512" r="468" fill="url(#${safe}-disk)"/>

  <!-- Outer ornate rings -->
  <circle cx="512" cy="512" r="452" fill="none" stroke="url(#${safe}-gold)" stroke-width="12" opacity=".92" filter="url(#${safe}-glow)"/>
  <circle cx="512" cy="512" r="430" fill="none" stroke="url(#${safe}-ring)" stroke-width="2.2" opacity=".85"/>
  <circle cx="512" cy="512" r="412" fill="none" stroke="${metal}" stroke-width="1.2" opacity=".45" stroke-dasharray="3 9"/>
  <circle cx="512" cy="512" r="390" fill="none" stroke="url(#${safe}-gold)" stroke-width="5" opacity=".7"/>
  <circle cx="512" cy="512" r="368" fill="none" stroke="${glow}" stroke-width="1.8" opacity=".55" stroke-dasharray="7 11"/>

  <!-- Stone band -->
  <circle cx="512" cy="512" r="348" fill="none" stroke="${stone}" stroke-width="28" opacity=".85"/>
  <circle cx="512" cy="512" r="348" fill="none" stroke="${metal}" stroke-width="2" opacity=".35"/>

  <!-- Inner ritual rings -->
  <circle cx="512" cy="512" r="318" fill="none" stroke="url(#${safe}-ring)" stroke-width="2.4" opacity=".8"/>
  <circle cx="512" cy="512" r="295" fill="url(#${safe}-well)"/>
  <circle cx="512" cy="512" r="285" fill="none" stroke="${accent}" stroke-width="1.6" opacity=".4" stroke-dasharray="4 10"/>
  <circle cx="512" cy="512" r="250" fill="none" stroke="${metal}" stroke-width="1.4" opacity=".45"/>
  <circle cx="512" cy="512" r="210" fill="none" stroke="${glow}" stroke-width="1.8" opacity=".5"/>
  <circle cx="512" cy="512" r="160" fill="none" stroke="url(#${safe}-gold)" stroke-width="1.5" opacity=".55"/>

  <!-- Geometry overlays -->
  <path d="M512 220 L720 620 H304 Z" stroke="${glow}" stroke-width="1.4" opacity=".35" fill="none"/>
  <path d="M512 804 L304 404 H720 Z" stroke="${metal}" stroke-width="1.2" opacity=".3" fill="none"/>
  <path d="M512 280 L620 512 L512 744 L404 512 Z" stroke="${accent}" stroke-width="1.2" opacity=".28" fill="none"/>

  <!-- Radial guides -->
  <g stroke="${metal}" stroke-width="1.5" opacity=".4" stroke-linecap="round">
    ${[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
      const a = (deg * Math.PI) / 180;
      const x1 = 512 + Math.cos(a) * 170;
      const y1 = 512 + Math.sin(a) * 170;
      const x2 = 512 + Math.cos(a) * 300;
      const y2 = 512 + Math.sin(a) * 300;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    }).join("\n    ")}
  </g>

  <!-- Soft node grid for stones (center well) -->
  <g opacity=".5">
    ${Array.from({ length: 7 }, (_, y) =>
      Array.from({ length: 7 }, (_, x) => {
        const cx = 512 - 105 + x * 35;
        const cy = 512 - 105 + y * 35;
        const dx = cx - 512;
        const dy = cy - 512;
        if (dx * dx + dy * dy > 125 * 125) return "";
        return `<circle cx="${cx}" cy="${cy}" r="2.8" fill="${glow}" opacity=".5"/>`;
      }).join(""),
    ).join("")}
  </g>

  <!-- Cardinal crystal pylons -->
  ${cardinalCrystal(512, 95, crystal, metal, 0)}
  ${cardinalCrystal(512, 929, crystal, metal, 180)}
  ${cardinalCrystal(95, 512, crystal, metal, 270)}
  ${cardinalCrystal(929, 512, crystal, metal, 90)}

  <!-- Diagonal orbs -->
  <g filter="url(#${safe}-glow)">
    ${[[200, 200], [824, 200], [200, 824], [824, 824]].map(([x, y]) =>
      `<g transform="translate(${x} ${y})">
        <circle r="22" fill="${stone}" opacity=".8"/>
        <circle r="14" fill="none" stroke="url(#${safe}-gold)" stroke-width="2"/>
        <circle r="7" fill="${crystal}" opacity=".9"/>
      </g>`,
    ).join("\n    ")}
  </g>

  <!-- Theme motif (center, sparse) -->
  <g filter="url(#${safe}-glow)" opacity=".85">
    ${motifPaths(motif, metal, glow, crystal)}
  </g>

  <circle cx="512" cy="512" r="6" fill="${metal}" opacity=".8"/>
  <circle cx="512" cy="512" r="3" fill="#fff8e0" opacity=".9"/>
</svg>`;
}

function stoneSvg(id, theme) {
  const { core, mid, deep, glow, spark } = theme;
  const safe = id.replace(/[^a-z0-9-]/gi, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" fill="none">
  <defs>
    <radialGradient id="${safe}-body" cx="32%" cy="28%" r="72%">
      <stop offset="0%" stop-color="${spark}"/>
      <stop offset="14%" stop-color="${core}"/>
      <stop offset="42%" stop-color="${mid}"/>
      <stop offset="78%" stop-color="${deep}"/>
      <stop offset="100%" stop-color="#050308"/>
    </radialGradient>
    <radialGradient id="${safe}-glow" cx="50%" cy="52%" r="50%">
      <stop offset="0%" stop-color="${glow}" stop-opacity=".6"/>
      <stop offset="50%" stop-color="${glow}" stop-opacity=".22"/>
      <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${safe}-core" cx="50%" cy="55%" r="45%">
      <stop offset="0%" stop-color="${spark}" stop-opacity=".7"/>
      <stop offset="40%" stop-color="${core}" stop-opacity=".45"/>
      <stop offset="100%" stop-color="${core}" stop-opacity="0"/>
    </radialGradient>
    <filter id="${safe}-soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
  </defs>
  <ellipse cx="128" cy="136" rx="120" ry="112" fill="url(#${safe}-glow)" filter="url(#${safe}-soft)"/>
  <ellipse cx="128" cy="128" rx="94" ry="88" fill="url(#${safe}-body)"/>
  <ellipse cx="128" cy="128" rx="94" ry="88" fill="none" stroke="${glow}" stroke-width="3.5" opacity=".6"/>
  <ellipse cx="128" cy="128" rx="72" ry="66" fill="url(#${safe}-core)"/>
  <ellipse cx="98" cy="96" rx="30" ry="16" fill="#ffffff" opacity=".5"/>
  <ellipse cx="108" cy="108" rx="12" ry="7" fill="#ffffff" opacity=".35"/>
  <ellipse cx="128" cy="128" rx="70" ry="64" fill="none" stroke="#ffffff" stroke-width="1.2" opacity=".16"/>
</svg>`;
}

async function writeWebpFromSvg(svg, outPath, size) {
  const buf = await sharp(Buffer.from(svg))
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 92, alphaQuality: 100 })
    .toBuffer();
  await fs.promises.writeFile(outPath, buf);
}

fs.mkdirSync(circleDir, { recursive: true });
fs.mkdirSync(stoneDir, { recursive: true });

const args = new Set(process.argv.slice(2));
const wantCircles =
  args.has("--all") ||
  args.has("--circles") ||
  (!args.has("--stones") && !args.has("--circles"));
const wantStones =
  args.has("--all") ||
  args.has("--stones") ||
  (!args.has("--stones") && !args.has("--circles"));

let n = 0;
if (wantCircles) {
  for (const [id, theme] of Object.entries(CIRCLES)) {
    await writeWebpFromSvg(circleSvg(id, theme), path.join(circleDir, `${id}.webp`), 1024);
    n += 1;
    console.log("circle", id);
  }
}
if (wantStones) {
  for (const [id, theme] of Object.entries(STONES)) {
    await writeWebpFromSvg(stoneSvg(id, theme), path.join(stoneDir, `${id}.webp`), 128);
    n += 1;
    console.log("stone", id);
  }
}
console.log("done", n, "assets");
