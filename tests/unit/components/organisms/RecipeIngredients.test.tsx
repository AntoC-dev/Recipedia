import { fireEvent, render, waitFor } from '@testing-library/react-native';
import RecipeIngredients, { RecipeIngredientsProps } from '@components/organisms/RecipeIngredients';
import React from 'react';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import { testTags } from '@test-data/tagsDataset';
import RecipeDatabase from '@utils/RecipeDatabase';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import { ingredientTableElement, ingredientType } from '@customTypes/DatabaseElementTypes';

jest.mock('@components/atomic/RoundButton', () => ({
  RoundButton: require('@mocks/components/atomic/RoundButton-mock').roundButtonMock,
}));
jest.mock('@components/atomic/NumericTextInput', () => ({
  NumericTextInput: require('@mocks/components/atomic/NumericTextInput-mock').numericTextInputMock,
}));
jest.mock('@components/atomic/CustomTextInput', () => ({
  CustomTextInput: require('@mocks/components/atomic/CustomTextInput-mock').customTextInputMock,
}));
jest.mock('@components/molecules/TextInputWithDropDown', () => ({
  TextInputWithDropDown: require('@mocks/components/molecules/TextInputWithDropDown-mock.tsx')
    .textInputWithDropdownMock,
}));
jest.mock('@expo/vector-icons', () => require('@mocks/deps/expo-vector-icons-mock'));

