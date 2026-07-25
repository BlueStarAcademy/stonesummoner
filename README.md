# StoneSummoner

수집형 RPG — 서머너즈워식 성장 + 마법진 스톤소환 전투.  
**PWA 웹앱**으로 실행·설치 가능.

저장소: https://github.com/BlueStarAcademy/stonesummoner

## 로컬 실행

```bash
npm install
npm run dev          # PWA http://localhost:5173 (모바일 우선)
npm run cli:demo     # 홈→출정→전투→보상 루프 (비대화형)
npm run cli          # CLI 인터랙티브
npm test
npm run build && npm start
```

### CLI 명령

| 명령 | 설명 |
|------|------|
| `collect` | 진액 연못 수집 |
| `summon` | 소환진 소환 (소환서 1) |
| `enhance 0` | 강화진 레벨업 (인덱스/uid) |
| `gear` / `enh-gear acc\|orb` | 서머너 장비 현황·강화 |
| `symbols` / `equip m s` / `enh-sym i` | 상징 목록·장착·강화 |
| `roster` | 보유 몬스터 |
| `stages` | 스테이지 목록 |
| `go garen_1_1` | 출정·자동전투·보상 |
| `status` | 재화·클리어 현황 |
| `demo` | 데모 루프 |
| `quit` | 종료 |

## 패키지

| 경로 | 역할 |
|------|------|
| `apps/web` | Vite PWA (**모바일 우선** 홈·출정·전투) |
| `apps/cli` | 홈→출정→전투→보상 CLI |
| `packages/loop` | 루프 공용 로직 |
| `packages/board` | 5/7/9 바둑 룰 · 50수 강화 리셋 |
| `packages/combat` | ATB · Amplify · 마나 · 진문개방 |
| `packages/home` | 섬 건물 4종 |
| `packages/data` | 몬스터·상징·가렌숲 1챕터 |
| `docs/` | GDD |

## Railway 배포

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub**
2. `BlueStarAcademy/stonesummoner` 연결
3. 설정이 `railway.toml`을 사용합니다  
   - Build: `npm install && npm run build`  
   - Start: `npm run start`  
   - Healthcheck: `/`
4. 생성되는 Public URL로 PWA 접속 · 모바일에서 「홈 화면에 추가」

환경 변수: `PORT`는 Railway가 자동 주입합니다.

## PWA

프로덕션 빌드에 Service Worker + Web Manifest가 포함됩니다 (`vite-plugin-pwa`).  
HTTPS(Railway 기본)에서 설치·오프라인 캐시가 동작합니다.
