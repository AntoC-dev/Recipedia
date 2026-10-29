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

  test('renders recipe title', async () => {
    const { getByTestId } = await render(<RecipeSelectionCard {...defaultProps} />);

    expect(getByTestId('test-card::Title').props.children).toBe('Test Recipe');
  });

  test('renders thumbnail with recipe image', async () => {
    const { getByTestId } = await render(<RecipeSelectionCard {...defaultProps} />);

    expect(getByTestId('test-card::Thumbnail')).toBeTruthy();
  });

  test('renders checkbox unchecked when not selected', async () => {
    const { getByTestId } = await render(<RecipeSelectionCard {...defaultProps} />);

    expect(getByTestId('test-card::Checkbox::Status').props.children).toBe('unchecked');
  });

  test('renders checkbox checked when selected', async () => {
    const { getByTestId } = await render(
      <RecipeSelectionCard {...defaultProps} isSelected={true} />
    );

    expect(getByTestId('test-card::Checkbox::Status').props.children).toBe('checked');
  });

  test('calls onSelected when card pressed while unselected', async () => {
    const onSelected = jest.fn();
    const { getByTestId } = await render(
      <RecipeSelectionCard {...defaultProps} onSelected={onSelected} />
    );

    await fireEvent.press(getByTestId('test-card'));

    expect(onSelected).toHaveBeenCalledTimes(1);
  });

  test('calls onUnselected when card pressed while selected', async () => {
    const onUnselected = jest.fn();
    const { getByTestId } = await render(
      <RecipeSelectionCard {...defaultProps} isSelected={true} onUnselected={onUnselected} />
    );

    await fireEvent.press(getByTestId('test-card'));

    expect(onUnselected).toHaveBeenCalledTimes(1);
  });

  test('calls onSelected when checkbox pressed while unselected', async () => {
    const onSelected = jest.fn();
    const { getByTestId } = await render(
      <RecipeSelectionCard {...defaultProps} onSelected={onSelected} />
    );

    await fireEvent.press(getByTestId('test-card::Checkbox'));

    expect(onSelected).toHaveBeenCalledTimes(1);
  });

  test('renders seen indicator for previously seen recipes', async () => {
    const seenRecipe: DiscoveredRecipe = { ...mockRecipe, memoryStatus: 'seen' };
    const { getByTestId } = await render(
      <RecipeSelectionCard {...defaultProps} recipe={seenRecipe} />
    );

    expect(getByTestId('test-card::SeenIndicator')).toBeTruthy();
  });

  test('places seen indicator testID on the badge container, not the paper Icon', async () => {
    const seenRecipe: DiscoveredRecipe = { ...mockRecipe, memoryStatus: 'seen' };
    const { queryByTestId } = await render(
      <RecipeSelectionCard {...defaultProps} recipe={seenRecipe} />
    );

    expect(queryByTestId('test-card::SeenIndicator::Source')).toBeNull();
  });

  test('does not render seen indicator for fresh recipes', async () => {
    const { queryByTestId } = await render(<RecipeSelectionCard {...defaultProps} />);

    expect(queryByTestId('test-card::SeenIndicator')).toBeNull();
  });

  test('renders dismiss button', async () => {
    const { getByTestId } = await render(<RecipeSelectionCard {...defaultProps} />);

    expect(getByTestId('test-card::DismissButton')).toBeTruthy();
  });

  test('calls onDismiss when dismiss button pressed', async () => {
    const onDismiss = jest.fn();
    const { getByTestId } = await render(
      <RecipeSelectionCard {...defaultProps} onDismiss={onDismiss} />
    );

    await fireEvent.press(getByTestId('test-card::DismissButton'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('does not toggle selection when dismiss button pressed', async () => {
    const onSelected = jest.fn();
    const { getByTestId } = await render(
      <RecipeSelectionCard {...defaultProps} onSelected={onSelected} />
    );

    await fireEvent.press(getByTestId('test-card::DismissButton'));

    expect(onSelected).not.toHaveBeenCalled();
  });

  describe('when dismissed', () => {
    const dismissedProps = { ...defaultProps, isDismissed: true };

    test('renders restore button instead of dismiss button', async () => {
      const { getByTestId, queryByTestId } = await render(
        <RecipeSelectionCard {...dismissedProps} />
      );

      expect(getByTestId('test-card::RestoreButton')).toBeTruthy();
      expect(queryByTestId('test-card::DismissButton')).toBeNull();
    });

    test('calls onRestore when restore button pressed', async () => {
      const onRestore = jest.fn();
      const { getByTestId } = await render(
        <RecipeSelectionCard {...dismissedProps} onRestore={onRestore} />
      );

      await fireEvent.press(getByTestId('test-card::RestoreButton'));

      expect(onRestore).toHaveBeenCalledTimes(1);
    });

    test('does not toggle selection when the card is pressed', async () => {
      const onSelected = jest.fn();
      const { getByTestId } = await render(
        <RecipeSelectionCard {...dismissedProps} onSelected={onSelected} />
      );

      await fireEvent.press(getByTestId('test-card'));

      expect(onSelected).not.toHaveBeenCalled();
    });
  });
});
