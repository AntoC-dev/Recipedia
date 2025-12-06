import {
  buildRecipeImageProps,
  buildRecipeIngredientsProps,
  buildRecipeNutritionProps,
  buildRecipePersonsProps,
  buildRecipePreparationProps,
  buildRecipeTagsProps,
  buildRecipeTitleProps,
  convertModeFromProps,
  getMissingFieldsErrorContent,
  getValidationButtonConfig,
  hasRecipeFromProps,
  IMAGE_BUTTON_CONFIG,
  RecipePropType,
  scaleRecipeForSave,
  validateRecipeData,
} from '@utils/RecipeFormHelpers';
import { recipeStateType } from '@customTypes/ScreenTypes';
import {
  ingredientTableElement,
  ingredientType,
  preparationStepElement,
  recipeTableElement,
} from '@customTypes/DatabaseElementTypes';
import { defaultValueNumber } from '@utils/Constants';
import { Icons } from '@assets/Icons';

describe('RecipeFormHelpers', () => {
  describe('convertModeFromProps', () => {
    test('converts readOnly mode correctly', () => {
      expect(convertModeFromProps('readOnly')).toBe(recipeStateType.readOnly);
    });

    test('converts edit mode correctly', () => {
      expect(convertModeFromProps('edit')).toBe(recipeStateType.edit);
    });

    test('converts addManually mode correctly', () => {
      expect(convertModeFromProps('addManually')).toBe(recipeStateType.addManual);
    });

    test('converts addFromPic mode correctly', () => {
      expect(convertModeFromProps('addFromPic')).toBe(recipeStateType.addOCR);
    });
  });

  describe('hasRecipeFromProps', () => {
    const mockRecipe: recipeTableElement = {
      id: 1,
      image_Source: 'test.jpg',
      title: 'Test Recipe',
      description: 'Test description',
      tags: [],
      persons: 4,
      ingredients: [],
      season: [],
      preparation: [],
      time: 30,
    };

    test('returns true for readOnly mode', () => {
      const props: RecipePropType = { mode: 'readOnly', recipe: mockRecipe };
      expect(hasRecipeFromProps(props)).toBe(true);
    });

    test('returns true for edit mode', () => {
      const props: RecipePropType = { mode: 'edit', recipe: mockRecipe };
      expect(hasRecipeFromProps(props)).toBe(true);
    });

    test('returns false for addManually mode', () => {
      const props: RecipePropType = { mode: 'addManually' };
      expect(hasRecipeFromProps(props)).toBe(false);
    });

    test('returns false for addFromPic mode', () => {
      const props: RecipePropType = { mode: 'addFromPic', imgUri: 'test.jpg' };
      expect(hasRecipeFromProps(props)).toBe(false);
    });
  });

  describe('validateRecipeData', () => {
    const mockT = (key: string) => key;
    const validIngredient: ingredientTableElement = {
      id: 1,
      name: 'Tomato',
      unit: 'g',
      quantity: '100',
      type: ingredientType.vegetable,
      season: ['1', '2', '3'],
    };
    const validPreparationStep: preparationStepElement = {
      title: 'Step 1',
      description: 'Do something',
    };
    const validData = {
      recipeImage: 'image.jpg',
      recipeTitle: 'Recipe Title',
      recipeIngredients: [validIngredient],
      recipePreparation: [validPreparationStep],
      recipePersons: 4,
      recipeTime: 30,
      recipeNutrition: undefined,
    };

    test('returns empty array for valid recipe data', () => {
      const result = validateRecipeData(validData, mockT);
      expect(result).toEqual([]);
    });

    test('returns missing image error for empty image', () => {
      const result = validateRecipeData({ ...validData, recipeImage: '' }, mockT);
      expect(result).toContain('alerts.missingElements.image');
    });

    test('returns missing title error for empty title', () => {
      const result = validateRecipeData({ ...validData, recipeTitle: '' }, mockT);
      expect(result).toContain('alerts.missingElements.titleRecipe');
    });

    test('returns missing ingredients error for empty ingredients array', () => {
      const result = validateRecipeData({ ...validData, recipeIngredients: [] }, mockT);
      expect(result).toContain('alerts.missingElements.titleIngredients');
    });

    test('returns missing ingredient names error for ingredients without names', () => {
      const ingredientWithoutName: ingredientTableElement = { ...validIngredient, name: '' };
      const result = validateRecipeData(
        { ...validData, recipeIngredients: [ingredientWithoutName] },
        mockT
      );
      expect(result).toContain('alerts.missingElements.ingredientNames');
    });

    test('returns missing ingredient quantities error for ingredients without quantities', () => {
      const ingredientWithoutQuantity: ingredientTableElement = {
        ...validIngredient,
        quantity: '',
      };
      const result = validateRecipeData(
        { ...validData, recipeIngredients: [ingredientWithoutQuantity] },
        mockT
      );
      expect(result).toContain('alerts.missingElements.ingredientQuantities');
    });

    test('returns missing ingredient database error for ingredients without type', () => {
      const ingredientWithoutType = {
        name: 'Tomato',
        unit: 'g',
        quantity: '100',
        season: ['1', '2', '3'],
      };
      const result = validateRecipeData(
        { ...validData, recipeIngredients: [ingredientWithoutType] },
        mockT
      );
      expect(result).toContain('alerts.missingElements.ingredientInDatabase');
    });

    test('returns missing preparation error for empty preparation array', () => {
      const result = validateRecipeData({ ...validData, recipePreparation: [] }, mockT);
      expect(result).toContain('alerts.missingElements.titlePreparation');
    });

    test('returns missing persons error for default persons value', () => {
      const result = validateRecipeData({ ...validData, recipePersons: defaultValueNumber }, mockT);
      expect(result).toContain('alerts.missingElements.titlePersons');
    });

    test('returns missing time error for default time value', () => {
      const result = validateRecipeData({ ...validData, recipeTime: defaultValueNumber }, mockT);
      expect(result).toContain('alerts.missingElements.titleTime');
    });

    test('returns missing nutrition error for incomplete nutrition', () => {
      const incompleteNutrition = {
        energyKcal: 100,
        energyKj: 420,
        fat: 5,
        saturatedFat: defaultValueNumber,
        carbohydrates: 20,
        sugars: 10,
        fiber: 2,
        protein: 10,
        salt: 0.5,
        portionWeight: 100,
      };
      const result = validateRecipeData(
        { ...validData, recipeNutrition: incompleteNutrition },
        mockT
      );
      expect(result).toContain('alerts.missingElements.nutrition');
    });

    test('returns multiple errors for multiple missing fields', () => {
      const result = validateRecipeData(
        {
          recipeImage: '',
          recipeTitle: '',
          recipeIngredients: [],
          recipePreparation: [],
          recipePersons: defaultValueNumber,
          recipeTime: defaultValueNumber,
          recipeNutrition: undefined,
        },
        mockT
      );
      expect(result.length).toBeGreaterThan(1);
      expect(result).toContain('alerts.missingElements.image');
      expect(result).toContain('alerts.missingElements.titleRecipe');
    });
  });

  describe('scaleRecipeForSave', () => {
    const baseRecipe: recipeTableElement = {
      id: 1,
      image_Source: 'test.jpg',
      title: 'Test Recipe',
      description: 'Test',
      tags: [],
      persons: 4,
      ingredients: [
        {
          id: 1,
          name: 'Flour',
          unit: 'g',
          quantity: '200',
          type: ingredientType.cereal,
          season: [],
        },
        {
          id: 2,
          name: 'Sugar',
          unit: 'g',
          quantity: '100',
          type: ingredientType.sugar,
          season: [],
        },
      ],
      season: [],
      preparation: [],
      time: 30,
    };

    test('returns unchanged recipe when persons match default', () => {
      const result = scaleRecipeForSave(baseRecipe, 4);
      expect(result).toBe(baseRecipe);
    });

    test('returns unchanged recipe when persons is 0', () => {
      const zeroPersonsRecipe = { ...baseRecipe, persons: 0 };
      const result = scaleRecipeForSave(zeroPersonsRecipe, 4);
      expect(result).toBe(zeroPersonsRecipe);
    });

    test('returns unchanged recipe when persons is negative', () => {
      const negativePersonsRecipe = { ...baseRecipe, persons: -1 };
      const result = scaleRecipeForSave(negativePersonsRecipe, 4);
      expect(result).toBe(negativePersonsRecipe);
    });

    test('scales ingredients down when recipe has more persons than default', () => {
      const morePersonsRecipe = { ...baseRecipe, persons: 8 };
      const result = scaleRecipeForSave(morePersonsRecipe, 4);

      expect(result.persons).toBe(4);
      expect(result.ingredients[0].quantity).toBe('100');
      expect(result.ingredients[1].quantity).toBe('50');
    });

    test('scales ingredients up when recipe has fewer persons than default', () => {
      const fewerPersonsRecipe = { ...baseRecipe, persons: 2 };
      const result = scaleRecipeForSave(fewerPersonsRecipe, 4);

      expect(result.persons).toBe(4);
      expect(result.ingredients[0].quantity).toBe('400');
      expect(result.ingredients[1].quantity).toBe('200');
    });

    test('handles ingredients without quantity', () => {
      const recipeWithNoQuantity: recipeTableElement = {
        ...baseRecipe,
        persons: 2,
        ingredients: [
          {
            id: 1,
            name: 'Salt',
            unit: 'pinch',
            quantity: undefined,
            type: ingredientType.condiment,
            season: [],
          },
        ],
      };
      const result = scaleRecipeForSave(recipeWithNoQuantity, 4);

      expect(result.ingredients[0].quantity).toBeUndefined();
    });
  });

  describe('getMissingFieldsErrorContent', () => {
    const mockT = (key: string) => key;

    test('returns singular title and content for single missing element', () => {
      const result = getMissingFieldsErrorContent(['Image'], mockT);
      expect(result.title).toBe('alerts.missingElements.titleSingular');
      expect(result.content).toContain('Image');
    });

    test('returns plural title and content for multiple missing elements', () => {
      const result = getMissingFieldsErrorContent(['Image', 'Title', 'Ingredients'], mockT);
      expect(result.title).toBe('alerts.missingElements.titlePlural');
      expect(result.content).toContain('Image');
      expect(result.content).toContain('Title');
      expect(result.content).toContain('Ingredients');
    });

    test('uses special nutrition message for nutrition field', () => {
      const result = getMissingFieldsErrorContent(['alerts.missingElements.nutrition'], mockT);
      expect(result.content).toBe('alerts.missingElements.messageSingularNutrition');
    });
  });

  describe('getValidationButtonConfig', () => {
    const mockT = (key: string) => key;

    test('returns readOnly config for readOnly mode', () => {
      const result = getValidationButtonConfig(recipeStateType.readOnly, mockT);
      expect(result.text).toBe('validateReadOnly');
      expect(result.type).toBe('readOnly');
    });

    test('returns edit config for edit mode', () => {
      const result = getValidationButtonConfig(recipeStateType.edit, mockT);
      expect(result.text).toBe('validateEdit');
      expect(result.type).toBe('edit');
    });

    test('returns add config for addManual mode', () => {
      const result = getValidationButtonConfig(recipeStateType.addManual, mockT);
      expect(result.text).toBe('validateAdd');
      expect(result.type).toBe('add');
    });

    test('returns add config for addOCR mode', () => {
      const result = getValidationButtonConfig(recipeStateType.addOCR, mockT);
      expect(result.text).toBe('validateAdd');
      expect(result.type).toBe('add');
    });
  });

  describe('buildRecipeImageProps', () => {
    const mockOpenModal = jest.fn();

    test('returns undefined button for readOnly mode', () => {
      const result = buildRecipeImageProps(recipeStateType.readOnly, 'image.jpg', mockOpenModal);
      expect(result.imgUri).toBe('image.jpg');
      expect(result.buttonIcon).toBeUndefined();
    });

    test('returns camera icon for edit mode', () => {
      const result = buildRecipeImageProps(recipeStateType.edit, 'image.jpg', mockOpenModal);
      expect(result.buttonIcon).toBe(Icons.cameraIcon);
    });

    test('returns camera icon for addManual mode', () => {
      const result = buildRecipeImageProps(recipeStateType.addManual, 'image.jpg', mockOpenModal);
      expect(result.buttonIcon).toBe(Icons.cameraIcon);
    });

    test('returns scan icon for addOCR mode', () => {
      const result = buildRecipeImageProps(recipeStateType.addOCR, 'image.jpg', mockOpenModal);
      expect(result.buttonIcon).toBe(Icons.scanImageIcon);
    });
  });

  describe('buildRecipeTitleProps', () => {
    const mockT = (key: string) => key;
    const mockSetTitle = jest.fn();
    const mockOpenModal = jest.fn();

    test('returns headline style for readOnly mode', () => {
      const result = buildRecipeTitleProps(
        recipeStateType.readOnly,
        'Test Title',
        mockSetTitle,
        mockOpenModal,
        mockT
      );
      expect(result.rootText.style).toBe('headline');
      expect(result.rootText.value).toBe('Test Title');
      expect(result.addOrEditProps).toBeUndefined();
    });

    test('returns editable props for edit mode', () => {
      const result = buildRecipeTitleProps(
        recipeStateType.edit,
        'Test Title',
        mockSetTitle,
        mockOpenModal,
        mockT
      );
      expect(result.rootText.style).toBe('title');
      expect(result.addOrEditProps?.editType).toBe('editable');
    });

    test('returns add props for addOCR mode with empty title', () => {
      const result = buildRecipeTitleProps(
        recipeStateType.addOCR,
        '',
        mockSetTitle,
        mockOpenModal,
        mockT
      );
      expect(result.addOrEditProps?.editType).toBe('add');
    });

    test('returns editable props for addOCR mode with existing title', () => {
      const result = buildRecipeTitleProps(
        recipeStateType.addOCR,
        'Existing Title',
        mockSetTitle,
        mockOpenModal,
        mockT
      );
      expect(result.addOrEditProps?.editType).toBe('editable');
    });
  });

  describe('buildRecipeTagsProps', () => {
    const mockAddTag = jest.fn();
    const mockRemoveTag = jest.fn();
    const mockOpenModal = jest.fn();
    const mockTags = [{ id: 1, name: 'Italian' }];

    test('returns readOnly type for readOnly mode', () => {
      const result = buildRecipeTagsProps(
        recipeStateType.readOnly,
        mockTags,
        ['Lunch'],
        mockAddTag,
        mockRemoveTag,
        mockOpenModal
      );
      expect(result.type).toBe('readOnly');
    });

    test('returns addOrEdit type with edit for edit mode', () => {
      const result = buildRecipeTagsProps(
        recipeStateType.edit,
        mockTags,
        ['Lunch'],
        mockAddTag,
        mockRemoveTag,
        mockOpenModal
      );
      expect(result.type).toBe('addOrEdit');
      if (result.type === 'addOrEdit') {
        expect(result.editType).toBe('edit');
      }
    });

    test('returns addOrEdit type with add for addOCR mode', () => {
      const result = buildRecipeTagsProps(
        recipeStateType.addOCR,
        mockTags,
        ['Lunch'],
        mockAddTag,
        mockRemoveTag,
        mockOpenModal
      );
      expect(result.type).toBe('addOrEdit');
      if (result.type === 'addOrEdit' && result.editType === 'add') {
        expect(result.openModal).toBeDefined();
      }
    });
  });

  describe('buildRecipePersonsProps', () => {
    const mockT = (key: string) => key;
    const mockSetPersons = jest.fn();
    const mockOpenModal = jest.fn();

    test('returns read type for readOnly mode', () => {
      const result = buildRecipePersonsProps(
        recipeStateType.readOnly,
        4,
        mockSetPersons,
        mockOpenModal,
        mockT
      );
      expect(result.numberProps.editType).toBe('read');
    });

    test('returns editable type for edit mode', () => {
      const result = buildRecipePersonsProps(
        recipeStateType.edit,
        4,
        mockSetPersons,
        mockOpenModal,
        mockT
      );
      expect(result.numberProps.editType).toBe('editable');
    });

    test('returns add type for addOCR mode with default value', () => {
      const result = buildRecipePersonsProps(
        recipeStateType.addOCR,
        defaultValueNumber,
        mockSetPersons,
        mockOpenModal,
        mockT
      );
      expect(result.numberProps.editType).toBe('add');
    });

    test('returns editable type for addOCR mode with existing value', () => {
      const result = buildRecipePersonsProps(
        recipeStateType.addOCR,
        4,
        mockSetPersons,
        mockOpenModal,
        mockT
      );
      expect(result.numberProps.editType).toBe('editable');
    });
  });

  describe('buildRecipeIngredientsProps', () => {
    const mockT = (key: string) => key;
    const mockEditIngredients = jest.fn();
    const mockAddIngredient = jest.fn();
    const mockOpenModal = jest.fn();
    const mockIngredients: ingredientTableElement[] = [
      { id: 1, name: 'Flour', unit: 'g', quantity: '200', type: ingredientType.cereal, season: [] },
    ];

    test('returns readOnly mode for readOnly state', () => {
      const result = buildRecipeIngredientsProps(
        recipeStateType.readOnly,
        mockIngredients,
        mockEditIngredients,
        mockAddIngredient,
        mockOpenModal,
        mockT
      );
      expect(result.mode).toBe('readOnly');
    });

    test('returns editable mode for edit state', () => {
      const result = buildRecipeIngredientsProps(
        recipeStateType.edit,
        mockIngredients,
        mockEditIngredients,
        mockAddIngredient,
        mockOpenModal,
        mockT
      );
      expect(result.mode).toBe('editable');
    });

    test('returns add mode for addOCR state', () => {
      const result = buildRecipeIngredientsProps(
        recipeStateType.addOCR,
        mockIngredients,
        mockEditIngredients,
        mockAddIngredient,
        mockOpenModal,
        mockT
      );
      expect(result.mode).toBe('add');
    });
  });

  describe('buildRecipePreparationProps', () => {
    const mockT = (key: string) => key;
    const mockEditTitle = jest.fn();
    const mockEditDescription = jest.fn();
    const mockAddStep = jest.fn();
    const mockOpenModal = jest.fn();
    const mockSteps: preparationStepElement[] = [{ title: 'Step 1', description: 'Do something' }];

    test('returns readOnly mode for readOnly state', () => {
      const result = buildRecipePreparationProps(
        recipeStateType.readOnly,
        mockSteps,
        mockEditTitle,
        mockEditDescription,
        mockAddStep,
        mockOpenModal,
        mockT
      );
      expect(result.mode).toBe('readOnly');
    });

    test('returns editable mode for edit state', () => {
      const result = buildRecipePreparationProps(
        recipeStateType.edit,
        mockSteps,
        mockEditTitle,
        mockEditDescription,
        mockAddStep,
        mockOpenModal,
        mockT
      );
      expect(result.mode).toBe('editable');
    });

    test('returns add mode for addOCR state with no steps', () => {
      const result = buildRecipePreparationProps(
        recipeStateType.addOCR,
        [],
        mockEditTitle,
        mockEditDescription,
        mockAddStep,
        mockOpenModal,
        mockT
      );
      expect(result.mode).toBe('add');
    });

    test('returns editable mode for addOCR state with existing steps', () => {
      const result = buildRecipePreparationProps(
        recipeStateType.addOCR,
        mockSteps,
        mockEditTitle,
        mockEditDescription,
        mockAddStep,
        mockOpenModal,
        mockT
      );
      expect(result.mode).toBe('editable');
    });
  });

  describe('buildRecipeNutritionProps', () => {
    const mockSetNutrition = jest.fn();
    const mockOpenModal = jest.fn();
    const mockNutrition = {
      energyKcal: 200,
      energyKj: 840,
      fat: 10,
      saturatedFat: 3,
      carbohydrates: 25,
      sugars: 5,
      fiber: 3,
      protein: 8,
      salt: 0.5,
      portionWeight: 150,
    };

    test('returns readOnly mode for readOnly state', () => {
      const result = buildRecipeNutritionProps(
        recipeStateType.readOnly,
        mockNutrition,
        mockSetNutrition,
        mockOpenModal,
        'Recipe'
      );
      expect(result.mode).toBe(recipeStateType.readOnly);
    });

    test('returns edit mode with change handler for edit state', () => {
      const result = buildRecipeNutritionProps(
        recipeStateType.edit,
        mockNutrition,
        mockSetNutrition,
        mockOpenModal,
        'Recipe'
      );
      expect(result.mode).toBe(recipeStateType.edit);
      expect(result.onNutritionChange).toBe(mockSetNutrition);
    });

    test('returns addOCR mode with openModal for addOCR state', () => {
      const result = buildRecipeNutritionProps(
        recipeStateType.addOCR,
        undefined,
        mockSetNutrition,
        mockOpenModal,
        'Recipe'
      );
      expect(result.mode).toBe(recipeStateType.addOCR);
      expect(result.openModal).toBeDefined();
    });
  });

  describe('IMAGE_BUTTON_CONFIG', () => {
    test('has undefined for readOnly mode', () => {
      expect(IMAGE_BUTTON_CONFIG[recipeStateType.readOnly]).toBeUndefined();
    });

    test('has camera icon for edit mode', () => {
      expect(IMAGE_BUTTON_CONFIG[recipeStateType.edit]).toBe(Icons.cameraIcon);
    });

    test('has camera icon for addManual mode', () => {
      expect(IMAGE_BUTTON_CONFIG[recipeStateType.addManual]).toBe(Icons.cameraIcon);
    });

    test('has scan icon for addOCR mode', () => {
      expect(IMAGE_BUTTON_CONFIG[recipeStateType.addOCR]).toBe(Icons.scanImageIcon);
    });
  });
});
