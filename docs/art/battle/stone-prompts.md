# Battle magic stones (board gems)

**Output:**

- `apps/web/public/art/battle/stone/{fire,water,wind,light,dark}.webp` — summoner-element gems
- `apps/web/public/art/battle/stone/enemy.webp` — enemy fallback when element unknown

## Spec

- **Size:** 256×256 (source may be larger then downscale)
- **View:** standing 3/4 — same camera as battle unit sprites (eye-level, slight downward look). Not top-down.
- **Silhouette:** compact standing gem, like a small crystal chess piece; you see the FRONT face
- **Setting:** short metal collar and a tiny circular foot; contact shadow under the foot
- **Alpha:** outer matte punched; gem body opaque
- **Readability:** strong front specular + glowing elemental core; must read at ~28–40px as a standing piece on the 3/4 arena floor
- **Style:** Summoners War / dark-fantasy mobile RPG painted icon
- **No:** characters, UI, text, watermark, square plate frame, flat coin/medallion, top-down orthographic disc, tabletop 40° dish, tall inventory relic on a gold pedestal

## Master prompt

```
Camera matches a Summoners War standing battle sprite: eye-level 3/4 view,
looking slightly downward at a small object on the ground. The object STANDS
facing the camera. A compact standing magic gem, like a small crystal chess piece.
Round faceted cabochon in a short ornate metal collar with a tiny circular foot.
You see the FRONT FACE of the gem. Vertical silhouette — taller than it is deep.
Soft oval contact shadow under the foot. Compact object filling 76% of the square.
Pure black charcoal background for matte punch.
Square composition, no floor, no magic circle, no text, no watermark, no UI chrome.
FORBIDDEN: top-down disc, flat coin, medallion, tabletop 40-degree dish, tall pedestal relic.
```

## Element accents

| id | Accent |
|----|--------|
| fire | Ember orange / molten gold core, warm bronze collar |
| water | Deep sapphire / teal core, cool silver collar |
| wind | Jade / lime-green core, vine-gold collar |
| light | Radiant white-gold core, holy white-gold collar |
| dark | Violet / abyss purple core, dark-bronze collar |
| enemy | Hostile amethyst / cold violet rival gem (no ally gold rim) |

## Client mapping

- Ally stone (`black`): `/art/battle/stone/{allySummonerElement}.webp`
- Enemy stone (`white`): `/art/battle/stone/{enemySummonerElement}.webp` or `enemy.webp`

On the battle stage the circle is a **floor projection** of the existing 3/4 map (not a top-down camera). Stones billboard back to the map camera so they stand like units.

## Pipeline

Painted (preferred):

```
apps/web/public/art/battle/stone/_src/{id}.png
  → node scripts/process-battle-stones.mjs
  → apps/web/public/art/battle/stone/{id}.webp
```

SVG fallback: `node scripts/gen-battle-circle-stones.mjs --stones`
