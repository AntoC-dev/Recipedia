---
name: emulator-check
description: Visually check, verify or analyze UI on the Android emulator or iOS simulator via Maestro MCP (screenshots, navigating to a screen, dev build / Metro setup). Use before any Maestro MCP run on a device. Not for writing E2E test suites.
---

# Emulator / Simulator UI Check (Maestro MCP)

Visual check of change on Android emulator / iOS sim during dev. For E2E suite authoring follow `.claude/rules/e2e.md` + `maestro-e2e` skill instead.

## Method: one flow per check

Never drive app one command at a time + screenshot each step — each round trip costs seconds.

1. `list_devices` once → `device_id`.
2. Write whole check as ONE flow file in scratchpad: navigate, act, `assertVisible` / `assertNotVisible` on testIDs,
   `takeScreenshot: <name>` only at states needing visual look (spacing, alignment, overlap).
   Screenshot path MUST be absolute (scratchpad dir, no `.png` suffix — Maestro adds it). Relative path fails:
   MCP cwd read-only (`Read-only file system`).
3. One `run` with `files: [<flow>]`. Failing assert names step → fix, rerun.
4. Read saved screenshots together at end.

`inspect_screen` only to discover testIDs before writing flow, not after every tap (large JSON).

## Flow rules

- Reuse existing flows via `runFlow` with absolute paths (`<checkout root>/tests/e2e/flows/...`; in a worktree use
  worktree root), e.g. `fab/expand.yaml`, `recipe/adding/ocr/android/*.yaml`. Gallery empty → run
  `addMedia.yaml` before picking a photo.
- MCP `Request timed out` ≠ flow failed: device may still be running it. Screenshot to see state; split long flows.
- Prefer `id:` selectors. Paper Button label on `<testID>-text`; RoundButton testID = `<testID>::RoundButton`.
- `scrollUntilVisible`: always `centerElement: true` + `speed`. If it times out → fixed `swipe` in `repeat`.
- `extendedWaitUntil` timeout ≤5000ms: wrong id fails fast.
- Never commit scratch flows into `tests/e2e/`.

## When to check

Only after implementation AND review agents finish: their edits trigger Fast Refresh / reloads → screen reset,
transient red boxes. Red box right after edits → re-read file before assuming bug.

## Dev build

- Reload / launch dev build only when user grants it for session.
- User's Metro running → use it only if it serves the checkout under test (`lsof -p <pid> -a -d cwd`); a Metro from
  another checkout shows other code. Else start Metro from current checkout/worktree on free port (never kill another
  session's Metro): `npx expo start --dev-client --port <port> --offline` (background), wait until `/status` returns
  `packager-status:running`, then open dev-client link:
  - Android: `adb reverse tcp:<port> tcp:<port>`, then `adb shell am start -a android.intent.action.VIEW -d
    "exp+recipedia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A<port>"`.
  - iOS: same URL via `xcrun simctl openurl booted`.
  - First bundle takes a while: wait for `Bundled` in Metro log before running flows.
- Android `Can't find service: package` / broken pipe → system server restarting; poll `adb shell service check package`
  until `found`, relaunch.
