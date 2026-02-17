export const mockUseFetchFonts = jest.fn();

export function typographyMock() {
  return {
    useFetchFonts: mockUseFetchFonts,
  };
}
