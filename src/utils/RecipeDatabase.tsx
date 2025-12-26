import * as SQLite from 'expo-sqlite';
import {
  coreIngredientElement,
  encodedImportHistoryElement,
  encodedIngredientElement,
  encodedMenuElement,
  encodedPurchasedIngredientElement,
  encodedRecipeElement,
  encodedTagElement,
  importHistoryColumnsEncoding,
  importHistoryTableElement,
  importHistoryTableName,
  ingredientColumnsEncoding,
  ingredientsColumnsNames,
  ingredientsTableName,
  ingredientTableElement,
  ingredientType,
  isIngredientEqual,
  isRecipePartiallyEqual,
  isTagEqual,
  menuColumnsEncoding,
  menuColumnsNames,
  menuTableElement,
  menuTableName,
  nutritionTableElement,
  preparationStepElement,
  purchasedIngredientsColumnsEncoding,
  purchasedIngredientsColumnsNames,
  purchasedIngredientsTableName,
  recipeColumnsEncoding,
  recipeColumnsNames,
  recipeDatabaseName,
  recipeTableElement,
  recipeTableName,
  tagColumnsEncoding,
  tagsColumnsNames,
  tagTableElement,
  tagTableName,
} from '@customTypes/DatabaseElementTypes';
import { TableManipulation } from './TableManipulation';
import { EncodingSeparator, noteSeparator, textSeparator } from '@styles/typography';
import { getDirectoryUri, isTemporaryImageUri, saveRecipeImage } from '@utils/FileGestion';
import { cleanIngredientName, FuzzyMatchLevel, fuzzySearch } from '@utils/FuzzySearch';
import { scaleQuantityForPersons } from '@utils/Quantity';
import { databaseLogger } from '@utils/logger';
import { fisherYatesShuffle } from './FilterFunctions';

/**
 * RecipeDatabase - Singleton class for managing recipe data storage and operations
 *
 * This class provides a comprehensive interface for managing recipes, ingredients, tags,
 * and shopping lists using SQLite database. It implements the singleton pattern to ensure
 * a single database instance throughout the application lifecycle.
 *
 * Key Features:
 * - Recipe CRUD operations with ingredient and tag relationships
 * - Fuzzy search capabilities using FuzzySearch utility
 * - Shopping list generation from recipes
 * - Quantity scaling for different serving sizes
 * - Similar recipe detection
 * - Local caching for improved performance
 *
 * @example
 * ```typescript
 * const db = RecipeDatabase.getInstance();
 * await db.init();
 *
 * const recipe = await db.addRecipe({
 *   title: "Chocolate Cake",
 *   ingredients: [...],
 *   tags: [...]
 * });
 * ```
 */
export class RecipeDatabase {
  static #instance: RecipeDatabase;

  protected _databaseName: string;
  protected _dbConnection: SQLite.SQLiteDatabase;

  protected _recipesTable: TableManipulation;
  protected _ingredientsTable: TableManipulation;
  protected _tagsTable: TableManipulation;

  protected _importHistoryTable: TableManipulation;
  protected _menuTable: TableManipulation;
  protected _purchasedIngredientsTable: TableManipulation;

  protected _recipes: recipeTableElement[];
  protected _ingredients: ingredientTableElement[];
  protected _tags: tagTableElement[];

  protected _importHistory: importHistoryTableElement[];
  protected _menu: menuTableElement[];
  protected _purchasedIngredients: Map<string, boolean>;

  /*    PRIVATE METHODS     */
  private constructor() {
    this._databaseName = recipeDatabaseName;

    this._recipesTable = new TableManipulation(recipeTableName, recipeColumnsEncoding);
    this._ingredientsTable = new TableManipulation(ingredientsTableName, ingredientColumnsEncoding);
    this._tagsTable = new TableManipulation(tagTableName, tagColumnsEncoding);

    this._importHistoryTable = new TableManipulation(
      importHistoryTableName,
      importHistoryColumnsEncoding
    );
    this._menuTable = new TableManipulation(menuTableName, menuColumnsEncoding);
    this._purchasedIngredientsTable = new TableManipulation(
      purchasedIngredientsTableName,
      purchasedIngredientsColumnsEncoding
    );

    this._recipes = [];
    this._ingredients = [];
    this._tags = [];
    this._importHistory = [];
    this._menu = [];
    this._purchasedIngredients = new Map();
  }

  /* PUBLIC METHODS */

  /**
   * Gets the singleton instance of RecipeDatabase
   *
   * @returns The singleton RecipeDatabase instance
   *
   * @example
   * ```typescript
   * const db = RecipeDatabase.getInstance();
   * ```
   */
  public static getInstance(): RecipeDatabase {
    if (!RecipeDatabase.#instance) {
      RecipeDatabase.#instance = new RecipeDatabase();
    }

    return RecipeDatabase.#instance;
  }

  /**
   * Scales a recipe's ingredient quantities to a different number of persons
   *
   * Creates a new recipe object with ingredient quantities adjusted proportionally
   * for the target number of persons. If the recipe doesn't have a valid person count
   * or already matches the target, returns the recipe unchanged.
   *
   * @param recipe - The recipe to scale
   * @param targetPersons - The target number of persons to scale for
   * @returns New recipe object with scaled ingredient quantities
   *
   * @example
   * ```typescript
   * const originalRecipe = {
   *   title: "Pasta",
   *   persons: 4,
   *   ingredients: [{ name: "Pasta", quantity: "400", unit: "g" }]
   * };
   *
   * const scaledRecipe = RecipeDatabase.scaleRecipeToPersons(originalRecipe, 2);
   * // scaledRecipe.persons === 2
   * // scaledRecipe.ingredients[0].quantity === "200"
   * ```
   */
  public static scaleRecipeToPersons(
    recipe: recipeTableElement,
    targetPersons: number
  ): recipeTableElement {
    if (!recipe.persons || recipe.persons <= 0 || recipe.persons === targetPersons) {
      return recipe;
    }

    const oldPersons = recipe.persons;
    const scaledIngredients = recipe.ingredients.map(ingredient => ({
      ...ingredient,
      quantity: ingredient.quantity
        ? scaleQuantityForPersons(ingredient.quantity, oldPersons, targetPersons)
        : ingredient.quantity,
    }));

    return {
      ...recipe,
      persons: targetPersons,
      ingredients: scaledIngredients,
    };
  }

  /**
   * Closes the database connection and resets all internal state
   *
   * Use this method in test teardown (afterEach) to properly cleanup
   * database resources between tests.
   *
   * @returns Promise that resolves when cleanup is complete
   */
  public async closeAndReset() {
    databaseLogger.info('Closing database and resetting state');

    if (this._dbConnection) {
      await this._dbConnection.closeAsync();
      this._dbConnection = undefined as unknown as SQLite.SQLiteDatabase;
    }

    this.reset();

    databaseLogger.info('Database closed and state reset');
  }

  /**
   * Initializes the database by creating tables and loading data into local cache
   *
   * This method must be called before using any other database operations.
   * It creates the necessary tables if they don't exist and loads all data
   * into memory for faster access.
   *
   * @returns Promise that resolves when initialization is complete
   *
   * @example
   * ```typescript
   * const db = RecipeDatabase.getInstance();
   * await db.init();
   * console.log('Database ready for use');
   * ```
   */
  public async init() {
    databaseLogger.info('Initializing database', { databaseName: this._databaseName });

    await this.openDatabase();

    // TODO can we create multiple table in a single query ?
    await this._recipesTable.createTable(this._dbConnection);
    await this._ingredientsTable.createTable(this._dbConnection);
    await this._tagsTable.createTable(this._dbConnection);
    await this._importHistoryTable.createTable(this._dbConnection);
    await this._menuTable.createTable(this._dbConnection);
    await this._purchasedIngredientsTable.createTable(this._dbConnection);

    await this.migrateAddSourceColumns();

    this._ingredients = await this.getAllIngredients();
    this._tags = await this.getAllTags();
    this._recipes = await this.getAllRecipes();
    this._importHistory = await this.getAllImportHistory();
    this._menu = await this.getAllMenu();
    this._purchasedIngredients = await this.getAllPurchasedIngredients();

    databaseLogger.info('Database initialization completed', {
      recipesCount: this._recipes.length,
      ingredientsCount: this._ingredients.length,
      tagsCount: this._tags.length,
      importHistoryCount: this._importHistory.length,
      menuItemsCount: this._menu.length,
      purchasedIngredientsCount: this._purchasedIngredients.size,
    });
  }

  /**
   * Checks if the database is empty
   *
   * Determines whether the database contains any data by checking if all three
   * main tables (recipes, ingredients, and tags) are empty. This is useful for
   * preventing duplicate data insertion during app initialization.
   *
   * @returns True if all main tables are empty, false if any table contains data
   *
   * @example
   * ```typescript
   * const db = RecipeDatabase.getInstance();
   * await db.init();
   *
   * if (db.isDatabaseEmpty()) {
   *   console.log('Database is empty, loading initial data...');
   *   await db.addMultipleRecipes(initialRecipes);
   * }
   * ```
   */
  public isDatabaseEmpty(): boolean {
    return this._recipes.length === 0 && this._ingredients.length === 0 && this._tags.length === 0;
  }

  /**
   * Adds a new ingredient to the database
   *
   * @param ingredient - The ingredient object to add
   * @returns Promise resolving to the added ingredient with database ID
   * @throws Error if ingredient insertion or retrieval fails
   *
   * @example
   * ```typescript
   * const ingredient = await db.addIngredient({
   *   name: "Flour",
   *   unit: "cups",
   *   type: ingredientType.grain,
   *   season: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
   * });
   * console.log(`Ingredient added with ID: ${ingredient.id}`);
   * ```
   */
  public async addIngredient(ingredient: ingredientTableElement): Promise<ingredientTableElement> {
    const ingToAdd = this.encodeIngredientForDb(ingredient);
    const dbRes = await this._ingredientsTable.insertElement(ingToAdd, this._dbConnection);

    if (dbRes === undefined) {
      databaseLogger.error('Failed to add ingredient - database insertion failed', {
        ingredientName: ingredient.name,
      });
      throw new Error(`Failed to add ingredient "${ingredient.name}" to database`);
    }

    const dbIngredient = await this._ingredientsTable.searchElementById<encodedIngredientElement>(
      dbRes,
      this._dbConnection
    );

    if (dbIngredient === undefined) {
      databaseLogger.error('Failed to find ingredient after insertion', {
        ingredientName: ingredient.name,
        dbResult: dbRes,
      });
      throw new Error(`Failed to retrieve ingredient "${ingredient.name}" after insertion`);
    }

    const decodedIng = this.decodeIngredient(dbIngredient);
    this.add_ingredient(decodedIng);
    return decodedIng;
  }

