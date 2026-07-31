# Symbol / Rune Mark Art — Painted Pipeline

**Goal:** Summoners War–grade set emblems as painted WebP overlays on geometric slot plates.

## Stack note (target look, not our runtime)

| Layer | SW (reference) | StoneSummoner |
|-------|----------------|---------------|
| Client | Unity (+ Vulkan on newer titles) | Vite + Pixi / Capacitor |
| Rune plate | Painted stone + slot silhouette | WebP `plate-{rarity}-{slot}.webp` (SVG fallback) |
| Empty slot | Painted hollow stone | WebP `empty-{slot}.webp` |
| Set mark | Hand-painted 2D emblem | WebP `{setId}-mark.webp` |
| Tools | Photoshop / Clip Studio | Cursor GenerateImage → dematte → WebP |

## Output

```
apps/web/public/art/ui/symbol/{setId}-mark.webp
```

- **Size:** 256×256 (displayed ~36–72 CSS px)
- **Alpha:** outer dark matte punched; emblem opaque
- **Composition:** centered crest only — **no square gold frame** (plate supplies silhouette)

## Master positive

```
Premium Com2uS Summoners War style rune set emblem,
centered ornate magical crest for mobile RPG inventory,
hand-painted 2D digital illustration, ultra detailed metal and gem,
glowing elemental energy, antique gold rim accents,
dark charcoal background suitable for matte punch,
square icon, no text, no watermark, no UI chrome, no outer square frame
```

## Negative

```
text, letters, logo, watermark, UI buttons, comic panel,
flat vector SVG look, low detail, blurry, stock photo,
outer square gold picture frame, white background, watermark
```

## Set prompts (append to master)

| setId | SW | Accent motif |
|-------|-----|----------------|
| hwalro | Energy | Living emerald flame / vitality ember |
| yongmaeng | Fatal | Crimson-orange spearhead with barbs |
| mussang | Blade | Crossed ornate golden sabers + jewel hub |
| haengma | Swift | Layered azure wind wings |
| jipjung | Focus | Jeweled purple crosshair / targeting eye |
| gunhim | Guard | Tower shield with gold rivets |
| yeongyeol | Endure | Interlocking teal bond rings |
| bogang | Shield | Ice-blue barrier crest / braced plate |
| hwangyeok | Revenge | Rebound crescent blades + tip |
| ssangnip | Will | Twin ivory pillars under crown gem |
| eungjing | Nemesis | Rising blood-red gauge spike |
| tagae | Vampire | Crimson fang droplet / blood crystal |
| pamyeol | Destroy | Cracked violet hex crystal |
| myosu | Despair | Spiral maze eye / indigo stun |
| gyeongno | Violent | Stacked scarlet chevron burst |
| chimtu | Rage | Magenta piercing diamond with barbs |

## Generation log

| Date | Tool | Notes |
|------|------|-------|
| 2026-07-31 | Cursor GenerateImage → `process-symbol-marks.mjs` | 16 set marks, 256² WebP, dark matte punched |

Regenerate marks: drop `{setId}-mark.png` into `apps/web/public/art/ui/symbol/`, then `node scripts/process-symbol-marks.mjs`.
