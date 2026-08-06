# Summoner battle stills

**Output:** `apps/web/public/art/summoner/battle/{element}-front.webp` and `-back.webp`

Elements: `fire` · `water` · `wind` · `light` · `dark`

## Quality rules

- Full body matching element portrait identity (`/art/summoner/{element}.webp`)
- Ally uses **back**, enemy uses **front**
- Feet fully inside frame; safe margin ~12% top/sides, ~5% bottom after pad
- Dedicated rear pose for back (never a flip)
- Pure black matte → **dematte (lim≈44, low-chroma)** → asymmetric pad → WebP
- High detail costume, hair, weapons; solid silhouette (no dark-cloth holes)

## Master prompt

```
Premium Com2uS Summoners War style summoner battle character full body,
ultra detailed hand-painted 2D dark fantasy, intricate costume fabrics and metal,
clear solid silhouette, grounded stance on implied floor,
feet fully visible with empty margin around (~12% sides/top),
pure black charcoal background ONLY (no grey floor plate),
square composition, no text, no watermark, no UI, no cropped limbs
```

Process: `node scripts/process-battle-stills.mjs --dir apps/web/public/art/summoner/battle`
