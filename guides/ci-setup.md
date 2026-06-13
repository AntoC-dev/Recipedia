# CI Setup Guide

Recipedia uses GitHub Actions for all CI/CD. This guide covers every workflow, required secrets, the EAS build pipeline, quality gates, and how to debug failures.

---

## Workflows overview

| File | Name | Triggers |
|---|---|---|
| `quality.yml` | Code Quality | push/PR to `main` |
| `build-test.yml` | Build & Test Pipeline | push/PR to `main` |
| `build-app.yml` | Build App (reusable) | `workflow_call` |
| `e2e-maestro.yml` | E2E Maestro Tests (reusable) | `workflow_call` |
| `performance.yml` | Performance Tests (Flashlight) | nightly cron, `workflow_dispatch`, PR with `perf-test` label |
| `documentation.yml` | Documentation | push to `main` (src/README/jsdoc changes), `workflow_dispatch` |
| `release.yml` | Release | push to `main`, `workflow_dispatch` |
| `publication.yml` | Publication | after Build & Test Pipeline succeeds on `main`, `workflow_dispatch` |

---

## Code Quality (`quality.yml`)

Runs on every push and PR to `main`. Jobs run in parallel after `install`:

```
commit-validation (PR only)
    └── install
            ├── lint           (ESLint)
            ├── formatting     (Prettier)
            ├── typescript     (tsc)
            ├── expo-doctor    (Expo config check)
            ├── security       (npm audit — critical level)
            └── documentation  (TypeDoc build)
```

- **commit-validation**: Runs `commitlint` against all commits in the PR range. Conventional Commits format required.
- **security**: Uses `oke-py/npm-audit-action`, fails only on `critical` severity, posts a PR comment if vulnerabilities are found.
- **documentation**: Runs `npm run docs:build`. Fails the pipeline if TypeDoc exits with warnings.

All jobs restore `node_modules` from cache keyed on `package-lock.json` hash.

---

## Build & Test Pipeline (`build-test.yml`)

Runs on every push and PR to `main`. This is the main pipeline.

### Job graph

```
install-and-doctor
    ├── reassure-performance     (PR only — compares render benchmarks)
    ├── unit-tests-and-coverage
    ├── integration-tests
    ├── build-android  ──────────── e2e-tests-android ──┐
    ├── build-android-performance ─ e2e-tests-android-perf ┤
    └── build-ios ───────────────── e2e-tests-ios ──────┤
                                                         └── merge-test-artifacts
                                                                  └── test-result-summary
```

### install-and-doctor

Runs `npm ci` and caches `node_modules` by `package-lock.json` hash (key: `{os}-node_modules-{hash}`). All downstream jobs restore from this cache.

### unit-tests-and-coverage

- Runs `npm run test:unit:coverage`
- Uploads `coverage/` artifact (30-day retention)
- Posts per-file cobertura coverage comment on PRs (minimum 75%, does not block merge)
- Uploads JUnit summary artifact

### integration-tests

- Runs `npm run test:integration`
- Uploads JUnit summary artifact

### reassure-performance

- PR-only job
- Checks out the base SHA, installs, runs `npm run test:perf:baseline`
- Checks out the PR SHA, installs, runs `npm run test:perf`
- Generates a compact diff with `.github/scripts/reassure-compact-summary.mjs`
- Posts a sticky PR comment (header: `reassure`) via `marocchino/sticky-pull-request-comment`
- Uploads `.reassure/` as artifact (7-day retention)

### build-android / build-ios

Both delegate to the reusable `build-app.yml` workflow with these profiles:

| Job | Platform | Profile | Artifact |
|---|---|---|---|
| `build-android` | android | `test` | `build-apk` / `recipedia-maestro.apk` |
| `build-android-performance` | android | `perf` | `build-apk-performance` / `recipedia-performance.apk` |
| `build-ios` | ios | `test` | `build-ios-app` / `Recipedia.app` |

The build-app workflow skips a fresh build if:
- No relevant files changed (paths filter on `src/**`, platform dirs, `app.json`, `eas.json`, `package.json`, etc.)
- The branch is not `main` and no release tag
- A cached artifact from a previous run on the same branch is available

