# Gear materials (non-weapon)

Four shared armor/accessory materials drive **art** and **stat bias**. Weapons use element + star grade only.

| id | KO | Visual | Stat focus |
|----|-----|--------|------------|
| `cloth` | 천 | soft weave, linen, silk trim | 마나 재생, 감응, 스킬 위력 (경갑) |
| `leather` | 가죽 | hide, straps, buckles | 시작 마나, 리더 ATK, 기동 |
| `chain` | 사슬 | ring mail, linked steel | HP/DEF 중간, 스킬·리더 보조 |
| `plate` | 판금 | plate panels, heavy rivets | HP/DEF 최고 (중갑) |

Roll weights: equal (25% each). Legacy saves without `materialId` normalize to `cloth`.

## Art filenames

`{slot}-{material}-s{stars}.webp` — e.g. `top-plate-s5.webp`, `ring-cloth-s2.webp`.

Slots: `top`, `bottom`, `shoes`, `ring`, `necklace`.
