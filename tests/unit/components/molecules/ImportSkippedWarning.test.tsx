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

  test('renders warning title', () => {
    const { getByTestId } = render(<ImportSkippedWarning {...defaultProps} />);

    expect(getByTestId('test-warning::Title')).toBeTruthy();
  });

  test('renders warning body', () => {
    const { getByTestId } = render(<ImportSkippedWarning {...defaultProps} />);

    expect(getByTestId('test-warning::Body')).toBeTruthy();
  });

  test('renders SkippedRecipesList with correct testID', () => {
    const { getByTestId } = render(<ImportSkippedWarning {...defaultProps} />);

    expect(getByTestId('test-warning::SkippedList')).toBeTruthy();
  });

  test('renders SkippedRecipesList with skippedRecipes items', () => {
    const { getByTestId } = render(<ImportSkippedWarning {...defaultProps} />);

    expect(getByTestId('test-warning::SkippedList::Item::0')).toBeTruthy();
  });

  test('renders continue button', () => {
    const { getByTestId } = render(<ImportSkippedWarning {...defaultProps} />);

    expect(getByTestId('test-warning::ContinueButton')).toBeTruthy();
  });

  test('calls onContinue when continue button is pressed', () => {
    const onContinue = jest.fn();
    const { getByTestId } = render(
      <ImportSkippedWarning {...defaultProps} onContinue={onContinue} />
    );

    fireEvent.press(getByTestId('test-warning::ContinueButton'));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  test('applies testID to root element', () => {
    const { getByTestId } = render(<ImportSkippedWarning {...defaultProps} />);

    expect(getByTestId('test-warning')).toBeTruthy();
  });
});
