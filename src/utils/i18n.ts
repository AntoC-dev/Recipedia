import { createInstance } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import resourcesToBackend from 'i18next-resources-to-backend';
import fr from '@translations/fr';
import en from '@translations/en';

/**
 * Single source of truth for all supported languages.
 *
 * Keys are language codes (e.g., 'en', 'fr'), values contain display information.
 * Adding a new language here will cause TypeScript to enforce updates in:
 * - DatasetLoader.ts (datasetLoaders record)
 *
 * @example
 * ```typescript
 * // Get all language codes
 * const codes = Object.keys(SUPPORTED_LANGUAGES); // ['en', 'fr']
 *
 * // Get display name
 * const name = SUPPORTED_LANGUAGES.fr.name; // 'Français'
 * ```
 */
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English' },
  fr: { name: 'Français' },
} as const;

/** Union type of all supported language codes, derived from SUPPORTED_LANGUAGES */
export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/** Default language used as fallback throughout the app */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Initialize i18next instance
const i18n = createInstance();

// Initialize with device locale first
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(
    resourcesToBackend((language: string, namespace: string) => {
      // Load translations dynamically
      if (language === 'en' && namespace === 'translation') {
        return Promise.resolve(en);
      }
      if (language === 'fr' && namespace === 'translation') {
        return Promise.resolve(fr);
      }
      return Promise.resolve({});
    })
  )
  .init({
    lng: Localization.getLocales()[0].languageCode ?? 'en', // Use device locale by default
    fallbackLng: 'en',
    debug: __DEV__, // Enable debug in development
    keySeparator: '.',
    returnObjects: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    react: {
      useSuspense: false, // Disable Suspense for React Native
    },
  });

/**
 * Hook to use translations in React components
 * @returns Translation functions and utilities
 */
export const useI18n = () => {
  const { t, i18n } = useTranslation();

  return {
    t,
    /**
     * Changes the current locale
     * @param locale The locale to set (e.g., 'en', 'fr')
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setLocale: (locale: string): Promise<any> => i18n.changeLanguage(locale),

    /**
     * Gets the current locale
     * @returns The current locale
     */
    getLocale: (): string => i18n.language,

    /**
     * Gets all available locales
     * @returns Array of available locale codes
     */
    getAvailableLocales: (): SupportedLanguage[] =>
      Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[],

    /**
     * Gets the locale name in its own language
     * @param locale The locale code
     * @returns The name of the language in its own language
     */
    getLocaleName: (locale: string): string =>
      locale in SUPPORTED_LANGUAGES
        ? SUPPORTED_LANGUAGES[locale as SupportedLanguage].name
        : locale,
  };
};

export default i18n;
