const { configure } = require('reassure');
const { act, cleanup, render } = require('@testing-library/react-native');

const SETTLE_TICKS = 5;

const settle = () =>
  act(async () => {
    for (let tick = 0; tick < SETTLE_TICKS; tick += 1) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  });

configure({
  warmupRuns: 2,
  testingLibrary: {
    render: async ui => {
      const result = await render(ui);
      await settle();
      return result;
    },
    cleanup: async () => {
      await settle();
      await cleanup();
    },
  },
});
