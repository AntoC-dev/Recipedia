import { getDirectoryUri } from '@utils/FileGestion';

jest.unmock('@utils/FileGestion');
jest.mock('expo-constants', () => ({ expoConfig: null }));
jest.mock('expo-file-system', () =>
  require('@mocks/deps/expo-file-system-mock').expoFileSystemMock()
);
jest.mock('expo-asset', () => require('@mocks/deps/expo-asset-mock').expoAssetMock());
jest.mock('@app/package.json', () => require('@mocks/app/package-json-mock').packageJsonMock());
jest.mock('@utils/Constants', () => require('@mocks/utils/Constants-mock').constantsMock());
jest.mock('@utils/DatasetLoader', () => require('@mocks/utils/DatasetLoader-mock'));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));

describe('FileGestion with null expoConfig', () => {
  test('falls back to package.json name for directory URI', () => {
    expect(getDirectoryUri()).toBe('/documents/recipedia/');
  });
});
