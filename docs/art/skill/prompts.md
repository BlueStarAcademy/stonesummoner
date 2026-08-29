# Skill Icons — Painted Pipeline (scope C)

**Ship target (dedicated painted WebP, locked after install):**
- `apps/web/public/art/monster/skill/{familyId}-{element}-s{1|2|3}.webp`
- `apps/web/public/art/ui/skill/{damage|heal|mana|shield}.webp`
- `apps/web/public/art/summoner/skill/{skillId}.webp`

- Size: **256×256** painted WebP, dematted alpha
- Element colors are **baked in paint** — one file per family × element
- Client loads **WebP only** (no SVG / procedural fallback to ship)

## Audit + batch regen

```bash
npm run skill-art:audit          # writes docs/art/skill/skill-art-audit.json
npm run skill-art:regen-queue    # writes docs/art/skill/regen-queue.json
node scripts/export-skill-art-regen-queue.mjs --family stone_golem
```

Painted PNG masters → Cursor assets root (`~/.cursor/projects/c-Project-StoneSummoners/assets/{stem}.png`) → install:

```bash
node scripts/install-cursor-skill-batch.mjs --kind monster stone_golem-fire-s1
npm run battle-fx:check
```

Bad icons usually have **UI frames** or **character busts** instead of effect-only emblems. Keep the 29 monster icons that pass audit; regen the rest from manifest prompts.

## Install painted HQ (the only way to update ship icons)

1. Drop PNG masters into staging:
   `apps/web/public/art/_staging/monster/skill/capture_hound-fire-s1.png`
2. Install + lock:
   ```bash
   npm run skill-art:install
   ```
3. One file: `npm run skill-art:install -- --file capture_hound-fire-s1`
4. Overwrite locked: add `--force`

Lock manifest: `apps/web/public/art/monster/skill/.skill-art-lock.json`

No generic family fallback, SVG fallback, procedural generator, or character-crop
pipeline is retained. Every runtime skill ID must resolve to its dedicated
painted WebP; `npm run skill-art:manifest:check` rejects missing files.

## Master prompt

```
Premium Com2uS Summoners War style skill icon,
centered magical combat effect emblem, hand-painted 2D,
glowing energy, ornate detail, dark charcoal background,
square icon, no text, no watermark, no UI chrome, no outer square frame
```

s1 = basic · s2 = signature · s3 = ultimate.
