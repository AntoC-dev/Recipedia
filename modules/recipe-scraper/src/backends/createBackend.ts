import { Platform } from 'react-native';
import type { ScraperBackend } from './ScraperBackend';

/**
 * Selects the scraping backend for the current runtime. This is the single
 * place platform is branched on; backends are lazily required so that, for
 * example, the iOS Pyodide bridge is never loaded on Android. In tests
 * (`NODE_ENV === 'test'`) the schema.org backend is used so suites run without
 * native modules.
 */
export function createBackend(): ScraperBackend {
  const isTestEnv = process.env.NODE_ENV === 'test';

  if (!isTestEnv && Platform.OS === 'android') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return new (require('./ChaquopyBackend').ChaquopyBackend)();
  }

  if (!isTestEnv && Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return new (require('./PyodideBackend').PyodideBackend)();
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return new (require('./SchemaBackend').SchemaBackend)();
}
