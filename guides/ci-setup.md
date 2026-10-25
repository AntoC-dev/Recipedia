# CI Setup Guide

Recipedia runs all CI/CD on GitHub Actions. This guide explains what each workflow is for, how they connect, which secrets they need, and how to debug failures. For exact steps and flags, read the YAML in `.github/workflows/`.

## Workflows

| File | Name | Runs when |
|---|---|---|
| `quality.yml` | Code Quality | push / PR to `main` |
| `build-test.yml` | Build & Test Pipeline | push / PR to `main`, except docs-only changes (`**/*.md`, `guides/**`, `store-listing/**`, `.claude/**`, `.cursor/**`) |
| `build-app.yml` | Build App | reusable, called by `build-test.yml` |
| `e2e-maestro.yml` | E2E Maestro Tests | reusable, called by `build-test.yml` |
| `performance.yml` | Performance Tests (Flashlight) | weekly (Thursday 02:00 UTC, only if there were commits in the last 7 days) and `workflow_dispatch` |
| `documentation.yml` | Documentation | push to `main` touching `src/**/*.ts(x)`, `README.md` or `jsdoc.conf.json`; after a Performance run; `workflow_dispatch` |
| `release.yml` | Release | push to `main`, `workflow_dispatch` |
| `publication.yml` | Publication | after Build & Test Pipeline succeeds on `main`, `workflow_dispatch` |

Composite actions in `.github/actions/`: `setup-android-build`, `setup-ios-build`, `setup-chaquopy-python` (Python from `.python-version` for the recipe-scraper module), and `check-16kb-alignment` (verifies Android native library alignment on built APKs).

## Pipeline overview

```
quality.yml  (independent, runs in parallel with the pipeline below)

build-test.yml
  install-and-doctor
    ├── bundle-size, reassure-performance, unit-tests-and-coverage, integration-tests
    ├── build-android          ── e2e-tests-android ──┐
    │                              └── e2e-tests-android-performance (waits for the Android matrix)
    ├── build-ios              ── e2e-tests-ios ──────┤
    ├── build-android-production-maestro ── e2e smoke ┤
    ├── build-ios-production-maestro ────── e2e smoke ┤
    └── build-android-performance                     │
                                  merge-test-artifacts ── test-result-summary

on success on main:  publication.yml  (build prod + submit to the stores)
```

Pipeline behavior worth knowing:

- Runs are grouped per PR and a new push cancels the in-progress run. `main` runs are never cancelled because `publication.yml` depends on them. `main` re-runs the full pipeline on purpose: branch protection does not require up-to-date branches, so a merge can combine PRs that were never tested together.
- Fork PRs receive no secrets. They get a secret-free local build (see Builds), skip the performance and production-smoke builds, and run a reduced Android suite list (suites flagged `requiresSecrets` in `.github/e2e-suites.json` are dropped). iOS E2E and the PR comments are skipped for forks.
- Dependabot PRs skip all iOS, performance and production-smoke jobs.
- The `unit-tests-and-coverage` job posts a per-file coverage comment on PRs (75% minimum on changed files, informational only).

## Code Quality (`quality.yml`)

After a shared `install` job (caches `node_modules` by `package-lock.json` hash), these jobs run in parallel:

| Job | Command |
|---|---|
| Commit messages (PR only) | `commitlint` over the PR range, Conventional Commits |
| ESLint | `npm run lint` |
| Prettier | `npm run format:check` |
| TypeScript | `npm run typecheck` |
| Dead code | `npm run knip:check` |
| Expo Doctor | `npm run expo:doctor` |
| Security | npm audit, fails on `critical` only, comments on the PR |
| Documentation | `npm run docs:build`, zero TypeDoc warnings |

## Builds (`build-app.yml`)

Wraps `eas build --local` for both platforms via `npm run build:<profile>:<platform>`. Profiles come from `eas.json`:

| Pipeline profile | `eas.json` profile | Dataset | Used by |
|---|---|---|---|
| `test` | `maestro` | test | main E2E suites |
| `perf` | `performance` | performance | Android performance E2E, Flashlight |
| `production-maestro` | `production-maestro` | production | smoke suite on a release build |
| `prod` | `production` | production | store submission |

Setup differs per platform:

- **Android**: `setup-android-build` installs Java 17, ccache, the Android SDK, Gradle caching and EAS CLI. The caller adds `setup-chaquopy-python`. CI builds target `x86_64` only (the emulator), which halves native compile time; store builds keep every ABI.
- **iOS**: runs on `macos-26`. The Xcode selection (`/Applications/Xcode_26.4.1.app`, the minimum for Expo SDK 57) is a step in `build-app.yml` itself, not in the composite action. `setup-ios-build` only sets up Python, ccache, the global Expo cache and EAS CLI.

