# Installation Guide

Setup for local development. For the project overview see [README.md](../README.md); for contribution workflow see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Prerequisites

### All platforms

- **Node.js 24** (the version CI uses) with the bundled npm.
- **Git**

No global Expo CLI is needed; the project's scripts call the local `expo` binary.

### Android

- **Android Studio** with the Android SDK
- `ANDROID_HOME` set to the SDK location, and `$ANDROID_HOME/platform-tools` on your `PATH`
- An AVD created in the AVD Manager, or a physical device with USB debugging enabled

The app supports Android 7.0+ (minSdk 24, the React Native default); `compileSdkVersion` and `targetSdkVersion` are 36 (`app.config.ts`).

### iOS (macOS only)

- **Xcode 26.4 or newer**. Expo SDK 57 requires it, and CI builds with Xcode 26.4.1.
- Xcode Command Line Tools: `xcode-select --install`
- The **iOS 26.4 simulator runtime** (Xcode > Settings > Components). This is the runtime CI uses for E2E, and `npm run boot:ios-simulator` looks for it.
- A paid Apple Developer account to run on a physical device

The deployment target is iOS 18.0 (`app.config.ts`).

### Recipe scraper

The web import feature embeds Python through the `modules/recipe-scraper` native module (Chaquopy on Android, Pyodide in a WebView on iOS). The native build handles it; no local Python install is needed.

---

## Clone and install

```bash
git clone https://github.com/AntoC-dev/Recipedia.git
cd Recipedia
npm install
```

`npm install` also applies `patches/` through `patch-package` (`postinstall`) and installs the Husky git hooks (`prepare`). There are no required `.env` files.

---

## Running the app

OCR, the recipe scraper and other native modules do not work in Expo Go. Use a development build.

```bash
npm run dev:android   # expo run:android
npm run dev:ios       # expo run:ios (macOS only)
npm start             # Metro bundler only, once a development build is installed
```

`expo run:*` generates the `android/` and `ios/` directories on first run; they are not committed. Both commands use a connected device or a running emulator/simulator.

### iOS simulator that matches CI

```bash
npm run boot:ios-simulator
```

`scripts/boot-ios-simulator.sh` reads the device model (iPhone 17e) and `os_version` (26.4) from `.github/workflows/e2e-maestro.yml`, so local simulators follow CI automatically. Override them with environment variables, for example:

```bash
IOS_VERSION=26.5 npm run boot:ios-simulator
DEVICE_MODEL="iPhone 17 Pro" npm run boot:ios-simulator
```

The script fails if no matching simulator is installed; add the runtime in Xcode or use an override.

### Optional environment variables

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_DISABLE_ANIMATIONS` | `"true"` disables animations; set by the E2E build profiles (`app.config.ts`) |
| `EXPO_PUBLIC_DATASET_TYPE` | Selects the bundled dataset (`production`, `performance`) |

---

## Local test builds

`eas.json` defines the build profiles; the `build:*` scripts run them locally with `eas build --local`.

```bash
npm run build:test:android   # Maestro profile
npm run build:test:ios
npm run install:android      # adb install *.apk, then deletes the apk
npm run install:ios          # xcrun simctl install booted *.app
```

See [testing.md](testing.md) for running the E2E suites against these builds.

---

## Verify the setup

```bash
npm run quality      # lint + format check + typecheck + knip + expo-doctor
npm run test         # unit + integration tests
```

Both should pass on a clean clone.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Metro: "Unable to resolve module" | `npm run dev:clean` (`expo start --clear`) |
| Android: "SDK location not found" | Set `ANDROID_HOME`, or create `android/local.properties` with `sdk.dir=/path/to/Android/sdk` |
| Stale or broken native project (CocoaPods, Gradle) | `npm run build:clean`, then `npx expo prebuild --clean` |
| `expo-doctor` reports mismatched versions | `npx expo install --fix`; for SDK upgrades follow the [Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) |
| `boot:ios-simulator` finds no device | Install the iOS 26.4 runtime in Xcode, or set `IOS_VERSION` / `DEVICE_MODEL` |
