# 전투 공식 — BasePower × Amplify + 마나

## 1. 설계 원칙

- **상징·몬스터·각성·영광건물** → `BasePower` (누가 센지의 대부분)
- **마법진 국면** → `Amplify` (같은 스펙을 얼마나 극대화하는가)
- **마나** → 서머너 스킬 **개입 시점** (국면이 템포를 바꿈)

국면은 BasePower를 **대체하지 않고 증폭**한다.

---

## 2. 최종 피해 (의사코드)

```text
BaseDamage = SkillCoeff
           × ATK_effective          // 몬스터 기본 + 상징 + 영광건물 + 버프
           × ElementAdvantage       // 불>바람>물>불, 빛·어둠 별도
           × (1 + CritBonus)        // 치명 시

FinalDamage = BaseDamage
            × Amplify               // 0.85 ~ 1.25 (동스펙 목표)
            × DefenseMitigation
            × RandomVariance        // 예: 0.95~1.05

받는피해 = FinalDamage
         × AllyDefenseAmplify       // 대마 유지 등 방어 국면
```

### Amplify 범위 (동스펙 목표)

| 국면 상태 | Amplify |
|-----------|---------|
| 붕괴/실수 | 0.85 ~ 0.95 |
| 평타 착수 | ~1.00 |
| 우수 운영 | 1.10 ~ 1.20 |
| 대량따냄+아이템 | ~1.25 (상한) |

상징 2티어 열세 → Amplify 만점으로도 기대 승률 낮음.  
상징 동등 → Amplify가 승패·클리어타임·안정성을 가름.

### 스탯 티어와 Amplify 상한 (권장)

```text
ΔPower = AllyCombatPower - EnemyCombatPower   // 상징·레벨 기반

if ΔPower < -Tier2:
    AmplifyCap = 1.10      // 약체로 강적 학살 방지
elif ΔPower < -Tier1:
    AmplifyCap = 1.18
else:
    AmplifyCap = 1.25

Amplify = clamp(ComputedAmplify, 0.85, AmplifyCap)
```

---

## 3. Amplify 기여 이벤트

| 이벤트 | Amplify 기여 (초안) | 부가 |
|--------|---------------------|------|
| 안전 착수 | +0.00 ~ +0.02 (유지) | 마나 +소 |
| 돌 1~2 따냄 | +0.05 ~ +0.10 (이번 스킬) | 마나 +중, ATB 소량 |
| 돌 3+ 따냄 | +0.12 ~ +0.20 | 마나 +대, 광역 약화 |
| 대마 유지 | 받는피해 ×0.90~0.95 | 힐↑ |
| 활로1 압박 | 상대 ACC/행동 패널티 | — |
| 보드 아이템 | 버프별 (치명/실드 등) | 일부 마나 +대 |
| 형상 완성 | +0.03 ~ +0.08 짧은 지속 | Phase 2 |

`ComputedAmplify`는 전투 시작 1.0에서 시작해 이벤트마다 가산/감산 후 클램프.

---

## 4. 마나 충전

```text
ManaPerSecond = BaseManaRegen(SummonerLevel, EquipManaCircuit)

OnBoardEvent(event):
  Mana += event.ManaBonus * (1 + EquipBoardSense)

ManaMax = 100  // 또는 장비 상한
ManaFull = Mana >= ManaMax
```

### 국면 → 마나 보너스 (초안)

| 이벤트 | 마나 |
|--------|------|
| 안전 착수 | +2 ~ +4 |
| 따냄 1~2 | +8 ~ +12 |
| 따냄 3+ | +18 ~ +25 |
| 사석자석 아이템 | +30 ~ +40 |
| 형상 완성 | +10 ~ +15 |
| 자살수 시도 | 0 |

### 서머너 스킬

```text
if ManaFull and IsSummonerTurn:
  canCastSummonerSkill = true

OnCastSummonerSkill(skill):
  Mana = max(0, Mana - skill.ManaCost)  // 보통 ManaMax 전량 또는 80%
  ApplySkillEffects(skill)
```

기본 타이밍: **서머너 ATB 턴에 마나 소모 스킬**.  
보스전 옵션: 마나 풀 즉시 컷인 (설정/콘텐츠 플래그).

### 서머너 스킬 예시 계수

| 스킬 | 효과 | 마나 |
|------|------|------|
| 진문개방 | 적 전원 피해 `1.8×ATK_summoner` + Amplify +0.15 (2턴) | 풀 |
| 포석강림 | 돌 2개 배치 또는 연결 | 풀 |
| 정화의 수 | 아군 해제기 + 보호막(체력 15%) | 풀 |
| 사석폭풍 | `CapturedStones × 계수` 광역 + 마나 20% 환급 | 풀 |

---

## 5. ATB

```text
ATB += SPD * SpeedMultiplier * dt
if ATB >= 100:
  ATB = 0
  BeginTurn(unit)  // StoneSummon → Skill
```

반격·추가턴은 SW와 유사하게 ATB 보정.

---

## 6. 속성 상성

| 공격＼방어 | 불 | 물 | 바람 | 빛 | 어둠 |
|------------|----|----|------|----|------|
| 불 | 1.0 | 0.85 | **1.15** | 1.0 | 1.0 |
| 물 | **1.15** | 1.0 | 0.85 | 1.0 | 1.0 |
| 바람 | 0.85 | **1.15** | 1.0 | 1.0 | 1.0 |
| 빛 | 1.0 | 1.0 | 1.0 | 1.0 | **1.15** |
| 어둠 | 1.0 | 1.0 | 1.0 | **1.15** | 1.0 |

수치는 SW 감성 초안 — 구현 시 튜닝 가능.

---

## 7. 방어 경감 (초안)

```text
DefenseMitigation = 1000 / (1000 + DEF_effective)
// 또는 SW식 공식에 맞춰 추후 교체
```

---

## 8. Phase 1 구현 체크리스트

- [x] Amplify 이벤트: 착수 / 따냄 1~2 / 따냄 3+ / 아이템
- [x] 마나: 초당 regen + 따냄·아이템 보너스
- [x] 서머너 스킬 1종 (진문개방)
- [x] 서머너 HP 0 = 패배
- [x] AmplifyCap by ΔPower (간단 티어 2단계)
- [x] 보드 크기 5 / 7 / 9 스테이지 선택
- [x] 9×9 착수 50회 → 강화 진문 리셋 (`boardPhase`, Amplify 상한 상향)

강화 진문 Amplify 상한: phase0=1.25 → phase1=1.30 → phase2=1.35 → phase3+=1.40  
(최종은 `min(상한, ΔPowerCap)` — [board-progression.md](board-progression.md))
