# fire_fang Spine pack

Dark-fantasy pilot summon (`fire_fang` / 불꽃잡이).

## Files

| File | Role |
|------|------|
| `fire_fang.json` | Spine 4.2 skeleton + clips |
| `fire_fang-pma.atlas` | PMA atlas |
| `fire_fang-pma.png` | Atlas page |
| `fire_fang-sheet.png` | Straight-alpha review sheet |
| `src/front.png` / `src/back.png` | Source stills for rebuild |

## Clips

`idle` · `walk` · `run` · `attack` (+ `attack.hit`) · `cast` · `ult` · `hit` · `death`

## Skins

`front` / `back` (also `default` = front). Runtime must not fake back with scaleX alone.

## Rebuild

```bash
node apps/web/scripts/build-fire-fang-spine.mjs
node apps/web/scripts/build-fire-fang-spine.mjs --front path/to/front.png --back path/to/back.png
```

Brief: [`docs/art/spine/fire_fang-brief.md`](../../../../../docs/art/spine/fire_fang-brief.md)
