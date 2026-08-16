# Summoner Gear Icons — Painted Pipeline

**Goal:** Slot-readable inventory icons that also show **set identity** (material, motif, accent color). Quality/stars stay on the `inv-grade` frame; enhance is UI `+N` text.

## Output

```
apps/web/public/art/ui/gear/{slot}-{setId}.webp   # armor / accessory (25)
apps/web/public/art/ui/gear/weapon-{element}.webp # weapons (5)
apps/web/public/art/ui/gear/{slot}.webp           # generic fallback (keep)
```

- **Size:** 256×256 (displayed ~22–72 CSS px)
- **Alpha:** outer dark charcoal matte punched by `process-paint-icons.mjs ui-gear`
- **Composition:** single centered item, generous margin, **no square gold/bronze picture frame**

## Master positive

```
Premium Com2uS Summoners War style inventory gear icon,
centered ornate fantasy equipment for mobile RPG inventory,
hand-painted 2D digital illustration, ultra detailed metal fabric gem and glow,
dark charcoal matte background suitable for matte punch,
square icon, no text, no watermark, no UI chrome, no outer square frame,
no rarity border, no item slot frame
```

## Negative

```
text, letters, logo, watermark, UI buttons, comic panel,
flat vector SVG look, low detail, blurry, stock photo,
outer square gold picture frame, bronze item-slot frame,
white background, watermark, rarity border, UI chrome
```

## Set prompts (append to master)

| setId | KO | Motif | Palette |
|-------|----|-------|---------|
| mana | 진액 | sap crystal, circular mana sigil, liquid-gold inlay | teal / gold |
| assault | 돌격 | spear-tip wedges, combat chevrons, battle angles | crimson / black iron |
| guardian | 수호 | shield plates, rivets, pauldrons, braced armor | slate-blue / silver |
| sense | 감응 | eye, spiral, crystal lens, focusing gem | magenta / indigo |
| tempo | 진속 | wings, clock gears, speed streaks | sky / platinum |

## Slot prompts (append after set)

| slot | Form |
|------|------|
| top | breastplate + pauldrons, front 3/4, heroic V-waist |
| bottom | war greaves / waist armor / faulds, front 3/4 |
| shoes | one pair of boots, slight 3/4, both boots visible |
| ring | jeweled ring close-up, band + gem, centered |
| necklace | pendant + chain, centered, chain arc visible |
| weapon | centered short magic sword / ritual blade, elemental aura (weapons use element, not set) |

## Weapon element prompts (append to master + weapon slot)

| element | Accent |
|---------|--------|
| fire | lava-red / orange molten core, ember sparks |
| water | ice-blue trident-sword, frost mist |
| wind | jade-teal edge, wind ribbons |
| light | gold-white radiance, holy filigree |
| dark | violet-black void metal, purple rift |

## Filename table (30 production + 6 generic fallbacks)

| File | Kind |
|------|------|
| `top-mana.webp` … `top-tempo.webp` | set armor |
| `bottom-{set}.webp` | set armor |
| `shoes-{set}.webp` | set armor |
| `ring-{set}.webp` | set accessory |
| `necklace-{set}.webp` | set accessory |
| `weapon-fire.webp` … `weapon-dark.webp` | element weapon |
| `top.webp` `bottom.webp` `shoes.webp` `ring.webp` `necklace.webp` `weapon.webp` | empty / fallback |

`{set}` = `mana` `assault` `guardian` `sense` `tempo`.

## Pipeline

1. Cursor `GenerateImage` PNG, filename = final stem (`top-mana.png`)
2. Copy into `apps/web/public/art/ui/gear/`
3. `node scripts/process-paint-icons.mjs ui-gear` → 256² dematte WebP, PNG deleted

Generic `{slot}.webp` files are **not** regenerated in this pass.

## Generation log

| Date | Tool | Notes |
|------|------|-------|
| 2026-08-16 | Cursor GenerateImage → `process-paint-icons.mjs ui-gear` | 25 set icons + 5 element weapons remastered, no baked frames |
