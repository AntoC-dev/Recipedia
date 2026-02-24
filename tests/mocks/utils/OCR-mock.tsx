export function ocrMock() {
  return {
    extractFieldFromImage: jest.fn().mockResolvedValue({ recipeImage: '/path/to/cropped/img' }),
  };
}
