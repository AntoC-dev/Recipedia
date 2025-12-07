export const mockGetDefaultPersons = jest.fn().mockResolvedValue(4);
export const mockSetDefaultPersons = jest.fn().mockResolvedValue(undefined);
export const mockSetLanguage = jest.fn();
export const mockGetLanguage = jest.fn().mockResolvedValue('en');
export const mockGetSeasonFilter = jest.fn().mockResolvedValue(true);
export const mockSetSeasonFilter = jest.fn().mockResolvedValue(undefined);
export const mockToggleSeasonFilter = jest.fn().mockResolvedValue(false);
export const mockGetDarkMode = jest.fn().mockResolvedValue(false);
export const mockSetDarkMode = jest.fn().mockResolvedValue(undefined);
export const mockInitSettings = jest.fn().mockResolvedValue(undefined);

export const getDefaultPersons = mockGetDefaultPersons;
export const setDefaultPersons = mockSetDefaultPersons;

export function settingsMock() {
  return {
    getDefaultPersons: mockGetDefaultPersons,
    setDefaultPersons: mockSetDefaultPersons,
    getLanguage: mockGetLanguage,
    setLanguage: mockSetLanguage,
    getSeasonFilter: mockGetSeasonFilter,
    setSeasonFilter: mockSetSeasonFilter,
    toggleSeasonFilter: mockToggleSeasonFilter,
    getDarkMode: mockGetDarkMode,
    setDarkMode: mockSetDarkMode,
    initSettings: mockInitSettings,
    SETTINGS_KEYS: {
      DARK_MODE: 'settings_dark_mode',
      DEFAULT_PERSONS: 'settings_default_persons',
      SEASON_FILTER: 'settings_season_filter',
      LANGUAGE: 'settings_language',
    },
    DEFAULT_SETTINGS: {
      darkMode: false,
      defaultPersons: 4,
      seasonFilter: true,
      language: '',
    },
  };
}
