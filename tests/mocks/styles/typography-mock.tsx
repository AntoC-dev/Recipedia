export const mockUseFetchFonts = jest.fn();

export const EncodingSeparator = '__';
export const ALL_MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
export const ALL_MONTHS_ENCODED = ALL_MONTHS.join(EncodingSeparator);
export const textSeparator = '--';
export const unitySeparator = '@@';
export const noteSeparator = '%%';

export function typographyMock() {
  return {
    useFetchFonts: mockUseFetchFonts,
    EncodingSeparator,
    ALL_MONTHS,
    ALL_MONTHS_ENCODED,
    textSeparator,
    unitySeparator,
    noteSeparator,
  };
}