  /**
   * Adds a new tag to the database
   *
   * @param newTag - The tag object to add
   * @returns Promise resolving to the added tag with database ID
   * @throws Error if tag insertion or retrieval fails
   *
   * @example
   * ```typescript
   * const tag = await db.addTag({ name: "Dessert" });
   * console.log(`Tag added with ID: ${tag.id}`);
   * ```
   */
  public async addTag(newTag: tagTableElement): Promise<tagTableElement> {
    const tagToAdd = this.encodeTagForDb(newTag);
    const dbRes = await this._tagsTable.insertElement(tagToAdd, this._dbConnection);

    if (dbRes === undefined) {
      databaseLogger.error('Failed to add tag - database insertion failed', {
        tagName: newTag.name,
      });
      throw new Error(`Failed to add tag "${newTag.name}" to database`);
    }

    const dbTag = await this._tagsTable.searchElementById<encodedTagElement>(
      dbRes,
      this._dbConnection
    );

    if (dbTag === undefined) {
      databaseLogger.error('Failed to find tag after insertion', {
        tagName: newTag.name,
        dbResult: dbRes,
      });
      throw new Error(`Failed to retrieve tag "${newTag.name}" after insertion`);
    }

    const decodedTag = this.decodeTag(dbTag);
    this.add_tags(decodedTag);
    return decodedTag;
  }

  /**
   * Adds multiple ingredients to the database in a single batch operation
   *
   * Performs a batch insert for improved performance when adding multiple ingredients.
   * Uses a database transaction to ensure atomicity and efficiency.
   *
   * @param ingredients - Array of ingredient objects to add
   *
   * @example
   * ```typescript
   * await db.addMultipleIngredients([
   *   {
   *     name: "Flour",
   *     unit: "cups",
   *     type: ingredientType.grain,
   *     season: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
   *   },
   *   {
   *     name: "Sugar",
   *     unit: "cups",
   *     type: ingredientType.sweetener,
   *     season: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
   *   }
   * ]);
   * ```
   */
  public async addMultipleIngredients(ingredients: ingredientTableElement[]) {
    if (ingredients.length === 0) return;

    const encodedIngredients = ingredients.map(ing => this.encodeIngredientForDb(ing));
    databaseLogger.debug('Batch adding ingredients to database', {
      count: ingredients.length,
    });

    const success = await this._ingredientsTable.insertArrayOfElement(
      encodedIngredients,
      this._dbConnection
    );
    if (!success) {
      databaseLogger.error('Failed to batch insert ingredients');
      return;
    }

    const names = ingredients.map(ing => ing.name);
    const searchCriteria = new Map<string, string[]>([['INGREDIENT', names]]);
    const insertedIngredients =
      await this._ingredientsTable.searchElement<encodedIngredientElement>(
        this._dbConnection,
        searchCriteria
      );

    if (!insertedIngredients || !Array.isArray(insertedIngredients)) {
      databaseLogger.error('Failed to retrieve inserted ingredients');
      return;
    }

    for (const encodedIng of insertedIngredients) {
      const decodedIng = this.decodeIngredient(encodedIng);
      this.add_ingredient(decodedIng);
    }
  }

  /**
   * Adds multiple tags to the database in a single batch operation
   *
   * Performs a batch insert for improved performance when adding multiple tags.
   * Uses a database transaction to ensure atomicity and efficiency.
   *
   * @param tags - Array of tag objects to add
   *
   * @example
   * ```typescript
   * await db.addMultipleTags([
   *   { name: "Dessert" },
   *   { name: "Quick & Easy" },
   *   { name: "Vegetarian" }
   * ]);
   * ```
   */
  public async addMultipleTags(tags: tagTableElement[]) {
    if (tags.length === 0) {
      return;
    }

    const encodedTags = tags.map(tag => this.encodeTagForDb(tag));
    databaseLogger.debug('Batch adding tags to database', {
      count: tags.length,
    });

    const success = await this._tagsTable.insertArrayOfElement(encodedTags, this._dbConnection);
    if (!success) {
      databaseLogger.error('Failed to batch insert tags');
      return;
    }

    const names = tags.map(tag => tag.name);
    const searchCriteria = new Map<string, string[]>([['NAME', names]]);
    const insertedTags = await this._tagsTable.searchElement<encodedTagElement>(
      this._dbConnection,
      searchCriteria
    );

    if (!insertedTags || !Array.isArray(insertedTags)) {
      databaseLogger.error('Failed to retrieve inserted tags');
      return;
    }

    for (const encodedTag of insertedTags) {
      const decodedTag = this.decodeTag(encodedTag);
      this.add_tags(decodedTag);
    }
  }

  /**
   * Adds a new recipe to the database
   *
   * This method verifies that all ingredients and tags exist in the database,
   * adding them automatically if they don't exist.
   *
   * @param rec - The recipe object to add
   * @returns Promise that resolves when the recipe is added
   *
   * @example
   * ```typescript
   * await db.addRecipe({
   *   title: "Chocolate Cake",
   *   description: "Delicious chocolate cake",
   *   ingredients: [
   *     { name: "Flour", quantity: "2 cups", unit: "cups", type: "grain" }
   *   ],
   *   tags: [{ name: "Dessert" }],
   *   persons: 8,
   *   time: 45,
   *   preparation: ["Mix ingredients", "Bake for 30 minutes"]
   * });
   * ```
   */
  public async addRecipe(rec: recipeTableElement) {
    const recipe = { ...rec };
    recipe.tags = this.verifyTagsExist(rec.tags);
    recipe.ingredients = this.verifyIngredientsExist(rec.ingredients);

    recipe.image_Source = await this.prepareRecipeImage(recipe.image_Source, recipe.title);

    const recipeConverted = this.encodeRecipe(recipe);

    databaseLogger.debug('Adding recipe to database', {
      recipeTitle: recipe.title,
      ingredientsCount: recipe.ingredients.length,
      tagsCount: recipe.tags.length,
    });
    const dbRes = await this._recipesTable.insertElement(recipeConverted, this._dbConnection);
    if (dbRes === undefined) {
      databaseLogger.error('Failed to add recipe - database insertion failed', {
        recipeTitle: recipe.title,
      });
      return;
    }
    const dbRecipe = await this._recipesTable.searchElementById<encodedRecipeElement>(
      dbRes,
      this._dbConnection
    );
    if (dbRecipe === undefined) {
      databaseLogger.error('Failed to find recipe after insertion', {
        recipeTitle: recipeConverted.TITLE,
        dbResult: dbRes,
      });
    } else {
      this.add_recipes(await this.decodeRecipe(dbRecipe));
    }
  }

  public async addMultipleRecipes(recs: recipeTableElement[]) {
    if (recs.length === 0) return;

    const processedRecipes = await Promise.all(
      recs.map(async rec => {
        const recipe = { ...rec };
        recipe.tags = this.verifyTagsExist(rec.tags);
        recipe.ingredients = this.verifyIngredientsExist(rec.ingredients);
        recipe.image_Source = await this.prepareRecipeImage(recipe.image_Source, recipe.title);
        return recipe;
      })
    );

    const encodedRecipes = processedRecipes.map(recipe => this.encodeRecipe(recipe));
    databaseLogger.debug('Batch adding recipes to database', {
      count: recs.length,
    });

    const success = await this._recipesTable.insertArrayOfElement(
      encodedRecipes,
      this._dbConnection
    );

    if (!success) {
      databaseLogger.error('Failed to batch insert recipes');
      throw new Error('Failed to insert recipes into database');
    }

    const titles = processedRecipes.map(r => r.title);
    const searchCriteria = new Map<string, string[]>([['TITLE', titles]]);
    const insertedRecipes = await this._recipesTable.searchElement<encodedRecipeElement>(
      this._dbConnection,
      searchCriteria
    );

    if (!insertedRecipes || !Array.isArray(insertedRecipes)) {
      databaseLogger.error('Failed to retrieve inserted recipes');
      return;
    }

    const decodedRecipes = await Promise.all(
      insertedRecipes.map(encoded => this.decodeRecipe(encoded))
    );

    for (const recipe of decodedRecipes) {
      this.add_recipes(recipe);
    }
  }

  public async editRecipe(recipe: recipeTableElement) {
    if (recipe.id === undefined) {
      databaseLogger.warn('Cannot edit recipe - missing ID', { recipeTitle: recipe.title });
      return false;
    }

    recipe.image_Source = await this.prepareRecipeImage(recipe.image_Source, recipe.title);

    const updateMap = this.constructUpdateRecipeStructure(this.encodeRecipe(recipe));
    databaseLogger.debug('Editing recipe', { recipeId: recipe.id, recipeTitle: recipe.title });
    const success = await this._recipesTable.editElementById(
      recipe.id!,
      updateMap,
      this._dbConnection
    );
    if (success) {
      this.update_recipe(recipe);
      databaseLogger.debug('Recipe edited successfully', { recipeId: recipe.id });
    } else {
      databaseLogger.warn('Failed to edit recipe', {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
      });
    }
    return success;
  }

  public async editIngredient(ingredient: ingredientTableElement) {
    if (ingredient.id === undefined) {
      databaseLogger.warn('Cannot edit ingredient - missing ID', {
        ingredientName: ingredient.name,
      });
      return false;
    }
    const updateMap = this.constructUpdateIngredientStructure(ingredient);
    const success = await this._ingredientsTable.editElementById(
      ingredient.id,
      updateMap,
      this._dbConnection
    );
    if (success) {
      this.update_ingredient(ingredient);
      this._recipes = await this.getAllRecipes();
    }
    return success;
  }

  public async editTag(tag: tagTableElement) {
    if (tag.id === undefined) {
      databaseLogger.warn('Cannot edit tag - missing ID', { tagName: tag.name });
      return false;
    }
    const updateMap = this.constructUpdateTagStructure(tag);
    const success = await this._tagsTable.editElementById(tag.id, updateMap, this._dbConnection);
    if (success) {
      this.update_tag(tag);
      this._recipes = await this.getAllRecipes();
    }
    return success;
  }

