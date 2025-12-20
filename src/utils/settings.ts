import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { Appearance } from 'react-native';
import i18n from './i18n';
import { settingsLogger } from '@utils/logger';

// Settings keys for AsyncStorage
export const SETTINGS_KEYS = {
  DARK_MODE: 'settings_dark_mode',
  DEFAULT_PERSONS: 'settings_default_persons',
  SEASON_FILTER: 'settings_season_filter',
  LANGUAGE: 'settings_language',
};

// Default settings values
export const DEFAULT_SETTINGS = {
  darkMode: false,
  defaultPersons: 4,
  seasonFilter: true,
  language: '', // Empty string means use device locale
};

/**
 * Get the dark mode setting
 * Uses system preference on first launch, then respects user choice
 * @returns Promise resolving to dark mode boolean
 */
export const getDarkMode = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(SETTINGS_KEYS.DARK_MODE);
    if (value !== null) {
      return value === 'true';
    }
    return Appearance.getColorScheme() === 'dark';
  } catch (error) {
    settingsLogger.error('Failed to get dark mode setting', { error });
    return Appearance.getColorScheme() === 'dark';
  }
};

/**
 * Set the dark mode setting
 * @param value Dark mode boolean value
 * @returns Promise that resolves when setting is saved
 */
export const setDarkMode = async (value: boolean): Promise<void> => {
  try {
    settingsLogger.info('Set dark mode to ', value);
    await AsyncStorage.setItem(SETTINGS_KEYS.DARK_MODE, value.toString());
  } catch (error) {
    settingsLogger.error('Failed to save dark mode setting', { value, error });
  }
};

/**
 * Get the default persons setting
 * @returns Promise resolving to default persons number
 */
export const getDefaultPersons = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(SETTINGS_KEYS.DEFAULT_PERSONS);
    return value !== null ? parseInt(value, 10) : DEFAULT_SETTINGS.defaultPersons;
  } catch (error) {
    settingsLogger.error('Failed to get default persons setting', { error });
    return DEFAULT_SETTINGS.defaultPersons;
  }
};

/**
 * Set the default persons setting
 * @param value Default persons number
 * @returns Promise that resolves when setting is saved
 */
export const setDefaultPersons = async (value: number): Promise<void> => {
  try {
    settingsLogger.info('Set default persons to ', value);
    await AsyncStorage.setItem(SETTINGS_KEYS.DEFAULT_PERSONS, value.toString());
  } catch (error) {
    settingsLogger.error('Failed to save default persons setting', { value, error });
  }
};

/**
 * Get the season filter setting
 * @returns Promise resolving to season filter boolean
 */
export const getSeasonFilter = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(SETTINGS_KEYS.SEASON_FILTER);
    return value === 'true';
  } catch (error) {
    settingsLogger.error('Failed to get season filter setting', { error });
    return DEFAULT_SETTINGS.seasonFilter;
  }
};

/**
 * Set the season filter setting
 * @param value Season filter boolean value
 * @returns Promise that resolves when setting is saved
 */
export const setSeasonFilter = async (value: boolean): Promise<void> => {
  try {
    settingsLogger.info('Set season filter to ', value);
    await AsyncStorage.setItem(SETTINGS_KEYS.SEASON_FILTER, value.toString());
  } catch (error) {
    settingsLogger.error('Failed to save season filter setting', { enabled: value, error });
  }
};

/**
 * Toggle the season filter setting
 * @returns Promise resolving to the new season filter value
 */
export const toggleSeasonFilter = async (): Promise<boolean> => {
  const currentValue = await getSeasonFilter();
  const newValue = !currentValue;
  await setSeasonFilter(newValue);
  return newValue;
};

/**
 * Get the language setting
 * @returns Promise resolving to language code
 */
export const getLanguage = async (): Promise<string> => {
  try {
    const value = await AsyncStorage.getItem(SETTINGS_KEYS.LANGUAGE);
    if (value && value.length > 0) {
      return value;
    }
  } catch (error) {
    settingsLogger.error('Failed to get language setting', { error });
  }
  return Localization.getLocales()[0].languageCode ?? 'en';
};

/**
 * Set the language setting
 * @param value Language code
 * @returns Promise that resolves when setting is saved
 */
export const setLanguage = async (value: string): Promise<void> => {
  try {
    settingsLogger.info('Set language to ', value);
    await AsyncStorage.setItem(SETTINGS_KEYS.LANGUAGE, value);
    // Also update i18n instance
    await i18n.changeLanguage(value);
  } catch (error) {
    settingsLogger.error('Failed to save language setting', { languageCode: value, error });
  }
};

/**
 * Initialize settings by loading from AsyncStorage
 * This should be called on app startup
 */
export const initSettings = async (): Promise<void> => {
  settingsLogger.debug('Initializing app settings');
  // Load language setting and apply it
  const language = await getLanguage();
  if (language) {
    settingsLogger.debug('Setting language', { language });
    await i18n.changeLanguage(language);
  }
  settingsLogger.debug('Settings initialization completed');
};
