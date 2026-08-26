# Summoner Gear Icons — HQ Painted Pipeline (★1–5 + materials)

**Goal:** 125 ultra-detailed inventory icons (512² WebP, clean dematte). Stars = visual tier; materials = non-weapon look + stat bias.

## Output

```
apps/web/public/art/ui/gear/weapon-{element}-s{1-5}.webp     # 25
apps/web/public/art/ui/gear/{slot}-{material}-s{1-5}.webp    # 100
```

See `roster.md` for the full stem table. `materials.md` for cloth/leather/chain/plate.

- **Size:** 512×512 source → `install-gear-art.mjs` (display ~42–88px)
- **Alpha:** charcoal matte `#080808`–`#141414`, dematte via flood fill
- **No** outer gold frame, rarity border, or UI chrome in the paint

## Master positive

```
Premium Com2uS Summoners War style inventory gear icon,
ultra detailed hand-painted 2D digital illustration for mobile RPG,
single centered fantasy equipment, heroic fantasy summoners war aesthetic,
rich metal fabric leather gem enamel detail, crisp silhouette,
pure dark charcoal gray background flat matte #0a0a0a for alpha extraction,
square 1:1 composition, generous margin around item,
no text, no watermark, no UI, no outer picture frame, no rarity border
```

## Negative

```
text, letters, logo, watermark, UI buttons, white background,
flat vector, low detail, blurry, photo,
outer square gold frame, bronze slot frame, inventory plate border,
cropped item, multiple duplicate items, hands holding item
```

## Star tier (append — same item family, escalating detail)

| ★ | Append |
|---|--------|
| 1 | worn humble simple, minimal ornament, matte materials |
| 2 | cleaner polish, subtle edge highlight |
| 3 | ornate trim, small gems, richer materials |
| 4 | glowing accents, enchanted shimmer, premium gems |
| 5 | legendary masterpiece, radiant aura, crown jewels, maximum detail |

## Material prompts (non-weapon — append after slot)

| material | KO | Append |
|----------|-----|--------|
| cloth | 천 | soft woven linen and silk, light robes, fabric folds, mage vestments |
| leather | 가죽 | tanned leather, straps, buckles, agile ranger gear |
| chain | 사슬 | chain mail links, ring armor, steel rings, medium armor |
| plate | 판금 | heavy plate panels, rivets, pauldrons, fortress armor |

## Slot form (append)

| slot | Form |
|------|------|
| top | breastplate / robe chest, front 3/4 |
| bottom | greaves / war skirt / faulds, front 3/4 |
| shoes | pair of boots, both visible, slight 3/4 |
| ring | jeweled ring, band + gem centered |
| necklace | pendant + chain arc |

## Weapon element (append — no material)

| element | Accent |
|---------|--------|
| fire | lava orange core, ember sparks |
| water | frost blue steel, ice mist |
| wind | jade teal edge, wind ribbons |
| light | gold-white radiance, holy filigree |
| dark | violet-black void metal, purple rift |

## Example filename → prompt stack

`top-plate-s5.webp` = master + ★5 legendary + plate heavy armor + top breastplate

`weapon-light-s3.webp` = master + ★3 ornate + weapon ritual blade + light holy filigree

## Pipeline

1. Paint 512² PNG → `assets/gear/{stem}.png` (or Cursor `assets/gear/`)
2. `npm run gear-art:install` or `npm run gear-art:install -- --stems top-plate-s5`
3. `npm run gear-art:check` (`--strict` for CI)

Batch repaint: `gear-art:sync` → `gear-art:derive` → `gear-art:install -- --all`

Legacy `{slot}-{setId}.webp` and SVG fallbacks remain until full roster ships.

## Generation log

| Date | Tool | Notes |
|------|------|-------|
| 2026-08-16 | GenerateImage → `process-paint-icons.mjs ui-gear` | 30 set-based icons (superseded by star+material roster) |
| 2026-08-26 | Roster 125 stems + `install-gear-art.mjs` 512² | ★1–5 weapons + 4 materials × 5 slots |
| 2026-08-26 | Full roster shipped: painted PNG + dematte WebP ×125 | `sync` / `derive` / `install --all` |
