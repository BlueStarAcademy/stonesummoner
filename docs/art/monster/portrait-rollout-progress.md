# Portrait card rollout progress

Paused: 2026-09-03 13:02 KST

## Completed

- Pilot: `forest_sprite`, `stone_golem`, `dragon_knight`
- Full batches: 1, 2, 4, 5, 6, 7, 9, 10, 11
- Split batch 8: 8A and 8C
- Installed and QA-passed: 61 families, 610 source cards
- Latest completed install commit at pause: `80f9e81c`

## Pending

### Batch 3

Families:

- `thunder_spear`
- `frost_witch`
- `stone_fist`
- `herb_alchemist`
- `capture_hound`
- `seal_apprentice`

Two valid opaque 1024-square PNG files were preserved but are not installed:

- `capture_hound_water.png`
- `seal_apprentice_wind.png`

Generate the other 58 cards without overwriting these two.

### Batch 8B

- `sky_warden`
- `eternal_healer`

No source cards were saved. Generate all 20.

### Batch 12

- `purify_hierophant`
- `flame_slaughter`
- `poison_overlord`
- `absolute_frost`
- `curse_catalyst`
- `sanctuary_oracle`

No source cards were saved. Generate all 60.

## Pause snapshot

- Source cards present: 612
- Source-card validation failures: 0
- Expected remaining source cards: 138 across 14 families
- Global derivative checker reports 108 missing files while pending families remain

## Resume

1. Generate missing art in two-family groups, and prohibit Git operations in art tasks.
2. Save only to `assets/monster/portrait-cards/{family}_{element}[_awaken].png`.
3. Install each completed group with:
   `node scripts/install-battle-stills.mjs --portraits-only --families <csv>`
4. Run targeted QA:
   `node scripts/process-all-portraits.mjs --qa --only <art-key-csv>`
5. Run `npm run check:encoding`.
6. Commit only the completed group and its 768/256/128 outputs, then push `main`.
7. After all 75 families are complete, run the strict portrait-card check and rebuild the QA sheet.
