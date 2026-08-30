# 소환수 전투 스틸 2.5D 고품질 제작 규격

## 제작 범위

- 50 패밀리 × 5속성 = 250 artKey
- artKey마다 기본 front/back + 각성 front/back = **총 1,000장**
- 원본: 1536×1536 이상 PNG/WebP
- 설치본: 투명 1024×1024 WebP
- 초상과 128/256 목록 이미지는 front 설치 시 기존 파이프라인에서 파생

## 2.5D 기준

2.5D는 단순한 2D 일러스트나 원본 3D 렌더가 아니다. 최종 이미지는 다음 조건을 동시에 만족해야 한다.

1. 아이레벨에 가까운 고정 3/4 카메라와 일관된 원근
2. 손으로 마감한 페인터리 표면과 입체적으로 읽히는 형태
3. 재질별 하이라이트, 접촉 음영, 키라이트와 림라이트
4. 전투 바닥에 놓이는 발과 명확한 전신 실루엣
5. 같은 패밀리의 다섯 속성, front/back, 기본/각성 사이에서 동일한 체형과 장비 구조

금지: 플랫 셀 셰이딩, 종이 인형 같은 레이어, 생 3D 뷰포트, 플라스틱 피규어 렌더, 전신 색상 필터, 잘린 무기·날개·발.

## 카메라와 페어 규칙

- **front**: 얼굴과 장비 전면이 읽히는 전방 3/4 전투 자세
- **back**: front와 같은 캐릭터·체형·장비·카메라 높이를 유지한 후방 3/4
- back은 front의 좌우 반전 복제본이 아니며 등 장비, 망토, 날개, 꼬리 구조가 보여야 한다.
- 각성은 종족과 핵심 실루엣을 바꾸지 않고 재질, 장식, 오라를 진화시킨다.
- 이펙트는 실루엣과 장비 구조를 가리지 않는 범위로 제한한다.

## 패밀리 시트 승인 조건

일괄 제작 전에 `families/{familyId}.md`에 아래 정보가 있어야 한다.

- 종족, 체형, 얼굴 또는 머리 형태
- 무기, 갑옷·의복, 대표 장식
- 전투 자세와 유지할 실루엣
- 속성마다 바뀌는 영역과 절대 바꾸지 않는 영역
- 각성 변화
- front/back에서 반드시 보여야 할 구조

`Family silhouette and role from roster-50.md` 템플릿만 남아 있는 시트는 제작 불가 상태로 판정한다. 이름과 역할만으로 생성하면 패밀리 정체성과 후면 구조를 재현할 수 없기 때문이다.

## 제작 순서

패밀리 단위로 아래 순서를 끝낸 후 다음 패밀리로 이동한다.

1. base front 5속성
2. 승인된 base front를 참조해 base back 5속성
3. base front를 참조해 awaken front 5속성
4. awaken front를 참조해 awaken back 5속성
5. 다섯 속성 비교, front/back 구조 비교, 기본/각성 계보 비교

파일 단위로 모델과 스타일을 바꾸지 않는다. 같은 패밀리는 동일한 seed/reference 그룹과 색 관리 기준을 사용한다.

## 제작 큐

```bash
# 전체 1,000장 큐와 패밀리 시트 준비도 감사
npm run monster-art:2.5d:queue

# 우선 검수용 5개 패밀리
npm run monster-art:2.5d:queue:pilot

# 지정 패밀리
node scripts/export-monster-battle-25d-queue.mjs --families wolf_fighter,dragon_knight

# 승인 가능한 패밀리만
node scripts/export-monster-battle-25d-queue.mjs --ready-only
```

각 큐 항목에는 prompt, negativePrompt, 참조 이미지, 선행 작업, 원본·설치 경로가 포함된다. `blocked-family-brief` 항목은 패밀리 시트를 구체화하기 전에는 생성하지 않는다.

## 파일 전달과 설치

생성 원본:

```text
assets/monster/battle/{familyId}_{element}-front.webp
assets/monster/battle/{familyId}_{element}-back.webp
assets/monster/battle/{familyId}_{element}-awaken-front.webp
assets/monster/battle/{familyId}_{element}-awaken-back.webp
```

배경은 실제 alpha 또는 균일한 `#FF00FF` 플레이트만 허용한다. 검은 배경과 가짜 체크무늬 투명 배경은 사용하지 않는다.

```bash
# 한 패밀리 설치
node scripts/sync-painted-monster-art.mjs --families wolf_fighter

# 전체 설치 및 정적 검증
node scripts/sync-painted-monster-art.mjs --all
npm run monster-art:check
npm run monster-art:2.5d:audit
```

## 검수 게이트

1. 원본 전신이 프레임 밖으로 잘리지 않는다.
2. 설치본이 1024² 투명 WebP이며 색 번짐이나 마젠타 테두리가 없다.
3. 발이 바닥선에 안정적으로 놓이고 좌우·상단 12%, 하단 5% 안쪽 여백이 확보된다.
4. 다섯 속성이 필터 색칠이 아니라 재질과 포인트 이펙트로 구분된다.
5. front/back의 무기 수, 갑옷 조각, 날개·꼬리 구조가 일치한다.
6. 각성은 같은 개체로 보이면서 단계 상승이 명확하다.
7. 실제 전투 배경 위에서 얼굴, 실루엣, 원근과 조명이 읽힌다.

파일 검사 통과는 시각 검수 통과를 대신하지 않는다. 패밀리별 20장을 한 시트로 비교한 뒤 승인한다.

`monster-art:check`는 파일 커버리지와 portrait 파생본을 검사한다.
`monster-art:2.5d:audit`는 전투 스틸의 1024² WebP/alpha 규격과 front를 그대로
복사한 back을 검사하고 `battle-25d-audit.json`을 생성한다. 배포 게이트에서는
`npm run monster-art:2.5d:audit:strict`를 사용한다.