describe('RecipeIngredients Component', () => {
  const sampleIngredients: ingredientTableElement[] = [
    { quantity: '2', unit: 'cups', name: 'flour', type: ingredientType.cereal, season: [] },
    { quantity: '1', unit: 'tsp', name: 'salt', type: ingredientType.condiment, season: [] },
    { quantity: '3', unit: 'tbsp', name: 'sugar', type: ingredientType.condiment, season: [] },
  ];

  const renderRecipeIngredients = async (props: RecipeIngredientsProps) => {
    const result = render(
      <RecipeDatabaseProvider>
        <RecipeIngredients {...props} />
      </RecipeDatabaseProvider>
    );

    await waitFor(() => {
      expect(result.root).toBeTruthy();
    });
    return result;
  };

  const dbInstance = RecipeDatabase.getInstance();

  beforeEach(async () => {
    jest.clearAllMocks();
    await dbInstance.init();
    await dbInstance.addMultipleIngredients(testIngredients);
    await dbInstance.addMultipleTags(testTags);
    await dbInstance.addMultipleRecipes(testRecipes);
  });

  afterEach(async () => {
    await dbInstance.closeAndReset();
  });

  describe('readOnly mode', () => {
    it('renders ingredients in read-only mode with quantity, unit, and name', async () => {
      const { getByTestId } = await renderRecipeIngredients({
        mode: 'readOnly',
        testID: 'ReadOnlyIngredients',
        ingredients: sampleIngredients,
      });

      sampleIngredients.forEach((ingredient, index) => {
        expect(getByTestId(`ReadOnlyIngredients::${index}::Row`)).toBeTruthy();
        const quantityAndUnitCell = getByTestId(`ReadOnlyIngredients::${index}::QuantityAndUnit`);
        const quantityAndUnitText = quantityAndUnitCell.props.children.props.children;
        expect(quantityAndUnitText).toEqual([ingredient.quantity, ' ', ingredient.unit]);

        const ingredientNameCell = getByTestId(`ReadOnlyIngredients::${index}::IngredientName`);
        const textElement = ingredientNameCell.props.children;
        const textChildren = textElement.props.children;
        expect(textChildren[0]).toEqual(ingredient.name);
      });
    });

    it('renders empty list when no ingredients provided', async () => {
      const { queryByTestId } = await renderRecipeIngredients({
        mode: 'readOnly',
        testID: 'ReadOnlyIngredients',
        ingredients: [],
      });

      expect(queryByTestId('ReadOnlyIngredients::0::Row')).toBeNull();
    });
  });

  describe('editable mode', () => {
    const mockOnIngredientChange = jest.fn();
    const mockOnAddIngredient = jest.fn();

    const editableProps: RecipeIngredientsProps = {
      mode: 'editable',
      testID: 'EditableIngredients',
      ingredients: sampleIngredients,
      prefixText: 'Ingredients',
      columnTitles: {
        column1: 'Quantity',
        column2: 'Unit',
        column3: 'Ingredient',
      },
      onIngredientChange: mockOnIngredientChange,
      onAddIngredient: mockOnAddIngredient,
      noteInputPlaceholder: 'Usage note',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders prefix text and column titles', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      expect(getByTestId('EditableIngredients::PrefixText').props.children).toEqual('Ingredients');
    });

    it('renders editable inputs for each ingredient', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      sampleIngredients.forEach((ingredient, index) => {
        expect(getByTestId(`EditableIngredients::${index}::Row`)).toBeTruthy();
        expect(getByTestId(`EditableIngredients::${index}::QuantityInput`).props.value).toEqual(
          ingredient.quantity
        );
        expect(getByTestId(`EditableIngredients::${index}::Unit`).props.children).toEqual(
          ingredient.unit
        );
        expect(
          getByTestId(`EditableIngredients::${index}::NameInput::TextInputWithDropdown::Value`)
            .props.children
        ).toEqual(ingredient.name);
      });
    });

    it('renders add button', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      expect(
        getByTestId('EditableIngredients::AddButton::RoundButton::Icon').props.children
      ).toEqual('plus');
      expect(
        getByTestId('EditableIngredients::AddButton::RoundButton::OnPressFunction')
      ).toBeTruthy();
    });

    it('calls onAddIngredient when add button is pressed', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      fireEvent.press(getByTestId('EditableIngredients::AddButton::RoundButton::OnPressFunction'));

      expect(mockOnAddIngredient).toHaveBeenCalledTimes(1);
    });

    it('calls onIngredientChange when quantity is modified', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      const quantityInput = getByTestId('EditableIngredients::0::QuantityInput');
      fireEvent.changeText(quantityInput, '5');
      fireEvent(quantityInput, 'blur');

      expect(mockOnIngredientChange).toHaveBeenCalledWith(0, expect.any(String));
    });

    it('calls onIngredientChange when ingredient name is validated', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      fireEvent.press(
        getByTestId('EditableIngredients::0::NameInput::TextInputWithDropdown::OnValidate')
      );

      expect(mockOnIngredientChange).toHaveBeenCalledWith(0, expect.any(String));
    });

    it('filters out already used ingredients from dropdown suggestions', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      const referenceArray = JSON.parse(
        getByTestId('EditableIngredients::0::NameInput::TextInputWithDropdown::ReferenceTextArray')
          .props.children
      );

      sampleIngredients.forEach(ingredient => {
        expect(referenceArray).not.toContain(ingredient.name);
      });
    });
  });

  describe('add mode', () => {
    const mockOnIngredientChange = jest.fn();
    const mockOnAddIngredient = jest.fn();
    const mockOpenModal = jest.fn();

    const addPropsWithIngredients: RecipeIngredientsProps = {
      mode: 'add',
      testID: 'AddIngredients',
      ingredients: sampleIngredients,
      prefixText: 'Ingredients',
      columnTitles: {
        column1: 'Quantity',
        column2: 'Unit',
        column3: 'Ingredient',
      },
      onIngredientChange: mockOnIngredientChange,
      onAddIngredient: mockOnAddIngredient,
      openModal: mockOpenModal,
      noteInputPlaceholder: 'Usage note',
    };

    const addPropsEmpty: RecipeIngredientsProps = {
      mode: 'add',
      testID: 'AddIngredients',
      ingredients: [],
      prefixText: 'Ingredients',
      columnTitles: {
        column1: 'Quantity',
        column2: 'Unit',
        column3: 'Ingredient',
      },
      onIngredientChange: mockOnIngredientChange,
      onAddIngredient: mockOnAddIngredient,
      openModal: mockOpenModal,
      noteInputPlaceholder: 'Usage note',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders as editable mode when ingredients exist', async () => {
      const { getByTestId } = await renderRecipeIngredients(addPropsWithIngredients);

      expect(getByTestId('AddIngredients::PrefixText').props.children).toEqual('Ingredients');
      expect(getByTestId('AddIngredients::0::Row')).toBeTruthy();
      expect(getByTestId('AddIngredients::AddButton::RoundButton::Icon').props.children).toEqual(
        'plus'
      );
    });

    it('renders OCR and add buttons when ingredients are empty', async () => {
      const { getByTestId } = await renderRecipeIngredients(addPropsEmpty);

      expect(getByTestId('AddIngredients::PrefixText').props.children).toEqual('Ingredients');
      expect(getByTestId('AddIngredients::OpenModal::RoundButton::Icon').props.children).toEqual(
        'line-scan'
      );
      expect(getByTestId('AddIngredients::AddButton::RoundButton::Icon').props.children).toEqual(
        'pencil'
      );
    });

    it('calls openModal when OCR button is pressed in empty state', async () => {
      const { getByTestId } = await renderRecipeIngredients(addPropsEmpty);

      fireEvent.press(getByTestId('AddIngredients::OpenModal::RoundButton::OnPressFunction'));

      expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });

    it('calls onAddIngredient when add button is pressed in empty state', async () => {
      const { getByTestId } = await renderRecipeIngredients(addPropsEmpty);

      fireEvent.press(getByTestId('AddIngredients::AddButton::RoundButton::OnPressFunction'));

      expect(mockOnAddIngredient).toHaveBeenCalledTimes(1);
    });
  });

  describe('note icon display', () => {
    const mockOnIngredientChange = jest.fn();
    const mockOnAddIngredient = jest.fn();

    const ingredientsWithNotes: ingredientTableElement[] = [
      {
        quantity: '100',
        unit: 'g',
        name: 'flour',
        type: ingredientType.cereal,
        season: [],
        note: 'for the sauce',
      },
      { quantity: '50', unit: 'g', name: 'sugar', type: ingredientType.condiment, season: [] },
      {
        quantity: '25',
        unit: 'ml',
        name: 'oil',
        type: ingredientType.fat,
        season: [],
        note: '   ',
      },
    ];

    const editableProps: RecipeIngredientsProps = {
      mode: 'editable',
      testID: 'NoteTest',
      ingredients: ingredientsWithNotes,
      prefixText: 'Ingredients',
      columnTitles: { column1: 'Q', column2: 'U', column3: 'I' },
      onIngredientChange: mockOnIngredientChange,
      onAddIngredient: mockOnAddIngredient,
      noteInputPlaceholder: 'Usage note',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('shows commentEditOutline icon when note exists', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      const iconElement = getByTestId('NoteTest::0::NoteButton::Icon');
      expect(iconElement.props.children).toBe('comment-edit-outline');
    });

    it('shows commentPlusOutline icon when no note', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      const iconElement = getByTestId('NoteTest::1::NoteButton::Icon');
      expect(iconElement.props.children).toBe('comment-plus-outline');
    });

    it('shows commentPlusOutline icon when note is whitespace only', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      const iconElement = getByTestId('NoteTest::2::NoteButton::Icon');
      expect(iconElement.props.children).toBe('comment-plus-outline');
    });

    it('uses primary color when note exists', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      const colorElement = getByTestId('NoteTest::0::NoteButton::Color');
      expect(colorElement.props.children).toBe('#6200ee');
    });

    it('uses onSurfaceVariant color when no note', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      const colorElement = getByTestId('NoteTest::1::NoteButton::Color');
      expect(colorElement.props.children).toBe('#49454f');
    });
  });

  describe('note dialog integration', () => {
    const mockOnIngredientChange = jest.fn();
    const mockOnAddIngredient = jest.fn();

    const ingredientsWithNote: ingredientTableElement[] = [
      {
        quantity: '100',
        unit: 'g',
        name: 'Butter',
        type: ingredientType.fat,
        season: [],
        note: 'melted',
      },
    ];

    const editableProps: RecipeIngredientsProps = {
      mode: 'editable',
      testID: 'DialogTest',
      ingredients: ingredientsWithNote,
      prefixText: 'Ingredients',
      columnTitles: { column1: 'Q', column2: 'U', column3: 'I' },
      onIngredientChange: mockOnIngredientChange,
      onAddIngredient: mockOnAddIngredient,
      noteInputPlaceholder: 'Usage note',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('opens NoteEditDialog when note icon pressed', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      fireEvent.press(getByTestId('DialogTest::0::NoteButton'));

      expect(getByTestId('DialogTest::NoteDialog::Title')).toBeTruthy();
    });

    it('passes correct ingredient name to dialog', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      fireEvent.press(getByTestId('DialogTest::0::NoteButton'));

      expect(getByTestId('DialogTest::NoteDialog::IngredientName').props.children).toBe('Butter');
    });

    it('passes correct initial note to dialog', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      fireEvent.press(getByTestId('DialogTest::0::NoteButton'));

      expect(getByTestId('DialogTest::NoteDialog::Input::CustomTextInput').props.value).toBe(
        'melted'
      );
    });

    it('calls onIngredientChange with note after dialog save', async () => {
      const { getByTestId } = await renderRecipeIngredients(editableProps);

      fireEvent.press(getByTestId('DialogTest::0::NoteButton'));
      fireEvent.changeText(
        getByTestId('DialogTest::NoteDialog::Input::CustomTextInput'),
        'softened'
      );
      fireEvent.press(getByTestId('DialogTest::NoteDialog::SaveButton'));

      expect(mockOnIngredientChange).toHaveBeenCalledWith(0, expect.stringContaining('softened'));
    });

    it('closes dialog without change on cancel', async () => {
      const { getByTestId, queryByTestId } = await renderRecipeIngredients(editableProps);

      fireEvent.press(getByTestId('DialogTest::0::NoteButton'));
      fireEvent.press(getByTestId('DialogTest::NoteDialog::CancelButton'));

      await waitFor(() => {
        expect(queryByTestId('DialogTest::NoteDialog::Title')).toBeNull();
      });
      expect(mockOnIngredientChange).not.toHaveBeenCalled();
    });
  });

  describe('read-only note display', () => {
    const ingredientsWithNote: ingredientTableElement[] = [
      {
        quantity: '100',
        unit: 'g',
        name: 'Butter',
        type: ingredientType.fat,
        season: [],
        note: 'melted',
      },
      { quantity: '50', unit: 'g', name: 'Sugar', type: ingredientType.condiment, season: [] },
      {
        quantity: '25',
        unit: 'ml',
        name: 'Milk',
        type: ingredientType.dairy,
        season: [],
        note: '',
      },
    ];

    it('displays note in parentheses after ingredient name', async () => {
      const { getByTestId } = await renderRecipeIngredients({
        mode: 'readOnly',
        testID: 'ReadOnlyNote',
        ingredients: ingredientsWithNote,
      });

      const noteElement = getByTestId('ReadOnlyNote::0::Note');
      expect(noteElement).toBeTruthy();
      const children = noteElement.props.children;
      expect(children[0]).toBe(' ');
      expect(children[1]).toBe('(');
      expect(children[2]).toBe('melted');
      expect(children[3]).toBe(')');
    });

    it('does not display note element when no note', async () => {
      const { queryByTestId } = await renderRecipeIngredients({
        mode: 'readOnly',
        testID: 'ReadOnlyNote',
        ingredients: ingredientsWithNote,
      });

      expect(queryByTestId('ReadOnlyNote::1::Note')).toBeNull();
    });

    it('does not display note element when note is empty string', async () => {
      const { queryByTestId } = await renderRecipeIngredients({
        mode: 'readOnly',
        testID: 'ReadOnlyNote',
        ingredients: ingredientsWithNote,
      });

      expect(queryByTestId('ReadOnlyNote::2::Note')).toBeNull();
    });

    it('uses outline color for note text', async () => {
      const { getByTestId } = await renderRecipeIngredients({
        mode: 'readOnly',
        testID: 'ReadOnlyNote',
        ingredients: ingredientsWithNote,
      });

      const noteElement = getByTestId('ReadOnlyNote::0::Note');
      expect(noteElement.props.style.color).toBe('#79767d');
    });
  });

  describe('type safety', () => {
    it('enforces required props for editable mode', async () => {
      const editableProps: RecipeIngredientsProps = {
        mode: 'editable',
        testID: 'Test',
        ingredients: [],
        prefixText: 'Test',
        columnTitles: { column1: 'Q', column2: 'U', column3: 'I' },
        onIngredientChange: jest.fn(),
        onAddIngredient: jest.fn(),
        noteInputPlaceholder: 'Note',
      };

      expect(editableProps.mode).toEqual('editable');
      expect(editableProps.prefixText).toBeDefined();
      expect(editableProps.columnTitles).toBeDefined();
      expect(editableProps.onIngredientChange).toBeDefined();
      expect(editableProps.onAddIngredient).toBeDefined();
      expect(editableProps.noteInputPlaceholder).toBeDefined();
    });

    it('enforces required props for add mode', async () => {
      const addProps: RecipeIngredientsProps = {
        mode: 'add',
        testID: 'Test',
        ingredients: [],
        prefixText: 'Test',
        columnTitles: { column1: 'Q', column2: 'U', column3: 'I' },
        onIngredientChange: jest.fn(),
        onAddIngredient: jest.fn(),
        openModal: jest.fn(),
        noteInputPlaceholder: 'Note',
      };

      expect(addProps.mode).toEqual('add');
      expect(addProps.openModal).toBeDefined();
      expect(addProps.noteInputPlaceholder).toBeDefined();
    });

    it('does not require callbacks for readOnly mode', async () => {
      const readOnlyProps: RecipeIngredientsProps = {
        mode: 'readOnly',
        testID: 'Test',
        ingredients: [],
      };

      expect(readOnlyProps.mode).toEqual('readOnly');
      expect('prefixText' in readOnlyProps).toBeFalsy();
      expect('columnTitles' in readOnlyProps).toBeFalsy();
    });
  });
});
