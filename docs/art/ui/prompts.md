# UI Chrome — Painted Pipeline

## Inv-grade frames

**Output:** `apps/web/public/art/ui/inv-grade/{gray|green|blue|purple|red}.webp`

- Size: 256×256 (UI displays ~112)
- Ornate hollow rectangular frame; **center well transparent** for portrait
- Dark charcoal outer matte for dematte + center punch in `process-inv-grade.mjs`

### Master

```
Premium Com2uS Summoners War style inventory grade frame,
hollow ornate rectangular metal rim with jeweled corners,
transparent empty center for character portrait,
hand-painted 2D mobile RPG UI, antique gold accents,
dark charcoal background, square icon, no text, no watermark, no UI chrome
```

| grade | Accent |
|-------|--------|
| gray | Dull iron / pewter |
| green | Emerald enamel |
| blue | Sapphire enamel |
| purple | Amethyst enamel |
| red | Ruby / crimson enamel |

## Skill generics

**Output:** `apps/web/public/art/ui/skill/{damage|heal|mana|shield}.webp`

Centered magical motif on dark matte, 256².

## Gear slots

Set × slot painted icons live in [`docs/art/ui/gear/prompts.md`](gear/prompts.md).

**Output:** `apps/web/public/art/ui/gear/{slot}-{setId}.webp`, `weapon-{element}.webp`, plus generic `{slot}.webp` fallbacks.
