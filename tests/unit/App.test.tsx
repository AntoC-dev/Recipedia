import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { mockWhenReady, resetRecipeScraperMocks } from '@mocks/modules/recipe-scraper-mock';
import { mockInitSettings, mockGetDarkMode } from '@mocks/utils/settings-mock';
import { mockIsFirstLaunch } from '@mocks/utils/firstLaunch-mock';
import { mockHideAsync } from '@mocks/deps/expo-splash-screen-mock';
import { init as mockInitFileSystem } from '@mocks/utils/FileGestion-mock';
import RecipeDatabase from '@utils/RecipeDatabase';

import App from '../../App';

jest.mock('expo-splash-screen', () =>
  require('@mocks/deps/expo-splash-screen-mock').expoSplashScreenMock()
);

jest.mock(
  '@app/modules/recipe-scraper',
  () => require('@mocks/modules/recipe-scraper-mock').recipeScraperMock
);

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

jest.mock('@components/organisms/AppWrapper', () =>
  require('@mocks/components/organisms/AppWrapper-mock').appWrapperMock()
);

jest.mock('@styles/typography', () => require('@mocks/styles/typography-mock').typographyMock());

jest.mock('@utils/FileGestion', () => require('@mocks/utils/FileGestion-mock').fileGestionMock());

describe('App', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    jest.clearAllMocks();
    resetRecipeScraperMocks();
    mockInitSettings.mockResolvedValue(undefined);
    mockGetDarkMode.mockResolvedValue(false);
    mockIsFirstLaunch.mockResolvedValue(false);
    mockHideAsync.mockResolvedValue(undefined);
    await database.init();
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  describe('initialization', () => {
    it('initializes file system before any other operation', async () => {
      const callOrder: string[] = [];
      mockInitFileSystem.mockImplementation(() => {
        callOrder.push('initFileSystem');
      });
      jest.spyOn(database, 'init').mockImplementation(async () => {
        callOrder.push('dbInit');
      });

      render(<App />);

      await waitFor(() => {
        expect(mockInitFileSystem).toHaveBeenCalled();
      });
      expect(callOrder.indexOf('initFileSystem')).toBeLessThan(callOrder.indexOf('dbInit'));
    });

    it('calls settings, firstLaunch, and darkMode during initialization', async () => {
      render(<App />);

      await waitFor(() => {
        expect(mockInitSettings).toHaveBeenCalled();
        expect(mockIsFirstLaunch).toHaveBeenCalled();
        expect(mockGetDarkMode).toHaveBeenCalled();
      });
    });

    it('does not eagerly warm up the Python scraper at startup', async () => {
      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('app-wrapper')).toBeTruthy();
      });
      expect(mockWhenReady).not.toHaveBeenCalled();
    });
  });
});