Without `EXPO_TOKEN` (fork PRs), the workflow skips EAS and builds locally instead (`gradlew assembleRelease` or `xcodebuild` for the simulator) with the test dataset env vars.

### App cache

Outside `main` and tags, the built app is cached under a key hashed from the build inputs (platform directory, `src/**`, `tests/data/**`, `plugins/**`, `modules/**`, `patches/**`, app/EAS/Metro/Babel/TS config, lockfile, `.python-version`). A hit skips the build. The key depends on content rather than commits, so amends, fixups and rebases that leave those files unchanged still hit. `main` and tags always build fresh.

### Artifacts

| Job | Artifact | File |
|---|---|---|
| `build-android` | `build-apk` | `recipedia-maestro.apk` |
| `build-android-performance` | `build-apk-performance` | `recipedia-performance.apk` |
| `build-android-production-maestro` | `build-apk-production-maestro` | `recipedia-production-maestro.apk` |
| `build-ios` | `build-ios-app` | `Recipedia.app.zip` |
| `build-ios-production-maestro` | `build-ios-app-production-maestro` | `Recipedia.app.zip` |

Each build also uploads `build-log-{platform}-{profile}` (7 days).

## E2E tests (`e2e-maestro.yml`)

The main E2E jobs run the suites of `.github/e2e-suites.json` in a `fail-fast: false` matrix built by `.github/scripts/e2e-matrix.mjs`:

- `long` suites are scheduled first, so a late start does not stretch the run.
- Suites sharing a `group` run one after another in a single job named `<suite>+<suite>`, saving the per-job device setup (~5–7 min on iOS). Only short suites are grouped: a GitHub re-run repeats the whole group.
- Job timeout: 240 min on iOS, 150 on Android; run step 200 / 120 min.

The main E2E jobs run the full suite list; the performance and production-smoke jobs run a single suite (`performance`, `smoke`). Maestro 2.8.0 is used on both platforms.

| | Android | iOS |
|---|---|---|
| Runner | `ubuntu-latest`, KVM enabled | `macos-26` |
| Device | API 34 Google APIs x86_64 emulator, Nexus 5 profile, 4 GB RAM, 4 cores | iPhone 17e, iOS 26.4 runtime |
| Toolchain | Android SDK | Xcode 26.4.1 |

iOS notes:

