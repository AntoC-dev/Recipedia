# Testing Guide

Recipedia has four test layers. This guide covers the commands and the rules for unit and integration tests; E2E, performance and CI have dedicated documents linked below.

| Layer | Location | Runner | Mock boundary |
|---|---|---|---|
| Unit | `tests/unit/` (mirrors `src/`) | Jest + React Native Testing Library | External packages and native modules |
| Integration | `tests/integration/` | Jest | Only native modules that cannot run in Node |
| E2E | `tests/e2e/` | Maestro | None (real build on a device/simulator) |
| Performance | `tests/perf/` + the `performance` E2E suite | Reassure, Flashlight | None |

Supporting directories: `tests/mocks/` (all shared mocks), `tests/helpers/` (test utilities), `tests/data/` (fixtures and datasets), `tests/setup.js` and `tests/setup-community-mocks.js` (global setup).

The goal is 100% statement coverage of `src/`. `collectCoverageFrom` in `jest.config.js` excludes translations, assets, navigation, `index` files, type declarations and `App.tsx`.

---

## Commands

```bash
npm test                      # unit + integration
npm run test:unit             # tests/unit
npm run test:unit:watch       # watch mode
npm run test:unit:coverage    # coverage report in coverage/ (text, lcov, cobertura) + JUnit
npm run test:unit:fail-only   # rerun only previously failing tests
npm run test:integration      # tests/integration
npm run test:perf             # Reassure benchmarks vs. baseline
npm run test:perf:baseline    # record a new Reassure baseline
npm run test:scripts          # tests for .github/scripts/*.mjs
```

Unit and integration tests share one Jest config (`jest.config.js`) and differ only by directory. To target a subset, pass Jest arguments through `npx jest`:

```bash
npx jest tests/unit/utils/RecipeDatabase.test.ts   # one file
npx jest tests/unit/utils/                         # one directory
npx jest -t "should add recipe"                    # by test name
```

---

## Unit tests

- Files live under `tests/unit/` and mirror the `src/` tree.
- Do not mock custom hooks, utilities, `RecipeDatabase` or the fuzzy index unless there is no alternative; use the real implementations.
- Never write mocks inline in a test file. Put them in `tests/mocks/` and import them from the suite.
- Some packages are mocked for every test through `moduleNameMapper` in `jest.config.js` (for example `react-native-paper`, `react-native-reanimated`, `react-native-copilot`, `expo-font`, `@expo/vector-icons`, `@react-native-ml-kit/text-recognition`). Check that file for the current list before adding a mock; the mock implementations are in `tests/mocks/deps/`.
- A mocked React component renders all of its props: functional props inside a `Button` whose `onPress` calls the function, other props inside a `Text`.
- Check the coverage output of `npm run test:unit:coverage` before pushing.

## Integration tests

Integration tests run real pipelines: real hooks, the real `RecipeDatabase` on `node:sqlite`, the real fuzzy index and real form context.

- The only acceptable mocks are irreducible native boundaries such as `@react-native-ml-kit/text-recognition`.
- Never mock hooks, utilities, the database layer or context providers.
- Each test sets up and tears down its own database state.
- Each file covers one cross-module scenario (for example OCR binding to ingredient quantities, or the validation workflow against a real DB).

---

## E2E tests (Maestro)

Suites are configured in `tests/e2e/{suite}.yaml` and list the cases under `tests/e2e/cases/{feature}/ci/`. Basic usage, from `tests/e2e/`:

```bash
maestro test . --config=settings.yaml                 # one suite
maestro test cases/settings/1_dark_mode.yaml          # one case, no retry
```

Build and install a test app first with the scripts in the [installation guide](installation.md#local-test-builds); `npm run workflow:build-test:ios` chains build, simulator boot and install for iOS. Android CI runs on an API 34 emulator and iOS on an iPhone 17e with the iOS 26.4 runtime.

Suite list, TestID conventions, CI retry wrappers, OCR, locale and keyboard handling, and troubleshooting are in [tests/e2e/E2E_TESTING.md](../tests/e2e/E2E_TESTING.md).

---

## Performance tests

**Reassure** measures component render count and duration.

- Tests: `tests/perf/*.perf.tsx`, config in `reassure.config.js` (10% regression and improvement threshold).
- `.reassure/` is gitignored. Run `npm run test:perf:baseline` on the base commit, then `npm run test:perf` on your change to compare locally. CI does this automatically for PRs.

**Flashlight** records FPS, CPU and RAM on Android with the `performance` E2E suite. It runs against a power-user dataset (~1200 recipes, ~1000 ingredients, ~300 tags) selected with `EXPO_PUBLIC_DATASET_TYPE=performance` and built with `npm run build:perf:android`.

Dataset details and the Reassure workflow are in [tests/perf/README.md](../tests/perf/README.md); `src/utils/PerformanceMetrics.ts` holds the instrumentation.

---

## CI

Which workflow runs which test job, coverage gates, artifacts and debugging are covered in [ci-setup.md](ci-setup.md).
