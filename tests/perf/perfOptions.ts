/**
 * Extra warmup runs for CPU-heavy perf scenarios (fuzzy search, large-list
 * filters, batch card rendering, OCR). Spread into a `measureRenders` options
 * object *after* `runs` so it only adds warmup without touching the run count:
 * `measureRenders(<W />, { runs: 10, ...HEAVY_WARMUP, scenario })`.
 *
 * Warmup renders discard cold-path timings (JIT priming, lazy fuzzy-index build,
 * V8 inline-cache warmup) so early-run variance stops inflating the measured
 * stdev and slackening the CI-lower-bound regression gate. Opt in per heavy
 * scenario only: add this when a scenario's measured mean exceeds ~50ms, and
 * leave lighter scenarios on reassure's default `warmupRuns: 1` — warming a
 * stable sub-50ms render costs CI time for no variance it needs discounting.
 */
export const HEAVY_WARMUP = { warmupRuns: 3 };
