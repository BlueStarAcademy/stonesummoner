# Stages world map art

Expedition (출정) world map uses a **layered** layout — same idea as the home island:

1. **Terrain only** — no baked buildings  
2. **Landmark sprites** — MQ regions (map-01…13 themes) + side content, placed by `%` from data  
3. **UI pins** — clickable overlays on top

## Files

| Asset | Path | Size |
|-------|------|------|
| Terrain | `apps/web/public/art/stages/stages-world-terrain.webp` | **2880×3840** (3:4, expansive pan) |
| Terrain mid | `stages-world-terrain-1080.webp` | 1440×1920 |
| MQ landmarks | `landmark-mq-01.webp` … `mq-13.webp` | 512×512 — match battle `map-01`…`map-13` |
| Side landmarks | `landmark-{artKey}.webp` | 512×512, alpha |
| Legacy | `stages-world-map.png` | unused (baked atlas) |

## Data

Source of truth: [`packages/data/src/stagesMap.ts`](../../packages/data/src/stagesMap.ts)

- `STAGES_MAP_NATURAL` — atlas pixel size (must match terrain WebP)
- `STAGES_MQ_LANDMARK_LAYOUT` — 13 main-quest region vignettes (battle-bg themed)
- `STAGES_LANDMARK_LAYOUT` — side content (challenge tower, etc.)
- `SIDE_CONTENT_PIN_LAYOUT` — derived from side landmark x/y
- Camera home: `STAGES_MAP_HOME_REGION_ID` (`mq1`) — map always opens framed on stage 1

To add a new side building later:

1. Drop `landmark-{artKey}.webp` (512² dematted)
2. Append one row to `STAGES_LANDMARK_LAYOUT`
3. Wire the region id in unlock rules as needed

## Art notes

MQ landmarks are painted from battle arena references (`/art/battle/bg/map-XX.webp`) so each pin matches its combat biome (moonlit forest, flame canyon, end temple, …).

## Camera

`STAGES_WORLD_OVERSCAN ≈ 2.35` so the large atlas pans freely on all axes. Opening the stages view always calls `focusStagesRegion("mq1")`.
