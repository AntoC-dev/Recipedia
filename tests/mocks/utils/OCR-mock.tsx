export function ocrMock() {
  return {
    extractFieldFromImage: jest.fn().mockResolvedValue({ recipeImage: '/path/to/cropped/img' }),
    computeOcrFieldStatus: jest.fn().mockReturnValue('success'),
  };
}
