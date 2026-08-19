# 홈 섬 · 건물 (SW 천공의 섬 1:1)

## 1. 개요

메인 홈 = 내려다보는 **거점 섬**.  
소환사 레벨↑ → 건물 해금·건설 → 건물 레벨업 → 효과/생산↑.  
생산형 건물은 **시간 경과로 자원 생성** 후 탭 수집.

수치·해금 레벨 원천: [SW Buildings](https://summonerswar.fandom.com/wiki/Buildings) / Spokland.  
이름만 진문·바둑 테마.

---

## 2. 홈 UI

| UI | 동작 |
|----|------|
| 거점 섬 | 건물 배치·탭, 자원 말풍선 수집 |
| 상단 재화 | 마나(진액) / 크리스탈 / 에너지 |
| 소환사 레벨 | 건물 해금 조건 |
| 하단 내비 | 홈 · 소환 · 전투 · 사회 · 더보기 |
| 상점 | 일반 / **영광** / 패키지 |
| 섬 확장 | 건설 영역 해금 |

---

## 3. 건물 규칙

1. 레벨 도달 → 마나/크리스탈/영광포인트로 건설  
2. 대부분 **즉시 건설**  
3. 레벨업 → 효과·생산·저장 상한↑  
4. 생산형: 시간 축적, 상한 초과분 소멸  
5. 영광 건물: 아레나 포인트, **최대 Lv10**, 전역 전투 버프  
6. 섬 그리드 배치·이동  

---

## 4. 기능 건물

| 테마명 | SW 원본 | 해금(대략) | 역할 |
|--------|---------|------------|------|
| 소환사 탑 | Summoner's Tower | 시작 | 방어덱·기록·각성재료 |
| 소환진 | Summonhenge | 시작 | 소환 |
| 출정문 | Gateway | 시작 | 시나리오·전투 |
| 조합진 | Fusion Hexagram | 시작 | 조합식으로 희귀 소환수 제작 |
| 마법상점 | Magic Shop | ~6 | 상징/스크롤, 주기 리셋 |
| 소원의 사당 | Temple of Wishes | ~7 | 일 1회 소원 |
| 아케인 포탑 | Arcane Tower | ~3 | 아레나 방어 포탑 |
| 융합의 별 | Fusion Hexagram | ~17 | 몬스터 융합 |
| 정수 공방 | Fuse Center | ~12 | 정수 융합 |
| 제작소 | Craft Building | ~19 | 제작 |
| 보관소 | Monster Storage | 초반 | 슬롯 확장 |
| 형상 공방 | Transmogrification | 후반 | 외형 |
| 진문 수련장 | Practice Dojo | 중반 | 일일 수련(진문석) · 마법진 각인 |

---

## 5. 생산 건물

| 테마명 | SW 원본 | 역할 |
|--------|---------|------|
| 진액 연못 | Pond of Mana | 시작 — 마나/hr + 저장 |
| 고대 석진 | Ancient Stones | ~14 — 마나 추가 |
| 심연의 수호목 | Deep Forest Ent | ~18 — 마나 추가 |
| 수정 광맥 | Crystal Mine | ~10 — 크리스탈 저속 |
| 수정 거상 | Crystal Titan | 크리스탈 구매형 |
| 수련의 숲 | Tranquil Forest | 배치몹 EXP/hr |
| 수정 호수 | Crystal Lake | EXP 강화 |
| 바람절벽 | Gusty Cliffs | EXP 강화 |

**Phase 1 수치 스텁 (진액 연못):**  
- 생산: 약 441/hr × 건물 Lv, 저장 상한 약 4000 × Lv (SW Pond of Mana급 — 구현 시 Spokland로 확정)
- 레벨업: 마나 비용, 최대 Lv10 (생산·저장 상한 동시 상승)

생산 공식:

```text
stored = min(cap, stored + rate * hoursElapsed)
collect() -> addToPlayer(stored); stored = 0
```

---

## 6. 영광 건물 (Lv1~10)

| 테마명 | SW | 효과 방향 |
|--------|-----|-----------|
| 마나 분천 | Mana Fountain | 마나 생산 속도 +% |
| 요정의 나무 | Fairy Tree | 마나 저장 상한 + |
| 수호의 석 | Guardstone | DEF % |
| 고대의 검 | Ancient Sword | ATK % |
| 수정 제단 | Crystal Altar | HP % |
| 하늘부족 토템 | Sky Tribe Totem | SPD |
| 불/물/바람/빛/어둠 성소 | Sanctuary | 속성별 ATK % |
| 기타 | Mysterious Plant, Crystal Rock, Sanctum of Energy… | SW 동일 |

영광 건물 버프는 전투 `BasePower`에 가산.

---

## 7. Phase 1 최소 세트

반드시 구현:

1. **소환진** — 소환 UI 입구  
2. **소환수 화면** — 레벨업 + 진화(최대 E2) + 스킬업(S1–S3, 최대 Lv3, 마나)  
3. **출정문** — 시나리오 1챕터  
4. **진액 연못** — 마나 시간 생산·수집  

영광·융합·제작·섬 확장은 Phase 2.  
Phase 1 추가 스텁: **마법상점**(소환서 구매) · **상징 각인**(슬롯 4–6) · **상징 연마**(접두어) · **진액 연못 레벨업**.  
Phase 2 스텁: **수정 광맥** · **소원의 사당** · **영광 건물** · 출정 허브(심층/아레나/요일/시련/챕터2).  
Phase 2+ 스텁: **월드아레나** · **길드 레이드 13×13** · **융합의 별**.
