import React, { useEffect, useState } from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { measureRenders } from 'reassure';
import { Parameters } from '@screens/Parameters';
import { IngredientsSettings } from '@screens/IngredientsSettings';
import { TagsSettings } from '@screens/TagsSettings';
import RecipeDatabase from '@utils/RecipeDatabase';
import { performanceRecipes } from '@assets/datasets/performance/recipes';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { SeasonFilterProvider } from '@context/SeasonFilterContext';
import { DefaultPersonsProvider, useDefaultPersons } from '@context/DefaultPersonsContext';
import { DarkModeContext } from '@context/DarkModeContext';
import { ingredientType } from '@customTypes/DatabaseElementTypes';
import { HEAVY_WARMUP } from './perfOptions';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const Stack = createStackNavigator();

let personsContextRef: ReturnType<typeof useDefaultPersons> | null = null;

function ContextCapture() {
  const personsContext = useDefaultPersons();
  useEffect(() => {
    personsContextRef = personsContext;
  }, [personsContext]);
  return null;
}

function ParametersWrapper() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <DefaultPersonsProvider>
      <SeasonFilterProvider>
        <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
          <ContextCapture />
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name='Parameters' component={Parameters} />
            </Stack.Navigator>
          </NavigationContainer>
        </DarkModeContext.Provider>
      </SeasonFilterProvider>
    </DefaultPersonsProvider>
  );
}

function IngredientsSettingsWrapper() {
  return (
    <DefaultPersonsProvider>
      <SeasonFilterProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name='IngredientsSettings' component={IngredientsSettings} />
          </Stack.Navigator>
        </NavigationContainer>
      </SeasonFilterProvider>
    </DefaultPersonsProvider>
  );
}

function TagsSettingsWrapper() {
  return (
    <DefaultPersonsProvider>
      <SeasonFilterProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name='TagsSettings' component={TagsSettings} />
          </Stack.Navigator>
        </NavigationContainer>
      </SeasonFilterProvider>
    </DefaultPersonsProvider>
  );
}

describe('Parameters Screen Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    personsContextRef = null;
    await database.init();
    await database.addMultipleIngredients(performanceIngredients);
    await database.addMultipleTags(performanceTags);
    await database.addMultipleRecipes(performanceRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render', async () => {
    await measureRenders(<ParametersWrapper />, { runs: 10 });
  });

  test('re-render after dark mode toggle via UI', async () => {
    const scenario = async () => {
      const darkModeSwitch = screen.getByTestId(
        'Parameters::Section::Appearance::DarkMode::Switch'
      );
      fireEvent(darkModeSwitch, 'valueChange', true);
    };

    await measureRenders(<ParametersWrapper />, { runs: 10, scenario });
  });

  test('re-render after season filter toggle via UI', async () => {
    const scenario = async () => {
      const seasonSwitch = screen.getByTestId(
        'Parameters::Section::RecipeDefaults::Season::Switch'
      );
      fireEvent(seasonSwitch, 'valueChange', true);
    };

    await measureRenders(<ParametersWrapper />, { runs: 10, scenario });
  });

  test('re-render after default persons change via hook', async () => {
    const scenario = async () => {
      if (personsContextRef) {
        await personsContextRef.setDefaultPersons(6);
      }
    };

    await measureRenders(<ParametersWrapper />, { runs: 10, scenario });
  });

  test('re-render after scaling all recipes via hook', async () => {
    const scenario = async () => {
      const recipes = database.get_recipes();
      const recipesToScale = recipes.filter(
        r => r.persons && r.persons > 0 && r.id !== undefined && r.persons !== 6
      );
      for (const recipe of recipesToScale) {
        const scaled = RecipeDatabase.scaleRecipeToPersons(recipe, 6);
        await database.scaleAndUpdateRecipe(scaled);
      }
    };

    await measureRenders(<ParametersWrapper />, { runs: 10, scenario });
  });
});

