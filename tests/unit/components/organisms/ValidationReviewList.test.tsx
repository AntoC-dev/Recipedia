import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import {
  ValidationReviewList,
  ValidationReviewListProps,
} from '@components/organisms/ValidationReviewList';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';

jest.mock('@components/molecules/ValidationReviewItem', () => ({
  ValidationReviewItem: require('@mocks/components/molecules/ValidationReviewItem-mock')
    .validationReviewItemMock,
}));

jest.mock('@components/dialogs/ItemDialog', () => ({
  ItemDialog: require('@mocks/components/dialogs/ItemDialog-mock').itemDialogMock,
}));

jest.mock('@components/dialogs/DatabasePickerDialog', () =>
  require('@mocks/components/dialogs/DatabasePickerDialog-mock')
);

jest.mock('@components/atomic/BottomActionButton', () => ({
  BottomActionButton: require('@mocks/components/atomic/BottomActionButton-mock')
    .bottomActionButtonMock,
}));

const rawTag = { id: 1, name: 'Italian' };
const rawTagWithSimilar = { id: 99, name: 'Italians' };
const rawIngredient = { name: 'Tomato', unit: 'g', quantity: '100' };
const rawIngredientWithSimilar = { name: 'Spaghettis', unit: 'kg', quantity: '2' };

const testID = 'TestReview';

const baseProps = {
  testID,
  rawTags: [rawTag],
  rawIngredients: [rawIngredient],
  onImport: jest.fn(),
  recipeCount: 5,
};

function renderValidationReviewList(props: ValidationReviewListProps) {
  return render(
    <RecipeDatabaseProvider>
      <ValidationReviewList {...props} />
    </RecipeDatabaseProvider>
  );
}

