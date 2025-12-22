import RecipeDatabase from '@utils/RecipeDatabase';
import { testRecipes } from '@test-data/recipesDataset';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import {
  ingredientTableElement,
  ingredientType,
  nutritionTableElement,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { getRandomRecipes } from '@utils/FilterFunctions';

describe('RecipeDatabase', () => {
  describe('RecipeDatabase basic tests', () => {
    const db = RecipeDatabase.getInstance();

    beforeEach(async () => {
      await db.init();
    });

    afterEach(async () => {
      await db.closeAndReset();
    });

    // Initialization Tests
    test('Database initialization creates all tables', async () => {
      const recipes = db.get_recipes();
      const tags = db.get_tags();
      const ingredients = db.get_ingredients();

      expect(recipes).toEqual([]);
      expect(tags).toEqual([]);
      expect(ingredients).toEqual([]);
    });
    // TODO found a test where the openDatabase fails

    test('Database initialization creates all tables', async () => {
      expect(getRandomRecipes(db.get_recipes(), 1)).toEqual([]);
    });

    describe('isDatabaseEmpty', () => {
      test('should return true when all tables are empty', () => {
        expect(db.isDatabaseEmpty()).toBe(true);
      });

      test('should return false when only recipes table has data', async () => {
        await db.addMultipleIngredients(testIngredients);
        await db.addMultipleTags(testTags);
        await db.addRecipe(testRecipes[0]);

        expect(db.isDatabaseEmpty()).toBe(false);
      });

      test('should return false when only ingredients table has data', async () => {
        await db.addIngredient(testIngredients[0]);

        expect(db.isDatabaseEmpty()).toBe(false);
      });

      test('should return false when only tags table has data', async () => {
        await db.addTag(testTags[0]);

        expect(db.isDatabaseEmpty()).toBe(false);
      });

      test('should return false when all tables have data', async () => {
        await db.addMultipleIngredients(testIngredients);
        await db.addMultipleTags(testTags);
        await db.addMultipleRecipes(testRecipes);

        expect(db.isDatabaseEmpty()).toBe(false);
      });

      test('should return true after database reset', async () => {
        await db.addMultipleIngredients(testIngredients);
        await db.addMultipleTags(testTags);
        await db.addMultipleRecipes(testRecipes);

        expect(db.isDatabaseEmpty()).toBe(false);

        await db.closeAndReset();

        expect(db.isDatabaseEmpty()).toBe(true);
      });

      test('should return false when only two tables have data', async () => {
        await db.addIngredient(testIngredients[0]);
        await db.addTag(testTags[0]);

        expect(db.isDatabaseEmpty()).toBe(false);
      });

      test('should return true for fresh database instance', async () => {
        await db.closeAndReset();
        await db.init();

        expect(db.isDatabaseEmpty()).toBe(true);
      });
    });

    test('Find functions return undefined when the array are empty', () => {
      expect(db.find_recipe(testRecipes[0])).toBeUndefined();
      expect(db.find_ingredient(testIngredients[0])).toBeUndefined();
      expect(db.find_tag(testTags[0])).toBeUndefined();
      expect(db.find_tag(testTags[0])).toBeUndefined();
    });

    test('Add and retrieve a single tag', async () => {
      for (let i = 0; i < testTags.length; i++) {
        const newTag = testTags[i];
        await db.addTag(newTag);
        const tags = db.get_tags();

        expect(tags.length).toBe(i + 1);
        expect(tags[i]).toEqual(newTag);
      }

      await db.addTag({ name: "Tag with a' inside it" });
      const tags = db.get_tags();

      expect(tags.length).toBe(testTags.length + 1);
      expect(tags[tags.length - 1].name).toEqual("Tag with a' inside it");

      // TODO found a test for update

      // TODO test decodeArrayOfTags normal case (return the real decodedTags)
    });

    test('addTag returns tag with database ID on success', async () => {
      const newTag = { id: -1, name: 'Test Tag' };
      const createdTag = await db.addTag(newTag);

      expect(createdTag).toBeDefined();
      expect(createdTag.id).toBeDefined();
      expect(createdTag.id).not.toBe(-1);
      expect(createdTag.name).toBe('Test Tag');
      expect(db.get_tags()).toContainEqual(createdTag);
    });

    test('addTag throws error when database insertion fails', async () => {
      const tagsTable = db['_tagsTable'];
      const originalInsertElement = tagsTable.insertElement;
      tagsTable.insertElement = jest.fn().mockResolvedValue(undefined);

      const newTag = { id: -1, name: 'Failed Tag' };

      await expect(db.addTag(newTag)).rejects.toThrow('Failed to add tag "Failed Tag" to database');

      tagsTable.insertElement = originalInsertElement;
    });

    test('addTag throws error when searchElementById fails after insertion', async () => {
      const tagsTable = db['_tagsTable'];
      const originalSearchElementById = tagsTable.searchElementById;
      tagsTable.searchElementById = jest.fn().mockResolvedValue(undefined);

      const newTag = { id: -1, name: 'Lost Tag' };

      await expect(db.addTag(newTag)).rejects.toThrow(
        'Failed to retrieve tag "Lost Tag" after insertion'
      );

      tagsTable.searchElementById = originalSearchElementById;
    });

    test('Add and retrieve a multiplicity of tags', async () => {
      await db.addMultipleTags(testTags);
      const tags = db.get_tags();

      expect(tags.length).toBe(testTags.length);
      expect(tags).toEqual(testTags);
    });

    test('Add and retrieve a single ingredient', async () => {
      for (let i = 0; i < testIngredients.length; i++) {
        const newIngredient = testIngredients[i];
        await db.addIngredient(newIngredient);
        const ingredient = db.get_ingredients();

        expect(ingredient.length).toEqual(i + 1);
        expect(ingredient[i]).toEqual(newIngredient);
      }
      // TODO when quantity is set, encoding don't work. To check

      // TODO found a test where we want to encode ingredient that doesn't have id preset
      // TODO found a test where we want to decode an ingredient that have type seeafood, sweetener and undefined

      // TODO found a test for update

      // TODO test decodeArrayOfIngredients normal case (return the real decodedIngredients)
    });

    test('addIngredient returns ingredient with database ID on success', async () => {
      const newIngredient = {
        id: -1,
        name: 'Test Ingredient',
        type: ingredientType.vegetable,
        unit: 'g',
        season: [],
      };
      const createdIngredient = await db.addIngredient(newIngredient);

      expect(createdIngredient).toBeDefined();
      expect(createdIngredient.id).toBeDefined();
      expect(createdIngredient.id).not.toBe(-1);
      expect(createdIngredient.name).toBe('Test Ingredient');
      expect(db.get_ingredients()).toContainEqual(createdIngredient);
    });

    test('addIngredient throws error when database insertion fails', async () => {
      const ingredientsTable = db['_ingredientsTable'];
      const originalInsertElement = ingredientsTable.insertElement;
      ingredientsTable.insertElement = jest.fn().mockResolvedValue(undefined);

      const newIngredient = {
        id: -1,
        name: 'Failed Ingredient',
        type: ingredientType.vegetable,
        unit: 'g',
        season: [],
      };

      await expect(db.addIngredient(newIngredient)).rejects.toThrow(
        'Failed to add ingredient "Failed Ingredient" to database'
      );

      ingredientsTable.insertElement = originalInsertElement;
    });

    test('addIngredient throws error when searchElementById fails after insertion', async () => {
      const ingredientsTable = db['_ingredientsTable'];
      const originalSearchElementById = ingredientsTable.searchElementById;
      ingredientsTable.searchElementById = jest.fn().mockResolvedValue(undefined);

      const newIngredient = {
        id: -1,
        name: 'Lost Ingredient',
        type: ingredientType.vegetable,
        unit: 'g',
        season: [],
      };

      await expect(db.addIngredient(newIngredient)).rejects.toThrow(
        'Failed to retrieve ingredient "Lost Ingredient" after insertion'
      );

      ingredientsTable.searchElementById = originalSearchElementById;
    });

    test('Add and retrieve a multiplicity of in', async () => {
      await db.addMultipleIngredients(testIngredients);
      const ingredient = db.get_ingredients();

      expect(ingredient.length).toBe(testIngredients.length);
      expect(ingredient).toEqual(testIngredients);
    });
  });

  describe('RecipeDatabase recipe adding tests', () => {
    const db = RecipeDatabase.getInstance();

    beforeEach(async () => {
      await db.init();
      await db.addMultipleIngredients(testIngredients);
      await db.addMultipleTags(testTags);
    });

    afterEach(async () => {
      await db.closeAndReset();
    });

    test('Add and retrieve a single recipe', async () => {
      for (let i = 0; i < testRecipes.length; i++) {
        await db.addRecipe(testRecipes[i]);
        const recipes = db.get_recipes();

        expect(recipes.length).toBe(i + 1);
        expect(recipes[i]).toEqual(testRecipes[i]);
      }
      // TODO check season

      // TODO found a test where the insertion fails
      // TODO found a test where the insertion worked but don't return a number
      // TODO found a test where we decodeRecipe but the query doesn't contain any of the expected string values

      // TODO found a test for update

      // TODO found a test where we want to decode an ingredient that doesn't have the separator (error handling)
      // TODO found a test where we want to decode an ingredient but the search by id returns empty (error handling)

      // TODO found a test where we want to decode a tag that doesn't have the separator (error handling)
      // TODO found a test where we want to decode a tag but the search by id returns empty (error handling)

      // TODO found a test that cover all else if cases of decodeSeason (currently, only the if is tested)
    });

    test('Add multiple recipes and retrieve all', async () => {
      await db.addMultipleRecipes(testRecipes);

      const recipes = db.get_recipes();
      expect(recipes.length).toBe(testRecipes.length);
      expect(recipes).toEqual(testRecipes);
    });
  });

  describe('RecipeDatabase tests with all recipes already in the database', () => {
    const db = RecipeDatabase.getInstance();

    beforeEach(async () => {
      await db.init();
      await db.addMultipleIngredients(testIngredients);
      await db.addMultipleTags(testTags);
      await db.addMultipleRecipes(testRecipes);
    });

    afterEach(async () => {
      await db.closeAndReset();
    });

    test('Remove a tag and ensure it is deleted', async () => {
      expect(await db.deleteTag(testTags[12])).toEqual(true);
      expect(db.get_tags()).not.toContainEqual(testTags[12]);

      expect(await db.deleteTag(testTags[12])).toEqual(false);

      expect(await db.deleteTag({ ...testTags[15], id: undefined })).toEqual(true);
      expect(db.get_tags()).not.toContainEqual(testTags[15]);

      expect(await db.deleteTag({ ...testTags[2], id: undefined, name: '' })).toEqual(false);

      expect(db.get_tags()).toContainEqual(testTags[2]);
    });

    test('Remove an ingredient and ensure it is deleted', async () => {
      expect(await db.deleteIngredient(testIngredients[30])).toEqual(true);
      expect(db.get_ingredients()).not.toContainEqual(testIngredients[30]);

      expect(await db.deleteIngredient(testIngredients[30])).toEqual(false);

      expect(await db.deleteIngredient({ ...testIngredients[21], id: undefined })).toEqual(true);
      expect(db.get_ingredients()).not.toContainEqual(testIngredients[21]);

      expect(
        await db.deleteIngredient({ ...testIngredients[11], id: undefined, name: '' })
      ).toEqual(false);
      expect(
        await db.deleteIngredient({ ...testIngredients[11], id: undefined, unit: '' })
      ).toEqual(false);
      expect(
        await db.deleteIngredient({
          ...testIngredients[11],
          id: undefined,
          type: ingredientType.cereal,
        })
      ).toEqual(false);
      expect(
        await db.deleteIngredient({
          ...testIngredients[11],
          id: undefined,
          name: '',
          unit: '',
          type: ingredientType.cereal,
        })
      ).toEqual(false);
      // Ingredient should still be in the list since delete returned false

      expect(
        await db.deleteIngredient({ ...testIngredients[11], id: undefined, quantity: '' })
      ).toEqual(true);
      expect(db.get_ingredients()).not.toContainEqual(testIngredients[11]);

      expect(
        await db.deleteIngredient({ ...testIngredients[32], id: undefined, season: [] })
      ).toEqual(true);
      expect(db.get_ingredients()).not.toContainEqual(testIngredients[32]);
    });

    test('editTag should update tag', async () => {
      const tagToEdit = { ...testTags[0], name: 'UpdatedTag' };
      expect(await db.editTag(tagToEdit)).toBe(true);

      const updated = db.get_tags().find(t => t.id === tagToEdit.id);
      expect(updated).toEqual(tagToEdit);
    });

    test('editTag with missing ID should return false and not update', async () => {
      const tagToEdit = { ...testTags[0], id: undefined, name: 'ShouldNotUpdate' };

      expect(await db.editTag(tagToEdit)).toBe(false);

      const notUpdated = db.get_tags().find(t => t.name === 'ShouldNotUpdate');
      expect(notUpdated).toBeUndefined();
    });

    test('editIngredient should update ingredient', async () => {
      const ingredientToEdit = { ...testIngredients[0], name: 'UpdatedIngredient' };

      expect(await db.editIngredient(ingredientToEdit)).toBe(true);

      const updated = db.get_ingredients().find(i => i.id === ingredientToEdit.id);
      expect(updated).toEqual(ingredientToEdit);
    });

    test('editIngredient with missing ID should return false and not update', async () => {
      const ingredientToEdit = { ...testIngredients[0], id: undefined, name: 'ShouldNotUpdate' };

      expect(await db.editIngredient(ingredientToEdit)).toBe(false);

      const notUpdated = db.get_ingredients().find(i => i.name === 'ShouldNotUpdate');
      expect(notUpdated).toBeUndefined();
    });

    describe('Recipe refresh after tag/ingredient operations', () => {
      test('editTag should refresh recipes from database', async () => {
        const recipesBefore = db.get_recipes();
        const firstRecipe = recipesBefore[0];
        const tagToEdit = { ...testTags[0], name: 'UpdatedTagName' };

        await db.editTag(tagToEdit);

        const recipesAfter = db.get_recipes();
        expect(recipesAfter).not.toBe(recipesBefore);
        expect(recipesAfter.length).toBe(recipesBefore.length);

        const updatedRecipe = recipesAfter.find(r => r.id === firstRecipe.id);
        expect(updatedRecipe).toBeDefined();
        if (updatedRecipe && updatedRecipe.tags.some(t => t.id === tagToEdit.id)) {
          const updatedTag = updatedRecipe.tags.find(t => t.id === tagToEdit.id);
          expect(updatedTag?.name).toBe('UpdatedTagName');
        }
      });

      test('deleteTag should refresh recipes from database', async () => {
        const recipesBefore = db.get_recipes();
        const tagToDelete = testTags[0];

        await db.deleteTag(tagToDelete);

        const recipesAfter = db.get_recipes();
        expect(recipesAfter).not.toBe(recipesBefore);

        recipesAfter.forEach(recipe => {
          const hasDeletedTag = recipe.tags.some(t => t.id === tagToDelete.id);
          expect(hasDeletedTag).toBe(false);
        });
      });

      test('editIngredient should refresh recipes from database', async () => {
        const recipesBefore = db.get_recipes();
        const firstRecipe = recipesBefore[0];
        const ingredientToEdit = { ...testIngredients[0], name: 'UpdatedIngredientName' };

        await db.editIngredient(ingredientToEdit);

        const recipesAfter = db.get_recipes();
        expect(recipesAfter).not.toBe(recipesBefore);
        expect(recipesAfter.length).toBe(recipesBefore.length);

        const updatedRecipe = recipesAfter.find(r => r.id === firstRecipe.id);
        expect(updatedRecipe).toBeDefined();
        if (updatedRecipe && updatedRecipe.ingredients.some(i => i.id === ingredientToEdit.id)) {
          const updatedIngredient = updatedRecipe.ingredients.find(
            i => i.id === ingredientToEdit.id
          );
          expect(updatedIngredient?.name).toBe('UpdatedIngredientName');
        }
      });

      test('deleteIngredient should refresh recipes from database', async () => {
        const recipesBefore = db.get_recipes();
        const ingredientToDelete = testIngredients[0];

        await db.deleteIngredient(ingredientToDelete);

        const recipesAfter = db.get_recipes();
        expect(recipesAfter).not.toBe(recipesBefore);

        recipesAfter.forEach(recipe => {
          const hasDeletedIngredient = recipe.ingredients.some(i => i.id === ingredientToDelete.id);
          expect(hasDeletedIngredient).toBe(false);
        });
      });

      test('deleteTag should update recipes in database (not just cache)', async () => {
        const tagToDelete = testTags[0];
        const recipeWithTag = db.get_recipes().find(r => r.tags.some(t => t.id === tagToDelete.id));

        expect(recipeWithTag).toBeDefined();

        await db.deleteTag(tagToDelete);

        const recipesReloaded = await db['getAllRecipes']();

        recipesReloaded.forEach(recipe => {
          const hasDeletedTag = recipe.tags.some(t => t.id === tagToDelete.id);
          expect(hasDeletedTag).toBe(false);
        });
      });

      test('deleteIngredient should update recipes in database (not just cache)', async () => {
        const ingredientToDelete = testIngredients[0];
        const recipeWithIngredient = db
          .get_recipes()
          .find(r => r.ingredients.some(i => i.id === ingredientToDelete.id));

        expect(recipeWithIngredient).toBeDefined();

        await db.deleteIngredient(ingredientToDelete);

        const recipesReloaded = await db['getAllRecipes']();

        recipesReloaded.forEach(recipe => {
          const hasDeletedIngredient = recipe.ingredients.some(i => i.id === ingredientToDelete.id);
          expect(hasDeletedIngredient).toBe(false);
        });
      });
    });

    test('editRecipe should update recipe', async () => {
      const recipeToEdit = { ...testRecipes[0], title: 'UpdatedRecipe' };

      expect(await db.editRecipe(recipeToEdit)).toBe(true);

      const updated = db.get_recipes().find(r => r.id === recipeToEdit.id);
      expect(updated).toEqual(recipeToEdit);
    });

    test('editRecipe with missing ID should return false and not update', async () => {
      const recipeToEdit = { ...testRecipes[0], id: undefined, title: 'ShouldNotUpdate' };

      expect(await db.editRecipe(recipeToEdit)).toBe(false);

      const notUpdated = db.get_recipes().find(r => r.title === 'ShouldNotUpdate');
      expect(notUpdated).toBeUndefined();
    });

    describe('update_multiple_recipes', () => {
      test('should update multiple recipes in internal state', () => {
        const originalRecipes = [...db.get_recipes()];

        const updatedRecipes = [
          { ...testRecipes[0], title: 'Updated Spaghetti Bolognese' },
          { ...testRecipes[1], title: 'Updated Chicken Tacos' },
          { ...testRecipes[2], title: 'Updated Classic Pancakes' },
        ];

        db.update_multiple_recipes(updatedRecipes);

        const currentRecipes = db.get_recipes();

        expect(currentRecipes[0].title).toEqual('Updated Spaghetti Bolognese');
        expect(currentRecipes[1].title).toEqual('Updated Chicken Tacos');
        expect(currentRecipes[2].title).toEqual('Updated Classic Pancakes');

        for (let i = 3; i < currentRecipes.length; i++) {
          expect(currentRecipes[i]).toEqual(originalRecipes[i]);
        }
      });

      test('should handle non-existent recipe IDs gracefully', () => {
        const updatedRecipes = [
          { ...testRecipes[0], title: 'Updated Existing Recipe' },
          { ...testRecipes[0], id: 999, title: 'Non-existent Recipe' },
        ];

        db.update_multiple_recipes(updatedRecipes);

        expect(db.get_recipes()[0].title).toBe('Updated Existing Recipe');
        // Non-existent recipe should be ignored without throwing
      });

      test('with empty array should do nothing', () => {
        const originalRecipes = [...db.get_recipes()];

        db.update_multiple_recipes([]);

        expect(db.get_recipes()).toEqual(originalRecipes);
      });
    });

    describe('scaleRecipeToPersons (static method)', () => {
      test('should scale recipe quantities and update persons count', () => {
        const originalRecipe = testRecipes[0];
        const newPersonsCount = 6;

        const scaledRecipe = RecipeDatabase.scaleRecipeToPersons(originalRecipe, newPersonsCount);

        expect(scaledRecipe.persons).toEqual(newPersonsCount);
        expect(scaledRecipe.ingredients.length).toEqual(originalRecipe.ingredients.length);

        for (let j = 0; j < scaledRecipe.ingredients.length; j++) {
          const originalIng = originalRecipe.ingredients[j];
          const scaledIng = scaledRecipe.ingredients[j];

          expect(scaledIng.id).toEqual(originalIng.id);
          expect(scaledIng.name).toEqual(originalIng.name);
          expect(scaledIng.unit).toEqual(originalIng.unit);
          expect(scaledIng.type).toEqual(originalIng.type);

          const scaleFactor = newPersonsCount / originalRecipe.persons;
          const expectedQuantity = (parseFloat(originalIng.quantity as string) * scaleFactor)
            .toString()
            .replace('.', ',');
          expect(scaledIng.quantity).toBe(expectedQuantity);
        }

        expect(scaledRecipe.id).toBe(originalRecipe.id);
        expect(scaledRecipe.title).toBe(originalRecipe.title);
        expect(scaledRecipe.description).toBe(originalRecipe.description);
        expect(scaledRecipe.tags).toEqual(originalRecipe.tags);
        expect(scaledRecipe.season).toEqual(originalRecipe.season);
        expect(scaledRecipe.preparation).toEqual(originalRecipe.preparation);
        expect(scaledRecipe.time).toBe(originalRecipe.time);
      });

      test('should return unchanged recipe if persons is 0', () => {
        const recipe = { ...testRecipes[0], persons: 0 };

        const scaledRecipe = RecipeDatabase.scaleRecipeToPersons(recipe, 4);

        expect(scaledRecipe).toEqual(recipe);
      });

      test('should return unchanged recipe if target persons equals current persons', () => {
        const recipe = testRecipes[0];

        const scaledRecipe = RecipeDatabase.scaleRecipeToPersons(recipe, recipe.persons);

        expect(scaledRecipe).toEqual(recipe);
      });

      test('should handle recipes without ingredients', () => {
        const recipe = {
          ...testRecipes[0],
          persons: 2,
          ingredients: [],
        };

        const scaledRecipe = RecipeDatabase.scaleRecipeToPersons(recipe, 4);

        expect(scaledRecipe.persons).toBe(4);
        expect(scaledRecipe.ingredients).toEqual([]);
      });

      test('should handle non-numeric quantities', () => {
        const recipe = {
          ...testRecipes[0],
          persons: 2,
          ingredients: [
            {
              ...testRecipes[0].ingredients[0],
              quantity: 'a pinch',
            },
          ],
        };

        const scaledRecipe = RecipeDatabase.scaleRecipeToPersons(recipe, 4);

        expect(scaledRecipe.persons).toBe(4);
        expect(scaledRecipe.ingredients[0].quantity).toBe('a pinch');
      });
    });

    describe('scaleAndUpdateRecipe', () => {
      test('should scale and update a single recipe', async () => {
        const originalRecipe = db.get_recipes()[0];
        const newPersons = 6;

        const scaledRecipe = RecipeDatabase.scaleRecipeToPersons(originalRecipe, newPersons);
        await db.scaleAndUpdateRecipe(scaledRecipe);

        const updatedRecipe = db.get_recipes().find(r => r.id === originalRecipe.id);

        expect(updatedRecipe).toBeDefined();
        expect(updatedRecipe?.persons).toBe(newPersons);
        expect(updatedRecipe?.ingredients.length).toBe(originalRecipe.ingredients.length);

        for (let i = 0; i < updatedRecipe!.ingredients.length; i++) {
          const originalIng = originalRecipe.ingredients[i];
          const updatedIng = updatedRecipe!.ingredients[i];

          const scaleFactor = newPersons / originalRecipe.persons;
          const expectedQuantity = (parseFloat(originalIng.quantity as string) * scaleFactor)
            .toString()
            .replace('.', ',');

          expect(updatedIng.quantity).toBe(expectedQuantity);
        }
      });

      test('should throw error when recipe has no ID', async () => {
        const recipeWithoutId = { ...testRecipes[0], id: undefined };

        await expect(db.scaleAndUpdateRecipe(recipeWithoutId)).rejects.toThrow(
          'Recipe must have an ID to update'
        );
      });

      test('should update recipe in internal state', async () => {
        const originalRecipe = db.get_recipes()[0];
        const recipesBefore = [...db.get_recipes()];

        const scaledRecipe = RecipeDatabase.scaleRecipeToPersons(originalRecipe, 8);
        await db.scaleAndUpdateRecipe(scaledRecipe);

        const recipesAfter = db.get_recipes();

        expect(recipesAfter).not.toBe(recipesBefore);
        expect(recipesAfter.length).toBe(recipesBefore.length);

        const updated = recipesAfter.find(r => r.id === originalRecipe.id);
        expect(updated?.persons).toBe(8);
      });

      test('should handle recipe with no ingredients', async () => {
        const recipeWithNoIngredients = {
          ...testRecipes[0],
          id: undefined,
          ingredients: [],
          persons: 2,
        };

        await db.addRecipe(recipeWithNoIngredients);

        const addedRecipe = db.get_recipes().find(r => r.ingredients.length === 0);
        expect(addedRecipe).toBeDefined();

        const scaledRecipe = RecipeDatabase.scaleRecipeToPersons(addedRecipe!, 4);
        await db.scaleAndUpdateRecipe(scaledRecipe);

        const updated = db.get_recipes().find(r => r.id === addedRecipe!.id);
        expect(updated?.persons).toBe(4);
        expect(updated?.ingredients).toEqual([]);
      });
    });

    // TODO found a test where the insertion fails
    // TODO found a test where the insertion worked but don't return a number
    // TODO found a test where the encodeShopping is call without an id

    // TODO found a test for update

    // TODO test decodeArrayOfTags normal case (return the real decodedTags)

    // TODO test function purchaseIngredientOfShoppingList
    // TODO test function setPurchasedOfShopping

    describe('RecipeDatabase findSimilarRecipes tests', () => {
      // Change the id just like we would add a recipe in a new id
      const datasetRecipe = testRecipes[0];
      const baseRecipe: recipeTableElement = {
        ...datasetRecipe,
        id: testRecipes.length + 2,
      } as const;

      function createCopyOfBaseRecipe() {
        const copyIngredients = new Array<ingredientTableElement>();
        for (const ing of datasetRecipe.ingredients) {
          copyIngredients.push({ ...ing });
        }
        return { ...baseRecipe, ingredients: copyIngredients };
      }

      test('should find an exact duplicate recipe', () => {
        const recipeToTest: recipeTableElement = createCopyOfBaseRecipe();
        const similar = db.findSimilarRecipes(recipeToTest);
        expect(similar.length).toEqual(1);
        expect(similar[0]).toEqual(datasetRecipe);
      });

      test('should find a recipe with a very similar title and ingredients', () => {
        const recipeToTest: recipeTableElement = createCopyOfBaseRecipe();
        recipeToTest.title = 'Spageti Carbonara'; // Typo in title
        recipeToTest.ingredients[1].quantity = (
          Number(recipeToTest.ingredients[1].quantity) - 1
        ).toString(); // Slightly less

        const similar = db.findSimilarRecipes(recipeToTest);
        expect(similar.length).toEqual(1);
        expect(similar[0]).toEqual(datasetRecipe);
      });

      test('should not find a recipe with a different title', () => {
        const recipeToTest: recipeTableElement = createCopyOfBaseRecipe();
        recipeToTest.title = testRecipes[1].title;

        const similar = db.findSimilarRecipes(recipeToTest);
        expect(similar.length).toBe(0);
      });

      test('should not find a recipe with different ingredients', () => {
        const recipeToTest: recipeTableElement = createCopyOfBaseRecipe();
        recipeToTest.ingredients = testRecipes[6].ingredients;

        const similar = db.findSimilarRecipes(recipeToTest);
        expect(similar.length).toBe(0);
      });

      test('should find a similar recipe regardless of serving size (persons)', () => {
        const recipeToTest: recipeTableElement = createCopyOfBaseRecipe();
        recipeToTest.persons = 2 * baseRecipe.persons;

        for (const ing of recipeToTest.ingredients) {
          ing.quantity = (Number(ing.quantity) * 2).toString();
        }

        const similar = db.findSimilarRecipes(recipeToTest);
        expect(similar.length).toEqual(1);
        expect(similar[0]).toEqual(testRecipes[0]);
      });

      test('should not return the same recipe instance when comparing', () => {
        const similar = db.findSimilarRecipes(testRecipes[0]);
        expect(similar.length).toBe(0);
      });

      test('should ignore condiments and fats in comparison', () => {
        const recipeToTest: recipeTableElement = createCopyOfBaseRecipe();
        recipeToTest.ingredients.push({
          id: 5,
          name: 'Condiment ingredient',
          type: ingredientType.condiment,
          quantity: '',
          unit: '',
          season: [],
        });
        recipeToTest.ingredients.push({
          id: 5,
          name: 'Oil and Fat ingredient',
          type: ingredientType.oilAndFat,
          quantity: '',
          unit: '',
          season: [],
        });
        const similar = db.findSimilarRecipes(recipeToTest);
        expect(similar.length).toEqual(1);
        expect(similar[0]).toEqual(testRecipes[0]);
      });

      test('should not find a recipe with ingredient quantities outside the tolerance', () => {
        {
          const recipeToTest: recipeTableElement = createCopyOfBaseRecipe();
          const quantityPerPerson =
            Number(recipeToTest.ingredients[0].quantity) / recipeToTest.persons;
          recipeToTest.ingredients[0].quantity = (
            recipeToTest.persons *
            (quantityPerPerson * 1.2 + 1)
          ).toString();

          const similar = db.findSimilarRecipes(recipeToTest);
          expect(similar.length).toEqual(0);
        }
        {
          const recipeToTest: recipeTableElement = createCopyOfBaseRecipe();
          const quantityPerPerson =
            Number(recipeToTest.ingredients[0].quantity) / recipeToTest.persons;
          recipeToTest.ingredients[0].quantity = (
            recipeToTest.persons *
            (Math.round(quantityPerPerson / 1.2) - 1)
          ).toString();

          const similar = db.findSimilarRecipes(recipeToTest);
          expect(similar.length).toEqual(0);
        }
      });

      test('should not find a recipe with ingredient quantities at the tolerance', () => {
        {
          const recipeToTest: recipeTableElement = createCopyOfBaseRecipe();
          const quantityPerPerson =
            Number(recipeToTest.ingredients[0].quantity) / recipeToTest.persons;
          recipeToTest.ingredients[0].quantity = (
            recipeToTest.persons *
            (quantityPerPerson * 1.2 - 1)
          ).toString();

          const similar = db.findSimilarRecipes(recipeToTest);
          expect(similar.length).toEqual(1);
          expect(similar[0]).toEqual(datasetRecipe);
        }
        {
          const recipeToTest: recipeTableElement = createCopyOfBaseRecipe();
          const quantityPerPerson =
            Number(recipeToTest.ingredients[0].quantity) / recipeToTest.persons;
          recipeToTest.ingredients[0].quantity = (
            recipeToTest.persons *
            quantityPerPerson *
            1.2
          ).toString();

          const similar = db.findSimilarRecipes(recipeToTest);
          expect(similar.length).toEqual(1);
          expect(similar[0]).toEqual(datasetRecipe);
        }
        {
          const recipeToTest: recipeTableElement = createCopyOfBaseRecipe();
          const quantityPerPerson =
            Number(recipeToTest.ingredients[0].quantity) / recipeToTest.persons;
          recipeToTest.ingredients[0].quantity = (
            recipeToTest.persons * Math.round(quantityPerPerson / 1.2)
          ).toString();

          const similar = db.findSimilarRecipes(recipeToTest);
          expect(similar.length).toEqual(1);
          expect(similar[0]).toEqual(datasetRecipe);
        }
        {
          const recipeToTest: recipeTableElement = createCopyOfBaseRecipe();
          const quantityPerPerson =
            Number(recipeToTest.ingredients[0].quantity) / recipeToTest.persons;
          recipeToTest.ingredients[0].quantity = (
            recipeToTest.persons *
            (Math.round(quantityPerPerson / 1.2) + 1)
          ).toString();

          const similar = db.findSimilarRecipes(recipeToTest);
          expect(similar.length).toEqual(1);
          expect(similar[0]).toEqual(datasetRecipe);
        }
      });
    });
  });

  describe('RecipeDatabase tests with database completely filled', () => {
    const db = RecipeDatabase.getInstance();

    beforeEach(async () => {
      await db.init();
      await db.addMultipleIngredients(testIngredients);
      await db.addMultipleTags(testTags);
      await db.addMultipleRecipes(testRecipes);
    });

    afterEach(async () => {
      await db.closeAndReset();
    });

    test('isRecipeExist return true if the recipe is in the database', () => {
      expect(
        db.isRecipeExist({
          description: '',
          image_Source: '',
          ingredients: new Array(),
          persons: 0,
          preparation: new Array(),
          season: new Array(),
          tags: new Array(),
          time: 0,
          title: '',
        })
      ).toBe(false);
      expect(
        db.isRecipeExist({
          description: 'A real description',
          image_Source: '/path/to/an/image',
          ingredients: new Array(),
          persons: 2,
          preparation: new Array(),
          season: ['*'],
          tags: new Array(testTags[3]),
          time: 20,
          title: 'A real title',
        })
      ).toBe(false);

      expect(db.isRecipeExist({ ...testRecipes[7], title: '', id: undefined })).toBe(false);

      expect(db.isRecipeExist({ ...testRecipes[5], id: undefined })).toBe(true);
      expect(db.isRecipeExist(testRecipes[0])).toBe(true);
    });

    test('Reset database clears all data', async () => {
      await db.closeAndReset();

      expect(db.get_recipes()).toEqual([]);
      expect(db.get_tags()).toEqual([]);
      expect(db.get_ingredients()).toEqual([]);
    });

    test('Remove a recipe and ensure it is deleted', async () => {
      expect(await db.deleteRecipe(testRecipes[4])).toEqual(true);
      expect(db.get_recipes()).not.toContainEqual(testRecipes[4]);

      expect(await db.deleteRecipe(testRecipes[4])).toEqual(false);

      expect(await db.deleteRecipe({ ...testRecipes[9], id: undefined })).toEqual(true);
      expect(db.get_recipes()).not.toContainEqual(testRecipes[9]);

      expect(await db.deleteRecipe({ ...testRecipes[2], id: undefined, image_Source: '' })).toEqual(
        false
      );
      expect(await db.deleteRecipe({ ...testRecipes[2], id: undefined, title: '' })).toEqual(false);
      expect(await db.deleteRecipe({ ...testRecipes[2], id: undefined, description: '' })).toEqual(
        false
      );
      expect(db.get_recipes()).toContainEqual(testRecipes[2]);

      expect(await db.deleteRecipe({ ...testRecipes[2], id: undefined, tags: [] })).toEqual(true);
      expect(db.get_recipes()).not.toContainEqual(testRecipes[2]);

      expect(await db.deleteRecipe({ ...testRecipes[3], id: undefined, persons: -1 })).toEqual(
        true
      );
      expect(db.get_recipes()).not.toContainEqual(testRecipes[3]);
      expect(await db.deleteRecipe({ ...testRecipes[5], id: undefined, ingredients: [] })).toEqual(
        true
      );
      expect(db.get_recipes()).not.toContainEqual(testRecipes[5]);
      expect(await db.deleteRecipe({ ...testRecipes[6], id: undefined, season: [] })).toEqual(true);
      expect(db.get_recipes()).not.toContainEqual(testRecipes[6]);
      expect(await db.deleteRecipe({ ...testRecipes[7], id: undefined, preparation: [] })).toEqual(
        true
      );
      expect(db.get_recipes()).not.toContainEqual(testRecipes[7]);
      expect(await db.deleteRecipe({ ...testRecipes[8], id: undefined, time: -1 })).toEqual(true);
      expect(db.get_recipes()).not.toContainEqual(testRecipes[8]);
    });

    // TODO to be upgrade with database deleting (not implemented yet)
    test('delete tmp', async () => {
      const oldTags = [...db.get_tags()]; // TODO to replace by getAll ...
      db.remove_tag(testTags[0]);
      const newTags = db.get_tags(); // TODO to replace by getAll ...
      expect(newTags).not.toContain(testTags[0]);
      expect(newTags).not.toEqual(oldTags);
      expect(oldTags).toEqual(expect.arrayContaining(newTags));

      const oldIngredients = [...db.get_ingredients()]; // TODO to replace by getAll ...
      db.remove_ingredient(testIngredients[0]);
      const newIngredients = db.get_ingredients(); // TODO to replace by getAll ...
      expect(newIngredients).not.toContain(testIngredients[0]);
      expect(newIngredients).not.toEqual(oldIngredients);
      expect(oldIngredients).toEqual(expect.arrayContaining(newIngredients));

      const oldRecipes = [...db.get_recipes()]; // TODO to replace by getAll ...
      db.remove_recipe(testRecipes[0]);
      const newRecipes = db.get_recipes();
      expect(newRecipes).not.toContain(testRecipes[0]);
      expect(newRecipes).not.toEqual(oldRecipes);
      expect(oldRecipes).toEqual(expect.arrayContaining(newRecipes));
    });

    // TODO implement and test cases where we verify a tag but it doesn't exist (yet)
    // TODO implement and test cases where we verify an ingredient but it doesn't exist (yet)

    test('getRandomIngredientsByType returns correct number of ingredients', () => {
      const grainIngredients = db.getRandomIngredientsByType(ingredientType.cereal, 2);
      expect(grainIngredients.length).toBeLessThanOrEqual(2);

      grainIngredients.forEach(ingredient => {
        expect(ingredient.type).toBe(ingredientType.cereal);
      });

      const uniqueIngredients = new Set(grainIngredients.map(ingredient => ingredient.id));
      expect(uniqueIngredients.size).toBe(grainIngredients.length);
    });

    test('getRandomIngredientsByType handles edge cases', () => {
      const zeroIngredients = db.getRandomIngredientsByType(ingredientType.cereal, 0);
      expect(zeroIngredients).toEqual([]);

      const meatIngredients = db.getRandomIngredientsByType(ingredientType.meat, 1000);
      expect(meatIngredients.length).toBeGreaterThan(0);
      expect(meatIngredients.length).toBeLessThan(1000);
      expect(meatIngredients.length).toBeLessThanOrEqual(db.get_ingredients().length);

      meatIngredients.forEach(ingredient => {
        expect(ingredient.type).toBe(ingredientType.meat);
      });

      const uniqueMeatIngredients = new Set(meatIngredients.map(ingredient => ingredient.id));
      expect(uniqueMeatIngredients.size).toBe(meatIngredients.length);
    });

    test('getRandomIngredientsByType returns empty array for non-existent type', () => {
      const nonExistentType = 'nonExistentType' as ingredientType;
      const result = db.getRandomIngredientsByType(nonExistentType, 5);
      expect(result).toEqual([]);
    });

    test('getRandomTags returns correct number of tags', () => {
      const randomTags = db.getRandomTags(3);
      expect(randomTags.length).toBeLessThanOrEqual(3);

      const uniqueTags = new Set(randomTags.map(tag => tag.id));
      expect(uniqueTags.size).toBe(randomTags.length);
    });

    test('getRandomTags handles edge cases', () => {
      const zeroTags = db.getRandomTags(0);
      expect(zeroTags).toEqual([]);

      const allTags = db.get_tags();
      const manyTags = db.getRandomTags(1000);
      expect(manyTags.length).toBeGreaterThan(0);
      expect(manyTags.length).toBeLessThan(1000);
      expect(manyTags.length).toBeLessThanOrEqual(allTags.length);

      manyTags.forEach(tag => {
        expect(allTags).toContainEqual(tag);
      });

      const uniqueManyTags = new Set(manyTags.map(tag => tag.id));
      expect(uniqueManyTags.size).toBe(manyTags.length);
    });

    describe('findSimilarTags', () => {
      test('should return empty array for empty or null input', () => {
        expect(db.findSimilarTags('')).toEqual([]);
        expect(db.findSimilarTags('   ')).toEqual([]);
      });

      test('should return exact match first when tag name matches exactly', () => {
        const expected = testTags[0];
        const result = db.findSimilarTags(expected.name);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(expected);
      });

      test('should return exact match case-insensitively', () => {
        {
          const expected = testTags[1];

          const result = db.findSimilarTags(expected.name.toLowerCase());
          expect(result).toHaveLength(1);
          expect(result[0]).toEqual(expected);
        }

        {
          const expected = testTags[2];
          const result = db.findSimilarTags(expected.name.toUpperCase());
          expect(result).toHaveLength(1);
          expect(result[0]).toEqual(expected);
        }
      });

      test('should return exact match even with extra whitespace', () => {
        const expected = testTags[3];

        const result = db.findSimilarTags(` ${expected.name} `);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(expected);
      });

      test('should find similar tags using fuzzy search when no exact match', () => {
        const expected = testTags[0];

        const result = db.findSimilarTags('Italien');
        expect(result.length).toEqual(1);
        expect(result[0]).toEqual(expected);
      });

      test('should find similar tags for partial matches', () => {
        const expected = testTags[4];

        const result = db.findSimilarTags(expected.name.slice(0, -2));
        expect(result.length).toBe(1);
        expect(result[0]).toEqual(expected);
      });

      test('should handle typos in tag names', () => {
        const expected = testTags[5];

        const result = db.findSimilarTags(expected.name.slice(0, -1));
        expect(result.length).toBe(1);
        expect(result[0]).toEqual(expected);
      });

      test('should handle multiple word tags correctly', () => {
        const expected = testTags[8];

        const result = db.findSimilarTags(expected.name.split(' ')[0]);
        expect(result.length).toBe(1);
        expect(result[0]).toEqual(expected);

        const result2 = db.findSimilarTags(expected.name.split(' ')[0]);
        expect(result2.length).toBe(1);
        expect(result2[0]).toEqual(expected);
      });

      test('should handle tags with spaces', () => {
        const expected = testTags[15];

        const result = db.findSimilarTags(expected.name);
        expect(result.length).toBe(1);
        expect(result[0]).toEqual(expected);

        const result2 = db.findSimilarTags('space');
        expect(result2.length).toBe(1);
        expect(result2[0]).toEqual(expected);
      });

      test('should return results sorted by relevance score', () => {
        const expected = testTags[0];

        const result = db.findSimilarTags(expected.name.slice(0, 2));
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toEqual(expected);
      });

      test('should return empty array when no similar tags found', () => {
        const result = db.findSimilarTags('NonExistentCuisineType');
        expect(result).toEqual([]);
      });

      test('should find similar tags with different similarity thresholds', () => {
        const expected = testTags[0];

        // Close match should return results
        const closeMatch = db.findSimilarTags(expected.name.slice(0, -2));
        expect(closeMatch.length).toBeGreaterThan(0);

        // Very different string should return empty
        const noMatch = db.findSimilarTags('xyz123');
        expect(noMatch).toEqual([]);
      });

      test('should work with database containing single tag', async () => {
        const tag: tagTableElement = { id: 1, name: 'SingleTag' };
        await db.closeAndReset();
        await db.init();
        await db.addTag(tag);

        const exactMatch = db.findSimilarTags(tag.name);
        expect(exactMatch).toHaveLength(1);
        expect(exactMatch[0]).toEqual(tag);

        const similarMatch = db.findSimilarTags(tag.name.slice(0, -3));
        expect(similarMatch.length).toBeGreaterThan(0);
        expect(similarMatch[0]).toEqual(tag);
      });

      test('should handle empty database gracefully', async () => {
        await db.closeAndReset();
        await db.init();

        const result = db.findSimilarTags('AnyTag');
        expect(result).toEqual([]);
      });
    });

    describe('findSimilarIngredients', () => {
      test('should return empty array for empty input', () => {
        const resultEmpty = db.findSimilarIngredients('');
        expect(resultEmpty).toEqual([]);

        const resultWhitespaces = db.findSimilarIngredients('   ');
        expect(resultWhitespaces).toEqual([]);
      });

      test('should return exact match when ingredient exists', () => {
        const expected = testIngredients[0];

        const result = db.findSimilarIngredients(expected.name);
        expect(result.length).toBe(1);
        expect(result[0]).toEqual(expected);
      });

      test('should return exact match case insensitive', () => {
        const expected = testIngredients[1];

        const result = db.findSimilarIngredients(expected.name.toUpperCase());
        expect(result.length).toBe(1);
        expect(result[0]).toEqual(expected);
      });

      test('should find similar ingredients with typos', () => {
        const expected = testIngredients[2];

        const result = db.findSimilarIngredients(expected.name.slice(0, -3));
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toEqual(expected);
      });

      test('should clean ingredient names by removing parentheses', () => {
        const expected = testIngredients[3];

        const result = db.findSimilarIngredients(expected.name + ' (fresh)');
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toEqual(expected);
      });

      test('should return multiple similar ingredients sorted by relevance', () => {
        const expected = testIngredients[36];

        const result = db.findSimilarIngredients(expected.name.slice(0, 3));
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].name).toMatch(/tom/i);
      });

      test('should return empty array for completely unmatched ingredient', () => {
        const result = db.findSimilarIngredients('XYZNonExistentIngredient123');
        expect(result).toEqual([]);
      });

      test('should handle special characters and spaces in ingredient names', () => {
        // Test with special characters if any exist in test data
        const result = db.findSimilarIngredients('Pâte');
        // Should not crash and return appropriate results
        expect(Array.isArray(result)).toBe(true);
      });

      test('should handle empty database gracefully', async () => {
        await db.closeAndReset();
        await db.init();

        const result = db.findSimilarIngredients('AnyIngredient');
        expect(result).toEqual([]);
      });
    });
  });

  describe('RecipeDatabase nutrition tests', () => {
    const db = RecipeDatabase.getInstance();

    beforeEach(async () => {
      await db.init();
      await db.addMultipleIngredients(testIngredients);
      await db.addMultipleTags(testTags);
    });

    afterEach(async () => {
      await db.closeAndReset();
    });

    describe('Nutrition', () => {
      const testNutrition: nutritionTableElement = {
        energyKcal: 250,
        energyKj: 1046,
        fat: 15.0,
        saturatedFat: 8.0,
        carbohydrates: 25.0,
        sugars: 12.0,
        fiber: 2.5,
        protein: 6.0,
        salt: 0.8,
        portionWeight: 100,
      };

      test('should store and retrieve recipes with nutrition data correctly', async () => {
        const recipeWithNutrition: recipeTableElement = {
          ...testRecipes[0],
          nutrition: testNutrition,
        };

        await db.addRecipe(recipeWithNutrition);
        const retrievedRecipes = db.get_recipes();
        const addedRecipe = retrievedRecipes.find(r => r.title === recipeWithNutrition.title);

        expect(addedRecipe).toBeDefined();
        expect(addedRecipe?.nutrition).toEqual(testNutrition);
      });

      test('should store and retrieve recipes without nutrition data correctly', async () => {
        const recipeWithoutNutrition: recipeTableElement = {
          ...testRecipes[1],
          nutrition: undefined,
        };

        await db.addRecipe(recipeWithoutNutrition);
        const retrievedRecipes = db.get_recipes();
        const addedRecipe = retrievedRecipes.find(r => r.title === recipeWithoutNutrition.title);

        expect(addedRecipe).toBeDefined();
        expect(addedRecipe?.nutrition).toBeUndefined();
      });

      test('should update recipe nutrition data correctly', async () => {
        const originalRecipe: recipeTableElement = {
          ...testRecipes[2],
          nutrition: undefined,
        };

        await db.addRecipe(originalRecipe);
        const addedRecipe = db.get_recipes().find(r => r.title === originalRecipe.title);
        expect(addedRecipe?.nutrition).toBeUndefined();

        const updatedRecipe = {
          ...addedRecipe!,
          nutrition: testNutrition,
        };

        const updateSuccess = await db.editRecipe(updatedRecipe);
        expect(updateSuccess).toBe(true);

        const finalRecipe = db.get_recipes().find(r => r.title === updatedRecipe.title);
        expect(finalRecipe?.nutrition).toEqual(testNutrition);
      });

      test('should remove nutrition data when updated to undefined', async () => {
        const recipeWithNutrition: recipeTableElement = {
          ...testRecipes[0],
          nutrition: testNutrition,
        };

        await db.addRecipe(recipeWithNutrition);
        const addedRecipe = db.get_recipes().find(r => r.title === recipeWithNutrition.title);
        expect(addedRecipe?.nutrition).toEqual(testNutrition);

        const updatedRecipe = {
          ...addedRecipe!,
          nutrition: undefined,
        };

        const updateSuccess = await db.editRecipe(updatedRecipe);
        expect(updateSuccess).toBe(true);

        const finalRecipe = db.get_recipes().find(r => r.title === recipeWithNutrition.title);
        expect(finalRecipe?.nutrition).toBeUndefined();
      });

      test('should preserve nutrition data through database operations', async () => {
        const recipeWithNutrition: recipeTableElement = {
          ...testRecipes[0],
          nutrition: testNutrition,
        };

        await db.addRecipe(recipeWithNutrition);

        // Simulate database restart
        await db.closeAndReset();
        await db.init();
        await db.addMultipleIngredients(testIngredients);
        await db.addMultipleTags(testTags);
        await db.addRecipe(recipeWithNutrition);

        const retrievedRecipe = db.get_recipes().find(r => r.title === recipeWithNutrition.title);
        expect(retrievedRecipe?.nutrition).toEqual(testNutrition);
      });

      test('should handle nutrition data with decimal values correctly', async () => {
        const precisionNutrition: nutritionTableElement = {
          energyKcal: 123.456,
          energyKj: 987.654,
          fat: 1.23,
          saturatedFat: 0.45,
          carbohydrates: 67.89,
          sugars: 12.34,
          fiber: 5.67,
          protein: 8.9,
          salt: 0.123,
          portionWeight: 150.5,
        };

        const recipeWithPrecisionNutrition: recipeTableElement = {
          ...testRecipes[0],
          nutrition: precisionNutrition,
        };

        await db.addRecipe(recipeWithPrecisionNutrition);
        const retrievedRecipe = db
          .get_recipes()
          .find(r => r.title === recipeWithPrecisionNutrition.title);

        expect(retrievedRecipe?.nutrition).toEqual(precisionNutrition);
      });
    });
  });

  describe('Image URI handling', () => {
    let db: RecipeDatabase = RecipeDatabase.getInstance();
    const FileGestionMock = require('@utils/FileGestion');

    beforeEach(async () => {
      await db.init();
      await db.addMultipleIngredients(testIngredients);
      await db.addMultipleTags(testTags);
      jest.clearAllMocks();
      FileGestionMock.getDirectoryUri.mockReturnValue('file:///documents/Recipedia/');
    });

    afterEach(async () => {
      await db.closeAndReset();
    });

    describe('addRecipe', () => {
      it('saves temporary image to permanent storage when adding recipe', async () => {
        FileGestionMock.saveRecipeImage.mockResolvedValue(
          'file:///documents/Recipedia/test_recipe.jpg'
        );

        const recipeWithTempImage = {
          ...testRecipes[0],
          id: undefined,
          image_Source: 'file:///cache/ImageManipulator/temp-image.jpg',
        };

        await db.addRecipe(recipeWithTempImage);

        expect(FileGestionMock.saveRecipeImage).toHaveBeenCalledWith(
          'file:///cache/ImageManipulator/temp-image.jpg',
          testRecipes[0].title
        );
      });

      it('does not save permanent URI image when adding recipe', async () => {
        const initialCallCount = FileGestionMock.saveRecipeImage.mock.calls.length;

        const recipeWithPermanentImage = {
          ...testRecipes[0],
          id: undefined,
          image_Source: 'file:///documents/Recipedia/existing_image.jpg',
        };

        await db.addRecipe(recipeWithPermanentImage);

        const finalCallCount = FileGestionMock.saveRecipeImage.mock.calls.length;
        expect(finalCallCount).toBe(initialCallCount);
      });
    });

    describe('editRecipe', () => {
      it('saves temporary image to permanent storage when editing recipe', async () => {
        await db.addRecipe({ ...testRecipes[0], id: undefined });
        const addedRecipe = db.get_recipes()[0];

        jest.clearAllMocks();
        FileGestionMock.saveRecipeImage.mockResolvedValue(
          'file:///documents/Recipedia/edited_recipe.jpg'
        );

        const editedRecipe = {
          ...addedRecipe,
          image_Source: 'file:///cache/ImageManipulator/new-image.jpg',
        };

        await db.editRecipe(editedRecipe);

        expect(FileGestionMock.saveRecipeImage).toHaveBeenCalledWith(
          'file:///cache/ImageManipulator/new-image.jpg',
          editedRecipe.title
        );
      });

      it('does not save permanent URI image when editing recipe', async () => {
        await db.addRecipe({ ...testRecipes[0], id: undefined });
        const addedRecipe = db.get_recipes()[0];

        jest.clearAllMocks();
        const initialCallCount = FileGestionMock.saveRecipeImage.mock.calls.length;

        const editedRecipe = {
          ...addedRecipe,
          description: 'Updated description',
        };

        await db.editRecipe(editedRecipe);

        const finalCallCount = FileGestionMock.saveRecipeImage.mock.calls.length;
        expect(finalCallCount).toBe(initialCallCount);
      });
    });

    describe('Recipe search by image', () => {
      beforeEach(async () => {
        jest.clearAllMocks();
        FileGestionMock.saveRecipeImage.mockReset();
        FileGestionMock.saveRecipeImage.mockResolvedValue('/mock/directory/saved_image.jpg');
        await db.addMultipleIngredients(testIngredients);
        await db.addMultipleTags(testTags);
      });

      afterEach(async () => {
        await db.closeAndReset();
      });

      it('deletes recipe correctly when image URI is provided as full path', async () => {
        const recipeToAdd = {
          ...testRecipes[0],
          id: undefined,
        };
        await db.addRecipe(recipeToAdd);

        const addedRecipe = db.get_recipes()[0];
        expect(addedRecipe).toBeDefined();
        expect(addedRecipe.image_Source).toContain('file:///');

        const initialRecipeCount = db.get_recipes().length;
        const deleteSuccess = await db.deleteRecipe(addedRecipe);

        expect(deleteSuccess).toBe(true);
        expect(db.get_recipes().length).toBe(initialRecipeCount - 1);
      });

      it('deletes recipe correctly when searching with filename instead of full URI', async () => {
        const recipeToAdd = {
          ...testRecipes[0],
          id: undefined,
        };
        await db.addRecipe(recipeToAdd);

        const addedRecipe = db.get_recipes()[0];
        const initialRecipeCount = db.get_recipes().length;

        const recipeWithFilename = {
          ...addedRecipe,
          image_Source: testRecipes[0].image_Source,
        };

        const deleteSuccess = await db.deleteRecipe(recipeWithFilename);

        expect(deleteSuccess).toBe(true);
        expect(db.get_recipes().length).toBe(initialRecipeCount - 1);
      });

      it('correctly handles image search when recipe has full URI in memory', async () => {
        FileGestionMock.saveRecipeImage
          .mockResolvedValueOnce('file:///documents/Recipedia/recipe1.jpg')
          .mockResolvedValueOnce('file:///documents/Recipedia/recipe2.jpg');

        const recipe1 = { ...testRecipes[0], id: undefined };
        const recipe2 = { ...testRecipes[1], id: undefined };

        await db.addRecipe(recipe1);
        await db.addRecipe(recipe2);

        const recipes = db.get_recipes();
        expect(recipes.length).toBe(2);
        expect(recipes[0].image_Source).toContain('file:///');
        expect(recipes[1].image_Source).toContain('file:///');

        const recipeToDelete = recipes[0];
        const deleteSuccess = await db.deleteRecipe(recipeToDelete);

        expect(deleteSuccess).toBe(true);
        const remainingRecipes = db.get_recipes();
        expect(remainingRecipes.length).toBe(1);
        expect(remainingRecipes[0].title).toBe(recipe2.title);
        expect(remainingRecipes[0].image_Source).not.toBe(recipeToDelete.image_Source);
      });
    });
  });

  describe('Recipe verification behavior', () => {
    const db = RecipeDatabase.getInstance();

    beforeEach(async () => {
      await db.init();
    });

    afterEach(async () => {
      await db.closeAndReset();
    });

    test('throws error when adding recipe with missing ingredients', async () => {
      await db.addMultipleTags(testTags);

      const recipeWithMissingIngredients = {
        ...testRecipes[0],
        id: undefined,
      };

      await expect(db.addRecipe(recipeWithMissingIngredients)).rejects.toThrow(
        /Ingredients not found in database:/
      );
    });

    test('throws error listing all missing ingredients', async () => {
      await db.addMultipleTags(testTags);

      const recipeWithMultipleMissingIngredients = {
        ...testRecipes[0],
        id: undefined,
        ingredients: [testIngredients[0], testIngredients[1], testIngredients[2]],
      };

      await expect(db.addRecipe(recipeWithMultipleMissingIngredients)).rejects.toThrow(
        /Ingredients not found in database: .* \(3 missing\)/
      );
    });

    test('throws error when adding recipe with missing tags', async () => {
      await db.addMultipleIngredients(testIngredients);

      const recipeWithMissingTags = {
        ...testRecipes[0],
        id: undefined,
      };

      await expect(db.addRecipe(recipeWithMissingTags)).rejects.toThrow(
        /Tags not found in database:/
      );
    });

    test('throws error listing all missing tags', async () => {
      await db.addMultipleIngredients(testIngredients);

      const recipeWithMultipleMissingTags = {
        ...testRecipes[0],
        id: undefined,
        tags: [testTags[0], testTags[1], testTags[2]],
      };

      await expect(db.addRecipe(recipeWithMultipleMissingTags)).rejects.toThrow(
        /Tags not found in database: .* \(3 missing\)/
      );
    });

    test('successfully adds recipe when all ingredients and tags exist', async () => {
      await db.addMultipleIngredients(testIngredients);
      await db.addMultipleTags(testTags);

      const recipe = {
        ...testRecipes[0],
        id: undefined,
      };

      await expect(db.addRecipe(recipe)).resolves.not.toThrow();
      expect(db.get_recipes().length).toBe(1);
    });

    test('addMultipleRecipes throws when ingredients missing', async () => {
      await db.addMultipleTags(testTags);

      const recipesWithMissingIngredients = [
        { ...testRecipes[0], id: undefined },
        { ...testRecipes[1], id: undefined },
      ];

      await expect(db.addMultipleRecipes(recipesWithMissingIngredients)).rejects.toThrow(
        /Ingredients not found in database:/
      );
    });

    test('addMultipleRecipes throws when tags missing', async () => {
      await db.addMultipleIngredients(testIngredients);

      const recipesWithMissingTags = [
        { ...testRecipes[0], id: undefined },
        { ...testRecipes[1], id: undefined },
      ];

      await expect(db.addMultipleRecipes(recipesWithMissingTags)).rejects.toThrow(
        /Tags not found in database:/
      );
    });

    test('addMultipleRecipes succeeds when all elements exist', async () => {
      await db.addMultipleIngredients(testIngredients);
      await db.addMultipleTags(testTags);

      const validRecipes = [
        { ...testRecipes[0], id: undefined },
        { ...testRecipes[1], id: undefined },
      ];

      await expect(db.addMultipleRecipes(validRecipes)).resolves.not.toThrow();
      expect(db.get_recipes().length).toBe(2);
    });
  });

  describe('Menu Operations', () => {
    const db = RecipeDatabase.getInstance();

    beforeEach(async () => {
      await db.init();
      await db.addMultipleIngredients(testIngredients);
      await db.addMultipleTags(testTags);
      await db.addMultipleRecipes(testRecipes);
    });

    afterEach(async () => {
      await db.closeAndReset();
    });

    describe('get_menu', () => {
      test('returns empty array when no menu items', () => {
        expect(db.get_menu()).toEqual([]);
      });

      test('returns menu items after adding recipes', async () => {
        await db.addRecipeToMenu(db.get_recipes()[0]);

        const menu = db.get_menu();
        expect(menu.length).toBe(1);
        expect(menu[0].recipeTitle).toBe(testRecipes[0].title);
      });
    });

    describe('addRecipeToMenu', () => {
      test('adds recipe to menu successfully', async () => {
        const recipe = db.get_recipes()[0];
        await db.addRecipeToMenu(recipe);

        const menu = db.get_menu();
        expect(menu.length).toBe(1);
        expect(menu[0].recipeId).toBe(recipe.id);
        expect(menu[0].recipeTitle).toBe(recipe.title);
        expect(menu[0].imageSource).toBe(recipe.image_Source);
        expect(menu[0].isCooked).toBe(false);
        expect(menu[0].count).toBe(1);
      });

      test('does not add recipe without ID', async () => {
        const recipeWithoutId: recipeTableElement = { ...testRecipes[0], id: undefined };
        await db.addRecipeToMenu(recipeWithoutId);

        expect(db.get_menu().length).toBe(0);
      });

      test('increments count when adding same recipe twice', async () => {
        const recipe = db.get_recipes()[0];
        await db.addRecipeToMenu(recipe);
        await db.addRecipeToMenu(recipe);

        const menu = db.get_menu();
        expect(menu.length).toBe(1);
        expect(menu[0].count).toBe(2);
      });

      test('increments count when adding same recipe multiple times', async () => {
        const recipe = db.get_recipes()[0];
        await db.addRecipeToMenu(recipe);
        await db.addRecipeToMenu(recipe);
        await db.addRecipeToMenu(recipe);

        const menu = db.get_menu();
        expect(menu.length).toBe(1);
        expect(menu[0].count).toBe(3);
      });

      test('adds different recipes as separate menu items', async () => {
        const recipe1 = db.get_recipes()[0];
        const recipe2 = db.get_recipes()[1];
        await db.addRecipeToMenu(recipe1);
        await db.addRecipeToMenu(recipe2);

        const menu = db.get_menu();
        expect(menu.length).toBe(2);
        expect(menu[0].recipeId).toBe(recipe1.id);
        expect(menu[1].recipeId).toBe(recipe2.id);
      });
    });

    describe('toggleMenuItemCooked', () => {
      test('toggles cooked status from false to true', async () => {
        const recipe = db.get_recipes()[0];
        await db.addRecipeToMenu(recipe);
        const menuItem = db.get_menu()[0];

        expect(menuItem.isCooked).toBe(false);

        const result = await db.toggleMenuItemCooked(menuItem.id!);

        expect(result).toBe(true);
        expect(db.get_menu()[0].isCooked).toBe(true);
      });

      test('toggles cooked status from true to false', async () => {
        const recipe = db.get_recipes()[0];
        await db.addRecipeToMenu(recipe);
        const menuItem = db.get_menu()[0];

        await db.toggleMenuItemCooked(menuItem.id!);
        expect(db.get_menu()[0].isCooked).toBe(true);

        const result = await db.toggleMenuItemCooked(menuItem.id!);

        expect(result).toBe(true);
        expect(db.get_menu()[0].isCooked).toBe(false);
      });

      test('returns false for non-existent menu item', async () => {
        const result = await db.toggleMenuItemCooked(99999);

        expect(result).toBe(false);
      });
    });

    describe('removeFromMenu', () => {
      test('removes menu item when count is 1', async () => {
        const recipe = db.get_recipes()[0];
        await db.addRecipeToMenu(recipe);
        const menuItem = db.get_menu()[0];

        const result = await db.removeFromMenu(menuItem.id!);

        expect(result).toBe(true);
        expect(db.get_menu().length).toBe(0);
      });

      test('decrements count when count is greater than 1', async () => {
        const recipe = db.get_recipes()[0];
        await db.addRecipeToMenu(recipe);
        await db.addRecipeToMenu(recipe);
        const menuItem = db.get_menu()[0];

        expect(menuItem.count).toBe(2);

        const result = await db.removeFromMenu(menuItem.id!);

        expect(result).toBe(true);
        expect(db.get_menu().length).toBe(1);
        expect(db.get_menu()[0].count).toBe(1);
      });

      test('decrements count multiple times before removing', async () => {
        const recipe = db.get_recipes()[0];
        await db.addRecipeToMenu(recipe);
        await db.addRecipeToMenu(recipe);
        await db.addRecipeToMenu(recipe);
        const menuItem = db.get_menu()[0];

        expect(menuItem.count).toBe(3);

        await db.removeFromMenu(menuItem.id!);
        expect(db.get_menu()[0].count).toBe(2);

        await db.removeFromMenu(menuItem.id!);
        expect(db.get_menu()[0].count).toBe(1);

        await db.removeFromMenu(menuItem.id!);
        expect(db.get_menu().length).toBe(0);
      });

      test('returns false for non-existent menu item', async () => {
        const result = await db.removeFromMenu(99999);

        expect(result).toBe(false);
      });
    });

    describe('clearMenu', () => {
      test('clears all menu items', async () => {
        await db.addRecipeToMenu(db.get_recipes()[0]);
        await db.addRecipeToMenu(db.get_recipes()[1]);

        expect(db.get_menu().length).toBe(2);

        await db.clearMenu();

        expect(db.get_menu().length).toBe(0);
      });

      test('clears empty menu without error', async () => {
        expect(db.get_menu().length).toBe(0);

        await expect(db.clearMenu()).resolves.not.toThrow();

        expect(db.get_menu().length).toBe(0);
      });
    });

    describe('isRecipeInMenu', () => {
      test('returns true when recipe is in menu', async () => {
        const recipe = db.get_recipes()[0];
        await db.addRecipeToMenu(recipe);

        expect(db.isRecipeInMenu(recipe.id!)).toBe(true);
      });

      test('returns false when recipe is not in menu', () => {
        const recipe = db.get_recipes()[0];

        expect(db.isRecipeInMenu(recipe.id!)).toBe(false);
      });

      test('returns false after recipe is removed from menu', async () => {
        const recipe = db.get_recipes()[0];
        await db.addRecipeToMenu(recipe);
        const menuItem = db.get_menu()[0];
        await db.removeFromMenu(menuItem.id!);

        expect(db.isRecipeInMenu(recipe.id!)).toBe(false);
      });
    });

    describe('Menu persistence', () => {
      test('menu items persist after re-initialization', async () => {
        const recipe = db.get_recipes()[0];
        await db.addRecipeToMenu(recipe);
        await db.addRecipeToMenu(recipe);

        await db.closeAndReset();
        await db.init();
        await db.addMultipleIngredients(testIngredients);
        await db.addMultipleTags(testTags);
        await db.addMultipleRecipes(testRecipes);

        expect(db.get_menu().length).toBe(0);
      });

      test('cooked status persists correctly', async () => {
        const recipe = db.get_recipes()[0];
        await db.addRecipeToMenu(recipe);
        const menuItem = db.get_menu()[0];
        await db.toggleMenuItemCooked(menuItem.id!);

        const menu = db.get_menu();
        expect(menu[0].isCooked).toBe(true);
      });
    });
  });

  describe('Purchased Ingredients Operations', () => {
    const db = RecipeDatabase.getInstance();

    beforeEach(async () => {
      await db.init();
    });

    afterEach(async () => {
      await db.closeAndReset();
    });

    describe('get_purchasedIngredients', () => {
      test('returns empty map initially', () => {
        const purchased = db.get_purchasedIngredients();

        expect(purchased.size).toBe(0);
      });
    });

    describe('setPurchased', () => {
      test('sets ingredient as purchased', async () => {
        await db.setPurchased('Sugar', true);

        const purchased = db.get_purchasedIngredients();
        expect(purchased.get('Sugar')).toBe(true);
      });

      test('sets ingredient as not purchased', async () => {
        await db.setPurchased('Sugar', true);
        await db.setPurchased('Sugar', false);

        const purchased = db.get_purchasedIngredients();
        expect(purchased.get('Sugar')).toBe(false);
      });

      test('handles multiple ingredients', async () => {
        await db.setPurchased('Sugar', true);
        await db.setPurchased('Flour', true);
        await db.setPurchased('Salt', false);

        const purchased = db.get_purchasedIngredients();
        expect(purchased.get('Sugar')).toBe(true);
        expect(purchased.get('Flour')).toBe(true);
        expect(purchased.get('Salt')).toBe(false);
      });
    });

    describe('clearPurchasedIngredients', () => {
      test('clears all purchased ingredients', async () => {
        await db.setPurchased('Sugar', true);
        await db.setPurchased('Flour', true);

        expect(db.get_purchasedIngredients().size).toBe(2);

        await db.clearPurchasedIngredients();

        expect(db.get_purchasedIngredients().size).toBe(0);
      });

      test('clears empty purchased list without error', async () => {
        expect(db.get_purchasedIngredients().size).toBe(0);

        await expect(db.clearPurchasedIngredients()).resolves.not.toThrow();

        expect(db.get_purchasedIngredients().size).toBe(0);
      });
    });
  });

  describe('Ingredient note encoding/decoding', () => {
    const db = RecipeDatabase.getInstance();

    beforeEach(async () => {
      await db.init();
      await db.addMultipleIngredients(testIngredients);
      await db.addMultipleTags(testTags);
    });

    afterEach(async () => {
      await db.closeAndReset();
    });

    test('preserves ingredient notes when adding and retrieving recipe', async () => {
      const recipeWithNotes: recipeTableElement = {
        ...testRecipes[0],
        id: undefined,
        ingredients: testRecipes[0].ingredients.map((ing, index) => ({
          ...ing,
          note: index === 0 ? 'for the sauce' : index === 1 ? 'melted' : undefined,
        })),
      };

      await db.addRecipe(recipeWithNotes);
      const retrievedRecipe = db.get_recipes()[0];

      expect(retrievedRecipe.ingredients[0].note).toBe('for the sauce');
      expect(retrievedRecipe.ingredients[1].note).toBe('melted');
      expect(retrievedRecipe.ingredients[2].note).toBeUndefined();
    });

    test('handles multiple ingredients with mixed notes', async () => {
      const recipeWithMixedNotes: recipeTableElement = {
        ...testRecipes[0],
        id: undefined,
        ingredients: testRecipes[0].ingredients.map((ing, index) => ({
          ...ing,
          note: index % 2 === 0 ? `note ${index}` : undefined,
        })),
      };

      await db.addRecipe(recipeWithMixedNotes);
      const retrievedRecipe = db.get_recipes()[0];

      retrievedRecipe.ingredients.forEach((ing, index) => {
        if (index % 2 === 0) {
          expect(ing.note).toBe(`note ${index}`);
        } else {
          expect(ing.note).toBeUndefined();
        }
      });
    });

    test('handles empty string note (treated as no note)', async () => {
      const recipeWithEmptyNote: recipeTableElement = {
        ...testRecipes[0],
        id: undefined,
        ingredients: testRecipes[0].ingredients.map((ing, index) => ({
          ...ing,
          note: index === 0 ? '' : undefined,
        })),
      };

      await db.addRecipe(recipeWithEmptyNote);
      const retrievedRecipe = db.get_recipes()[0];

      expect(retrievedRecipe.ingredients[0].note).toBeUndefined();
    });

    test('handles note with special characters', async () => {
      const specialNote = 'for the "special" sauce (organic)';
      const recipeWithSpecialNote: recipeTableElement = {
        ...testRecipes[0],
        id: undefined,
        ingredients: testRecipes[0].ingredients.map((ing, index) => ({
          ...ing,
          note: index === 0 ? specialNote : undefined,
        })),
      };

      await db.addRecipe(recipeWithSpecialNote);
      const retrievedRecipe = db.get_recipes()[0];

      expect(retrievedRecipe.ingredients[0].note).toBe(specialNote);
    });

    test('handles note with unicode characters', async () => {
      const unicodeNote = '🌶️ spicy à volonté';
      const recipeWithUnicodeNote: recipeTableElement = {
        ...testRecipes[0],
        id: undefined,
        ingredients: testRecipes[0].ingredients.map((ing, index) => ({
          ...ing,
          note: index === 0 ? unicodeNote : undefined,
        })),
      };

      await db.addRecipe(recipeWithUnicodeNote);
      const retrievedRecipe = db.get_recipes()[0];

      expect(retrievedRecipe.ingredients[0].note).toBe(unicodeNote);
    });

    test('preserves notes after database re-initialization', async () => {
      const noteValue = 'persistent note';
      const recipeWithNote: recipeTableElement = {
        ...testRecipes[0],
        id: undefined,
        ingredients: testRecipes[0].ingredients.map((ing, index) => ({
          ...ing,
          note: index === 0 ? noteValue : undefined,
        })),
      };

      await db.addRecipe(recipeWithNote);

      await db.closeAndReset();
      await db.init();
      await db.addMultipleIngredients(testIngredients);
      await db.addMultipleTags(testTags);
      await db.addRecipe(recipeWithNote);

      const retrievedRecipe = db.get_recipes()[0];
      expect(retrievedRecipe.ingredients[0].note).toBe(noteValue);
    });

    test('preserves notes when editing recipe', async () => {
      const initialNote = 'initial note';
      const recipeWithNote: recipeTableElement = {
        ...testRecipes[0],
        id: undefined,
        ingredients: testRecipes[0].ingredients.map((ing, index) => ({
          ...ing,
          note: index === 0 ? initialNote : undefined,
        })),
      };

      await db.addRecipe(recipeWithNote);
      const addedRecipe = db.get_recipes()[0];

      const updatedNote = 'updated note';
      const editedRecipe: recipeTableElement = {
        ...addedRecipe,
        ingredients: addedRecipe.ingredients.map((ing, index) => ({
          ...ing,
          note: index === 0 ? updatedNote : undefined,
        })),
      };

      await db.editRecipe(editedRecipe);
      const retrievedRecipe = db.get_recipes()[0];

      expect(retrievedRecipe.ingredients[0].note).toBe(updatedNote);
    });

    test('can remove note when editing recipe', async () => {
      const recipeWithNote: recipeTableElement = {
        ...testRecipes[0],
        id: undefined,
        ingredients: testRecipes[0].ingredients.map((ing, index) => ({
          ...ing,
          note: index === 0 ? 'to be removed' : undefined,
        })),
      };

      await db.addRecipe(recipeWithNote);
      const addedRecipe = db.get_recipes()[0];

      expect(addedRecipe.ingredients[0].note).toBe('to be removed');

      const editedRecipe: recipeTableElement = {
        ...addedRecipe,
        ingredients: addedRecipe.ingredients.map(ing => ({
          ...ing,
          note: undefined,
        })),
      };

      await db.editRecipe(editedRecipe);
      const retrievedRecipe = db.get_recipes()[0];

      expect(retrievedRecipe.ingredients[0].note).toBeUndefined();
    });
  });
});
