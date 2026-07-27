# 몬스터 템플릿 · 패밀리 (속성별 변형)

## 1. 작성 템플릿

```yaml
family_id: string          # 종족 키 (예: seokrang)
name_ko: string            # 전 속성 공통 표시명 (속성 단어 금지)
art_key: string            # 초상/스킬아이콘 공유 키 (속성별 스킨 전까지)
variants:
  - id: family_id_element  # seokrang_fire …
    element: fire | water | wind | light | dark
    natural_stars: 2..5
    role: attacker | support | tank | debuffer | stonesage | capturer
    base_stats: { hp, atk, def, spd, crit_rate, crit_dmg, accuracy, resistance }
    skills: [s1, s2, s3]   # 속성마다 다른 스킬 키트
    stone_passive: string
# leader_skill: 없음 — 리더스킬은 소환사 전용 (docs/summoner.md)
```

### SW와 같은 점 / 다른 점

| | 서머너즈워 | StoneSummoner |
|--|-----------|---------------|
| 이름 | 종족명 공유 × 속성 변형 | 동일 (`nameKo` 공유) |
| 스킬 | 속성별 다른 키트 | 동일 |
| 아트 | 팔레트/세부만 다른 스킨 | `artKey` 공유 후 속성별 스킨 확장 예정 |
| 리더스킬 | 몬스터에 부착 | **소환사만** (스킬트리·각성·장비·전투 마법스킬) |

### 역할군

| 역할 | 초점 |
|------|------|
| attacker | 딜 |
| support | 힐·버프 |
| tank | 생존·도발 |
| debuffer | 약화·효적 |
| stonesage | 착수·국면 |
| capturer | 따냄·마나 가속 |

---

## 2. Phase 1 패밀리 10종 × 속성 5 = 50

이름은 **속성에 묶이지 않는 종족명**. 스킬은 속성마다 다름 (데이터: `packages/data/src/monsters.ts`).

| familyId | nameKo | ★ | 기본 역할 | artKey (기존 자산) |
|----------|--------|---|-----------|-------------------|
| seokrang | 석랑 | 3 | attacker | fire_fang |
| yeonhwa | 연화 | 3 | support | dew_healer |
| cheokhu | 척후 | 3 | debuffer | gale_scout |
| cheolgap | 철갑 | 4 | tank | shield_tortoise |
| myeongsa | 명사 | 4 | attacker | ash_archer |
| yeongmae | 영매 | 4 | support | mist_shaman |
| jinmunsa | 진문사 | 4 | stonesage | seal_scholar |
| pohwagyeon | 포획견 | 4 | capturer | capture_hound |
| changsu | 창수 | 5 | attacker | thunder_lancer |
| jegwan | 제관 | 5 | debuffer | abyss_priest |

예시 (석랑):

- 불: 할퀴기 / 화염일격 / 작열 (attacker)
- 물: 냉기발톱 / 빙결할퀴기 / 서리파열 (debuffer 편향)
- 바람: 질풍할퀴기 / 연속절삭 / 돌풍난무
- 빛: 섬광할퀴기 / 심판일격 / 성휘폭
- 어둠: 암영할퀴기 / 흡혈일격 / 심연발톱

스킬업·재료 소환은 **동일 `monsterId`(동일 패밀리+속성)** 만 가능.

레거시 id (`fire_fang` 등)는 `LEGACY_MONSTER_IDS` / `resolveMonsterId`로 마이그레이션.

---

## 3. 데이터 위치

- 카탈로그: `packages/data/src/monsters.ts`
- 소환 풀: `packages/loop/src/roster.ts` (성급·속성 필터 → 패밀리 확장에 자동 반영)
- 전투/스톤 패시브: `packages/combat`
- 소환사 리더·마법스킬·스킬트리: [summoner.md](summoner.md)
