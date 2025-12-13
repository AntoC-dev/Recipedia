# Performance Testing

Performance testing for Recipedia.

## CI Structure

The `build-test.yml` workflow has two parallel branches:

```
Build & Test Pipeline
├── Regular Tests
│   ├── Unit Tests & Coverage
│   ├── Build APK
│   └── E2E Tests (matrix)
│
└── Performance Tests
    ├── Reassure → Danger.js PR Comment
    └── Build Performance APK → E2E Tests → github-action-benchmark
```

## PR Comments

### Reassure (via Danger.js)

- Automatically posts render benchmark comparison on PRs
- Shows mean duration, render count, and regression status
- Uses official
  [Reassure + Danger.js integration](https://callstack.github.io/reassure/)

### E2E Performance (via github-action-benchmark)

- Tracks app-level metrics over time: startup, navigation, search, etc.
- Posts alert comment if performance degrades >150% compared to baseline
- Stores historical data in `gh-pages` branch (`dev/bench/`)
- See
  [github-action-benchmark](https://github.com/benchmark-action/github-action-benchmark)

## Quick Start

```bash
# Run Reassure render benchmarks
npm run test:perf

# Generate new baseline
npm run test:perf:baseline

# Build performance APK (150 recipes dataset)
npm run build:perf:android
```

## Reassure Tests

Measures React component render performance:

- Tests in `tests/perf/*.perf.tsx`
- Uses `measureRenders()` to capture render count and duration
- Compares against baseline stored in `.reassure/`

### Updating Baseline

```bash
npm run test:perf:baseline
git add .reassure/
```

## App-Level Performance

For E2E stress testing with 150 recipes:

- Dataset: `src/assets/datasets/performance/`
- Loaded when `EXPO_PUBLIC_DATASET_TYPE=performance`
- Instrumentation: `src/utils/PerformanceMetrics.ts`
- Metrics exported to logcat, extracted in CI

## Related Files

- `reassure.config.js` - Reassure configuration
- `tests/e2e/performance.yaml` - Maestro performance suite
- `src/utils/PerformanceMetrics.ts` - App instrumentation
- `src/screens/Parameters.tsx` - Export button (visible in perf builds)
