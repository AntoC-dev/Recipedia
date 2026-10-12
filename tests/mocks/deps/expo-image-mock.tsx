export const mockClearMemoryCache = jest.fn();
export const mockClearDiskCache = jest.fn();

export const mockDecodedImageRef = {
  release: jest.fn(),
};

export const mockLoadAsync = jest.fn().mockResolvedValue(mockDecodedImageRef);

export const Image = {
  clearMemoryCache: mockClearMemoryCache,
  clearDiskCache: mockClearDiskCache,
  loadAsync: mockLoadAsync,
};

export type ImageLoadEventData = {
  cacheType: string;
  source: {
    url: string;
    width: number;
    height: number;
    mediaType: string;
    isAnimated: boolean;
  };
};

export type ImageErrorEventData = {
  error: string;
};
