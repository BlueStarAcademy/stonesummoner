# 소환사 = 유저 — 공유 레벨 통합

유저 계정과 소환사를 **같은 존재**로 본다.
소환사 레벨이 곧 유저 레벨이며, 속성을 바꿔 다음 소환사를 해금해도 **레벨·경험치는 전원 동일**하다.

이 문서는 구현 전 계획이다. 코드 변경은 후속 PR에서 한다.

관련: [summoner.md](summoner.md) · [summoner-phase2.md](summoner-phase2.md) · [home-island.md](home-island.md) · [content-map.md](content-map.md)

---

## 1. 목표 모델

플레이어는 한 명의 소환사다. 화염·심해·질풍·신성·심연은 **같은 소환사의 속성 키트**다.

| 축 | 공유 (유저 = 소환사) | 속성별 유지 |
|----|----------------------|-------------|
| 레벨 · EXP | 하나 | — |
| 에너지 상한 · 건물 해금 · 콘텐츠 게이트 | 공유 레벨 | — |
| 추가 소환사 슬롯 (1 / 5 / 10 / 15 / 20) | 공유 레벨 | 해금된 속성 목록만 별도 |
| 각성 0~5 | — | 속성마다 |
| 장비 6부위 | — | 속성마다 (무기 속성 잠금) |
| 마법 스킬트리 · 전투 로드아웃 | — | 속성마다 |
| 고유 리더스킬 | — | 속성마다 (데이터 고정) |

해금된 속성을 바꾸면 키트(각성·장비·마법)만 바뀐다. 레벨이 리셋되거나 갈라지지 않는다.

플레이어 대면 용어는 **소환사 레벨** 하나로 통일한다. 코드 식별자 `accountLevel` / `userLevel` 은 같은 값을 가리키는 별칭으로 남긴다.

---

## 2. 현재 상태 (왜 갈라지는가)

이미 `accountLevelOf(save)` 가 있고, HUD 초상은 그 값을 쓴다.
그러나 **계정 레벨 = 속성 레벨의 최댓값** 이고, EXP는 **출전 중인 속성만** 받는다.

```text
전투/수련 EXP
  └─ addActiveSummonerExp()
       └─ summoners[active].level / exp   ← 속성마다 따로
            └─ island.summonerLevel = max(모든 속성 레벨)   ← 미러
            └─ island.summonerExp   = 출전 속성 exp         ← 미러 (최고 레벨과 어긋날 수 있음)
```

새 속성 슬롯은 `createSummonerRoster()` 가 **Lv.1 / EXP 0** 으로 만든다.
그래서 소환사 레벨 5에서 화염을 해금하면 화염은 다시 1부터 키운다.

전투 결과 UI는 같은 EXP를 **유저 트랙 + 소환사 트랙** 두 장으로 보여 준다.

### 레벨을 읽는 경로가 세 갈래

| 경로 | 의미 | 대표 소비처 |
|------|------|-------------|
| `accountLevelOf` / `accountSummonerLevel` | 전 속성 max | HUD, 생산 건물 업그레이드, 소환사 슬롯 해금, 에너지 상한 |
| `island.summonerLevel` | 미러 (가끔 스테일) | 일일 미션, 시나리오/아레나 게이트, 조합식, 스킬트리, 사당/수련장/광맥/길드/융합 |
| `summoners[el].level` / `getActiveSummoner().level` | 해당 속성만 | 전투 소환사 스탯, 각성 게이트, 마법 강화 게이트, 피커/도감/소환사서 |

테스트가 이 분리를 명시한다.

- `gates production upgrades on account level, not the active summoner`
- `Non-max element level-up should not raise account energy max`

---

## 3. 단일 진실 원천

### 세이브

| 필드 | 이후 |
|------|------|
| `island.summonerLevel` | **공유 레벨** (유일한 레벨) |
| `island.summonerExp` | **공유 EXP** (유일한 경험치) |
| `summoners[el].level` | 미러. 항상 `island.summonerLevel` 과 같게 맞춤. 이후 PR에서 필드 제거 가능 |
| `summoners[el].exp` | 미러. 항상 `island.summonerExp` 와 같게 맞춤 |
| `summoners[el].awaken` / `gear` | 속성별 유지 |
| `summonerMagic` / `summonerMagicLoadouts` | 속성별 유지 |
| `unlockedSummoners` / `activeSummoner` | 해금·출전만. 성장과 무관 |

### API

1. `accountLevelOf(save)` — `island.summonerLevel` (또는 동기화된 프로필 어느 쪽이든 같은 값).
2. `addSummonerExp(save, amount)` — 기존 `addActiveSummonerExp` 를 대체. 한 번만 레벨업하고 전 속성 프로필 + 섬 미러에 같은 값을 쓴다.
3. `syncSummonerMirrors` — 레벨/EXP 를 전 속성에 방송. 지금은 max 만 섬에 올리고 속성별 레벨은 그대로 둔다.
4. `createSummonerRoster(seed)` — 빈 속성도 seed 레벨/EXP 를 받는다. 지금은 light 만 seed, 나머지 Lv.1.

