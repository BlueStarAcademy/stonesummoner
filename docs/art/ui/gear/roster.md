# Gear icon roster (125 HQ WebP)

## Counts

| Group | Formula | Count |
|-------|---------|-------|
| Weapons | 5 elements × ★1–5 | 25 |
| Armor + accessories | 5 slots × 4 materials × ★1–5 | 100 |
| **Total** | | **125** |

## Filename patterns

| Kind | Pattern | Example |
|------|---------|---------|
| Weapon | `weapon-{element}-s{star}.webp` | `weapon-fire-s5.webp` |
| Common | `{slot}-{material}-s{star}.webp` | `top-chain-s3.webp` |

- `{element}`: `fire` `water` `wind` `light` `dark`
- `{material}`: `cloth` `leather` `chain` `plate`
- `{slot}`: `top` `bottom` `shoes` `ring` `necklace`
- `{star}`: `1` … `5` (★ grade — visual tier in art)

Legacy fallbacks (keep): `{slot}-{setId}.webp`, `{slot}.webp`, SVG.

## Output spec

- **512×512** WebP, alpha, quality ~92
- **Dematte:** charcoal `#0a0a0a` plate, flood-fill from edges (`install-gear-art.mjs`)
- **Display:** ~42–88 CSS px in UI; painted at 512 for sharp mobile scaling

## Star grade visual (★1 → ★5)

| ★ | Look |
|---|------|
| 1 | plain, worn, minimal trim |
| 2 | clean edges, subtle polish |
| 3 | ornate trim, small gems |
| 4 | glowing accents, richer materials |
| 5 | legendary aura, crown gems, max detail |

## Pipeline

1. Paint PNG 512² (or larger) → `assets/gear/{stem}.png` or Cursor assets folder
2. `npm run gear-art:install` (or `--stems weapon-fire-s5,top-cloth-s1`)
3. `npm run gear-art:check -- --strict` before release

Full stem list: `node -e "import('./scripts/lib/gear-art-roster.mjs').then(m=>console.log(m.GEAR_ART_STEMS.join('\n')))"`
