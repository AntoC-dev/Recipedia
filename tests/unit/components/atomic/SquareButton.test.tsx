import { fireEvent, render } from '@testing-library/react-native';
import { SquareButton } from '@components/atomic/SquareButton';
import React from 'react';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';

const mockRecipe: recipeTableElement = {
  id: 1,
  title: 'Test Recipe',
  image_Source: 'https://example.com/recipe.jpg',
  description: 'A test recipe',
  ingredients: [],
  preparation: [],
  tags: [],
  persons: 4,
  time: 30,
  season: [],
};

describe('SquareButton', () => {
  const defaultImageProps = {
    type: 'image' as const,
    imgSrc: 'https://example.com/image.jpg',
    side: 100,
    onPressFunction: jest.fn(),
    testID: 'test-button',
  };

  const defaultRecipeProps = {
    type: 'recipe' as const,
    recipe: mockRecipe,
    side: 100,
    onPressFunction: jest.fn(),
    testID: 'test-button',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with image type', () => {
    const { getByTestId } = render(<SquareButton {...defaultImageProps} />);

    expect(getByTestId('test-button::SquareButton')).toBeTruthy();
  });

  test('renders with recipe type', () => {
    const { getByTestId } = render(<SquareButton {...defaultRecipeProps} />);

    expect(getByTestId('test-button::SquareButton')).toBeTruthy();
  });

  test('calls onPressFunction when pressed', () => {
    const onPressFunction = jest.fn();
    const { getByTestId } = render(
      <SquareButton {...defaultImageProps} onPressFunction={onPressFunction} />
    );

    fireEvent.press(getByTestId('test-button::SquareButton').parent!);

    expect(onPressFunction).toHaveBeenCalledTimes(1);
  });

  test('renders CustomImage with correct testID for image type', () => {
    const { getByTestId } = render(<SquareButton {...defaultImageProps} />);

    expect(getByTestId('test-button::SquareButton')).toBeTruthy();
  });

  test('renders CustomImage with correct testID for recipe type', () => {
    const { getByTestId } = render(<SquareButton {...defaultRecipeProps} />);

    expect(getByTestId('test-button::SquareButton')).toBeTruthy();
  });
});
