import { fireEvent, render } from '@testing-library/react-native';
import { RecipeSelectionCard } from '@components/molecules/RecipeSelectionCard';
import React from 'react';
import { DiscoveredRecipe } from '@customTypes/BulkImportTypes';

const mockRecipe: DiscoveredRecipe = {
  url: 'https://example.com/recipe-1',
  title: 'Test Recipe',
  imageUrl: 'https://example.com/image.jpg',
};

describe('RecipeSelectionCard', () => {
  const defaultProps = {
    testId: 'test-card',
    recipe: mockRecipe,
    isSelected: false,
    onSelected: jest.fn(),
    onUnselected: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders recipe title', () => {
    const { getByTestId } = render(<RecipeSelectionCard {...defaultProps} />);

    expect(getByTestId('test-card::Title').props.children).toBe('Test Recipe');
  });

  test('renders thumbnail with recipe image', () => {
    const { getByTestId } = render(<RecipeSelectionCard {...defaultProps} />);

    expect(getByTestId('test-card::Thumbnail')).toBeTruthy();
  });

  test('renders checkbox unchecked when not selected', () => {
    const { getByTestId } = render(<RecipeSelectionCard {...defaultProps} />);

    expect(getByTestId('test-card::Checkbox::Status').props.children).toBe('unchecked');
  });

  test('renders checkbox checked when selected', () => {
    const { getByTestId } = render(<RecipeSelectionCard {...defaultProps} isSelected={true} />);

    expect(getByTestId('test-card::Checkbox::Status').props.children).toBe('checked');
  });

  test('calls onSelected when card pressed while unselected', () => {
    const onSelected = jest.fn();
    const { getByTestId } = render(
      <RecipeSelectionCard {...defaultProps} onSelected={onSelected} />
    );

    fireEvent.press(getByTestId('test-card'));

    expect(onSelected).toHaveBeenCalledTimes(1);
  });

  test('calls onUnselected when card pressed while selected', () => {
    const onUnselected = jest.fn();
    const { getByTestId } = render(
      <RecipeSelectionCard {...defaultProps} isSelected={true} onUnselected={onUnselected} />
    );

    fireEvent.press(getByTestId('test-card'));

    expect(onUnselected).toHaveBeenCalledTimes(1);
  });

  test('calls onSelected when checkbox pressed while unselected', () => {
    const onSelected = jest.fn();
    const { getByTestId } = render(
      <RecipeSelectionCard {...defaultProps} onSelected={onSelected} />
    );

    fireEvent.press(getByTestId('test-card::Checkbox'));

    expect(onSelected).toHaveBeenCalledTimes(1);
  });
});
