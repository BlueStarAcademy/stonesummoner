# Inventory bust framing

## Goal
Inventory summon icons show **head + torso** clearly (not face-only crops).

## Implementation
- Shared alpha-bbox bust crop: `scripts/lib/bust-crop.mjs`
- Wired into `scripts/process-all-portraits.mjs` and `scripts/install-battle-stills.mjs`
- Softened slime slot CSS nudge in `apps/web/src/style.css`
- Full rebuild: `npm run portraits:rebuild` → 512 ok / 0 warn / 0 missing

## Regenerate
```bash
npm run portraits:rebuild
```

## Notes
- Squat silhouettes (aspect &lt; 0.95, e.g. slime/turtle) keep more of the body.
- Humanoids use ~68% silhouette height, maxZoom 0.68.
