# Google Play / Android packaging

StoneSummoner ships as a **Capacitor** Android app wrapping the Vite + Pixi PWA in `apps/web`. The Node API stays on Railway (or similar); the APK does not embed Postgres.

| Item | Value |
|------|--------|
| Application ID | `com.bluestaracademy.stonesummoner` |
| App name | StoneSummoner |
| Web assets | `apps/web/dist` (`capacitor.config.ts` → `webDir`) |
| Upload artifact | **AAB** (Play Console). APK for local/sideload only. |

## Prerequisites

- Node 20+
- [Android Studio](https://developer.android.com/studio) (Ladybug+ recommended) with JDK 21
- Android SDK Platform 35+, build-tools
- A **HTTPS** public API URL (Railway) for login / cloud save from the device

## One-time setup

```bash
cd apps/web
npm install
# first time only (already done if android/ exists):
# npx cap add android
```

Create a release keystore (once; back up offline — losing it blocks updates):

```bash
keytool -genkey -v -keystore stonesummoner-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias stonesummoner
```

Copy [`apps/web/android/key.properties.example`](../apps/web/android/key.properties.example) to `apps/web/android/key.properties` and fill in paths/passwords. **Do not commit** `key.properties` or `*.jks`.

## Build for device (debug)

```bash
# From repo root — set API for the WebView (required for cloud auth):
# PowerShell:
$env:VITE_API_BASE="https://YOUR-RAILWAY-HOST"
npm run android:sync

# Then open Android Studio:
npm run cap:open
# Run on emulator/device, or:
cd apps/web/android && .\gradlew.bat assembleDebug
```

Debug APK: `apps/web/android/app/build/outputs/apk/debug/app-debug.apk`

## Release AAB (Play upload)

```bash
$env:VITE_API_BASE="https://YOUR-RAILWAY-HOST"
npm run android:sync
cd apps/web/android
.\gradlew.bat bundleRelease
```

AAB: `apps/web/android/app/build/outputs/bundle/release/app-release.aab`

Upload that file in Play Console → Production (or Internal testing).

### Signing note

With `apps/web/android/key.properties` present, `bundleRelease` / `assembleRelease` use the upload keystore (`app/build.gradle` → `signingConfigs.release`). Without it, release builds are unsigned/debug-signed — fine for local testing, **not** for Play.
## Server env (Railway)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres (required for real sessions) |
| `CORS_ORIGINS` | Optional extra origins; Capacitor `https://localhost` etc. are already allowed |
| `NODE_ENV=production` | Secure cookies |

Client build-time: `VITE_API_BASE=https://your-service.up.railway.app` (no trailing slash).

## Store listing draft

Use these as a starting point in Play Console (edit before publish).

### Short description (≤80 chars)

**KO:** 상징으로 키우고, 마법진에서 싸운다. 수집형 스톤소환 RPG.  
**EN:** Raise symbols, fight on the magic circle. Collectible stone-summon RPG.

### Full description (KO)

StoneSummoner는 서머너즈워식 성장과 마법진 스톤소환 전투를 결합한 수집형 RPG입니다.

- 섬에서 진액·소환·강화로 파티를 키우세요
- 출정 후 마법진에서 ATB 전투와 진문개방을 사용하세요
- 계정 로그인 시 클라우드 세이브로 진행 상황을 보관합니다

오프라인·데모 플레이도 가능합니다. 온라인 기능은 인터넷 연결이 필요합니다.

### Full description (EN)

StoneSummoner mixes Summoners War–style progression with magic-circle stone-summon battles.

- Grow your party on the island (essence, summon, enhance)
- Deploy into ATB fights and open the summoner’s gates
- Sign in to keep progress in the cloud

Demo / local play works offline; online features need a network connection.

### Graphics checklist

| Asset | Spec (Play) |
|-------|-------------|
| App icon | 512×512 PNG (`public/icons/icon-512.png` as base) |
| Feature graphic | 1024×500 |
| Phone screenshots | ≥2, 16:9 or 9:16 |
| Content rating | Complete IARC questionnaire |
| Privacy policy URL | Required if account/cloud save (host a short policy page) |

### Content / data safety notes

- Account email + hashed password (server)
- Game save sync over HTTPS
- No ads in current build (update if you add AdMob)
- Target audience: declare appropriately (fantasy combat)

## Privacy policy (minimal outline)

Publish a page that states: what data (email, nickname, save JSON), why (auth + sync), retention, contact email, and that the Android app talks to your API host. Link it in Play Console.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Login works on web, fails in APK | Missing `VITE_API_BASE` at build time, or API not HTTPS |
| 401 after login in APK | CORS origin not allowed, or cookie blocked (need `SameSite=None; Secure` + CapacitorHttp) |
| Blank WebView | Stale sync — rerun `npm run android:sync` |
| `cap` / Gradle errors | Open project in Android Studio and install SDK / JDK 21 |