`levelsGained` 와 `accountLevelsGained` 는 같은 숫자가 되므로 하나를 남긴다.

---

## 4. 마이그레이션

기존 세이브는 속성별 레벨이 다를 수 있다. **최고 레벨을 공유 레벨로 승격**한다 (의도된 상향).

```text
sharedLevel = max(island.summonerLevel, 모든 summoners[el].level)
sharedExp   = 그 최고 레벨을 가진 슬롯의 exp
              (동점이면 island.summonerExp, 없으면 active)
전 속성 level/exp ← shared
island.summonerLevel/Exp ← shared
energyMax = max(현재, energyMaxForLevel(sharedLevel))
```

- EXP 를 합산하지 않는다. 합산하면 곡선이 깨진다.
- 뒤처진 속성은 각성·장비·마법은 그대로, 레벨만 따라온다.
- `migrateSave` 와 로드 시 `syncSummonerMirrors` 둘 다 맞춘다.

검증 케이스:

- 신성 12 / 화염 3 → 전원 12, EXP 는 신성 쪽.
- 섬만 10 이고 프로필이 비어 있음 → 전원 10.
- 이미 전원 동일 → no-op.

---

## 5. 루프 · 데이터 변경

`packages/loop` 이 중심이다.

| 위치 | 할 일 |
|------|--------|
| `loop.ts` `addActiveSummonerExp` | 공유 EXP 적립. 출전 속성만 올리지 않음 |
| `loop.ts` `syncSummonerMirrors` | 전 속성 level/exp = 섬 값 |
| `loop.ts` `createSummonerRoster` | 빈 슬롯도 seed 레벨 |
| `loop.ts` `unlockAdditionalSummoner` | 해금 시 공유 레벨을 받는지 확인 (싱크만으로 충분해야 함) |
| `loop.ts` `applyRewards` | `expTracks` 의 `user` + `summoner` 를 **한 장**으로 |
| `loop.ts` `runAwakenSummoner` | 게이트를 `accountLevelOf` |
| `loop.ts` 마법 강화 (`magicEnhanceRequiredLevel`) | `summoners[el].level` 대신 공유 레벨 |
| `loop.ts` `createStageBattle` | `getActiveSummoner().level` 은 싱크 후 공유값. 신규 해금 속성이 전투에서 약하지 않음 |
| `loop.ts` 수련장 골드 (`40 + active.level * 2`) | 공유 레벨 사용 (동작은 같아짐) |
| `migrateSave.ts` | 4절 규칙으로 평탄화 |
| `dailyMissions.ts` `accountLv` | `accountLevelOf` (섬 스테일 제거) |
| `progress.ts` 아레나/월드아레나 | `accountLevelOf` |
| `packages/home` `addSummonerExp` / `upgradeBuilding` | 기본 인자를 공유 레벨로. 레거시 `island` 단독 경로는 루프를 거치게 |
| `packages/data` 조합식 `unlockSummonerLevel`, 스킬트리 `minLevel` | 게이트 숫자는 유지. 읽는 쪽만 공유 레벨 |

콘텐츠 숫자(건물 해금표, 슬롯 5/10/15/20, 각성 최소 Lv, 마법 강화 1/5/10/15/20)는 이 PR 범위에서 **다시 밸런스하지 않는다**.

---

## 6. UI · 카피

풀 `render()` 로 모달을 열지 않는다. 레벨 표시만 같은 소스를 읽게 한다.

| 화면 | 현재 | 이후 |
|------|------|------|
| HUD 초상 | `accountLevelOf` + 부제 `{속성} Lv.{active}` | 부제에서 **레벨 숫자 제거**. 속성명·각성 보석만 |
| 소환사 피커 | 카드마다 `Lv.{p.level}` | 공유 레벨 한 번, 또는 카드에서 레벨 생략 |
| 도감 소환사 | 카드마다 속성별 Lv | 동일 |
| 소환사서 레벨 바 | `active.level` / `active.exp` | 섬 공유값 (싱크 후면 같음) |
| 전투 결과 EXP | 유저 카드 + 소환사 카드 (같은 양) | **소환사 한 장** + 출전 몬스터 |
| 건물/해금 카피 | `ui.bldgUp.needAccount` 「계정 Lv.{n}」, `ui.summonerInfo.unlockAt` 「유저 레벨 {n}」 | 「소환사 Lv.{n}」 또는 「Lv.{n}」 |
| 업적 `mission.ach.lv5/10` | 「소환사를 레벨 N까지」 | 유지 가능. 이제 유저 레벨과 동일 |
| CLI | `소환사 Lv.{island}` | 공유값. 속성별 출력 없음 |

