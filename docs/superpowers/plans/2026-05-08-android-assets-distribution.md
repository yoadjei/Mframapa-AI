# Android Assets + APK Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create missing mobile assets, build a release APK, and ship a GitHub Actions workflow that publishes the APK to GitHub Releases on every version tag.

**Architecture:** Expo bare workflow builds the APK locally via `npx expo run:android --variant release`. CI uses `ubuntu-latest` + Java 17 + Android SDK via `reactivecircus/android-emulator-runner` — but for release builds we only need the Gradle toolchain (no emulator). The signed APK is uploaded to GitHub Releases via `softprops/action-gh-release`.

**Tech Stack:** Expo SDK 51, Gradle, GitHub Actions, ImageMagick (asset generation)

---

### Task 1: Generate missing mobile assets

**Files:**
- Create: `mobile/assets/icon.png` (1024×1024 px)
- Create: `mobile/assets/adaptive-icon.png` (1024×1024 px, safe zone 66%)
- Create: `mobile/assets/splash.png` (1242×2436 px)

The assets referenced in `mobile/app.json` (`./assets/icon.png`, `./assets/splash.png`, `./assets/adaptive-icon.png`) do not exist. Expo build will fail without them.

- [ ] **Step 1: Generate assets with ImageMagick**

Run from repo root (requires ImageMagick — install via `choco install imagemagick` on Windows or `brew install imagemagick` on Mac):

```bash
mkdir -p mobile/assets

# App icon — dark background, white "M" letter
convert -size 1024x1024 xc:#0f172a \
  -fill '#10b981' -draw "rectangle 200,200 824,824" \
  -fill white -font Arial-Bold -pointsize 500 \
  -gravity center -annotate 0 "M" \
  mobile/assets/icon.png

# Adaptive icon (same as icon — safe zone is fine at 1024×1024)
cp mobile/assets/icon.png mobile/assets/adaptive-icon.png

# Splash screen — dark background, centered icon
convert -size 1242x2436 xc:#0f172a \
  mobile/assets/icon.png -resize 300x300 \
  -gravity center -composite \
  mobile/assets/splash.png
```

- [ ] **Step 2: Verify files exist and are valid PNGs**

```bash
file mobile/assets/icon.png mobile/assets/adaptive-icon.png mobile/assets/splash.png
```

Expected: each line ends with `PNG image data`.

- [ ] **Step 3: Fix app.json — add NOTIFICATIONS permission and remove expo-router plugin**

`mobile/app.json` currently includes `"expo-router"` in plugins but the app uses `@react-navigation/bottom-tabs` (not Expo Router). Remove it to prevent build errors. Also add notification permission for AlertsScreen.

Edit `mobile/app.json`:

```json
{
  "expo": {
    "name": "Mframapa",
    "slug": "mframapa",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0f172a"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0f172a"
      },
      "package": "ai.mframapa.app",
      "versionCode": 1,
      "minSdkVersion": 21,
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "plugins": [
      "expo-location",
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#10b981"
        }
      ]
    ]
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add mobile/assets/ mobile/app.json
git commit -m "feat(mobile): add app assets and fix app.json plugins"
```

---

### Task 2: Verify local APK build

**Files:**
- Read: `mobile/package.json` (check expo version + react-native-mmkv)

- [ ] **Step 1: Install mobile dependencies**

```bash
cd mobile && npm install
```

Expected: no errors. If `react-native-mmkv` install fails, note the error — it requires native build.

- [ ] **Step 2: Run prebuild to generate android/ folder**

```bash
cd mobile && npx expo prebuild --platform android --clean
```

Expected: `android/` directory created with `gradlew`, `app/`, etc. Fix any plugin errors before continuing.

- [ ] **Step 3: Build release APK**

```bash
cd mobile && npx expo run:android --variant release
```

Expected: `mobile/android/app/build/outputs/apk/release/app-release.apk` created. Note the file size — target is <15 MB.

```bash
ls -lh mobile/android/app/build/outputs/apk/release/app-release.apk
```

- [ ] **Step 4: Commit android/ gitignore**

Add to `mobile/.gitignore` (create if missing):

```
android/
ios/
.expo/
node_modules/
```

```bash
git add mobile/.gitignore
git commit -m "chore(mobile): gitignore android build artifacts"
```

---

