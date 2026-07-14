import { fireEvent, render } from '@testing-library/react-native';
import { RecipeSelectionCard } from '@components/molecules/RecipeSelectionCard';
import React from 'react';
import { DiscoveredRecipe } from '@customTypes/BulkImportTypes';

const mockRecipe: DiscoveredRecipe = {
  url: 'https://example.com/recipe-1',
  title: 'Test Recipe',
  imageUrl: 'https://example.com/image.jpg',
  memoryStatus: 'fresh',
};

describe('RecipeSelectionCard', () => {
  const defaultProps = {
    testId: 'test-card',
    recipe: mockRecipe,
    isSelected: false,
    isDismissed: false,
    onSelected: jest.fn(),
    onUnselected: jest.fn(),
    onDismiss: jest.fn(),
    onRestore: jest.fn(),
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

  test('renders seen indicator for previously seen recipes', () => {
    const seenRecipe: DiscoveredRecipe = { ...mockRecipe, memoryStatus: 'seen' };
    const { getByTestId } = render(<RecipeSelectionCard {...defaultProps} recipe={seenRecipe} />);

    expect(getByTestId('test-card::SeenIndicator')).toBeTruthy();
  });

  test('places seen indicator testID on the badge container, not the paper Icon', () => {
    const seenRecipe: DiscoveredRecipe = { ...mockRecipe, memoryStatus: 'seen' };
    const { queryByTestId } = render(
      <RecipeSelectionCard {...defaultProps} recipe={seenRecipe} />
    );

    expect(queryByTestId('test-card::SeenIndicator::Source')).toBeNull();
  });

  test('does not render seen indicator for fresh recipes', () => {
    const { queryByTestId } = render(<RecipeSelectionCard {...defaultProps} />);

    expect(queryByTestId('test-card::SeenIndicator')).toBeNull();
  });

  test('renders dismiss button', () => {
    const { getByTestId } = render(<RecipeSelectionCard {...defaultProps} />);

    expect(getByTestId('test-card::DismissButton')).toBeTruthy();
  });

  test('calls onDismiss when dismiss button pressed', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(<RecipeSelectionCard {...defaultProps} onDismiss={onDismiss} />);

    fireEvent.press(getByTestId('test-card::DismissButton'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('does not toggle selection when dismiss button pressed', () => {
    const onSelected = jest.fn();
    const { getByTestId } = render(
      <RecipeSelectionCard {...defaultProps} onSelected={onSelected} />
    );

    fireEvent.press(getByTestId('test-card::DismissButton'));

    expect(onSelected).not.toHaveBeenCalled();
  });

  describe('when dismissed', () => {
    const dismissedProps = { ...defaultProps, isDismissed: true };

    test('renders restore button instead of dismiss button', () => {
      const { getByTestId, queryByTestId } = render(<RecipeSelectionCard {...dismissedProps} />);

      expect(getByTestId('test-card::RestoreButton')).toBeTruthy();
      expect(queryByTestId('test-card::DismissButton')).toBeNull();
    });

    test('calls onRestore when restore button pressed', () => {
      const onRestore = jest.fn();
      const { getByTestId } = render(
        <RecipeSelectionCard {...dismissedProps} onRestore={onRestore} />
      );

      fireEvent.press(getByTestId('test-card::RestoreButton'));

      expect(onRestore).toHaveBeenCalledTimes(1);
    });

    test('does not toggle selection when the card is pressed', () => {
      const onSelected = jest.fn();
      const { getByTestId } = render(
        <RecipeSelectionCard {...dismissedProps} onSelected={onSelected} />
      );

      fireEvent.press(getByTestId('test-card'));

      expect(onSelected).not.toHaveBeenCalled();
    });
  });
});
