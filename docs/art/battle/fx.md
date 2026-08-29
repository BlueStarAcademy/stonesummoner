# Battle skill VFX

**Output:** `apps/web/public/art/battle/fx/` (painted sprites, black matte → dematte → WebP)

Runtime: `playSkillVfx` in `apps/web/src/battle/skillVfx.ts`

Hits play as **layered sprite animation** (flash → slash/burst → debris), not CSS circles or squares.

| File | Use |
|------|-----|
| `fx-slash-1/2/3.webp` | Melee slash sequence (contact → full arc → trail) |
| `fx-slash-fire.webp` / `fx-slash-wind.webp` | Elemental slash mid-frame |
| `fx-impact-1.webp` / `fx-impact-3.webp` | Hit flash + flying debris |
| `fx-hit-{fire,water,wind,light,dark}.webp` | Elemental impact peak |
| `fx-hit-crit.webp` | Critical overlay |
| `fx-strike-ult.webp` | Ult overlay |
| `fx-cast.webp` | Caster charge |
| `fx-heal.webp` / `fx-shield.webp` / `fx-buff.webp` / `fx-hex.webp` | Support |
| `fx-bolt.webp` / `fx-bolt-{fire,water,wind,light,dark}.webp` | Traveling projectile (painted WebP only) |
| `fx-orb-{heal,buff,shield}.webp` | Support traveling orbs (painted WebP only) |
| `fx-shockwave.webp` | AoE field |
| `fx-strike.webp` / `fx-hit.webp` | Legacy fallback textures |

## Families

| Family | When | Motion |
|--------|------|--------|
| melee | fire / wind single | Lunge + slash sequence, then elemental burst on target |
| bolt | water / light / dark single | Cast, painted projectile travel, then impact sequence |
| nova | AoE / ult | Charge, shockwave field, staggered per-target bursts |
| support | heal / shield / buff / hex | Cast, then bloom / ward / runes / curse |

**Support heal / buff / shield:** peripheral CSS aura rings at the unit's feet — no skill-icon sprites or square sheets.

**Caster vs recipient:** the caster gets charge + release (core glow / upward sparks); recipients get the foot ring + motes. Damage bolts/novas release on the caster when the projectile fires; impact bursts stay on targets only.

**Battle VFX must never use** `/art/monster/skill/`, `/art/summoner/skill/`, or `/art/ui/skill/` paths — those are UI icons, not FX sprites.

## Process

```
node scripts/process-paint-icons.mjs battle-fx
```

Square painted FX: pure black matte → dematte → 512 WebP. No characters, text, UI, watermark.

Do not open skill FX via full `render()` — spawn/remove overlay nodes only.
