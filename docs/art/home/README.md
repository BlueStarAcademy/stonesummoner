# Home island art

| Asset | Path | Notes |
|-------|------|-------|
| Hub BG | `apps/web/public/art/home/home-island-bg.webp` | 9:16 dusk plateau, ~181 KB |
| @2x / 720 | `home-island-bg@2x.webp`, `home-island-bg-720.webp` | srcset |

Palette locked to auth (`#0e0b16` / `#c9a227`).

## Layout (archipelago v2)

The pannable `island-world` is oversized (~285%×265% viewport) so the hub reads as **three linked islets**:

| Islet | Buildings |
|-------|-----------|
| West · Home | power_circle, summon_hearth, shop, party |
| Center · Craft | wish, mana_pond, crystal_mine, dojo |
| East · Adventure | gateway, glory, guild, fusion |

Defaults live in `ISLAND_LAYOUT_DEFAULT` (`apps/web/src/main.ts`). Soft landmass pads are CSS-only (`.island-islet-*`) until a dedicated tri-island bitmap ships.
