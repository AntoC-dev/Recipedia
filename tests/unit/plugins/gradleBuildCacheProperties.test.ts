import type { AndroidConfig } from '@expo/config-plugins';
import { enableGradleBuildCache } from '@app/plugins/gradleBuildCacheProperties';

type PropertiesItem = AndroidConfig.Properties.PropertiesItem;

const existingProperties: PropertiesItem[] = [
  { type: 'comment', value: 'org.gradle.caching' },
  { type: 'empty' },
  { type: 'property', key: 'org.gradle.parallel', value: 'true' },
];

const buildCacheEntry: PropertiesItem = {
  type: 'property',
  key: 'org.gradle.caching',
  value: 'true',
};

describe('enableGradleBuildCache', () => {
  it('appends the build cache property when absent', () => {
    expect(enableGradleBuildCache(existingProperties)).toEqual([
      ...existingProperties,
      buildCacheEntry,
    ]);
  });

  it('replaces a disabled build cache property', () => {
    const disabled: PropertiesItem[] = [
      { type: 'property', key: 'org.gradle.caching', value: 'false' },
      ...existingProperties,
    ];

    expect(enableGradleBuildCache(disabled)).toEqual([...existingProperties, buildCacheEntry]);
  });

  it('is idempotent', () => {
    const once = enableGradleBuildCache(existingProperties);

    expect(enableGradleBuildCache(once)).toEqual(once);
  });

  it('enables the build cache on an empty file', () => {
    expect(enableGradleBuildCache([])).toEqual([buildCacheEntry]);
  });
});
