# Monster Portraits & Battle Stills — Painted Pipeline

## artKey

`artKey = {familyId}_{element}` (catalog monster id). **No CSS element tint** on monster images.

| Asset | Path |
|-------|------|
| Portrait | `monster/{artKey}.webp` (768²) |
| Awaken portrait | `monster/{artKey}_awaken.webp` |
| Inventory portrait | `monster/inventory/128/{artKey}.webp` / `monster/inventory/256/{artKey}.webp` |
| Battle front/back | `monster/battle/{artKey}-front.webp` / `-back.webp` (1024²) |
| Awaken battle | `monster/battle/{artKey}-awaken-front.webp` / `-awaken-back.webp` |
| Stage boss front/back | `battle/boss/{bossArtId}-front.webp` / `-back.webp` (1024²) |

Element palette: `element-palette.md`. Per-family notes: `families/{familyId}.md`.

## Delivery format — WebP preferred

Ship **WebP** (alpha, quality ~90–95). Smaller than PNG in the APK/AAB. PNG is OK; install converts to WebP and **does not** leave raw PNG in `public/`.

**Preferred source:** hand-painted **transparent PNG/WebP** (real alpha — no baked checkerboard grid).

**AI generation:** use uniform **magenta `#FF00FF`** plate only (install chroma-keys to alpha). Do **not** use black plate or fake gray checkerboard transparency.

Paint **all five elements** per family (fire / water / wind / light / dark) — element colors baked into the art, not a global filter.

### Stage boss pair

Boss-only enemies use `StageDef.bossArtId` and do not enter the summon roster.
Generate the front first, then use it as the reference for the rear view. Keep
the same proportions, materials, silhouette, and ground line in both images.
The full head, hands, and feet must remain inside a 1:1 frame with generous
padding on a perfectly flat `#FF00FF` plate.

The Cairos Giant pair is installed with:

```bash
node scripts/install-cairos-giant-art.mjs <sourceDir>
```

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
- 768² portrait에서 목록용 128²/256² 투명 WebP 파생본을 함께 생성
- Legacy `--pad` → 768² safe-margin pad (old path; default keeps 1024)

화면별 사용 규칙:
- 인벤토리·도감 목록과 작은 강화 슬롯: 128/256 파생 portrait + `srcset`
- 도감·강화 상세: 1024² battle still (`object-fit: contain`)
- 목록 파생본을 상세 화면에서 확대하지 않음

## Fallback only (tint from one master — low quality)

```bash
npm run monster-art:bake -- --families {familyId}
```

Use only when painted per-element WebPs are not ready. Prefer painted install.

## Prompts

대규모 2.5D 전투 스틸 교체 작업은
[`battle-25d-production.md`](./battle-25d-production.md)의 카메라, 페어 제작,
준비도 감사와 검수 게이트를 우선 적용한다.

### Battle (per element)

```
Premium stylized 2.5D mobile RPG battle character full body,
high-end hand-painted dark fantasy over dimensional 3D-like forms,
eye-level orthographic-like three-quarter camera, coherent anatomy and perspective,
cinematic soft key and rim light, ambient occlusion, physically believable layered materials,
{element} palette baked into paint (see element-palette.md), not filter recolor,
clear solid silhouette with no holes, grounded stance,
feet fully visible with empty margin (~12% sides/top),
transparent PNG alpha background OR solid magenta #FF00FF plate for AI (no black, no checkerboard grid),
square composition,
no raw 3D viewport, no plastic toy render, no flat paper cutout,
no text, no watermark, no UI, no cropped limbs or equipment
```

Generate at **1536×1536 or larger** and deliver PNG/WebP. Install resizes to
transparent **WebP 1024×1024** with contain fitting.

### Portrait (optional, per element)

```
Premium Com2uS Summoners War style monster portrait bust,
ultra detailed hand-painted 2D dark fantasy, {element} palette in paint,
dark charcoal background, square 768×768, no text
```

### Awaken

Same as base + family sheet delta (brighter aura, evolved armor).

### Elemental awakening guardians

Generate isolated full-body front and rear combat stills for the five guardian
IDs: fire forge titan, water glacial abyss titan, wind celestial storm titan,
light solar titan, and dark void titan. Keep both views consistent, centered,
fully visible head-to-feet, and readable at mobile battle scale. Use a flat
near-black or charcoal matte with no ground, cast shadow, text, UI, border, or
frame-touching effects. The manifest installer demattes each source to
transparent 1024² WebP under `/art/battle/boss/`.

The matching essence set uses one shard for low grade, a three-crystal cluster
for mid grade, and an ornate large core for high grade. Generate all 15 icons
with generous margins and install to `/art/ui/res/essence/` at 256².

## QA

```bash
npm run monster-art:check
```

Roster: `roster-50.md`.
