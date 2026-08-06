# Monster Portraits & Battle Stills — Painted Pipeline

## Portraits

**Output:** `apps/web/public/art/monster/{artKey}.webp`

- Bust / upper body, facing camera-ish, dark matte
- One art per family; element via CSS `.el-tint-*`

## Battle stills

**Output:** `apps/web/public/art/monster/battle/{artKey}-front.webp` and `-back.webp`

- Full body, consistent scale, **feet fully inside frame**, grounded stance
- Safe margin ~12% top/sides, ~5% bottom after pad (alpha must not touch edges)
- front = camera-facing · back = dedicated rear (never a flip)
- Pure black matte → dematte lim≈44 (low-chroma) contain → asymmetric pad → WebP
- Ultra detailed costume; keep dark armor readable (do not blend into matte)

### Master portrait

```
Premium Com2uS Summoners War style monster portrait bust,
ultra detailed hand-painted 2D dark fantasy character, intricate costume,
dark charcoal background, square composition, no text, no watermark
```

### Master battle

```
Premium Com2uS Summoners War style battle character full body,
ultra detailed hand-painted 2D dark fantasy, intricate fabrics metals and armor,
clear solid silhouette with no holes, grounded stance,
feet fully visible with empty margin (~12% sides/top),
pure black charcoal background ONLY, square composition,
no text, no watermark, no UI, no cropped limbs
```

Process: `node scripts/process-battle-stills.mjs`

Roster identity: `docs/art/monster/roster-50.md`.
