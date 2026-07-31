# Symbol plates & empty slots — Painted Pipeline

**Goal:** Summoners War–grade painted rune stones (slot silhouette + recessed well). Set marks (`*-mark.webp`) overlay the well.

## Outputs

```
apps/web/public/art/ui/symbol/plate-{rarity}-{1..6}.webp
apps/web/public/art/ui/symbol/empty-{1..6}.webp
```

- **Size:** 256×256
- **Alpha:** outer matte punched; stone body opaque; center well dark (marks sit on top via CSS ~48–58%)
- **Rarities:** `normal` | `magic` | `rare` | `epic` | `legendary` | `mythic`
- SVG kept as fallback

## Slot silhouettes

| slot | Shape |
|------|--------|
| 1 | Circle |
| 2 | House / pentagon point-up |
| 3 | Triangle point-up |
| 4 | Trapezoid (wide top, narrow bottom) |
| 5 | Hexagon |
| 6 | Diamond / rhombus |

## Master plate

```
Premium Com2uS Summoners War style rune stone plate,
hand-painted 2D mobile RPG inventory icon,
carved magical stone with ornate gold metal rim,
deep recessed dark center well for emblem overlay,
{SHAPE} silhouette only, glowing {RARITY} energy aura,
dark charcoal background for matte punch,
square composition, no text, no watermark, no UI chrome, no set emblem inside well
```

| rarity | Accent |
|--------|--------|
| normal | Dull iron / pewter |
| magic | Emerald green glow |
| rare | Sapphire blue glow |
| epic | Amethyst purple glow |
| legendary | Crimson ruby glow |
| mythic | Brilliant gold / solar glow |

## Master empty

```
Premium Com2uS Summoners War style empty rune slot,
hand-painted 2D, ornate bronze-gold hollow stone frame,
deep empty dark recessed well, no emblem inside,
{SHAPE} silhouette, subtle idle glow, dark charcoal background,
square, no text, no numbers, no watermark
```

## Generation log

| Date | Tool | Notes |
|------|------|-------|
| 2026-08-01 | GenerateImage → `process-symbol-plates.mjs` | 36 plates (6 rarity × 6 slots) + 6 empties, 256² WebP |

Regenerate: drop `plate-*.png` / `empty-*.png` into `apps/web/public/art/ui/symbol/`, then `node scripts/process-symbol-plates.mjs`.
