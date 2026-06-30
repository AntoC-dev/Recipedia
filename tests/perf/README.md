# Performance Testing

Performance regression detection for Recipedia, across several layers.

## Layers

| Layer             | Tool                   | What it catches                                       | Where                                  |
| ----------------- | ---------------------- | ----------------------------------------------------- | -------------------------------------- |
| Render benchmarks | Reassure               | JS render count / duration regressions, per component | `build-test.yml`, every PR             |
| Flow smoke        | Maestro (no profiling) | perf flows still execute at power-user scale          | `build-test.yml`, every PR (after E2E) |
| Real-device perf  | Flashlight + Maestro   | FPS / CPU / RAM / jank, per screen                    | `performance.yml`, weekly + on demand  |
| Bundle size       | `expo export` + budget | JS bundle growth (start time / download)              | `build-test.yml`, every PR             |

There is intentionally **no runtime RUM / user analytics** (Sentry Performance,
Firebase, Datadog) — it conflicts with the app's offline / no-data-collection
promise. Crash reporting is tracked separately in issue #372 (opt-in,
crash-only, self-hosted if ever adopted).

## Power-user dataset

The `performance` dataset simulates a power user and is loaded when
`EXPO_PUBLIC_DATASET_TYPE=performance`:

- **~1200 recipes**, **~1000 ingredients**, **~300 tags**
- Source: `src/assets/datasets/performance/` (`generate.ts` deterministically
  builds the bulk; curated E2E anchors like `Parmesan` / `Breakfast` /
  `Spaghetti Bolognese` are preserved at the front)
- Extra ingredients/tags beyond what recipes reference are intentional — they
  stress the Parameters / Ingredients / Tags / filter-accordion screens at scale

## Layer 1 — Reassure (every PR, hard-gated)

Measures React render performance and compares PR head against the base-branch
baseline.

- Tests: `tests/perf/*.perf.tsx`, via `measureRenders()`
- CI: `build-test.yml` → `reassure-performance` job posts a sticky PR comment,
  then **`check-reassure-regression.mjs` blocks merge** on any significant
  render-count regression or duration regression > 15%
- Config: `reassure.config.js`

```bash
npm run test:perf            # compare against baseline
npm run test:perf:baseline   # regenerate baseline
```

## Layer 2 — Flashlight per-screen (weekly + on demand)

Each screen is measured in its **own** Flashlight run so a regression points to
a specific screen instead of one averaged blob.

- Cases: `tests/e2e/cases/performance/screens/*.yaml` (run in filename order)
  - `00_seed` — cold start + DB seeding cost (clears state, seeds the dataset)
  - `01_app_start` — warm time-to-interactive of a returning user
  - `02_home` … `06_parameters` — per-screen interaction flows on the warm,
    seeded DB
- Network-dependent stress (not FPS-gated, excluded from the PR smoke):
  `tests/e2e/cases/performance/network/` (`bulk_import.yaml` imports 100 recipes
  from HelloFresh)
- Metric: **mean UI FPS** (what `flashlight test` actually writes — it emits no
  "score"), per screen, vs `tests/e2e/performance-budgets.json` +
  `check-perf-budget.mjs`.
- Failure model (deliberately asymmetric):
  - a **missing result** (flow produced no output) is a **hard failure** — the
    flow broke
  - an FPS drop below `minFps` or `>regressionTolerancePct` below `referenceFps`
    is a **warning only** — single-run device FPS is too noisy to hard-gate on;
    the deterministic hard gate is Reassure
  - FPS is **collect-only until calibrated** (`FLASHLIGHT_CALIBRATE=1`)
- CI runs the same per-screen cases in two places:
  - **Per PR — smoke (blocking):** `build-test.yml` →
    `e2e-tests-android-performance` runs the `performance` suite
    (`tests/e2e/performance.yaml` → `cases/performance/screens/*`) with **plain
    Maestro, no Flashlight**. It only proves the flows still execute. Ordered
    **after the Android E2E matrix** (`needs: e2e-tests-android` +
    `if: always()`) so it doesn't steal runners and still runs even if an E2E
    suite flaked. A flow that fails after its retry **blocks the merge**.
  - **Weekly + manual — FPS profiling:** `performance.yml` (Thursday 02:00 UTC —
    Monday avoided for Dependabot) runs Flashlight (3 iterations to average out
    noise), reports per-screen FPS, warns on regressions, hard-fails only on a
    broken flow. Single emulator, screens **sequential** (seed once via
    `00_seed`, warm screens reuse it — not parallelised). Each screen writes its
    **own separate report** (`perf-reports/<screen>.html`); the gate writes a
    merged FPS table to the Actions run summary.

Calibrate reference FPS once on a known-good run:

```bash
FLASHLIGHT_CALIBRATE=1 node .github/scripts/check-perf-budget.mjs perf-results
```

## Layer 3 — Bundle size (every PR)

- `build-test.yml` → `bundle-size` job runs `expo export` and
  `.github/scripts/check-bundle-size.mjs`
- Budget: `tests/perf/bundle-size-budget.json` (hard `maxBytes` ceiling + growth
  warning vs calibrated `referenceBytes`)

```bash
BUNDLE_CALIBRATE=1 node .github/scripts/check-bundle-size.mjs dist-bundle
```

## CI gate scripts

The three gate scripts under `.github/scripts/` are unit-tested:

```bash
npm run test:scripts   # node --test .github/scripts/*.test.mjs
```

## Related files

- `reassure.config.js` — Reassure thresholds
- `tests/e2e/cases/performance/screens/` — per-screen cases (PR smoke +
  Flashlight)
- `tests/e2e/performance.yaml` — Maestro suite config driving the PR smoke; its
  `flowsOrder` names must match each screen case's `name:` field
- `tests/e2e/flows/performance/` — reusable per-screen Maestro flows
- `tests/e2e/performance-budgets.json` — Flashlight per-screen budgets
- `tests/perf/bundle-size-budget.json` — JS bundle budget
- `src/assets/datasets/performance/` — power-user seed dataset + generator
