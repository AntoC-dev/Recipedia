export const mockUseFetchFonts = jest.fn();

export const ALL_MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
export const ALL_MONTHS_ENCODED = '1|2|3|4|5|6|7|8|9|10|11|12';

export function typographyMock() {
  return {
    useFetchFonts: mockUseFetchFonts,
    ALL_MONTHS,
    ALL_MONTHS_ENCODED,
  };
}
