import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ImportSkippedWarning } from '@components/molecules/ImportSkippedWarning';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/molecules/SkippedRecipesList', () => ({
  SkippedRecipesList: require('@mocks/components/molecules/SkippedRecipesList-mock')
    .SkippedRecipesListMock,
}));

const skippedRecipes = [
  {
    title: 'Filet mignon sauce curry rouge',
    sourceUrl: 'https://www.quitoque.fr/recettes/filet-mignon-curry',
  },
];

describe('ImportSkippedWarning', () => {
  const defaultProps = {
    skippedRecipes,
    onContinue: jest.fn(),
    testID: 'test-warning',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders warning title', async () => {
    const { getByTestId } = await render(<ImportSkippedWarning {...defaultProps} />);

    expect(getByTestId('test-warning::Title')).toBeTruthy();
  });

  test('renders warning body', async () => {
    const { getByTestId } = await render(<ImportSkippedWarning {...defaultProps} />);

    expect(getByTestId('test-warning::Body')).toBeTruthy();
  });

  test('renders SkippedRecipesList with correct testID', async () => {
    const { getByTestId } = await render(<ImportSkippedWarning {...defaultProps} />);

    expect(getByTestId('test-warning::SkippedList')).toBeTruthy();
  });

  test('renders SkippedRecipesList with skippedRecipes items', async () => {
    const { getByTestId } = await render(<ImportSkippedWarning {...defaultProps} />);

    expect(getByTestId('test-warning::SkippedList::Item::0')).toBeTruthy();
  });

  test('renders continue button', async () => {
    const { getByTestId } = await render(<ImportSkippedWarning {...defaultProps} />);

    expect(getByTestId('test-warning::ContinueButton')).toBeTruthy();
  });

  test('calls onContinue when continue button is pressed', async () => {
    const onContinue = jest.fn();
    const { getByTestId } = await render(
      <ImportSkippedWarning {...defaultProps} onContinue={onContinue} />
    );

    await fireEvent.press(getByTestId('test-warning::ContinueButton'));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  test('applies testID to root element', async () => {
    const { getByTestId } = await render(<ImportSkippedWarning {...defaultProps} />);

    expect(getByTestId('test-warning')).toBeTruthy();
  });
});
