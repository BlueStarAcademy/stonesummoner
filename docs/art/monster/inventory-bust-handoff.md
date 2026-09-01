# Inventory bust framing — handoff

## Goal
Make inventory summon icons clearly show **head + torso** (not face-only crops).

## Done
- Shared alpha-bbox bust crop: `scripts/lib/bust-crop.mjs`
- Wired into `scripts/process-all-portraits.mjs` and `scripts/install-battle-stills.mjs`
- Softened slime slot CSS nudge in `apps/web/src/style.css`
- Partial portrait/inventory rebuild (~422 / ~507 art keys) before pause

## Resume (evening)
```bash
git checkout cursor/inventory-bust-framing-7b23
git pull
npm run portraits:rebuild   # finishes remaining keys (safe to re-run all)
# optional QA contact sheet, then PR → main
```

Rebuild is idempotent — re-running regenerates all portraits + `inventory/128|256` derivatives.

## Notes
- Squat silhouettes (aspect &lt; 0.95, e.g. slime/turtle) keep more of the body.
- Humanoids use ~68% silhouette height, maxZoom 0.68.
- Do **not** merge half-rebuilt assets alone; finish rebuild first for consistent framing.
