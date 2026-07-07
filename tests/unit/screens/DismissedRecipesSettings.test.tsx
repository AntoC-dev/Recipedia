import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { DismissedRecipesSettings } from '@screens/DismissedRecipesSettings';
import React from 'react';
import { mockGoBack } from '@mocks/deps/react-navigation-mock';
import RecipeDatabase from '@utils/RecipeDatabase';

jest.mock('@react-navigation/native', () => {
  const { reactNavigationMock } = require('@mocks/deps/react-navigation-mock');
  return reactNavigationMock();
});

describe('DismissedRecipesSettings', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    jest.clearAllMocks();
    database = RecipeDatabase.getInstance();
    await database.init();
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('renders app bar with title', () => {
    const { getByTestId } = render(<DismissedRecipesSettings />);

    expect(getByTestId('DismissedRecipesSettings::AppBar')).toBeTruthy();
  });

  test('shows empty state when no dismissed recipes', () => {
    const { getByTestId } = render(<DismissedRecipesSettings />);

    expect(getByTestId('DismissedRecipesSettings::Empty')).toBeTruthy();
  });

  test('groups a dismissed recipe under its provider accordion', async () => {
    await database.markRecipesAsDismissed('hellofresh', [
      { url: 'https://hellofresh.com/recipe-1', title: 'Dismissed Recipe' },
    ]);

    const { getByTestId } = render(<DismissedRecipesSettings />);

    expect(getByTestId('DismissedRecipesSettings::hellofresh')).toBeTruthy();
    expect(getByTestId('DismissedRecipesSettings::hellofresh::0::Title').props.children).toBe(
      'Dismissed Recipe'
    );
  });

  test('shows a separate accordion per provider', async () => {
    await database.markRecipesAsDismissed('hellofresh', [
      { url: 'https://hellofresh.com/recipe-1', title: 'HelloFresh Recipe' },
    ]);
    await database.markRecipesAsDismissed('quitoque', [
      { url: 'https://quitoque.fr/recipe-1', title: 'Quitoque Recipe' },
    ]);

    const { getByTestId } = render(<DismissedRecipesSettings />);

    expect(getByTestId('DismissedRecipesSettings::hellofresh')).toBeTruthy();
    expect(getByTestId('DismissedRecipesSettings::quitoque')).toBeTruthy();
  });

  test('shows the singular count for a provider with one dismissed recipe', async () => {
    await database.markRecipesAsDismissed('hellofresh', [
      { url: 'https://hellofresh.com/recipe-1', title: 'Recipe 1' },
    ]);

    const { getByTestId } = render(<DismissedRecipesSettings />);

    expect(getByTestId('DismissedRecipesSettings::hellofresh::Description').props.children).toBe(
      'bulkImport.dismissed.count'
    );
  });

  test('shows the plural count for a provider with multiple dismissed recipes', async () => {
    await database.markRecipesAsDismissed('hellofresh', [
      { url: 'https://hellofresh.com/recipe-1', title: 'Recipe 1' },
      { url: 'https://hellofresh.com/recipe-2', title: 'Recipe 2' },
    ]);

    const { getByTestId } = render(<DismissedRecipesSettings />);

    expect(getByTestId('DismissedRecipesSettings::hellofresh::Description').props.children).toBe(
      'bulkImport.dismissed.countPlural'
    );
  });

  test('restores a recipe and removes it from the list', async () => {
    const url = 'https://hellofresh.com/recipe-1';
    await database.markRecipesAsDismissed('hellofresh', [{ url, title: 'Dismissed Recipe' }]);

    const { getByTestId, queryByTestId } = render(<DismissedRecipesSettings />);

    fireEvent.press(getByTestId('DismissedRecipesSettings::hellofresh::0::RestoreButton'));

    await waitFor(() => {
      expect(queryByTestId('DismissedRecipesSettings::hellofresh::0::Title')).toBeNull();
    });
    expect(database.getDismissedUrls('hellofresh').has(url)).toBe(false);
  });

  test('navigates back when app bar back pressed', () => {
    const { getByTestId } = render(<DismissedRecipesSettings />);

    fireEvent.press(getByTestId('DismissedRecipesSettings::AppBar::BackButton'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
