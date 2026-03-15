export function expoFileSystemMock() {
  return {
    documentDirectory: '/documents/',
    cacheDirectory: '/cache/',
    getInfoAsync: jest.fn(),
    makeDirectoryAsync: jest.fn(),
    readDirectoryAsync: jest.fn(),
    copyAsync: jest.fn(),
    moveAsync: jest.fn(),
    deleteAsync: jest.fn(),
    writeAsStringAsync: jest.fn(),
    readAsStringAsync: jest.fn(),
  };
}
