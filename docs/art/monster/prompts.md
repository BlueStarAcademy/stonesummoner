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

Every battle still is identity-locked to its matching portrait card:

- Base front uses `/art/monster/{artKey}.webp` as the primary face, costume,
  weapon, material, and elemental reference.
- Awaken front uses `/art/monster/{artKey}_awaken.webp`.
- Back uses the matching portrait and approved front together, preserving the
  same anatomy, equipment count, costume construction, and elemental details.
- Never reuse, mirror, recolor, or lightly edit an unrelated legacy battle
  character. Front and back are separately painted views of the same individual.

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

Large editable battle sources live on the dedicated art-source branch and are
installed into deployable `main` through `CURSOR_ASSETS`. Do not commit battle
source PNGs to `main`; only installed WebPs under
`apps/web/public/art/monster/battle/` ship with the game.

### Portrait card (per element)

Portrait cards are independent painted assets, not crops when a dedicated
source exists. Generate at **1536×1536 or larger** and install to 768² WebP.

```
Premium modern stylized mobile fantasy monster portrait card,
large readable head and expressive face, upper-body composition,
clean graphic silhouette, crisp cel-shaped forms with rich painterly materials,
high color contrast and sharp facial, weapon, and costume details,
distinctive {element} equipment, material, aura, lighting, and particles,
full-frame fantasy environment background unique to this character variant,
square composition, character fills most of the frame and reads at 56px,
no text, no nameplate, no stars, no frame, no element badge, no watermark
```

- Portrait cards are intentionally **opaque full-frame art**. Do not dematte,
  chroma-key, or flatten a character painted for transparency onto white.
- Backgrounds in one element share a palette, not an identical template:
  vary location, light direction, particles, weather, and distant motifs.
- The five elements retain a recognizable family silhouette but receive
  separately painted equipment, materials, lighting, and effects. No tint bake.
- Awakened art depicts the same individual with a stronger silhouette, evolved
  costume or armor, and a clearly upgraded aura.
- Keep the upper-left corner free of critical facial or weapon details; the UI
  places the editable element badge there.
- Source location:
  `assets/monster/portrait-cards/{artKey}[_awaken].png|webp`.
  The deployable `main` branch omits large editable sources; restore them from
  `art-source/all-assets-2026-09` before running source-based art tooling.

Battle stills remain transparent and continue to follow the battle delivery
rules above.

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