- Expo SDK 57 requires Xcode >= 26.4. The 26.4 runtime on the runner image no longer ships an iPhone 16e, so CI uses the iPhone 17e, which has the same screen and memory profile.
- The simulator is configured for determinism: hardware keyboard off, animations and transparency reduced (Liquid Glass flattened), keyboard autocorrect off, locale pinned to `en_US` (decimal separators follow the device region), status bar frozen at 9:41.
- `npm run boot:ios-simulator` boots the same simulator locally. It reads `model` and `os_version` from `e2e-maestro.yml`, so local runs track CI. Override with `IOS_VERSION` and `DEVICE_MODEL` env vars.
- `run-e2e-ios.sh` reruns failed flows in a fresh Maestro process when the XCTest driver latches as unreachable (mobile-dev-inc/maestro#3538).

Per-job outputs: `maestro-logs-{platform}-{job}.zip` and `junit-e2e-{platform}-{job}` (a grouped job holds one `{suite}/` folder and one `report-{suite}.xml` per suite). After all E2E jobs finish, `merge-test-artifacts` (runs `always()`) merges the JUnit reports, bundles the logs into `maestro-logs-android.zip` and `maestro-logs-ios.zip` plus `e2e-junit-merged`, scans them for credentials, and deletes the per-suite artifacts. `test-result-summary` then posts a single sticky PR comment combining unit and E2E results.

For writing and debugging flows, see [tests/e2e/E2E_TESTING.md](../tests/e2e/E2E_TESTING.md#troubleshooting).

## Performance

Three layers, with different strictness:

- **Reassure** (`reassure-performance` job, PRs only): runs render benchmarks on the base SHA and the PR SHA, posts a compact diff comment, and then hard-gates via `check-reassure-regression.mjs` (render-count increases, or duration regressions over 15%).
- **Bundle size** (`bundle-size` job): exports the production bundle and fails if it exceeds the budget in `tests/perf/bundle-size-budget.json`.
- **Flashlight** (`performance.yml`): builds the `perf` APK, then profiles each screen flow sequentially on one emulator. Scheduled runs publish a screen-FPS trend to the `perf-data` branch (charts are merged into the docs site under `/perf/`) and comment on regressions, but never fail the build, because single-run emulator FPS is too noisy to gate on. Reports are kept 30 days.

## Documentation, release, publication

- **Documentation**: `npm run docs:build` (TypeDoc into `docs/`), merges the perf charts, and deploys to GitHub Pages: [https://AntoC-dev.github.io/Recipedia/](https://AntoC-dev.github.io/Recipedia/).
- **Release**: runs `semantic-release` with `RELEASE_PAT` to create GitHub releases and bump the version.
- **Publication**: matrix of `android` (`ubuntu-latest`) and `ios` (`macos-26`). Builds with `npm run build:prod:<platform>`, then submits with `npm run submit:<platform>` (iOS also installs Fastlane). The job uses the `production` GitHub environment; configure required reviewers there to gate production deploys.

## Secrets

| Secret | Used by | Purpose |
|---|---|---|
| `EXPO_TOKEN` | `build-app.yml`, `publication.yml`, `performance.yml` | EAS CLI authentication (absent on fork PRs, which triggers the local-build fallback) |
| `RELEASE_PAT` | `release.yml` | semantic-release pushes tags and releases |
| `QUITOQUE_USERNAME`, `QUITOQUE_PASSWORD` | `e2e-maestro.yml` | Credentials for the `web` suite only |
| `GITHUB_TOKEN` | most workflows | Provided automatically (PR comments, coverage) |

Set the others under **Settings > Secrets and variables > Actions**.

### Keeping credentials out of E2E artifacts

Maestro writes every `-e` variable into its debug output, and GitHub's secret masking does not apply to files inside artifacts. Four layers keep credentials out:

1. `.github/scripts/e2e-credentials.sh` lists the credential env vars and the suites allowed to receive them (`E2E_CREDENTIAL_SUITES`). The runner scripts pass `-e` only for those suites. It also derives the raw, percent-encoded and JSON-escaped forms of each value.
2. Flow steps that consume a secret carry an explicit `label:`, so Maestro logs the label instead of the resolved value.
3. `prepare-maestro-logs.sh` deletes the `commands*.json` dumps and runs `redact-maestro-secrets.sh` over the rest, including `report.xml`.
4. `check-artifact-secrets.sh` re-scans each suite's output (and again the merged bundles); a hit fails the job and skips the uploads.

To add a flow that consumes a new secret, add it to both lists in `e2e-credentials.sh` and give the step that types it a `label:`.

## Merge gating

Quality jobs, unit and integration tests, builds, E2E suites and commit validation are intended to block merging; the exact required set is configured in the repository's branch protection, not in the workflows. Informational only: coverage comment (`fail_below_threshold: false`), the security audit below `critical`, and the Flashlight trend. The Reassure and bundle-size gates fail their jobs.

## Debugging CI failures

**Unit / integration tests**: download `unit-test-summary` or `integration-test-summary`, find the failing test, and reproduce with `npm run test:unit` or `npm run test:integration`. For coverage gaps, run `npm run test:unit:coverage` and open `coverage/lcov-report/index.html`.

**E2E tests**: download `maestro-logs-android.zip` or `maestro-logs-ios.zip`.

- Each suite has its own subdirectory with Maestro step logs.
- `recipedia-app-logs.txt` only holds the last app launch, because `clearState` wipes the in-app log file on every launch. For each launch, open `app-logs/launch-NN-pid<pid>.txt`. These are the app's own `[RecipediaApp]` log lines, mirrored to logcat or the simulator syslog in non-production builds.
- Common causes: changed testID, timing or animation race, OCR gallery ordering, simulator load (ANR).
- Every `ci/` wrapper retries its case up to twice (`retry: maxRetries: 2`), so a red suite failed three times in a row: treat it as a real failure, not infrastructure flake.

**Build failures**: download `build-log-{platform}-{profile}` and look for EAS errors (credentials, SDK mismatch, native compile). Check that `EXPO_TOKEN` is valid. For iOS, confirm `/Applications/Xcode_26.4.1.app` still exists on the `macos-26` image.

**Quality failures**: run the matching command locally (`npm run lint:fix`, `npm run format`, `npm run typecheck`, `npm run expo:doctor`, `npm run docs:build`). Commit messages must follow Conventional Commits, e.g. `feat(scope): description`.

**Stale `node_modules` cache**: push a commit that changes `package-lock.json` to change the cache key.
