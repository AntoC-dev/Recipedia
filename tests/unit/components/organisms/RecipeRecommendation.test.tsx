import { render } from '@testing-library/react-native';
import {
  RecipeRecommendation,
  RecipeRecommendationProps,
} from '@components/organisms/RecipeRecommendation';
import React from 'react';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { testRecipes } from '@test-data/recipesDataset';

jest.mock('@components/molecules/RecipeCard', () => ({
  RecipeCard: require('@mocks/components/molecules/RecipeCard-mock').recipeCardMock,
}));

describe('RecipeRecommendation Component', () => {
  const mockRecipes: recipeTableElement[] = testRecipes.slice(0, 2);

  const defaultProps: RecipeRecommendationProps = {
    testId: 'test-recommendation',
    titleRecommendation: 'Featured Recipes',
    carouselProps: mockRecipes,
  };

  const renderRecipeRecommendation = async (
    propForComponent: RecipeRecommendationProps = defaultProps
  ) => {
    return render(<RecipeRecommendation {...propForComponent} />);
  };

  const assertRecipeRecommendation = (
    getByTestId: any,
    expectedProps: RecipeRecommendationProps = defaultProps,
    skipCardChecks?: boolean
  ) => {
    expect(getByTestId(expectedProps.testId + '::SubHeader')).toBeTruthy();

    const subHeader = getByTestId(expectedProps.testId + '::SubHeader');
    expect(subHeader.props.children).toBe(expectedProps.titleRecommendation);

    if (!skipCardChecks) {
      expectedProps.carouselProps.forEach((recipe, index) => {
        expect(getByTestId(expectedProps.testId + `::Carousel::Card::${index}`)).toBeTruthy();
      });
    } else {
      expect(getByTestId(expectedProps.testId + `::Carousel::Card::0`)).toBeTruthy();
    }
  };

  test('renders with correct structure and default configuration', async () => {
    const { getByTestId } = await renderRecipeRecommendation();

    assertRecipeRecommendation(getByTestId);

    expect(getByTestId('test-recommendation::SubHeader').parent).toBeTruthy();
  });

  test('displays custom title correctly', async () => {
    const customTitles = [
      'Breakfast Favorites',
      'Dinner Specials',
      'Quick & Easy Meals',
      'Seasonal Picks',
      'Chef Recommendations',
      'Popular This Week',
    ];

    for (const title of customTitles) {
      const props = { ...defaultProps, titleRecommendation: title };
      const { getByTestId, unmount } = await renderRecipeRecommendation(props);

      assertRecipeRecommendation(getByTestId, props);
      await unmount();
    }
  });

  test('handles empty recipe array correctly', async () => {
    const props = { ...defaultProps, carouselProps: [] };
    const { getByTestId } = await renderRecipeRecommendation(props);

    assertRecipeRecommendation(getByTestId, props);
  });

  test('handles single recipe correctly', async () => {
    const singleRecipe = [testRecipes[0]!];
    const props = { ...defaultProps, carouselProps: singleRecipe };
    const { getByTestId } = await renderRecipeRecommendation(props);

    assertRecipeRecommendation(getByTestId, props);

    const cardData = JSON.parse(
      getByTestId('test-recommendation::Carousel::Card::0::Recipe').props.children
    );
    expect(cardData).toEqual(singleRecipe[0]);
  });

  test('handles large recipe collections correctly', async () => {
    const largeRecipeCollection = Array.from({ length: 50 }, (_, index) => ({
      ...testRecipes[0]!,
      id: index + 1,
      title: `Recipe ${index + 1}`,
      description: `Description for recipe ${index + 1}`,
    }));

    const props = { ...defaultProps, carouselProps: largeRecipeCollection };
    const { getByTestId } = await renderRecipeRecommendation(props);

    assertRecipeRecommendation(getByTestId, props, true);

    const firstCardData = JSON.parse(
      getByTestId('test-recommendation::Carousel::Card::0::Recipe').props.children
    );
    expect(firstCardData.title).toBe('Recipe 1');
  });

  test('uses custom testId correctly throughout component', async () => {
    const props = { ...defaultProps, testId: 'custom-recipe-recommendation' };
    const { getByTestId, queryByTestId } = await renderRecipeRecommendation(props);

    assertRecipeRecommendation(getByTestId, props);

    expect(queryByTestId('test-recommendation::SubHeader')).toBeNull();
    expect(queryByTestId('test-recommendation::Carousel')).toBeNull();
  });

  test('preserves recipe data integrity through props', async () => {
    const complexRecipe = {
      ...testRecipes[6]!,
      title: 'Complex Recipe with Special Characters: é, ñ, 中文',
      description: 'Description with "quotes" and special chars: @#$%^&*()',
    };

    const props = { ...defaultProps, carouselProps: [complexRecipe] };
    const { getByTestId } = await renderRecipeRecommendation(props);

    assertRecipeRecommendation(getByTestId, props);
  });

  test('handles prop changes correctly', async () => {
    const { getByTestId, rerender } = await renderRecipeRecommendation();

    assertRecipeRecommendation(getByTestId);

    const newProps = {
      testId: 'test-recommendation',
      titleRecommendation: 'Updated Recommendations',
      carouselProps: [testRecipes[1]!],
    };
    await rerender(<RecipeRecommendation {...newProps} />);

    assertRecipeRecommendation(getByTestId, newProps);
  });

  test('maintains component stability across multiple renders', async () => {
    const { getByTestId, rerender } = await renderRecipeRecommendation();

    const renderConfigs = [
      { title: 'Config 1', recipes: mockRecipes },
      { title: 'Config 2', recipes: [testRecipes[0]!] },
      { title: 'Config 3', recipes: [] },
      { title: 'Config 4', recipes: mockRecipes },
    ];

    for (const config of renderConfigs) {
      const props = {
        testId: 'test-recommendation',
        titleRecommendation: config.title,
        carouselProps: config.recipes,
      };
      await rerender(<RecipeRecommendation {...props} />);

      assertRecipeRecommendation(getByTestId, props);
    }
  });

  test('handles edge cases in title text', async () => {
    const edgeCaseTitles = [
      '',
      ' ',
      '   ',
      'Very Long Title That Might Cause Layout Issues And Should Be Handled Gracefully',
      'Title with\nnewlines\nand\ttabs',
      'Title with special chars: @#$%^&*()',
      'Title with emojis 🍰🧁🍪',
      'Title in différent langüages with áccénts',
    ];

    for (const title of edgeCaseTitles) {
      const props = { ...defaultProps, titleRecommendation: title };
      const { getByTestId, unmount } = await renderRecipeRecommendation(props);

      assertRecipeRecommendation(getByTestId, props);

      await unmount();
    }
  });
});