  public searchRandomlyTags(numOfElements: number): tagTableElement[] {
    if (this._tags.length === 0) {
      databaseLogger.error('Cannot get random tags - tag table is empty');
      return [];
    } else {
      if (this._tags.length <= numOfElements) {
        databaseLogger.debug('Returning all tags - requested count equals available tags', {
          requestedCount: numOfElements,
          availableCount: this._tags.length,
        });
        return this._tags;
      } else {
        // TODO can find a better random function
        // TODO this can be abstract in a function so that it is also used for other searchRandom
        const res = [];
        while (res.length < numOfElements) {
          let skipElem = false;
          const randomId = Math.floor(Math.random() * this._tags.length);

          for (let i = 0; i < res.length && !skipElem; i++) {
            if (isTagEqual(res[i], this._tags[randomId])) {
              skipElem = true;
            }
          }
          if (!skipElem) {
            res.push(this._tags[randomId]);
          }
        }
        return res;
      }
    }
  }

  /**
   * Gets random ingredients of a specific type
   *
   * @param type - The ingredient type to filter by
   * @param count - Number of random ingredients to return
   * @returns Array of random ingredients of the specified type
   */
  public getRandomIngredientsByType(type: ingredientType, count: number): ingredientTableElement[] {
    if (this._ingredients.length === 0) {
      return [];
    }

    const ingredientsOfType = this._ingredients.filter(ingredient => ingredient.type === type);

    if (ingredientsOfType.length === 0) {
      databaseLogger.debug('No ingredients found for type', { ingredientType: type });
      return [];
    }

    return fisherYatesShuffle(ingredientsOfType, count);
  }

  /**
   * Gets random tags from the database
   *
   * @param count - Number of random tags to return
   * @returns Array of random tags
   */
  public getRandomTags(count: number): tagTableElement[] {
    if (this._tags.length === 0) {
      return [];
    }

    return fisherYatesShuffle(this._tags, count);
  }

  public async deleteRecipe(recipe: recipeTableElement): Promise<boolean> {
    let recipeDeleted: boolean;
    if (recipe.id !== undefined) {
      recipeDeleted = await this._recipesTable.deleteElementById(recipe.id, this._dbConnection);
    } else {
      recipeDeleted = await this._recipesTable.deleteElement(
        this._dbConnection,
        this.constructSearchRecipeStructure(recipe)
      );
    }
    if (recipeDeleted) {
      this.remove_recipe(recipe);

      if (recipe.id !== undefined) {
        const menuItem = this._menu.find(item => item.recipeId === recipe.id);
        if (menuItem && menuItem.id !== undefined) {
          await this.removeFromMenu(menuItem.id);
        }
      }

      if (recipe.sourceUrl && recipe.sourceProvider) {
        await this.removeFromSeenHistory(recipe.sourceProvider, [recipe.sourceUrl]);
      }
    }
    return recipeDeleted;
  }

  public async deleteIngredient(ingredient: ingredientTableElement): Promise<boolean> {
    let ingredientDeleted: boolean;
    if (ingredient.id !== undefined) {
      ingredientDeleted = await this._ingredientsTable.deleteElementById(
        ingredient.id,
        this._dbConnection
      );
    } else {
      ingredientDeleted = await this._ingredientsTable.deleteElement(
        this._dbConnection,
        this.constructSearchIngredientStructure(ingredient)
      );
    }
    if (ingredientDeleted) {
      this.remove_ingredient(ingredient);

      const recipesToUpdate = this._recipes.filter(recipe =>
        recipe.ingredients.some(i => i.id === ingredient.id)
      );

      for (const recipe of recipesToUpdate) {
        const updatedRecipe = {
          ...recipe,
          ingredients: recipe.ingredients.filter(i => i.id !== ingredient.id),
        };
        await this.editRecipe(updatedRecipe);
      }

      this._recipes = await this.getAllRecipes();
    }
    return ingredientDeleted;
  }

  public async deleteTag(tag: tagTableElement): Promise<boolean> {
    let tagDeleted: boolean;
    if (tag.id !== undefined) {
      tagDeleted = await this._tagsTable.deleteElementById(tag.id, this._dbConnection);
    } else {
      tagDeleted = await this._tagsTable.deleteElement(
        this._dbConnection,
        this.constructSearchTagStructure(tag)
      );
    }
    if (tagDeleted) {
      this.remove_tag(tag);

      const recipesToUpdate = this._recipes.filter(recipe =>
        recipe.tags.some(t => t.id === tag.id)
      );

      for (const recipe of recipesToUpdate) {
        const updatedRecipe = {
          ...recipe,
          tags: recipe.tags.filter(t => t.id !== tag.id),
        };
        await this.editRecipe(updatedRecipe);
      }

      this._recipes = await this.getAllRecipes();
    }
    return tagDeleted;
  }

  /**
   * Gets all recipes from the local cache
   *
   * @returns Array of all recipes
   */
  public get_recipes(): recipeTableElement[] {
    return this._recipes;
  }

  /**
   * Checks if a recipe exists in the database
   *
   * @param recipeToSearch - Recipe to search for
   * @returns True if recipe exists, false otherwise
   */
  public isRecipeExist(recipeToSearch: recipeTableElement): boolean {
    return this.find_recipe(recipeToSearch) !== undefined;
  }

  /**
   * Gets all ingredients from the local cache
   *
   * @returns Array of all ingredients
   */
  public get_ingredients() {
    return this._ingredients;
  }

  /**
   * Gets all tags from the local cache
   *
   * @returns Array of all tags
   */
  public get_tags(): tagTableElement[] {
    return this._tags;
  }

  public add_recipes(recipe: recipeTableElement) {
    this._recipes.push(recipe);
  }

  public add_ingredient(ingredient: ingredientTableElement) {
    this._ingredients.push(ingredient);
  }

  public add_tags(tag: tagTableElement) {
    this._tags.push(tag);
  }

  public remove_recipe(recipe: recipeTableElement) {
    const foundRecipe = this.find_recipe(recipe);
    if (foundRecipe !== undefined) {
      this._recipes.splice(this._recipes.indexOf(foundRecipe), 1);
    } else {
      databaseLogger.warn('Cannot remove recipe - not found in local cache', {
        recipeTitle: recipe.title,
      });
    }
  }

  public remove_ingredient(ingredient: ingredientTableElement) {
    const foundIngredient = this.find_ingredient(ingredient);
    if (foundIngredient !== undefined) {
      this._ingredients.splice(this._ingredients.indexOf(foundIngredient), 1);
    } else {
      databaseLogger.warn('Cannot remove ingredient - not found in local cache', {
        ingredientName: ingredient.name,
      });
    }
  }

  public remove_tag(tag: tagTableElement) {
    const foundTag = this.find_tag(tag);
    if (foundTag !== undefined) {
      this._tags.splice(this._tags.indexOf(foundTag), 1);
    } else {
      databaseLogger.warn('Cannot remove tag - not found in local cache', { tagName: tag.name });
    }
  }

  public update_recipe(newRecipe: recipeTableElement) {
    const foundRecipe = this._recipes.findIndex(recipe => recipe.id === newRecipe.id);
    if (foundRecipe !== -1) {
      this._recipes[foundRecipe] = newRecipe;
    }
  }

  public update_multiple_recipes(updatedRecipes: recipeTableElement[]) {
    const recipeMap = new Map(this._recipes.map((recipe, index) => [recipe.id, index]));

    for (const updatedRecipe of updatedRecipes) {
      const idOfRecipeToUpdate = recipeMap.get(updatedRecipe.id);
      if (idOfRecipeToUpdate !== undefined) {
        this._recipes[idOfRecipeToUpdate] = updatedRecipe;
      } else {
        databaseLogger.warn('Cannot find recipe to update', {
          recipeId: updatedRecipe.id,
          title: updatedRecipe.title,
        });
      }
    }
  }

  public update_ingredient(newIngredient: ingredientTableElement) {
    const foundIngredient = this._ingredients.findIndex(
      ingredient => ingredient.id === newIngredient.id
    );
    if (foundIngredient !== -1) {
      this._ingredients[foundIngredient] = newIngredient;
    }
  }

  public update_tag(newTag: tagTableElement) {
    const foundTag = this._tags.findIndex(tag => tag.id === newTag.id);
    if (foundTag !== -1) {
      this._tags[foundTag] = newTag;
    }
  }

  public find_recipe(recipeToFind: recipeTableElement): recipeTableElement | undefined {
    let findFunc: (element: recipeTableElement) => boolean;
    if (recipeToFind.id !== undefined) {
      findFunc = (element: recipeTableElement) => element.id === recipeToFind.id;
    } else {
      findFunc = (element: recipeTableElement) => isRecipePartiallyEqual(element, recipeToFind);
    }
    return this._recipes.find(element => findFunc(element));
  }

  public find_ingredient(ingToFind: ingredientTableElement): ingredientTableElement | undefined {
    let findFunc: (element: ingredientTableElement) => boolean;
    if (ingToFind.id !== undefined) {
      findFunc = (element: ingredientTableElement) => element.id === ingToFind.id;
    } else {
      findFunc = (element: ingredientTableElement) => isIngredientEqual(element, ingToFind);
    }
    return this._ingredients.find(element => findFunc(element));
  }

  public find_tag(tagToSearch: tagTableElement): tagTableElement | undefined {
    let findFunc: (element: tagTableElement) => boolean;
    if (tagToSearch.id !== undefined) {
      findFunc = (element: tagTableElement) => element.id === tagToSearch.id;
    } else {
      findFunc = (element: tagTableElement) => isTagEqual(element, tagToSearch);
    }
    return this._tags.find(element => findFunc(element));
  }

  /**
   * Gets all menu items from the local cache
   *
   * @returns Array of all menu items
   */
  public get_menu(): menuTableElement[] {
    return this._menu;
  }

  /**
   * Checks if a recipe is already in the menu
   *
   * @param recipeId - The recipe ID to check
   * @returns True if recipe is in menu, false otherwise
   */
  public isRecipeInMenu(recipeId: number): boolean {
    return this._menu.some(item => item.recipeId === recipeId);
  }

