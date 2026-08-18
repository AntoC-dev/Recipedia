import * as Localization from 'expo-localization';
import {
  deviceDecimalSeparator,
  formatDecimalForDisplay,
  formatDecimalForStorage,
  storageDecimalSeparator,
} from '@utils/NumberFormat';

jest.mock('expo-localization', () => ({ getLocales: jest.fn() }));

const mockedGetLocales = Localization.getLocales as jest.Mock;

const setRegionSeparator = (separator: string | null) => {
  mockedGetLocales.mockReturnValue([{ decimalSeparator: separator }]);
};

describe('deviceDecimalSeparator', () => {
  test('uses the separator reported by the device region', () => {
    setRegionSeparator(',');
    expect(deviceDecimalSeparator()).toBe(',');
  });

  test('falls back to a dot when the region reports none', () => {
    setRegionSeparator(null);
    expect(deviceDecimalSeparator()).toBe('.');
  });

  test('falls back to a dot when no locale is available', () => {
    mockedGetLocales.mockReturnValue([]);
    expect(deviceDecimalSeparator()).toBe('.');
  });
});

describe('formatDecimalForDisplay', () => {
  test('renders a comma in a comma region', () => {
    setRegionSeparator(',');
    expect(formatDecimalForDisplay(8.53, 2)).toBe('8,53');
  });

  test('renders a dot in a dot region', () => {
    setRegionSeparator('.');
    expect(formatDecimalForDisplay(8.53, 2)).toBe('8.53');
  });

  test('formats an integer with no separator', () => {
    setRegionSeparator(',');
    expect(formatDecimalForDisplay(200, 2)).toBe('200');
  });

  test('rounds to the requested precision', () => {
    setRegionSeparator('.');
    expect(formatDecimalForDisplay(133.3366, 2)).toBe('133.34');
  });

  test('drops trailing zeros produced by rounding', () => {
    setRegionSeparator('.');
    expect(formatDecimalForDisplay(2.0001, 2)).toBe('2');
  });

  test('formats a negative value', () => {
    setRegionSeparator('.');
    expect(formatDecimalForDisplay(-5.5, 2)).toBe('-5.5');
  });

  test('renders a value rounding down to zero without a negative sign', () => {
    setRegionSeparator('.');
    expect(formatDecimalForDisplay(-0.001, 2)).toBe('0');
  });

  test('returns NaN unchanged as a string', () => {
    setRegionSeparator(',');
    expect(formatDecimalForDisplay(NaN, 2)).toBe('NaN');
  });

  test('returns Infinity unchanged as a string', () => {
    setRegionSeparator(',');
    expect(formatDecimalForDisplay(Infinity, 2)).toBe('Infinity');
  });
});

describe('formatDecimalForStorage', () => {
  test('exposes a comma as the canonical storage separator', () => {
    expect(storageDecimalSeparator).toBe(',');
  });

  test('uses a comma regardless of a dot device region', () => {
    setRegionSeparator('.');
    expect(formatDecimalForStorage(0.75, 2)).toBe('0,75');
  });

  test('uses a comma in a comma device region', () => {
    setRegionSeparator(',');
    expect(formatDecimalForStorage(0.75, 2)).toBe('0,75');
  });

  test('keeps four decimals for chained scaling precision', () => {
    setRegionSeparator('.');
    expect(formatDecimalForStorage(133.33333333, 4)).toBe('133,3333');
  });

  test('formats an integer with no separator', () => {
    setRegionSeparator('.');
    expect(formatDecimalForStorage(200, 2)).toBe('200');
  });

  test('rounds to a whole number when maxDecimals is zero', () => {
    setRegionSeparator('.');
    expect(formatDecimalForStorage(2.6, 0)).toBe('3');
  });

  test('returns NaN unchanged as a string', () => {
    expect(formatDecimalForStorage(NaN, 2)).toBe('NaN');
  });
});