### Task 3: GitHub Actions APK release workflow

**Files:**
- Create: `.github/workflows/android-release.yml`

- [ ] **Step 1: Create workflow file**

```yaml
# .github/workflows/android-release.yml
name: Android APK Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json

      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Install Expo CLI
        run: npm install -g @expo/cli

      - name: Install mobile dependencies
        working-directory: mobile
        run: npm ci

      - name: Expo prebuild
        working-directory: mobile
        run: npx expo prebuild --platform android --clean

      - name: Build release APK
        working-directory: mobile/android
        run: ./gradlew assembleRelease

      - name: Rename APK
        run: |
          TAG=${GITHUB_REF_NAME:-dev}
          cp mobile/android/app/build/outputs/apk/release/app-release.apk \
             mframapa-${TAG}.apk

      - name: Upload APK artifact
        uses: actions/upload-artifact@v4
        with:
          name: mframapa-apk
          path: mframapa-*.apk

      - name: Publish GitHub Release
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v2
        with:
          files: mframapa-*.apk
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Commit workflow**

```bash
git add .github/workflows/android-release.yml
git commit -m "ci: add Android APK release workflow on version tags"
```

- [ ] **Step 3: Tag and trigger a test run**

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then check: `gh run list --workflow=android-release.yml`

Expected: run appears and succeeds. APK attached to GitHub Release `v1.0.0`.

---

### Task 4: Samsung Galaxy Store submission checklist

**Files:**
- Create: `docs/samsung-store-checklist.md`

Samsung Galaxy Store requires a developer account (free) and specific assets.

- [ ] **Step 1: Register Samsung developer account**

Go to https://seller.samsungapps.com — sign up with a Samsung account. No annual fee.

- [ ] **Step 2: Create required store assets**

Generate the following from the icon.png:

```bash
# Feature graphic (1024×500 px)
convert -size 1024x500 xc:#0f172a \
  mobile/assets/icon.png -resize 200x200 \
  -gravity west -geometry +80+0 -composite \
  -fill white -font Arial-Bold -pointsize 60 \
  -gravity east -annotate +80+0 "Mframapa\nAir Quality" \
  docs/samsung-feature-graphic.png

# Screenshots: capture from emulator or device (need 2 min)
# Required: 2 screenshots at 1080×1920 or 1440×2560
```

- [ ] **Step 3: Create store listing document**

Create `docs/samsung-store-listing.md`:

```markdown
# Samsung Galaxy Store Listing

**App name:** Mframapa AI
**Category:** Health & Fitness
**Price:** Free
**Content rating:** Everyone

**Short description (80 chars):**
Satellite-powered air quality monitoring for Africa.

**Full description (4000 chars max):**
Mframapa AI gives you real-time air quality intelligence for African cities,
powered by satellite data from NASA, ESA Copernicus, and ERA5 reanalysis.

Features:
- PM2.5 and AQI predictions with uncertainty ranges
- Offline city search with pre-cached data
- Dark/light mode with Hausa/French/English support
- AQI change notifications
- 12 regional ML models covering urban and rural Africa

Data sources: Sentinel-5P, MODIS, ERA5, OpenAQ, WorldPop

**Keywords:** air quality, Africa, PM2.5, AQI, health, environment, satellite

**Support email:** adjeiyawosei@gmail.com
```

- [ ] **Step 4: Submit APK to Samsung Galaxy Store**

1. Log in to seller.samsungapps.com
2. Click "Add New Application" → Android
3. Upload `mframapa-v1.0.0.apk`
4. Fill listing from `docs/samsung-store-listing.md`
5. Upload feature graphic and 2+ screenshots
6. Set min OS: Android 5.0 (minSdkVersion 21)
7. Submit for review (typically 3–5 business days)

- [ ] **Step 5: Commit docs**

```bash
git add docs/samsung-store-checklist.md docs/samsung-store-listing.md
git commit -m "docs: add Samsung Galaxy Store submission checklist and listing"
```

---

## Definition of Done

- [ ] `mobile/assets/` contains icon.png, adaptive-icon.png, splash.png
- [ ] `npx expo run:android --variant release` produces APK <15 MB
- [ ] GitHub Actions workflow builds APK on tag push
- [ ] APK attached to GitHub Release `v1.0.0`
- [ ] Samsung Galaxy Store submission initiated
