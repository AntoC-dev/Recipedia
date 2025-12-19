import { getProvider, getAvailableProviders, hasProvider } from '@providers/ProviderRegistry';
import { HelloFreshProvider } from '@providers/HelloFreshProvider';

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
    it('returns array of all providers', () => {
      const providers = getAvailableProviders();

      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    });

    it('includes HelloFresh provider', () => {
      const providers = getAvailableProviders();

      const hellofresh = providers.find(p => p.id === 'hellofresh');
      expect(hellofresh).toBeDefined();
      expect(hellofresh).toBeInstanceOf(HelloFreshProvider);
    });

    it('returns new array on each call', () => {
      const providers1 = getAvailableProviders();
      const providers2 = getAvailableProviders();

      expect(providers1).not.toBe(providers2);
      expect(providers1).toEqual(providers2);
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
