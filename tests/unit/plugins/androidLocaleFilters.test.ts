import { addAndroidLocaleFilters } from '@app/plugins/androidLocaleFilters';

const appBuildGradle = `apply plugin: "com.android.application"

android {
    namespace "com.recipedia"
    defaultConfig {
        applicationId "com.recipedia"
    }
}
`;

const localeFiltersBlock = (locales: string) => `    androidResources {
        localeFilters.addAll([${locales}])
    }`;

describe('addAndroidLocaleFilters', () => {
  it('adds a tagged androidResources localeFilters block at the top of the android block only', () => {
    const lines = addAndroidLocaleFilters(appBuildGradle, ['en', 'fr']).split('\n');

    expect(lines.slice(0, 3)).toEqual(appBuildGradle.split('\n').slice(0, 3));
    expect(lines[3]).toMatch(/^\/\/ @generated begin recipedia-locale-filters/);
    expect(lines.slice(4, 7).join('\n')).toBe(localeFiltersBlock('"en", "fr"'));
    expect(lines[7]).toBe('// @generated end recipedia-locale-filters');
    expect(lines.slice(8)).toEqual(appBuildGradle.split('\n').slice(3));
  });

  it('is idempotent', () => {
    const once = addAndroidLocaleFilters(appBuildGradle, ['en', 'fr']);

    expect(addAndroidLocaleFilters(once, ['en', 'fr'])).toBe(once);
  });

  it('replaces the generated block when the locales change', () => {
    const withEnglishOnly = addAndroidLocaleFilters(
      addAndroidLocaleFilters(appBuildGradle, ['en', 'fr']),
      ['en']
    );

    expect(withEnglishOnly).toContain(localeFiltersBlock('"en"'));
    expect(withEnglishOnly.match(/localeFilters/g)).toHaveLength(1);
  });

  it.each([
    ['missing', 'apply plugin: "com.android.application"\n'],
    ['only nested', 'plugins {\n    android {\n    }\n}\n'],
  ])('throws when the top-level android block is %s', (_case, buildGradle) => {
    expect(() => addAndroidLocaleFilters(buildGradle, ['en'])).toThrow(/Failed to match/);
  });
});
