# Hub / Island Buildings — Painted Pipeline

**Output:** `apps/web/public/art/hub/bldg-{tone}.webp`

- Size: 512×512 preferred (display scaled on island)
- Isometric / 3/4 fantasy building sprite, grounded, alpha outer matte
- Style: Summoners War / dark fantasy mobile RPG, hand-painted 2D

### Master

```
Premium Com2uS Summoners War style island building sprite,
hand-painted 2D fantasy architecture, isometric three-quarter view,
grounded on small stone base, glowing magical accents,
dark charcoal background for matte punch, square composition,
no text, no watermark, no UI chrome, no people
```

| tone | Building |
|------|----------|
| summon | Summon hearth / ritual shrine with circle |
| forge | Power forge / anvil workshop |
| gate | Stone gateway arch to stages |
| pond | Mana pond / glowing water basin |
| shop | Merchant stall / bazaar tent |
| party | Party pavilion / banner hall |
| wish | Wish temple / incense pagoda |
| dojo | Practice dojo / sparring hall |
| mine | Crystal mine entrance |
| glory | Glory arena / trophy pillar |
| guild | Guild hall / banner keep |
| fusion | Fusion star altar / twin pillars |

Also: `summon-circle.webp`, `forge-circle.webp` — painted ritual floor circles, top-down.

### Glory campus buildings

**Output:** `apps/web/public/art/hub/glory/{id}.webp`  
**Source:** `apps/web/public/art/hub/glory/_src/{id}.png`  
**Process:** `node scripts/process-hub-buildings.mjs`

Same master prompt as island buildings. Match `bldg-glory.webp`: cream stone, polished gold trim, charcoal matte, small rock/moss base.

| id | Building |
|----|----------|
| mana_fountain | Gold/mana fountain, three stone basins, diamond crystal crown, gold liquid |
| ancient_sword | Monument sword in a gold-bound stone plinth |
| guardstone | Massive ward stone with gold sigils and shield motif |
| crystal_altar | Stepped altar with clustered purple-blue crystals |
| sky_totem | Tall tribal totem with gold banners and sky-gem eyes |
| fire_sanctuary | Open fire shrine, braziers and ember basin |
| water_sanctuary | Tide shrine with turquoise pools and shell gold |
| wind_sanctuary | Open pagoda with wind chimes and leaf-gold trim |
| fairy_tree | Glowing spirit tree on a gold-ringed stone dais |