On cache miss or `main`/tag push, it always builds fresh.

### e2e-tests-android / e2e-tests-ios

Delegates to the reusable `e2e-maestro.yml` workflow. Runs all suites in a parallel matrix (`fail-fast: false`):

```
app-init, bulk-import, duplicates-ingredient, duplicates-recipe, duplicates-tag,
ingredient-dialog, ingredients-db, menu, ocr, recipe-create, recipe-readonly,
recipe-edit, search, settings, shopping, tags-db, web, web-edge-cases
```

- Android: `ubuntu-latest`, API 34 Google APIs x86_64 emulator, KVM enabled, 4 GB RAM, 4 cores
- iOS: `macos-15`, iPhone SE 3rd generation simulator, iOS 18.6, Xcode 26.2, hardware keyboard disabled, animations reduced

Each suite uploads:
- `maestro-logs-{platform}-{suite}.zip` — Maestro step logs + app logs
- `junit-e2e-{platform}-{suite}` — JUnit XML report

### merge-test-artifacts

Runs `if: always()` after all E2E jobs. Merges per-suite JUnit reports with `jrm`, packages Maestro logs, deletes individual suite artifacts, re-uploads:
- `e2e-junit-merged` — merged JUnit XML
- `maestro-logs-android.zip`
- `maestro-logs-ios.zip`

### test-result-summary

Runs `if: always()` after `merge-test-artifacts`. Combines unit and E2E summaries into a single sticky PR comment.

---

## EAS build pipeline (`build-app.yml`)

The `build-app.yml` reusable workflow wraps EAS CLI local builds.

### Build profiles

Defined in `eas.json`:

| Profile | Purpose | Dataset |
|---|---|---|
| `test` | E2E / Maestro testing | default |
| `perf` | Flashlight + E2E performance testing | 150-recipe dataset (`EXPO_PUBLIC_DATASET_TYPE=performance`) |
| `prod` | App Store / Play Store release | production |

### Android setup

Uses `.github/actions/setup-android-build` composite action:
- Installs EAS CLI (`eas-version: '16.3.0'`)
- Authenticates with `EXPO_TOKEN`
- Sets up Android SDK

### iOS setup

Uses `.github/actions/setup-ios-build` composite action:
- Requires `macos-15` runner
- Selects Xcode 26.2 (`xcode-select -s /Applications/Xcode_26.2.app`)
- Installs EAS CLI, authenticates

### Artifact caching

When source files have not changed and the branch is not `main`, the workflow searches previous runs on the same branch for a matching artifact using `.github/scripts/find-cached-artifact.sh`. If found, the artifact is downloaded directly, skipping the build entirely. This significantly reduces CI time for documentation-only or test-only PRs.

---

## Performance workflow (`performance.yml`)

| Trigger | Condition |
|---|---|
| `schedule` (nightly 2 AM UTC) | Only runs if commits exist in the last 24 hours |
| `workflow_dispatch` | Always runs |
| PR with `perf-test` label | Always runs |

Jobs:
1. `build-performance-apk` — builds with `perf` profile
2. `flashlight-test` — runs 5 Flashlight iterations against `cases/performance/1_full_flow.yaml`, duration 120s each; uploads HTML report (30-day retention)

---

## Documentation workflow (`documentation.yml`)

Triggers on push to `main` when `src/**/*.ts`, `src/**/*.tsx`, `README.md`, `jsdoc.conf.json`, or the workflow file itself changes, plus `workflow_dispatch`.

1. Runs `npm run docs:build` (TypeDoc → `docs/`)
2. Deploys `docs/` to GitHub Pages

