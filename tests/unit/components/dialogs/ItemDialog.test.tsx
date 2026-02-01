import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ItemDialog, ItemDialogProps } from '@components/dialogs/ItemDialog';
import {
  FormIngredientElement,
  ingredientTableElement,
  ingredientType,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

jest.mock('@components/atomic/CustomTextInput', () => ({
  CustomTextInput: require('@mocks/components/atomic/CustomTextInput-mock').customTextInputMock,
}));

jest.mock('@components/molecules/SeasonalityCalendar', () => ({
  SeasonalityCalendar: require('@mocks/components/molecules/SeasonalityCalendar-mock')
    .seasonalityCalendarMock,
}));

const mockTags: any[] = [];
const mockIngredients: any[] = [];

jest.mock('@context/RecipeDatabaseContext', () => ({
  useRecipeDatabase: () => ({
    tags: mockTags,
    ingredients: mockIngredients,
  }),
}));

describe('ItemDialog Component', () => {
  // Test data
  const mockIngredient: ingredientTableElement = {
    id: 1,
    name: 'Test Ingredient',
    type: ingredientType.fruit,
    unit: 'kg',
    season: ['1', '2', '3'],
  };

  const mockTag: tagTableElement = {
    id: 2,
    name: 'Test Tag',
  };

  const mockOnClose = jest.fn();
  const mockOnConfirmIngredient = jest.fn();
  const mockOnConfirmTag = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Clear mock arrays
    mockTags.length = 0;
    mockIngredients.length = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('does not render when isVisible is false', () => {
    const props: ItemDialogProps = {
      testId: 'IngredientDialog',
      mode: 'add',
      isVisible: false,
      onClose: mockOnClose,
      item: {
        type: 'Ingredient',
        value: mockIngredient,
        onConfirmIngredient: mockOnConfirmIngredient,
      },
    };

    const { queryByTestId } = render(<ItemDialog {...props} />);

    // When isVisible is false, dialog elements should not be present
    expect(queryByTestId('IngredientDialog::AddModal::Title')).toBeNull();
    expect(queryByTestId('IngredientDialog::AddModal::CancelButton')).toBeNull();
    expect(queryByTestId('IngredientDialog::AddModal::ConfirmButton')).toBeNull();
  });

  test('renders when isVisible is true', () => {
    const props: ItemDialogProps = {
      testId: 'IngredientDialog',
      mode: 'add',
      isVisible: true,
      onClose: mockOnClose,
      item: {
        type: 'Ingredient',
        value: mockIngredient,
        onConfirmIngredient: mockOnConfirmIngredient,
      },
    };

    const { getByTestId } = render(<ItemDialog {...props} />);

    // When isVisible is true, dialog elements should be present
    expect(getByTestId('IngredientDialog::AddModal::Title')).toBeTruthy();
    expect(getByTestId('IngredientDialog::AddModal::CancelButton')).toBeTruthy();
    expect(getByTestId('IngredientDialog::AddModal::ConfirmButton')).toBeTruthy();
  });

  describe('ingredient dialog ', () => {
    const props: ItemDialogProps = {
      testId: 'IngredientDialog',
      mode: 'add',
      isVisible: true,
      onClose: mockOnClose,
      item: {
        type: 'Ingredient',
        value: mockIngredient,
        onConfirmIngredient: mockOnConfirmIngredient,
      },
    };

    describe('render in ', () => {
      test('add mode with correct elements', () => {
        const { getByTestId, queryByTestId } = render(<ItemDialog {...props} />);

        expect(getByTestId('IngredientDialog::AddModal::Title').props.children).toEqual(
          'add_ingredient'
        );
        expect(queryByTestId('IngredientDialog::AddModal::Text')).toBeNull();
        expect(getByTestId('IngredientDialog::AddModal::Name::CustomTextInput')).toBeTruthy();
        expect(getByTestId('IngredientDialog::AddModal::Type').props.children).toEqual([
          'type',
          ':',
        ]);
        expect(getByTestId('IngredientDialog::AddModal::Unit::CustomTextInput')).toBeTruthy();

        expect(
          getByTestId('IngredientDialog::AddModal::SeasonalityCalendar::SelectedMonths').props
            .children
        ).toEqual(JSON.stringify(mockIngredient.season));

        expect(getByTestId('IngredientDialog::AddModal::CancelButton')).toBeTruthy();
        expect(getByTestId('IngredientDialog::AddModal::ConfirmButton')).toBeTruthy();
      });

      test('edit mode with correct elements', () => {
        const { getByTestId, queryByTestId } = render(<ItemDialog {...props} mode={'edit'} />);

        expect(getByTestId('IngredientDialog::EditModal::Title')).toBeTruthy();
        expect(queryByTestId('IngredientDialog::EditModal::Text')).toBeNull();
        expect(getByTestId('IngredientDialog::EditModal::Name::CustomTextInput')).toBeTruthy();
        expect(getByTestId('IngredientDialog::EditModal::Type').props.children).toEqual([
          'type',
          ':',
        ]);
        expect(getByTestId('IngredientDialog::EditModal::Unit::CustomTextInput')).toBeTruthy();

        expect(
          getByTestId('IngredientDialog::EditModal::SeasonalityCalendar::SelectedMonths').props
            .children
        ).toEqual(JSON.stringify(mockIngredient.season));

        expect(getByTestId('IngredientDialog::EditModal::CancelButton')).toBeTruthy();
        expect(getByTestId('IngredientDialog::EditModal::ConfirmButton')).toBeTruthy();
      });

      test('delete mode with correct elements', () => {
        const { getByTestId, queryByTestId } = render(<ItemDialog {...props} mode={'delete'} />);

        expect(getByTestId('IngredientDialog::DeleteModal::Title')).toBeTruthy();
        expect(getByTestId('IngredientDialog::DeleteModal::Text').props.children).toEqual([
          'confirmDelete',
          ' Test IngredientinterrogationMark',
        ]);
        expect(queryByTestId('IngredientDialog::DeleteModal::Name::CustomTextInput')).toBeNull();
        expect(queryByTestId('IngredientDialog::DeleteModal::Type')).toBeNull();
        expect(queryByTestId('IngredientDialog::DeleteModal::Unit::CustomTextInput')).toBeNull();

        expect(
          queryByTestId('IngredientDialog::DeleteModal::SeasonalityCalendar::SelectedMonths')
        ).toBeNull();

        expect(getByTestId('IngredientDialog::DeleteModal::CancelButton')).toBeTruthy();
        expect(getByTestId('IngredientDialog::DeleteModal::ConfirmButton')).toBeTruthy();
      });
    });
    describe('calls onConfirm when confirm button is pressed in ', () => {
      test('add mode', () => {
        const { getByTestId } = render(<ItemDialog {...props} />);

        fireEvent.press(getByTestId('IngredientDialog::AddModal::ConfirmButton'));

        expect(mockOnConfirmIngredient).toHaveBeenCalled();
      });
      test('edit mode', () => {
        const { getByTestId } = render(<ItemDialog {...props} mode={'edit'} />);

        fireEvent.press(getByTestId('IngredientDialog::EditModal::ConfirmButton'));

        expect(mockOnConfirmIngredient).toHaveBeenCalled();
      });
      test('delete mode', () => {
        const { getByTestId } = render(<ItemDialog {...props} mode={'delete'} />);

        fireEvent.press(getByTestId('IngredientDialog::DeleteModal::ConfirmButton'));

        expect(mockOnConfirmIngredient).toHaveBeenCalled();
      });
    });
    describe('calls onClose when cancel button is pressed in ', () => {
      test('add mode', () => {
        const { getByTestId } = render(<ItemDialog {...props} />);

        fireEvent.press(getByTestId('IngredientDialog::AddModal::CancelButton'));

        expect(mockOnClose).toHaveBeenCalled();
      });
      test('edit mode', () => {
        const { getByTestId } = render(<ItemDialog {...props} mode={'edit'} />);

        fireEvent.press(getByTestId('IngredientDialog::EditModal::CancelButton'));

        expect(mockOnClose).toHaveBeenCalled();
      });
      test('delete mode', () => {
        const { getByTestId } = render(<ItemDialog {...props} mode={'delete'} />);

        fireEvent.press(getByTestId('IngredientDialog::DeleteModal::CancelButton'));

        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('tag dialog ', () => {
    const props: ItemDialogProps = {
      testId: 'TagDialog',
      mode: 'add',
      isVisible: true,
      onClose: mockOnClose,
      item: {
        type: 'Tag',
        value: mockTag,
        onConfirmTag: mockOnConfirmTag,
      },
    };

    describe('render in ', () => {
      test('add mode with correct elements', () => {
        const { getByTestId, queryByTestId } = render(<ItemDialog {...props} />);

        expect(getByTestId('TagDialog::AddModal::Title').props.children).toEqual('add_tag');
        expect(queryByTestId('TagDialog::AddModal::Text')).toBeNull();
        expect(getByTestId('TagDialog::AddModal::Name::CustomTextInput')).toBeTruthy();
        expect(queryByTestId('TagDialog::AddModal::Menu')).toBeFalsy();
        expect(queryByTestId('TagDialog::AddModal::Unit')).toBeFalsy();

        expect(
          queryByTestId('TagDialog::AddModal::SeasonalityCalendar::SelectedMonths')
        ).toBeNull();

        expect(getByTestId('TagDialog::AddModal::CancelButton')).toBeTruthy();
        expect(getByTestId('TagDialog::AddModal::ConfirmButton')).toBeTruthy();
      });
      test('edit mode with correct elements', () => {
        const { getByTestId, queryByTestId } = render(<ItemDialog {...props} mode={'edit'} />);

        expect(getByTestId('TagDialog::EditModal::Title').props.children).toEqual('edit_tag');
        expect(queryByTestId('TagDialog::EditModal::Text')).toBeNull();
        expect(getByTestId('TagDialog::EditModal::Name::CustomTextInput')).toBeTruthy();
        expect(queryByTestId('TagDialog::EditModal::Menu')).toBeFalsy();
        expect(queryByTestId('TagDialog::EditModal::Unit')).toBeFalsy();

        expect(
          queryByTestId('TagDialog::EditModal::SeasonalityCalendar::SelectedMonths')
        ).toBeNull();

        expect(getByTestId('TagDialog::EditModal::CancelButton')).toBeTruthy();
        expect(getByTestId('TagDialog::EditModal::ConfirmButton')).toBeTruthy();
      });
      test('delete mode with correct elements', () => {
        const { getByTestId, queryByTestId } = render(<ItemDialog {...props} mode={'delete'} />);

        expect(getByTestId('TagDialog::DeleteModal::Title').props.children).toEqual('delete');
        expect(getByTestId('TagDialog::DeleteModal::Text')).toBeTruthy();

        expect(queryByTestId('TagDialog::DeleteModal::Name::CustomTextInput')).toBeNull();
        expect(queryByTestId('TagDialog::DeleteModal::Menu')).toBeNull();
        expect(queryByTestId('TagDialog::DeleteModal::Unit')).toBeNull();

        expect(
          queryByTestId('TagDialog::DeleteModal::SeasonalityCalendar::SelectedMonths')
        ).toBeNull();

        expect(getByTestId('TagDialog::DeleteModal::CancelButton')).toBeTruthy();
        expect(getByTestId('TagDialog::DeleteModal::ConfirmButton')).toBeTruthy();
      });
    });

    describe('calls onConfirm when confirm button is pressed in ', () => {
      test('add mode', () => {
        const { getByTestId } = render(<ItemDialog {...props} />);

        // Simulate clicking on the confirm button
        fireEvent.press(getByTestId('TagDialog::AddModal::ConfirmButton'));

        // Check that onConfirmTag was called with the correct mode and values
        expect(mockOnConfirmTag).toHaveBeenCalledWith('add', mockTag);
      });
      test('edit mode', () => {
        const { getByTestId } = render(<ItemDialog {...props} mode={'edit'} />);

        fireEvent.press(getByTestId('TagDialog::EditModal::ConfirmButton'));

        expect(mockOnConfirmTag).toHaveBeenCalledWith('edit', mockTag);
      });
      test('delete mode', () => {
        const { getByTestId } = render(<ItemDialog {...props} mode={'delete'} />);

        fireEvent.press(getByTestId('TagDialog::DeleteModal::ConfirmButton'));

        expect(mockOnConfirmTag).toHaveBeenCalledWith('delete', mockTag);
      });
    });

    describe('calls onClose when confirm button is pressed in ', () => {
      test('add mode', () => {
        const { getByTestId } = render(<ItemDialog {...props} />);

        fireEvent.press(getByTestId('TagDialog::AddModal::CancelButton'));

        expect(mockOnClose).toHaveBeenCalled();
      });
      test('edit mode', () => {
        const { getByTestId } = render(<ItemDialog {...props} mode={'edit'} />);

        fireEvent.press(getByTestId('TagDialog::EditModal::CancelButton'));

        expect(mockOnClose).toHaveBeenCalled();
      });
      test('delete mode', () => {
        const { getByTestId } = render(<ItemDialog {...props} mode={'delete'} />);

        fireEvent.press(getByTestId('TagDialog::DeleteModal::CancelButton'));

        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  test('calls onClose when cancel button is pressed', () => {
    const props: ItemDialogProps = {
      testId: 'IngredientDialog',
      mode: 'add',
      isVisible: true,
      onClose: mockOnClose,
      item: {
        type: 'Ingredient',
        value: mockIngredient,
        onConfirmIngredient: mockOnConfirmIngredient,
      },
    };

    const { getByTestId } = render(<ItemDialog {...props} />);

    // Simulate clicking on the cancel button (which should trigger onClose)
    fireEvent.press(getByTestId('IngredientDialog::AddModal::CancelButton'));

    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('calls onConfirmIngredient when confirm button is pressed in add mode', () => {
    const props: ItemDialogProps = {
      testId: 'IngredientDialog',
      mode: 'add',
      isVisible: true,
      onClose: mockOnClose,
      item: {
        type: 'Ingredient',
        value: mockIngredient,
        onConfirmIngredient: mockOnConfirmIngredient,
      },
    };

    const { getByTestId } = render(<ItemDialog {...props} />);

    // Simulate clicking on the confirm button
    fireEvent.press(getByTestId('IngredientDialog::AddModal::ConfirmButton'));

    // Check that onConfirmIngredient was called with the correct mode and values
    expect(mockOnConfirmIngredient).toHaveBeenCalledWith('add', mockIngredient);
  });

  test('calls onConfirmIngredient when confirm button is pressed in edit mode', () => {
    const props: ItemDialogProps = {
      testId: 'IngredientDialog',
      mode: 'edit',
      isVisible: true,
      onClose: mockOnClose,
      item: {
        type: 'Ingredient',
        value: mockIngredient,
        onConfirmIngredient: mockOnConfirmIngredient,
      },
    };

    const { getByTestId } = render(<ItemDialog {...props} />);

    // Simulate clicking on the confirm button
    fireEvent.press(getByTestId('IngredientDialog::EditModal::ConfirmButton'));

    // Check that onConfirmIngredient was called with the correct mode and values
    expect(mockOnConfirmIngredient).toHaveBeenCalledWith('edit', mockIngredient);
  });
  test('calls onConfirmIngredient when confirm button is pressed in delete mode', () => {
    const props: ItemDialogProps = {
      testId: 'IngredientDialog',
      mode: 'delete',
      isVisible: true,
      onClose: mockOnClose,
      item: {
        type: 'Ingredient',
        value: mockIngredient,
        onConfirmIngredient: mockOnConfirmIngredient,
      },
    };

    const { getByTestId } = render(<ItemDialog {...props} />);

    // Simulate clicking on the confirm button
    fireEvent.press(getByTestId('IngredientDialog::DeleteModal::ConfirmButton'));

    // Check that onConfirmIngredient was called with the correct mode and values
    expect(mockOnConfirmIngredient).toHaveBeenCalledWith('delete', mockIngredient);
  });

  describe('validation for ingredients', () => {
    test('disables confirm button when ingredient has undefined type in add mode', () => {
      const invalidIngredient: FormIngredientElement = {
        name: 'Test Ingredient',
        type: undefined,
        unit: 'kg',
        season: [],
      };

      const props: ItemDialogProps = {
        testId: 'IngredientDialog',
        mode: 'add',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          value: invalidIngredient,
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      expect(
        getByTestId('IngredientDialog::AddModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(true);
    });

    test('enables confirm button when ingredient has empty unit in add mode', () => {
      const ingredientWithoutUnit: ingredientTableElement = {
        name: 'Test Ingredient',
        type: ingredientType.fruit,
        unit: '',
        season: [],
      };

      const props: ItemDialogProps = {
        testId: 'IngredientDialog',
        mode: 'add',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          value: ingredientWithoutUnit,
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      expect(
        getByTestId('IngredientDialog::AddModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(false);
    });

    test('enables confirm button when ingredient has empty unit in edit mode', () => {
      const ingredientWithoutUnit: ingredientTableElement = {
        id: 1,
        name: 'Test Ingredient',
        type: ingredientType.fruit,
        unit: '',
        season: [],
      };

      const props: ItemDialogProps = {
        testId: 'IngredientDialog',
        mode: 'edit',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          value: ingredientWithoutUnit,
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      expect(
        getByTestId('IngredientDialog::EditModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(false);
    });

    test('passes empty unit to onConfirmIngredient callback', () => {
      const ingredientWithoutUnit: ingredientTableElement = {
        id: 1,
        name: 'Salt',
        type: ingredientType.spice,
        unit: '',
        season: [],
      };

      const props: ItemDialogProps = {
        testId: 'IngredientDialog',
        mode: 'add',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          value: ingredientWithoutUnit,
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      fireEvent.press(getByTestId('IngredientDialog::AddModal::ConfirmButton'));

      expect(mockOnConfirmIngredient).toHaveBeenCalledWith('add', ingredientWithoutUnit);
    });

    test('disables confirm button when ingredient has empty name', () => {
      const invalidIngredient: ingredientTableElement = {
        name: '',
        type: ingredientType.fruit,
        unit: 'kg',
        season: [],
      };

      const props: ItemDialogProps = {
        testId: 'IngredientDialog',
        mode: 'add',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          value: invalidIngredient,
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      expect(
        getByTestId('IngredientDialog::AddModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(true);
    });

    test('enables confirm button when ingredient has valid data in add mode', () => {
      const validIngredient: ingredientTableElement = {
        name: 'Test Ingredient',
        type: ingredientType.fruit,
        unit: 'kg',
        season: [],
      };

      const props: ItemDialogProps = {
        testId: 'IngredientDialog',
        mode: 'add',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          value: validIngredient,
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      expect(
        getByTestId('IngredientDialog::AddModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(false);
    });

    test('enables confirm button in delete mode regardless of type or unit', () => {
      const invalidIngredient: ingredientTableElement = {
        name: 'Test Ingredient',
        type: ingredientType.cereal,
        unit: '',
        season: [],
      };

      const props: ItemDialogProps = {
        testId: 'IngredientDialog',
        mode: 'delete',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          value: invalidIngredient,
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      expect(
        getByTestId('IngredientDialog::DeleteModal::ConfirmButton').props.accessibilityState
          .disabled
      ).toBe(false);
    });
  });

  describe('validation for tags', () => {
    test('disables confirm button when tag has empty name in add mode', () => {
      const invalidTag: tagTableElement = {
        name: '',
      };

      const props: ItemDialogProps = {
        testId: 'TagDialog',
        mode: 'add',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          value: invalidTag,
          onConfirmTag: mockOnConfirmTag,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      expect(
        getByTestId('TagDialog::AddModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(true);
    });

    test('enables confirm button when tag has valid name in add mode', () => {
      const validTag: tagTableElement = {
        name: 'Test Tag',
      };

      const props: ItemDialogProps = {
        testId: 'TagDialog',
        mode: 'add',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          value: validTag,
          onConfirmTag: mockOnConfirmTag,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      expect(
        getByTestId('TagDialog::AddModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(false);
    });
  });

  describe('state reset', () => {
    test('updates ingredient state when dialog reopens with different ingredient', () => {
      const firstIngredient: ingredientTableElement = {
        name: 'First Ingredient',
        type: ingredientType.fruit,
        unit: 'kg',
        season: ['1', '2'],
      };

      const secondIngredient: ingredientTableElement = {
        name: 'Second Ingredient',
        type: ingredientType.vegetable,
        unit: 'pieces',
        season: ['3', '4', '5'],
      };

      const props: ItemDialogProps = {
        testId: 'IngredientDialog',
        mode: 'edit',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          value: firstIngredient,
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };

      const { getByTestId, rerender } = render(<ItemDialog {...props} />);

      expect(getByTestId('IngredientDialog::EditModal::Name::CustomTextInput').props.value).toBe(
        'First Ingredient'
      );
      expect(getByTestId('IngredientDialog::EditModal::Unit::CustomTextInput').props.value).toBe(
        'kg'
      );

      const updatedProps: ItemDialogProps = {
        ...props,
        isVisible: false,
      };
      rerender(<ItemDialog {...updatedProps} />);

      const newProps: ItemDialogProps = {
        ...props,
        isVisible: true,
        item: {
          type: 'Ingredient',
          value: secondIngredient,
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };
      rerender(<ItemDialog {...newProps} />);

      expect(getByTestId('IngredientDialog::EditModal::Name::CustomTextInput').props.value).toBe(
        'Second Ingredient'
      );
      expect(getByTestId('IngredientDialog::EditModal::Unit::CustomTextInput').props.value).toBe(
        'pieces'
      );
    });
  });

  describe('dropdown filtering', () => {
    test('renders ingredient type menu without undefined type', () => {
      const props: ItemDialogProps = {
        testId: 'IngredientDialog',
        mode: 'add',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          value: mockIngredient,
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      const menu = getByTestId('IngredientDialog::AddModal::Menu');
      expect(menu).toBeTruthy();
    });
  });

  describe('duplicate detection for tags', () => {
    beforeEach(() => {
      mockTags.length = 0;
    });

    test('shows error when tag name matches existing database tag', async () => {
      const existingTag: tagTableElement = {
        id: 99,
        name: 'Existing Tag',
      };
      mockTags.push(existingTag);

      const props: ItemDialogProps = {
        testId: 'TagDialog',
        mode: 'add',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          value: { name: 'Existing Tag' },
          onConfirmTag: mockOnConfirmTag,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(300);
      });

      expect(getByTestId('TagDialog::AddModal::HelperText')).toBeTruthy();
      expect(
        getByTestId('TagDialog::AddModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(true);
    });

    test('allows editing existing tag to keep same name', async () => {
      const existingTag: tagTableElement = {
        id: 5,
        name: 'My Tag',
      };
      mockTags.push(existingTag);

      const props: ItemDialogProps = {
        testId: 'TagDialog',
        mode: 'edit',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          value: existingTag,
          onConfirmTag: mockOnConfirmTag,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(300);
      });

      expect(
        getByTestId('TagDialog::EditModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(false);
    });

    test('no error when tag name is unique', async () => {
      // mockTags is already empty from beforeEach

      const props: ItemDialogProps = {
        testId: 'TagDialog',
        mode: 'add',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Tag',
          value: { name: 'Unique Tag' },
          onConfirmTag: mockOnConfirmTag,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(300);
      });

      expect(
        getByTestId('TagDialog::AddModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(false);
    });
  });

  describe('duplicate detection for ingredients', () => {
    beforeEach(() => {
      mockIngredients.length = 0;
    });

    test('shows error when ingredient name exactly matches existing database ingredient', async () => {
      const existingIngredient: ingredientTableElement = {
        id: 99,
        name: 'Flour',
        type: ingredientType.cereal,
        unit: 'cups',
        season: [],
      };
      mockIngredients.push(existingIngredient);

      const props: ItemDialogProps = {
        testId: 'IngredientDialog',
        mode: 'add',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          value: {
            name: 'Flour',
            type: ingredientType.cereal,
            unit: 'grams',
            season: [],
          },
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(300);
      });

      expect(getByTestId('IngredientDialog::AddModal::HelperText')).toBeTruthy();
      expect(
        getByTestId('IngredientDialog::AddModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(true);
    });

    test('shows info when ingredient name is similar but not exact', async () => {
      const similarIngredient: ingredientTableElement = {
        id: 99,
        name: 'Tomatoes',
        type: ingredientType.vegetable,
        unit: 'pieces',
        season: [],
      };
      mockIngredients.push(similarIngredient);

      const props: ItemDialogProps = {
        testId: 'IngredientDialog',
        mode: 'add',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          value: {
            name: 'Tomato',
            type: ingredientType.vegetable,
            unit: 'kg',
            season: [],
          },
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(300);
      });

      expect(getByTestId('IngredientDialog::AddModal::HelperText')).toBeTruthy();
      expect(
        getByTestId('IngredientDialog::AddModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(false);
    });

    test('allows editing existing ingredient to keep same name', async () => {
      const existingIngredient: ingredientTableElement = {
        id: 5,
        name: 'Flour',
        type: ingredientType.cereal,
        unit: 'cups',
        season: [],
      };
      mockIngredients.push(existingIngredient);

      const props: ItemDialogProps = {
        testId: 'IngredientDialog',
        mode: 'edit',
        isVisible: true,
        onClose: mockOnClose,
        item: {
          type: 'Ingredient',
          value: existingIngredient,
          onConfirmIngredient: mockOnConfirmIngredient,
        },
      };

      const { getByTestId } = render(<ItemDialog {...props} />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(300);
      });

      expect(
        getByTestId('IngredientDialog::EditModal::ConfirmButton').props.accessibilityState.disabled
      ).toBe(false);
    });
  });
});
