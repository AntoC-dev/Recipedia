import { extractImageFromJsonLd, fetchHtml, isValidUrl, normalizeUrl } from '@utils/UrlHelpers';
import { mockFetch } from '@mocks/deps/fetch-mock';

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

  describe('fetchHtml', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('returns HTML content on successful fetch', async () => {
      const testHtml = '<html><body>Test content</body></html>';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(testHtml),
      });

      const result = await fetchHtml('https://example.com/recipe');

      expect(result).toBe(testHtml);
    });

    test('sends proper headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html></html>'),
      });

      await fetchHtml('https://example.com/recipe');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/recipe', {
        signal: expect.any(AbortSignal),
        headers: {
          'User-Agent': expect.stringContaining('RecipediaApp'),
          Accept: expect.stringContaining('text/html'),
          'Accept-Language': expect.stringContaining('fr-FR'),
        },
      });
    });

    test('throws on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(fetchHtml('https://example.com/recipe')).rejects.toThrow('HTTP 404');
    });

    test('throws on server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetchHtml('https://example.com/recipe')).rejects.toThrow('HTTP 500');
    });

    test('respects abort signal', async () => {
      const controller = new AbortController();
      controller.abort();

      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

      await expect(fetchHtml('https://example.com/recipe', controller.signal)).rejects.toThrow();
    });
  });

  describe('extractImageFromJsonLd', () => {
    test('extracts image URL from simple Recipe JSON-LD', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            {"@type": "Recipe", "name": "Test", "image": "https://example.com/image.jpg"}
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBe('https://example.com/image.jpg');
    });

    test('extracts from @graph format with Recipe in array', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            {"@graph": [{"@type": "WebPage"}, {"@type": "Recipe", "image": "https://example.com/graph-image.jpg"}]}
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBe('https://example.com/graph-image.jpg');
    });

    test('extracts first URL from image array', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            {"@type": "Recipe", "image": ["https://example.com/first.jpg", "https://example.com/second.jpg"]}
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBe('https://example.com/first.jpg');
    });

    test('extracts from image object with url property', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            {"@type": "Recipe", "image": {"@type": "ImageObject", "url": "https://example.com/object-image.jpg"}}
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBe('https://example.com/object-image.jpg');
    });

    test('extracts from array of image objects', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            {"@type": "Recipe", "image": [{"url": "https://example.com/array-object.jpg"}]}
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBe('https://example.com/array-object.jpg');
    });

    test('returns null when no JSON-LD present', () => {
      const html = '<html><body>No JSON-LD here</body></html>';

      const result = extractImageFromJsonLd(html);

      expect(result).toBeNull();
    });

    test('returns null for placeholder images', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            {"@type": "Recipe", "image": "https://example.com/placeholder.jpg"}
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBeNull();
    });

    test('returns null for placeholder in image array', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            {"@type": "Recipe", "image": ["https://example.com/placeholder-image.jpg"]}
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBeNull();
    });

    test('returns null for placeholder in image object url', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            {"@type": "Recipe", "image": {"@type": "ImageObject", "url": "https://example.com/placeholder-icon.jpg"}}
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBeNull();
    });

    test('returns null when no Recipe type found', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            {"@type": "WebPage", "name": "Not a recipe"}
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBeNull();
    });

    test('returns null when Recipe has no image', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            {"@type": "Recipe", "name": "No image recipe"}
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBeNull();
    });

    test('returns null for malformed JSON', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            {not valid json}
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBeNull();
    });

    test('extracts from root-level JSON-LD array (Quitoque format)', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            [{"@type": "Recipe", "name": "Test", "image": ["https://example.com/quitoque-image.jpg"]}]
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBe('https://example.com/quitoque-image.jpg');
    });

    test('finds Recipe in root-level array with multiple items', () => {
      const html = `
        <html>
          <script type="application/ld+json">
            [{"@type": "WebPage", "name": "Page"}, {"@type": "Recipe", "image": "https://example.com/recipe-in-array.jpg"}]
          </script>
        </html>
      `;

      const result = extractImageFromJsonLd(html);

      expect(result).toBe('https://example.com/recipe-in-array.jpg');
    });
  });
});
