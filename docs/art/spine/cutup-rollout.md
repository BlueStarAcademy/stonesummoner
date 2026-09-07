# Spine cutup rollout (still → battle animation)

Independent premium mobile fantasy battle motion. Do **not** copy another game’s
rigs, UI, or VFX. Clip contracts match [`spinePacks.ts`](../../apps/web/src/battle/spinePacks.ts).

## Goal

Replace painted WebP idle with Spine on battle rims while keeping
`/art/monster/battle/{artKey}-front|back.webp` as the book / fallback still.

Required clips: `idle`, `cast`, `hit`  
Optional: `walk`, `run`, `attack`, `ult`, `death` (missing `cast`/`ult` may fall back to `attack`).

Skins: `front` and `back` (no scaleX-only fake rear).

## Source

1. Approved 1024² alpha battle stills (front + back, base + awaken when ready).
2. Follow [`battle-25d-production.md`](../monster/battle-25d-production.md) for
   camera, feet on ground, and front/back pair rules.
3. Pilot reference: [`fire_fang-brief.md`](./fire_fang-brief.md) (full-body
   `body_front` / `body_back` regions on a bone hierarchy is an allowed first ship).

## Pipeline

1. **Still gate** — artKey has front/back WebP under `public/art/monster/battle/`.
2. **Cutup** — Spine 4.2 export:
   - `{id}.json`
   - `{id}-pma.atlas` + `{id}-pma.png`
   - skins `front` / `back`
   - clips at least idle / cast / hit
3. **Install** — copy into `apps/web/public/art/spine/{id}/`.
4. **Register** — add `SPINE_PACKS` entry with `enabled: true`, `requiredAssets`,
   `scale` / `offsetY` tuned for current unit slot (~140–200px art height).
5. **Alias** — family element keys resolve via `resolveSpinePackId` (family prefix).
6. **QA**
   - Ally back + enemy front both plant feet on glow
   - Idle loops; cast/hit return to idle
   - Load failure leaves WebP visible
   - Book/codex still use painted WebP, not broken atlas regions
7. **Ship** — enable only after QA; keep `enabled: false` for incomplete cutups.

## Batch order

Ship family-by-family. Non-Spine units keep CSS still breath
(`.battle-unit-img` idle) so the field never looks half-dead.

Suggested early batches after pilots (`fire_fang`, `wolf_fighter`, `moss_turtle`):

1. Compact / iconic silhouettes (slime, bat, hound)
2. Humanoid attackers (knight, spear, archer)
3. Large tanks / riders

## Scale notes

When battle unit CSS height changes, re-tune pack `scale` and `offsetY` so Spine
fills the slot similarly to the WebP still (see `fire_fang` ~0.48 at ~200px cap).
