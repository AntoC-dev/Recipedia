import { Image } from 'react-native';

export const mockImageGetSize = (width = 3000, height = 4000) => {
  Image.getSize = jest.fn().mockResolvedValue({ width, height });
};
