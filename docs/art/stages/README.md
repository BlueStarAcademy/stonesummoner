# Stages world map art

Expedition (출정) world map uses a **layered** layout — same idea as the home island:

1. **Terrain only** — no baked buildings  
2. **Landmark sprites** — placed by `%` from data  
3. **UI pins** — clickable overlays on top

## Files

| Asset | Path | Size |
|-------|------|------|
| Terrain | `apps/web/public/art/stages/stages-world-terrain.webp` | **2160×2880** (3:4) |
| Terrain mid | `stages-world-terrain-1080.webp` | 1080×1440 |
| Landmarks | `landmark-{artKey}.webp` | 512×512, alpha |
| Legacy | `stages-world-map.png` | unused (baked atlas) |

## Data

Source of truth: [`packages/data/src/stagesMap.ts`](../../packages/data/src/stagesMap.ts)

- `STAGES_MAP_NATURAL` — atlas pixel size (must match terrain WebP)
- `STAGES_LANDMARK_LAYOUT` — `{ id, artKey, x, y, scale, landmarkKo }`
- `SIDE_CONTENT_PIN_LAYOUT` — derived from landmark x/y (do not fork coords)
- Main-quest pins live on `MAIN_QUEST_AREAS` in `scenario.ts` (south→north spine)

To add a new side building later:

1. Drop `landmark-{artKey}.webp` (512² dematted)
2. Append one row to `STAGES_LANDMARK_LAYOUT`
3. Wire the region id in `stagesRegions()` / unlock rules as needed

## Art prompts

**Terrain:** bright daytime fantasy expedition map, high-angle 3/4 view, empty stone plazas and plateaus for overlays, **no buildings**, azure sky, wide open feel.

**Landmark:** Summoners War–style hand-painted 2D building sprite, isometric three-quarter, grounded base, transparent background, square crop. Challenge Tower is a dedicated tall tower — do not reuse the home gate art.

## Processing

```bash
# Terrain
npx sharp-cli -i src.png -o apps/web/public/art/stages/stages-world-terrain.webp \
  resize 2160 2880 --fit cover

# Landmark (after PNG dematte or via scripts/lib/dematte-webp.mjs)
node -e "import('./scripts/lib/dematte-webp.mjs').then(m => m.pngToDematteWebp('in.png','out.webp',{size:512,lim:48,fit:'contain'}))"
```

## Camera

`STAGES_WORLD_OVERSCAN ≈ 1.9` in `apps/web/src/main.ts` so the larger atlas pans with a wide expedition feel. Bump `STAGES_MAP_FIT_VERSION` when natural size or overscan changes.
