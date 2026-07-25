# StoneSummoner

수집형 RPG — 서머너즈워식 성장 + 마법진 스톤소환 전투.  
**PWA 웹앱**으로 실행·설치 가능.

저장소: https://github.com/BlueStarAcademy/stonesummoner

## 로컬 실행

```bash
npm install
npm run build && npm start   # PWA+API http://localhost:8080
# 개발 시 (터미널 2개):
npm run api -w stonesummoner-web   # API :8080 (메모리 DB 또는 DATABASE_URL)
npm run dev                        # Vite :5173 → /api 프록시
npm run cli:demo                   # 홈→출정→전투→보상 루프
npm test
```

첫 화면에서 **데모 플레이 (테스트)** / 로그인 / 게스트를 고릅니다.  
몬스터 턴에는 **S1·S2·S3** 스킬(쿨다운)과 서머너 **진문개방**을 사용합니다.

### CLI 명령

| 명령 | 설명 |
|------|------|
| `collect` | 진액 연못 수집 |
| `summon` | 소환진 소환 (소환서 1) |
| `enhance 0` | 강화진 레벨업 (인덱스/uid) |
| `gear` / `enh-gear acc\|orb` | 서머너 장비 현황·강화 |
| `symbols` / `equip m s` / `enh-sym i` | 상징 목록·장착·강화 |
| `roster` | 보유 몬스터 |
| `party 0 1 2 3` | 파티 편성 |
| `stages` | 스테이지 목록 (순차 해금) |
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
3. **Add Plugin → PostgreSQL** 후 웹 서비스에 `DATABASE_URL` 연결(변수 참조)
4. `railway.toml` 사용  
   - Build: `npm install && npm run build`  
   - Start: `npm run start`  
   - Healthcheck: `/` · API: `/api/health` → `{ ok, db }`
5. Public URL로 PWA 접속 · 「홈 화면에 추가」

| 환경 변수 | 설명 |
|-----------|------|
| `PORT` | Railway 자동 주입 |
| `DATABASE_URL` | Postgres 연결 문자열 (플러그인 링크) |
| `PGSSL` | `0`이면 SSL 비활성 (로컬 터널용). Railway는 기본 SSL |
| `NODE_ENV` | `production`이면 Secure 쿠키 |

서버 기동 시 [`apps/web/sql/001_init.sql`](apps/web/sql/001_init.sql)을 적용합니다 (`users` / `sessions` / `saves`).  
`DATABASE_URL`이 없으면 **인메모리** 스토어로 API가 동작합니다(로컬·데모용, 재시작 시 소멸).

## PWA

프로덕션 빌드에 Service Worker + Web Manifest가 포함됩니다 (`vite-plugin-pwa`).  
HTTPS(Railway 기본)에서 설치·오프라인 캐시가 동작합니다.
