import { Image } from 'react-native';

export const mockImageGetSize = (width = 3000, height = 4000) =>
  jest.spyOn(Image, 'getSize').mockResolvedValue({ width, height } as never);
