# Spine pilot brief — `fire_fang` artKey (석랑 패밀리)

Pilot Spine pack shared by **석랑** (`seokrang_*`) via `artKey: "fire_fang"`.
Catalog display name is **석랑** (element-neutral); attribute variants differ in skills, not species name.

**Status:** runtime registered · Spine 4.2 pack shipped (full-body front/back regions + bone clips)  
**Date:** 2026-07-27  
**Spine Editor:** 4.2.x (matches `@esotericsoftware/spine-pixi-v8@~4.2`)

Representative dark-fantasy summon pack that replaces Esoteric **spineboy** as the in-game character look. All later monster packs should follow this brief.

> Pilot note: current export uses full-body `body_front` / `body_back` regions driven by a bone hierarchy (idle/walk/attack/…). Multi-mesh limb cutups can replace regions later without changing clip names.

## Target

| Field | Value |
|-------|--------|
| id | `fire_fang` |
| nameKo | 불꽃잡이 |
| element | fire |
| role | attacker |
| stars | 3 |
| skills (tone) | 할퀴기 / 화염일격 / 작열 |
| output dir | [`apps/web/public/art/spine/fire_fang/`](../../apps/web/public/art/spine/fire_fang/) |
| registry | [`apps/web/src/battle/spinePacks.ts`](../../apps/web/src/battle/spinePacks.ts) |

## Art direction

Match auth key art palette ([`docs/art/auth/prompts.md`](../auth/prompts.md)):

- indigo/obsidian `#0e0b16`, antique gold `#c9a227`, optional soft mana rim
- **Dark fantasy illustration** — weighty silhouette, charcoal / lava crack / claw / hide materials
- Slightly heroic proportions — **no chibi / heavy deform**
- Eyes: beast slits or narrow highlights — not oversized anime sparkle eyes

### Positive skeleton

```
Dark fantasy mobile RPG monster, full-body fire beast summon
"Fire Fang", charcoal-and-ember hide, molten cracks along limbs,
obsidian claws, ember mane, cinematic rim light, antique gold micro-filigree optional,
premium Com2uS-adjacent dark fantasy (NOT anime), readable silhouette,
transparent background, front and back facing variants
```

### Negative

```
anime chibi, school uniform, cute mascot, spineboy, plastic toy 3D,
bright pastel, candy purple, oversized sparkle eyes, moe face,
comic screentone, sticker, emoji proportions
```

## Rig / parts

Minimum bones:

- root → hip → torso → neck → head
- L/R upper arm → forearm → hand/claw
- L/R thigh → shin → foot
- short tail; optional mane / ember FX bone

Slots: `body`, `head`, `claws`, `mane`, `ember_glow` (additive OK)

## Facing

| Use | Requirement |
|-----|-------------|
| Enemy lane (top) | skin `front` |
| Ally lane (bottom) | skin `back` — real dorsal view |
| Monster book | front default; turntable may swap front↔back |

**Do not** ship back facing as scaleX mirror only. Runtime uses `pack.skins.front` / `pack.skins.back`.

## Animation clips

Names must match Spine animation names (and `SPINE_PACKS.fire_fang.clips`).

| Clip | Loop | Length guide | Notes |
|------|------|--------------|-------|
| `idle` | yes | 2–3s | Breath / ember; weighty micro-motion |
| `walk` | yes | 0.8–1.2s | Approach to target |
| `run` | yes | 0.6–0.9s | Short lunge |
| `attack` | no | 0.5–0.8s | Claw / flame strike — clear hit frame |
| `cast` | no | 0.6–1.0s | Light wind-up (summoner pack is separate) |
| `ult` | no | 0.8–1.2s | 작열 — AoE read, not cute |
| `hit` | no | 0.25–0.4s | Recoil |
| `death` | no | 0.8–1.5s | Collapse / ash |

**Event:** `attack.hit` on impact frame (sync damage float).

## Export layout

```
public/art/spine/fire_fang/
  fire_fang.json
  fire_fang-pma.atlas
  fire_fang-pma.png
```

JSON + PMA atlas preferred.

## Runtime wiring

- `SPINE_PACKS.fire_fang` registered with clip map + `skins: { front, back }`
- `resolveSpinePackId("fire_fang")` → `"fire_fang"`; all other ids → `null` (WebP)
- Esoteric spineboy under `public/art/spine/pilot/` is **dev-only** and **not** in `SPINE_PACKS`
- Pack files live under `public/art/spine/fire_fang/`; rebuild via `apps/web/scripts/build-fire-fang-spine.mjs`
- `attack.hit` dispatches `spine-attack-hit` on the host element

## QA checklist

- [x] Spine 4.2 JSON parses (`scripts/_verify-fire-fang-spine.mjs`)
- [x] front/back skins + regions present
- [x] Required clips + `attack.hit` event
- [x] Registered in `SPINE_PACKS` + `resolveSpinePackId` aliases (`seokrang_*`)
- [x] Transparent PMA atlas (no black matte on sheet)
- [x] Clip names match battle x1–x3 hooks (`idle`…`death`)
- [ ] Manual visual pass in browser battle/book (operator)
- [ ] Art direction sign-off (not anime / chibi)

## Sibling pilot packs (clone rig)

Until unique exports ship, `wolf_fighter` and `moss_turtle` reuse the fire_fang bone/clip layout with family battle stills for book UI. See `spinePacks.ts`.

## Out of scope

- Full roster Spine batch
- Summoner-only pack (separate brief later)
- Battle arena theme packs
