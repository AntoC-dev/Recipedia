import { getAvailableProviders, getProvider, hasProvider } from '@providers/ProviderRegistry';
import { HelloFreshProvider } from '@providers/HelloFreshProvider';
import { QuitoqueProvider } from '@providers/QuitoqueProvider';

describe('ProviderRegistry', () => {
  describe('getProvider', () => {
    it('returns HelloFresh provider for hellofresh id', () => {
      const provider = getProvider('hellofresh');

      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(HelloFreshProvider);
      expect(provider?.id).toBe('hellofresh');
    });

    it('returns undefined for unknown provider id', () => {
      const provider = getProvider('unknown');

      expect(provider).toBeUndefined();
    });

    it('is case sensitive', () => {
      const provider = getProvider('HelloFresh');

      expect(provider).toBeUndefined();
    });
  });

  describe('getAvailableProviders', () => {
    it('includes HelloFresh for any language', () => {
      const englishProviders = getAvailableProviders('en');
      const frenchProviders = getAvailableProviders('fr');

      expect(englishProviders.find(p => p.id === 'hellofresh')).toBeInstanceOf(HelloFreshProvider);
      expect(frenchProviders.find(p => p.id === 'hellofresh')).toBeInstanceOf(HelloFreshProvider);
    });

    it('includes Quitoque only for French language', () => {
      const frenchProviders = getAvailableProviders('fr');
      const englishProviders = getAvailableProviders('en');

      expect(frenchProviders.find(p => p.id === 'quitoque')).toBeInstanceOf(QuitoqueProvider);
      expect(englishProviders.find(p => p.id === 'quitoque')).toBeUndefined();
    });

    it('returns new array on each call', () => {
      const providers1 = getAvailableProviders('en');
      const providers2 = getAvailableProviders('en');

      expect(providers1).not.toBe(providers2);
    });
  });

  describe('hasProvider', () => {
    it('returns true for registered provider', () => {
      expect(hasProvider('hellofresh')).toBe(true);
    });

    it('returns false for unknown provider', () => {
      expect(hasProvider('unknown')).toBe(false);
    });

    it('is case sensitive', () => {
      expect(hasProvider('HelloFresh')).toBe(false);
    });
  });
});
