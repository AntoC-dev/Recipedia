import { fireEvent, render } from '@testing-library/react-native';
import RecipeCard, { RecipeCardProps } from '@components/molecules/RecipeCard';
import React from 'react';
import { testRecipes } from '@test-data/recipesDataset';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { testTags } from '@test-data/tagsDataset';
import { mockNavigate } from '@mocks/deps/react-navigation-mock';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

const Stack = createStackNavigator();

describe('RecipeCard Component', () => {
  const sampleRecipe: recipeTableElement = testRecipes[0]!;
  const recipeWithoutImage: recipeTableElement = { ...testRecipes[1]!, image_Source: '' };
  const recipeWithManyTags: recipeTableElement = {
    ...testRecipes[2]!,
    tags: testTags,
  };

  const renderRecipeCard = (overrideProps = {}) => {
    const defaultProps: RecipeCardProps = {
      testId: 'test-recipe-card',
      size: 'small' as const,
      recipe: sampleRecipe,
      ...overrideProps,
    };

    return render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name='Test' component={() => <RecipeCard {...defaultProps} />} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  const assertRecipeDataDisplay = (
    getByTestId: any,
    queryByTestId: any,
    size: 'small' | 'medium',
    recipe: recipeTableElement = sampleRecipe,
    testId: string = 'test-recipe-card'
  ) => {
    expect(getByTestId(`${testId}::Cover::Source`).props.children).toEqual(
      recipe.image_Source.length > 0 ? recipe.image_Source : 'no-image'
    );
    expect(getByTestId(`${testId}::Title`).props.children).toEqual(recipe.title);
    expect(getByTestId(`${testId}::Title`).props.numberOfLines).toEqual(2);

    const expectedVariant = size === 'small' ? 'labelLarge' : 'titleMedium';
    expect(getByTestId(`${testId}::Title`).props.variant).toEqual(expectedVariant);

    if (size === 'medium') {
      const expectedTags = recipe.tags.map(tag => tag.name).join(', ');
      expect(getByTestId(`${testId}::Content`).props.children).toEqual(expectedTags);

      expect(getByTestId(`${testId}::PrepTime`).props.children).toEqual(`Prep. ${recipe.time} min`);
      expect(getByTestId(`${testId}::Persons`).props.children).toEqual(`${recipe.persons} p.`);
    } else {
      expect(queryByTestId(`${testId}::Content`)).toBeNull();
      expect(queryByTestId(`${testId}::PrepTime`)).toBeNull();
      expect(queryByTestId(`${testId}::Persons`)).toBeNull();
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders small size card correctly with basic recipe data', () => {
    const { getByTestId, queryByTestId } = renderRecipeCard();

    assertRecipeDataDisplay(getByTestId, queryByTestId, 'small');
  });

  test('renders medium size card correctly with full recipe details', () => {
    const { getByTestId, queryByTestId } = renderRecipeCard({ size: 'medium' });

    assertRecipeDataDisplay(getByTestId, queryByTestId, 'medium');
  });

  test('exposes each card field as its own accessible element', () => {
    const { getByTestId } = renderRecipeCard({ size: 'medium' });

    const card = getByTestId(`test-recipe-card::${sampleRecipe.title}`);
    expect(card.props.accessible).toBe(false);

    expect(getByTestId('test-recipe-card::Title').props.accessible).toBe(true);
    expect(getByTestId('test-recipe-card::Title').props.children).toBe(sampleRecipe.title);
    expect(getByTestId('test-recipe-card::Content').props.accessible).toBe(true);
    expect(getByTestId('test-recipe-card::PrepTime').props.accessible).toBe(true);
    expect(getByTestId('test-recipe-card::Persons').props.accessible).toBe(true);
  });

  test('navigates to Recipe screen when card is pressed', () => {
    const { getByTestId, queryByTestId } = renderRecipeCard();

    expect(mockNavigate).not.toHaveBeenCalled();

    fireEvent.press(getByTestId(`test-recipe-card::${sampleRecipe.title}`));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('RecipeView', {
      recipe: sampleRecipe,
    });

    assertRecipeDataDisplay(getByTestId, queryByTestId, 'small');
  });

  test('displays recipe image correctly with fallback handling', () => {
    const { getByTestId, queryByTestId } = renderRecipeCard({
      recipe: recipeWithoutImage,
    });

    assertRecipeDataDisplay(getByTestId, queryByTestId, 'small', recipeWithoutImage);
  });

  test('handles recipe title variations correctly', () => {
    {
      const longTitleRecipe = {
        ...sampleRecipe,
        title: 'Very Long Recipe Title That Should Be Truncated After Two Lines Of Text Display',
      };

      const { getByTestId, queryByTestId } = renderRecipeCard({
        recipe: longTitleRecipe,
      });

      assertRecipeDataDisplay(getByTestId, queryByTestId, 'small', longTitleRecipe);
    }
    {
      const emptyTitleRecipe = { ...sampleRecipe, title: '' };
      const { getByTestId, queryByTestId } = renderRecipeCard({
        recipe: emptyTitleRecipe,
      });
      assertRecipeDataDisplay(getByTestId, queryByTestId, 'small', emptyTitleRecipe);
    }
    {
      const specialTitleRecipe = {
        ...sampleRecipe,
        title: 'Recipe with Special Characters: café & créme',
      };
      const { getByTestId, queryByTestId } = renderRecipeCard({
        recipe: specialTitleRecipe,
      });
      assertRecipeDataDisplay(getByTestId, queryByTestId, 'small', specialTitleRecipe);
    }
  });

  test('displays tags correctly in medium size cards', () => {
    {
      const { getByTestId, queryByTestId } = renderRecipeCard({
        size: 'medium',
        recipe: recipeWithManyTags,
      });

      assertRecipeDataDisplay(getByTestId, queryByTestId, 'medium', recipeWithManyTags);
    }

    {
      const singleTagRecipe = { ...sampleRecipe, tags: [{ id: 1, name: 'Italian' }] };
      const { getByTestId, queryByTestId } = renderRecipeCard({
        size: 'medium',
        recipe: singleTagRecipe,
      });

      assertRecipeDataDisplay(getByTestId, queryByTestId, 'medium', singleTagRecipe);
    }
    {
      const noTagsRecipe = { ...sampleRecipe, tags: [] };
      const { getByTestId, queryByTestId } = renderRecipeCard({
        size: 'medium',
        recipe: noTagsRecipe,
      });

      assertRecipeDataDisplay(getByTestId, queryByTestId, 'medium', noTagsRecipe);
    }
  });

  test('displays preparation time and serving count in medium cards', () => {
    const customRecipe = { ...sampleRecipe, time: 45, persons: 6 };
    const { getByTestId, queryByTestId } = renderRecipeCard({
      size: 'medium',
      recipe: customRecipe,
    });

    assertRecipeDataDisplay(getByTestId, queryByTestId, 'medium', customRecipe);
  });

  test('uses different testId correctly for multiple instances', () => {
    const customTestId = 'custom-recipe-card';
    const { getByTestId, queryByTestId } = renderRecipeCard({ testId: customTestId });

    assertRecipeDataDisplay(getByTestId, queryByTestId, 'small', sampleRecipe, customTestId);
  });

  test('handles recipe data edge cases correctly', () => {
    const minimalRecipe: recipeTableElement = {
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
    };
    {
      const { getByTestId, queryByTestId } = renderRecipeCard({
        recipe: minimalRecipe,
      });

      assertRecipeDataDisplay(getByTestId, queryByTestId, 'small', minimalRecipe);
    }
    {
      const { getByTestId, queryByTestId } = renderRecipeCard({
        recipe: minimalRecipe,
        size: 'medium',
      });

      assertRecipeDataDisplay(getByTestId, queryByTestId, 'medium', minimalRecipe);
    }
  });

  test('handles size prop changes correctly', () => {
    const { getByTestId, queryByTestId, rerender } = renderRecipeCard({
      size: 'small',
    });

    assertRecipeDataDisplay(getByTestId, queryByTestId, 'small');

    rerender(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name='Test'
            component={() => (
              <RecipeCard testId='test-recipe-card' size='medium' recipe={sampleRecipe} />
            )}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );

    assertRecipeDataDisplay(getByTestId, queryByTestId, 'medium');
  });
});