Live docs: [https://AntoC-dev.github.io/Recipedia/](https://AntoC-dev.github.io/Recipedia/)

---

## Release workflow (`release.yml`)

Triggers on push to `main` and `workflow_dispatch`. Runs `semantic-release` using `RELEASE_PAT` to create GitHub releases and bump `package.json` version.

---

## Publication workflow (`publication.yml`)

Triggers after the Build & Test Pipeline completes successfully on `main`, or via `workflow_dispatch`.

- Runs parallel matrix: `android` (`ubuntu-latest`) and `ios` (`macos-26`)
- Builds with `prod` profile via EAS CLI
- Submits to Play Store / App Store via `npm run submit:{platform}`
- Requires the `production` environment to be configured (manual approval gate recommended)

---

## Required secrets

| Secret | Used by | Purpose |
|---|---|---|
| `EXPO_TOKEN` | `build-app.yml`, `publication.yml`, `performance.yml` | EAS CLI authentication |
| `RELEASE_PAT` | `release.yml` | GitHub PAT for semantic-release to push tags/releases |
| `QUITOQUE_USERNAME` | `e2e-maestro.yml` | Quitoque bulk-import E2E test credentials |
| `QUITOQUE_PASSWORD` | `e2e-maestro.yml` | Quitoque bulk-import E2E test credentials |
| `GITHUB_TOKEN` | `quality.yml`, `build-test.yml` | Automatically provided; used for PR comments and coverage reports |

All secrets except `GITHUB_TOKEN` must be configured in the repository settings under **Settings > Secrets and variables > Actions**.

The `publication.yml` workflow uses a `production` GitHub environment — configure that environment with required reviewers to gate production deploys.

---

## Quality gates

The following checks block merging (required status checks):

| Check | Blocks merge |
|---|---|
| ESLint | Yes |
| Prettier formatting | Yes |
| TypeScript | Yes |
| Expo Doctor | Yes |
| Unit Tests & Coverage | Yes |
| Integration Tests | Yes |
| Build Android APK | Yes |
| Build iOS App | Yes |
| E2E Tests (all suites, both platforms) | Yes |
| Commit message validation | Yes (PR only) |

Non-blocking checks (informational):
- Coverage threshold (75% on changed files — posts comment but `fail_below_threshold: false`)
- Security audit — posts comment but does not block on `high`, only `critical`
- Reassure performance diff — informational PR comment

---

## Debugging CI failures

### Unit / integration test failures

1. Download the `unit-test-summary` or `integration-test-summary` artifact from the Actions run
2. Look for the failing test name in the JUnit XML
3. Reproduce locally: `npm run test:unit` or `npm run test:integration`
4. For coverage gaps: `npm run test:unit:coverage` then open `coverage/lcov-report/index.html`

### E2E test failures

1. Download `maestro-logs-android.zip` or `maestro-logs-ios.zip` from the run artifacts
2. For Android, open `android-app-logs.txt` for logcat output
3. For iOS, open `ios-app-logs.txt` for simulator logs
4. Each suite has its own subdirectory with Maestro step logs
5. Common causes: TestID changed in app, timing/animation race condition, OCR gallery ordering, simulator load (ANR)

The CI retry mechanism (`maxRetries: 2` in `ci/` wrappers) handles infrastructure flakiness automatically. If a test fails all retries, it is a real failure.

For a deeper E2E debugging guide see [tests/e2e/E2E_TESTING.md](../tests/e2e/E2E_TESTING.md#troubleshooting).

### Build failures

1. Download the `build-log-{platform}-{profile}` artifact
2. Look for EAS CLI errors (missing credentials, SDK version mismatch, native module compile error)
3. Verify `EXPO_TOKEN` is valid and has the correct permissions
4. For iOS: confirm Xcode 26.2 is available on the runner (selected via `xcode-select`)

### Quality failures

- **ESLint**: run `npm run lint:fix` locally, commit the fixes
- **Prettier**: run `npm run format` locally, commit the fixes
- **TypeScript**: run `npm run typecheck` locally and fix all errors
- **Expo Doctor**: run `npm run expo:doctor` locally; usually a dependency version mismatch
- **Commit messages**: all commits on the PR branch must follow Conventional Commits — use `feat(scope): description` format
- **Documentation**: run `npm run docs:build` locally; zero-warnings policy applies

### Cache invalidation

If node_modules cache causes issues, push a commit that changes `package-lock.json` (e.g. `npm install`) to bust the cache key.
