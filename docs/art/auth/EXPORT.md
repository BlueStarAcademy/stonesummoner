# Auth art — web export & placement

## Runtime paths

| Asset | Path |
|-------|------|
| Hero WebP | [`apps/web/public/art/auth/auth-hero-master.webp`](../../apps/web/public/art/auth/auth-hero-master.webp) |
| Hero @2x | `apps/web/public/art/auth/auth-hero-master@2x.webp` |
| Hero PNG | `apps/web/public/art/auth/auth-hero-master.png` |
| Safe twin | `auth-hero-safe.webp` (same bake; CSS can add extra mask) |
| Wordmark | `apps/web/public/art/auth/logo-wordmark.svg` |
| Title lockup | `apps/web/public/art/auth/logo-title-lockup.webp` (~300 KB, 1:1) |
| Mark 1024/512/192 | `logo-mark-*.png` |
| OG | `auth-og.webp` / `auth-og.png` (1200×630) |
| PWA | `apps/web/public/icons/icon-192.png`, `icon-512.png` |

## Naming

```
auth-hero-master[.png|.webp]
auth-hero-master@2x.webp
auth-hero-safe[.png|.webp]
logo-wordmark.svg
logo-mark-{1024|512|192}.png
auth-og[.png|.webp]
```

## Budgets (measured 2026-07-25)

| File | Size | Gate |
|------|------|------|
| auth-hero-master.webp | ~112 KB | ≤ 350 KB PASS |
| auth-hero-master@2x.webp | ~180 KB | OK |
| auth-og.webp | ~115 KB | OK |
| logo-wordmark.svg | ~1 KB | ≤ 30 KB PASS |
| logo-mark-1024.png | ~598 KB | source; runtime uses 192/512 |
| logo-mark-192.png | ~24 KB | PWA/favicon OK |
## Re-export

Requires `sharp` locally:

```bash
# one-off
cd /tmp && npm i sharp
ROOT=/path/to/StoneSummoner NODE_PATH=./node_modules node /path/to/StoneSummoner/scripts/export-auth-art.mjs
```

Or from `scripts/` after `npm i sharp` in an isolated folder pointing `ROOT` at the repo.

## Suggested CSS (follow-up implementation)

```css
.auth-main {
  background:
    linear-gradient(to top, #0e0b16 0%, transparent 42%),
    url("/art/auth/auth-hero-master.webp") center / cover no-repeat;
}
.auth-brand img { height: 48px; }
```

Use `srcset` for @2x when wiring the `<img>` LCP hero.
