/**
 * RecipeFormHelpers - Pure utility functions and prop builders for the Recipe screen
 *
 * This module provides stateless helper functions for recipe form management, including:
 * - Mode conversion between navigation props and internal state types
 * - Recipe data validation for save operations
 * - Prop generation for recipe UI components based on current mode
 * - Recipe scaling for database normalization
 *
 * All functions are pure (no side effects) and can be easily unit tested.
 *
 * @module RecipeFormHelpers
 */

import { Dispatch, SetStateAction } from 'react';
import { recipeStateType } from '@customTypes/ScreenTypes';
import {
  extractTagsName,
  FormIngredientElement,
  ingredientTableElement,
  nutritionTableElement,
  preparationStepElement,
  recipeColumnsNames,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import { defaultValueNumber } from '@utils/Constants';
import { scaleQuantityForPersons } from '@utils/Quantity';
import { dictionaryIcons, Icons } from '@assets/Icons';
import { RecipeImageProps } from '@components/organisms/RecipeImage';
import { RecipeTextProps, TextProp } from '@components/organisms/RecipeText';
import { RecipeTagProps } from '@components/organisms/RecipeTags';
import { RecipeNumberProps } from '@components/organisms/RecipeNumber';
import { RecipeIngredientsProps } from '@components/organisms/RecipeIngredients';
import { RecipePreparationProps } from '@components/organisms/RecipePreparation';
import { RecipeNutritionProps } from '@components/organisms/RecipeNutrition';

export type {
  RecipeMode,
  BaseRecipeProp,
  ReadRecipeProp,
  EditRecipeProp,
  AddManuallyProp,
  AddFromPicProp,
  RecipePropType,
} from '@customTypes/RecipeNavigationTypes';

/**
 * Generic configuration type mapping all recipe states to a value type
 *
 * @template T - The type of value stored for each mode
 */
export type ModeConfig<T> = Record<recipeStateType, T>;

/**
 * Configuration mapping recipe modes to image button icons
 *
 * - readOnly: No button (undefined)
 * - edit/addManual: Camera icon for taking/selecting photos
 * - addOCR: Scan icon for OCR extraction
 */
export const IMAGE_BUTTON_CONFIG: ModeConfig<dictionaryIcons | undefined> = {
  [recipeStateType.readOnly]: undefined,
  [recipeStateType.edit]: Icons.cameraIcon,
  [recipeStateType.addManual]: Icons.cameraIcon,
  [recipeStateType.addOCR]: Icons.scanImageIcon,
};

/**
 * Configuration mapping recipe modes to title text styles
 *
 * - readOnly: Headline style for prominent display
 * - edit/add modes: Title style with label prefix
 */
export const TITLE_STYLE_CONFIG: ModeConfig<'headline' | 'title'> = {
  [recipeStateType.readOnly]: 'headline',
  [recipeStateType.edit]: 'title',
  [recipeStateType.addManual]: 'title',
  [recipeStateType.addOCR]: 'title',
};

/**
 * Configuration mapping recipe modes to ingredient component modes
 *
 * - readOnly: Display-only mode
 * - edit/addManual: Editable mode with inline editing
 * - addOCR: Add mode with OCR button option
 */
export const INGREDIENT_MODE_CONFIG: ModeConfig<'readOnly' | 'editable' | 'add'> = {
  [recipeStateType.readOnly]: 'readOnly',
  [recipeStateType.edit]: 'editable',
  [recipeStateType.addManual]: 'editable',
  [recipeStateType.addOCR]: 'add',
};

/**
 * Configuration mapping recipe modes to preparation component modes
 *
 * - readOnly: Display-only mode
 * - edit/addManual: Editable mode with step editing
 * - addOCR: Add mode with OCR button option
 */
export const PREPARATION_MODE_CONFIG: ModeConfig<'readOnly' | 'editable' | 'add'> = {
  [recipeStateType.readOnly]: 'readOnly',
  [recipeStateType.edit]: 'editable',
  [recipeStateType.addManual]: 'editable',
  [recipeStateType.addOCR]: 'add',
};

/**
 * Converts navigation prop mode string to internal recipe state type
 *
 * @param mode - The mode string from navigation parameters
 * @returns The corresponding internal recipeStateType enum value
 */
export function convertModeFromProps(mode: RecipePropType['mode']): recipeStateType {
  switch (mode) {
    case 'readOnly':
      return recipeStateType.readOnly;
    case 'edit':
      return recipeStateType.edit;
    case 'addManually':
      return recipeStateType.addManual;
    case 'addFromPic':
      return recipeStateType.addOCR;
  }
}

/**
 * Type guard to check if navigation props include an existing recipe
 *
 * Used to safely access recipe data when in readOnly or edit mode.
 *
 * @param props - The navigation parameters
 * @returns True if props contain a recipe (readOnly or edit mode)
 */
export function hasRecipeFromProps(
  props: RecipePropType
): props is { mode: 'readOnly' | 'edit'; recipe: recipeTableElement } {
  return props.mode === 'readOnly' || props.mode === 'edit';
}

/**
 * Data required for recipe validation
 */
export interface RecipeValidationData {
  recipeImage: string;
  recipeTitle: string;
  recipeIngredients: (ingredientTableElement | FormIngredientElement)[];
  recipePreparation: preparationStepElement[];
  recipePersons: number;
  recipeTime: number;
  recipeNutrition: nutritionTableElement | undefined;
}

/**
 * Validates recipe data before saving to database
 *
 * Checks all required fields and returns a list of missing/invalid elements.
 * Used before add/edit operations to ensure data completeness.
 *
 * @param data - Recipe form data to validate
 * @param t - Translation function for error messages
 * @returns Array of translated error messages for missing/invalid fields
 */
export function validateRecipeData(
  data: RecipeValidationData,
  t: (key: string) => string
): string[] {
  const missingElem: string[] = [];
  const translatedMissingElemPrefix = 'alerts.missingElements.';

  if (!data.recipeImage || data.recipeImage.trim().length === 0) {
    missingElem.push(t(translatedMissingElemPrefix + 'image'));
  }
  if (!data.recipeTitle || data.recipeTitle.trim().length === 0) {
    missingElem.push(t(translatedMissingElemPrefix + 'titleRecipe'));
  }
  if (data.recipeIngredients.length === 0) {
    missingElem.push(t(translatedMissingElemPrefix + 'titleIngredients'));
  } else {
    const allIngredientsHaveNames = data.recipeIngredients.every(
      ingredient => ingredient.name && ingredient.name.trim().length > 0
    );
    if (!allIngredientsHaveNames) {
      missingElem.push(t(translatedMissingElemPrefix + 'ingredientNames'));
    }
    const allIngredientsHaveQuantities = data.recipeIngredients.every(
      ingredient => ingredient.quantity && ingredient.quantity.trim().length > 0
    );
    if (!allIngredientsHaveQuantities) {
      missingElem.push(t(translatedMissingElemPrefix + 'ingredientQuantities'));
    }
    const areKnownInDatabase = data.recipeIngredients.every(
      ingredient => ingredient.type !== undefined && ingredient.season !== undefined
    );
    if (!areKnownInDatabase) {
      missingElem.push(t(translatedMissingElemPrefix + 'ingredientInDatabase'));
    }
  }
  if (data.recipePreparation.length === 0) {
    missingElem.push(t(translatedMissingElemPrefix + 'titlePreparation'));
  }
  if (data.recipePersons === defaultValueNumber) {
    missingElem.push(t(translatedMissingElemPrefix + 'titlePersons'));
  }
  if (data.recipeTime === defaultValueNumber) {
    missingElem.push(t(translatedMissingElemPrefix + 'titleTime'));
  }
  if (
    data.recipeNutrition &&
    Object.values(data.recipeNutrition).some(value => value === defaultValueNumber)
  ) {
    missingElem.push(t(translatedMissingElemPrefix + 'nutrition'));
  }

  return missingElem;
}

/**
 * Scales recipe ingredients to default person count for database storage
 *
 * Normalizes recipes to a standard serving size before saving to ensure
 * consistent storage. Scaling is reversed when loading for display.
 *
 * @param recipe - The recipe to scale
 * @param defaultPersons - The default person count for normalization
 * @returns Recipe with scaled ingredient quantities and normalized persons
 */
export function scaleRecipeForSave(
  recipe: recipeTableElement,
  defaultPersons: number
): recipeTableElement {
  if (recipe.persons === defaultPersons || recipe.persons <= 0) {
    return recipe;
  }

  return {
    ...recipe,
    ingredients: recipe.ingredients.map(ingredient => ({
      ...ingredient,
      quantity: ingredient.quantity
        ? scaleQuantityForPersons(ingredient.quantity, recipe.persons, defaultPersons)
        : ingredient.quantity,
    })),
    persons: defaultPersons,
  };
}

/**
 * Builds props for RecipeImage component based on current mode
 *
 * @param stackMode - Current recipe screen mode
 * @param recipeImage - Current image URI
 * @param openModalForField - Callback to open OCR modal
 * @returns Props object for RecipeImage component
 */
export function buildRecipeImageProps(
  stackMode: recipeStateType,
  recipeImage: string,
  openModalForField: (field: recipeColumnsNames) => void
): RecipeImageProps {
  return {
    imgUri: recipeImage,
    openModal: openModalForField,
    buttonIcon: IMAGE_BUTTON_CONFIG[stackMode],
  };
}

/**
 * Builds props for RecipeText component displaying the title
 *
 * Handles mode-specific behavior:
 * - readOnly: Displays title as headline
 * - edit/addManual: Editable text input
 * - addOCR with empty title: Shows OCR button
 *
 * @param stackMode - Current recipe screen mode
 * @param recipeTitle - Current title value
 * @param setRecipeTitle - Setter function for title
 * @param openModalForField - Callback to open OCR modal
 * @param t - Translation function
 * @returns Props object for RecipeText component
 */
export function buildRecipeTitleProps(
  stackMode: recipeStateType,
  recipeTitle: string,
  setRecipeTitle: Dispatch<SetStateAction<string>>,
  openModalForField: (field: recipeColumnsNames) => void,
  t: (key: string) => string
): RecipeTextProps {
  const titleTestID = 'RecipeTitle';
  const titleRootText: TextProp = {
    style: TITLE_STYLE_CONFIG[stackMode],
    value: stackMode === recipeStateType.readOnly ? recipeTitle : t('title') + ':',
  };

  if (stackMode === recipeStateType.readOnly) {
    return {
      testID: titleTestID,
      rootText: titleRootText,
    };
  }

  if (stackMode === recipeStateType.addOCR && (!recipeTitle || recipeTitle.trim().length === 0)) {
    return {
      testID: titleTestID,
      rootText: titleRootText,
      addOrEditProps: {
        editType: 'add',
        testID: titleTestID,
        openModal: () => openModalForField(recipeColumnsNames.title),
      },
    };
  }

  return {
    testID: titleTestID,
    rootText: titleRootText,
    addOrEditProps: {
      editType: 'editable',
      testID: titleTestID,
      textEditable: recipeTitle,
      setTextToEdit: setRecipeTitle,
    },
  };
}

/**
 * Builds props for RecipeText component displaying the description
 *
 * Handles mode-specific behavior:
 * - readOnly: Displays description as paragraph
 * - edit/addManual: Editable text input
 * - addOCR with empty description: Shows OCR button
 *
 * @param stackMode - Current recipe screen mode
 * @param recipeDescription - Current description value
 * @param setRecipeDescription - Setter function for description
 * @param openModalForField - Callback to open OCR modal
 * @param t - Translation function
 * @returns Props object for RecipeText component
 */
export function buildRecipeDescriptionProps(
  stackMode: recipeStateType,
  recipeDescription: string,
  setRecipeDescription: Dispatch<SetStateAction<string>>,
  openModalForField: (field: recipeColumnsNames) => void,
  t: (key: string) => string
): RecipeTextProps {
  const descriptionTestID = 'RecipeDescription';
  const descriptionRootText: TextProp = {
    style: stackMode === recipeStateType.readOnly ? 'paragraph' : 'title',
    value: stackMode === recipeStateType.readOnly ? recipeDescription : t('description') + ':',
  };

  if (stackMode === recipeStateType.readOnly) {
    return { rootText: descriptionRootText, testID: descriptionTestID };
  }

  if (
    stackMode === recipeStateType.addOCR &&
    (!recipeDescription || recipeDescription.trim().length === 0)
  ) {
    return {
      rootText: descriptionRootText,
      testID: descriptionTestID,
      addOrEditProps: {
        editType: 'add',
        testID: descriptionTestID,
        openModal: () => openModalForField(recipeColumnsNames.description),
      },
    };
  }

  return {
    rootText: descriptionRootText,
    testID: descriptionTestID,
    addOrEditProps: {
      editType: 'editable',
      testID: descriptionTestID,
      textEditable: recipeDescription,
      setTextToEdit: setRecipeDescription,
    },
  };
}

/**
 * Builds props for RecipeTags component based on current mode
 *
 * Handles mode-specific behavior:
 * - readOnly: Displays tags as read-only chips
 * - edit/addManual: Editable tags with add/remove functionality
 * - addOCR: Add mode with OCR button option
 *
 * @param stackMode - Current recipe screen mode
 * @param recipeTags - Current tags array
 * @param randomTags - Suggested tags for display
 * @param addTag - Callback to add a new tag
 * @param removeTag - Callback to remove a tag by name
 * @param openModalForField - Callback to open OCR modal
 * @returns Props object for RecipeTags component
 */
export function buildRecipeTagsProps(
  stackMode: recipeStateType,
  recipeTags: tagTableElement[],
  randomTags: string[],
  addTag: (newTag: string) => void,
  removeTag: (tagName: string) => void,
  openModalForField: (field: recipeColumnsNames) => void
): RecipeTagProps {
  const tagsExtracted = extractTagsName(recipeTags);
  const editProps: RecipeTagProps = {
    tagsList: tagsExtracted,
    type: 'addOrEdit',
    editType: 'edit',
    randomTags: randomTags.join(', '),
    addNewTag: addTag,
    removeTag: removeTag,
  };

  if (stackMode === recipeStateType.readOnly) {
    return { type: 'readOnly', tagsList: tagsExtracted };
  }

  if (stackMode === recipeStateType.addOCR) {
    return {
      ...editProps,
      editType: 'add',
      openModal: () => openModalForField(recipeColumnsNames.tags),
    };
  }

  return editProps;
}

/**
 * Builds props for RecipeNumber component displaying servings
 *
 * Handles mode-specific behavior:
 * - readOnly: Displays formatted person count
 * - edit/addManual: Editable number input
 * - addOCR with default value: Shows OCR button with manual fill option
 *
 * @param stackMode - Current recipe screen mode
 * @param recipePersons - Current person count
 * @param setRecipePersons - Setter function for person count
 * @param openModalForField - Callback to open OCR modal
 * @param t - Translation function
 * @returns Props object for RecipeNumber component
 */
export function buildRecipePersonsProps(
  stackMode: recipeStateType,
  recipePersons: number,
  setRecipePersons: Dispatch<SetStateAction<number>>,
  openModalForField: (field: recipeColumnsNames) => void,
  t: (key: string) => string
): RecipeNumberProps {
  const personTestID = 'RecipePersons';

  if (stackMode === recipeStateType.readOnly) {
    return {
      testID: personTestID,
      numberProps: {
        editType: 'read',
        text:
          t('ingredientReadOnlyBeforePerson') + recipePersons + t('ingredientReadOnlyAfterPerson'),
      },
    };
  }

  if (stackMode === recipeStateType.addOCR && recipePersons === defaultValueNumber) {
    return {
      testID: personTestID,
      numberProps: {
        editType: 'add',
        testID: personTestID,
        prefixText: t('personPrefixOCR'),
        openModal: () => openModalForField(recipeColumnsNames.persons),
        manuallyFill: () => setRecipePersons(0),
      },
    };
  }

  return {
    testID: personTestID,
    numberProps: {
      editType: 'editable',
      testID: personTestID,
      textEditable: recipePersons,
      prefixText: t('personPrefixEdit'),
      suffixText: t('personSuffixEdit'),
      setTextToEdit: setRecipePersons,
    },
  };
}

/**
 * Builds props for RecipeNumber component displaying preparation time
 *
 * Handles mode-specific behavior:
 * - readOnly: Displays formatted time in minutes
 * - edit/addManual: Editable number input
 * - addOCR with default value: Shows OCR button with manual fill option
 *
 * @param stackMode - Current recipe screen mode
 * @param recipeTime - Current time in minutes
 * @param setRecipeTime - Setter function for time
 * @param openModalForField - Callback to open OCR modal
 * @param t - Translation function
 * @returns Props object for RecipeNumber component
 */
export function buildRecipeTimeProps(
  stackMode: recipeStateType,
  recipeTime: number,
  setRecipeTime: Dispatch<SetStateAction<number>>,
  openModalForField: (field: recipeColumnsNames) => void,
  t: (key: string) => string
): RecipeNumberProps {
  const timeTestID = 'RecipeTime';

  if (stackMode === recipeStateType.readOnly) {
    return {
      testID: timeTestID,
      numberProps: {
        editType: 'read',
        text: t('timeReadOnlyBeforePerson') + recipeTime + t('timeReadOnlyAfterPerson'),
      },
    };
  }

  if (stackMode === recipeStateType.addOCR && recipeTime === defaultValueNumber) {
    return {
      testID: timeTestID,
      numberProps: {
        editType: 'add',
        testID: timeTestID,
        prefixText: t('timePrefixOCR'),
        openModal: () => openModalForField(recipeColumnsNames.time),
        manuallyFill: () => setRecipeTime(0),
      },
    };
  }

  return {
    testID: timeTestID,
    numberProps: {
      editType: 'editable',
      testID: timeTestID,
      textEditable: recipeTime,
      prefixText: t('timePrefixEdit'),
      suffixText: t('timeSuffixEdit'),
      setTextToEdit: setRecipeTime,
    },
  };
}

/**
 * Builds props for RecipeIngredients component based on current mode
 *
 * Handles mode-specific behavior:
 * - readOnly: Displays ingredients as read-only list
 * - edit/addManual: Editable ingredients with inline editing
 * - addOCR: Add mode with OCR button option
 *
 * @param stackMode - Current recipe screen mode
 * @param recipeIngredients - Current ingredients array
 * @param editIngredients - Callback to edit an ingredient
 * @param addNewIngredient - Callback to add a new ingredient
 * @param openModalForField - Callback to open OCR modal
 * @param t - Translation function
 * @returns Props object for RecipeIngredients component
 */
export function buildRecipeIngredientsProps(
  stackMode: recipeStateType,
  recipeIngredients: (ingredientTableElement | FormIngredientElement)[],
  editIngredients: (oldIngredientId: number, newIngredient: string) => void,
  addNewIngredient: () => void,
  openModalForField: (field: recipeColumnsNames) => void,
  t: (key: string) => string
): RecipeIngredientsProps {
  const ingredientTestID = 'RecipeIngredients';
  const ingredientPrefixText = t('ingredients') + ': ';

  if (stackMode === recipeStateType.readOnly) {
    return {
      testID: ingredientTestID,
      ingredients: recipeIngredients as ingredientTableElement[],
      mode: 'readOnly',
    };
  }

  const baseEditProps = {
    testID: ingredientTestID,
    ingredients: recipeIngredients as ingredientTableElement[],
    prefixText: ingredientPrefixText,
    columnTitles: {
      column1: t('quantity'),
      column2: t('unit'),
      column3: t('ingredientName'),
    },
    onIngredientChange: editIngredients,
    onAddIngredient: addNewIngredient,
  };

  if (stackMode === recipeStateType.addOCR) {
    return {
      mode: 'add',
      openModal: () => openModalForField(recipeColumnsNames.ingredients),
      ...baseEditProps,
    };
  }

  return {
    mode: 'editable',
    ...baseEditProps,
  };
}

/**
 * Builds props for RecipePreparation component based on current mode
 *
 * Handles mode-specific behavior:
 * - readOnly: Displays preparation steps as read-only list
 * - edit/addManual: Editable steps with inline editing
 * - addOCR with no steps: Shows OCR button option
 *
 * @param stackMode - Current recipe screen mode
 * @param recipePreparation - Current preparation steps array
 * @param editPreparationTitle - Callback to edit step title
 * @param editPreparationDescription - Callback to edit step description
 * @param addNewPreparationStep - Callback to add a new step
 * @param openModalForField - Callback to open OCR modal
 * @param t - Translation function
 * @returns Props object for RecipePreparation component
 */
export function buildRecipePreparationProps(
  stackMode: recipeStateType,
  recipePreparation: preparationStepElement[],
  editPreparationTitle: (stepIndex: number, newTitle: string) => void,
  editPreparationDescription: (stepIndex: number, newDescription: string) => void,
  addNewPreparationStep: () => void,
  openModalForField: (field: recipeColumnsNames) => void,
  t: (key: string) => string
): RecipePreparationProps {
  if (stackMode === recipeStateType.readOnly) {
    return {
      steps: recipePreparation,
      mode: 'readOnly',
    };
  }

  const editableProps = {
    steps: recipePreparation,
    prefixText: t('preparationReadOnly'),
    onTitleChange: editPreparationTitle,
    onDescriptionChange: editPreparationDescription,
    onAddStep: addNewPreparationStep,
  };

  if (stackMode === recipeStateType.addOCR && recipePreparation.length === 0) {
    return {
      ...editableProps,
      mode: 'add',
      openModal: () => openModalForField(recipeColumnsNames.preparation),
    };
  }

  return {
    ...editableProps,
    mode: 'editable',
  };
}

/**
 * Builds props for RecipeNutrition component based on current mode
 *
 * Handles mode-specific behavior:
 * - readOnly: Displays nutrition as read-only
 * - edit/addManual: Editable nutrition fields
 * - addOCR: Add mode with OCR button option
 *
 * @param stackMode - Current recipe screen mode
 * @param recipeNutrition - Current nutrition data (if any)
 * @param setRecipeNutrition - Setter function for nutrition data
 * @param openModalForField - Callback to open OCR modal
 * @param parentTestId - Test ID prefix for component
 * @returns Props object for RecipeNutrition component
 */
export function buildRecipeNutritionProps(
  stackMode: recipeStateType,
  recipeNutrition: nutritionTableElement | undefined,
  setRecipeNutrition: Dispatch<SetStateAction<nutritionTableElement | undefined>>,
  openModalForField: (field: recipeColumnsNames) => void,
  parentTestId: string
): RecipeNutritionProps {
  switch (stackMode) {
    case recipeStateType.readOnly:
      return {
        parentTestId,
        nutrition: recipeNutrition,
        mode: recipeStateType.readOnly,
      };
    case recipeStateType.edit:
      return {
        parentTestId,
        nutrition: recipeNutrition,
        mode: recipeStateType.edit,
        onNutritionChange: setRecipeNutrition,
      };
    case recipeStateType.addManual:
      return {
        parentTestId,
        nutrition: recipeNutrition,
        mode: recipeStateType.addManual,
        onNutritionChange: setRecipeNutrition,
      };
    case recipeStateType.addOCR:
      return {
        parentTestId,
        nutrition: recipeNutrition,
        mode: recipeStateType.addOCR,
        onNutritionChange: setRecipeNutrition,
        openModal: () => openModalForField(recipeColumnsNames.nutrition),
      };
  }
}

/**
 * Returns validation button configuration based on current mode
 *
 * Maps recipe screen mode to appropriate button text and type:
 * - readOnly: "Back" type button
 * - edit: "Save" type button
 * - add modes: "Create" type button
 *
 * @param stackMode - Current recipe screen mode
 * @param t - Translation function
 * @returns Object with translated button text and button type
 */
export function getValidationButtonConfig(
  stackMode: recipeStateType,
  t: (key: string) => string
): { text: string; type: 'readOnly' | 'edit' | 'add' } {
  switch (stackMode) {
    case recipeStateType.readOnly:
      return { text: t('validateReadOnly'), type: 'readOnly' };
    case recipeStateType.edit:
      return { text: t('validateEdit'), type: 'edit' };
    case recipeStateType.addManual:
    case recipeStateType.addOCR:
      return { text: t('validateAdd'), type: 'add' };
  }
}

/**
 * Generates error dialog content for missing recipe fields
 *
 * Creates appropriate error message based on number of missing fields:
 * - Single field: Singular message with field name
 * - Single nutrition field: Special nutrition-specific message
 * - Multiple fields: Plural message with bulleted list
 *
 * @param missingElem - Array of translated missing field names
 * @param t - Translation function
 * @returns Object with error dialog title and formatted content
 */
export function getMissingFieldsErrorContent(
  missingElem: string[],
  t: (key: string) => string
): { title: string; content: string } {
  const translatedMissingElemPrefix = 'alerts.missingElements.';

  if (missingElem.length === 1) {
    const nutritionTranslation = t(translatedMissingElemPrefix + 'nutrition');
    const isNutrition = missingElem[0] === nutritionTranslation;

    return {
      title: t(translatedMissingElemPrefix + 'titleSingular'),
      content: isNutrition
        ? t(translatedMissingElemPrefix + 'messageSingularNutrition')
        : t(translatedMissingElemPrefix + 'messageSingularBeginning') +
          missingElem[0] +
          t(translatedMissingElemPrefix + 'messageSingularEnding'),
    };
  }

  return {
    title: t(translatedMissingElemPrefix + 'titlePlural'),
    content:
      t(translatedMissingElemPrefix + 'messagePlural') +
      missingElem.map(elem => `\n\t- ${elem}`).join(''),
  };
}
