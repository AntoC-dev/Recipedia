import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { WelcomeScreen } from '@screens/WelcomeScreen';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testRecipes } from '@test-data/recipesDataset';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';

jest.mock('@components/atomic/CustomImage', () =>
  require('@mocks/components/atomic/CustomImage-mock').customImageMock()
);

jest.mock('expo-asset', () => require('@mocks/deps/expo-asset-mock').expoAssetMock());

jest.mock('expo-constants', () => require('@mocks/deps/expo-constants-mock').expoConstantsMock());

jest.mock('@utils/datasetInitializer', () => ({
  loadFirstLaunchDataset: jest.fn().mockResolvedValue(undefined),
}));

describe('WelcomeScreen Component', () => {
  const mockOnStartTutorial = jest.fn();
  const mockOnSkip = jest.fn();
  let database: RecipeDatabase;

  const renderWelcomeScreen = () =>
    render(<WelcomeScreen onStartTutorial={mockOnStartTutorial} onSkip={mockOnSkip} />);

  beforeEach(async () => {
    jest.clearAllMocks();
    database = RecipeDatabase.getInstance();
    await database.init();
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('renders branded header with app icon, title and subtitle', async () => {
    const { getByTestId } = renderWelcomeScreen();

    await waitFor(() => {
      expect(getByTestId('WelcomeScreen::AppIcon')).toBeTruthy();
    });

    expect(getByTestId('WelcomeScreen::AppIcon::Uri')).toHaveTextContent('mocked-asset-uri');
    expect(getByTestId('WelcomeScreen::Title')).toHaveTextContent('Test Recipedia');
    expect(getByTestId('WelcomeScreen::Subtitle')).toHaveTextContent('welcome.subtitle');
  });

  test('renders features card with title and all feature items', async () => {
    const { getByTestId } = renderWelcomeScreen();

    await waitFor(() => {
      expect(getByTestId('WelcomeScreen::Card::Title')).toHaveTextContent('welcome.valueTitle');
    });

    expect(getByTestId('WelcomeScreen::Card::FeaturesList::0::Icon::Icon')).toHaveTextContent(
      'magnify'
    );
    expect(getByTestId('WelcomeScreen::Card::FeaturesList::0::Text')).toHaveTextContent(
      'welcome.features.find'
    );
    expect(getByTestId('WelcomeScreen::Card::FeaturesList::1::Icon::Icon')).toHaveTextContent(
      'plus'
    );
    expect(getByTestId('WelcomeScreen::Card::FeaturesList::1::Text')).toHaveTextContent(
      'welcome.features.add'
    );
    expect(getByTestId('WelcomeScreen::Card::FeaturesList::2::Icon::Icon')).toHaveTextContent(
      'web'
    );
    expect(getByTestId('WelcomeScreen::Card::FeaturesList::2::Text')).toHaveTextContent(
      'welcome.features.import'
    );
    expect(getByTestId('WelcomeScreen::Card::FeaturesList::3::Icon::Icon')).toHaveTextContent(
      'cart'
    );
    expect(getByTestId('WelcomeScreen::Card::FeaturesList::3::Text')).toHaveTextContent(
      'welcome.features.shopping'
    );
  });

  test('renders action buttons with correct text', async () => {
    const { getByTestId } = renderWelcomeScreen();

    await waitFor(() => {
      expect(getByTestId('WelcomeScreen::StartTourButton')).toHaveTextContent('welcome.startTour');
    });

    expect(getByTestId('WelcomeScreen::SkipButton')).toHaveTextContent('welcome.skip');
  });

  test('handles button interactions correctly', async () => {
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);

    const { getByTestId } = renderWelcomeScreen();

    await waitFor(() => {
      expect(getByTestId('WelcomeScreen::StartTourButton')).toBeTruthy();
    });

    fireEvent.press(getByTestId('WelcomeScreen::StartTourButton'));
    expect(mockOnStartTutorial).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('WelcomeScreen::SkipButton'));
    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  test('renders proper component structure with all required elements', async () => {
    const { getByTestId } = renderWelcomeScreen();

    await waitFor(() => {
      expect(getByTestId('WelcomeScreen::AppIcon')).toBeTruthy();
    });

    expect(getByTestId('WelcomeScreen::AppIcon::Uri')).toHaveTextContent('mocked-asset-uri');
    expect(getByTestId('WelcomeScreen::Title')).toHaveTextContent('Test Recipedia');
    expect(getByTestId('WelcomeScreen::Subtitle')).toHaveTextContent('welcome.subtitle');
    expect(getByTestId('WelcomeScreen::Card')).toBeTruthy();
    expect(getByTestId('WelcomeScreen::Card::Title')).toHaveTextContent('welcome.valueTitle');
    expect(getByTestId('WelcomeScreen::StartTourButton')).toHaveTextContent('welcome.startTour');
    expect(getByTestId('WelcomeScreen::SkipButton')).toHaveTextContent('welcome.skip');

    expect(getByTestId('WelcomeScreen::Card::FeaturesList::0::Icon')).toBeTruthy();
    expect(getByTestId('WelcomeScreen::Card::FeaturesList::1::Icon')).toBeTruthy();
    expect(getByTestId('WelcomeScreen::Card::FeaturesList::2::Icon')).toBeTruthy();
  });

  test('handles missing expo config gracefully', async () => {
    const originalConstant = require('expo-constants').default;
    require('expo-constants').default = { expoConfig: null };

    const { getByTestId } = renderWelcomeScreen();

    await waitFor(() => {
      expect(getByTestId('WelcomeScreen::Title')).toBeTruthy();
    });

    require('expo-constants').default = originalConstant;
  });

  describe('Dataset error handling', () => {
    test('does not show dataset error dialog when no error', async () => {
      const { queryByTestId } = renderWelcomeScreen();

      await waitFor(() => {
        expect(queryByTestId('WelcomeScreen::Title')).toBeTruthy();
      });

      expect(queryByTestId('WelcomeScreen::DatasetErrorDialog')).toBeNull();
    });

    test('shows dataset error dialog when dataset loading fails', async () => {
      const { loadFirstLaunchDataset } = require('@utils/datasetInitializer');
      loadFirstLaunchDataset.mockRejectedValueOnce(new Error('Network error'));

      const { getByTestId } = renderWelcomeScreen();

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::DatasetErrorDialog')).toBeTruthy();
      });

      expect(getByTestId('WelcomeScreen::DatasetErrorDialog::OK')).toBeTruthy();
    });

    test('dataset error dialog shows user-friendly message and report hint', async () => {
      const { loadFirstLaunchDataset } = require('@utils/datasetInitializer');
      loadFirstLaunchDataset.mockRejectedValueOnce(new Error('Some DB error'));

      const { getByText } = renderWelcomeScreen();

      await waitFor(() => {
        expect(getByText('welcome.datasetError.message')).toBeTruthy();
      });

      expect(getByText('welcome.datasetError.reportHint')).toBeTruthy();
    });

    test('dismissing dataset error dialog hides it', async () => {
      const { loadFirstLaunchDataset } = require('@utils/datasetInitializer');
      loadFirstLaunchDataset.mockRejectedValueOnce(new Error('Test error'));

      const { getByTestId, queryByTestId } = renderWelcomeScreen();

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::DatasetErrorDialog::OK')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::DatasetErrorDialog::OK'));

      await waitFor(() => {
        expect(queryByTestId('WelcomeScreen::DatasetErrorDialog')).toBeNull();
      });
    });

    test('does not show technical error details to user', async () => {
      const { loadFirstLaunchDataset } = require('@utils/datasetInitializer');
      const error = new Error('Ingredients not found in database: Sésame doré');
      error.stack =
        'Error: Ingredients not found\n    at verifyIngredientsExist (RecipeDatabase.tsx:42)';
      loadFirstLaunchDataset.mockRejectedValueOnce(error);

      const { queryByText, getByText } = renderWelcomeScreen();

      await waitFor(() => {
        expect(getByText('welcome.datasetError.message')).toBeTruthy();
      });

      expect(queryByText(/verifyIngredientsExist/)).toBeNull();
      expect(queryByText(/RecipeDatabase\.tsx/)).toBeNull();
      expect(queryByText(/Sésame doré/)).toBeNull();
    });
  });

  describe('Loading state handling', () => {
    test('shows loading overlay when start tour clicked before data loads', async () => {
      const { getByTestId } = renderWelcomeScreen();

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::StartTourButton')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::StartTourButton'));

      expect(mockOnStartTutorial).not.toHaveBeenCalled();
      expect(getByTestId('WelcomeScreen::LoadingOverlay::Overlay')).toBeTruthy();
      expect(getByTestId('WelcomeScreen::LoadingOverlay::Overlay::Message')).toHaveTextContent(
        'welcome.loadingData'
      );
    });

    test('shows loading overlay when skip clicked before data loads', async () => {
      const { getByTestId } = renderWelcomeScreen();

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::SkipButton')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::SkipButton'));

      expect(mockOnSkip).not.toHaveBeenCalled();
      expect(getByTestId('WelcomeScreen::LoadingOverlay::Overlay')).toBeTruthy();
      expect(getByTestId('WelcomeScreen::LoadingOverlay::Overlay::Message')).toHaveTextContent(
        'welcome.loadingData'
      );
    });

    test('calls onStartTutorial after data loads when pending tutorial action', async () => {
      const { getByTestId } = renderWelcomeScreen();

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::StartTourButton')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::StartTourButton'));
      expect(mockOnStartTutorial).not.toHaveBeenCalled();

      await database.addMultipleIngredients(testIngredients);
      await database.addMultipleTags(testTags);
      await database.addMultipleRecipes(testRecipes);

      await waitFor(() => {
        expect(mockOnStartTutorial).toHaveBeenCalledTimes(1);
      });
    });

    test('calls onSkip after data loads when pending skip action', async () => {
      const { getByTestId } = renderWelcomeScreen();

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::SkipButton')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::SkipButton'));
      expect(mockOnSkip).not.toHaveBeenCalled();

      await database.addMultipleIngredients(testIngredients);
      await database.addMultipleTags(testTags);
      await database.addMultipleRecipes(testRecipes);

      await waitFor(() => {
        expect(mockOnSkip).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Dataset failure recovery', () => {
    test('calls onSkip when start tour clicked after dataset fails', async () => {
      const { loadFirstLaunchDataset } = require('@utils/datasetInitializer');
      loadFirstLaunchDataset.mockRejectedValueOnce(new Error('DB error'));

      const { getByTestId } = renderWelcomeScreen();

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::DatasetErrorDialog')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::DatasetErrorDialog::OK'));
      fireEvent.press(getByTestId('WelcomeScreen::StartTourButton'));

      expect(mockOnStartTutorial).toHaveBeenCalledTimes(1);
      expect(mockOnSkip).not.toHaveBeenCalled();
    });

    test('calls onSkip when skip clicked after dataset fails', async () => {
      const { loadFirstLaunchDataset } = require('@utils/datasetInitializer');
      loadFirstLaunchDataset.mockRejectedValueOnce(new Error('DB error'));

      const { getByTestId } = renderWelcomeScreen();

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::DatasetErrorDialog')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::DatasetErrorDialog::OK'));
      fireEvent.press(getByTestId('WelcomeScreen::SkipButton'));

      expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });

    test('proceeds with onStartTutorial when pending tutorial and dataset fails', async () => {
      const { loadFirstLaunchDataset } = require('@utils/datasetInitializer');
      let rejectFn: (err: Error) => void;
      loadFirstLaunchDataset.mockReturnValueOnce(
        new Promise((_resolve, reject) => {
          rejectFn = reject;
        })
      );

      const { getByTestId } = renderWelcomeScreen();

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::StartTourButton')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::StartTourButton'));
      expect(mockOnStartTutorial).not.toHaveBeenCalled();

      rejectFn!(new Error('Late failure'));

      await waitFor(() => {
        expect(mockOnStartTutorial).toHaveBeenCalledTimes(1);
      });

      expect(mockOnSkip).not.toHaveBeenCalled();
    });

    test('does not show loading overlay after dataset fails', async () => {
      const { loadFirstLaunchDataset } = require('@utils/datasetInitializer');
      loadFirstLaunchDataset.mockRejectedValueOnce(new Error('DB error'));

      const { getByTestId, queryByTestId } = renderWelcomeScreen();

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::DatasetErrorDialog')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::DatasetErrorDialog::OK'));
      fireEvent.press(getByTestId('WelcomeScreen::SkipButton'));

      expect(queryByTestId('WelcomeScreen::LoadingOverlay::Overlay')).toBeNull();
    });
  });
});
