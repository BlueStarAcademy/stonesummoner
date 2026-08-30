# Phase 2 소환수 로스터 50종

태생 1~5성 · 특징명(사람 이름 금지) · 속성별 painted 변형.
id = artKey = `{familyId}_{element}` (English snake).

| ★ | familyId | nameKo | role | stonePassive |
|---|----------|--------|------|--------------|
| 1 | stone_golem | 돌골렘 | tank | high_amp_dr |
| 1 | forest_sprite | 숲요정 | support | shield_core_heal |
| 1 | venom_stinger | 독침벌 | debuffer | capture_amp |
| 1 | cinder_imp | 불씨임프 | attacker | capture_crit |
| 1 | dew_slime | 이슬슬라임 | support | stone_ally_heal |
| 1 | gale_bat | 바람박쥐 | debuffer | stone_ally_atb |
| 1 | sand_lizard | 모래도마뱀 | attacker | crit_charm_plus |
| 1 | moss_turtle | 이끼거북 | tank | high_amp_dr |
| 1 | crow_scout | 까마귀정찰 | capturer | capture_mana |
| 1 | bone_thrall | 뼈하인 | attacker | stone_amp_proc |
| 2 | mace_soldier | 철퇴병 | tank | high_amp_dr |
| 2 | heal_priest | 치유사제 | support | shield_core_heal |
| 2 | magic_archer | 마법궁수 | attacker | crit_charm_plus |
| 2 | shadow_thief | 암영도적 | debuffer | capture_amp |
| 2 | thunder_spear | 번개창병 | attacker | capture_crit |
| 2 | frost_witch | 서리무녀 | debuffer | suggest_plus |
| 2 | stone_fist | 석화장사 | tank | high_amp_dr |
| 2 | herb_alchemist | 약초술사 | support | stone_ally_heal |
| 2 | capture_hound | 포획사냥개 | capturer | capture_mana |
| 2 | seal_apprentice | 봉인견습 | stonesage | suggest_plus |
| 3 | flame_warrior | 화염무사 | attacker | capture_crit |
| 3 | abyss_pirate | 심해해적 | attacker | stone_amp_proc |
| 3 | gale_rider | 질풍기수 | attacker | stone_ally_atb |
| 3 | sanctuary_guard | 성역수호 | tank | high_amp_dr |
| 3 | abyss_hexer | 심연주술사 | debuffer | capture_amp |
| 3 | dew_healer | 이슬치유사 | support | shield_core_heal |
| 3 | seal_elder | 석인장로 | stonesage | suggest_plus |
| 3 | wolf_fighter | 늑대전사 | attacker | crit_charm_plus |
| 3 | lotus_dancer | 연꽃무희 | support | stone_ally_heal |
| 3 | scout_sniper | 척후저격수 | debuffer | capture_crit |
| 3 | steel_armor | 강철기갑 | tank | high_amp_dr |
| 3 | mana_captor | 마나포획자 | capturer | capture_mana |
| 4 | magma_knight | 용암기사 | attacker | capture_crit |
| 4 | glacier_mage | 빙하마법사 | debuffer | capture_amp |
| 4 | storm_spearmaster | 폭풍창술사 | attacker | stone_ally_atb |
| 4 | angel_healer | 천사치유사 | support | shield_core_heal |
| 4 | demon_hexer | 악마주술사 | debuffer | suggest_plus |
| 4 | rune_scholar | 룬학자 | stonesage | suggest_plus |
| 4 | golden_guardian | 황금수호자 | tank | high_amp_dr |
| 4 | shadow_assassin | 그림자암살자 | attacker | crit_charm_plus |
| 4 | holy_judge | 신성심판관 | debuffer | capture_amp |
| 4 | abyss_priest | 심연사제 | debuffer | stone_amp_proc |
| 4 | wyrm_rider | 비룡기수 | attacker | capture_crit |
| 4 | capture_lord | 포획지배자 | capturer | capture_mana |
| 5 | dragon_knight | 고룡기사 | attacker | capture_crit |
| 5 | primordial_hierophant | 태초제사장 | stonesage | suggest_plus |
| 5 | doom_oracle | 종말예언자 | debuffer | capture_amp |
| 5 | sky_warden | 천공수호룡 | tank | high_amp_dr |
| 5 | eternal_healer | 영원의치유사 | support | shield_core_heal |
| 5 | absolute_captor | 절대포획자 | capturer | capture_mana |

## 아트

- 전투 still: `/art/monster/battle/{familyId}_{element}-front.webp` / `-back.webp`
- 각성 still: `/art/monster/battle/{familyId}_{element}-awaken-front.webp` / `-awaken-back.webp`
- 초상: `/art/monster/{familyId}_{element}.webp` · 각성 `/art/monster/{familyId}_{element}_awaken.webp`
- 속성별 painted 변형 (CSS 틴트 없음) — `node scripts/bake-monster-element-art.mjs`
- Coverage: `node scripts/check-monster-art.mjs --strict`

## 레거시 매핑

구 Phase1 id → 동생급·동역할 신종 (세이브/시나리오).
