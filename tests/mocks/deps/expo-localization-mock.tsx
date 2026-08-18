const enUsLocale = {
  languageCode: 'en',
  languageTag: 'en-US',
  regionCode: 'US',
  currencyCode: 'USD',
  currencySymbol: '$',
  decimalSeparator: '.',
  digitGroupingSeparator: ',',
  textDirection: 'ltr',
};

const frFrLocale = {
  languageCode: 'fr',
  languageTag: 'fr-FR',
  regionCode: 'FR',
  currencyCode: 'EUR',
  currencySymbol: '€',
  decimalSeparator: ',',
  digitGroupingSeparator: ' ',
  textDirection: 'ltr',
};

export function expoLocalizationMock() {
  return {
    getLocales: jest.fn(() => [enUsLocale]),
    locale: 'en-US',
  };
}

export function useCommaDecimalRegion(localization: { getLocales: jest.Mock }) {
  localization.getLocales.mockReturnValue([frFrLocale]);
}

export function useDotDecimalRegion(localization: { getLocales: jest.Mock }) {
  localization.getLocales.mockReturnValue([enUsLocale]);
}
