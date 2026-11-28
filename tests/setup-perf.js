const { configure } = require('reassure');
const { cleanup, render } = require('@testing-library/react-native');
const { installPerfTimers, settle, uninstallPerfTimers } = require('./perf/settle');

const PERF_TEST_TIMEOUT_MS = 120000;

jest.setTimeout(PERF_TEST_TIMEOUT_MS);

afterEach(uninstallPerfTimers);

configure({
  warmupRuns: 2,
  testingLibrary: {
    render: async ui => {
      installPerfTimers();
      const result = await render(ui);
      await settle();
      return result;
    },
    cleanup: async () => {
      await cleanup();
      uninstallPerfTimers();
    },
  },
});
