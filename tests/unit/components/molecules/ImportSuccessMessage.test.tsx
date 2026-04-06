import { fireEvent, render } from '@testing-library/react-native';
import { ImportSuccessMessage } from '@components/molecules/ImportSuccessMessage';
import React from 'react';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/molecules/SkippedRecipesList', () => ({
  SkippedRecipesList: require('@mocks/components/molecules/SkippedRecipesList-mock')
    .SkippedRecipesListMock,
}));

const skippedRecipe = {
  title: 'Filet mignon sauce curry rouge',
  sourceUrl: 'https://www.quitoque.fr/recettes/filet-mignon-curry',
};

describe('ImportSuccessMessage', () => {
  const defaultProps = {
    importedCount: 5,
    onFinish: jest.fn(),
    testID: 'test-success',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays import complete title', () => {
    const { getByText } = render(<ImportSuccessMessage {...defaultProps} />);

    expect(getByText('bulkImport.validation.importComplete')).toBeTruthy();
  });

  test('displays imported count message in plural', () => {
    const { getByText } = render(<ImportSuccessMessage {...defaultProps} />);

    expect(getByText('bulkImport.validation.recipesImportedPlural')).toBeTruthy();
  });

  test('displays imported count message in singular when count is 1', () => {
    const { getByText } = render(<ImportSuccessMessage {...defaultProps} importedCount={1} />);

    expect(getByText('bulkImport.validation.recipesImported')).toBeTruthy();
  });

  test('renders finish button with testID', () => {
    const { getByTestId } = render(<ImportSuccessMessage {...defaultProps} />);

    expect(getByTestId('test-success::FinishButton')).toBeTruthy();
  });

  test('calls onFinish when button pressed', () => {
    const onFinish = jest.fn();
    const { getByTestId } = render(<ImportSuccessMessage {...defaultProps} onFinish={onFinish} />);

    fireEvent.press(getByTestId('test-success::FinishButton'));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  test('displays finish button label', () => {
    const { getByText } = render(<ImportSuccessMessage {...defaultProps} />);

    expect(getByText('bulkImport.validation.finish')).toBeTruthy();
  });

  test('does not show skipped section when skippedRecipes is undefined', () => {
    const { queryByTestId } = render(<ImportSuccessMessage {...defaultProps} />);

    expect(queryByTestId('test-success::SkippedHeader')).toBeNull();
  });

  test('does not show skipped section when skippedRecipes is empty', () => {
    const { queryByTestId } = render(
      <ImportSuccessMessage {...defaultProps} skippedRecipes={[]} />
    );

    expect(queryByTestId('test-success::SkippedHeader')).toBeNull();
  });

  test('shows skipped header in singular when one recipe is skipped', () => {
    const { getByText } = render(
      <ImportSuccessMessage {...defaultProps} skippedRecipes={[skippedRecipe]} />
    );

    expect(getByText('bulkImport.validation.skippedSectionTitle')).toBeTruthy();
  });

  test('shows skipped header in plural when multiple recipes are skipped', () => {
    const secondSkipped = { title: 'Poulet rôti', sourceUrl: 'https://example.com/poulet' };
    const { getByText } = render(
      <ImportSuccessMessage {...defaultProps} skippedRecipes={[skippedRecipe, secondSkipped]} />
    );

    expect(getByText('bulkImport.validation.skippedSectionTitlePlural')).toBeTruthy();
  });

  test('shows SkippedRecipesList when skippedRecipes is non-empty', () => {
    const { getByTestId } = render(
      <ImportSuccessMessage {...defaultProps} skippedRecipes={[skippedRecipe]} />
    );

    expect(getByTestId('test-success::SkippedList')).toBeTruthy();
  });

  test('passes skipped recipes to SkippedRecipesList', () => {
    const { getByTestId } = render(
      <ImportSuccessMessage {...defaultProps} skippedRecipes={[skippedRecipe]} />
    );

    expect(getByTestId('test-success::SkippedList::Item::0')).toBeTruthy();
  });

  test('renders finish button in skipped layout', () => {
    const { getByTestId } = render(
      <ImportSuccessMessage {...defaultProps} skippedRecipes={[skippedRecipe]} />
    );

    expect(getByTestId('test-success::FinishButton')).toBeTruthy();
  });

  test('calls onFinish when finish button pressed in skipped layout', () => {
    const onFinish = jest.fn();
    const { getByTestId } = render(
      <ImportSuccessMessage
        {...defaultProps}
        onFinish={onFinish}
        skippedRecipes={[skippedRecipe]}
      />
    );

    fireEvent.press(getByTestId('test-success::FinishButton'));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
