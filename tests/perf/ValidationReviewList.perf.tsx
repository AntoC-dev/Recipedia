import React from 'react';
import { measureRenders } from 'reassure';
import { ValidationReviewList } from '@components/organisms/ValidationReviewList';
import RecipeDatabase from '@utils/RecipeDatabase';
import { performanceTags } from '@assets/datasets/performance/tags';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { tagTableElement, FormIngredientElement } from '@customTypes/DatabaseElementTypes';
import { ResolutionMappings } from '@customTypes/ValidationTypes';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

function ValidationReviewListWrapper({
  rawTags,
  rawIngredients,
  recipeCount = 5,
}: {
  rawTags: tagTableElement[];
  rawIngredients: FormIngredientElement[];
  recipeCount?: number;
}) {
  return (
    <ValidationReviewList
      testID='PerfTest'
      rawTags={rawTags}
      rawIngredients={rawIngredients}
      onImport={(_: ResolutionMappings) => {}}
      recipeCount={recipeCount}
    />
  );
}

function generateUnknownTags(count: number): tagTableElement[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1000,
    name: `Unknown Tag ${i + 1}`,
  }));
}

function generateUnknownIngredients(count: number): FormIngredientElement[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Unknown Ingredient ${i + 1}`,
    quantity: String(50 + i * 5),
    unit: ['g', 'ml', 'piece', 'tbsp', 'tsp'][i % 5],
  }));
}

function generateTagsWithSimilarities(count: number): tagTableElement[] {
  return performanceTags.slice(0, count).map((t, i) => ({
    id: i + 2000,
    name: t.name.substring(0, 3) + ' variant',
  }));
}

function generateIngredientsWithSimilarities(count: number): FormIngredientElement[] {
  return performanceIngredients.slice(0, count).map(ing => ({
    name: ing.name.substring(0, 4) + ' fresh',
    quantity: '100',
    unit: 'g',
  }));
}

describe('ValidationReviewList Performance', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    await database.init();
    await database.addMultipleTags(performanceTags);
    await database.addMultipleIngredients(performanceIngredients);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('initial render with small list (5 tags, 5 ingredients)', async () => {
    const rawTags = generateUnknownTags(5);
    const rawIngredients = generateUnknownIngredients(5);
    await measureRenders(
      <ValidationReviewListWrapper rawTags={rawTags} rawIngredients={rawIngredients} />,
      { runs: 10 }
    );
  });

  test('initial render with medium list (15 tags, 10 ingredients)', async () => {
    const rawTags = generateUnknownTags(15);
    const rawIngredients = generateUnknownIngredients(10);
    await measureRenders(
      <ValidationReviewListWrapper rawTags={rawTags} rawIngredients={rawIngredients} />,
      { runs: 10 }
    );
  });

  test('initial render with large list (30 tags, 20 ingredients)', async () => {
    const rawTags = generateUnknownTags(30);
    const rawIngredients = generateUnknownIngredients(20);
    await measureRenders(
      <ValidationReviewListWrapper rawTags={rawTags} rawIngredients={rawIngredients} />,
      { runs: 10 }
    );
  });

  test('initial render with tags only (20 tags)', async () => {
    const rawTags = generateUnknownTags(20);
    await measureRenders(<ValidationReviewListWrapper rawTags={rawTags} rawIngredients={[]} />, {
      runs: 10,
    });
  });

  test('initial render with ingredients only (20 ingredients)', async () => {
    const rawIngredients = generateUnknownIngredients(20);
    await measureRenders(
      <ValidationReviewListWrapper rawTags={[]} rawIngredients={rawIngredients} />,
      { runs: 10 }
    );
  });

  test('initial render with items having similar matches (10 tags, 10 ingredients)', async () => {
    const rawTags = generateTagsWithSimilarities(10);
    const rawIngredients = generateIngredientsWithSimilarities(10);
    await measureRenders(
      <ValidationReviewListWrapper rawTags={rawTags} rawIngredients={rawIngredients} />,
      { runs: 10 }
    );
  });

  test('initial render with mixed known and unknown items (10 similar + 10 unknown tags)', async () => {
    const rawTags = [...generateTagsWithSimilarities(10), ...generateUnknownTags(10)];
    const rawIngredients = generateUnknownIngredients(10);
    await measureRenders(
      <ValidationReviewListWrapper rawTags={rawTags} rawIngredients={rawIngredients} />,
      { runs: 10 }
    );
  });
});