  /**
   * Adds a recipe to the menu and regenerates the shopping list
   *
   * If the recipe is already in the menu, increments its count.
   * Otherwise, it adds the recipe to the menu table with count = 1.
   *
   * @param recipe - The recipe to add to the menu
   */
  public async addRecipeToMenu(recipe: recipeTableElement): Promise<void> {
    if (!recipe.id) {
      databaseLogger.warn('Cannot add recipe to menu - missing ID', {
        recipeTitle: recipe.title,
      });
      return;
    }

    const existingMenuItem = this._menu.find(item => item.recipeId === recipe.id);
    if (existingMenuItem && existingMenuItem.id) {
      const newCount = existingMenuItem.count + 1;
      await this._menuTable.editElementById(
        existingMenuItem.id,
        new Map<string, number | string>([[menuColumnsNames.count, newCount]]),
        this._dbConnection
      );
      existingMenuItem.count = newCount;
      databaseLogger.debug('Recipe count incremented in menu', {
        recipeId: recipe.id,
        newCount,
      });
      return;
    }

    const menuItem: menuTableElement = {
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      imageSource: recipe.image_Source,
      isCooked: false,
      count: 1,
    };

    const dbRes = await this._menuTable.insertElement(
      this.encodeMenu(menuItem),
      this._dbConnection
    );

    if (dbRes === undefined) {
      databaseLogger.error('Failed to add recipe to menu', { recipeTitle: recipe.title });
      return;
    }

    const dbMenu = await this._menuTable.searchElementById<encodedMenuElement>(
      dbRes,
      this._dbConnection
    );

    if (dbMenu) {
      this._menu.push(this.decodeMenu(dbMenu));
      databaseLogger.debug('Recipe added to menu', { recipeId: recipe.id });
    }
  }

  /**
   * Toggles the cooked status of a menu item
   *
   * @param menuId - The menu item ID to toggle
   * @returns True if successful, false otherwise
   */
  public async toggleMenuItemCooked(menuId: number): Promise<boolean> {
    const menuItem = this._menu.find(item => item.id === menuId);
    if (!menuItem) {
      databaseLogger.warn('Menu item not found', { menuId });
      return false;
    }

    const newCookedStatus = !menuItem.isCooked;

    const success = await this._menuTable.editElementById(
      menuId,
      new Map<string, number | string>([[menuColumnsNames.isCooked, newCookedStatus ? 1 : 0]]),
      this._dbConnection
    );

    if (success) {
      menuItem.isCooked = newCookedStatus;
      databaseLogger.debug('Menu item cooked status toggled', {
        menuId,
        isCooked: newCookedStatus,
      });
      return true;
    }

    return false;
  }

  /**
   * Decrements the count of a menu item, removing it if count reaches 0
   *
   * @param menuId - The menu item ID to decrement/remove
   * @returns True if successful, false otherwise
   */
  public async removeFromMenu(menuId: number): Promise<boolean> {
    const menuItem = this._menu.find(item => item.id === menuId);
    if (!menuItem) {
      databaseLogger.warn('Menu item not found', { menuId });
      return false;
    }

    if (menuItem.count > 1) {
      const newCount = menuItem.count - 1;
      await this._menuTable.editElementById(
        menuId,
        new Map<string, number | string>([[menuColumnsNames.count, newCount]]),
        this._dbConnection
      );
      menuItem.count = newCount;
      databaseLogger.debug('Menu item count decremented', { menuId, newCount });
      return true;
    }

    const success = await this._menuTable.deleteElementById(menuId, this._dbConnection);
    if (success) {
      const index = this._menu.findIndex(item => item.id === menuId);
      if (index !== -1) {
        this._menu.splice(index, 1);
      }
      databaseLogger.debug('Menu item removed', { menuId });
      return true;
    }

    return false;
  }

  /**
   * Clears the entire menu
   */
  public async clearMenu(): Promise<void> {
    this._menu.length = 0;
    await this._menuTable.deleteTable(this._dbConnection);
    await this._menuTable.createTable(this._dbConnection);
    databaseLogger.debug('Menu cleared');
  }

  /* PURCHASED INGREDIENTS METHODS */

  /**
   * Returns the map of purchased ingredient states
   * Key is ingredient name, value is whether it's purchased
   */
  public get_purchasedIngredients(): Map<string, boolean> {
    return this._purchasedIngredients;
  }

  /**
   * Sets the purchase state for an ingredient
   * @param ingredientName - The ingredient name
   * @param purchased - Whether the ingredient is purchased
   */
  public async setPurchased(ingredientName: string, purchased: boolean): Promise<void> {
    const existingPurchased = this._purchasedIngredients.get(ingredientName);

    if (existingPurchased !== undefined) {
      // Update existing entry: delete then insert (no editByColumn available)
      await this._purchasedIngredientsTable.deleteElement(
        this._dbConnection,
        new Map([[purchasedIngredientsColumnsNames.ingredientName, ingredientName]])
      );
    }

    // Insert entry (new or updated)
    await this._purchasedIngredientsTable.insertElement(
      this.encodePurchasedIngredient({ ingredientName, purchased }),
      this._dbConnection
    );

    this._purchasedIngredients.set(ingredientName, purchased);
    databaseLogger.debug('Purchase state updated', { ingredientName, purchased });
  }

  /**
   * Clears all purchased ingredient states
   * Called when the menu is cleared to start fresh
   */
  public async clearPurchasedIngredients(): Promise<void> {
    this._purchasedIngredients.clear();
    await this._purchasedIngredientsTable.deleteTable(this._dbConnection);
    await this._purchasedIngredientsTable.createTable(this._dbConnection);
    databaseLogger.debug('Purchased ingredients cleared');
  }

  /**
   * Scales and updates a single recipe in the database
   *
   * Takes a pre-scaled recipe object and updates it in the database.
   * This method is used for individual recipe updates during progressive scaling operations.
   *
   * @param scaledRecipe - The recipe object that has already been scaled to target persons
   * @throws Error if recipe doesn't have an ID or update fails
   *
   * @example
   * ```typescript
   * const recipe = db.get_recipes()[0];
   * const scaledRecipe = RecipeDatabase.scaleRecipeToPersons(recipe, 4);
   * await db.scaleAndUpdateRecipe(scaledRecipe);
   * ```
   */
  public async scaleAndUpdateRecipe(scaledRecipe: recipeTableElement): Promise<void> {
    if (!scaledRecipe.id) {
      databaseLogger.error('Cannot update recipe without ID', {
        recipeTitle: scaledRecipe.title,
      });
      throw new Error('Recipe must have an ID to update');
    }

    const updateMap = this.constructUpdateRecipeStructure(this.encodeRecipe(scaledRecipe));
    databaseLogger.debug('Updating scaled recipe', {
      recipeId: scaledRecipe.id,
      recipeTitle: scaledRecipe.title,
      persons: scaledRecipe.persons,
    });

    const success = await this._recipesTable.editElementById(
      scaledRecipe.id,
      updateMap,
      this._dbConnection
    );

    if (!success) {
      databaseLogger.error('Failed to update scaled recipe', {
        recipeId: scaledRecipe.id,
        recipeTitle: scaledRecipe.title,
      });
      throw new Error(`Failed to update recipe ${scaledRecipe.id}`);
    }

    this.update_recipe(scaledRecipe);
    databaseLogger.debug('Recipe updated successfully', { recipeId: scaledRecipe.id });
  }

  /**
   * Finds recipes with similar ingredients and quantities
   *
   * Uses ingredient comparison and fuzzy text matching to find recipes
   * that share similar ingredients and cooking methods.
   *
   * @param recipeToCompare - The recipe to find similarities for
   * @returns Array of similar recipes
   *
   * @example
   * ```typescript
   * const similar = db.findSimilarRecipes(myRecipe);
   * console.log(`Found ${similar.length} similar recipes`);
   * ```
   */
  public findSimilarRecipes(recipeToCompare: recipeTableElement): recipeTableElement[] {
    const ingredientTypesToIgnore: ingredientType[] = [
      ingredientType.condiment,
      ingredientType.oilAndFat,
    ];

    const processIngredients = (recipe: recipeTableElement) => {
      if (recipe.persons === undefined || recipe.persons === 0) {
        return [];
      }
      const persons = recipe.persons as number;
      return recipe.ingredients
        .filter(ing => !ingredientTypesToIgnore.includes(ing.type))
        .map(ing => {
          return {
            name: ing.name.toLowerCase(),
            quantityPerPerson:
              ing.quantity && !isNaN(parseFloat(ing.quantity))
                ? parseFloat(ing.quantity) / persons
                : undefined,
          } as coreIngredientElement;
        })
        .filter(ing => ing.quantityPerPerson !== undefined)
        .sort((a, b) => a.name.localeCompare(b.name));
    };

    const processedRecipeToCompareIngredients = processIngredients(recipeToCompare);

    if (processedRecipeToCompareIngredients.length === 0) {
      return [];
    }

    const recipesWithSimilarIngredients = this._recipes.filter(existingRecipe => {
      if (existingRecipe.id !== undefined && existingRecipe.id === recipeToCompare.id) {
        return false;
      }
      const processedExistingRecipeIngredients = processIngredients(existingRecipe);
      return this.areIngredientsSimilar(
        processedRecipeToCompareIngredients,
        processedExistingRecipeIngredients
      );
    });

    if (recipesWithSimilarIngredients.length === 0) {
      return [];
    }

    const result = fuzzySearch<recipeTableElement>(
      recipesWithSimilarIngredients,
      recipeToCompare.title,
      recipe => recipe.title,
      FuzzyMatchLevel.PERMISSIVE
    );

    return result.exact ? [result.exact] : result.similar;
  }

  /**
   * Finds tags with similar names using fuzzy matching
   *
   * @param tagName - The tag name to search for
   * @returns Array of similar tags, sorted by relevance
   *
   * @example
   * ```typescript
   * const similarTags = db.findSimilarTags("dessrt"); // Finds "Dessert"
   * ```
   */
  public findSimilarTags(tagName: string): tagTableElement[] {
    const trimmedName = tagName.trim();
    if (!trimmedName) {
      return [];
    }

    const result = fuzzySearch<tagTableElement>(
      this._tags,
      trimmedName,
      t => t.name,
      FuzzyMatchLevel.MODERATE
    );
    return result.exact ? [result.exact] : result.similar;
  }

  /**
   * Finds ingredients with similar names using fuzzy matching
   *
   * Cleans ingredient names by removing parenthetical content and
   * uses fuzzy search to find similar ingredients.
   *
   * @param ingredientName - The ingredient name to search for
   * @returns Array of similar ingredients, sorted by relevance
   *
   * @example
   * ```typescript
   * const similar = db.findSimilarIngredients("tomatoe"); // Finds "Tomato"
   * ```
   */
  public findSimilarIngredients(ingredientName: string): ingredientTableElement[] {
    const trimmedName = ingredientName.trim();
    if (!trimmedName) {
      return [];
    }

    const cleanedSearchName = cleanIngredientName(trimmedName);
    const result = fuzzySearch<ingredientTableElement>(
      this._ingredients,
      cleanedSearchName,
      ingredient => cleanIngredientName(ingredient.name),
      FuzzyMatchLevel.PERMISSIVE
    );

    return result.exact ? [result.exact] : result.similar;
  }

