import { render } from '@testing-library/react-native';
import Carousel, { CarouselItemProps } from '@components/molecules/Carousel';
import React from 'react';
import { testRecipes } from '@test-data/recipesDataset';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';

jest.mock('@components/molecules/RecipeCard', () => ({
  RecipeCard: require('@mocks/components/molecules/RecipeCard-mock').recipeCardMock,
}));

describe('Carousel Component', () => {
  const sampleRecipes: recipeTableElement[] = testRecipes.slice(0, 3);
  const emptyRecipes: recipeTableElement[] = [];
  const singleRecipe: recipeTableElement[] = [testRecipes[0]!];

  const renderCarousel = (overrideProps = {}) => {
    const defaultProps: CarouselItemProps = {
      items: sampleRecipes,
      testID: 'test-carousel',
      ...overrideProps,
    };
    return render(<Carousel {...defaultProps} />);
  };

  const assertRecipeCardRendering = (
    getByTestId: any,
    expectedCount: number,
    recipes: recipeTableElement[]
  ) => {
    for (let i = 0; i < expectedCount; i++) {
      const cardTestId = `test-carousel::Card::${i}`;

      expect(getByTestId(cardTestId)).toBeTruthy();
      expect(getByTestId(cardTestId + '::Size').props.children).toEqual('small');

      // Assert card receives recipe data
      const recipeData = JSON.parse(getByTestId(cardTestId + '::Recipe').props.children);
      expect(recipeData).toBeDefined();
      expect(recipeData.id).toEqual(recipes[i]!.id);
      expect(recipeData.title).toEqual(recipes[i]!.title);
      expect(recipeData.image_Source).toEqual(recipes[i]!.image_Source);
      expect(recipeData.description).toEqual(recipes[i]!.description);
      expect(recipeData.tags).toEqual(recipes[i]!.tags);
      expect(recipeData.ingredients).toEqual(recipes[i]!.ingredients);
      expect(recipeData.preparation).toEqual(recipes[i]!.preparation);
      expect(recipeData.season).toEqual(recipes[i]!.season);
      expect(recipeData.persons).toEqual(recipes[i]!.persons);
      expect(recipeData.time).toEqual(recipes[i]!.time);
    }
    // Verify cards beyond expected count don't exist
    expect(() => getByTestId(`test-carousel::Card::${expectedCount}`)).toThrow();
  };

  test('renders with correct recipe data and proper testIDs', () => {
    const { getByTestId } = renderCarousel();

    assertRecipeCardRendering(getByTestId, sampleRecipes.length, sampleRecipes);
  });

  test('handles empty recipe array gracefully', () => {
    const { queryByTestId } = renderCarousel({ items: emptyRecipes });

    // Assert no recipe cards are rendered with empty data
    expect(queryByTestId('test-carousel::Card::0')).toBeNull();
    expect(queryByTestId('test-carousel::Card::1')).toBeNull();
    expect(queryByTestId('test-carousel::Card::2')).toBeNull();
  });

  test('handles single recipe item correctly', () => {
    const { getByTestId } = renderCarousel({ items: singleRecipe });

    assertRecipeCardRendering(getByTestId, 1, singleRecipe);
  });

  test('uses different testID correctly for multiple instances', () => {
    const { getByTestId } = renderCarousel({ testID: 'custom-carousel-id' });

    // Assert recipe cards use custom testID
    expect(getByTestId('custom-carousel-id::Card::0')).toBeTruthy();
    expect(getByTestId('custom-carousel-id::Card::1')).toBeTruthy();
    expect(getByTestId('custom-carousel-id::Card::2')).toBeTruthy();

    // Assert old testID elements don't exist
    expect(() => getByTestId('test-carousel::Card::0')).toThrow();
    expect(() => getByTestId('test-carousel::Card::1')).toThrow();
    expect(() => getByTestId('test-carousel::Card::2')).toThrow();

    // Verify custom testID propagation to recipe cards
    const customRecipeCard = getByTestId('custom-carousel-id::Card::0');
    expect(customRecipeCard).toBeTruthy();
    expect(getByTestId('custom-carousel-id::Card::0::Size').props.children).toEqual('small');
  });

  test('maintains performance with large recipe arrays', () => {
    const { getByTestId } = renderCarousel({ items: testRecipes });

    assertRecipeCardRendering(getByTestId, testRecipes.length, testRecipes);
  });

  test('handles recipe data variations correctly', () => {
    // Create recipes with different data characteristics
    const variedRecipes = [
      { ...testRecipes[0]!, title: 'Recipe with Special Characters: café & créme' },
      { ...testRecipes[1]!, title: '' }, // Empty title
      {
        ...testRecipes[2]!,
        title: 'Very Long Recipe Title That Might Cause Layout Issues Or Text Truncation Problems',
      },
    ];

    const { getByTestId } = renderCarousel({ items: variedRecipes });

    assertRecipeCardRendering(getByTestId, 3, variedRecipes);
  });

  test('maintains testID consistency across re-renders', () => {
    const { getByTestId, rerender } = renderCarousel();

    assertRecipeCardRendering(getByTestId, sampleRecipes.length, sampleRecipes);

    rerender(<Carousel items={singleRecipe} testID='test-carousel' />);

    expect(getByTestId('test-carousel::Card::0')).toBeTruthy();
    expect(() => getByTestId('test-carousel::Card::1')).toThrow();
    expect(() => getByTestId('test-carousel::Card::2')).toThrow();

    rerender(<Carousel items={sampleRecipes} testID='test-carousel' />);

    assertRecipeCardRendering(getByTestId, sampleRecipes.length, sampleRecipes);
  });

  test('handles edge cases with minimal recipe data', () => {
    const minimalRecipes: recipeTableElement[] = [
      {
        id: 999,
        title: 'Minimal Recipe',
        description: '',
        image_Source: '',
        tags: [],
        persons: 1,
        ingredients: [],
        season: [],
        preparation: [],
        time: 0,
      },
    ];

    const { getByTestId } = renderCarousel({ items: minimalRecipes });

    assertRecipeCardRendering(getByTestId, 1, minimalRecipes);
  });

  test('generates unique keys for recipes with same title but different ids', () => {
    const duplicateTitleRecipes: recipeTableElement[] = [
      { ...testRecipes[0]!, id: 1, title: 'Duplicate Title' },
      { ...testRecipes[1]!, id: 2, title: 'Duplicate Title' },
      { ...testRecipes[2]!, id: 3, title: 'Duplicate Title' },
    ];

    expect(() => renderCarousel({ items: duplicateTitleRecipes })).not.toThrow();

    const { getByTestId } = renderCarousel({ items: duplicateTitleRecipes });
    assertRecipeCardRendering(getByTestId, 3, duplicateTitleRecipes);
  });

  test('generates unique keys for recipes without id using title and index', () => {
    const noIdRecipes: recipeTableElement[] = [
      { ...testRecipes[0]!, id: undefined as any, title: 'Same Title' },
      { ...testRecipes[1]!, id: undefined as any, title: 'Same Title' },
    ];

    expect(() => renderCarousel({ items: noIdRecipes })).not.toThrow();

    const { getByTestId } = renderCarousel({ items: noIdRecipes });
    assertRecipeCardRendering(getByTestId, 2, noIdRecipes);
  });
});
