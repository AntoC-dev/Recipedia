type ModAction<T> = (config: T & { modResults: unknown }) => T & { modResults: unknown };

export function expoConfigPluginsMock(androidManifest: unknown) {
  return {
    withAndroidManifest: jest.fn(<T extends object>(config: T, action: ModAction<T>) =>
      action({ ...config, modResults: androidManifest })
    ),
  };
}
