import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { WelcomeScreen } from '@screens/WelcomeScreen';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testRecipes } from '@test-data/recipesDataset';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';

jest.mock('@components/atomic/CustomImage', () =>
  require('@mocks/components/atomic/CustomImage-mock').customImageMock()
);

jest.mock('expo-asset', () => require('@mocks/deps/expo-asset-mock').expoAssetMock());

jest.mock('expo-constants', () => require('@mocks/deps/expo-constants-mock').expoConstantsMock());

describe('WelcomeScreen Component', () => {
  const mockOnStartTutorial = jest.fn();
  const mockOnSkip = jest.fn();
  let database: RecipeDatabase;

  const renderWelcomeScreen = () =>
    render(
      <RecipeDatabaseProvider>
        <WelcomeScreen onStartTutorial={mockOnStartTutorial} onSkip={mockOnSkip} />
      </RecipeDatabaseProvider>
    );

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

    expect(getByTestId('WelcomeScreen::AppIcon::Uri')).toHaveTextContent('mocked-app-icon-uri');
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
      'cart'
    );
    expect(getByTestId('WelcomeScreen::Card::FeaturesList::2::Text')).toHaveTextContent(
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

    expect(getByTestId('WelcomeScreen::AppIcon::Uri')).toHaveTextContent('mocked-app-icon-uri');
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
      const mockContext = {
        recipes: [],
        ingredients: [],
        tags: [],
        shopping: [],
        datasetLoadError: 'Failed to load dataset: Network error',
        dismissDatasetLoadError: jest.fn(),
        isDatabaseReady: true,
        scalingProgress: undefined,
        addRecipe: jest.fn(),
        editRecipe: jest.fn(),
        deleteRecipe: jest.fn(),
        addIngredient: jest.fn(),
        editIngredient: jest.fn(),
        deleteIngredient: jest.fn(),
        addTag: jest.fn(),
        editTag: jest.fn(),
        deleteTag: jest.fn(),
        addRecipeToShopping: jest.fn(),
        purchaseIngredientInShoppingList: jest.fn(),
        clearShoppingList: jest.fn(),
        findSimilarRecipes: jest.fn(),
        findSimilarIngredients: jest.fn(),
        findSimilarTags: jest.fn(),
        getRandomIngredients: jest.fn(),
        getRandomTags: jest.fn(),
        searchRandomlyTags: jest.fn(),
        scaleAllRecipesForNewDefaultPersons: jest.fn(),
        isDatabaseEmpty: jest.fn(),
        addMultipleIngredients: jest.fn(),
        addMultipleTags: jest.fn(),
        addMultipleRecipes: jest.fn(),
      };

      jest
        .spyOn(require('@context/RecipeDatabaseContext'), 'useRecipeDatabase')
        .mockReturnValue(mockContext);

      const { getByTestId, rerender } = render(
        <WelcomeScreen onStartTutorial={mockOnStartTutorial} onSkip={mockOnSkip} />
      );

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::DatasetErrorDialog')).toBeTruthy();
      });

      expect(getByTestId('WelcomeScreen::DatasetErrorDialog::OK')).toBeTruthy();

      jest.restoreAllMocks();
    });

    test('dataset error dialog shows correct error message', async () => {
      const errorMessage = 'Failed to load dataset: Network error';
      const mockContext = {
        recipes: [],
        ingredients: [],
        tags: [],
        shopping: [],
        datasetLoadError: errorMessage,
        dismissDatasetLoadError: jest.fn(),
        isDatabaseReady: true,
        scalingProgress: undefined,
        addRecipe: jest.fn(),
        editRecipe: jest.fn(),
        deleteRecipe: jest.fn(),
        addIngredient: jest.fn(),
        editIngredient: jest.fn(),
        deleteIngredient: jest.fn(),
        addTag: jest.fn(),
        editTag: jest.fn(),
        deleteTag: jest.fn(),
        addRecipeToShopping: jest.fn(),
        purchaseIngredientInShoppingList: jest.fn(),
        clearShoppingList: jest.fn(),
        findSimilarRecipes: jest.fn(),
        findSimilarIngredients: jest.fn(),
        findSimilarTags: jest.fn(),
        getRandomIngredients: jest.fn(),
        getRandomTags: jest.fn(),
        searchRandomlyTags: jest.fn(),
        scaleAllRecipesForNewDefaultPersons: jest.fn(),
        isDatabaseEmpty: jest.fn(),
        addMultipleIngredients: jest.fn(),
        addMultipleTags: jest.fn(),
        addMultipleRecipes: jest.fn(),
      };

      jest
        .spyOn(require('@context/RecipeDatabaseContext'), 'useRecipeDatabase')
        .mockReturnValue(mockContext);

      const { getByText } = render(
        <WelcomeScreen onStartTutorial={mockOnStartTutorial} onSkip={mockOnSkip} />
      );

      await waitFor(() => {
        expect(getByText(new RegExp(errorMessage))).toBeTruthy();
      });

      jest.restoreAllMocks();
    });

    test('dismissing dataset error dialog calls dismissDatasetLoadError', async () => {
      const mockDismiss = jest.fn();
      const mockContext = {
        recipes: [],
        ingredients: [],
        tags: [],
        shopping: [],
        datasetLoadError: 'Test error',
        dismissDatasetLoadError: mockDismiss,
        isDatabaseReady: true,
        scalingProgress: undefined,
        addRecipe: jest.fn(),
        editRecipe: jest.fn(),
        deleteRecipe: jest.fn(),
        addIngredient: jest.fn(),
        editIngredient: jest.fn(),
        deleteIngredient: jest.fn(),
        addTag: jest.fn(),
        editTag: jest.fn(),
        deleteTag: jest.fn(),
        addRecipeToShopping: jest.fn(),
        purchaseIngredientInShoppingList: jest.fn(),
        clearShoppingList: jest.fn(),
        findSimilarRecipes: jest.fn(),
        findSimilarIngredients: jest.fn(),
        findSimilarTags: jest.fn(),
        getRandomIngredients: jest.fn(),
        getRandomTags: jest.fn(),
        searchRandomlyTags: jest.fn(),
        scaleAllRecipesForNewDefaultPersons: jest.fn(),
        isDatabaseEmpty: jest.fn(),
        addMultipleIngredients: jest.fn(),
        addMultipleTags: jest.fn(),
        addMultipleRecipes: jest.fn(),
      };

      jest
        .spyOn(require('@context/RecipeDatabaseContext'), 'useRecipeDatabase')
        .mockReturnValue(mockContext);

      const { getByTestId } = render(
        <WelcomeScreen onStartTutorial={mockOnStartTutorial} onSkip={mockOnSkip} />
      );

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::DatasetErrorDialog::OK')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::DatasetErrorDialog::OK'));

      expect(mockDismiss).toHaveBeenCalledTimes(1);

      jest.restoreAllMocks();
    });
  });

  describe('Loading state handling', () => {
    test('shows loading overlay when start tour clicked before data loads', async () => {
      const mockContextEmpty = {
        recipes: [],
        ingredients: [],
        tags: [],
        shopping: [],
        datasetLoadError: undefined,
        dismissDatasetLoadError: jest.fn(),
        isDatabaseReady: true,
        scalingProgress: undefined,
        addRecipe: jest.fn(),
        editRecipe: jest.fn(),
        deleteRecipe: jest.fn(),
        addIngredient: jest.fn(),
        editIngredient: jest.fn(),
        deleteIngredient: jest.fn(),
        addTag: jest.fn(),
        editTag: jest.fn(),
        deleteTag: jest.fn(),
        addRecipeToShopping: jest.fn(),
        purchaseIngredientInShoppingList: jest.fn(),
        clearShoppingList: jest.fn(),
        findSimilarRecipes: jest.fn(),
        findSimilarIngredients: jest.fn(),
        findSimilarTags: jest.fn(),
        getRandomIngredients: jest.fn(),
        getRandomTags: jest.fn(),
        searchRandomlyTags: jest.fn(),
        scaleAllRecipesForNewDefaultPersons: jest.fn(),
        isDatabaseEmpty: jest.fn(),
        addMultipleIngredients: jest.fn(),
        addMultipleTags: jest.fn(),
        addMultipleRecipes: jest.fn(),
      };

      jest
        .spyOn(require('@context/RecipeDatabaseContext'), 'useRecipeDatabase')
        .mockReturnValue(mockContextEmpty);

      const { getByTestId } = render(
        <WelcomeScreen onStartTutorial={mockOnStartTutorial} onSkip={mockOnSkip} />
      );

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::StartTourButton')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::StartTourButton'));

      expect(mockOnStartTutorial).not.toHaveBeenCalled();
      expect(getByTestId('WelcomeScreen::LoadingOverlay::Overlay')).toBeTruthy();
      expect(getByTestId('WelcomeScreen::LoadingOverlay::Overlay::Message')).toHaveTextContent(
        'welcome.loadingData'
      );

      jest.restoreAllMocks();
    });

    test('shows loading overlay when skip clicked before data loads', async () => {
      const mockContextEmpty = {
        recipes: [],
        ingredients: [],
        tags: [],
        shopping: [],
        datasetLoadError: undefined,
        dismissDatasetLoadError: jest.fn(),
        isDatabaseReady: true,
        scalingProgress: undefined,
        addRecipe: jest.fn(),
        editRecipe: jest.fn(),
        deleteRecipe: jest.fn(),
        addIngredient: jest.fn(),
        editIngredient: jest.fn(),
        deleteIngredient: jest.fn(),
        addTag: jest.fn(),
        editTag: jest.fn(),
        deleteTag: jest.fn(),
        addRecipeToShopping: jest.fn(),
        purchaseIngredientInShoppingList: jest.fn(),
        clearShoppingList: jest.fn(),
        findSimilarRecipes: jest.fn(),
        findSimilarIngredients: jest.fn(),
        findSimilarTags: jest.fn(),
        getRandomIngredients: jest.fn(),
        getRandomTags: jest.fn(),
        searchRandomlyTags: jest.fn(),
        scaleAllRecipesForNewDefaultPersons: jest.fn(),
        isDatabaseEmpty: jest.fn(),
        addMultipleIngredients: jest.fn(),
        addMultipleTags: jest.fn(),
        addMultipleRecipes: jest.fn(),
      };

      jest
        .spyOn(require('@context/RecipeDatabaseContext'), 'useRecipeDatabase')
        .mockReturnValue(mockContextEmpty);

      const { getByTestId } = render(
        <WelcomeScreen onStartTutorial={mockOnStartTutorial} onSkip={mockOnSkip} />
      );

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::SkipButton')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::SkipButton'));

      expect(mockOnSkip).not.toHaveBeenCalled();
      expect(getByTestId('WelcomeScreen::LoadingOverlay::Overlay')).toBeTruthy();
      expect(getByTestId('WelcomeScreen::LoadingOverlay::Overlay::Message')).toHaveTextContent(
        'welcome.loadingData'
      );

      jest.restoreAllMocks();
    });

    test('calls onStartTutorial after data loads when pending tutorial action', async () => {
      let mockRecipes: any[] = [];
      const mockContext = {
        get recipes() {
          return mockRecipes;
        },
        ingredients: [],
        tags: [],
        shopping: [],
        datasetLoadError: undefined,
        dismissDatasetLoadError: jest.fn(),
        isDatabaseReady: true,
        scalingProgress: undefined,
        addRecipe: jest.fn(),
        editRecipe: jest.fn(),
        deleteRecipe: jest.fn(),
        addIngredient: jest.fn(),
        editIngredient: jest.fn(),
        deleteIngredient: jest.fn(),
        addTag: jest.fn(),
        editTag: jest.fn(),
        deleteTag: jest.fn(),
        addRecipeToShopping: jest.fn(),
        purchaseIngredientInShoppingList: jest.fn(),
        clearShoppingList: jest.fn(),
        findSimilarRecipes: jest.fn(),
        findSimilarIngredients: jest.fn(),
        findSimilarTags: jest.fn(),
        getRandomIngredients: jest.fn(),
        getRandomTags: jest.fn(),
        searchRandomlyTags: jest.fn(),
        scaleAllRecipesForNewDefaultPersons: jest.fn(),
        isDatabaseEmpty: jest.fn(),
        addMultipleIngredients: jest.fn(),
        addMultipleTags: jest.fn(),
        addMultipleRecipes: jest.fn(),
      };

      const useRecipeDbSpy = jest
        .spyOn(require('@context/RecipeDatabaseContext'), 'useRecipeDatabase')
        .mockReturnValue(mockContext);

      const { getByTestId, rerender } = render(
        <WelcomeScreen onStartTutorial={mockOnStartTutorial} onSkip={mockOnSkip} />
      );

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::StartTourButton')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::StartTourButton'));
      expect(mockOnStartTutorial).not.toHaveBeenCalled();

      mockRecipes = [{ id: 1 }];
      rerender(<WelcomeScreen onStartTutorial={mockOnStartTutorial} onSkip={mockOnSkip} />);

      await waitFor(() => {
        expect(mockOnStartTutorial).toHaveBeenCalledTimes(1);
      });

      useRecipeDbSpy.mockRestore();
    });

    test('calls onSkip after data loads when pending skip action', async () => {
      let mockRecipes: any[] = [];
      const mockContext = {
        get recipes() {
          return mockRecipes;
        },
        ingredients: [],
        tags: [],
        shopping: [],
        datasetLoadError: undefined,
        dismissDatasetLoadError: jest.fn(),
        isDatabaseReady: true,
        scalingProgress: undefined,
        addRecipe: jest.fn(),
        editRecipe: jest.fn(),
        deleteRecipe: jest.fn(),
        addIngredient: jest.fn(),
        editIngredient: jest.fn(),
        deleteIngredient: jest.fn(),
        addTag: jest.fn(),
        editTag: jest.fn(),
        deleteTag: jest.fn(),
        addRecipeToShopping: jest.fn(),
        purchaseIngredientInShoppingList: jest.fn(),
        clearShoppingList: jest.fn(),
        findSimilarRecipes: jest.fn(),
        findSimilarIngredients: jest.fn(),
        findSimilarTags: jest.fn(),
        getRandomIngredients: jest.fn(),
        getRandomTags: jest.fn(),
        searchRandomlyTags: jest.fn(),
        scaleAllRecipesForNewDefaultPersons: jest.fn(),
        isDatabaseEmpty: jest.fn(),
        addMultipleIngredients: jest.fn(),
        addMultipleTags: jest.fn(),
        addMultipleRecipes: jest.fn(),
      };

      const useRecipeDbSpy = jest
        .spyOn(require('@context/RecipeDatabaseContext'), 'useRecipeDatabase')
        .mockReturnValue(mockContext);

      const { getByTestId, rerender } = render(
        <WelcomeScreen onStartTutorial={mockOnStartTutorial} onSkip={mockOnSkip} />
      );

      await waitFor(() => {
        expect(getByTestId('WelcomeScreen::SkipButton')).toBeTruthy();
      });

      fireEvent.press(getByTestId('WelcomeScreen::SkipButton'));
      expect(mockOnSkip).not.toHaveBeenCalled();

      mockRecipes = [{ id: 1 }];
      rerender(<WelcomeScreen onStartTutorial={mockOnStartTutorial} onSkip={mockOnSkip} />);

      await waitFor(() => {
        expect(mockOnSkip).toHaveBeenCalledTimes(1);
      });

      useRecipeDbSpy.mockRestore();
    });
  });
});
