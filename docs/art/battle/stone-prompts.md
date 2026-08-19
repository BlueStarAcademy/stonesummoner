# Battle magic stones (board gems)

**Output:**

- `apps/web/public/art/battle/stone/{fire,water,wind,light,dark}.webp` — summoner-element gems
- `apps/web/public/art/battle/stone/enemy.webp` — enemy fallback when element unknown

## Spec

- **Size:** 256×256 (source may be larger then downscale)
- **View:** 3/4 seated cabochon — camera ~40° above the floor (same as the tilted battle board)
- **Silhouette:** chunky round gem in a shallow metal dish; you see the dome top AND the front of the bezel
- **Setting:** shallow circular metal dish; base near the bottom of the frame with a contact shadow
- **Alpha:** outer matte punched; gem body opaque
- **Readability:** strong specular on the dome + glowing elemental core; must read at ~28–40px on the tilted board
- **Style:** Summoners War / dark-fantasy mobile RPG painted icon
- **No:** characters, UI, text, watermark, square plate frame, flat coin/medallion, top-down orthographic disc, upright egg, gold pedestal stand

## Master prompt

```
Camera 40 degrees above the ground looking slightly down at a tabletop game piece.
A chunky round magic cabochon gem with real 3D thickness seated in a shallow circular metal dish.
You see the curved dome TOP and the front wall of the bezel. Soft contact shadow under the base.
Compact object filling 80% of the square. Pure black charcoal background for matte punch.
Square composition, no floor, no magic circle, no text, no watermark, no UI chrome.
FORBIDDEN: flat coin, medallion, top-down disc, upright egg, standing inventory relic, teardrop pedestal.
```

## Element accents

| id | Accent |
|----|--------|
| fire | Ember orange / molten gold core, warm bronze bezel |
| water | Deep sapphire / teal core, cool silver bezel |
| wind | Jade / lime-green core, vine-gold bezel |
| light | Radiant white-gold core, holy white-gold bezel |
| dark | Violet / abyss purple core, dark-bronze bezel |
| enemy | Hostile amethyst / cold violet rival gem (no ally gold rim) |

## Client mapping

- Ally stone (`black`): `/art/battle/stone/{allySummonerElement}.webp`
- Enemy stone (`white`): `/art/battle/stone/{enemySummonerElement}.webp` or `enemy.webp`

## Pipeline

Painted (preferred):

```
apps/web/public/art/battle/stone/_src/{id}.png
  → node scripts/process-battle-stones.mjs
  → apps/web/public/art/battle/stone/{id}.webp
```

SVG fallback: `node scripts/gen-battle-circle-stones.mjs --stones`
