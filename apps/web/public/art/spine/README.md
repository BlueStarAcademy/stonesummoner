# Spine assets

## Production packs

| id | Brief | Status |
|----|-------|--------|
| `fire_fang` | [`docs/art/spine/fire_fang-brief.md`](../../../../docs/art/spine/fire_fang-brief.md) | **enabled** |
| `wolf_fighter` | full-body region pilot | **enabled** |
| `moss_turtle` | full-body region pilot | **enabled** |

Register in [`apps/web/src/battle/spinePacks.ts`](../../../src/battle/spinePacks.ts).
Unregistered catalog ids use WebP + CSS idle breath.

Rollout procedure: [`docs/art/spine/cutup-rollout.md`](../../../../docs/art/spine/cutup-rollout.md).

## Dev-only (not loaded)

```
pilot/
  spineboy-pro.json
  spineboy-pma.atlas
  …
```

Esoteric **spineboy** is for local Spine/Pixi plumbing checks only. It is **not**
in `SPINE_PACKS` and must not appear in battle or the monster book.

## Adding a pack

1. Follow the cutup rollout doc + `fire_fang` brief (front/back skins, clip names).
2. Export Spine 4.2 → `{id}.json` + `{id}-pma.atlas` + png under `public/art/spine/{id}/`.
3. Add `SPINE_PACKS` entry (`enabled`, `requiredAssets`, `scale`/`offsetY`).
4. Smoke: battle mount + cast/hit clips; confirm other units stay on WebP.

## Runtime

- `pixi.js` + `@esotericsoftware/spine-pixi-v8`
- `mountBattleSpines` / `mountBookPreviewSpine`
- Missing or failed pack load → WebP stays visible