  /**
   * Finds similar ingredients for multiple names in a single operation
   *
   * More efficient than calling findSimilarIngredients multiple times
   * as it processes all names in one pass.
   *
   * @param ingredientNames - Array of ingredient names to search for
   * @returns Map of original names to arrays of similar ingredients
   */
  public findSimilarIngredientsBatch(
    ingredientNames: string[]
  ): Map<string, ingredientTableElement[]> {
    const results = new Map<string, ingredientTableElement[]>();

    for (const name of ingredientNames) {
      results.set(name, this.findSimilarIngredients(name));
    }

    return results;
  }

  /**
   * Finds similar tags for multiple names in a single operation
   *
   * More efficient than calling findSimilarTags multiple times
   * as it processes all names in one pass.
   *
   * @param tagNames - Array of tag names to search for
   * @returns Map of original names to arrays of similar tags
   */
  public findSimilarTagsBatch(tagNames: string[]): Map<string, tagTableElement[]> {
    const results = new Map<string, tagTableElement[]>();

    for (const name of tagNames) {
      results.set(name, this.findSimilarTags(name));
    }

    return results;
  }

  /**
   * Gets all imported recipe source URLs for a specific provider
   *
   * Returns URLs of recipes that have been successfully imported from the given provider.
   * These recipes should be hidden from future discovery.
   *
   * @param providerId - The provider identifier (e.g., 'hellofresh')
   * @returns Set of source URLs for imported recipes
   */
  public getImportedSourceUrls(providerId: string): Set<string> {
    return new Set(
      this._recipes
        .filter(r => r.sourceUrl && r.sourceProvider === providerId)
        .map(r => r.sourceUrl!)
    );
  }

  /**
   * Gets all seen-but-not-imported recipe URLs for a specific provider
   *
   * Returns URLs of recipes that were discovered but not imported.
   * These recipes should be shown with a visual indicator.
   *
   * @param providerId - The provider identifier (e.g., 'hellofresh')
   * @returns Set of URLs for seen-but-not-imported recipes
   */
  public getSeenUrls(providerId: string): Set<string> {
    return new Set(
      this._importHistory.filter(h => h.providerId === providerId).map(h => h.recipeUrl)
    );
  }

  /**
   * Marks recipe URLs as seen for a specific provider
   *
   * Records that the user has seen these recipes during discovery.
   * Only adds new entries for URLs not already tracked.
   *
   * @param providerId - The provider identifier (e.g., 'hellofresh')
   * @param urls - Array of recipe URLs to mark as seen
   */
  public async markUrlsAsSeen(providerId: string, urls: string[]): Promise<void> {
    if (urls.length === 0) return;

    const existingSeenUrls = this.getSeenUrls(providerId);
    const importedUrls = this.getImportedSourceUrls(providerId);
    const now = Date.now();

    const newEntries = urls
      .filter(url => !existingSeenUrls.has(url) && !importedUrls.has(url))
      .map(url => ({
        providerId,
        recipeUrl: url,
        lastSeenAt: now,
      }));

    if (newEntries.length === 0) return;

    const encodedEntries = newEntries.map(entry => this.encodeImportHistory(entry));

    databaseLogger.debug('Marking URLs as seen', {
      providerId,
      count: newEntries.length,
    });

    const success = await this._importHistoryTable.insertArrayOfElement(
      encodedEntries,
      this._dbConnection
    );

    if (success) {
      for (const entry of newEntries) {
        this._importHistory.push(entry as importHistoryTableElement);
      }
    } else {
      databaseLogger.error('Failed to mark URLs as seen', { providerId, count: newEntries.length });
    }
  }

  /**
   * Removes recipe URLs from seen history for a specific provider
   *
   * Called after successful import to remove URLs from the "seen" list
   * since they are now tracked as imported recipes.
   *
   * @param providerId - The provider identifier (e.g., 'hellofresh')
   * @param urls - Array of recipe URLs to remove from seen history
   */
  public async removeFromSeenHistory(providerId: string, urls: string[]): Promise<void> {
    if (urls.length === 0) return;

    databaseLogger.debug('Removing URLs from seen history', {
      providerId,
      count: urls.length,
    });

    for (const url of urls) {
      const historyEntry = this._importHistory.find(
        h => h.providerId === providerId && h.recipeUrl === url
      );

      if (historyEntry?.id) {
        await this._importHistoryTable.deleteElementById(historyEntry.id, this._dbConnection);
      }
    }

    this._importHistory = this._importHistory.filter(
      h => !(h.providerId === providerId && urls.includes(h.recipeUrl))
    );
  }

  /**
   * Loads all purchased ingredients from the database
   * @returns Map of ingredient name to purchased state
   */
  private async getAllPurchasedIngredients(): Promise<Map<string, boolean>> {
    const encodedData =
      (await this._purchasedIngredientsTable.searchElement<encodedPurchasedIngredientElement>(
        this._dbConnection
      )) as encodedPurchasedIngredientElement[] | undefined;

    const result = new Map<string, boolean>();
    if (encodedData) {
      for (const encoded of encodedData) {
        result.set(encoded.INGREDIENT_NAME, encoded.PURCHASED === 1);
      }
    }
    return result;
  }

  /**
   * Encodes a purchased ingredient element for database storage
   */
  private encodePurchasedIngredient(element: {
    ingredientName: string;
    purchased: boolean;
  }): Record<string, string | number> {
    return {
      [purchasedIngredientsColumnsNames.ingredientName]: element.ingredientName,
      [purchasedIngredientsColumnsNames.purchased]: element.purchased ? 1 : 0,
    };
  }

  /* PRIVATE METHODS */

  /**
   * Resets all internal state to empty values
   *
   * @private
   */
  private reset() {
    this._recipes = [];
    this._ingredients = [];
    this._tags = [];
    this._importHistory = [];
    this._menu = [];
    this._purchasedIngredients = new Map();
  }

  /**
   * Constructs a Map structure for updating recipe data in the database
   *
   * Converts an encoded recipe element into a Map structure suitable for
   * database update operations, mapping column names to their corresponding values.
   *
   * @private
   * @param encodedRecipe - The encoded recipe data to construct update structure from
   * @returns Map with column names as keys and recipe data as values
   */
  private constructUpdateRecipeStructure(
    encodedRecipe: encodedRecipeElement
  ): Map<string, string | number> {
    return new Map<string, string | number>([
      [recipeColumnsNames.image, encodedRecipe.IMAGE_SOURCE],
      [recipeColumnsNames.title, encodedRecipe.TITLE],
      [recipeColumnsNames.description, encodedRecipe.DESCRIPTION],
      [recipeColumnsNames.tags, encodedRecipe.TAGS],
      [recipeColumnsNames.persons, encodedRecipe.PERSONS],
      [recipeColumnsNames.ingredients, encodedRecipe.INGREDIENTS],
      [recipeColumnsNames.preparation, encodedRecipe.PREPARATION],
      [recipeColumnsNames.time, encodedRecipe.TIME],
      [recipeColumnsNames.nutrition, encodedRecipe.NUTRITION],
      [recipeColumnsNames.sourceUrl, encodedRecipe.SOURCE_URL],
      [recipeColumnsNames.sourceProvider, encodedRecipe.SOURCE_PROVIDER],
    ]);
  }

  /**
   * Constructs a Map structure for updating ingredient data in the database
   *
   * Converts an ingredient element into a Map structure suitable for database
   * update operations, properly encoding seasonal data with separators.
   *
   * @private
   * @param ingredient - The ingredient data to construct update structure from
   * @returns Map with column names as keys and ingredient data as values
   */
  private constructUpdateIngredientStructure(
    ingredient: ingredientTableElement
  ): Map<string, string | number> {
    return new Map<string, string | number>([
      [ingredientsColumnsNames.ingredient, ingredient.name],
      [ingredientsColumnsNames.unit, ingredient.unit],
      [ingredientsColumnsNames.type, ingredient.type],
      [ingredientsColumnsNames.season, ingredient.season.join(EncodingSeparator)],
    ]);
  }

  /**
   * Constructs a Map structure for updating tag data in the database
   *
   * Converts a tag element into a Map structure suitable for database
   * update operations.
   *
   * @private
   * @param tag - The tag data to construct update structure from
   * @returns Map with column names as keys and tag data as values
   */
  private constructUpdateTagStructure(tag: tagTableElement): Map<string, string | number> {
    return new Map<string, string | number>([[tagsColumnsNames.name, tag.name]]);
  }

  /**
   * Opens a connection to the SQLite database
   *
   * Creates and establishes a connection to the SQLite database using the configured
   * database name. Logs success/failure for debugging purposes.
   *
   * @private
   * @throws Will log error if database connection fails
   */
  private async openDatabase() {
    try {
      databaseLogger.debug('Opening database connection', { databaseName: this._databaseName });
      this._dbConnection = await SQLite.openDatabaseAsync(this._databaseName);
      databaseLogger.debug('Database connection opened successfully');
    } catch (error) {
      databaseLogger.error('Failed to open database connection', {
        databaseName: this._databaseName,
        error,
      });
    }
  }

  /**
   * Completely removes the database file and resets the instance
   *
   * Closes the current database connection, deletes the database file from storage,
   * and resets all internal data structures to their initial state.
   *
   * @private
   * @throws Will log error if database deletion fails
   */
  private async deleteDatabase() {
    try {
      await this._dbConnection.closeAsync();
      await SQLite.deleteDatabaseAsync(this._databaseName);
      this.reset();
    } catch (error: unknown) {
      databaseLogger.error('Failed to delete database', {
        databaseName: this._databaseName,
        error,
      });
    }
  }

