export function imagePickerMock() {
  return {
    pickImage: jest.fn().mockResolvedValue('/path/to/picked/img'),
    cropImage: jest.fn().mockResolvedValue('/path/to/cropped/img'),
    takePhoto: jest.fn().mockResolvedValue('/path/to/photo'),
  };
}
