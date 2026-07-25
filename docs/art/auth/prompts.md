# Auth Art — Prompts & Production Log

**Date:** 2026-07-25  
**Tool (Cursor GenerateImage):** model session default · aspect `9:16` hero, `1:1` mark, `16:9` OG  
**Palette lock:** indigo/obsidian `#0e0b16` · gold `#c9a227` · mana accent `#7b6cff` (CSS vars ±1 stop)

## Reference board (tone only — no redistribution)

Internal tone notes (do not ship copyrighted SW screenshots in repo):

| # | Look for | Use |
|---|----------|-----|
| 1 | Sky-island dusk silhouette | Epic wide horizon weight |
| 2 | Floating ritual circle key art | Magic-circle scale vs figure |
| 3 | Gold filigree on dark UI | Filigree density, not UI chrome |
| 4 | Rim-lit summoner back view | Silhouette-safe character |
| 5 | Volumetric god rays through cloud | Lighting language |
| 6 | Empty lower third title screens | UI safe zone discipline |
| 7 | Go / baduk board texture (abstract) | Grid readability of circle |
| 8 | Antique gold vs deep teal-indigo | Avoid candy purple nebula |

Store private refs outside git if needed: `docs/art/auth/refs/` (gitkeep only in repo).

## Master positive (fixed skeleton)

```
Vertical mobile game title screen, full-bleed dark fantasy sky island at dusk,
colossal glowing magic circle shaped like a go board floating in mid-air,
intricate gold filigree, summoner silhouette placing a luminous stone,
volumetric god rays, cinematic rim light, deep indigo and obsidian,
antique gold accents, ultra detailed environment,
premium Com2uS-style mobile RPG key art, empty lower third for UI,
no text, no watermark, no UI chrome
```

## Negative

```
text, letters, logo, watermark, UI buttons, comic panel, collage,
soft plastic 3D, anime chibi, bright purple nebula spam,
overexposed bloom, blurry, lowres, stock photo, readable faces,
crowded lower third, badges, stickers
```

## Variant prompts (8 intended each → Top selects)

### V1 — Epic wide island

Master + `wide sky island archipelago dominating upper half, tiny summoner silhouette at magic circle, vast atmosphere, lower third empty and dark`

### V2 — Circle close

Master + `tight framing on go-board magic circle and summoner hand placing glowing stone, intense rim light, island soft in background bokeh, lower third empty and dark`

### V3 — Processional

Master + `four monster silhouettes in a battle line behind the summoner, party formation feel, magic circle center stage, lower third empty and dark`

## Generation log

| Batch | Variant | Files | Notes |
|-------|---------|-------|-------|
| 2026-07-25 A | V1/V2/V3 ×8 | `selects/v{1,2,3}-*-0[1-8].png` | **24** Cursor GenerateImage · 9:16 |
| 2026-07-25 B | Master pick | `final/auth-hero-master.*` | **Top1** = `v1-epic-wide-02` + bottom vignette |
| 2026-07-25 C | Logo / mark / OG | `final/logo-*`, `auth-og*` | SVG wordmark + mark + OG |
| 2026-07-25 D | Tone refs | `refs/ref-*.png` | Original mood only (no SW stills) |

### Top3

1. `top1-epic-wide.png` (**MASTER**, from `v1-epic-wide-02`) — island + circle + UI-safe lower third  
2. `top2-circle-close.png` (from `v2-circle-close-01`) — stone-placement tension  
3. `top3-processional.png` (from `v3-processional-02`) — party silhouette feel  

### Master processing

- Source: `selects/top1-epic-wide.png` / `auth-hero-master-raw.png`  
- Cover resize 1080×1920 (+ @2x 1440×2560)  
- Bottom vignette → `#0e0b16`  
- WebP q78 → **~112 KB** (budget ≤350 KB)  
- Re-export: `scripts/export-auth-art.mjs` with `ROOT` + local `sharp`

## Safe zone checklist (composer)

```
Top 12%     sky / island silhouette
Mid 35–45%  magic circle anchor
Mid-low     summoner silhouette (no face detail)
Bottom 40%  dark average luminance for CTA
```

## Seeds

Cursor image tool does not expose numeric seeds; reproduce via prompts above + filename log.
