#!/usr/bin/env bash
# Build a signed Android APK (TWA) from the Mframapa PWA.
# Run from the frontend-pwa directory: bash scripts/build-apk.sh
set -e

KEYSTORE="mframapa-release.keystore"
ALIAS="mframapa"

# ── 1. Java ────────────────────────────────────────────────────────────
if ! command -v java &>/dev/null; then
  echo "Java not found. Installing via Homebrew..."
  brew install --cask temurin@17
  export JAVA_HOME=$(/usr/libexec/java_home 2>/dev/null || echo "")
fi
echo "Java: $(java -version 2>&1 | head -1)"

# ── 2. Android SDK (command-line tools only, no Android Studio) ────────
if [ -z "$ANDROID_HOME" ]; then
  ANDROID_HOME="$HOME/Library/Android/sdk"
  export ANDROID_HOME
fi
if [ ! -d "$ANDROID_HOME/cmdline-tools" ]; then
  echo "Installing Android command-line tools..."
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  SDK_ZIP="commandlinetools-mac-11076708_latest.zip"
  curl -L "https://dl.google.com/android/repository/$SDK_ZIP" -o "/tmp/$SDK_ZIP"
  unzip -q "/tmp/$SDK_ZIP" -d "$ANDROID_HOME/cmdline-tools"
  mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
fi
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

# Accept SDK licences + install build tools if needed
if [ ! -d "$ANDROID_HOME/build-tools" ]; then
  echo "Installing Android build tools..."
  yes | sdkmanager --licenses >/dev/null 2>&1 || true
  sdkmanager "build-tools;34.0.0" "platforms;android-34" "platform-tools"
fi

# ── 3. Bubblewrap CLI ──────────────────────────────────────────────────
if ! command -v bubblewrap &>/dev/null; then
  echo "Installing @bubblewrap/cli..."
  npm install -g @bubblewrap/cli
fi

# ── 4. Keystore ────────────────────────────────────────────────────────
if [ ! -f "$KEYSTORE" ]; then
  echo ""
  echo "No keystore found. Creating a new one..."
  echo "IMPORTANT: Save the passwords you enter — you need them to update the app later!"
  echo ""
  keytool -genkey -v \
    -keystore "$KEYSTORE" \
    -alias "$ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000
  echo ""
  echo "Keystore saved to: $KEYSTORE"
  echo "Back this file up somewhere safe!"
fi

# ── 5. Bubblewrap init (first time) ────────────────────────────────────
if [ ! -f "android/app/build.gradle" ]; then
  echo "Initialising Bubblewrap project from twa.config.json..."
  bubblewrap init --manifest https://mframapa.ai/manifest.json
fi

# ── 6. Build ───────────────────────────────────────────────────────────
echo ""
echo "Building APK..."
bubblewrap build

echo ""
echo "Build complete!"
echo "Unsigned debug APK:  android/app/build/outputs/apk/debug/app-debug.apk"
echo "Signed release APK:  android/app/build/outputs/apk/release/app-release-signed.apk"
echo ""
echo "Distribute the signed release APK via:"
echo "  • Samsung Galaxy Store  — seller.samsungapps.com"
echo "  • Huawei AppGallery     — developer.huawei.com"
echo "  • Direct download page  — host on mframapa.ai/download"
echo "  • Amazon Appstore       — developer.amazon.com"
