# Element palette — monster painted art

Per-element visuals are **baked into WebP** (`{familyId}_{element}`). Do not rely on CSS `.el-tint-*` for monsters.

| Element | Primary hues | Materials & aura | Notes |
|---------|--------------|------------------|-------|
| fire | red, orange, gold highlights | flame wisps, magma cracks, hot metal | warm rim light |
| water | teal, deep blue, silver | water ripples, ice crystals, wet cloth | cool glossy accents |
| wind | green, lime, bright teal | wind swirls, leaves, light fabric | airy motion lines |
| light | gold, white, pale yellow | holy radiance, bright metal, soft glow | high key, not flat white |
| dark | purple, black-blue, charcoal | shadow mist, curse glyphs, void energy | readable dark armor |

## Awaken delta (all elements)

- Same silhouette as base variant for that element
- Brighter baked grade + stronger element overlay
- Optional crown, wings, aura halo, ornate armor trim (family-specific — see `families/{familyId}.md`)

## QA

Place five variants of one family side by side in inventory. Attributes must be obvious **without** CSS filters.
