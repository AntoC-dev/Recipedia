import { extractHost } from '@app/modules/recipe-scraper/src/urlUtils';

describe('extractHost', () => {
  it('strips www. prefix', () => {
    expect(extractHost('https://www.quitoque.fr/recipe/123')).toBe('quitoque.fr');
  });

  it('leaves host unchanged when no www. prefix', () => {
    expect(extractHost('https://allrecipes.com/recipe/123')).toBe('allrecipes.com');
  });

  it('returns only hostname when URL has path and query', () => {
    expect(extractHost('https://www.example.com/path?foo=bar#anchor')).toBe('example.com');
  });

  it('returns empty string for invalid URL', () => {
    expect(extractHost('not-a-url')).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(extractHost('')).toBe('');
  });

  it('does not strip non-leading www (awww.example.com)', () => {
    expect(extractHost('https://awww.example.com/path')).toBe('awww.example.com');
  });
});
