# 몬스터 템플릿 · 샘플 10종

## 1. 작성 템플릿

```yaml
id: string
name: string
name_ko: string
element: fire | water | wind | light | dark
natural_stars: 2..5
role: attacker | support | tank | debuffer | stonesage | capturer
base_stats:
  hp: number
  atk: number
  def: number
  spd: number
  crit_rate: number   # %
  crit_dmg: number    # %
  accuracy: number    # %
  resistance: number  # %
skills:
  - id: s1
    name: string
    type: basic | active | passive
    cooldown: number
    description: string
    effects: []
leader_skill: null | { scope, stat, value }
awakening:
  stat_bonus: {}
  skill_upgrade: string
  stone_passive: string   # 스톤소환 고유 패시브
symbol_slots: 6
```

### 스톤 패시브 키워드 예

- 포석, 연타착수, 축출, 봉인점, 동형변환, 사석폭발
- 아이템 흡수 범위 +1, 따냄 마나 보너스 등

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

## 2. Phase 1 샘플 10종 (개요)

수치는 프로토타입용 초안. 밸런스는 플레이테스트 후 조정.

### 1. 불꽃잡이 (Fire Fang) — fire / 3★ / attacker
- S1 할퀴기, S2 화염일격(쿨3), S3 작열(쿨4, 방깎)
- 각성 스톤: 따냄 시 이번 스킬 치피 +10%

### 2. 이슬치유사 (Dew Healer) — water / 3★ / support
- S1 물방울, S2 치유물결, S3 정화
- 각성 스톤: 실드핵 획득 시 힐량 +

### 3. 돌풍정찰 (Gale Scout) — wind / 3★ / debuffer
- S1 절삭, S2 속도저하, S3 바람표식(효적)
- 각성 스톤: 착수 시 ATB +5% 아군 1명

### 4. 방패거북 (Shield Tortoise) — water / 4★ / tank
- S1 충돌, S2 도발, S3 철벽
- 각성 스톤: 대마 유지 중 받는피해 추가 ↓

### 5. 잿빛궁수 (Ash Archer) — fire / 4★ / attacker
- S1 연사, S2 약점조준(치명), S3 화살비
- 각성 스톤: 치명부적 지속 +1턴

### 6. 안개무녀 (Mist Shaman) — wind / 4★ / support
- S1 안개탄, S2 공속버프, S3 재생안개
- 각성 스톤: 행마모래 효과 증폭

### 7. 진문학자 (Seal Scholar) — light / 4★ / stonesage
- S1 봉인타, S2 봉인점(보드), S3 진문해석(Amplify 소폭)
- 각성 스톤: 착수 후보 하이라이트 +1 (UX/AI)

### 8. 사석사냥꾼 (Capture Hound) — dark / 4★ / capturer
- S1 물어뜯기, S2 추격, S3 사석폭주
- 각성 스톤: 따냄 마나 보너스 +30%

### 9. 천둥창병 (Thunder Lancer) — light / 5★ / attacker
- S1 찌르기, S2 충전돌격, S3 낙뢰
- 각성 스톤: 연타착수 15%

### 10. 심연사제 (Abyss Priest) — dark / 5★ / debuffer
- S1 저주, S2 침묵, S3 심연의 눈
- 각성 스톤: 축출 스킬(쿨 김) — 활로 무시 돌 1 제거

---

## 3. 데이터 파일 위치 (예정)

Phase 1: `packages/data/src/monsters.ts`에 8종 + S1/S2/S3 스킬 정의.
`packages/combat`가 쿨·데미지/힐/실드/마나 효과를 처리합니다.

리더스킬은 일부만. SW처럼 서머너 장비/각성으로 이전 가능 ([summoner.md](summoner.md)).
