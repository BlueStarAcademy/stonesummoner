# Monster Portraits & Battle Stills — Painted Pipeline

## artKey

`artKey = {familyId}_{element}` (catalog monster id). **No CSS element tint** on monster images.

| Asset | Path |
|-------|------|
| Portrait | `monster/{artKey}.webp` (768²) |
| Awaken portrait | `monster/{artKey}_awaken.webp` |
| Battle front/back | `monster/battle/{artKey}-front.webp` / `-back.webp` (1024²) |
| Awaken battle | `monster/battle/{artKey}-awaken-front.webp` / `-awaken-back.webp` |

Element palette: `element-palette.md`. Per-family notes: `families/{familyId}.md`.

## Delivery format — WebP preferred

Ship **WebP** (alpha, quality ~90–95). Smaller than PNG in the APK/AAB. PNG is OK; install converts to WebP and **does not** leave raw PNG in `public/`.

**Preferred source:** hand-painted **transparent PNG/WebP** (real alpha — no baked checkerboard grid).

**AI generation:** use uniform **magenta `#FF00FF`** plate only (install chroma-keys to alpha). Do **not** use black plate or fake gray checkerboard transparency.

Paint **all five elements** per family (fire / water / wind / light / dark) — element colors baked into the art, not a global filter.

## Asset layout (Cursor assets folder)

```
assets/
  monster/
    battle/
      wolf_fighter_fire-front.webp
      wolf_fighter_fire-back.webp
      wolf_fighter_fire-awaken-front.webp
      wolf_fighter_fire-awaken-back.webp
      wolf_fighter_water-front.webp
      …
    portraits/          # optional — 768² bust, skips auto crop
      wolf_fighter_fire.webp
      wolf_fighter_fire_awaken.webp
```

Flat names under `assets/` also work: `wolf_fighter_fire-front.webp`.

## Install (primary)

```bash
npm run monster-art:install
# or one family:
node scripts/install-battle-stills.mjs --families wolf_fighter,holy_judge
```

- Demattes pre-alpha art (resize only) or chroma/checkerboard AI plates → transparent WebP (1024 battle, 768 portrait)
- Portrait missing → bust crop from battle front
- Legacy `--pad` → 768² safe-margin pad (old path; default keeps 1024)

## Fallback only (tint from one master — low quality)

```bash
npm run monster-art:bake -- --families {familyId}
```

Use only when painted per-element WebPs are not ready. Prefer painted install.

## Prompts

### Battle (per element)

```
Premium Com2uS Summoners War style battle character full body,
ultra detailed hand-painted 2D dark fantasy, intricate fabrics metals and armor,
{element} palette baked into paint (see element-palette.md), not filter recolor,
clear solid silhouette with no holes, grounded stance,
feet fully visible with empty margin (~12% sides/top),
transparent PNG alpha background OR solid magenta #FF00FF plate for AI (no black, no checkerboard grid),
square composition,
no text, no watermark, no UI, no cropped limbs
```

Export **WebP** 1024×1024 (or larger; install resizes to 1024 contain).

### Portrait (optional, per element)

```
Premium Com2uS Summoners War style monster portrait bust,
ultra detailed hand-painted 2D dark fantasy, {element} palette in paint,
dark charcoal background, square 768×768, no text
```

### Awaken

Same as base + family sheet delta (brighter aura, evolved armor).

## QA

```bash
npm run monster-art:check
```

Roster: `roster-50.md`.
