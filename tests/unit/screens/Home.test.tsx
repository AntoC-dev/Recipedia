import { render, waitFor } from '@testing-library/react-native';
import Home, { howManyItemInCarousel } from '@screens/Home';
import React from 'react';
import { testRecipes } from '@test-data/recipesDataset';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { SeasonFilterProvider } from '@context/SeasonFilterContext';
import { InteractionManager } from 'react-native';

jest.mock(
  '@components/organisms/VerticalBottomButtons',
  () => require('@mocks/components/organisms/VerticalBottomButtons-mock').verticalBottomButtonsMock
);
jest.mock('@components/organisms/RecipeRecommendation', () => ({
  RecipeRecommendation: require('@mocks/components/organisms/RecipeRecommendation-mock')
    .recipeRecommendationMock,
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()), // Mock as a resolved Promise
  useFonts: jest.fn(() => Promise.resolve()), // Mock as a resolved Promise
}));

jest.mock('@utils/i18n', () => {
  const originalModule = jest.requireActual('@utils/i18n');
  return {
    ...originalModule,
    useI18n: () => ({
      t: (key: string, params?: Record<string, any>) => key,
      getLocale: () => jest.fn().mockReturnValue('en'),
      setLocale: jest.fn(),
      getAvailableLocales: jest.fn().mockReturnValue(['en', 'fr']),
      getLocaleName: jest.fn().mockImplementation(() => 'locale name'),
    }),
  };
});

const Stack = createStackNavigator();

async function renderHomeAndWaitForRecommendations() {
  const result = render(
    <SeasonFilterProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name={'Home'} component={Home} />
        </Stack.Navigator>
      </NavigationContainer>
    </SeasonFilterProvider>
  );

  await waitFor(() =>
    expect(
      result.getByTestId('recommendations.randomSelection::CarouselProps').props.children.length
    ).toBeGreaterThan(2)
  );

  return result;
}

