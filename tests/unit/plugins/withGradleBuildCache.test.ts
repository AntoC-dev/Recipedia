import type { AndroidConfig } from '@expo/config-plugins';
import withGradleBuildCache from '@app/plugins/withGradleBuildCache';

type PropertiesItem = AndroidConfig.Properties.PropertiesItem;

const gradleProperties: PropertiesItem[] = [
  { type: 'property', key: 'org.gradle.parallel', value: 'true' },
];

jest.mock('@expo/config-plugins', () =>
  require('@mocks/deps/expo-config-plugins-mock').expoConfigPluginsMock({}, gradleProperties)
);

describe('withGradleBuildCache', () => {
  it('enables the build cache in gradle.properties and keeps the config', () => {
    const result = withGradleBuildCache({
      name: 'Recipedia',
      slug: 'Recipedia',
    }) as unknown as { name: string; modResults: PropertiesItem[] };

    expect(result.name).toBe('Recipedia');
    expect(result.modResults).toEqual([
      ...gradleProperties,
      { type: 'property', key: 'org.gradle.caching', value: 'true' },
    ]);
  });
});
