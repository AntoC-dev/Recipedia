import { renderHook } from '@testing-library/react-native';
import { useRecipes } from '@hooks/useRecipes';
import { useMenu } from '@hooks/useMenu';
import { useIngredients } from '@hooks/useIngredients';
import { useTags } from '@hooks/useTags';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import { corruptIngredientType } from '@test-helpers/corruptIngredientType';

describe('decodeError exposure across the focused hooks', () => {
  const db = RecipeDatabase.getInstance();

  const hookReaders: [string, () => Error | null][] = [
    ['useRecipes', () => renderHook(() => useRecipes()).result.current.decodeError],
    ['useMenu', () => renderHook(() => useMenu()).result.current.decodeError],
    ['useIngredients', () => renderHook(() => useIngredients()).result.current.decodeError],
    ['useTags', () => renderHook(() => useTags()).result.current.decodeError],
  ];

  beforeEach(async () => {
    await db.init();
    await db.addMultipleIngredients(testIngredients);
    await db.addMultipleTags(testTags);
    await db.addMultipleRecipes(testRecipes);
  });

  afterEach(async () => {
    await db.closeAndReset();
  });

  test.each(hookReaders)('%s exposes null while every row decodes', (_name, read) => {
    expect(read()).toBeNull();
  });

  test.each(hookReaders)(
    '%s exposes the recorded error once a row is corrupt',
    async (_name, read) => {
      await corruptIngredientType(db, testIngredients[0]!.id);

      expect(read()?.message).toMatch(/has an unknown type "not-a-real-type"/);
    }
  );
});
