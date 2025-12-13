/**
 * Reassure Configuration
 *
 * Configuration for @callstack/reassure performance testing.
 * Reassure measures React component render performance and detects regressions.
 *
 * Usage:
 * - npm run test:perf          - Run performance tests and compare against baseline
 * - npm run test:perf:baseline - Generate new baseline measurements
 *
 * @see https://callstack.github.io/reassure/
 */
module.exports = {
    testMatch: ['<rootDir>/tests/perf/**/*.perf.{js,jsx,ts,tsx}'],
};
