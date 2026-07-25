# Auth art — QA gate checklist

Date: 2026-07-25 · Master: `final/auth-hero-master.webp` (from `v1-epic-wide-02` + vignette)  
Select pool: **24** (`selects/v1–v3` ×8) → Top3 → 1 master

| # | Gate | Result | Notes |
|---|------|--------|-------|
| 1 | Brand test: island + go-board magic circle readable without UI | PASS | Top1 epic-wide master |
| 2 | First viewport content only BG + logo + copy + CTA (no stats/chips) | PASS | Art has empty lower third |
| 3 | CTA contrast ≥ 4.5:1 on lower zone | PASS* | Lower 40% vignetted to `#0e0b16`; verify after UI wire |
| 4 | Hero WebP ≤ 350 KB | PASS | ~112 KB |
| 5 | Palette vs CSS `--bg` / `--gold` | PASS | Indigo/obsidian + antique gold |
| 6 | Magic circle reads as go/baduk grid | PASS | Grid visible on master & mark |
| 7 | No baked text/logo in hero | PASS | Wordmark separate SVG |
| 8 | Wordmark SVG ≤ 30 KB | PASS | ~1 KB |
| 9 | OG 1200×630 present | PASS | `auth-og.webp` |
| 10 | PWA 192/512 PNG from mark | PASS | `public/icons/icon-*.png` |

\* Full mobile contrast re-check after auth CSS wiring (plan Day 7).

## Top3 selects

1. `selects/top1-epic-wide.png` → **MASTER**
2. `selects/top2-circle-close.png`
3. `selects/top3-processional.png`

## Follow-up

- Optional particle sprite sheet / button 9-slice (P1)
- Wired: full-bleed auth UI, LCP hero `fetchpriority`, wordmark, gold CTA, motions (2026-07-25)
