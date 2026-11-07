# Device dev build: pick, bootstrap, rules

Shared by skills `resolve`, `e2e-debug`, `emulator-check`. No user grant needed — pick a free device yourself.

## Pick a device (prefer Android)

A device is **busy** if any is true — then never touch it:
- App in foreground on it:
  - Android: `adb -s <serial> shell dumpsys activity activities | grep mResumedActivity` contains `com.recipedia`
  - iOS: `xcrun simctl spawn <udid> launchctl list | grep com.recipedia`
- Another Metro serves it: `lsof -nP -iTCP -sTCP:LISTEN | grep node` (8081 = user's Metro; any other port = another agent).
- Another Maestro session drives it: `pgrep -fl maestro` (excluding your own MCP server).

Order:
1. Android emulator booted (`adb devices`) and not busy → use it.
2. No emulator booted → boot existing AVD: `~/Tools/AndroidStudio/emulator/emulator -list-avds`, then
   `~/Tools/AndroidStudio/emulator/emulator -avd <name> -no-snapshot-save` (background), `adb wait-for-device`.
3. Android busy → iOS sim booted (`xcrun simctl list devices booted`) and not busy → use it; none booted → `xcrun simctl boot <existing udid>`.
4. All busy → skip device work, report "not run: devices busy".

## Hard rules
- Maestro **MCP only**, never `maestro` CLI.
- Never `launchApp`, `clearState`, `flows/setupTest.yaml`, or `cases/**/ci/*` wrappers (they launch). Use raw `cases/<feature>/N_*.yaml` or inline YAML.
- Only launch = bootstrap below. After it: no reload (`r`, Cmd+R), no `simctl terminate`, no `am force-stop`. Code reaches app via Fast Refresh.
- Never kill another session's Metro. Never create/erase/delete sims or AVDs.

## Bootstrap own Metro (once)
From the checkout under test, first free port ≥ 8082 (background):
```bash
npx expo start --dev-client --port <port> --offline
```
Wait until `curl -s localhost:<port>/status` = `packager-status:running`. Then open the dev build:
- Android: `adb reverse tcp:<port> tcp:<port>`, `adb shell am force-stop com.recipedia` (deep link into a running instance crashes), then
  `adb shell am start -a android.intent.action.VIEW -d "exp+recipedia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A<port>"`.
  `Can't find service: package` / broken pipe → poll `adb shell service check package` until `found`, retry.
- iOS: `xcrun simctl openurl <udid> "exp+recipedia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A<port>"`.

Wait for `Bundled` in Metro log, then `inspect_screen` until Home renders (Pyodide init ~1 min). Welcome screen → tap `WelcomeScreen::SkipButton`.

## Run
Before each case: inline `tapOn: id: "BottomTabs::Home"` to reset navigation. App keeps its own data, not the seeded dataset: missing seeded item = **env**, not regression.
Repro needs relaunch/clearState/native reload → stop, report "unverified: needs relaunch".

## Teardown
Stop your Metro task. Booted device by you → leave running. Say which device + bundle the app is left on.
