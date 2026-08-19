# Battle board marks (effect relics)

**Output:** `apps/web/public/art/battle/mark/{id}.webp`

Painted relics for special circle cells (forbid / bait / victory / star) and Module A tokens. SVG files in the same folder remain onerror fallbacks.

## Spec

- **Size:** 256×256
- **Silhouette:** upright inventory relic (not a circular UI plate)
- **Alpha:** outer matte punched; relic body opaque
- **Readability:** must read at ~28–40px on the tilted board
- **Style:** Summoners War / dark-fantasy mobile RPG painted icon
- **No:** characters, UI, text, watermark, circular medal plate, square frame chrome

## Master prompt

```
Premium Com2uS Summoners War style painted relic icon,
ultra detailed inventory-quality 3D object standing upright,
cinematic lighting, glowing magical core, floating spark particles,
centered on pure black charcoal background for matte punch,
square composition, no circular plate, no text, no watermark, no UI chrome
```

## Ids

| id | Relic |
|----|--------|
| forbid | Crimson sealing brand / crossed iron wards |
| bait | Golden fishing hook with amber lure gem |
| victory | Ornate gold crown with radiant jewel |
| star | White-gold hex star relic on a spike |
| crit_charm | Ember paper charm / ofuda with fire seal |
| shield_core | Crystal kite shield with icy core |
| capture_magnet | Amethyst horseshoe magnet with gold tips |
| stride_sand | Gold hourglass filled with glowing sand |
| seal_nail | Ritual iron nail bound with gold-red ribbon |
| element_ward | Pentacle ward with five elemental gems |
| bait_stone | Amber lure-stone with a small hook |
| transform_dust | Ornate vial of gold-violet transmutation dust |

## Pipeline

```
apps/web/public/art/battle/mark/_src/{id}.png
  → node scripts/process-battle-marks.mjs
  → apps/web/public/art/battle/mark/{id}.webp
```
