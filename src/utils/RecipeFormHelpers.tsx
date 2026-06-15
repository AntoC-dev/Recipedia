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

import { recipeStateType } from '@customTypes/ScreenTypes';
import {
  extractTagsName,
  nutritionTableElement,
  recipeColumnsNames,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import { defaultValueNumber } from '@utils/Constants';
import { scaleQuantityForPersons } from '@utils/Quantity';
import { dictionaryIcons, Icons } from '@assets/Icons';
import { OcrModalTarget } from '@utils/OCR';
import { RecipeImageProps } from '@components/organisms/RecipeImage';
import { RecipeTextProps, TextProp } from '@components/organisms/RecipeText';
import { RecipeTagProps } from '@components/organisms/RecipeTags';
import { RecipeNumberProps } from '@components/organisms/RecipeNumber';
import { RecipeNutritionProps } from '@components/organisms/RecipeNutrition';
import { RecipeSourceUrlProps } from '@components/molecules/RecipeSourceUrl';

export type {
  RecipeMode,
  BaseRecipeProp,
  ReadRecipeProp,
  EditRecipeProp,
  AddManuallyProp,
  AddFromPicProp,
  AddFromScrapeProp,
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
 * - edit/addManual/addScrape: Camera icon for taking/selecting photos
 * - addOCR: Scan icon for OCR extraction
 */
export const IMAGE_BUTTON_CONFIG: ModeConfig<dictionaryIcons | undefined> = {
  [recipeStateType.readOnly]: undefined,
  [recipeStateType.edit]: Icons.cameraIcon,
  [recipeStateType.addManual]: Icons.cameraIcon,
  [recipeStateType.addOCR]: Icons.scanImageIcon,
  [recipeStateType.addScrape]: Icons.cameraIcon,
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
  [recipeStateType.addScrape]: 'title',
};

/**
 * Configuration mapping recipe modes to ingredient component modes
 *
 * - readOnly: Display-only mode
 * - edit/addManual/addScrape: Editable mode with inline editing
 * - addOCR: Add mode with OCR button option
 */
export const INGREDIENT_MODE_CONFIG: ModeConfig<'readOnly' | 'editable' | 'add'> = {
  [recipeStateType.readOnly]: 'readOnly',
  [recipeStateType.edit]: 'editable',
  [recipeStateType.addManual]: 'editable',
  [recipeStateType.addOCR]: 'add',
  [recipeStateType.addScrape]: 'editable',
};

/**
 * Configuration mapping recipe modes to preparation component modes
 *
 * - readOnly: Display-only mode
 * - edit/addManual/addScrape: Editable mode with step editing
 * - addOCR: Add mode with OCR button option
 */
export const PREPARATION_MODE_CONFIG: ModeConfig<'readOnly' | 'editable' | 'add'> = {
  [recipeStateType.readOnly]: 'readOnly',
  [recipeStateType.edit]: 'editable',
  [recipeStateType.addManual]: 'editable',
  [recipeStateType.addOCR]: 'add',
  [recipeStateType.addScrape]: 'editable',
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
    case 'addFromScrape':
      return recipeStateType.addScrape;
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
 * Type guard to check if navigation props include scraped recipe data
 *
 * Used to safely access scraped data when in addFromScrape mode.
 *
 * @param props - The navigation parameters
 * @returns True if props contain scraped data (addFromScrape mode)
 */
export function hasScrapedDataFromProps(
  props: RecipePropType
): props is { mode: 'addFromScrape'; scrapedData: Partial<recipeTableElement>; sourceUrl: string } {
  return props.mode === 'addFromScrape';
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
 * Returns the serving count a recipe was entered with when saving it scaled its
 * quantities to `defaultPersons`, or `undefined` when no scaling happened.
 *
 * Mirrors the gate in {@link scaleRecipeForSave}: scaling only occurs when the
 * entered serving count is positive and differs from the default. The returned
 * value is the "from" serving count, used to surface a post-save notice telling
 * the user their quantities were normalized to the stored default.
 *
 * @param enteredPersons - The serving count the user entered in the form.
 * @param defaultPersons - The default serving count recipes are normalized to.
 * @returns The entered serving count when scaling occurred, otherwise `undefined`.
 */
export function getServingsScaledFrom(
  enteredPersons: number,
  defaultPersons: number
): number | undefined {
  if (enteredPersons > 0 && enteredPersons !== defaultPersons) {
    return enteredPersons;
  }
  return undefined;
}

/**
 * Builds props for RecipeImage component based on current mode
 *
 * @param stackMode - Current recipe screen mode
 * @param recipeImage - Current image URI
 * @param openModalForField - Callback to open OCR modal
 * @returns Props object for RecipeImage component
 */
/** Fields every recipe-form `build*Props` helper accepts */
interface BaseFieldInput {
  stackMode: recipeStateType;
  openModalForField: (field: OcrModalTarget) => void;
}

/** Adds the translation function — every helper that emits user-facing copy */
interface BaseFieldInputT extends BaseFieldInput {
  t: (key: string) => string;
}

export interface RecipeImagePropsInput extends BaseFieldInput {
  recipeImage: string;
}

export function buildRecipeImageProps({
  stackMode,
  recipeImage,
  openModalForField,
}: RecipeImagePropsInput): RecipeImageProps {
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
 * - addOCR with empty title: Shows OCR button, unless `forceEditable` is set
 *
 * @param stackMode - Current recipe screen mode
 * @param recipeTitle - Current title value
 * @param setRecipeTitle - Setter function for title
 * @param openModalForField - Callback to open OCR modal
 * @param t - Translation function
 * @param forceEditable - Keeps the editable input mounted in addOCR mode even
 *        when the title is empty, so a field that was filled then cleared still
 *        surfaces its inline error instead of reverting to the OCR button.
 * @returns Props object for RecipeText component
 */
export interface RecipeTitlePropsInput extends BaseFieldInputT {
  recipeTitle: string;
  setRecipeTitle: (value: string) => void;
  forceEditable?: boolean;
}

export function buildRecipeTitleProps({
  stackMode,
  recipeTitle,
  setRecipeTitle,
  openModalForField,
  t,
  forceEditable = false,
}: RecipeTitlePropsInput): RecipeTextProps {
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

  if (
    stackMode === recipeStateType.addOCR &&
    !forceEditable &&
    (!recipeTitle || recipeTitle.trim().length === 0)
  ) {
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
export interface RecipeDescriptionPropsInput extends BaseFieldInputT {
  recipeDescription: string;
  setRecipeDescription: (value: string) => void;
}

export function buildRecipeDescriptionProps({
  stackMode,
  recipeDescription,
  setRecipeDescription,
  openModalForField,
  t,
}: RecipeDescriptionPropsInput): RecipeTextProps {
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
export interface RecipeTagsPropsInput extends BaseFieldInput {
  recipeTags: tagTableElement[];
  randomTags: string[];
  addTag: (newTag: string) => void;
  removeTag: (tagName: string) => void;
  hideDropdown?: boolean;
}

export function buildRecipeTagsProps({
  stackMode,
  recipeTags,
  randomTags,
  addTag,
  removeTag,
  openModalForField,
  hideDropdown,
}: RecipeTagsPropsInput): RecipeTagProps {
  const tagsExtracted = extractTagsName(recipeTags);
  const editProps: RecipeTagProps = {
    tagsList: tagsExtracted,
    type: 'addOrEdit',
    editType: 'edit',
    randomTags: randomTags.join(', '),
    addNewTag: addTag,
    removeTag: removeTag,
    hideDropdown,
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
 * - edit/addManual/addOCR: Editable number input (persons is always set manually)
 *
 * @param stackMode - Current recipe screen mode
 * @param recipePersons - Current person count
 * @param setRecipePersons - Setter function for person count
 * @param t - Translation function
 * @returns Props object for RecipeNumber component
 */
export interface RecipePersonsPropsInput extends BaseFieldInputT {
  recipePersons: number;
  setRecipePersons: (value: number) => void;
}

export function buildRecipePersonsProps({
  stackMode,
  recipePersons,
  setRecipePersons,
  openModalForField,
  t,
}: RecipePersonsPropsInput): RecipeNumberProps {
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
export interface RecipeTimePropsInput extends BaseFieldInputT {
  recipeTime: number;
  setRecipeTime: (value: number) => void;
}

export function buildRecipeTimeProps({
  stackMode,
  recipeTime,
  setRecipeTime,
  openModalForField,
  t,
}: RecipeTimePropsInput): RecipeNumberProps {
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
export interface RecipeNutritionPropsInput extends BaseFieldInput {
  recipeNutrition: nutritionTableElement | undefined;
  setRecipeNutrition: (value: nutritionTableElement | undefined) => void;
  parentTestId: string;
}

export function buildRecipeNutritionProps({
  stackMode,
  recipeNutrition,
  setRecipeNutrition,
  openModalForField,
  parentTestId,
}: RecipeNutritionPropsInput): RecipeNutritionProps {
  if (stackMode === recipeStateType.readOnly) {
    return { parentTestId, nutrition: recipeNutrition, mode: stackMode };
  }
  const base = {
    parentTestId,
    nutrition: recipeNutrition,
    mode: stackMode,
    onNutritionChange: setRecipeNutrition,
  };
  return stackMode === recipeStateType.addOCR
    ? { ...base, openModal: () => openModalForField(recipeColumnsNames.nutrition) }
    : base;
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
    case recipeStateType.addScrape:
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

/**
 * Builds props for RecipeSourceUrl component based on current mode and source URL availability
 *
 * Only returns props when in read-only mode with a non-empty source URL.
 * Returns undefined in all other cases to conditionally hide the component.
 *
 * @param stackMode - Current recipe screen mode
 * @param sourceUrl - Source URL from the recipe (if available)
 * @param onCopied - Callback fired after URL is copied to clipboard
 * @returns Props object for RecipeSourceUrl or undefined if component should not be shown
 */
export interface RecipeSourceUrlPropsInput {
  stackMode: recipeStateType;
  sourceUrl: string | undefined;
  onCopied: () => void;
}

export function buildRecipeSourceUrlProps({
  stackMode,
  sourceUrl,
  onCopied,
}: RecipeSourceUrlPropsInput): RecipeSourceUrlProps | undefined {
  if (stackMode !== recipeStateType.readOnly) {
    return undefined;
  }

  if (!sourceUrl || sourceUrl.trim().length === 0) {
    return undefined;
  }

  return {
    sourceUrl,
    onCopied,
  };
}
