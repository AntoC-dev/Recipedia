import {
  buildRecipeDescriptionProps,
  buildRecipeImageProps,
  buildRecipeNutritionProps,
  buildRecipePersonsProps,
  buildRecipeSourceUrlProps,
  buildRecipeTagsProps,
  buildRecipeTimeProps,
  buildRecipeTitleProps,
  convertModeFromProps,
  getMissingFieldsErrorContent,
  getValidationButtonConfig,
  hasRecipeFromProps,
  hasScrapedDataFromProps,
  IMAGE_BUTTON_CONFIG,
  RecipePropType,
  scaleRecipeForSave,
} from '@utils/RecipeFormHelpers';
import { OcrModalTarget } from '@utils/OCR';
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

    test('converts addFromScrape mode correctly', () => {
      expect(convertModeFromProps('addFromScrape')).toBe(recipeStateType.addScrape);
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

    test('uses singular beginning+ending message for non-nutrition single element', () => {
      const result = getMissingFieldsErrorContent(['Title'], mockT);
      expect(result.content).toContain('alerts.missingElements.messageSingularBeginning');
      expect(result.content).toContain('Title');
      expect(result.content).toContain('alerts.missingElements.messageSingularEnding');
    });

    test('formats plural content with bullet list', () => {
      const result = getMissingFieldsErrorContent(['Field1', 'Field2'], mockT);
      expect(result.content).toContain('\n\t- Field1');
      expect(result.content).toContain('\n\t- Field2');
    });

    test('returns plural for exactly 2 elements', () => {
      const result = getMissingFieldsErrorContent(['A', 'B'], mockT);
      expect(result.title).toBe('alerts.missingElements.titlePlural');
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

    test('returns add config for addScrape mode', () => {
      const result = getValidationButtonConfig(recipeStateType.addScrape, mockT);
      expect(result.text).toBe('validateAdd');
      expect(result.type).toBe('add');
    });
  });

  describe('buildRecipeImageProps', () => {
    const mockOpenModal = jest.fn();

    test('returns undefined button for readOnly mode', () => {
      const result = buildRecipeImageProps({
        stackMode: recipeStateType.readOnly,
        recipeImage: 'image.jpg',
        openModalForField: mockOpenModal,
      });
      expect(result.imgUri).toBe('image.jpg');
      expect(result.buttonIcon).toBeUndefined();
    });

    test('returns camera icon for edit mode', () => {
      const result = buildRecipeImageProps({
        stackMode: recipeStateType.edit,
        recipeImage: 'image.jpg',
        openModalForField: mockOpenModal,
      });
      expect(result.buttonIcon).toBe(Icons.cameraIcon);
    });

    test('returns camera icon for addManual mode', () => {
      const result = buildRecipeImageProps({
        stackMode: recipeStateType.addManual,
        recipeImage: 'image.jpg',
        openModalForField: mockOpenModal,
      });
      expect(result.buttonIcon).toBe(Icons.cameraIcon);
    });

    test('returns scan icon for addOCR mode', () => {
      const result = buildRecipeImageProps({
        stackMode: recipeStateType.addOCR,
        recipeImage: 'image.jpg',
        openModalForField: mockOpenModal,
      });
      expect(result.buttonIcon).toBe(Icons.scanImageIcon);
    });

    test('returns camera icon for addScrape mode', () => {
      const result = buildRecipeImageProps({
        stackMode: recipeStateType.addScrape,
        recipeImage: 'image.jpg',
        openModalForField: mockOpenModal,
      });
      expect(result.buttonIcon).toBe(Icons.cameraIcon);
    });

    test('passes openModal callback to props', () => {
      const result = buildRecipeImageProps({
        stackMode: recipeStateType.edit,
        recipeImage: 'image.jpg',
        openModalForField: mockOpenModal,
      });
      expect(result.openModal).toBe(mockOpenModal);
    });
  });

  describe('buildRecipeTitleProps', () => {
    const mockT = (key: string) => key;
    const mockSetTitle = jest.fn();
    const mockOpenModal = jest.fn();

    test('returns headline style for readOnly mode', () => {
      const result = buildRecipeTitleProps({
        stackMode: recipeStateType.readOnly,
        recipeTitle: 'Test Title',
        setRecipeTitle: mockSetTitle,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.rootText.style).toBe('headline');
      expect(result.rootText.value).toBe('Test Title');
      expect(result.addOrEditProps).toBeUndefined();
    });

    test('returns editable props for edit mode', () => {
      const result = buildRecipeTitleProps({
        stackMode: recipeStateType.edit,
        recipeTitle: 'Test Title',
        setRecipeTitle: mockSetTitle,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.rootText.style).toBe('title');
      expect(result.addOrEditProps?.editType).toBe('editable');
    });

    test('returns add props for addOCR mode with empty title', () => {
      const result = buildRecipeTitleProps({
        stackMode: recipeStateType.addOCR,
        recipeTitle: '',
        setRecipeTitle: mockSetTitle,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.addOrEditProps?.editType).toBe('add');
    });

    test('returns editable props for addOCR mode with existing title', () => {
      const result = buildRecipeTitleProps({
        stackMode: recipeStateType.addOCR,
        recipeTitle: 'Existing Title',
        setRecipeTitle: mockSetTitle,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.addOrEditProps?.editType).toBe('editable');
    });

    test('returns add props for addOCR mode with whitespace-only title', () => {
      const result = buildRecipeTitleProps({
        stackMode: recipeStateType.addOCR,
        recipeTitle: '   ',
        setRecipeTitle: mockSetTitle,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.addOrEditProps?.editType).toBe('add');
    });

    test('openModal callback in addOCR add mode calls openModalForField with title', () => {
      const result = buildRecipeTitleProps({
        stackMode: recipeStateType.addOCR,
        recipeTitle: '',
        setRecipeTitle: mockSetTitle,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      if (result.addOrEditProps?.editType === 'add') {
        result.addOrEditProps.openModal();
        expect(mockOpenModal).toHaveBeenCalled();
      }
    });

    test('returns editable props for addManual mode', () => {
      const result = buildRecipeTitleProps({
        stackMode: recipeStateType.addManual,
        recipeTitle: 'My Recipe',
        setRecipeTitle: mockSetTitle,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.addOrEditProps?.editType).toBe('editable');
    });

    test('returns editable props for addScrape mode', () => {
      const result = buildRecipeTitleProps({
        stackMode: recipeStateType.addScrape,
        recipeTitle: 'Scraped Title',
        setRecipeTitle: mockSetTitle,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.addOrEditProps?.editType).toBe('editable');
    });
  });

  describe('buildRecipeDescriptionProps', () => {
    const mockT = (key: string) => key;
    const mockSetDescription = jest.fn();
    const mockOpenModal = jest.fn();

    test('returns readOnly with paragraph style for readOnly mode', () => {
      const result = buildRecipeDescriptionProps({
        stackMode: recipeStateType.readOnly,
        recipeDescription: 'A tasty recipe',
        setRecipeDescription: mockSetDescription,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.rootText.style).toBe('paragraph');
      expect(result.rootText.value).toBe('A tasty recipe');
      expect(result.addOrEditProps).toBeUndefined();
    });

    test('returns add editType for addOCR mode with empty description', () => {
      const result = buildRecipeDescriptionProps({
        stackMode: recipeStateType.addOCR,
        recipeDescription: '',
        setRecipeDescription: mockSetDescription,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.addOrEditProps?.editType).toBe('add');
    });

    test('openModal callback in addOCR add mode calls openModalForField with description', () => {
      const result = buildRecipeDescriptionProps({
        stackMode: recipeStateType.addOCR,
        recipeDescription: '',
        setRecipeDescription: mockSetDescription,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      if (result.addOrEditProps?.editType === 'add') {
        result.addOrEditProps.openModal();
        expect(mockOpenModal).toHaveBeenCalled();
      }
    });

    test('returns add editType for addOCR mode with whitespace description', () => {
      const result = buildRecipeDescriptionProps({
        stackMode: recipeStateType.addOCR,
        recipeDescription: '   ',
        setRecipeDescription: mockSetDescription,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.addOrEditProps?.editType).toBe('add');
    });

    test('returns editable editType for addOCR mode with existing description', () => {
      const result = buildRecipeDescriptionProps({
        stackMode: recipeStateType.addOCR,
        recipeDescription: 'Some description',
        setRecipeDescription: mockSetDescription,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.addOrEditProps?.editType).toBe('editable');
    });

    test('returns editable editType for edit mode', () => {
      const result = buildRecipeDescriptionProps({
        stackMode: recipeStateType.edit,
        recipeDescription: 'Description',
        setRecipeDescription: mockSetDescription,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.addOrEditProps?.editType).toBe('editable');
    });

    test('returns editable editType for addManual mode', () => {
      const result = buildRecipeDescriptionProps({
        stackMode: recipeStateType.addManual,
        recipeDescription: 'Description',
        setRecipeDescription: mockSetDescription,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.addOrEditProps?.editType).toBe('editable');
    });

    test('returns editable editType for addScrape mode', () => {
      const result = buildRecipeDescriptionProps({
        stackMode: recipeStateType.addScrape,
        recipeDescription: 'Scraped description',
        setRecipeDescription: mockSetDescription,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.addOrEditProps?.editType).toBe('editable');
    });
  });

  describe('buildRecipeTagsProps', () => {
    const mockAddTag = jest.fn();
    const mockRemoveTag = jest.fn();
    const mockOpenModal = jest.fn();
    const mockTags = [{ id: 1, name: 'Italian' }];

    test('returns readOnly type for readOnly mode', () => {
      const result = buildRecipeTagsProps({
        stackMode: recipeStateType.readOnly,
        recipeTags: mockTags,
        randomTags: ['Lunch'],
        addTag: mockAddTag,
        removeTag: mockRemoveTag,
        openModalForField: mockOpenModal,
      });
      expect(result.type).toBe('readOnly');
    });

    test('returns addOrEdit type with edit for edit mode', () => {
      const result = buildRecipeTagsProps({
        stackMode: recipeStateType.edit,
        recipeTags: mockTags,
        randomTags: ['Lunch'],
        addTag: mockAddTag,
        removeTag: mockRemoveTag,
        openModalForField: mockOpenModal,
      });
      expect(result.type).toBe('addOrEdit');
      if (result.type === 'addOrEdit') {
        expect(result.editType).toBe('edit');
      }
    });

    test('returns addOrEdit type with add for addOCR mode', () => {
      const result = buildRecipeTagsProps({
        stackMode: recipeStateType.addOCR,
        recipeTags: mockTags,
        randomTags: ['Lunch'],
        addTag: mockAddTag,
        removeTag: mockRemoveTag,
        openModalForField: mockOpenModal,
      });
      expect(result.type).toBe('addOrEdit');
      if (result.type === 'addOrEdit' && result.editType === 'add') {
        expect(result.openModal).toBeDefined();
      }
    });

    test('openModal callback in addOCR mode calls openModalForField with tags', () => {
      const result = buildRecipeTagsProps({
        stackMode: recipeStateType.addOCR,
        recipeTags: mockTags,
        randomTags: ['Lunch'],
        addTag: mockAddTag,
        removeTag: mockRemoveTag,
        openModalForField: mockOpenModal,
      });
      if (result.type === 'addOrEdit' && result.editType === 'add' && result.openModal) {
        result.openModal();
        expect(mockOpenModal).toHaveBeenCalled();
      }
    });

    test('returns addOrEdit type with edit for addManual mode', () => {
      const result = buildRecipeTagsProps({
        stackMode: recipeStateType.addManual,
        recipeTags: mockTags,
        randomTags: ['Lunch'],
        addTag: mockAddTag,
        removeTag: mockRemoveTag,
        openModalForField: mockOpenModal,
      });
      expect(result.type).toBe('addOrEdit');
      if (result.type === 'addOrEdit') {
        expect(result.editType).toBe('edit');
      }
    });

    test('passes hideDropdown to tags props', () => {
      const result = buildRecipeTagsProps({
        stackMode: recipeStateType.edit,
        recipeTags: mockTags,
        randomTags: ['Lunch'],
        addTag: mockAddTag,
        removeTag: mockRemoveTag,
        openModalForField: mockOpenModal,
        hideDropdown: true,
      });
      if (result.type === 'addOrEdit') {
        expect(result.hideDropdown).toBe(true);
      }
    });
  });

  describe('buildRecipePersonsProps', () => {
    const mockT = (key: string) => key;
    const mockSetPersons = jest.fn();
    const mockOpenModal = jest.fn();

    test('returns read type for readOnly mode', () => {
      const result = buildRecipePersonsProps({
        stackMode: recipeStateType.readOnly,
        recipePersons: 4,
        setRecipePersons: mockSetPersons,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.numberProps.editType).toBe('read');
    });

    test('returns editable type for edit mode', () => {
      const result = buildRecipePersonsProps({
        stackMode: recipeStateType.edit,
        recipePersons: 4,
        setRecipePersons: mockSetPersons,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.numberProps.editType).toBe('editable');
    });

    test('returns editable type for addOCR mode', () => {
      const result = buildRecipePersonsProps({
        stackMode: recipeStateType.addOCR,
        recipePersons: defaultValueNumber,
        setRecipePersons: mockSetPersons,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.numberProps.editType).toBe('add');
    });

    test('returns editable type for addOCR mode with existing value', () => {
      const result = buildRecipePersonsProps({
        stackMode: recipeStateType.addOCR,
        recipePersons: 4,
        setRecipePersons: mockSetPersons,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.numberProps.editType).toBe('editable');
    });

    test('returns editable type for addManual mode', () => {
      const result = buildRecipePersonsProps({
        stackMode: recipeStateType.addManual,
        recipePersons: 4,
        setRecipePersons: mockSetPersons,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.numberProps.editType).toBe('editable');
    });

    test('returns editable type for addScrape mode', () => {
      const result = buildRecipePersonsProps({
        stackMode: recipeStateType.addScrape,
        recipePersons: 2,
        setRecipePersons: mockSetPersons,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.numberProps.editType).toBe('editable');
    });

    test('addOCR add mode openModal invokes openModalForField for persons', () => {
      const result = buildRecipePersonsProps({
        stackMode: recipeStateType.addOCR,
        recipePersons: defaultValueNumber,
        setRecipePersons: mockSetPersons,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      if (result.numberProps.editType === 'add') {
        result.numberProps.openModal();
        expect(mockOpenModal).toHaveBeenCalledWith('PERSONS');
      }
    });

    test('addOCR add mode manuallyFill calls setRecipePersons with 0', () => {
      const result = buildRecipePersonsProps({
        stackMode: recipeStateType.addOCR,
        recipePersons: defaultValueNumber,
        setRecipePersons: mockSetPersons,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      if (result.numberProps.editType === 'add') {
        result.numberProps.manuallyFill();
        expect(mockSetPersons).toHaveBeenCalledWith(0);
      }
    });
  });

  describe('buildRecipeTimeProps', () => {
    const mockT = (key: string) => key;
    const mockSetTime = jest.fn();
    const mockOpenModal = jest.fn();

    test('returns read editType for readOnly mode', () => {
      const result = buildRecipeTimeProps({
        stackMode: recipeStateType.readOnly,
        recipeTime: 30,
        setRecipeTime: mockSetTime,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.numberProps.editType).toBe('read');
    });

    test('returns add editType for addOCR mode with default value', () => {
      const result = buildRecipeTimeProps({
        stackMode: recipeStateType.addOCR,
        recipeTime: defaultValueNumber,
        setRecipeTime: mockSetTime,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.numberProps.editType).toBe('add');
    });

    test('openModal callback in addOCR mode calls openModalForField with time', () => {
      const result = buildRecipeTimeProps({
        stackMode: recipeStateType.addOCR,
        recipeTime: defaultValueNumber,
        setRecipeTime: mockSetTime,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      if (result.numberProps.editType === 'add') {
        result.numberProps.openModal();
        expect(mockOpenModal).toHaveBeenCalled();
      }
    });

    test('manuallyFill callback in addOCR mode calls setRecipeTime with 0', () => {
      const result = buildRecipeTimeProps({
        stackMode: recipeStateType.addOCR,
        recipeTime: defaultValueNumber,
        setRecipeTime: mockSetTime,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      if (result.numberProps.editType === 'add') {
        result.numberProps.manuallyFill();
        expect(mockSetTime).toHaveBeenCalledWith(0);
      }
    });

    test('returns editable editType for addOCR mode with existing value', () => {
      const result = buildRecipeTimeProps({
        stackMode: recipeStateType.addOCR,
        recipeTime: 30,
        setRecipeTime: mockSetTime,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.numberProps.editType).toBe('editable');
    });

    test('returns editable editType for edit mode', () => {
      const result = buildRecipeTimeProps({
        stackMode: recipeStateType.edit,
        recipeTime: 45,
        setRecipeTime: mockSetTime,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.numberProps.editType).toBe('editable');
    });

    test('returns editable editType for addManual mode', () => {
      const result = buildRecipeTimeProps({
        stackMode: recipeStateType.addManual,
        recipeTime: 20,
        setRecipeTime: mockSetTime,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.numberProps.editType).toBe('editable');
    });

    test('returns editable editType for addScrape mode', () => {
      const result = buildRecipeTimeProps({
        stackMode: recipeStateType.addScrape,
        recipeTime: 15,
        setRecipeTime: mockSetTime,
        openModalForField: mockOpenModal,
        t: mockT,
      });
      expect(result.numberProps.editType).toBe('editable');
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
      const result = buildRecipeNutritionProps({
        stackMode: recipeStateType.readOnly,
        recipeNutrition: mockNutrition,
        setRecipeNutrition: mockSetNutrition,
        openModalForField: mockOpenModal,
        parentTestId: 'Recipe',
      });
      expect(result.mode).toBe(recipeStateType.readOnly);
    });

    test('returns edit mode with change handler for edit state', () => {
      const result = buildRecipeNutritionProps({
        stackMode: recipeStateType.edit,
        recipeNutrition: mockNutrition,
        setRecipeNutrition: mockSetNutrition,
        openModalForField: mockOpenModal,
        parentTestId: 'Recipe',
      });
      expect(result.mode).toBe(recipeStateType.edit);
      expect(result.onNutritionChange).toBe(mockSetNutrition);
    });

    test('returns addOCR mode with openModal for addOCR state', () => {
      const result = buildRecipeNutritionProps({
        stackMode: recipeStateType.addOCR,
        recipeNutrition: undefined,
        setRecipeNutrition: mockSetNutrition,
        openModalForField: mockOpenModal,
        parentTestId: 'Recipe',
      });
      expect(result.mode).toBe(recipeStateType.addOCR);
      expect(result.openModal).toBeDefined();
    });

    test('openModal callback in addOCR mode calls openModalForField with nutrition', () => {
      const result = buildRecipeNutritionProps({
        stackMode: recipeStateType.addOCR,
        recipeNutrition: undefined,
        setRecipeNutrition: mockSetNutrition,
        openModalForField: mockOpenModal,
        parentTestId: 'Recipe',
      });
      if (result.openModal) {
        result.openModal();
        expect(mockOpenModal).toHaveBeenCalled();
      }
    });

    test('returns addManual mode with change handler for addManual state', () => {
      const result = buildRecipeNutritionProps({
        stackMode: recipeStateType.addManual,
        recipeNutrition: mockNutrition,
        setRecipeNutrition: mockSetNutrition,
        openModalForField: mockOpenModal,
        parentTestId: 'Recipe',
      });
      expect(result.mode).toBe(recipeStateType.addManual);
      expect(result.onNutritionChange).toBe(mockSetNutrition);
    });

    test('returns addScrape mode with change handler for addScrape state', () => {
      const result = buildRecipeNutritionProps({
        stackMode: recipeStateType.addScrape,
        recipeNutrition: mockNutrition,
        setRecipeNutrition: mockSetNutrition,
        openModalForField: mockOpenModal,
        parentTestId: 'Recipe',
      });
      expect(result.mode).toBe(recipeStateType.addScrape);
      expect(result.onNutritionChange).toBe(mockSetNutrition);
    });

    test('passes parentTestId to props', () => {
      const result = buildRecipeNutritionProps({
        stackMode: recipeStateType.readOnly,
        recipeNutrition: undefined,
        setRecipeNutrition: mockSetNutrition,
        openModalForField: mockOpenModal,
        parentTestId: 'MyTestId',
      });
      expect(result.parentTestId).toBe('MyTestId');
    });
  });

  describe('hasScrapedDataFromProps', () => {
    test('returns true for addFromScrape mode', () => {
      const props: RecipePropType = {
        mode: 'addFromScrape',
        scrapedData: {},
        sourceUrl: 'https://example.com',
      };
      expect(hasScrapedDataFromProps(props)).toBe(true);
    });

    test('returns false for readOnly mode', () => {
      const mockRecipe = {
        id: 1,
        image_Source: '',
        title: '',
        description: '',
        tags: [],
        persons: 4,
        ingredients: [],
        season: [],
        preparation: [],
        time: 30,
      };
      const props: RecipePropType = { mode: 'readOnly', recipe: mockRecipe };
      expect(hasScrapedDataFromProps(props)).toBe(false);
    });

    test('returns false for addManually mode', () => {
      const props: RecipePropType = { mode: 'addManually' };
      expect(hasScrapedDataFromProps(props)).toBe(false);
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

    test('has camera icon for addScrape mode', () => {
      expect(IMAGE_BUTTON_CONFIG[recipeStateType.addScrape]).toBe(Icons.cameraIcon);
    });
  });

  describe('buildRecipeSourceUrlProps', () => {
    const mockOnCopied = jest.fn();
    const testUrl = 'https://www.hellofresh.fr/recipes/test-recipe';

    test('returns undefined for edit mode', () => {
      const result = buildRecipeSourceUrlProps({
        stackMode: recipeStateType.edit,
        sourceUrl: testUrl,
        onCopied: mockOnCopied,
      });
      expect(result).toBeUndefined();
    });

    test('returns undefined for addManual mode', () => {
      const result = buildRecipeSourceUrlProps({
        stackMode: recipeStateType.addManual,
        sourceUrl: testUrl,
        onCopied: mockOnCopied,
      });
      expect(result).toBeUndefined();
    });

    test('returns undefined for addOCR mode', () => {
      const result = buildRecipeSourceUrlProps({
        stackMode: recipeStateType.addOCR,
        sourceUrl: testUrl,
        onCopied: mockOnCopied,
      });
      expect(result).toBeUndefined();
    });

    test('returns undefined for addScrape mode', () => {
      const result = buildRecipeSourceUrlProps({
        stackMode: recipeStateType.addScrape,
        sourceUrl: testUrl,
        onCopied: mockOnCopied,
      });
      expect(result).toBeUndefined();
    });

    test('returns undefined when sourceUrl is undefined', () => {
      const result = buildRecipeSourceUrlProps({
        stackMode: recipeStateType.readOnly,
        sourceUrl: undefined,
        onCopied: mockOnCopied,
      });
      expect(result).toBeUndefined();
    });

    test('returns undefined when sourceUrl is empty string', () => {
      const result = buildRecipeSourceUrlProps({
        stackMode: recipeStateType.readOnly,
        sourceUrl: '',
        onCopied: mockOnCopied,
      });
      expect(result).toBeUndefined();
    });

    test('returns undefined when sourceUrl is whitespace only', () => {
      const result = buildRecipeSourceUrlProps({
        stackMode: recipeStateType.readOnly,
        sourceUrl: '   ',
        onCopied: mockOnCopied,
      });
      expect(result).toBeUndefined();
    });

    test('returns correct props for readOnly mode with valid sourceUrl', () => {
      const result = buildRecipeSourceUrlProps({
        stackMode: recipeStateType.readOnly,
        sourceUrl: testUrl,
        onCopied: mockOnCopied,
      });
      expect(result).toEqual({
        sourceUrl: testUrl,
        onCopied: mockOnCopied,
      });
    });
  });
});
