import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import AppWrapper from '@components/organisms/AppWrapper';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';

jest.mock('@navigation/RootNavigator', () =>
  require('@mocks/navigation/RootNavigator-mock').rootNavigatorMock()
);
jest.mock('@screens/WelcomeScreen', () =>
  require('@mocks/screens/WelcomeScreen-mock').welcomeScreenMock()
);
jest.mock('@components/organisms/TutorialController', () =>
  require('@mocks/components/organisms/TutorialController-mock').tutorialControllerMock()
);

jest.mock('@utils/firstLaunch', () => require('@mocks/utils/firstLaunch-mock').firstLaunchMock());

describe('AppWrapper Component', () => {
  const { isFirstLaunch, markAsLaunched } = require('@utils/firstLaunch');
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    jest.clearAllMocks();
    await database.init();
  });

  afterEach(async () => {
    cleanup();
    jest.clearAllTimers();
    await database.closeAndReset();
  });

  test('shows loading state initially', () => {
    isFirstLaunch.mockImplementation(() => new Promise(() => {}));

    const { queryByTestId } = render(
      <RecipeDatabaseProvider>
        <AppWrapper />
      </RecipeDatabaseProvider>
    );

    expect(queryByTestId('WelcomeScreen')).toBeNull();
    expect(queryByTestId('TutorialProvider')).toBeNull();
    expect(queryByTestId('RootNavigator')).toBeNull();
  });

  test('shows welcome screen on first launch', async () => {
    isFirstLaunch.mockResolvedValue(true);

    const { getByTestId, queryByTestId } = render(
      <RecipeDatabaseProvider>
        <AppWrapper />
      </RecipeDatabaseProvider>
    );

    await waitFor(() => {
      expect(getByTestId('WelcomeScreen')).toBeTruthy();
      expect(queryByTestId('TutorialProvider')).toBeNull();
      expect(queryByTestId('RootNavigator')).toBeNull();
    });
  });

  test('shows main app when not first launch', async () => {
    isFirstLaunch.mockResolvedValue(false);

    const { getByTestId, queryByTestId } = render(
      <RecipeDatabaseProvider>
        <AppWrapper />
      </RecipeDatabaseProvider>
    );

    await waitFor(() => {
      expect(getByTestId('RootNavigator')).toBeTruthy();
      expect(queryByTestId('WelcomeScreen')).toBeNull();
      expect(queryByTestId('TutorialProvider')).toBeNull();
    });
  });

  test('starts tutorial when requested from welcome screen', async () => {
    isFirstLaunch.mockResolvedValue(true);

    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);

    const { getByTestId, queryByTestId } = render(
      <RecipeDatabaseProvider>
        <AppWrapper />
      </RecipeDatabaseProvider>
    );

    await waitFor(() => {
      expect(getByTestId('WelcomeScreen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('WelcomeScreen::StartTutorial'));

    await waitFor(() => {
      expect(getByTestId('TutorialProvider')).toBeTruthy();
      expect(queryByTestId('WelcomeScreen')).toBeNull();
    });
  });

  test('skips to main app from welcome screen', async () => {
    isFirstLaunch.mockResolvedValue(true);

    const { getByTestId, queryByTestId } = render(
      <RecipeDatabaseProvider>
        <AppWrapper />
      </RecipeDatabaseProvider>
    );

    await waitFor(() => {
      expect(getByTestId('WelcomeScreen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('WelcomeScreen::Skip'));

    await waitFor(() => {
      expect(getByTestId('RootNavigator')).toBeTruthy();
      expect(queryByTestId('WelcomeScreen')).toBeNull();
      expect(queryByTestId('TutorialProvider')).toBeNull();
    });

    expect(markAsLaunched).toHaveBeenCalled();
    expect(database.get_menu().length).toBe(0);
  });

  test('completes tutorial and goes to main app', async () => {
    isFirstLaunch.mockResolvedValue(true);

    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);

    const { getByTestId, queryByTestId } = render(
      <RecipeDatabaseProvider>
        <AppWrapper />
      </RecipeDatabaseProvider>
    );

    await waitFor(() => {
      expect(getByTestId('WelcomeScreen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('WelcomeScreen::StartTutorial'));

    await waitFor(() => {
      expect(getByTestId('TutorialProvider')).toBeTruthy();
      expect(queryByTestId('WelcomeScreen')).toBeNull();
    });

    fireEvent.press(getByTestId('TutorialProvider::Complete'));

    await waitFor(() => {
      expect(getByTestId('RootNavigator')).toBeTruthy();
    });

    await waitFor(() => {
      expect(queryByTestId('WelcomeScreen')).toBeNull();
    });

    await waitFor(() => {
      expect(queryByTestId('TutorialProvider')).toBeNull();
    });

    expect(markAsLaunched).toHaveBeenCalled();
    expect(database.get_menu().length).toBe(0);
  });

  test('adds recipes to menu when starting tutorial', async () => {
    isFirstLaunch.mockResolvedValue(true);

    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);

    const { getByTestId, queryByTestId } = render(
      <RecipeDatabaseProvider>
        <AppWrapper />
      </RecipeDatabaseProvider>
    );

    await waitFor(() => {
      expect(getByTestId('WelcomeScreen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('WelcomeScreen::StartTutorial'));

    await waitFor(() => {
      expect(getByTestId('TutorialProvider')).toBeTruthy();
      expect(queryByTestId('WelcomeScreen')).toBeNull();
    });

    expect(database.get_menu().length).toBe(3);
    expect(database.get_menu().map(m => m.recipeTitle)).toEqual(
      testRecipes.slice(0, 3).map(r => r.title)
    );
  });

  test('clears menu on app launch', async () => {
    isFirstLaunch.mockResolvedValue(true);

    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
    await database.addRecipeToMenu(testRecipes[0]);
    await database.addRecipeToMenu(testRecipes[1]);
    expect(database.get_menu().length).toBeGreaterThan(0);

    const { getByTestId, queryByTestId } = render(
      <RecipeDatabaseProvider>
        <AppWrapper />
      </RecipeDatabaseProvider>
    );

    await waitFor(() => {
      expect(getByTestId('WelcomeScreen')).toBeTruthy();
    });

    const skipButton = getByTestId('WelcomeScreen::Skip');
    fireEvent.press(skipButton);

    await waitFor(() => {
      expect(getByTestId('RootNavigator')).toBeTruthy();
    });

    await waitFor(() => {
      expect(queryByTestId('WelcomeScreen')).toBeNull();
    });

    await waitFor(() => {
      expect(queryByTestId('TutorialProvider')).toBeNull();
    });

    expect(database.get_menu().length).toBe(0);
  });
});
