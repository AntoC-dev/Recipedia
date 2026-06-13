# Installation Guide

## Prerequisites

### Required

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org/)
- **npm** v10 or higher (bundled with Node.js)
- **Git** — [git-scm.com](https://git-scm.com/)
- **Expo CLI** — installed globally or used via `npx`:
  ```bash
  npm install -g expo-cli
  ```

### For Android development

- **Android Studio** with the Android SDK — [developer.android.com/studio](https://developer.android.com/studio)
- Set the `ANDROID_HOME` environment variable to your SDK location
- Add `$ANDROID_HOME/platform-tools` to your `PATH`
- Create an Android Virtual Device (AVD) via Android Studio's AVD Manager, or connect a physical device with USB debugging enabled

Minimum SDK version: **API level 23 (Android 6.0)**. Target SDK: **API level 36**.

### For iOS development (macOS only)

- **Xcode 15+** from the Mac App Store
- Xcode Command Line Tools: `xcode-select --install`
- An iOS simulator configured in Xcode, or a physical device with a developer certificate
- **CocoaPods**: `sudo gem install cocoapods`

Minimum deployment target: **iOS 18.0**.

### For the recipe scraper module

The web import feature embeds Python via a native module (`modules/recipe-scraper`). The native build handles this automatically — no manual Python installation is required.

---

## Clone and install

```bash
git clone https://github.com/AntoC-dev/Recipedia.git
cd Recipedia
npm install
```

`npm install` installs all JavaScript dependencies. No additional setup step is needed for most development tasks.

---

## Environment setup

There are no required `.env` files for basic development. Optional environment variables:

| Variable | Purpose | Default |
|---|---|---|
| `EXPO_PUBLIC_DISABLE_ANIMATIONS` | Set to `"true"` to disable navigation animations (used in E2E tests) | unset |

These are set inline when needed, e.g. `EXPO_PUBLIC_DISABLE_ANIMATIONS=true npm run dev:android`.

---

## Running the app

### Start the development server

```bash
npm start
```

This starts the Expo Metro bundler. From the terminal menu you can open the app in a simulator/emulator or on a device via the Expo Go app.

> Note: OCR, the recipe scraper, and several other native modules require a full native build and do not work inside Expo Go. Use `dev:android` or `dev:ios` instead.

### Android emulator

```bash
npm run dev:android
```

Requires Android Studio with a configured AVD, or a physical device connected via USB with USB debugging enabled.

### iOS simulator (macOS only)

```bash
npm run dev:ios
```

Requires Xcode and a booted simulator. To boot one manually:

```bash
npm run boot:ios-simulator
# Boots iPhone SE (3rd generation) — the default E2E target
```

### Physical device

Connect your device and run the same `dev:android` or `dev:ios` commands. For iOS, a paid Apple Developer account is required to install on a physical device.

---

## Building a standalone APK / IPA

The project uses EAS Build. To build locally:

```bash
# Android APK (Maestro/testing profile)
npm run build:test:android

# iOS IPA
npm run build:test:ios
```

Install the resulting artifact:

```bash
# Android
npm run install:android   # runs: adb install *.apk

# iOS
npm run install:ios       # runs: xcrun simctl install booted *.app
```

---

## Verifying the setup

Run the quality checks to confirm the environment is correct:

```bash
npm run quality        # lint + format check + typecheck + expo:doctor
npm run test:unit      # unit test suite
```

All checks should pass on a clean clone with no modifications.

---

## Common setup errors

### `npm install` fails with peer dependency errors

Run with `--legacy-peer-deps`:

```bash
npm install --legacy-peer-deps
```

### Metro bundler reports "Unable to resolve module"

Clear the Metro cache:

```bash
npm run dev:clean   # expo start --clear
```

### Android build fails: "SDK location not found"

Create a `local.properties` file in the `android/` directory:

```
sdk.dir=/Users/<your-username>/Library/Android/sdk
```

Alternatively, set the `ANDROID_HOME` environment variable.

### iOS build fails: CocoaPods issues

```bash
cd ios
pod install --repo-update
cd ..
```

### `expo-doctor` reports outdated packages

Run `npx expo install --fix` to align package versions with the current Expo SDK. Do not manually upgrade Expo SDK versions without following the [Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/).

### TypeScript errors after `npm install`

```bash
npm run typecheck
```

If errors appear only in `node_modules`, they are usually safe to ignore. If they appear in `src/`, check that you are on the correct Node version (`node --version` should be v18+).

### App crashes immediately on Android

Ensure you are using a device or emulator running **Android 6.0+ (API 23+)**. The app does not support lower versions.
