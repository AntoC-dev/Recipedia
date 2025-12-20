import { render } from '@testing-library/react-native';
import { RecipeCardSkeleton } from '@components/molecules/RecipeCardSkeleton';
import React from 'react';

describe('RecipeCardSkeleton', () => {
  test('renders with correct testID', () => {
    const { getByTestId } = render(<RecipeCardSkeleton testID='test-skeleton' />);

    expect(getByTestId('test-skeleton')).toBeTruthy();
  });

  test('renders card structure', () => {
    const { getByTestId } = render(<RecipeCardSkeleton testID='test-skeleton' />);

    const card = getByTestId('test-skeleton');
    expect(card.type).toBe('View');
  });

  test('renders animated skeleton elements', () => {
    const { getByTestId } = render(<RecipeCardSkeleton testID='test-skeleton' />);

    const card = getByTestId('test-skeleton');
    expect(card.children).toBeDefined();
  });
});
