import fs from "node:fs";

const p = "apps/web/scripts/gen-monster-skill-icons.mjs";
let c = fs.readFileSync(p, "utf8");

const roster = [
  "stone_golem", "forest_sprite", "venom_stinger", "cinder_imp", "dew_slime",
  "gale_bat", "sand_lizard", "moss_turtle", "crow_scout", "bone_thrall",
  "mace_soldier", "heal_priest", "magic_archer", "shadow_thief", "thunder_spear",
  "frost_witch", "stone_fist", "herb_alchemist", "capture_hound", "seal_apprentice",
  "flame_warrior", "abyss_pirate", "gale_rider", "sanctuary_guard", "abyss_hexer",
  "dew_healer", "seal_elder", "wolf_fighter", "lotus_dancer", "scout_sniper",
  "steel_armor", "mana_captor", "magma_knight", "glacier_mage", "storm_spearmaster",
  "angel_healer", "demon_hexer", "rune_scholar", "golden_guardian", "shadow_assassin",
  "holy_judge", "abyss_priest", "wyrm_rider", "capture_lord", "dragon_knight",
  "primordial_hierophant", "doom_oracle", "sky_warden", "eternal_healer", "absolute_captor",
];

const motifs = {
  attacker: ["claws", "fire_strike", "inferno"],
  support: ["droplet", "heal_wave", "purify"],
  tank: ["bash", "taunt", "ironwall"],
  debuffer: ["slash", "slow_wind", "wind_mark"],
  stonesage: ["mist_orb", "buff_aura", "regen_mist"],
  capturer: ["arrows", "weakpoint", "arrow_rain"],
};

const roleOf = {
  stone_golem: "tank", forest_sprite: "support", venom_stinger: "debuffer",
  cinder_imp: "attacker", dew_slime: "support", gale_bat: "debuffer",
  sand_lizard: "attacker", moss_turtle: "tank", crow_scout: "capturer",
  bone_thrall: "attacker", mace_soldier: "tank", heal_priest: "support",
  magic_archer: "attacker", shadow_thief: "debuffer", thunder_spear: "attacker",
  frost_witch: "debuffer", stone_fist: "tank", herb_alchemist: "support",
  capture_hound: "capturer", seal_apprentice: "stonesage", flame_warrior: "attacker",
  abyss_pirate: "attacker", gale_rider: "attacker", sanctuary_guard: "tank",
  abyss_hexer: "debuffer", dew_healer: "support", seal_elder: "stonesage",
  wolf_fighter: "attacker", lotus_dancer: "support", scout_sniper: "debuffer",
  steel_armor: "tank", mana_captor: "capturer", magma_knight: "attacker",
  glacier_mage: "debuffer", storm_spearmaster: "attacker", angel_healer: "support",
  demon_hexer: "debuffer", rune_scholar: "stonesage", golden_guardian: "tank",
  shadow_assassin: "attacker", holy_judge: "debuffer", abyss_priest: "debuffer",
  wyrm_rider: "attacker", capture_lord: "capturer", dragon_knight: "attacker",
  primordial_hierophant: "stonesage", doom_oracle: "debuffer", sky_warden: "tank",
  eternal_healer: "support", absolute_captor: "capturer",
};

const els = ["fire", "water", "wind", "light", "dark"];
const entries = roster.map((id, i) => {
  const role = roleOf[id] || "attacker";
  const m = motifs[role];
  const el = els[i % 5];
  return `  {
    monsterId: "${id}",
    element: "${el}",
    skills: [
      { slot: 1, motif: "${m[0]}" },
      { slot: 2, motif: "${m[1]}" },
      { slot: 3, motif: "${m[2]}" },
    ],
  }`;
});

c = c.replace(/const CATALOG = \[[\s\S]*?\];/, `const CATALOG = [\n${entries.join(",\n")}\n];`);
fs.writeFileSync(p, c, "utf8");
console.log("catalog", roster.length);
