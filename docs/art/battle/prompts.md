# Battle arena backgrounds

**Output:** `apps/web/public/art/battle/bg/{id}.webp` (+ optional `{id}-720.webp`)

## Layout (portrait 9:16, e.g. 1080×1920)

- **Bottom 45–55%:** continuous solid ground plane characters stand on (no cliff drop under feet)
- **Mid:** arena walls / props matching the biome
- **Top:** sky / canopy — never the only surface under units
- No floating islands, no sky-only floors, no UI/text/watermark
- Soft painterly dark-fantasy, Summoners War mobile arena feel

## Master prompt

```
Premium Com2uS Summoners War style vertical battle arena background,
portrait 9:16 composition, continuous solid ground filling the lower half,
characters would stand firmly on dirt/stone floor near bottom third,
clear horizon mid-frame, atmospheric depth, no floating islands,
no characters, no UI, no text, no watermark
```

## Map IDs

| id | Theme |
|----|--------|
| map-01 | Moonlit forest clearing |
| map-02 | Stone tower courtyard |
| map-03 | Ancient ruins plaza |
| map-04 | Misty wetland boardwalk |
| map-05 | Flame canyon arena |
| map-06 | Frost highland ice floor |
| map-07 | Thunder mountain terrace |
| map-08 | Abyss coastal stone pier |
| map-09 | Sealed fortress yard |
| map-10 | Golden desert arena |
| map-11 | Starlight jungle clearing |
| map-12 | Obsidian underground hall |
| map-13 | End-temple ritual floor |
| cairos-giant | Giant cavern boss arena |
| cairos-dragon | Dragon lair lava stone |
| cairos-necro | Necropolis crypt floor |
| arena | PvP coliseum sand |
| depth | Deep dungeon stone |
| equip | Vault forge hall |
| weekday | Training grounds yard |

Fallback: `map-01`.
