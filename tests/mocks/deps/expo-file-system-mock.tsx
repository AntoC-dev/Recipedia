export const mockFileExists = jest.fn().mockReturnValue(false);
export const mockFileDelete = jest.fn();
export const mockFileMove = jest.fn();
export const mockFileCopy = jest.fn();
export const mockFileCreate = jest.fn();
export const mockFileWrite = jest.fn();
export const mockFileText = jest.fn().mockResolvedValue('');
export const mockFileInfo = jest.fn().mockReturnValue({ exists: true, md5: null });
export const mockFileOpen = jest.fn().mockReturnValue({
  writeBytes: jest.fn(),
  close: jest.fn(),
  size: 0,
  offset: 0,
});
export const mockFileDownloadFileAsync = jest.fn();

export const mockDirectoryExists = jest.fn().mockReturnValue(false);
export const mockDirectoryDelete = jest.fn();
export const mockDirectoryCreate = jest.fn();
export const mockDirectoryList = jest.fn().mockReturnValue([]);

export const mockPathsInfo = jest.fn().mockReturnValue({ exists: false, isDirectory: null });

class MockFile {
  uri: string;
  constructor(...uris: (string | { uri: string })[]) {
    this.uri = uris
      .map(u => (typeof u === 'string' ? u : u.uri))
      .join('/')
      .replace(/\/+/g, '/')
      .replace(/\/$/, '');
  }
  get exists() {
    return mockFileExists(this.uri);
  }
  delete() {
    return mockFileDelete(this.uri);
  }
  move(dest: MockFile) {
    return mockFileMove(this.uri, dest);
  }
  copy(dest: MockFile) {
    return mockFileCopy(this.uri, dest);
  }
  create(opts?: object) {
    return mockFileCreate(this.uri, opts);
  }
  write(content: string | Uint8Array, opts?: object) {
    return mockFileWrite(this.uri, content, opts);
  }
  text() {
    return mockFileText(this.uri);
  }
  info(opts?: object) {
    return mockFileInfo(this.uri, opts);
  }
  open() {
    return mockFileOpen(this.uri);
  }
  static downloadFileAsync = mockFileDownloadFileAsync;
}

class MockDirectory {
  uri: string;
  constructor(...uris: (string | { uri: string })[]) {
    this.uri = uris
      .map(u => (typeof u === 'string' ? u : u.uri))
      .join('/')
      .replace(/\/+/g, '/');
    if (!this.uri.endsWith('/')) {
      this.uri += '/';
    }
  }
  get exists() {
    return mockDirectoryExists(this.uri);
  }
  delete() {
    return mockDirectoryDelete(this.uri);
  }
  create(opts?: object) {
    return mockDirectoryCreate(this.uri, opts);
  }
  list() {
    return mockDirectoryList(this.uri);
  }
}

const MockPaths = {
  get document() {
    return new MockDirectory('/documents');
  },
  get cache() {
    return new MockDirectory('/cache');
  },
  info: mockPathsInfo,
};

export function expoFileSystemMock() {
  return {
    File: MockFile,
    Directory: MockDirectory,
    Paths: MockPaths,
  };
}
