---
paths:
  - "tests/e2e/**"
---

# E2E Tests (Maestro)

Test suites in `tests/e2e/` — see `tests/e2e/E2E_TESTING.md` for full guide.

CI artifacts: `maestro-logs-android-<suite>` / `maestro-logs-ios-<suite>`

- `maestro.log` — flow execution log
- `android-app-logs.txt` — logcat
- `ios-app-logs.txt` — iOS sim log

Use the `e2e-ci-debugger` agent or `/e2e-debug` skill for CI failure triage (Claude Code only).
