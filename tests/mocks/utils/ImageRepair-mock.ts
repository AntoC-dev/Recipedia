export const mockRepairMissingRecipeImages = jest.fn().mockResolvedValue(undefined);

export function imageRepairMock() {
  return {
    repairMissingRecipeImages: mockRepairMissingRecipeImages,
  };
}
