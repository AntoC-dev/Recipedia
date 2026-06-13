# Testing Guide

Recipedia uses four complementary test layers. Each has a distinct scope, runner configuration, and set of rules.

---

## Testing philosophy

| Layer | Scope | Mock boundary |
|---|---|---|
| Unit | Single component or utility in isolation | External packages, native modules, React Native Paper (globally) |
| Integration | Cross-module pipeline end-to-end | Only irreducible native modules (e.g. `@react-native-ml-kit/text-recognition`) |
| E2E | Full user flows on a real app build | None — real device/simulator |
| Performance | React render benchmarks + device-level FPS/CPU/RAM | None |

The goal is 100% statement coverage for everything under `src/` (excluding translations, assets, and navigation boilerplate — see `jest.config.js` `collectCoverageFrom`).

---

## Directory structure

```
tests/
├── unit/            # Jest + RTL unit tests (mirrors src/ structure)
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── screens/
│   └── utils/
├── integration/     # Cross-module pipeline tests (real DB, real hooks)
│   ├── MenuAndShoppingPipeline.test.tsx
│   ├── OCRIngredientQuantityBinding.test.tsx
│   ├── RecipeFormIngredientsPipeline.test.tsx
│   ├── RecipeFormTagsPipeline.test.tsx
│   └── ValidationWorkflowRealDB.test.tsx
├── e2e/             # Maestro YAML test suites
│   └── E2E_TESTING.md   ← detailed E2E guide
├── perf/            # Reassure render benchmarks (*.perf.tsx)
├── mocks/           # All shared mocks (never inline mocks in test files)
│   ├── deps/        # Third-party dependency mocks
│   ├── components/
│   ├── hooks/
│   └── ...
├── helpers/         # Shared test utilities
├── data/            # Test fixtures and datasets
├── setup.js         # Global test setup
└── setup-community-mocks.js
```

---

## Running tests

### Unit tests

```bash
npm run test:unit                 # Run all unit tests (tests/unit/)
npm run test:unit:watch           # Watch mode during development
npm run test:unit:coverage        # Run with coverage report
```

Coverage output goes to `coverage/`. The CI threshold for changed files is 75% (cobertura check), with a project goal of 100%.

### Integration tests

```bash
npm run test:integration          # Run all integration tests (tests/integration/)
```

Integration tests run in the same Jest process as unit tests. They are separated by directory match in `jest.config.js`:

```js
testMatch: [
    '**/tests/unit/**/*.test.{js,jsx,ts,tsx}',
    '**/tests/integration/**/*.test.{js,jsx,ts,tsx}',
]
```

### E2E tests

```bash
# Build and run the full E2E suite on Android
npm run workflow:build-test:android

# Run a specific suite locally (from tests/e2e/)
cd tests/e2e
maestro test . --config=recipe-create.yaml

# Run a single test case
maestro test cases/settings/1_dark_mode.yaml
```

See [tests/e2e/E2E_TESTING.md](../tests/e2e/E2E_TESTING.md) for the complete E2E guide covering architecture, TestID conventions, reusable flows, OCR patterns, and troubleshooting.

### Performance tests

```bash
npm run test:perf                 # Run Reassure benchmarks, compare to baseline
npm run test:perf:baseline        # Record a new baseline (commit .reassure/)
npm run build:perf:android        # Build the 150-recipe performance APK
```

---

## Unit test conventions

### Framework

- Jest with `jest-expo` preset
- React Native Testing Library (RTL) for component tests
- Test files live under `tests/unit/` and mirror the `src/` tree

### Mocking rules

**Globally mocked packages** (active for all unit tests, configured in `jest.config.js` `moduleNameMapper`):
- `react-native-paper` — renders props via Text/Button, no real Paper components
- `@expo/vector-icons`
- `expo-font`
- `react-native-image-crop-picker`
- `react-native-copilot`
- `react-native-reanimated`
- `expo-clipboard`
- `react-native-webview`
- `expo-mail-composer`
- `expo-status-bar`
- `expo-image-manipulator`
- `@react-native-ml-kit/text-recognition`

**Suite-level mocks**: Place in `tests/mocks/` as a standalone file and import it in the test. Never write inline mocks inside test files.

**Do not mock** custom hooks, utility functions, `RecipeDatabase`, fuzzy index, or any internal app layer in unit tests unless there is an absolute reason. Use real implementations.

### Mock component conventions (CLAUDE.local.md)

When mocking a React component:
- Render all props
- Functional props: render in a `Button` where `onPress` calls the function
- Other props: render in a `Text` component

