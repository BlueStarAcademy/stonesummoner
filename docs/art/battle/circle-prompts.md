# Battle magic circles (board floor)

**Output:** `apps/web/public/art/battle/circle/{id}.webp`

IDs match [`BATTLE_BG_IDS`](../../../apps/web/src/battle/battleBg.ts) / arena backgrounds.

## Spec

- **Size:** 1024×1024
- **View:** top-down circular ritual floor (magic circle under the go board)
- **Alpha:** outer matte punched; circle body opaque
- **Center:** dark recessed grid / node wells for stones — avoid busy central emblems that fight stone readability
- **Style:** Summoners War / dark-fantasy mobile RPG, hand-painted 2D
- **No:** characters, UI, text, watermark, square frame chrome

## Master prompt

```
Premium Com2uS Summoners War style top-down magic circle ritual floor,
circular composition only, ornate stone and metal rings with glowing runes,
dark recessed center with subtle grid nodes for board stones,
outer edges fade to pure black charcoal for matte punch,
hand-painted 2D fantasy mobile RPG, ultra detailed, no characters, no UI, no text, no watermark
```

## Theme by id

| id | Theme accent |
|----|----------------|
| map-01 | Moonlit forest — silver-green moss stone, soft lunar cyan glow |
| map-02 | Stone tower — grey masonry, banner gold trim |
| map-03 | Ancient ruins — cracked sandstone, turquoise relic light |
| map-04 | Misty wetland — wet slate, pale green fog glow |
| map-05 | Flame canyon — basalt, ember orange / magma veins |
| map-06 | Frost highland — ice crystal rings, cold blue-white |
| map-07 | Thunder mountain — dark granite, electric violet-yellow arcs |
| map-08 | Abyss coast — wet black stone, deep teal abyss glow |
| map-09 | Sealed fortress — iron bands, sealing-sigil gold |
| map-10 | Golden desert — sandstone, sun-gold inlays |
| map-11 | Starlight jungle — vine-wrapped stone, bioluminescent violet |
| map-12 | Obsidian underground — volcanic glass, magenta cracks |
| map-13 | End temple — white marble, apocalyptic gold/crimson runes |
| cairos-giant | Giant cavern — black-basalt ring, gold-bronze seals, four amber crystal pillars |
| cairos-dragon | Dragon lair — lava channels, scale-metal trim |
| cairos-necro | Necropolis — bone-inlay rings, sickly green ghostlight |
| arena | PvP coliseum — sand-scored stone, competitive crimson/gold |
| depth | Deep dungeon — dripping dungeon stone, cold cyan |
| equip | Vault forge — anvil-forged metal rings, forge orange |
| weekday | Training yard — clean practice circle, soft training-blue |

### Cairos Giant production prompt

```
Exact top-down circular ritual floor, huge carved black-basalt outer ring,
weathered gold-bronze seal bands, four restrained amber crystal pillars,
glowing amber rune seams, dark recessed inner field with only a subtle 7 by 7
node rhythm, outer area fading to pure charcoal-black matte, no perspective
tilt, no characters, no UI frame, no loose stones, no text, no watermark.
```

## Pipeline

Painted (preferred):

```
apps/web/public/art/battle/circle/_src/{id}.png
  → node scripts/process-battle-circles.mjs
  → apps/web/public/art/battle/circle/{id}.webp
```

SVG fallback generator (overwrites WebPs — avoid after painted install):

```
node scripts/gen-battle-circle-stones.mjs --circles
```

Fallback in client: `map-01` (same as battle BG).

Board stones: [stone-prompts.md](./stone-prompts.md). Effect relics: [mark-prompts.md](./mark-prompts.md).

## Elemental awakening circles

Create exact top-down concentric painted circles for `awaken-fire`,
`awaken-water`, `awaken-wind`, `awaken-light`, and `awaken-dark`. Keep the
entire radial silhouette inside the square with a wide flat dark matte margin.
Use forge runes, glacial leviathan glyphs, cloud-scroll cyclone runes, solar
rays, and void glyphs respectively. No perspective, text, UI frame, loose
stones, or cropped edges. The manifest installer demattes and writes 1024²
WebP output.