describe('IngredientsSettings Screen Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    personsContextRef = null;
    await database.init();
    await database.addMultipleIngredients(performanceIngredients);
    await database.addMultipleTags(performanceTags);
    await database.addMultipleRecipes(performanceRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render', async () => {
    await measureRenders(<IngredientsSettingsWrapper />, { runs: 10, ...HEAVY_WARMUP });
  });

  test('re-render after adding ingredient', async () => {
    const scenario = async () => {
      await database.addIngredient({
        name: 'Test Ingredient',
        type: ingredientType.vegetable,
        unit: 'piece',
        season: [],
      });
    };

    await measureRenders(<IngredientsSettingsWrapper />, { runs: 10, ...HEAVY_WARMUP, scenario });
  });

  test('re-render after editing ingredient', async () => {
    const scenario = async () => {
      const ingredients = database.get_ingredients();
      if (ingredients.length > 0) {
        const ingredient = ingredients[0];
        await database.editIngredient({
          ...ingredient,
          name: ingredient.name + ' (edited)',
        });
      }
    };

    await measureRenders(<IngredientsSettingsWrapper />, { runs: 10, ...HEAVY_WARMUP, scenario });
  });

  test('re-render after adding multiple ingredients rapidly', async () => {
    const scenario = async () => {
      for (let i = 0; i < 5; i++) {
        await database.addIngredient({
          name: `Rapid Ingredient ${i}`,
          type: ingredientType.vegetable,
          unit: 'piece',
          season: [],
        });
      }
    };

    await measureRenders(<IngredientsSettingsWrapper />, { runs: 10, ...HEAVY_WARMUP, scenario });
  });

  test('re-render after deleting ingredient', async () => {
    const scenario = async () => {
      const ingredients = database.get_ingredients();
      if (ingredients.length > 0) {
        await database.deleteIngredient(ingredients[0]);
      }
    };

    await measureRenders(<IngredientsSettingsWrapper />, { runs: 10, ...HEAVY_WARMUP, scenario });
  });
});

describe('TagsSettings Screen Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    personsContextRef = null;
    await database.init();
    await database.addMultipleIngredients(performanceIngredients);
    await database.addMultipleTags(performanceTags);
    await database.addMultipleRecipes(performanceRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render', async () => {
    await measureRenders(<TagsSettingsWrapper />, { runs: 10 });
  });

  test('re-render after adding tag', async () => {
    const scenario = async () => {
      await database.addTag({ name: 'Test Tag' });
    };

    await measureRenders(<TagsSettingsWrapper />, { runs: 10, scenario });
  });

  test('re-render after editing tag', async () => {
    const scenario = async () => {
      const tags = database.get_tags();
      if (tags.length > 0) {
        const tag = tags[0];
        await database.editTag({
          ...tag,
          name: tag.name + ' (edited)',
        });
      }
    };

    await measureRenders(<TagsSettingsWrapper />, { runs: 10, scenario });
  });

  test('re-render after adding multiple tags rapidly', async () => {
    const scenario = async () => {
      for (let i = 0; i < 5; i++) {
        await database.addTag({ name: `Rapid Tag ${i}` });
      }
    };

    await measureRenders(<TagsSettingsWrapper />, { runs: 10, scenario });
  });

  test('re-render after deleting tag', async () => {
    const scenario = async () => {
      const tags = database.get_tags();
      if (tags.length > 0) {
        await database.deleteTag(tags[0]);
      }
    };

    await measureRenders(<TagsSettingsWrapper />, { runs: 10, scenario });
  });
});

const largeIngredients = Array.from({ length: 1200 }, (_, i) => ({
  id: i + 1,
  name: `LargeIngredient${i + 1}`,
  unit: 'g',
  type: ingredientType.vegetable,
  season: [] as string[],
}));

describe('IngredientsSettings Screen Performance - Large Dataset', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    personsContextRef = null;
    await database.init();
    await database.addMultipleIngredients(largeIngredients);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render with 1200 ingredients', async () => {
    await measureRenders(<IngredientsSettingsWrapper />, { runs: 5 });
  });

  test('re-render after adding ingredient with 1200 ingredients', async () => {
    const scenario = async () => {
      await database.addIngredient({
        name: `ExtraIngredient${Date.now()}`,
        type: ingredientType.vegetable,
        unit: 'g',
        season: [],
      });
    };

    await measureRenders(<IngredientsSettingsWrapper />, { runs: 5, scenario });
  });

  test('re-render after deleting ingredient with 1200 ingredients', async () => {
    const scenario = async () => {
      const ingredients = database.get_ingredients();
      if (ingredients.length > 0) {
        await database.deleteIngredient(ingredients[0]);
      }
    };

    await measureRenders(<IngredientsSettingsWrapper />, { runs: 5, scenario });
  });
});
