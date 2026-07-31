# Monster Portraits & Battle Stills — Painted Pipeline

## Portraits

**Output:** `apps/web/public/art/monster/{artKey}.webp`

- Bust / upper body, facing camera-ish, dark matte
- One art per family; element via CSS `.el-tint-*`

## Battle stills

**Output:** `apps/web/public/art/monster/battle/{artKey}-front.webp` and `-back.webp`

- Full body, consistent scale, grounded
- front = enemy-facing · back = ally-facing dedicated rear view
- Dark matte → dematte

### Master portrait

```
Premium Com2uS Summoners War style monster portrait bust,
hand-painted 2D dark fantasy character, detailed costume,
dark charcoal background, square composition, no text, no watermark
```

### Master battle

```
Premium Com2uS Summoners War style battle character full body,
hand-painted 2D dark fantasy, clear silhouette, grounded stance,
dark charcoal background, no text, no watermark, no UI
```

Roster identity: `docs/art/monster/roster-50.md`.
