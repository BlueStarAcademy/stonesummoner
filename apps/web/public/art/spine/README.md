# Spine assets

## Production packs

| id | Brief | Files |
|----|-------|-------|
| `fire_fang` | [`docs/art/spine/fire_fang-brief.md`](../../../../docs/art/spine/fire_fang-brief.md) | `fire_fang/fire_fang.json` + PMA atlas/png (**shipped**) |

Register in [`apps/web/src/battle/spinePacks.ts`](../../../src/battle/spinePacks.ts). Unregistered catalog ids use WebP.

## Dev-only (not loaded)

```
pilot/
  spineboy-pro.json
  spineboy-pma.atlas
  …
```

Esoteric **spineboy** is kept for local Spine/Pixi plumbing checks only. It is **not** in `SPINE_PACKS` and must not appear in battle or the monster book.

## Adding a pack

1. Follow the `fire_fang` brief (dark fantasy, front/back skins, clip names).
2. Export Spine 4.2 → `{id}.json` + `{id}-pma.atlas` + png under `public/art/spine/{id}/`.
3. Add an entry to `SPINE_PACKS` (clips + optional `skins`).
4. Smoke: battle mount + book preview; confirm other units stay on WebP.

## Runtime

- `pixi.js` + `@esotericsoftware/spine-pixi-v8`
- `mountBattleSpines` / `mountBookPreviewSpine`
- Missing or failed pack load → WebP stays visible
