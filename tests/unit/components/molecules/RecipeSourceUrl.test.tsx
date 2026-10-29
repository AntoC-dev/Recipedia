import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { RecipeSourceUrl } from '@components/molecules/RecipeSourceUrl';
import * as Clipboard from 'expo-clipboard';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const testUrl = 'https://www.hellofresh.fr/recipes/keftas-de-boeuf-66e83b9e7dfc60d59bf5f913';
const defaultTestID = 'RecipeSourceUrl';

describe('RecipeSourceUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the source URL text', async () => {
    const { getByTestId } = await render(<RecipeSourceUrl sourceUrl={testUrl} />);

    expect(getByTestId(`${defaultTestID}::Text`).props.children).toBe(testUrl);
  });

  test('renders the label', async () => {
    const { getByTestId } = await render(<RecipeSourceUrl sourceUrl={testUrl} />);

    expect(getByTestId(`${defaultTestID}::Label`).props.children).toBe('sourceUrl.label');
  });

  test('renders the copy button', async () => {
    const { getByTestId } = await render(<RecipeSourceUrl sourceUrl={testUrl} />);

    expect(getByTestId(`${defaultTestID}::CopyButton`)).toBeTruthy();
  });

  test('copies URL to clipboard when copy button is pressed', async () => {
    const { getByTestId } = await render(<RecipeSourceUrl sourceUrl={testUrl} />);

    await fireEvent.press(getByTestId(`${defaultTestID}::CopyButton`));

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(testUrl);
    });
  });

  test('calls onCopied callback after copying', async () => {
    const mockOnCopied = jest.fn();
    const { getByTestId } = await render(
      <RecipeSourceUrl sourceUrl={testUrl} onCopied={mockOnCopied} />
    );

    await fireEvent.press(getByTestId(`${defaultTestID}::CopyButton`));

    await waitFor(() => {
      expect(mockOnCopied).toHaveBeenCalled();
    });
  });

  test('uses custom testID when provided', async () => {
    const customTestID = 'Recipe::RecipeSourceUrl';
    const { getByTestId } = await render(
      <RecipeSourceUrl sourceUrl={testUrl} testID={customTestID} />
    );

    expect(getByTestId(`${customTestID}::Text`).props.children).toBe(testUrl);
    expect(getByTestId(`${customTestID}::CopyButton`)).toBeTruthy();
  });

  test('does not crash when onCopied is not provided', async () => {
    const { getByTestId } = await render(<RecipeSourceUrl sourceUrl={testUrl} />);

    await fireEvent.press(getByTestId(`${defaultTestID}::CopyButton`));

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(testUrl);
    });
  });
});