  /**
   * Verifies that all tags exist in the database and returns them with database IDs
   *
   * Checks each tag against the local cache and returns the database versions.
   * Throws an error listing all tags that are not found in the database.
   *
   * @private
   * @param tags - Array of tags to verify
   * @returns Array of tags with database IDs
   * @throws Error if any tags are not found in the database, listing all missing tags
   */
  private verifyTagsExist(tags: tagTableElement[]): tagTableElement[] {
    const result: tagTableElement[] = [];
    const missing: string[] = [];

    for (const tag of tags) {
      const elemFound = this.find_tag(tag);
      if (!elemFound) {
        missing.push(tag.name);
      } else {
        result.push(elemFound);
      }
    }

    if (missing.length > 0) {
      databaseLogger.error('Tags verification failed', {
        missingTags: missing,
      });
      throw new Error(
        `Tags not found in database: ${missing.join(', ')} (${missing.length} missing)`
      );
    }

    return result;
  }

  /**
   * Verifies that all ingredients exist in the database and returns them with database IDs
   *
   * Checks each ingredient against the local cache and returns the database versions
   * with recipe-specific quantities and optional usage notes. Throws an error listing
   * all ingredients that are not found.
   *
   * @private
   * @param ingredients - Array of ingredients to verify
   * @returns Array of ingredients with database IDs, recipe-specific quantities, and notes
   * @throws Error if any ingredients are not found in the database, listing all missing ingredients
   */
  private verifyIngredientsExist(ingredients: ingredientTableElement[]): ingredientTableElement[] {
    const result: ingredientTableElement[] = [];
    const missing: string[] = [];

    for (const ing of ingredients) {
      const elemFound = this.find_ingredient(ing);
      if (elemFound === undefined) {
        missing.push(ing.name);
      } else {
        result.push({ ...elemFound, quantity: ing.quantity, note: ing.note });
      }
    }

    if (missing.length > 0) {
      databaseLogger.error('Ingredients verification failed', {
        missingIngredients: missing,
      });
      throw new Error(
        `Ingredients not found in database: ${missing.join(', ')} (${missing.length} missing)`
      );
    }

    return result;
  }

  /**
   * Constructs a Map structure for searching recipes in the database
   *
   * Creates a search criteria Map using key recipe fields (title, description, image)
   * for database query operations when searching without an ID.
   *
   * @private
   * @param recipe - The recipe data to construct search criteria from
   * @returns Map with column names as keys and search values
   */
  private constructSearchRecipeStructure(recipe: recipeTableElement): Map<string, string | number> {
    return new Map<string, string | number>([
      [recipeColumnsNames.title, recipe.title],
      [recipeColumnsNames.description, recipe.description],
      [recipeColumnsNames.image, this.extractFilenameFromUri(recipe.image_Source)],
    ]);
  }

  /**
   * Constructs a Map structure for searching ingredients in the database
   *
   * Creates a search criteria Map using key ingredient fields (name, unit, type)
   * for database query operations when searching without an ID.
   *
   * @private
   * @param ingredient - The ingredient data to construct search criteria from
   * @returns Map with column names as keys and search values
   */
  private constructSearchIngredientStructure(
    ingredient: ingredientTableElement
  ): Map<string, string | number> {
    return new Map<string, string>([
      [ingredientsColumnsNames.ingredient, ingredient.name],
      [ingredientsColumnsNames.unit, ingredient.unit],
      [ingredientsColumnsNames.type, ingredient.type],
    ]);
  }

  /**
   * Constructs a Map structure for searching tags in the database
   *
   * Creates a search criteria Map using the tag name for database query
   * operations when searching without an ID.
   *
   * @private
   * @param tag - The tag data to construct search criteria from
   * @returns Map with column names as keys and search values
   */
  private constructSearchTagStructure(tag: tagTableElement): Map<string, string | number> {
    return new Map<string, string | number>([[tagsColumnsNames.name, tag.name]]);
  }

  /**
   * Encodes a recipe object for database storage
   *
   * Converts a recipe from the application format to the database storage format,
   * encoding all nested objects (tags, ingredients, preparation steps, nutrition)
   * into string representations using appropriate separators.
   *
   * @private
   * @param recToEncode - The recipe object to encode for database storage
   * @returns Encoded recipe element ready for database insertion/update
   */
  private encodeRecipe(recToEncode: recipeTableElement): encodedRecipeElement {
    return {
      ID: recToEncode.id ? recToEncode.id : 0,
      IMAGE_SOURCE: this.extractFilenameFromUri(recToEncode.image_Source),
      TITLE: recToEncode.title,
      DESCRIPTION: recToEncode.description,
      TAGS: recToEncode.tags.map(tag => this.encodeTagForRecipe(tag)).join(EncodingSeparator),
      PERSONS: recToEncode.persons,
      INGREDIENTS: recToEncode.ingredients
        .map(ing => this.encodeIngredient(ing))
        .join(EncodingSeparator),
      PREPARATION: recToEncode.preparation
        .map(step => step.title + textSeparator + step.description)
        .join(EncodingSeparator),
      TIME: recToEncode.time,
      NUTRITION: recToEncode.nutrition ? this.encodeNutrition(recToEncode.nutrition) : '',
      SOURCE_URL: recToEncode.sourceUrl || '',
      SOURCE_PROVIDER: recToEncode.sourceProvider || '',
    };
  }

  /**
   * Extracts filename from a full image URI
   *
   * Takes a full image URI and extracts just the filename by removing the directory prefix.
   * If the URI doesn't contain the directory prefix, returns it unchanged (assumes it's already a filename).
   *
   * @private
   * @param imageUri - The full image URI (e.g., "file:///documents/Recipedia/pasta.jpg")
   * @returns Just the filename (e.g., "pasta.jpg")
   */
  private extractFilenameFromUri(imageUri: string): string {
    const directoryPath = getDirectoryUri();
    if (imageUri.startsWith(directoryPath)) {
      return imageUri.substring(directoryPath.length);
    }
    return imageUri;
  }

  /**
   * Constructs full image URI from filename
   *
   * Takes a filename (e.g., "pasta.jpg") and combines it with the FileGestion
   * directory URI to create a full file:// URI that can be used by image components.
   *
   * @private
   * @param imageFilename - The image filename (e.g., "pasta.jpg")
   * @returns Full image URI (e.g., "file:///documents/Recipedia/pasta.jpg")
   */
  private constructImageUri(imageFilename: string): string {
    return getDirectoryUri() + imageFilename;
  }

  /**
   * Prepares recipe image URI for database storage
   *
   * Handles temporary image URIs by saving them to permanent storage.
   * If the image URI is already in permanent storage, returns it unchanged.
   * This encapsulates all image preparation logic within the database layer.
   *
   * @private
   * @param imageUri - The image URI from the recipe (temporary or permanent)
   * @param recipeTitle - The recipe title used for filename generation
   * @returns Promise resolving to the permanent image URI
   */
  private async prepareRecipeImage(imageUri: string, recipeTitle: string): Promise<string> {
    if (!imageUri) {
      databaseLogger.debug('No image URI provided for recipe', { recipeTitle });
      return '';
    }

    if (isTemporaryImageUri(imageUri)) {
      databaseLogger.info('Recipe image is temporary, saving to permanent storage', {
        temporaryUri: imageUri,
        recipeTitle,
      });
      const permanentUri = await saveRecipeImage(imageUri, recipeTitle);
      databaseLogger.info('Recipe image saved to permanent storage', {
        permanentUri,
      });
      return permanentUri;
    }

    databaseLogger.debug('Recipe image already in permanent storage', {
      imageUri,
    });
    return imageUri;
  }

  /**
   * Decodes a recipe from database storage format to application format
   *
   * Converts an encoded recipe element from the database into the full application
   * format, decoding all nested data structures (ingredients, tags, preparation, nutrition)
   * and resolving file paths and database references.
   *
   * @private
   * @param encodedRecipe - The encoded recipe data from database
   * @returns Promise resolving to fully decoded recipe object
   */
  private async decodeRecipe(encodedRecipe: encodedRecipeElement): Promise<recipeTableElement> {
    const [decodedIngredients, decodedSeason] = await this.decodeIngredientFromRecipe(
      encodedRecipe.INGREDIENTS
    );
    return {
      id: encodedRecipe.ID,
      image_Source: this.constructImageUri(encodedRecipe.IMAGE_SOURCE),
      title: encodedRecipe.TITLE,
      description: encodedRecipe.DESCRIPTION,
      tags: await this.decodeTagFromRecipe(encodedRecipe.TAGS),
      persons: encodedRecipe.PERSONS,
      ingredients: decodedIngredients,
      season: decodedSeason,
      preparation: this.decodePreparation(encodedRecipe.PREPARATION),
      time: encodedRecipe.TIME,
      nutrition: this.decodeNutrition(encodedRecipe.NUTRITION),
      sourceUrl: encodedRecipe.SOURCE_URL || undefined,
      sourceProvider: encodedRecipe.SOURCE_PROVIDER || undefined,
    };
  }

  /**
   * Decodes an array of recipes from database storage format
   *
   * Processes multiple encoded recipe elements from database queries,
   * decoding each one into the full application format.
   *
   * @private
   * @param queryResult - Array of encoded recipe elements from database
   * @returns Promise resolving to array of fully decoded recipe objects
   */
  private async decodeArrayOfRecipe(
    queryResult: encodedRecipeElement[]
  ): Promise<recipeTableElement[]> {
    if (queryResult.length === 0) {
      return [];
    }
    return await Promise.all(queryResult.map(recipeEncoded => this.decodeRecipe(recipeEncoded)));
  }

  /**
   * Encodes an ingredient for storage within a recipe's ingredients list
   *
   * Converts an ingredient to a string representation containing the ingredient's
   * database ID, quantity, and optional usage note. Used when storing
   * ingredient references within recipe data.
   *
   * Format: "ID--quantity" or "ID--quantity%%note" if note is present.
   * This allows the same ingredient to appear multiple times with different
   * usage contexts (e.g., "olive oil" for sauce vs garnish).
   *
   * @private
   * @param ingredientToEncode - The ingredient object to encode
   * @returns Encoded string, or empty string if ingredient not found in database
   *
   * @example
   * // Without note
   * encodeIngredient({id: 1, quantity: "200", ...}) // "1--200"
   *
   * // With note
   * encodeIngredient({id: 1, quantity: "200", note: "For the sauce", ...}) // "1--200%%For the sauce"
   */
  private encodeIngredient(ingredientToEncode: ingredientTableElement): string {
    const quantity = ingredientToEncode.quantity ? ingredientToEncode.quantity.toString() : '';
    const note = ingredientToEncode.note || '';
    let idForEncoding: number;
    if (ingredientToEncode.id === undefined) {
      const foundIngredient = this.find_ingredient(ingredientToEncode);
      if (foundIngredient === undefined || foundIngredient.id === undefined) {
        databaseLogger.warn('Cannot encode ingredient - not found in database', {
          ingredientName: ingredientToEncode.name,
        });
        return '';
      } else {
        idForEncoding = foundIngredient.id;
      }
    } else {
      idForEncoding = ingredientToEncode.id;
    }
    const baseEncoding = idForEncoding + textSeparator + quantity;
    return note ? baseEncoding + noteSeparator + note : baseEncoding;
  }

