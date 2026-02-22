export const mockImageRef = {
  width: 200,
  height: 200,
  saveAsync: jest.fn().mockResolvedValue({
    uri: 'file://mock-manipulated-image.jpg',
    width: 200,
    height: 200,
  }),
};

export const mockManipulatorContext = {
  crop: jest.fn().mockReturnThis(),
  resize: jest.fn().mockReturnThis(),
  renderAsync: jest.fn().mockResolvedValue(mockImageRef),
};

export const SaveFormat = { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' };

export const ImageManipulator = {
  manipulate: jest.fn().mockReturnValue(mockManipulatorContext),
};