### Coverage

- Target 100% on `src/**` (excluding translations, assets, navigation, index files)
- Run `npm run test:unit:coverage` locally and check the `text` reporter output before pushing

---

## Integration test rules

Integration tests exercise real pipelines: real hooks, real fuzzy index, real `RecipeDatabase`, real form context.

**The only acceptable mock boundary** is a native module that cannot run in Node (e.g. `@react-native-ml-kit/text-recognition`).

Rules:
- Do not mock hooks
- Do not mock utility modules or database layers
- Do not mock `RecipeDatabase` or context providers
- Tests must set up and tear down their own DB state
- Each test file in `tests/integration/` represents a real cross-module scenario (e.g. OCR binding → ingredient quantity update, validation workflow with a real DB)

Integration tests run as a separate CI job (`Integration Tests`) parallel to the unit test job.

---

## Maestro E2E

E2E tests are YAML-based Maestro flows, organized into named suites. Each suite has a configuration file at `tests/e2e/{suite}.yaml` that controls test discovery and execution order.

Available suites: `app-init`, `bulk-import`, `duplicates-ingredient`, `duplicates-recipe`, `duplicates-tag`, `ingredient-dialog`, `ingredients-db`, `menu`, `ocr`, `recipe-create`, `recipe-edit`, `recipe-readonly`, `search`, `settings`, `shopping`, `tags-db`, `web`, `web-edge-cases`, `performance`.

CI runs every suite in a matrix job (fail-fast: false), on both Android (API 34) and iOS (iPhone SE 3rd gen, iOS 18.6). Each test case has a `ci/` wrapper that adds `retry: maxRetries: 2` for infrastructure flakiness without affecting local runs.

For full architecture, TestID conventions, OCR patterns, and troubleshooting see [tests/e2e/E2E_TESTING.md](../tests/e2e/E2E_TESTING.md).

---

## Performance tests

### Reassure (render benchmarks)

Reassure measures React component render count and duration.

- Test files: `tests/perf/*.perf.tsx`
- Configuration: `reassure.config.js` (10% regression/improvement threshold, matches `tests/perf/**/*.perf.{js,jsx,ts,tsx}`)
- Baseline stored in `.reassure/` (commit when intentionally changing)

On PRs, CI runs Reassure against the base branch to generate a diff, then posts a compact comparison comment via Danger.js.

```bash
# Update baseline after a deliberate performance change
npm run test:perf:baseline
git add .reassure/
```

### App-level performance (Flashlight + E2E)

The `performance` E2E suite loads the app with 150 real recipes (`EXPO_PUBLIC_DATASET_TYPE=performance`) and records FPS, CPU, and RAM via Flashlight.

- Dataset: `src/assets/datasets/performance/`
- Instrumentation: `src/utils/PerformanceMetrics.ts`
- Maestro suite: `tests/e2e/performance.yaml`
- Metrics are extracted from logcat in CI and tracked with `github-action-benchmark` (>150% degradation triggers an alert comment)

---

## CI test jobs

All test jobs are defined in `.github/workflows/build-test.yml` and `.github/workflows/performance.yml`.

| Job | Trigger | What it does |
|---|---|---|
| `unit-tests-and-coverage` | push/PR to main | `npm run test:unit:coverage`; uploads coverage artifact; posts per-file cobertura coverage on PRs |
| `integration-tests` | push/PR to main | `npm run test:integration`; uploads JUnit summary |
| `reassure-performance` | push/PR to main | Runs Reassure against base SHA; posts compact diff comment on PR |
| `e2e-tests-android` | after APK build | Runs all suites in parallel matrix on Android API 34 emulator |
| `e2e-tests-ios` | after iOS build | Runs all suites in parallel matrix on iOS simulator (macos-15) |
| `e2e-tests-android-performance` | after perf APK build | Runs `performance` suite only |
| `merge-test-artifacts` | always, after E2E | Merges per-suite JUnit reports and Maestro logs into single artifacts |
| `test-result-summary` | always, after merge | Posts combined unit + E2E test summary comment on PRs |
| Flashlight (`performance.yml`) | nightly 2 AM UTC, `workflow_dispatch`, PR with `perf-test` label | Builds perf APK, runs Flashlight 5 iterations, uploads HTML report |

Logs for failed E2E tests are available in the `maestro-logs-android.zip` / `maestro-logs-ios.zip` artifacts:
- Android: `android-app-logs.txt` (logcat)
- iOS: `ios-app-logs.txt` (`xcrun simctl spawn`)
