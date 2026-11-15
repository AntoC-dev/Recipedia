import withAndroidLocaleFilters from '@app/plugins/withAndroidLocaleFilters';
import { expoConfigPluginsMock } from '@mocks/deps/expo-config-plugins-mock';
import * as configPlugins from '@expo/config-plugins';

jest.mock('@expo/config-plugins', () =>
  require('@mocks/deps/expo-config-plugins-mock').expoConfigPluginsMock({}, [], {
    language: 'groovy',
    contents: 'android {\n}\n',
  })
);

const applyPlugin = (options?: { locales: string[] }) =>
  withAndroidLocaleFilters({ name: 'Recipedia', slug: 'Recipedia' }, options) as unknown as {
    name: string;
    modResults: { contents: string };
  };

describe('withAndroidLocaleFilters', () => {
  it('filters the app build.gradle to en and fr by default and keeps the config', () => {
    const result = applyPlugin();

    expect(result.name).toBe('Recipedia');
    expect(result.modResults.contents).toContain('localeFilters.addAll(["en", "fr"])');
  });

  it('uses the locales passed as options', () => {
    expect(applyPlugin({ locales: ['de'] }).modResults.contents).toContain(
      'localeFilters.addAll(["de"])'
    );
  });

  it('throws on a Kotlin DSL build.gradle', () => {
    jest
      .mocked(configPlugins.withAppBuildGradle)
      .mockImplementationOnce(
        expoConfigPluginsMock({}, [], { language: 'kt', contents: 'android {\n}\n' })
          .withAppBuildGradle
      );

    expect(() => applyPlugin()).toThrow(
      'withAndroidLocaleFilters: cannot modify non-groovy build.gradle'
    );
  });
});