  /**
   * Decodes ingredients from a recipe's encoded ingredient string
   *
   * Parses the encoded ingredient string from a recipe, looking up each ingredient
   * by ID in the database and combining it with the recipe-specific quantities
   * and optional usage notes. Also calculates the combined seasonal availability.
   *
   * Supports both old format (without notes) and new format (with notes):
   * - Old: "1--250__2--100" (backward compatible)
   * - New: "1--250%%For sauce__2--100%%For garnish"
   *
   * @private
   * @param encodedIngredient - Encoded string containing ingredient IDs, quantities, and optional notes
   * @returns Promise resolving to tuple of [decoded ingredients array, combined season array]
   *
   * @example
   * // Old format (backward compatible)
   * Input: "1--250__2--100"
   * Output: [[ingredient1 with quantity 250, ingredient2 with quantity 100], ["5","6","7"]]
   *
   * // New format with notes
   * Input: "1--200%%For sauce__1--100%%For garnish"
   * Output: [[ingredient1 with quantity 200 and note "For sauce", ingredient1 with quantity 100 and note "For garnish"], ...]
   */
  private async decodeIngredientFromRecipe(
    encodedIngredient: string
  ): Promise<[ingredientTableElement[], string[]]> {
    const arrDecoded = [];
    let recipeSeason: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    let firstSeasonFound = true;

    const ingSplit = encodedIngredient.includes(EncodingSeparator)
      ? encodedIngredient.split(EncodingSeparator)
      : [encodedIngredient];

    for (const ingredient of ingSplit) {
      const id = Number(ingredient.split(textSeparator)[0]);
      const quantityAndNote = ingredient.split(textSeparator)[1] || '';

      const [ingQuantity, ingNote] = quantityAndNote.includes(noteSeparator)
        ? quantityAndNote.split(noteSeparator)
        : [quantityAndNote, undefined];

      const tableIngredient =
        await this._ingredientsTable.searchElementById<encodedIngredientElement>(
          id,
          this._dbConnection
        );
      if (tableIngredient === undefined) {
        databaseLogger.warn('Failed to find ingredient during recipe decoding', {
          ingredientId: id,
        });
      } else {
        const decodedIngredient = this.decodeIngredient(tableIngredient);
        decodedIngredient.quantity = ingQuantity;
        if (ingNote) {
          decodedIngredient.note = ingNote;
        }
        arrDecoded.push(decodedIngredient);

        if (!decodedIngredient.season.includes('*')) {
          if (firstSeasonFound) {
            recipeSeason = decodedIngredient.season;
            firstSeasonFound = false;
          } else {
            recipeSeason = this.decodeSeason(recipeSeason, decodedIngredient.season);
          }
        }
      }
    }
    return [arrDecoded, recipeSeason];
  }

  /**
   * Encodes a single ingredient for database storage
   *
   * Converts an ingredient element from application format into the encoded
   * format required for database insertion. Joins seasonal data into a string
   * representation using the encoding separator.
   *
   * @private
   * @param ingredient - The ingredient object in application format
   * @returns Encoded ingredient ready for database storage
   *
   * @example
   * Input: {id: 1, name: "Flour", unit: "g", type: "grain", season: ["1","2","3","12"]}
   * Output: {"ID":1,"INGREDIENT":"Flour","UNIT":"g", "TYPE":"grain", "SEASON":"1__2__3__12"}
   */
  private encodeIngredientForDb(ingredient: ingredientTableElement): encodedIngredientElement {
    return {
      ID: ingredient.id ? ingredient.id : 0,
      INGREDIENT: ingredient.name,
      UNIT: ingredient.unit,
      TYPE: ingredient.type,
      SEASON: ingredient.season.join(EncodingSeparator),
    };
  }

  /**
   * Encodes a single tag for database storage
   *
   * Converts a tag element from application format into the encoded
   * format required for database insertion.
   *
   * @private
   * @param tag - The tag object in application format
   * @returns Encoded tag ready for database storage
   *
   * @example
   * Input: {id: 1, name: "Dessert"}
   * Output: {"ID":1,"NAME":"Dessert"}
   */
  private encodeTagForDb(tag: tagTableElement): encodedTagElement {
    return {
      ID: tag.id ? tag.id : 0,
      NAME: tag.name,
    };
  }

  /**
   * Decodes a single ingredient from database storage format
   *
   * Converts an encoded ingredient element from the database into the application
   * format, parsing the seasonal data from its encoded string representation.
   *
   * @private
   * @param dbIngredient - The encoded ingredient data from database
   * @returns Decoded ingredient object in application format
   *
   * @example
   * Input: {"ID":1,"INGREDIENT":"Flour","UNIT":"g", "TYPE":"grain", "SEASON":"1__2__3__12"}
   * Output: {id: 1, name: "Flour", unit: "g", type: "grain", season: ["1","2","3","12"]}
   */
  private decodeIngredient(dbIngredient: encodedIngredientElement): ingredientTableElement {
    // Ex :  {"ID":1,"INGREDIENT":"INGREDIENT NAME","UNIT":"g", "TYPE":"BASE", "SEASON":"*"}
    return {
      id: dbIngredient.ID,
      name: dbIngredient.INGREDIENT,
      unit: dbIngredient.UNIT,
      type: dbIngredient.TYPE as ingredientType,
      season: dbIngredient.SEASON.split(EncodingSeparator),
    };
  }

  /**
   * Decodes an array of ingredients from database storage format
   *
   * Processes multiple encoded ingredient elements from database queries,
   * converting each one to the application format. Returns empty array if
   * input is null, undefined, or empty.
   *
   * @private
   * @param queryResult - Array of encoded ingredient elements from database
   * @returns Array of decoded ingredient objects in application format
   */
  private decodeArrayOfIngredients(
    queryResult: encodedIngredientElement[]
  ): ingredientTableElement[] {
    if (!queryResult || !Array.isArray(queryResult) || queryResult.length === 0) {
      return [];
    }
    return queryResult.map(ingredient => this.decodeIngredient(ingredient));
  }

  /**
   * Calculates the intersection of two seasonal availability arrays
   *
   * Combines seasonal data from multiple ingredients to determine when a recipe
   * can be made using seasonal ingredients. Returns months that are common to both seasons.
   *
   * @private
   * @param previousSeason - Previously calculated season array (accumulated from other ingredients)
   * @param ingredientSeason - Season array from current ingredient
   * @returns Array of month strings that are available in both seasons
   *
   * @example
   * Input: ["5","6","7","8"], ["6","7","8","9"]
   * Output: ["6","7","8"]
   */
  private decodeSeason(previousSeason: string[], ingredientSeason: string[]): string[] {
    return previousSeason.filter(month => ingredientSeason.includes(month));
  }

  /**
   * Encodes a tag for storage within a recipe's tags list
   *
   * Converts a tag to its database ID string representation for storage
   * within recipe data. Looks up the tag in the local cache if ID is missing.
   *
   * @private
   * @param tag - The tag object to encode
   * @returns String representation of the tag's database ID, or error message if not found
   */
  private encodeTagForRecipe(tag: tagTableElement): string {
    if (tag.id === undefined) {
      const foundedTag = this.find_tag(tag);
      if (foundedTag && foundedTag.id) {
        return foundedTag.id.toString();
      } else {
        return 'ERROR : tag not found';
      }
    } else {
      return tag.id.toString();
    }
  }

  /**
   * Decodes tags from a recipe's encoded tag string
   *
   * Parses the encoded tag string from a recipe, looking up each tag by ID
   * in the database to get the full tag information including names.
   *
   * @private
   * @param encodedTag - Encoded string containing tag IDs separated by encoding separators
   * @returns Promise resolving to array of decoded tag objects
   *
   * @example
   * Input: "1__2__5__3__4"
   * Output: [{id: 1, name: "Italian"}, {id: 2, name: "Dinner"}, ...]
   */
  private async decodeTagFromRecipe(encodedTag: string): Promise<tagTableElement[]> {
    const arrDecoded = [];

    // Ex : "1__2__5__3__4"
    const tagSplit = encodedTag.includes(EncodingSeparator)
      ? encodedTag.split(EncodingSeparator)
      : [encodedTag];

    for (const tag of tagSplit) {
      const tableTag = await this._tagsTable.searchElementById<encodedTagElement>(
        +tag,
        this._dbConnection
      );
      if (tableTag !== undefined) {
        arrDecoded.push(this.decodeTag(tableTag));
      } else {
        databaseLogger.warn('Failed to find tag during recipe decoding', { tagId: +tag });
      }
    }

    return arrDecoded;
  }

  /**
   * Decodes a single tag from database storage format
   *
   * Converts an encoded tag element from the database into the application format.
   *
   * @private
   * @param dbTag - The encoded tag data from database
   * @returns Decoded tag object in application format
   *
   * @example
   * Input: {"ID":4,"NAME":"Italian"}
   * Output: {id: 4, name: "Italian"}
   */
  private decodeTag(dbTag: encodedTagElement): tagTableElement {
    // Ex : {"ID":4,"NAME":"TAG NAME"}
    return { id: dbTag.ID, name: dbTag.NAME };
  }

  /**
   * Decodes an array of tags from database storage format
   *
   * Processes multiple encoded tag elements from database queries,
   * converting each one to the application format. Returns empty array if
   * input is null, undefined, or empty.
   *
   * @private
   * @param queryResult - Array of encoded tag elements from database
   * @returns Array of decoded tag objects in application format
   */
  private decodeArrayOfTags(queryResult: encodedTagElement[]): tagTableElement[] {
    if (!queryResult || !Array.isArray(queryResult) || queryResult.length === 0) {
      return [];
    }
    return queryResult.map(tagFound => this.decodeTag(tagFound));
  }

