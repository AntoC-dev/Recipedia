/**
 * RecipeDialogsContext - Context for managing dialog states in Recipe screen
 *
 * Provides centralized dialog state management that can be accessed by any hook
 * within the Recipe screen without prop drilling. Manages three types of dialogs:
 * - Validation dialog: Displays errors and confirmations
 * - Similarity dialog: Shows when adding items with similar names
 * - Validation queue: Manages items requiring user validation
 *
 * @module context/RecipeDialogsContext
 */

import React, { createContext, ReactNode, useContext, useState } from 'react';
import { SimilarityDialogProps } from '@components/dialogs/SimilarityDialog';
import { IngredientValidationProps, TagValidationProps } from '@components/dialogs/ValidationQueue';
import { getMissingFieldsErrorContent } from '@utils/RecipeFormHelpers';

/**
 * Configuration properties for the validation dialog.
 */
export interface ValidationDialogProps {
  title: string;
  content: string;
  confirmText: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const defaultValidationDialogProp: ValidationDialogProps = {
  title: '',
  content: '',
  confirmText: '',
  onConfirm: undefined,
  onCancel: undefined,
};

/**
 * State object for the similarity dialog.
 */
export interface SimilarityDialogState {
  isVisible: boolean;
  item: SimilarityDialogProps['item'];
}

const defaultSimilarityDialogState: SimilarityDialogState = {
  isVisible: false,
  item: {
    type: 'Tag',
    newItemName: '',
    onConfirm: () => {
      throw new Error('onConfirm callback called on default prop');
    },
  },
};

/**
 * Context value type for recipe dialogs.
 */
export interface RecipeDialogsContextType {
  isValidationDialogOpen: boolean;
  validationDialogProp: ValidationDialogProps;
  showValidationDialog: (props: ValidationDialogProps) => void;
  hideValidationDialog: () => void;
  showValidationErrorDialog: (missingElements: string[], t: (key: string) => string) => void;

  similarityDialog: SimilarityDialogState;
  showSimilarityDialog: (item: SimilarityDialogProps['item']) => void;
  hideSimilarityDialog: () => void;

  validationQueue: TagValidationProps | IngredientValidationProps | null;
  setValidationQueue: React.Dispatch<
    React.SetStateAction<TagValidationProps | IngredientValidationProps | null>
  >;
  clearValidationQueue: () => void;
}

const RecipeDialogsContext = createContext<RecipeDialogsContextType | undefined>(undefined);

/**
 * Provider component for recipe dialogs context.
 *
 * Wrap the Recipe screen with this provider to enable dialog state sharing
 * across all hooks within the screen.
 */
export function RecipeDialogsProvider({ children }: { children: ReactNode }) {
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [validationDialogProp, setValidationDialogProp] = useState<ValidationDialogProps>(
    defaultValidationDialogProp
  );
  const [similarityDialog, setSimilarityDialog] = useState<SimilarityDialogState>(
    defaultSimilarityDialogState
  );
  const [validationQueue, setValidationQueue] = useState<
    TagValidationProps | IngredientValidationProps | null
  >(null);

  const showValidationDialog = (props: ValidationDialogProps) => {
    setValidationDialogProp(props);
    setIsValidationDialogOpen(true);
  };

  const hideValidationDialog = () => {
    setIsValidationDialogOpen(false);
    setValidationDialogProp(defaultValidationDialogProp);
  };

  const showValidationErrorDialog = (missingElements: string[], t: (key: string) => string) => {
    const { title, content } = getMissingFieldsErrorContent(missingElements, t);
    setValidationDialogProp({
      ...defaultValidationDialogProp,
      title,
      content,
      confirmText: t('understood'),
    });
    setIsValidationDialogOpen(true);
  };

  const showSimilarityDialog = (item: SimilarityDialogProps['item']) => {
    setSimilarityDialog({
      isVisible: true,
      item,
    });
  };

  const hideSimilarityDialog = () => {
    setSimilarityDialog(defaultSimilarityDialogState);
  };

  const clearValidationQueue = () => {
    setValidationQueue(null);
  };

  return (
    <RecipeDialogsContext.Provider
      value={{
        isValidationDialogOpen,
        validationDialogProp,
        showValidationDialog,
        hideValidationDialog,
        showValidationErrorDialog,

        similarityDialog,
        showSimilarityDialog,
        hideSimilarityDialog,

        validationQueue,
        setValidationQueue,
        clearValidationQueue,
      }}
    >
      {children}
    </RecipeDialogsContext.Provider>
  );
}

/**
 * Hook to access recipe dialogs context.
 *
 * Must be used within a RecipeDialogsProvider.
 *
 * @throws Error if used outside of RecipeDialogsProvider
 */
export function useRecipeDialogs(): RecipeDialogsContextType {
  const context = useContext(RecipeDialogsContext);
  if (!context) {
    throw new Error('useRecipeDialogs must be used within a RecipeDialogsProvider');
  }
  return context;
}
