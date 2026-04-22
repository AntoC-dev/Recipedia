import { detectAuthRequired } from '@app/modules/recipe-scraper/src/authDetection';

const recipeHtml =
  '<html><head><title>Hamburger maison - Marmiton</title></head><body></body></html>';
const loginHtml =
  '<html><head><title>Connexion - Quitoque</title></head><body><form>Login</form></body></html>';
const genericHtml = '<html><head><title>Page</title></head><body></body></html>';

describe('detectAuthRequired', () => {
  describe('URL pattern detection', () => {
    test.each([
      '/login',
      '/signin',
      '/sign-in',
      '/auth',
      '/connexion',
      '/account/login',
      '/user/login',
    ])('detects auth when final URL path contains %s', pattern => {
      const finalUrl = `https://example.com${pattern}`;
      const result = detectAuthRequired(genericHtml, finalUrl, 'https://example.com/recipe/123');

      expect(result).not.toBeNull();
      expect(result?.success).toBe(false);
      expect(result?.error.type).toBe('AuthenticationRequired');
      expect(result?.error.host).toBe('example.com');
    });

    test('detects auth with nested login path', () => {
      const result = detectAuthRequired(
        genericHtml,
        'https://www.quitoque.fr/connexion?redirect=/products/123',
        'https://www.quitoque.fr/products/123'
      );

      expect(result).not.toBeNull();
      expect(result?.error.type).toBe('AuthenticationRequired');
      expect(result?.error.host).toBe('quitoque.fr');
    });
  });

  describe('title keyword detection', () => {
    test.each([
      ['login', '<html><head><title>Login</title></head></html>'],
      ['sign in', '<html><head><title>Sign In Required</title></head></html>'],
      ['connexion', '<html><head><title>Connexion - Quitoque</title></head></html>'],
      ['se connecter', '<html><head><title>Se connecter</title></head></html>'],
      ['log in', '<html><head><title>Log In to Continue</title></head></html>'],
      ['anmelden', '<html><head><title>Anmelden</title></head></html>'],
      ['iniciar sesión', '<html><head><title>Iniciar sesión</title></head></html>'],
    ])('detects auth when title contains "%s"', (_keyword, html) => {
      const result = detectAuthRequired(
        html,
        'https://www.example.com/some-page',
        'https://www.example.com/recipe/123'
      );

      expect(result).not.toBeNull();
      expect(result?.error.type).toBe('AuthenticationRequired');
    });

    test('detects auth via title even with non-auth URL', () => {
      const result = detectAuthRequired(
        loginHtml,
        'https://www.quitoque.fr/some-redirect',
        'https://www.quitoque.fr/products/123'
      );

      expect(result).not.toBeNull();
      expect(result?.error.host).toBe('quitoque.fr');
    });
  });

  describe('no auth detected', () => {
    test('returns null for normal recipe page', () => {
      const result = detectAuthRequired(
        recipeHtml,
        'https://www.marmiton.org/recettes/hamburger',
        'https://www.marmiton.org/recettes/hamburger'
      );

      expect(result).toBeNull();
    });

    test('returns null when URL and title are both non-auth', () => {
      const result = detectAuthRequired(
        genericHtml,
        'https://www.example.com/recipe/123',
        'https://www.example.com/recipe/123'
      );

      expect(result).toBeNull();
    });
  });

  describe('host extraction', () => {
    test('strips www. from host', () => {
      const result = detectAuthRequired(
        genericHtml,
        'https://www.quitoque.fr/login',
        'https://www.quitoque.fr/products/123'
      );

      expect(result?.error.host).toBe('quitoque.fr');
    });

    test('preserves host without www.', () => {
      const result = detectAuthRequired(
        genericHtml,
        'https://quitoque.fr/login',
        'https://quitoque.fr/products/123'
      );

      expect(result?.error.host).toBe('quitoque.fr');
    });
  });

  describe('case insensitivity', () => {
    test('detects auth with mixed-case URL path', () => {
      const result = detectAuthRequired(
        genericHtml,
        'https://example.com/Login',
        'https://example.com/recipe/123'
      );

      expect(result).not.toBeNull();
      expect(result?.error.type).toBe('AuthenticationRequired');
    });

    test('detects auth with uppercase URL path', () => {
      const result = detectAuthRequired(
        genericHtml,
        'https://example.com/CONNEXION',
        'https://example.com/recipe/123'
      );

      expect(result).not.toBeNull();
    });

    test('detects auth with mixed-case title', () => {
      const html = '<html><head><title>SE CONNECTER</title></head></html>';
      const result = detectAuthRequired(
        html,
        'https://example.com/some-page',
        'https://example.com/recipe/123'
      );

      expect(result).not.toBeNull();
    });
  });

  describe('false positive resistance', () => {
    test('flags path containing /login as substring (known limitation)', () => {
      const result = detectAuthRequired(
        recipeHtml,
        'https://example.com/blog/login-tips',
        'https://example.com/blog/login-tips'
      );

      expect(result).not.toBeNull();
    });

    test('returns null when no redirect happened (same URL)', () => {
      const result = detectAuthRequired(
        recipeHtml,
        'https://www.marmiton.org/recettes/hamburger',
        'https://www.marmiton.org/recettes/hamburger'
      );

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    test('handles invalid finalUrl gracefully and falls through to title check', () => {
      const result = detectAuthRequired(
        loginHtml,
        'not-a-valid-url',
        'https://www.quitoque.fr/products/123'
      );

      expect(result).not.toBeNull();
      expect(result?.error.type).toBe('AuthenticationRequired');
    });

    test('handles HTML without title tag', () => {
      const noTitleHtml = '<html><body>Content</body></html>';
      const result = detectAuthRequired(
        noTitleHtml,
        'https://www.example.com/recipe',
        'https://www.example.com/recipe'
      );

      expect(result).toBeNull();
    });

    test('handles empty HTML string', () => {
      const result = detectAuthRequired(
        '',
        'https://www.example.com/recipe',
        'https://www.example.com/recipe'
      );

      expect(result).toBeNull();
    });

    test('handles title with extra whitespace and newlines', () => {
      const html = '<html><head><title>\n  Connexion  \n</title></head></html>';
      const result = detectAuthRequired(
        html,
        'https://example.com/some-page',
        'https://example.com/recipe/123'
      );

      expect(result).not.toBeNull();
    });

    test('both URL pattern and title match without error', () => {
      const result = detectAuthRequired(
        loginHtml,
        'https://www.quitoque.fr/connexion',
        'https://www.quitoque.fr/products/123'
      );

      expect(result).not.toBeNull();
      expect(result?.error.type).toBe('AuthenticationRequired');
      expect(result?.error.host).toBe('quitoque.fr');
    });
  });
});
