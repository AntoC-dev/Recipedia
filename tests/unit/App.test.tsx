import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import {
  mockWaitForReady,
  mockWaitForReadySuccess,
  mockWaitForReadyTimeout,
  mockWaitForReadyDelay,
  resetRecipeScraperMocks,
} from '@mocks/modules/recipe-scraper-mock';
import { mockInitSettings, mockGetDarkMode } from '@mocks/utils/settings-mock';
import { mockIsFirstLaunch } from '@mocks/utils/firstLaunch-mock';
import { mockHideAsync } from '@mocks/deps/expo-splash-screen-mock';

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

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRecipeScraperMocks();
    mockInitSettings.mockResolvedValue(undefined);
    mockGetDarkMode.mockResolvedValue(false);
    mockIsFirstLaunch.mockResolvedValue(false);
    mockHideAsync.mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    it('waits for Python scraper to be ready during initialization', async () => {
      mockWaitForReadySuccess(true);

      render(<App />);

      await waitFor(() => {
        expect(mockWaitForReady).toHaveBeenCalled();
      });
    });

    it('calls waitForReady with 10 second timeout', async () => {
      mockWaitForReadySuccess(true);

      render(<App />);

      await waitFor(() => {
        expect(mockWaitForReady).toHaveBeenCalledWith(10000);
      });
    });

    it('completes initialization even if Python times out', async () => {
      mockWaitForReadyTimeout();

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('app-wrapper')).toBeTruthy();
      });
    });

    it('shows app content after Python is ready', async () => {
      mockWaitForReadySuccess(true);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('app-wrapper')).toBeTruthy();
      });
    });

    it('initialization order: settings, firstLaunch, darkMode, Python', async () => {
      const callOrder: string[] = [];

      mockInitSettings.mockImplementation(async () => {
        callOrder.push('initSettings');
      });
      mockIsFirstLaunch.mockImplementation(async () => {
        callOrder.push('isFirstLaunch');
        return false;
      });
      mockGetDarkMode.mockImplementation(async () => {
        callOrder.push('getDarkMode');
        return false;
      });
      mockWaitForReady.mockImplementation(async () => {
        callOrder.push('waitForReady');
        return true;
      });

      render(<App />);

      await waitFor(() => {
        const appInitOrder = callOrder.slice(0, 4);
        expect(appInitOrder).toEqual([
          'initSettings',
          'isFirstLaunch',
          'getDarkMode',
          'waitForReady',
        ]);
      });
    });
  });

  describe('Python scraper integration', () => {
    it('handles slow Python initialization gracefully', async () => {
      mockWaitForReadyDelay(100, true);

      const { getByTestId } = render(<App />);

      await waitFor(
        () => {
          expect(getByTestId('app-wrapper')).toBeTruthy();
        },
        { timeout: 500 }
      );
    });

    it('continues app initialization even if Python fails', async () => {
      mockWaitForReady.mockRejectedValue(new Error('Python init failed'));

      const { getByTestId } = render(<App />);

      await waitFor(
        () => {
          expect(getByTestId('app-wrapper')).toBeTruthy();
        },
        { timeout: 1000 }
      );
    });
  });
});
