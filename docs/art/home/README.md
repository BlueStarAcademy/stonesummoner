# Home island art

| Asset | Path | Notes |
|-------|------|-------|
| Tri-island hub BG @2x | `apps/web/public/art/home/home-island-tri@2x.webp` | **Active** — 2880×4320 (2:3) |
| Tri-island hub BG | `home-island-tri.webp` | 1440×2160 |
| Tri-island 720 | `home-island-tri-720.webp` | 720×1080 |
| Legacy single plateau | `home-island-bg.webp`, `@2x`, `-720` | Kept for reference; not loaded |

**The archipelago must stay inset with sky margin on every side.** The v1 bitmap ran the main island's cliffs off the left and right borders, so panning sideways showed a sliced cliff face. v2 keeps land inside x 3.9–95.6%, y 22.8–79.3% (verify with `node scripts/debug-island-extent.mjs`).

Palette locked to auth (`#0e0b16` / `#c9a227`).

## Layout (triangular archipelago v5)

The pannable `island-world` keeps the bitmap's **2:3 ratio** and is sized at `max(100cqw, 66.67cqh) × 1.7` (`--island-oversize`, mirrored by `ISLAND_WORLD_OVERSIZE`). Zoom stays locked; building sprites stay ~88px so landmasses read larger beside them. Drag to pan across the triangular archipelago. Cover sizing plus hard pan clamp keep the bitmap filling the viewport at every stop (`rotateX` is 0). Do not contain-fit the land bbox into one screen — that was a regression of the drag map.

**Coordinate rule:** spot positions are percentages of `island-world`, so the world box must never letterbox or crop the bitmap — hence the matching aspect ratio and `object-fit: fill` on `.island-map-img`. Any `cover`/`contain` mismatch slides every building off its painted pad by a screen-size-dependent amount.

| Islet | Buildings |
|-------|-----------|
| Center · Main | summon_hearth, power_circle, gateway, shop |
| SW · Growth | mana_pond, wish, dojo, crystal_mine |
| SE · Society | party, glory, guild, fusion |

Defaults live in `ISLAND_LAYOUT_DEFAULT` (`apps/web/src/main.ts`). Landmasses and bridges are **painted into the bitmap**. Placeable spots snap to `ISLAND_LANDING_PADS` (hex/plaza platforms); soft ellipses in `ISLAND_LAND_ZONES` keep edits on the three islets (no water / sky).

Pad coordinates are measured off the bitmap. After any art change, re-run these from the repo root:

| Script | Purpose |
|--------|---------|
| `debug-island-pads.mjs [out.png]` | Auto-detects the beige terraces and prints centroids as percentages — the source of `ISLAND_LANDING_PADS`. Filters needed: bridges and stair landings also register, so drop thin/low-area blobs. |
| `debug-island-extent.mjs` | Land bounding box; confirms sky margin on all four sides. |
| `debug-island-grid.mjs [out.png]` | Percentage grid plus current pads and zones drawn over the map — the verification pass. |
| `debug-island-crop.mjs <x0> <y0> <x1> <y1> out.png` | Zooms one islet with a 1% grid for hand-checking plaza centres. |
| `build-island-map.mjs <source.png>` | Exports the source painting to the three WebP sizes. |

All of them assume the bitmap ratio in their `BASE_W`/`BASE_H` constants — update those together with `.island-world`'s `aspect-ratio` if the art ratio ever changes.

Building sprites stay separate: `/art/hub/bldg-*.webp` (see [`docs/art/hub/prompts.md`](../hub/prompts.md)). Do **not** bake buildings into the map.

## Tri-island bitmap prompt

```
Premium Com2uS Summoners War style fantasy floating archipelago map background,
high-angle isometric three-quarter view, portrait mobile composition.
THREE connected floating islands arranged in a triangle, rendered SMALL and fully contained
in the centre of the frame with a WIDE generous margin of empty bright blue sky and a sea of
white clouds on ALL FOUR SIDES — the left and right edges of the picture must be pure open sky
and clouds only, with no land, no rock, no cliff and no waterfall touching or crossing the
picture border. The archipelago occupies only the middle 70 percent of the image width.
(1) large central main island upper-middle, ornate circular stone plaza with golden compass floor
    pattern, several empty flat hexagonal stone terraces and clear landing pads, crystal pillars,
    gardens, waterfalls spilling into clouds,
(2) smaller southwest growth island lower-left linked by a slender stone bridge, ponds,
    a circular plaza and empty hexagonal craft terraces,
(3) smaller southeast society island lower-right linked by a stone bridge, banners,
    a circular plaza and empty hexagonal adventure terraces.
Steep rocky cliffs, lush green vegetation, pink blossom trees, glowing crystals,
no buildings baked in, no characters, no people, no UI chrome, no text, no watermark, no border frame.
Hand-painted 2D dark fantasy mobile RPG hub map, bright saturated colors,
clean readable silhouettes, flat empty stone pads reserved for overlay sprites.
```

The "middle 70 percent" instruction is what buys the side margin — the generator still fills ~92% of the width, so ask for more inset than you need.

### Output pipeline

1. Generate / paint the source PNG (portrait).
2. Export the WebP sizes:

```bash
node scripts/build-island-map.mjs path/to/source.png
```

3. Update `ISLAND_MAP_NATURAL`, the `<img width/height>` in `renderHome()`, and `.island-world`'s `aspect-ratio` if the ratio changed.
4. Re-measure pads (see the script table above) and bump `ISLAND_LAYOUT_KEY` + `ISLAND_COVER_FIT_VERSION` so saved layouts and camera positions reset.
