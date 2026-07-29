# 몬스터 템플릿 · 패밀리 (Phase 2)

## 1. 작성 템플릿

```yaml
family_id: string          # English snake (예: magic_archer)
name_ko: string            # 전 속성 공통 표시명 (속성 단어 금지, 사람 이름 금지)
art_key: string            # 보통 family_id와 동일
variants:
  - id: family_id_element
    element: fire | water | wind | light | dark
    natural_stars: 1..5
    role: attacker | support | tank | debuffer | stonesage | capturer
    base_stats: { hp, atk, def, spd, crit_rate, crit_dmg, accuracy, resistance }
    skills: [s1, s2, s3]
    stone_passive: string
```

리더스킬은 **소환사만** ([summoner-phase2.md](summoner-phase2.md)).

## 2. Phase 2 로스터

50종 × 5속성 = **250**. 상세: [art/monster/roster-50.md](art/monster/roster-50.md)

데이터: `packages/data/src/monsters/` (`roster.ts` + `curves.ts` + `kitFactory.ts`)

## 3. 확장

`FAMILY_ROSTER`에 seed 1줄 추가 → `expandFamily`가 5속성 자동 생성 → 소환 풀·도감 반영.
초상: `apps/web/public/art/monster/{artKey}.webp` (+ 속성별 CSS 틴트).

## 4. 레거시

`LEGACY_MONSTER_IDS`가 Phase 1 id/artKey를 Phase 2 id로 해석.
