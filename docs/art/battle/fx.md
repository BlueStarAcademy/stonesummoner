# Battle skill VFX

**Output:** `apps/web/public/art/battle/fx/` (painted sparks, optional texture)

| File | Use |
|------|-----|
| `fx-strike.webp` | Legacy attacker slash (kept as fallback texture) |
| `fx-hit.webp` | Legacy target impact |
| `fx-hit-crit.webp` | Legacy critical impact |
| `fx-strike-ult.webp` | Legacy ult caster burst |

Skill presentation is **CSS choreography**, not a single shared spark.

Runtime: `playSkillVfx` in `apps/web/src/battle/skillVfx.ts`

## Families

| Family | When | Motion |
|--------|------|--------|
| melee | fire / wind single | Lunge + slash trails, then elemental burst on each target |
| bolt | water / light / dark single | Cast charge, projectile travel, then impact |
| nova | AoE / ult | Charge, field ring on the group, staggered per-target bursts |
| support | heal / shield / buff / hex | Cast aura, then bloom / dome / sigil on targets |

## Impact presets (element × kind)

Fire burst/nova, ice shards, wind cuts/storm, light beam/burst, dark burst/void, heal orbs, shield dome, buff runes, curse hex.

## Rules

- Square painted FX: pure black matte → dematte → WebP
- No characters, text, UI, watermark
- Do not open skill FX via full `render()` — spawn/remove overlay nodes only
