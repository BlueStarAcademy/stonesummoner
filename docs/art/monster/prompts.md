# Monster Portraits & Battle Stills — Painted Pipeline

## Portraits

**Output:** `apps/web/public/art/monster/{artKey}.webp`

- Bust / upper body, facing camera-ish, dark matte
- One art per family; element via CSS `.el-tint-*`

## Battle stills

**Output:** `apps/web/public/art/monster/battle/{artKey}-front.webp` and `-back.webp`

- Full body, consistent scale, **feet fully inside frame**, grounded stance
- ~**12% transparent safe margin** on all sides (alpha must not touch edges)
- front = camera-facing (enemy lane) · back = dedicated rear view for ally lane (never a flip)
- Pure black / charcoal matte → dematte → WebP (+ PNG fallback)
- Do not crop heads or feet; silhouette scale shared across families

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
feet fully visible with generous empty margin all around (~12%),
pure black charcoal background, square composition,
no text, no watermark, no UI, no cropped limbs
```

Roster identity: `docs/art/monster/roster-50.md`.
