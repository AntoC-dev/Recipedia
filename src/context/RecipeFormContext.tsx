/**
 * RecipeFormContext - Context for managing recipe form state
 *
 * Provides centralized form state management that can be accessed by any hook
 * within the Recipe screen. Manages all recipe fields including image, title,
 * description, tags, ingredients, preparation steps, and more.
 *
 * @module context/RecipeFormContext
 */

import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { recipeStateType } from '@customTypes/ScreenTypes';
import {
  FormIngredientElement,
  ingredientTableElement,
  nutritionTableElement,
  preparationStepElement,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { defaultValueNumber } from '@utils/Constants';
import { getDefaultPersons } from '@utils/settings';
import { scaleQuantityForPersons } from '@utils/Quantity';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import { convertModeFromProps, hasRecipeFromProps } from '@utils/RecipeFormHelpers';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';

/**
 * Recipe form state containing all recipe field values
 */
export interface RecipeFormState {
  recipeImage: string;
  recipeTitle: string;
  recipeDescription: string;
  recipeTags: tagTableElement[];
  recipePersons: number;
  recipeIngredients: (ingredientTableElement | FormIngredientElement)[];
  recipePreparation: preparationStepElement[];
  recipeTime: number;
  recipeNutrition: nutritionTableElement | undefined;
  stackMode: recipeStateType;
  imgForOCR: string[];
  randomTags: string[];
}

/**
 * React state setters for all recipe form fields
 */
export interface RecipeFormSetters {
  setRecipeImage: Dispatch<SetStateAction<string>>;
  setRecipeTitle: Dispatch<SetStateAction<string>>;
  setRecipeDescription: Dispatch<SetStateAction<string>>;
  setRecipeTags: Dispatch<SetStateAction<tagTableElement[]>>;
  setRecipePersons: Dispatch<SetStateAction<number>>;
  setRecipeIngredients: Dispatch<
    SetStateAction<(ingredientTableElement | FormIngredientElement)[]>
  >;
  setRecipePreparation: Dispatch<SetStateAction<preparationStepElement[]>>;
  setRecipeTime: Dispatch<SetStateAction<number>>;
  setRecipeNutrition: Dispatch<SetStateAction<nutritionTableElement | undefined>>;
  setStackMode: Dispatch<SetStateAction<recipeStateType>>;
  setImgForOCR: Dispatch<SetStateAction<string[]>>;
}

/**
 * Form action functions for reset and data extraction operations
 */
export interface RecipeFormActions {
  resetToOriginal: () => void;
  createRecipeSnapshot: () => recipeTableElement;
}

/**
 * Context value type for recipe form
 */
export interface RecipeFormContextType {
  state: RecipeFormState;
  setters: RecipeFormSetters;
  actions: RecipeFormActions;
  initStateFromProp: boolean;
}

const RecipeFormContext = createContext<RecipeFormContextType | undefined>(undefined);

/**
 * Props for the RecipeFormProvider component
 */
export interface RecipeFormProviderProps {
  props: RecipePropType;
  children: ReactNode;
}

/**
 * Provider component for recipe form context.
 *
 * Wrap the Recipe screen content with this provider to enable form state sharing
 * across all hooks within the screen.
 */
export function RecipeFormProvider({ props, children }: RecipeFormProviderProps) {
  const { searchRandomlyTags } = useRecipeDatabase();
  const initStateFromProp = hasRecipeFromProps(props);

  const [recipeImage, setRecipeImage] = useState(
    initStateFromProp ? props.recipe.image_Source : ''
  );
  const [recipeTitle, setRecipeTitle] = useState(initStateFromProp ? props.recipe.title : '');
  const [recipeDescription, setRecipeDescription] = useState(
    initStateFromProp ? props.recipe.description : ''
  );
  const [recipeTags, setRecipeTags] = useState(initStateFromProp ? props.recipe.tags : []);
  const [recipePersons, setRecipePersons] = useState(
    initStateFromProp ? props.recipe.persons : defaultValueNumber
  );
  const [recipeIngredients, setRecipeIngredients] = useState<
    (ingredientTableElement | FormIngredientElement)[]
  >(initStateFromProp ? props.recipe.ingredients : []);
  const [recipePreparation, setRecipePreparation] = useState(
    initStateFromProp ? props.recipe.preparation : []
  );
  const [recipeTime, setRecipeTime] = useState(
    initStateFromProp ? props.recipe.time : defaultValueNumber
  );
  const [recipeNutrition, setRecipeNutrition] = useState(
    initStateFromProp ? props.recipe.nutrition : undefined
  );
  const [stackMode, setStackMode] = useState(convertModeFromProps(props.mode));
  const [imgForOCR, setImgForOCR] = useState(props.mode === 'addFromPic' ? [props.imgUri] : []);
  const [randomTags] = useState(searchRandomlyTags(3).map(element => element.name));

  const previousPersonsRef = useRef<number>(recipePersons);

  useEffect(() => {
    const loadDefaultPersons = async () => {
      if (!initStateFromProp) {
        const defaultPersons = await getDefaultPersons();
        setRecipePersons(defaultPersons);
      }
    };

    loadDefaultPersons();
  }, [initStateFromProp]);

  useEffect(() => {
    const previousPersons = previousPersonsRef.current;
    const nextPersons = recipePersons;
    if (
      previousPersons !== defaultValueNumber &&
      nextPersons !== defaultValueNumber &&
      previousPersons !== nextPersons
    ) {
      setRecipeIngredients(prevIngredients =>
        prevIngredients.map(ing => ({
          ...ing,
          quantity: ing.quantity
            ? scaleQuantityForPersons(ing.quantity, previousPersons, nextPersons)
            : undefined,
        }))
      );
    }
    previousPersonsRef.current = nextPersons;
  }, [recipePersons]);

  const resetToOriginal = () => {
    if (initStateFromProp) {
      setRecipeImage(props.recipe.image_Source);
      setRecipeTitle(props.recipe.title);
      setRecipeDescription(props.recipe.description);
      setRecipeTags(props.recipe.tags);
      setRecipePersons(props.recipe.persons);
      setRecipeIngredients(props.recipe.ingredients);
      setRecipePreparation(props.recipe.preparation);
      setRecipeTime(props.recipe.time);
      setRecipeNutrition(props.recipe.nutrition);
    }
    setStackMode(recipeStateType.readOnly);
  };

  const createRecipeSnapshot = (): recipeTableElement => {
    const originalRecipe = initStateFromProp ? props.recipe : undefined;
    return {
      id: originalRecipe?.id,
      image_Source: recipeImage,
      title: recipeTitle,
      description: recipeDescription,
      tags: recipeTags,
      persons: recipePersons,
      ingredients: recipeIngredients as ingredientTableElement[],
      season: originalRecipe?.season ?? [],
      preparation: recipePreparation,
      time: recipeTime,
      nutrition: recipeNutrition,
    };
  };

  return (
    <RecipeFormContext.Provider
      value={{
        state: {
          recipeImage,
          recipeTitle,
          recipeDescription,
          recipeTags,
          recipePersons,
          recipeIngredients,
          recipePreparation,
          recipeTime,
          recipeNutrition,
          stackMode,
          imgForOCR,
          randomTags,
        },
        setters: {
          setRecipeImage,
          setRecipeTitle,
          setRecipeDescription,
          setRecipeTags,
          setRecipePersons,
          setRecipeIngredients,
          setRecipePreparation,
          setRecipeTime,
          setRecipeNutrition,
          setStackMode,
          setImgForOCR,
        },
        actions: {
          resetToOriginal,
          createRecipeSnapshot,
        },
        initStateFromProp,
      }}
    >
      {children}
    </RecipeFormContext.Provider>
  );
}

/**
 * Hook to access recipe form context.
 *
 * Must be used within a RecipeFormProvider.
 *
 * @throws Error if used outside of RecipeFormProvider
 */
export function useRecipeForm(): RecipeFormContextType {
  const context = useContext(RecipeFormContext);
  if (!context) {
    throw new Error('useRecipeForm must be used within a RecipeFormProvider');
  }
  return context;
}
