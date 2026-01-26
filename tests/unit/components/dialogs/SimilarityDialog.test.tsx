import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SimilarityDialog, SimilarityDialogProps } from '@components/dialogs/SimilarityDialog';
import { ingredientTableElement, tagTableElement } from '@customTypes/DatabaseElementTypes';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/dialogs/ItemDialog', () => ({
  ItemDialog: require('@mocks/components/dialogs/ItemDialog-mock').itemDialogMock,
}));

describe('SimilarityDialog', () => {
  const database = RecipeDatabase.getInstance();
  const testId = 'test-similarity';
  const modalTestId = `${testId}::SimilarityDialog`;

  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockOnUseExisting = jest.fn();
  const mockOnDismiss = jest.fn();

  const similarIngredient: ingredientTableElement = testIngredients[0];
  const similarTag: tagTableElement = testTags[0];
  const otherIngredient: ingredientTableElement = testIngredients[1];
  const otherTag: tagTableElement = testTags[1];

  beforeEach(async () => {
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  const renderDialog = async (props: SimilarityDialogProps) => {
    const result = render(
      <RecipeDatabaseProvider>
        <SimilarityDialog {...props} />
      </RecipeDatabaseProvider>
    );
    if (props.isVisible) {
      await waitFor(() => {
        expect(result.getByTestId(`${modalTestId}::Title`)).toBeTruthy();
      });
    }
    return result;
  };

  describe('visibility', () => {
    test('renders main dialog when isVisible is true', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'tomatoe',
          similarItem: similarIngredient,
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId } = await renderDialog(props);
      expect(getByTestId(`${modalTestId}::Title`)).toBeTruthy();
    });

    test('does not render main dialog when isVisible is false', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: false,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'tomatoe',
          similarItem: similarIngredient,
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { queryByTestId } = await renderDialog(props);
      expect(queryByTestId(`${modalTestId}::Title`)).toBeNull();
    });

    test('hides main dialog when picker is shown', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'tomatoe',
          similarItem: similarIngredient,
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId, queryByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));

      expect(queryByTestId(`${modalTestId}::Title`)).toBeNull();
      expect(getByTestId(`${testId}::DatabasePicker`)).toBeTruthy();
    });

    test('hides main dialog when confirmation is shown', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'tomatoe',
          similarItem: similarIngredient,
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId, queryByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));
      fireEvent.press(getByTestId(`${testId}::DatabasePicker::Item::0`));

      expect(queryByTestId(`${modalTestId}::Title`)).toBeNull();
      expect(getByTestId(`${testId}::PickConfirmation`)).toBeTruthy();
    });
  });

  describe('ingredient similarity mode with similarItem', () => {
    const baseProps: SimilarityDialogProps = {
      testId,
      isVisible: true,
      onClose: mockOnClose,
      item: {
        type: 'Ingredient',
        newItemName: 'tomatoe',
        similarItem: similarIngredient,
        onConfirm: mockOnConfirm,
        onUseExisting: mockOnUseExisting,
      },
    };

    test('renders correct title for similar ingredient', async () => {
      const { getByText } = await renderDialog(baseProps);
      expect(getByText('alerts.ingredientSimilarity.similarIngredientFound')).toBeTruthy();
    });

    test('renders correct content with ingredient names', async () => {
      const { getByTestId } = await renderDialog(baseProps);
      const content = getByTestId(`${modalTestId}::Content`);
      expect(content).toBeTruthy();
    });

    test('renders all three buttons for similar ingredient', async () => {
      const { getByTestId } = await renderDialog(baseProps);
      expect(getByTestId(`${modalTestId}::UseButton`)).toBeTruthy();
      expect(getByTestId(`${modalTestId}::AddButton`)).toBeTruthy();
      expect(getByTestId(`${modalTestId}::PickButton`)).toBeTruthy();
    });

    test('use button has correct label', async () => {
      const { getByText } = await renderDialog(baseProps);
      expect(getByText('alerts.ingredientSimilarity.use')).toBeTruthy();
    });

    test('add button has correct label', async () => {
      const { getByText } = await renderDialog(baseProps);
      expect(getByText('alerts.ingredientSimilarity.add')).toBeTruthy();
    });

    test('pick button has correct label', async () => {
      const { getByText } = await renderDialog(baseProps);
      expect(getByText('alerts.ingredientSimilarity.chooseAnother')).toBeTruthy();
    });

    test('use button uses contained mode', async () => {
      const { getByTestId } = await renderDialog(baseProps);
      expect(getByTestId(`${modalTestId}::UseButton`)).toBeTruthy();
    });

    test('add button uses outlined mode', async () => {
      const { getByTestId } = await renderDialog(baseProps);
      expect(getByTestId(`${modalTestId}::AddButton`)).toBeTruthy();
    });

    test('pick button uses outlined mode', async () => {
      const { getByTestId } = await renderDialog(baseProps);
      expect(getByTestId(`${modalTestId}::PickButton`)).toBeTruthy();
    });

    test('calls onUseExisting and onClose when use button is pressed', async () => {
      const { getByTestId } = await renderDialog(baseProps);

      fireEvent.press(getByTestId(`${modalTestId}::UseButton`));

      expect(mockOnUseExisting).toHaveBeenCalledWith(similarIngredient);
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    test('opens ItemDialog when add button is pressed', async () => {
      const { getByTestId } = await renderDialog(baseProps);

      fireEvent.press(getByTestId(`${modalTestId}::AddButton`));

      expect(getByTestId(`${testId}::ItemDialog::IsVisible`).props.children).toBe(true);
    });

    test('opens DatabasePickerDialog when pick button is pressed', async () => {
      const { getByTestId } = await renderDialog(baseProps);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));

      expect(getByTestId(`${testId}::DatabasePicker`)).toBeTruthy();
    });
  });

  describe('ingredient similarity mode without similarItem', () => {
    const baseProps: SimilarityDialogProps = {
      testId,
      isVisible: true,
      onClose: mockOnClose,
      item: {
        type: 'Ingredient',
        newItemName: 'newingredient',
        onConfirm: mockOnConfirm,
        onUseExisting: mockOnUseExisting,
        onDismiss: mockOnDismiss,
      },
    };

    test('renders correct title for new ingredient', async () => {
      const { getByText } = await renderDialog(baseProps);
      expect(getByText('alerts.ingredientSimilarity.newIngredientTitle')).toBeTruthy();
    });

    test('renders correct content with new ingredient name', async () => {
      const { getByTestId } = await renderDialog(baseProps);
      const content = getByTestId(`${modalTestId}::Content`);
      expect(content).toBeTruthy();
    });

    test('renders add, pick, and cancel buttons', async () => {
      const { getByTestId } = await renderDialog(baseProps);
      expect(getByTestId(`${modalTestId}::AddButton`)).toBeTruthy();
      expect(getByTestId(`${modalTestId}::PickButton`)).toBeTruthy();
      expect(getByTestId(`${modalTestId}::CancelButton`)).toBeTruthy();
    });

    test('add button uses contained mode', async () => {
      const { getByTestId } = await renderDialog(baseProps);
      expect(getByTestId(`${modalTestId}::AddButton`)).toBeTruthy();
    });

    test('pick button uses outlined mode', async () => {
      const { getByTestId } = await renderDialog(baseProps);
      expect(getByTestId(`${modalTestId}::PickButton`)).toBeTruthy();
    });

    test('cancel button uses outlined mode', async () => {
      const { getByTestId } = await renderDialog(baseProps);
      expect(getByTestId(`${modalTestId}::CancelButton`)).toBeTruthy();
    });

    test('cancel button has correct label', async () => {
      const { getByText } = await renderDialog(baseProps);
      expect(getByText('alerts.ingredientSimilarity.cancel')).toBeTruthy();
    });

    test('calls onDismiss and onClose when cancel button is pressed', async () => {
      const { getByTestId } = await renderDialog(baseProps);

      fireEvent.press(getByTestId(`${modalTestId}::CancelButton`));

      expect(mockOnDismiss).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('tag similarity mode with similarItem', () => {
    const baseProps: SimilarityDialogProps = {
      testId,
      isVisible: true,
      onClose: mockOnClose,
      item: {
        type: 'Tag',
        newItemName: 'vegeterian',
        similarItem: similarTag,
        onConfirm: mockOnConfirm,
        onUseExisting: mockOnUseExisting,
      },
    };

    test('renders correct title for similar tag', async () => {
      const { getByText } = await renderDialog(baseProps);
      expect(getByText('alerts.tagSimilarity.similarTagFound')).toBeTruthy();
    });

    test('renders correct content with tag names', async () => {
      const { getByTestId } = await renderDialog(baseProps);
      const content = getByTestId(`${modalTestId}::Content`);
      expect(content).toBeTruthy();
    });

    test('renders all three buttons for similar tag', async () => {
      const { getByTestId } = await renderDialog(baseProps);
      expect(getByTestId(`${modalTestId}::UseButton`)).toBeTruthy();
      expect(getByTestId(`${modalTestId}::AddButton`)).toBeTruthy();
      expect(getByTestId(`${modalTestId}::PickButton`)).toBeTruthy();
    });

    test('use button has correct label', async () => {
      const { getByText } = await renderDialog(baseProps);
      expect(getByText('alerts.tagSimilarity.use')).toBeTruthy();
    });

    test('calls onUseExisting and onClose when use button is pressed', async () => {
      const { getByTestId } = await renderDialog(baseProps);

      fireEvent.press(getByTestId(`${modalTestId}::UseButton`));

      expect(mockOnUseExisting).toHaveBeenCalledWith(similarTag);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('tag similarity mode without similarItem', () => {
    const baseProps: SimilarityDialogProps = {
      testId,
      isVisible: true,
      onClose: mockOnClose,
      item: {
        type: 'Tag',
        newItemName: 'newtag',
        onConfirm: mockOnConfirm,
        onUseExisting: mockOnUseExisting,
        onDismiss: mockOnDismiss,
      },
    };

    test('renders correct title for new tag', async () => {
      const { getByText } = await renderDialog(baseProps);
      expect(getByText('alerts.tagSimilarity.newTagTitle')).toBeTruthy();
    });

    test('cancel button uses generic cancel label', async () => {
      const { getByText } = await renderDialog(baseProps);
      expect(getByText('cancel')).toBeTruthy();
    });
  });

  describe('DatabasePicker integration', () => {
    test('shows sorted ingredients in picker for ingredient type', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));

      expect(getByTestId(`${testId}::DatabasePicker`)).toBeTruthy();
    });

    test('shows sorted tags in picker for tag type', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));

      expect(getByTestId(`${testId}::DatabasePicker`)).toBeTruthy();
    });

    test('closes picker when cancel is pressed', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId, queryByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));
      expect(getByTestId(`${testId}::DatabasePicker`)).toBeTruthy();

      fireEvent.press(getByTestId(`${testId}::DatabasePicker::CancelButton`));

      expect(queryByTestId(`${testId}::DatabasePicker`)).toBeNull();
      expect(getByTestId(`${modalTestId}::Title`)).toBeTruthy();
    });

    test('shows picker title for ingredient', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));

      expect(getByTestId(`${testId}::DatabasePicker`)).toBeTruthy();
    });

    test('shows picker title for tag', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));

      expect(getByTestId(`${testId}::DatabasePicker`)).toBeTruthy();
    });
  });

  describe('full choose another flow', () => {
    test('ingredient: picker to confirmation to complete', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId, queryByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));
      expect(getByTestId(`${testId}::DatabasePicker`)).toBeTruthy();

      fireEvent.press(getByTestId(`${testId}::DatabasePicker::Item::0`));
      expect(queryByTestId(`${testId}::DatabasePicker`)).toBeNull();
      expect(getByTestId(`${testId}::PickConfirmation`)).toBeTruthy();

      fireEvent.press(getByTestId(`${testId}::PickConfirmation::ConfirmButton`));

      expect(mockOnUseExisting).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('tag: picker to confirmation to complete', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));
      fireEvent.press(getByTestId(`${testId}::DatabasePicker::Item::0`));
      fireEvent.press(getByTestId(`${testId}::PickConfirmation::ConfirmButton`));

      expect(mockOnUseExisting).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('picker to confirmation to back returns to main dialog', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'test',
          similarItem: similarIngredient,
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId, queryByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));
      fireEvent.press(getByTestId(`${testId}::DatabasePicker::Item::0`));
      expect(getByTestId(`${testId}::PickConfirmation`)).toBeTruthy();

      fireEvent.press(getByTestId(`${testId}::PickConfirmation::CancelButton`));

      expect(queryByTestId(`${testId}::PickConfirmation`)).toBeNull();
      expect(getByTestId(`${modalTestId}::Title`)).toBeTruthy();
    });

    test('confirmation dialog shows correct content', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'newitem',
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));
      fireEvent.press(getByTestId(`${testId}::DatabasePicker::Item::0`));

      expect(getByTestId(`${testId}::PickConfirmation`)).toBeTruthy();
      expect(getByTestId(`${testId}::PickConfirmation::ConfirmButton`)).toBeTruthy();
      expect(getByTestId(`${testId}::PickConfirmation::CancelButton`)).toBeTruthy();
    });

    test('confirmation content includes selected and new item names', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'myNewItem',
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));
      fireEvent.press(getByTestId(`${testId}::DatabasePicker::Item::0`));

      const confirmDialog = getByTestId(`${testId}::PickConfirmation`);
      expect(confirmDialog).toBeTruthy();
    });
  });

  describe('ItemDialog integration', () => {
    test('opens ItemDialog with correct props for ingredient', async () => {
      const newName = 'newingredient';
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: newName,
          onConfirm: mockOnConfirm,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::AddButton`));

      expect(getByTestId(`${testId}::ItemDialog::IsVisible`).props.children).toBe(true);
      expect(getByTestId(`${testId}::ItemDialog::Mode`).props.children).toBe('add');
      expect(getByTestId(`${testId}::ItemDialog::Item::Type`).props.children).toBe('Ingredient');
    });

    test('opens ItemDialog with correct props for tag', async () => {
      const newName = 'newtag';
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          newItemName: newName,
          onConfirm: mockOnConfirm,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::AddButton`));

      expect(getByTestId(`${testId}::ItemDialog::Item::Type`).props.children).toBe('Tag');
    });

    test('closes ItemDialog when OnClose is pressed', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
        },
      };

      const { getByTestId, queryByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::AddButton`));
      expect(getByTestId(`${testId}::ItemDialog::IsVisible`).props.children).toBe(true);

      fireEvent.press(getByTestId(`${testId}::ItemDialog::OnClose`));

      expect(queryByTestId(`${testId}::ItemDialog::IsVisible`)).toBeNull();
    });

    test('calls addIngredient and onConfirm when ingredient is confirmed', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::AddButton`));
      fireEvent.press(getByTestId(`${testId}::ItemDialog::Item::OnConfirm`));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('calls addTag and onConfirm when tag is confirmed', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::AddButton`));
      fireEvent.press(getByTestId(`${testId}::ItemDialog::Item::OnConfirm`));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('state reset on visibility change', () => {
    test('resets showPicker and pickedItem when dialog opens', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
          onUseExisting: mockOnUseExisting,
        },
      };

      const { getByTestId, rerender, queryByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));
      fireEvent.press(getByTestId(`${testId}::DatabasePicker::Item::0`));
      expect(getByTestId(`${testId}::PickConfirmation`)).toBeTruthy();

      rerender(
        <RecipeDatabaseProvider>
          <SimilarityDialog {...props} isVisible={false} />
        </RecipeDatabaseProvider>
      );

      rerender(
        <RecipeDatabaseProvider>
          <SimilarityDialog {...props} isVisible={true} />
        </RecipeDatabaseProvider>
      );

      await waitFor(() => {
        expect(getByTestId(`${modalTestId}::Title`)).toBeTruthy();
      });

      expect(queryByTestId(`${testId}::PickConfirmation`)).toBeNull();
    });
  });

  describe('optional callbacks', () => {
    test('works correctly without optional onUseExisting callback', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          newItemName: 'test',
          similarItem: similarTag,
          onConfirm: mockOnConfirm,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::UseButton`));

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnUseExisting).not.toHaveBeenCalled();
    });

    test('works correctly without optional onDismiss callback', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::CancelButton`));

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('handles very long item names', async () => {
      const longName =
        'This is a very long item name that should be handled properly by the dialog';
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: longName,
          onConfirm: mockOnConfirm,
        },
      };

      const { getByTestId } = await renderDialog(props);

      const content = getByTestId(`${modalTestId}::Content`);
      expect(content).toBeTruthy();
    });
  });

  describe('confirmation without onUseExisting', () => {
    test('calls onClose without onUseExisting when confirming picked item', async () => {
      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'test',
          onConfirm: mockOnConfirm,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::PickButton`));
      fireEvent.press(getByTestId(`${testId}::DatabasePicker::Item::0`));
      fireEvent.press(getByTestId(`${testId}::PickConfirmation::ConfirmButton`));

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnUseExisting).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('logs error when addIngredient fails', async () => {
      const addIngredientSpy = jest
        .spyOn(database, 'addIngredient')
        .mockRejectedValueOnce(new Error('Database error'));

      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'failingingredient',
          onConfirm: mockOnConfirm,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::AddButton`));
      fireEvent.press(getByTestId(`${testId}::ItemDialog::Item::OnConfirm`));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      expect(addIngredientSpy).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();

      addIngredientSpy.mockRestore();
    });

    test('logs error when addTag fails', async () => {
      const addTagSpy = jest
        .spyOn(database, 'addTag')
        .mockRejectedValueOnce(new Error('Database error'));

      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          newItemName: 'failingtag',
          onConfirm: mockOnConfirm,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::AddButton`));
      fireEvent.press(getByTestId(`${testId}::ItemDialog::Item::OnConfirm`));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      expect(addTagSpy).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();

      addTagSpy.mockRestore();
    });

    test('handles non-Error exception when adding ingredient', async () => {
      const addIngredientSpy = jest
        .spyOn(database, 'addIngredient')
        .mockRejectedValueOnce('String error');

      const props: SimilarityDialogProps = {
        testId,
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          newItemName: 'failingingredient',
          onConfirm: mockOnConfirm,
        },
      };

      const { getByTestId } = await renderDialog(props);

      fireEvent.press(getByTestId(`${modalTestId}::AddButton`));
      fireEvent.press(getByTestId(`${testId}::ItemDialog::Item::OnConfirm`));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      expect(mockOnConfirm).not.toHaveBeenCalled();

      addIngredientSpy.mockRestore();
    });
  });
});
