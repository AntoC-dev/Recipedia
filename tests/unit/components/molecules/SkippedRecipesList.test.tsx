import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SkippedRecipesList } from '@components/molecules/SkippedRecipesList';
import * as Clipboard from 'expo-clipboard';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const recipe1 = {
  title: 'Filet mignon sauce curry rouge',
  sourceUrl: 'https://www.quitoque.fr/recettes/filet-mignon-curry',
};
const recipe2 = {
  title: 'Poulet rôti aux herbes',
  sourceUrl: 'https://www.quitoque.fr/recettes/poulet-roti',
};

describe('SkippedRecipesList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when list is empty', () => {
    const { queryByTestId } = render(
      <SkippedRecipesList skippedRecipes={[]} testID='SkippedList' />
    );

    expect(queryByTestId('SkippedList::Item::0')).toBeNull();
  });

  test('renders a list item for each skipped recipe', () => {
    const { getByTestId } = render(
      <SkippedRecipesList skippedRecipes={[recipe1, recipe2]} testID='SkippedList' />
    );

    expect(getByTestId('SkippedList::Item::0')).toBeTruthy();
    expect(getByTestId('SkippedList::Item::1')).toBeTruthy();
  });

  test('renders copy button for each recipe', () => {
    const { getByTestId } = render(
      <SkippedRecipesList skippedRecipes={[recipe1, recipe2]} testID='SkippedList' />
    );

    expect(getByTestId('SkippedList::Item::0::CopyButton')).toBeTruthy();
    expect(getByTestId('SkippedList::Item::1::CopyButton')).toBeTruthy();
  });

  test('copies the correct URL when copy button is pressed', async () => {
    const { getByTestId } = render(
      <SkippedRecipesList skippedRecipes={[recipe1, recipe2]} testID='SkippedList' />
    );

    fireEvent.press(getByTestId('SkippedList::Item::0::CopyButton'));

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(recipe1.sourceUrl);
    });
  });

  test('copies the URL of the second recipe when its copy button is pressed', async () => {
    const { getByTestId } = render(
      <SkippedRecipesList skippedRecipes={[recipe1, recipe2]} testID='SkippedList' />
    );

    fireEvent.press(getByTestId('SkippedList::Item::1::CopyButton'));

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(recipe2.sourceUrl);
    });
  });

  test('shows snackbar after copying', async () => {
    const { getByTestId } = render(
      <SkippedRecipesList skippedRecipes={[recipe1]} testID='SkippedList' />
    );

    fireEvent.press(getByTestId('SkippedList::Item::0::CopyButton'));

    await waitFor(() => {
      expect(getByTestId('SkippedList::Snackbar')).toBeTruthy();
    });
  });

  test('renders the FlatList container with testID', () => {
    const { getByTestId } = render(
      <SkippedRecipesList skippedRecipes={[recipe1]} testID='SkippedList' />
    );

    expect(getByTestId('SkippedList')).toBeTruthy();
  });
});
