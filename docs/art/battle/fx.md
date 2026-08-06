# Battle skill VFX

**Output:** `apps/web/public/art/battle/fx/`

| File | Use |
|------|-----|
| `fx-strike.webp` | Attacker slash / strike burst |
| `fx-hit.webp` | Target impact flash |
| `fx-hit-crit.webp` | Critical hit impact |
| `fx-strike-ult.webp` | Summoner ult caster burst |

## Rules

- Square, pure black matte → dematte → WebP
- No characters, text, UI, watermark
- Spawned at runtime via `spawnUnitVfx` in `apps/web/src/battle/fx.ts`
