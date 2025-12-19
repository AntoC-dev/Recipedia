import React, { useEffect } from 'react';
import { measureRenders } from 'reassure';
import { ValidationQueue } from '@components/dialogs/ValidationQueue';
import RecipeDatabase from '@utils/RecipeDatabase';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import {
  RecipeDatabaseContextType,
  RecipeDatabaseProvider,
  useRecipeDatabase,
} from '@context/RecipeDatabaseContext';
import {
  FormIngredientElement,
  ingredientTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

let contextRef: RecipeDatabaseContextType | null = null;

function ContextCapture() {
  const context = useRecipeDatabase();
  useEffect(() => {
    contextRef = context;
  }, [context]);
  return null;
}

function TagValidationWrapper({ items }: { items: tagTableElement[] }) {
  const [validatedTags, setValidatedTags] = React.useState<tagTableElement[]>([]);

  return (
    <RecipeDatabaseProvider>
      <ContextCapture />
      <ValidationQueue
        testId='TagValidation'
        type='Tag'
        items={items}
        onValidated={(tag: tagTableElement) => setValidatedTags(prev => [...prev, tag])}
        onComplete={() => {}}
      />
    </RecipeDatabaseProvider>
  );
}

function IngredientValidationWrapper({ items }: { items: FormIngredientElement[] }) {
  const [validatedIngredients, setValidatedIngredients] = React.useState<ingredientTableElement[]>(
    []
  );

  return (
    <RecipeDatabaseProvider>
      <ContextCapture />
      <ValidationQueue
        testId='IngredientValidation'
        type='Ingredient'
        items={items}
        onValidated={(_, validatedIng: ingredientTableElement) =>
          setValidatedIngredients(prev => [...prev, validatedIng])
        }
        onComplete={() => {}}
      />
    </RecipeDatabaseProvider>
  );
}

describe('ValidationQueue Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    contextRef = null;
    await database.init();
    await database.addMultipleIngredients(performanceIngredients);
    await database.addMultipleTags(performanceTags);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render with single tag to validate', async () => {
    const tagsToValidate: tagTableElement[] = [{ name: 'New Tag' }];
    await measureRenders(<TagValidationWrapper items={tagsToValidate} />, { runs: 10 });
  });

  test('initial render with multiple tags to validate', async () => {
    const tagsToValidate: tagTableElement[] = Array.from({ length: 10 }, (_, i) => ({
      name: `New Tag ${i + 1}`,
    }));
    await measureRenders(<TagValidationWrapper items={tagsToValidate} />, { runs: 10 });
  });

  test('initial render with tags similar to existing', async () => {
    const existingTagNames = performanceTags.slice(0, 5).map(t => t.name);
    const tagsToValidate: tagTableElement[] = existingTagNames.map(name => ({
      name: name.substring(0, 3) + ' variant',
    }));
    await measureRenders(<TagValidationWrapper items={tagsToValidate} />, { runs: 10 });
  });

  test('initial render with single ingredient to validate', async () => {
    const ingredientsToValidate: FormIngredientElement[] = [
      { name: 'New Ingredient', quantity: '100', unit: 'g' },
    ];
    await measureRenders(<IngredientValidationWrapper items={ingredientsToValidate} />, {
      runs: 10,
    });
  });

  test('initial render with multiple ingredients to validate', async () => {
    const ingredientsToValidate: FormIngredientElement[] = Array.from({ length: 15 }, (_, i) => ({
      name: `Unknown Ingredient ${i + 1}`,
      quantity: String(50 + i * 10),
      unit: 'g',
    }));
    await measureRenders(<IngredientValidationWrapper items={ingredientsToValidate} />, {
      runs: 10,
    });
  });

  test('initial render with ingredients similar to existing', async () => {
    const existingIngNames = performanceIngredients.slice(0, 8).map(i => i.name);
    const ingredientsToValidate: FormIngredientElement[] = existingIngNames.map(name => ({
      name: name.substring(0, 4) + ' fresh',
      quantity: '200',
      unit: 'g',
    }));
    await measureRenders(<IngredientValidationWrapper items={ingredientsToValidate} />, {
      runs: 10,
    });
  });

  test('initial render with large ingredient queue from scraping', async () => {
    const ingredientsToValidate: FormIngredientElement[] = Array.from({ length: 25 }, (_, i) => ({
      name: `Scraped Ingredient ${i + 1} from website`,
      quantity: String(Math.floor(Math.random() * 500) + 50),
      unit: ['g', 'ml', 'piece', 'tbsp', 'tsp'][i % 5],
    }));
    await measureRenders(<IngredientValidationWrapper items={ingredientsToValidate} />, {
      runs: 10,
    });
  });
});
