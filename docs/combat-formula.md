# 전투 공식 — BasePower × Amplify + 마나

## 1. 설계 원칙

- **상징·몬스터·각성·영광건물** → `BasePower` (누가 센지의 대부분)
- **마법진 국면** → `Amplify` (같은 스펙을 얼마나 극대화하는가)
- **마나** → 소환사 스킬 **개입 시점** (국면이 템포를 바꿈)

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

동스펙 S1 기대 타수: **6~10회** (서머너즈워 시나리오 초반과 같은 호흡).

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

| 이벤트 | Amplify 기여 | 부가 (핵심) |
|--------|--------------|-------------|
| 안전 착수 | 없음 | **마력 +10** (플랫 × manaMul). 전투 버프 없음 |
| 돌 N 따냄 | 지속 Amp 없음 | **아군 전체 피해 ×(1+0.18N)** · **마력 +20%p×N** |
| 대마 유지 | 받는피해 ×0.90~0.95 | 힐↑ |
| 활로1 압박 | 상대 ACC/행동 패널티 | — |
| 보드 아이템 | 버프별 (치명/실드 등) | 일부 마나 +대 |
| 형상 완성 | 전투 버프 없음 | 마력 보상만 |

따냄·아이템의 전투 버프는 소환사와 생존 소환수 전원에게 적용되며
**다음 착수 직전까지** 유지된다. 첫 공격에 소모되지 않고, 같은 착수 주기에서
여러 아군이 행동하면 모두 효과를 받는다. 일반 착수는 이전 바둑 버프를 지운 뒤
기본 공격만 수행한다.

`ComputedAmplify`는 전투 시작 1.0에서 시작해 이벤트마다 가산/감산 후 클램프.

---

## 4. 마나 충전

```text
ManaPerSecond = BaseManaRegen(SummonerLevel, EquipManaCircuit)

OnSafePlace:
  Mana += 10 * (1 + EquipBoardSense) * phaseManaMul  // 마력 흡수. 전투 버프 없음

OnCapture(N):
  Mana += manaMax * 0.20 * N                     // 돌 1개당 게이지 20%p

ManaMax = 100  // 또는 장비·스킬트리 상한
ManaFull = Mana >= ManaMax
```

### 국면 → 마나 보너스

| 이벤트 | 마나 |
|--------|------|
| 안전 착수 | **+10** (플랫 × manaMul) |
| 따냄 N개 | **manaMax × 20% × N** |
| 사석자석 아이템 | +30 ~ +40 |
| 형상 완성 | +15 ~ +20 |
| 자살수 시도 | 0 |

### 소환사 스킬

```text
if ManaFull and IsSummonerTurn:
  canCastSignatureUlt = true   // 진문개방 기반, 스킬트리로 성형

OnCastSignatureUlt:
  Mana = 0
  Apply composeSummonerUlt(skillTree)   // 계수·Amp·환급·부가 모듈
  Mana += manaMax * refundFrac          // mana 분기 시
```

기본 타이밍: **소환사 ATB 턴에 마나 소모 스킬**.  
중간 마나 스킬(증폭선언·쌍착·청소·수호)은 부분 게이지로 유지. 풀 마나 시 고유기 우선.

### 소환사 고유기 (스킬트리 합성)

| 모듈 | 효과 |
|------|------|
| base (진문개방) | 적 소환수 전원 피해 `1.8×(1+skillPower)` + skill Amp |
| power 분기 | 계수·skill Amp 가중 |
| sense 분기 | 전역 Amplify / 국면 가중 |
| mana 분기 | 시전 후 마력 일부 환급 |
| dual_mastery | 추가 착수 1 |
| clean_mastery | 3×3 정리 + Amp |
| declare_mastery | Amplify 바닥 고정 |
| leader / war_chorus | 아군 ATK% 버프 틱 |

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

## 7. 방어 경감 (서머너즈워)

```text
DefenseMitigation = 1000 / (1140 + 3.5 × DEF_effective)
```

---

## 8. Phase 1 구현 체크리스트

- [x] Amplify 이벤트: 착수 / 따냄 1~2 / 따냄 3+ / 아이템
- [x] 마나: 초당 regen + 따냄·아이템 보너스
- [x] 소환사 스킬 1종 (진문개방)
- [x] 소환수 전멸 = 승패 (소환사 비대상)
- [x] AmplifyCap by ΔPower (간단 티어 2단계)
- [x] 보드 크기 5 / 7 / 9 스테이지 선택
- [x] 9×9 착수 50회 → 강화 진문 리셋 (`boardPhase`, Amplify 상한 상향)

강화 진문 Amplify 상한: phase0=1.25 → phase1=1.30 → phase2=1.35 → phase3+=1.40  
(최종은 `min(상한, ΔPowerCap)` — [board-progression.md](board-progression.md))
