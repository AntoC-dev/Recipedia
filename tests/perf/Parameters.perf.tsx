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
import {
  RecipeDatabaseContextType,
  RecipeDatabaseProvider,
  useRecipeDatabase,
} from '@context/RecipeDatabaseContext';
import { ingredientType } from '@customTypes/DatabaseElementTypes';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const Stack = createStackNavigator();

let dbContextRef: RecipeDatabaseContextType | null = null;
let personsContextRef: ReturnType<typeof useDefaultPersons> | null = null;

function ContextCapture() {
  const dbContext = useRecipeDatabase();
  const personsContext = useDefaultPersons();
  useEffect(() => {
    dbContextRef = dbContext;
    personsContextRef = personsContext;
  }, [dbContext, personsContext]);
  return null;
}

function ParametersWrapper() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <RecipeDatabaseProvider>
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
    </RecipeDatabaseProvider>
  );
}

function IngredientsSettingsWrapper() {
  return (
    <RecipeDatabaseProvider>
      <DefaultPersonsProvider>
        <SeasonFilterProvider>
          <ContextCapture />
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name='IngredientsSettings' component={IngredientsSettings} />
            </Stack.Navigator>
          </NavigationContainer>
        </SeasonFilterProvider>
      </DefaultPersonsProvider>
    </RecipeDatabaseProvider>
  );
}

function TagsSettingsWrapper() {
  return (
    <RecipeDatabaseProvider>
      <DefaultPersonsProvider>
        <SeasonFilterProvider>
          <ContextCapture />
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name='TagsSettings' component={TagsSettings} />
            </Stack.Navigator>
          </NavigationContainer>
        </SeasonFilterProvider>
      </DefaultPersonsProvider>
    </RecipeDatabaseProvider>
  );
}

describe('Parameters Screen Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    dbContextRef = null;
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
      if (dbContextRef) {
        await dbContextRef.scaleAllRecipesForNewDefaultPersons(6);
      }
    };

    await measureRenders(<ParametersWrapper />, { runs: 10, scenario });
  });
});

describe('IngredientsSettings Screen Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    dbContextRef = null;
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
    await measureRenders(<IngredientsSettingsWrapper />, { runs: 10 });
  });

  test('re-render after adding ingredient', async () => {
    const scenario = async () => {
      if (dbContextRef) {
        await dbContextRef.addIngredient({
          name: 'Test Ingredient',
          type: ingredientType.vegetable,
          unit: 'piece',
          season: [],
        });
      }
    };

    await measureRenders(<IngredientsSettingsWrapper />, { runs: 10, scenario });
  });

  test('re-render after editing ingredient', async () => {
    const scenario = async () => {
      if (dbContextRef && dbContextRef.ingredients.length > 0) {
        const ingredient = dbContextRef.ingredients[0];
        await dbContextRef.editIngredient({
          ...ingredient,
          name: ingredient.name + ' (edited)',
        });
      }
    };

    await measureRenders(<IngredientsSettingsWrapper />, { runs: 10, scenario });
  });

  test('re-render after adding multiple ingredients rapidly', async () => {
    const scenario = async () => {
      if (dbContextRef) {
        for (let i = 0; i < 5; i++) {
          await dbContextRef.addIngredient({
            name: `Rapid Ingredient ${i}`,
            type: ingredientType.vegetable,
            unit: 'piece',
            season: [],
          });
        }
      }
    };

    await measureRenders(<IngredientsSettingsWrapper />, { runs: 10, scenario });
  });

  test('re-render after deleting ingredient', async () => {
    const scenario = async () => {
      if (dbContextRef && dbContextRef.ingredients.length > 0) {
        const ingredient = dbContextRef.ingredients[0];
        await dbContextRef.deleteIngredient(ingredient);
      }
    };

    await measureRenders(<IngredientsSettingsWrapper />, { runs: 10, scenario });
  });
});

describe('TagsSettings Screen Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    dbContextRef = null;
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
      if (dbContextRef) {
        await dbContextRef.addTag({ name: 'Test Tag' });
      }
    };

    await measureRenders(<TagsSettingsWrapper />, { runs: 10, scenario });
  });

  test('re-render after editing tag', async () => {
    const scenario = async () => {
      if (dbContextRef && dbContextRef.tags.length > 0) {
        const tag = dbContextRef.tags[0];
        await dbContextRef.editTag({
          ...tag,
          name: tag.name + ' (edited)',
        });
      }
    };

    await measureRenders(<TagsSettingsWrapper />, { runs: 10, scenario });
  });

  test('re-render after adding multiple tags rapidly', async () => {
    const scenario = async () => {
      if (dbContextRef) {
        for (let i = 0; i < 5; i++) {
          await dbContextRef.addTag({ name: `Rapid Tag ${i}` });
        }
      }
    };

    await measureRenders(<TagsSettingsWrapper />, { runs: 10, scenario });
  });

  test('re-render after deleting tag', async () => {
    const scenario = async () => {
      if (dbContextRef && dbContextRef.tags.length > 0) {
        const tag = dbContextRef.tags[0];
        await dbContextRef.deleteTag(tag);
      }
    };

    await measureRenders(<TagsSettingsWrapper />, { runs: 10, scenario });
  });
});
