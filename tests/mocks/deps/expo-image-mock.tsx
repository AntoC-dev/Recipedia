export const mockClearMemoryCache = jest.fn();
export const mockClearDiskCache = jest.fn();

export const Image = {
  clearMemoryCache: mockClearMemoryCache,
  clearDiskCache: mockClearDiskCache,
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
