# Summoner battle stills

**Output:** `apps/web/public/art/summoner/battle/{element}-front.webp` and `-back.webp`

Elements: `fire` · `water` · `wind` · `light` · `dark`

## Quality rules

- Full body matching element portrait identity (`/art/summoner/{element}.webp`)
- Ally uses **back**, enemy uses **front** (same as monsters)
- Feet fully inside frame; ~**12%** transparent safe margin on all sides
- Dedicated rear pose for back (never a horizontal flip)
- Pure black matte → dematte → WebP (+ PNG fallback)

## Master prompt

```
Premium Com2uS Summoners War style summoner battle character full body,
hand-painted 2D dark fantasy, clear silhouette, grounded stance,
feet fully visible with generous empty margin all around (~12%),
pure black charcoal background, square composition,
no text, no watermark, no UI, no cropped limbs
```

Hub / codex / prep continue to use bust portraits at `/art/summoner/{element}.webp`.
