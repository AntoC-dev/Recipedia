import { isValidUrl, normalizeUrl } from '@utils/UrlHelpers';

describe('UrlHelpers', () => {
  describe('isValidUrl', () => {
    const validUrls = [
      'https://example.com',
      'http://example.com',
      'https://www.example.com/path/to/recipe',
      'https://example.com/recipe?id=123',
      'https://sub.domain.example.com',
      'example.com',
      'www.example.com/recipe',
    ];

    const invalidUrls = [
      '',
      '   ',
      'not a url',
      'ftp://example.com',
      '://missing-protocol.com',
      'not-a-valid-url',
      'localhost',
      'https://localhost',
    ];

    test.each(validUrls)('returns true for valid URL: %s', url => {
      expect(isValidUrl(url)).toBe(true);
    });

    test.each(invalidUrls)('returns false for invalid URL: %s', url => {
      expect(isValidUrl(url)).toBe(false);
    });

    test('trims whitespace before validation', () => {
      expect(isValidUrl('  https://example.com  ')).toBe(true);
    });
  });

  describe('normalizeUrl', () => {
    test('adds https:// to URL without protocol', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
    });

    test('adds https:// to URL with www but no protocol', () => {
      expect(normalizeUrl('www.example.com/recipe')).toBe('https://www.example.com/recipe');
    });

    test('preserves https:// protocol', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    test('preserves http:// protocol', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    test('trims whitespace', () => {
      expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
    });

    test('preserves path and query parameters', () => {
      expect(normalizeUrl('example.com/recipe?id=123')).toBe('https://example.com/recipe?id=123');
    });
  });
});
