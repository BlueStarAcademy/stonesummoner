# Stages world map art

Expedition (출정) world map — **buildings are baked into the terrain**.

1. **Terrain** — bright HQ biome atlas with stage buildings painted in  
2. **UI pins only** — clickable labels; `%` coords target each building plaza  
3. **New content later** — keep the same map composition; redraw the atlas and add the new building into the image (do not go back to overlay sprites)

Biome bands follow MAIN QUEST south→north. Side islands are themed per dungeon.

## Files

| Asset | Path | Size |
|-------|------|------|
| Terrain | `apps/web/public/art/stages/stages-world-terrain.webp` | **2880×3840** (3:4) bright HQ, baked buildings |
| Terrain mid | `stages-world-terrain-1080.webp` | 1440×1920 |
| Landmark WebPs | `landmark-*.webp` | legacy overlays (unused while buildings are baked) |
| Legacy | `stages-world-map.png` | early baked atlas (style reference) |

## Demo pin authoring

Demo accounts get **맵 배치** on the expedition map:
1. Drag pins onto the painted building plazas
2. **완료** saves `%` coords to `localStorage` (`stonesummoner.stages.pinLayout.v1`)
3. **좌표 복사** exports MQ + side `x/y` for pasting into `stagesMap.ts` / `scenario.ts`

## Pad layout (source of truth)

[`packages/data/src/stagesMap.ts`](../../packages/data/src/stagesMap.ts) + matching `MAIN_QUEST_AREAS` x/y in `scenario.ts`.

| Role | Pins |
|------|------|
| Main quest road | 13 plazas, south→north |
| Side content | 7 island plazas (tower, trials, dungeons, arena, guild) |

Camera home: `STAGES_MAP_HOME_REGION_ID` (`mq1`).

## Art notes

- Prefer baking buildings into the terrain for visual quality.  
- When adding a stage/dungeon later: extend the same atlas (same overall form) and paint the new building in.  
- Pin `%` must match the plaza under each painted building.  
