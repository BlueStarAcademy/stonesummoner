# Battle magic stones (board gems)

**Output:**

- `apps/web/public/art/battle/stone/{fire,water,wind,light,dark}.webp` — summoner-element gems
- `apps/web/public/art/battle/stone/enemy.webp` — enemy fallback when element unknown

## Spec

- **Size:** 128×128 (source may be 256×256 then downscale)
- **Silhouette:** slightly oval “go stone” / magic gem (matches CSS `.magic-stone` oval)
- **Alpha:** outer matte punched; gem body opaque
- **Readability:** strong specular highlight + glowing elemental core; must read at ~28–40px on mobile
- **Style:** Summoners War / dark-fantasy mobile RPG painted icon
- **No:** characters, UI, text, watermark, square plate frame

## Master prompt

```
Premium Com2uS Summoners War style magic go-stone gem icon,
slightly oval polished magical stone, glowing elemental core,
hand-painted 2D mobile RPG inventory-quality icon,
centered on dark charcoal background for matte punch,
square composition, no text, no watermark, no UI chrome
```

## Element accents

| id | Accent |
|----|--------|
| fire | Ember orange / molten gold core, warm corona |
| water | Deep sapphire / teal core, cool ripples |
| wind | Jade / lime-green core, airy spark trails |
| light | Radiant white-gold core, holy soft bloom |
| dark | Violet / abyss purple core, shadow rim |
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