보조설명 문단은 추가하지 않는다. 제목·라벨·버튼·비용 칩만 고친다.
토스트로 레벨업을 알리지 않는다. 결과 시트 한 장이 레벨업을 보여 준다.

---

## 7. 테스트 · 스크립트

다시 써야 하는 전제:

- 생산 건물: 「계정 레벨이지 출전 소환사가 아님」 → 「공유 레벨」 한 줄.
- 에너지 상한: 「비최고 속성 레벨업은 에너지를 안 올림」 → 삭제. 어느 속성으로 싸워도 공유 레벨이 오른다.
- `migrateSave` 가 `summoners.fire.level === 12` 만 보존 → 평탄화된 12가 전원·섬에 있는지.
- 해금: 레벨 10에서 화염을 열면 `summoners.fire.level === 10`.
- 보상: `expTracks` 에 user/summoner 중복이 없고, 두 속성으로 연달아 싸워도 레벨이 갈라지지 않음.

같이 손볼 곳:

- `packages/loop/src/loop.test.ts`
- `packages/home/src/island.test.ts`
- `scripts/simulate-balance.ts` (`summonerLevel` / 속성별 덮어쓰기)
- `apps/cli/src/main.ts`
- `scripts/repair-hangul-full.mjs` 등 섬 레벨을 직접 만지는 스크립트

---

## 8. 문서

| 문서 | 수정 |
|------|------|
| [summoner.md](summoner.md) §2 | 「소환사 레벨 = 유저 레벨. 속성 키트는 각성·장비·마법만 갈라짐」 |
| [home-island.md](home-island.md) | 건물 해금 조건을 소환사(유저) 레벨로 명시 |
| [content-map.md](content-map.md) §4 | 동일 |
| [GDD.md](GDD.md) 성장 표 | 소환사 레벨 한 줄 추가, 이 문서 링크 |
| 이 문서 | 구현 PR 이 닫히면 체크리스트를 완료로 표시 |

---

## 9. 단계

겹치지 않게 한 축씩 올린다. 각 단계 끝에 루프 테스트 + `npm run check:encoding`.

### 1 — 모델 · 마이그레이션

세이브 평탄화, `syncSummonerMirrors` / `createSummonerRoster` / `accountLevelOf`.
기존 세이브가 로드만 해도 전 속성 레벨이 같아지게.

### 2 — EXP · 전투 보상

`addSummonerExp`, 결과 `expTracks` 한 장, 수련장·클리어 보상이 같은 함수를 타게.

### 3 — 게이트 읽기

각성·마법 강화·일일 미션·진행도·조합식·스킬트리가 `accountLevelOf` 만 읽게.
`island.summonerLevel` 직접 비교는 헬퍼로 모은다.

### 4 — UI · 카피

HUD 이중 레벨, 피커/도감, 결과 시트, i18n (`ui-extra.json` → `npm run i18n:gen`).
신규 힌트 문장은 넣지 않는다.

### 5 — 테스트 · 문서 반영

7·8절. 밸런스 숫자 변경은 별도.

---

## 10. 하지 않는 것

- 각성·장비·마법 트리를 계정 공유로 합치지 않는다.
- 해금 슬롯 곡선(1/5/10/15/20)을 바꾸지 않는다.
- 소환사 전투 공식(HP `5000+lv*200` 등)을 이 작업에서 리밸런스하지 않는다. 신규 해금 속성이 즉시 공유 레벨 스탯을 갖는 것은 의도다.
- 서버 계정 테이블에 별도 `userLevel` 컬럼을 만들지 않는다. 세이브가 단일 원천이다.
- 몬스터 레벨은 그대로 개체별이다.

---

## 11. 리스크

| 리스크 | 대응 |
|--------|------|
| 멀티 속성을 키운 기존 유저가 최고 레벨로 점프 | 의도. 공지/패치 노트에 「소환사는 한 명」만 적는다. 인게임 힌트 문단은 넣지 않음 |
| `island.summonerExp` 가 최고 레벨 슬롯과 어긋남 | 마이그레이션이 최고 레벨 슬롯의 EXP 를 채택 |
| 결과 UI가 유저/소환사 두 장을 가정 | 한 장으로 접고, 폴백 트랙도 중복 생성하지 않음 |
| 스테일 `island.summonerLevel` 로 게이트가 열리거나 막힘 | 모든 게이트가 `accountLevelOf` → 싱크된 섬 값 |
| 소프트 모달이 풀 `render()` 로 깜빡임 | 레벨 표시 패치만. 오버레이 개폐 경로는 건드리지 않음 |
