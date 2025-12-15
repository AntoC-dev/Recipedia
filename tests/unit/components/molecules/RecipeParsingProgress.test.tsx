import { render } from '@testing-library/react-native';
import { RecipeParsingProgress } from '@components/molecules/RecipeParsingProgress';
import React from 'react';
import { ParsingProgress } from '@customTypes/BulkImportTypes';

describe('RecipeParsingProgress', () => {
  const defaultProgress: ParsingProgress = {
    phase: 'parsing',
    current: 3,
    total: 10,
    currentRecipeTitle: 'Current Recipe',
    parsedRecipes: [],
    failedRecipes: [],
  };

  const defaultProps = {
    progress: defaultProgress,
    selectedCount: 10,
    testID: 'test-progress',
  };

  test('displays progress counter', () => {
    const { getByText } = render(<RecipeParsingProgress {...defaultProps} />);

    expect(getByText('3 / 10')).toBeTruthy();
  });

  test('displays current recipe title', () => {
    const { getByText } = render(<RecipeParsingProgress {...defaultProps} />);

    expect(getByText('Current Recipe')).toBeTruthy();
  });

  test('displays progress bar with testID', () => {
    const { getByTestId } = render(<RecipeParsingProgress {...defaultProps} />);

    expect(getByTestId('test-progress::ParsingProgressBar')).toBeTruthy();
  });

  test('does not display current recipe title when null', () => {
    const { queryByText } = render(
      <RecipeParsingProgress
        {...defaultProps}
        progress={{ ...defaultProgress, currentRecipeTitle: undefined }}
      />
    );

    expect(queryByText('Current Recipe')).toBeNull();
  });

  test('displays failed recipes count when failures exist', () => {
    const progressWithFailures: ParsingProgress = {
      ...defaultProgress,
      failedRecipes: [
        { url: 'url1', title: 'Failed 1', error: 'Error' },
        { url: 'url2', title: 'Failed 2', error: 'Error' },
      ],
    };

    const { getByText } = render(
      <RecipeParsingProgress {...defaultProps} progress={progressWithFailures} />
    );

    expect(getByText('bulkImport.selection.failedRecipes')).toBeTruthy();
  });

  test('does not display failed recipes count when no failures', () => {
    const { queryByText } = render(<RecipeParsingProgress {...defaultProps} />);

    expect(queryByText(/failed/i)).toBeNull();
  });

  test('uses selectedCount when progress is null', () => {
    const { getByText } = render(
      <RecipeParsingProgress progress={null} selectedCount={5} testID='test' />
    );

    expect(getByText('0 / 5')).toBeTruthy();
  });

  test('displays parsing title', () => {
    const { getByText } = render(<RecipeParsingProgress {...defaultProps} />);

    expect(getByText('bulkImport.selection.parsingRecipes')).toBeTruthy();
  });
});