describe('ValidationReviewList', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  describe('list header', () => {
    test('renders review subtitle', () => {
      const { getByTestId } = renderValidationReviewList(baseProps);

      expect(getByTestId(`${testID}::ListHeader`)).toBeTruthy();
    });
  });

  describe('section headers', () => {
    test('renders tag section header when tags exist', () => {
      const { getAllByTestId } = renderValidationReviewList(baseProps);

      expect(getAllByTestId(`${testID}::TagSectionHeader`).length).toBeGreaterThanOrEqual(1);
    });

    test('renders ingredient section header when ingredients exist', () => {
      const { getAllByTestId } = renderValidationReviewList(baseProps);

      expect(getAllByTestId(`${testID}::IngredientSectionHeader`).length).toBeGreaterThanOrEqual(1);
    });

    test('does not render tag section when no tags', () => {
      const { queryAllByTestId } = renderValidationReviewList({ ...baseProps, rawTags: [] });

      expect(queryAllByTestId(`${testID}::TagSectionHeader`)).toHaveLength(0);
    });

    test('does not render ingredient section when no ingredients', () => {
      const { queryAllByTestId } = renderValidationReviewList({ ...baseProps, rawIngredients: [] });

      expect(queryAllByTestId(`${testID}::IngredientSectionHeader`)).toHaveLength(0);
    });
  });

  describe('import button', () => {
    test('is disabled when items are pending', () => {
      const { getByTestId } = renderValidationReviewList(baseProps);

      expect(getByTestId(`${testID}::BottomActionButton::Disabled`).props.children).toBe('true');
    });

    test('is enabled after all items are skipped', () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawIngredients: [] });

      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onSkip`));

      expect(getByTestId(`${testID}::BottomActionButton::Disabled`).props.children).toBe('false');
    });

    test('calls onImport with resolution mappings when pressed', () => {
      const onImport = jest.fn();
      const { getByTestId } = renderValidationReviewList({
        ...baseProps,
        rawIngredients: [],
        onImport,
      });

      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onSkip`));
      fireEvent.press(getByTestId(`${testID}::BottomActionButton::onPress`));

      expect(onImport).toHaveBeenCalledWith(
        expect.objectContaining({
          tagMappings: expect.any(Map),
          ingredientMappings: expect.any(Map),
        })
      );
    });
  });

  describe('items rendering', () => {
    test('renders tag items', () => {
      const { getByTestId } = renderValidationReviewList({
        ...baseProps,
        rawTags: [
          { id: 1, name: 'Italian' },
          { id: 2, name: 'Quick' },
        ],
        rawIngredients: [],
      });

      expect(getByTestId(`${testID}::Tag::Italian`)).toBeTruthy();
      expect(getByTestId(`${testID}::Tag::Quick`)).toBeTruthy();
    });

    test('renders ingredient items', () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawTags: [] });

      expect(getByTestId(`${testID}::Ingredient::Tomato`)).toBeTruthy();
    });

    test('items start in pending status', () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawIngredients: [] });

      expect(getByTestId(`${testID}::Tag::Italian::Status`).props.children).toBe('pending');
    });
  });

  describe('item actions', () => {
    test('skipping a tag changes its status to skipped', () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawIngredients: [] });

      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onSkip`));

      expect(getByTestId(`${testID}::Tag::Italian::Status`).props.children).toBe('skipped');
    });

    test('skipping an ingredient changes its status to skipped', () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawTags: [] });

      fireEvent.press(getByTestId(`${testID}::Ingredient::Tomato::onSkip`));

      expect(getByTestId(`${testID}::Ingredient::Tomato::Status`).props.children).toBe('skipped');
    });

    test('undoing a skipped tag resets it to pending', () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawIngredients: [] });

      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onSkip`));
      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onUndo`));

      expect(getByTestId(`${testID}::Tag::Italian::Status`).props.children).toBe('pending');
    });

    test('using a suggestion resolves the tag', () => {
      const { getByTestId } = renderValidationReviewList({
        ...baseProps,
        rawTags: [rawTagWithSimilar],
        rawIngredients: [],
      });

      fireEvent.press(getByTestId(`${testID}::Tag::Italians::onUseSuggested`));

      expect(getByTestId(`${testID}::Tag::Italians::Status`).props.children).toBe('resolved');
    });

    test('using a suggestion resolves the ingredient', () => {
      const { getByTestId } = renderValidationReviewList({
        ...baseProps,
        rawTags: [],
        rawIngredients: [rawIngredientWithSimilar],
      });

      fireEvent.press(getByTestId(`${testID}::Ingredient::Spaghettis::onUseSuggested`));

      expect(getByTestId(`${testID}::Ingredient::Spaghettis::Status`).props.children).toBe(
        'resolved'
      );
    });
  });

  describe('ItemDialog integration (add new)', () => {
    test('does not render ItemDialog initially', () => {
      const { queryByTestId } = renderValidationReviewList(baseProps);

      expect(queryByTestId(`${testID}::AddNewDialog::IsVisible`)).toBeNull();
    });

    test('opens ItemDialog when AddNew is pressed for a tag', () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawIngredients: [] });

      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onAddNew`));

      expect(getByTestId(`${testID}::AddNewDialog::Item::Type`).props.children).toBe('Tag');
    });

    test('opens ItemDialog when AddNew is pressed for an ingredient', () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawTags: [] });

      fireEvent.press(getByTestId(`${testID}::Ingredient::Tomato::onAddNew`));

      expect(getByTestId(`${testID}::AddNewDialog::Item::Type`).props.children).toBe('Ingredient');
    });

    test('resolves tag via add-new when ItemDialog confirms', async () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawIngredients: [] });

      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onAddNew`));
      fireEvent.press(getByTestId(`${testID}::AddNewDialog::Item::OnConfirm`));

      await waitFor(() => {
        expect(getByTestId(`${testID}::Tag::Italian::Status`).props.children).toBe('resolved');
      });
    });

    test('closes ItemDialog when onClose is called', () => {
      const { getByTestId, queryByTestId } = renderValidationReviewList({
        ...baseProps,
        rawIngredients: [],
      });

      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onAddNew`));
      fireEvent.press(getByTestId(`${testID}::AddNewDialog::OnClose`));

      expect(queryByTestId(`${testID}::AddNewDialog::Item::Type`)).toBeNull();
    });
  });

  describe('add-new persists to database', () => {
    test('adding a new ingredient saves it to the database', async () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawTags: [] });

      fireEvent.press(getByTestId(`${testID}::Ingredient::Tomato::onAddNew`));
      fireEvent.press(getByTestId(`${testID}::AddNewDialog::Item::OnConfirm`));

      await waitFor(() => {
        const added = database.get_ingredients().find(i => i.name === 'New Value');
        expect(added).toBeDefined();
      });
    });

    test('adding a new tag saves it to the database', async () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawIngredients: [] });

      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onAddNew`));
      fireEvent.press(getByTestId(`${testID}::AddNewDialog::Item::OnConfirm`));

      await waitFor(() => {
        const added = database.get_tags().find(t => t.name === 'New Value');
        expect(added).toBeDefined();
      });
    });
  });

  describe('DatabasePickerDialog integration (pick)', () => {
    test('does not render PickDialog initially', () => {
      const { queryByTestId } = renderValidationReviewList(baseProps);

      expect(queryByTestId(`${testID}::PickDialog::DatabasePickerDialog::Mock`)).toBeNull();
    });

    test('opens PickDialog for tags when Pick is pressed', () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawIngredients: [] });

      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onPickFromDatabase`));

      expect(getByTestId(`${testID}::PickDialog::DatabasePickerDialog::Mock`)).toBeTruthy();
    });

    test('PickDialog title includes the item name', () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawIngredients: [] });

      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onPickFromDatabase`));

      expect(
        getByTestId(`${testID}::PickDialog::DatabasePickerDialog::Mock::title`).props.children
      ).toContain('Italian');
    });

    test('opens PickDialog for ingredients when Pick is pressed', () => {
      const { getByTestId } = renderValidationReviewList({ ...baseProps, rawTags: [] });

      fireEvent.press(getByTestId(`${testID}::Ingredient::Tomato::onPickFromDatabase`));

      expect(getByTestId(`${testID}::PickDialog::DatabasePickerDialog::Mock`)).toBeTruthy();
    });

    test('picking a tag resolves the item and closes the dialog', async () => {
      const { getByTestId, queryByTestId } = renderValidationReviewList({
        ...baseProps,
        rawIngredients: [],
      });

      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onPickFromDatabase`));

      const pickTagButton = await waitFor(() =>
        getByTestId(`${testID}::PickDialog::DatabasePickerDialog::Mock::item::Italian`)
      );
      fireEvent.press(pickTagButton);

      expect(getByTestId(`${testID}::Tag::Italian::Status`).props.children).toBe('resolved');
      expect(queryByTestId(`${testID}::PickDialog::DatabasePickerDialog::Mock`)).toBeNull();
    });

    test('picking an ingredient resolves the item and closes the dialog', async () => {
      const { getByTestId, queryByTestId } = renderValidationReviewList({
        ...baseProps,
        rawTags: [],
      });

      fireEvent.press(getByTestId(`${testID}::Ingredient::Tomato::onPickFromDatabase`));

      const pickIngButton = await waitFor(() =>
        getByTestId(`${testID}::PickDialog::DatabasePickerDialog::Mock::item::Tomato Sauce`)
      );
      fireEvent.press(pickIngButton);

      expect(getByTestId(`${testID}::Ingredient::Tomato::Status`).props.children).toBe('resolved');
      expect(queryByTestId(`${testID}::PickDialog::DatabasePickerDialog::Mock`)).toBeNull();
    });

    test('closes PickDialog when dismissed', () => {
      const { getByTestId, queryByTestId } = renderValidationReviewList({
        ...baseProps,
        rawIngredients: [],
      });

      fireEvent.press(getByTestId(`${testID}::Tag::Italian::onPickFromDatabase`));
      fireEvent.press(getByTestId(`${testID}::PickDialog::DatabasePickerDialog::Mock::onDismiss`));

      expect(queryByTestId(`${testID}::PickDialog::DatabasePickerDialog::Mock`)).toBeNull();
    });
  });
});