describe('Home Screen', () => {
  const database = RecipeDatabase.getInstance();
  const expectedRandomRecommendationLength = Math.min(testRecipes.length, howManyItemInCarousel);

  beforeEach(async () => {
    jest.clearAllMocks();
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
  });
  afterEach(async () => await database.closeAndReset());

  // -------- INITIAL RENDERING TESTS --------
  test('renders all navigation buttons correctly', async () => {
    const { getByTestId } = await renderHomeAndWaitForRecommendations();

    expect(
      getByTestId('recommendations.randomSelection::Title::TitleRecommendation').props.children
    ).toEqual('recommendations.randomSelection');

    const reco1: recipeTableElement[] = JSON.parse(
      getByTestId('recommendations.randomSelection::CarouselProps').props.children
    );

    expect(testRecipes).toEqual(expect.arrayContaining(reco1));
  });

  test('cleans up deleted recipes when screen gains focus', async () => {
    const { getByTestId } = await renderHomeAndWaitForRecommendations();

    const initialReco = JSON.parse(
      getByTestId('recommendations.randomSelection::CarouselProps').props.children
    );

    expect(initialReco.length).toBeGreaterThan(0);
    expect(initialReco.length).toBeLessThanOrEqual(expectedRandomRecommendationLength);

    const firstRecipeInReco1 = initialReco[0];

    await database.deleteRecipe(firstRecipeInReco1);

    expect(database.isRecipeExist(firstRecipeInReco1)).toBe(false);

    const { getByTestId: getByTestIdNew } = await renderHomeAndWaitForRecommendations();

    await waitFor(
      () => {
        const updatedReco = JSON.parse(
          getByTestIdNew('recommendations.randomSelection::CarouselProps').props.children
        );

        expect(updatedReco.length).toBeGreaterThan(0);
        expect(updatedReco.length).toBeLessThanOrEqual(expectedRandomRecommendationLength);
        expect(updatedReco.find((r: any) => r.id === firstRecipeInReco1.id)).toBeUndefined();
      },
      { timeout: 3000 }
    );
  });

  test('replaces deleted recipes with new random ones when carousel becomes incomplete', async () => {
    const { getByTestId } = await renderHomeAndWaitForRecommendations();

    const initialReco = JSON.parse(
      getByTestId('recommendations.randomSelection::CarouselProps').props.children
    );
    expect(initialReco.length).toBeGreaterThan(0);
    expect(initialReco.length).toBeLessThanOrEqual(expectedRandomRecommendationLength);

    const recipesToDelete = [initialReco[0], initialReco[1]];
    await database.deleteRecipe(recipesToDelete[0]);
    await database.deleteRecipe(recipesToDelete[1]);

    const { getByTestId: getByTestIdNew } = await renderHomeAndWaitForRecommendations();

    await waitFor(() => {
      expect(getByTestIdNew('recommendations.randomSelection::CarouselProps')).toBeTruthy();
    });
    const updatedReco = JSON.parse(
      getByTestIdNew('recommendations.randomSelection::CarouselProps').props.children
    );
    expect(updatedReco.length).toBeGreaterThan(0);
    expect(updatedReco.length).toBeLessThanOrEqual(expectedRandomRecommendationLength);
    expect(updatedReco.find((r: any) => r.id === recipesToDelete[0].id)).toBeUndefined();
    expect(updatedReco.find((r: any) => r.id === recipesToDelete[1].id)).toBeUndefined();
  });

  test('maintains proper rendering structure across re-renders', async () => {
    const { getByTestId, rerender } = await renderHomeAndWaitForRecommendations();

    expect(getByTestId('recommendations.randomSelection::Title::TitleRecommendation')).toBeTruthy();
    const initialRandomReco = JSON.parse(
      getByTestId('recommendations.randomSelection::CarouselProps').props.children
    );
    expect(initialRandomReco.length).toBeGreaterThan(0);
    expect(initialRandomReco.length).toBeLessThanOrEqual(expectedRandomRecommendationLength);

    rerender(
      <SeasonFilterProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name={'Home'} component={Home} />
          </Stack.Navigator>
        </NavigationContainer>
      </SeasonFilterProvider>
    );

    await waitFor(() => {
      expect(
        getByTestId('recommendations.randomSelection::Title::TitleRecommendation')
      ).toBeTruthy();
    });
    const updatedRandomReco = JSON.parse(
      getByTestId('recommendations.randomSelection::CarouselProps').props.children
    );

    expect(updatedRandomReco.length).toBeGreaterThan(0);
    expect(updatedRandomReco.length).toBeLessThanOrEqual(expectedRandomRecommendationLength);
  });

  test('displays proper recommendation titles with translations', async () => {
    const { getByTestId } = await renderHomeAndWaitForRecommendations();

    const randomTitle = getByTestId('recommendations.randomSelection::Title::TitleRecommendation')
      .props.children;
    expect(randomTitle).toBe('recommendations.randomSelection');
  });

  test('handles empty database gracefully', async () => {
    await database.closeAndReset();
    await database.init();

    const { getByTestId } = render(
      <SeasonFilterProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name={'Home'} component={Home} />
          </Stack.Navigator>
        </NavigationContainer>
      </SeasonFilterProvider>
    );

    await waitFor(() => {
      expect(getByTestId('Home::EmptyState::Title')).toBeTruthy();
      expect(getByTestId('Home::EmptyState::Description')).toBeTruthy();
    });

    expect(getByTestId('Home::EmptyState::Title').props.children).toBe(
      'emptyState.noRecommendations.title'
    );
    expect(getByTestId('Home::EmptyState::Description').props.children).toBe(
      'emptyState.noRecommendations.description'
    );
  });

  test('recommendations contain recipes from test dataset', async () => {
    const { getByTestId } = await renderHomeAndWaitForRecommendations();

    const randomReco = JSON.parse(
      getByTestId('recommendations.randomSelection::CarouselProps').props.children
    );
    const testRecipeIds = testRecipes.map(recipe => recipe.id);

    randomReco.forEach((recipe: recipeTableElement) => {
      expect(testRecipeIds).toContain(recipe.id);
    });
  });

  test('pull-to-refresh regenerates recommendations', async () => {
    const { UNSAFE_getByType, getByTestId } = await renderHomeAndWaitForRecommendations();

    const initialReco = JSON.parse(
      getByTestId('recommendations.randomSelection::CarouselProps').props.children
    );
    expect(initialReco.length).toBeGreaterThan(0);

    const { FlatList } = require('react-native');
    const flatList = UNSAFE_getByType(FlatList);
    flatList.props.refreshControl.props.onRefresh();

    await waitFor(() => {
      const updatedReco = JSON.parse(
        getByTestId('recommendations.randomSelection::CarouselProps').props.children
      );
      expect(updatedReco.length).toBeGreaterThan(0);
    });
  });

  test('shows skeleton loading state before recommendations are ready', async () => {
    let resolveInteraction: () => void;
    const interactionPromise = new Promise<void>(resolve => {
      resolveInteraction = resolve;
    });

    jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementationOnce(callback => {
      interactionPromise.then(() => {
        if (typeof callback === 'function') callback();
      });
      return {
        then: (fn?: () => any) => Promise.resolve(fn?.()),
        done: jest.fn(),
        cancel: jest.fn(),
      };
    });

    const { UNSAFE_getAllByType, queryByTestId } = render(
      <SeasonFilterProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name={'Home'} component={Home} />
          </Stack.Navigator>
        </NavigationContainer>
      </SeasonFilterProvider>
    );

    const { Animated } = require('react-native');
    const animatedViews = UNSAFE_getAllByType(Animated.View);
    expect(animatedViews.length).toBeGreaterThanOrEqual(3);
    expect(queryByTestId('recommendations.randomSelection::CarouselProps')).toBeNull();

    resolveInteraction!();
    await waitFor(() =>
      expect(queryByTestId('recommendations.randomSelection::CarouselProps')).not.toBeNull()
    );
  });
});