  /**
   * Encodes nutrition information for database storage
   *
   * Converts a nutrition object to a string representation by joining all
   * nutritional values with text separators for compact storage within recipe data.
   *
   * @private
   * @param nutrition - The nutrition object to encode
   * @returns String representation of all nutrition values separated by text separators
   */
  private encodeNutrition(nutrition: nutritionTableElement): string {
    return [
      nutrition.id || 0,
      nutrition.energyKcal,
      nutrition.energyKj,
      nutrition.fat,
      nutrition.saturatedFat,
      nutrition.carbohydrates,
      nutrition.sugars,
      nutrition.fiber,
      nutrition.protein,
      nutrition.salt,
      nutrition.portionWeight,
    ].join(textSeparator);
  }

  /**
   * Decodes nutrition information from database storage format
   *
   * Parses an encoded nutrition string back into a nutrition object.
   * Returns undefined if the string is empty or has invalid format.
   *
   * @private
   * @param encodedNutrition - Encoded string containing nutrition values separated by text separators
   * @returns Decoded nutrition object or undefined if invalid/empty
   *
   * @example
   * Input: "0--250--1046--15.0--8.0--25.0--12.0--2.5--6.0--0.8--100"
   * Output: {id: undefined, energyKcal: 250, energyKj: 1046, fat: 15.0, ...}
   */
  private decodeNutrition(encodedNutrition: string): nutritionTableElement | undefined {
    if (!encodedNutrition || encodedNutrition.trim().length === 0) {
      return undefined;
    }

    const parts = encodedNutrition.split(textSeparator);
    if (parts.length !== 11) {
      databaseLogger.warn('Invalid nutrition data format', { encodedNutrition });
      return undefined;
    }

    return {
      id: Number(parts[0]) || undefined,
      energyKcal: Number(parts[1]),
      energyKj: Number(parts[2]),
      fat: Number(parts[3]),
      saturatedFat: Number(parts[4]),
      carbohydrates: Number(parts[5]),
      sugars: Number(parts[6]),
      fiber: Number(parts[7]),
      protein: Number(parts[8]),
      salt: Number(parts[9]),
      portionWeight: Number(parts[10]),
    };
  }

  /**
   * Decodes preparation steps from database storage format
   *
   * Parses an encoded preparation string back into an array of preparation step objects.
   * Each step can have both a title and description, or just a description.
   *
   * @private
   * @param encodedPreparation - Encoded string containing preparation steps
   * @returns Array of preparation step objects with title and description
   *
   * @example
   * Input: "Cook pasta--Boil water and add pasta__Mix sauce--Combine ingredients"
   * Output: [{title: "Cook pasta", description: "Boil water and add pasta"}, {title: "Mix sauce", description: "Combine ingredients"}]
   */
  private decodePreparation(encodedPreparation: string): preparationStepElement[] {
    if (!encodedPreparation) {
      return [];
    }

    const steps = encodedPreparation.includes(EncodingSeparator)
      ? encodedPreparation.split(EncodingSeparator)
      : [encodedPreparation];

    return steps.map(step => {
      if (step.includes(textSeparator)) {
        const [title, description] = step.split(textSeparator);
        return { title: title || '', description: description || '' };
      } else {
        return { title: '', description: step };
      }
    });
  }

  /**
   * Retrieves all recipes from the database
   *
   * Fetches all recipe records from the database and decodes them into
   * the application format for use in the local cache.
   *
   * @private
   * @returns Promise resolving to array of all recipes in application format
   */
  private async getAllRecipes(): Promise<recipeTableElement[]> {
    return await this.decodeArrayOfRecipe(
      (await this._recipesTable.searchElement(this._dbConnection)) as encodedRecipeElement[]
    );
  }

  /**
   * Retrieves all tags from the database
   *
   * Fetches all tag records from the database and decodes them into
   * the application format for use in the local cache.
   *
   * @private
   * @returns Promise resolving to array of all tags in application format
   */
  private async getAllTags(): Promise<tagTableElement[]> {
    return this.decodeArrayOfTags(
      (await this._tagsTable.searchElement(this._dbConnection)) as encodedTagElement[]
    );
  }

  /**
   * Retrieves all ingredients from the database
   *
   * Fetches all ingredient records from the database and decodes them into
   * the application format for use in the local cache.
   *
   * @private
   * @returns Promise resolving to array of all ingredients in application format
   */
  private async getAllIngredients(): Promise<ingredientTableElement[]> {
    return this.decodeArrayOfIngredients(
      (await this._ingredientsTable.searchElement(this._dbConnection)) as encodedIngredientElement[]
    );
  }

  /**
   * Retrieves all menu items from the database
   *
   * Fetches all menu records from the database and decodes them into
   * the application format for use in the local cache.
   *
   * @private
   * @returns Promise resolving to array of all menu items in application format
   */
  private async getAllMenu(): Promise<menuTableElement[]> {
    return this.decodeArrayOfMenu(
      (await this._menuTable.searchElement(this._dbConnection)) as encodedMenuElement[]
    );
  }

  /**
   * Encodes a menu item for database storage
   *
   * Converts a menu element from application format into the encoded
   * format required for database insertion.
   *
   * @private
   * @param menu - The menu item in application format
   * @returns Encoded menu item ready for database storage
   */
  private encodeMenu(menu: menuTableElement): encodedMenuElement {
    return {
      ID: menu.id ? menu.id : 0,
      RECIPE_ID: menu.recipeId,
      RECIPE_TITLE: menu.recipeTitle,
      IMAGE_SOURCE: menu.imageSource,
      IS_COOKED: menu.isCooked ? 1 : 0,
      COUNT: menu.count,
    };
  }

  /**
   * Decodes a menu item from database storage format
   *
   * Converts an encoded menu element from the database into the
   * application format.
   *
   * @private
   * @param encodedMenu - The encoded menu data from database
   * @returns Decoded menu item in application format
   */
  private decodeMenu(encodedMenu: encodedMenuElement): menuTableElement {
    return {
      id: encodedMenu.ID,
      recipeId: encodedMenu.RECIPE_ID,
      recipeTitle: encodedMenu.RECIPE_TITLE,
      imageSource: encodedMenu.IMAGE_SOURCE,
      isCooked: encodedMenu.IS_COOKED !== 0,
      count: encodedMenu.COUNT ?? 1,
    };
  }

  /**
   * Decodes an array of menu items from database storage format
   *
   * Processes multiple encoded menu elements from database queries,
   * converting each one to the application format. Returns empty array if
   * input is null, undefined, or empty.
   *
   * @private
   * @param queryResult - Array of encoded menu elements from database
   * @returns Array of decoded menu items in application format
   */
  private decodeArrayOfMenu(queryResult: encodedMenuElement[]): menuTableElement[] {
    if (!queryResult || !Array.isArray(queryResult) || queryResult.length === 0) {
      return [];
    }
    return queryResult.map(menuElement => this.decodeMenu(menuElement));
  }

  /**
   * Compares two ingredient lists for similarity
   *
   * Determines if two ingredient lists are similar by comparing both ingredient
   * names and quantities per person. Uses a 20% threshold for quantity differences.
   * Used in the similar recipes feature to find recipes with comparable ingredients.
   *
   * @private
   * @param ingredients1 - First ingredient list to compare
   * @param ingredients2 - Second ingredient list to compare
   * @returns True if ingredients lists are similar, false otherwise
   *
   * @example
   * Two recipes with "flour: 2 cups per person" and "flour: 2.1 cups per person" would be similar
   * Two recipes with "flour: 2 cups per person" and "flour: 3 cups per person" would not be similar (50% difference > 20% threshold)
   */
  private areIngredientsSimilar(
    ingredients1: coreIngredientElement[],
    ingredients2: coreIngredientElement[]
  ): boolean {
    if (ingredients1.length !== ingredients2.length) {
      return false;
    }

    for (let i = 0; i < ingredients1.length; i++) {
      const ing1 = ingredients1[i];
      const ing2 = ingredients2[i];

      if (ing1.name !== ing2.name) {
        return false;
      }

      const quantity1 = ing1.quantityPerPerson as number;
      const quantity2 = ing2.quantityPerPerson as number;

      if (quantity1 === quantity2) {
        continue;
      }

      const max = Math.max(quantity1, quantity2);
      const min = Math.min(quantity1, quantity2);

      // Threshold of 20%
      if (max > min * 1.2) {
        return false;
      }
    }

    return true;
  }

  /**
   * Migrates the database to add source tracking columns if they don't exist
   *
   * This migration adds SOURCE_URL and SOURCE_PROVIDER columns to the recipes table
   * to support bulk import tracking. Runs safely even if columns already exist.
   *
   * @private
   */
  private async migrateAddSourceColumns(): Promise<void> {
    try {
      await this._dbConnection.execAsync(
        `ALTER TABLE "${recipeTableName}"
                    ADD COLUMN "${recipeColumnsNames.sourceUrl}" TEXT NOT NULL DEFAULT ''`
      );
      databaseLogger.info('Added SOURCE_URL column to recipes table');
    } catch {
      databaseLogger.debug('SOURCE_URL column migration skipped (likely already exists)');
    }

    try {
      await this._dbConnection.execAsync(
        `ALTER TABLE "${recipeTableName}"
                    ADD COLUMN "${recipeColumnsNames.sourceProvider}" TEXT NOT NULL DEFAULT ''`
      );
      databaseLogger.info('Added SOURCE_PROVIDER column to recipes table');
    } catch {
      databaseLogger.debug('SOURCE_PROVIDER column migration skipped (likely already exists)');
    }
  }

  /**
   * Retrieves all import history records from the database
   *
   * @private
   * @returns Promise resolving to array of all import history records
   */
  private async getAllImportHistory(): Promise<importHistoryTableElement[]> {
    const results = (await this._importHistoryTable.searchElement(
      this._dbConnection
    )) as encodedImportHistoryElement[];

    if (!results || !Array.isArray(results) || results.length === 0) {
      return [];
    }

    return results.map(encoded => this.decodeImportHistory(encoded));
  }

  /**
   * Decodes an import history record from database format
   *
   * @private
   */
  private decodeImportHistory(encoded: encodedImportHistoryElement): importHistoryTableElement {
    return {
      id: encoded.ID,
      providerId: encoded.PROVIDER_ID,
      recipeUrl: encoded.RECIPE_URL,
      lastSeenAt: encoded.LAST_SEEN_AT,
    };
  }

  /**
   * Encodes an import history record for database storage
   *
   * @private
   */
  private encodeImportHistory(history: importHistoryTableElement): encodedImportHistoryElement {
    return {
      ID: history.id || 0,
      PROVIDER_ID: history.providerId,
      RECIPE_URL: history.recipeUrl,
      LAST_SEEN_AT: history.lastSeenAt,
    };
  }
}

export default RecipeDatabase;
