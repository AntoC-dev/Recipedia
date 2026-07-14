import { fireEvent, render } from '@testing-library/react-native';
import { DismissedRecipeCard } from '@components/molecules/DismissedRecipeCard';
import React from 'react';
import { dismissedRecipeTableElement } from '@customTypes/DatabaseElementTypes';

const mockRecipe: dismissedRecipeTableElement = {
  id: 1,
  providerId: 'hellofresh',
  recipeUrl: 'https://hellofresh.com/recipe-1',
  title: 'Dismissed Recipe',
  imageUrl: 'https://hellofresh.com/image-1.jpg',
  dismissedAt: 1700000000000,
};

describe('DismissedRecipeCard', () => {
  const defaultProps = {
    testIdPrefix: 'test-card',
    recipe: mockRecipe,
    onRestore: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders recipe title', () => {
    const { getByTestId } = render(<DismissedRecipeCard {...defaultProps} />);

    expect(getByTestId('test-card::Title').props.children).toBe('Dismissed Recipe');
  });

  test('renders the recipe thumbnail', () => {
    const { getByTestId } = render(<DismissedRecipeCard {...defaultProps} />);

    expect(getByTestId('test-card::Thumbnail')).toBeTruthy();
  });

  test('renders restore button', () => {
    const { getByTestId } = render(<DismissedRecipeCard {...defaultProps} />);

    expect(getByTestId('test-card::RestoreButton')).toBeTruthy();
  });

  test('calls onRestore when restore button pressed', () => {
    const onRestore = jest.fn();
    const { getByTestId } = render(<DismissedRecipeCard {...defaultProps} onRestore={onRestore} />);

    fireEvent.press(getByTestId('test-card::RestoreButton'));

    expect(onRestore).toHaveBeenCalledTimes(1);
  });
});
