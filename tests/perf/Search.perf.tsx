import React, { useEffect } from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { measureRenders } from 'reassure';
import Search from '@screens/Search';
import RecipeDatabase from '@utils/RecipeDatabase';
import { ingredientType, recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { performanceRecipes } from '@assets/datasets/performance/recipes';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { SeasonFilterProvider } from '@context/SeasonFilterContext';
import { useRecipes } from '@hooks/useRecipes';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const Stack = createStackNavigator();

type SearchPerfContext = {
  recipes: recipeTableElement[];
  addRecipe: (r: recipeTableElement) => Promise<void>;
  editRecipe: (r: recipeTableElement) => Promise<recipeTableElement>;
  deleteRecipe: (r: recipeTableElement) => Promise<boolean>;
};
let contextRef: SearchPerfContext | null = null;

function ContextCapture() {
  const { recipes, addRecipe, editRecipe, deleteRecipe } = useRecipes();
  useEffect(() => {
    contextRef = { recipes, addRecipe, editRecipe, deleteRecipe };
  }, [recipes, addRecipe, editRecipe, deleteRecipe]);
  return null;
}

function SearchWrapper() {
  return (
    <SeasonFilterProvider>
      <ContextCapture />
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name='Search' component={Search} />
        </Stack.Navigator>
      </NavigationContainer>
    </SeasonFilterProvider>
  );
}

const testRecipe: recipeTableElement = {
  title: 'Performance Test Recipe',
  description: 'A test recipe for performance testing',
  ingredients: [],
  tags: [],
  preparation: [{ title: 'Step 1', description: 'Do something' }],
  time: 30,
  persons: 4,
  season: [],
  image_Source: '',
};

describe('Search Screen Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    contextRef = null;
    await database.init();
    await database.addMultipleIngredients(performanceIngredients);
    await database.addMultipleTags(performanceTags);
    await database.addMultipleRecipes(performanceRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render with 150 recipes', async () => {
    await measureRenders(<SearchWrapper />, { runs: 10 });
  });

  test('re-render after search text change', async () => {
    const scenario = async () => {
      const searchBar = screen.getByTestId('SearchScreen::SearchBar');
      fireEvent.changeText(searchBar, 'pasta');
    };

    await measureRenders(<SearchWrapper />, { runs: 10, scenario });
  });

  test('re-render after clearing search', async () => {
    const scenario = async () => {
      const searchBar = screen.getByTestId('SearchScreen::SearchBar');
      fireEvent.changeText(searchBar, 'chicken');
      fireEvent.changeText(searchBar, '');
    };

    await measureRenders(<SearchWrapper />, { runs: 10, scenario });
  });

  test('re-render after adding recipe via hook', async () => {
    const scenario = async () => {
      if (contextRef) {
        await contextRef.addRecipe({ ...testRecipe, title: `New Recipe ${Date.now()}` });
      }
    };

    await measureRenders(<SearchWrapper />, { runs: 10, scenario });
  });

  test('re-render after deleting recipe via hook', async () => {
    const scenario = async () => {
      if (contextRef && contextRef.recipes.length > 0) {
        await contextRef.deleteRecipe(contextRef.recipes[0]);
      }
    };

    await measureRenders(<SearchWrapper />, { runs: 10, scenario });
  });

  test('re-render after editing recipe via hook', async () => {
    const scenario = async () => {
      if (contextRef && contextRef.recipes.length > 0) {
        const recipe = contextRef.recipes[0];
        await contextRef.editRecipe({
          ...recipe,
          title: recipe.title + ' (edited)',
        });
      }
    };

    await measureRenders(<SearchWrapper />, { runs: 10, scenario });
  });

  test('re-render after opening filter mode via UI', async () => {
    const scenario = async () => {
      const filterToggle = screen.getByTestId('SearchScreen::FiltersToggleButtons');
      fireEvent.press(filterToggle);
    };

    await measureRenders(<SearchWrapper />, { runs: 10, scenario });
  });

  test('re-render after selecting filter via UI', async () => {
    const scenario = async () => {
      const filterToggle = screen.getByTestId('SearchScreen::FiltersToggleButtons');
      fireEvent.press(filterToggle);
      const firstAccordion = screen.getByTestId('SearchScreen::FilterAccordion::Accordion::0');
      fireEvent.press(firstAccordion);
      const firstItem = screen.getByTestId(
        'SearchScreen::FilterAccordion::Accordion::0::Item::0::CheckBox'
      );
      fireEvent.press(firstItem);
    };

    await measureRenders(<SearchWrapper />, { runs: 10, scenario });
  });

  test('re-render after removing filter via UI', async () => {
    const scenario = async () => {
      const filterToggle = screen.getByTestId('SearchScreen::FiltersToggleButtons');
      fireEvent.press(filterToggle);
      const firstAccordion = screen.getByTestId('SearchScreen::FilterAccordion::Accordion::0');
      fireEvent.press(firstAccordion);
      const firstItem = screen.getByTestId(
        'SearchScreen::FilterAccordion::Accordion::0::Item::0::CheckBox'
      );
      fireEvent.press(firstItem);
      fireEvent.press(firstItem);
    };

    await measureRenders(<SearchWrapper />, { runs: 10, scenario });
  });

  test('re-render with combined search and filter', async () => {
    const scenario = async () => {
      const searchBar = screen.getByTestId('SearchScreen::SearchBar');
      fireEvent.changeText(searchBar, 'test');
      const filterToggle = screen.getByTestId('SearchScreen::FiltersToggleButtons');
      fireEvent.press(filterToggle);
      const firstAccordion = screen.getByTestId('SearchScreen::FilterAccordion::Accordion::0');
      fireEvent.press(firstAccordion);
      const firstItem = screen.getByTestId(
        'SearchScreen::FilterAccordion::Accordion::0::Item::0::CheckBox'
      );
      fireEvent.press(firstItem);
    };

    await measureRenders(<SearchWrapper />, { runs: 10, scenario });
  });

  test('re-render with long fuzzy search query', async () => {
    const scenario = async () => {
      const searchBar = screen.getByTestId('SearchScreen::SearchBar');
      fireEvent.changeText(searchBar, 'chick');
      fireEvent.changeText(searchBar, 'chicken wi');
      fireEvent.changeText(searchBar, 'chicken with vege');
    };

    await measureRenders(<SearchWrapper />, { runs: 10, scenario });
  });

  test('re-render with multiple filters from different categories', async () => {
    const scenario = async () => {
      const filterToggle = screen.getByTestId('SearchScreen::FiltersToggleButtons');
      fireEvent.press(filterToggle);

      const firstAccordion = screen.getByTestId('SearchScreen::FilterAccordion::Accordion::0');
      fireEvent.press(firstAccordion);
      const firstItem = screen.getByTestId(
        'SearchScreen::FilterAccordion::Accordion::0::Item::0::CheckBox'
      );
      fireEvent.press(firstItem);

      const secondAccordion = screen.getByTestId('SearchScreen::FilterAccordion::Accordion::1');
      fireEvent.press(secondAccordion);
      const secondItem = screen.getByTestId(
        'SearchScreen::FilterAccordion::Accordion::1::Item::0::CheckBox'
      );
      fireEvent.press(secondItem);
    };

    await measureRenders(<SearchWrapper />, { runs: 10, scenario });
  });

  test('re-render after rapid search text changes', async () => {
    const scenario = async () => {
      const searchBar = screen.getByTestId('SearchScreen::SearchBar');
      fireEvent.changeText(searchBar, 'a');
      fireEvent.changeText(searchBar, 'ab');
      fireEvent.changeText(searchBar, 'abc');
      fireEvent.changeText(searchBar, 'abcd');
      fireEvent.changeText(searchBar, 'abcde');
    };

    await measureRenders(<SearchWrapper />, { runs: 10, scenario });
  });
});

