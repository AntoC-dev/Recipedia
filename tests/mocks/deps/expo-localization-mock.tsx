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

const arEgLocale = {
  languageCode: 'ar',
  languageTag: 'ar-EG',
  regionCode: 'EG',
  currencyCode: 'EGP',
  currencySymbol: 'E£',
  decimalSeparator: '٫',
  digitGroupingSeparator: '٬',
  textDirection: 'rtl',
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

export function useArabicDecimalRegion(localization: { getLocales: jest.Mock }) {
  localization.getLocales.mockReturnValue([arEgLocale]);
}