const largeIngredients = Array.from({ length: 1200 }, (_, i) => ({
  id: i + 1,
  name: `LargeIngredient${i + 1}`,
  unit: 'g',
  type: ingredientType.vegetable,
  season: [] as string[],
}));

const largeRecipes: recipeTableElement[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  title: `LargeDatasetRecipe${i + 1}`,
  description: 'Generated for large-scale performance testing',
  ingredients: largeIngredients.slice(i % 10, (i % 10) + 5),
  tags: [],
  preparation: [],
  time: 30,
  persons: 4,
  season: [],
  image_Source: '',
}));

describe('Search Screen Performance - Large Dataset', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    contextRef = null;
    await database.init();
    await database.addMultipleIngredients(largeIngredients);
    await database.addMultipleRecipes(largeRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render with 1000 recipes', async () => {
    await measureRenders(<SearchWrapper />, { runs: 5 });
  });

  test('re-render after search text change with 1000 recipes', async () => {
    const scenario = async () => {
      const searchBar = screen.getByTestId('SearchScreen::SearchBar');
      fireEvent.changeText(searchBar, 'large');
    };

    await measureRenders(<SearchWrapper />, { runs: 5, scenario });
  });

  test('re-render after adding recipe with 1000 recipes', async () => {
    const scenario = async () => {
      if (contextRef) {
        await contextRef.addRecipe({
          title: `ExtraRecipe${Date.now()}`,
          description: '',
          ingredients: [],
          tags: [],
          preparation: [],
          time: 30,
          persons: 4,
          season: [],
          image_Source: '',
        });
      }
    };

    await measureRenders(<SearchWrapper />, { runs: 5, scenario });
  });
});
