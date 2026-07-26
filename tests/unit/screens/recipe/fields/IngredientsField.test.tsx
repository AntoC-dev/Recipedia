import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { UseFormReturn } from 'react-hook-form';

import { recipeStateType } from '@customTypes/ScreenTypes';
import { ingredientType } from '@customTypes/DatabaseElementTypes';
import { RecipeFormInput } from '@schemas/recipeFormSchema';
import { RecipeIngredientsField } from '@screens/recipe/fields/IngredientsField';
import { createRecipeSnapshot } from '@screens/recipe/helpers/createRecipeSnapshot';
import {
  mockFindSimilarIngredients,
  resetUseIngredientsMocks,
  setMockIngredients,
} from '@mocks/hooks/useIngredients-mock';

import { renderWithForm, t } from './fieldsTestHarness';

type Form = UseFormReturn<RecipeFormInput>;

jest.mock('@hooks/useIngredients', () => ({
  useIngredients: require('@mocks/hooks/useIngredients-mock').useIngredientsMock,
}));
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/organisms/RecipeIngredients', () => {
  const mocks = require('@mocks/components/organisms/RecipeIngredients-mock');
  return {
    RecipeIngredients: mocks.recipeIngredientsMock,
    IngredientsTable: mocks.ingredientsTableMock,
    IngredientRow: mocks.ingredientRowMock,
    IngredientsAddEmpty: mocks.ingredientsAddEmptyMock,
    IngredientsAddTail: mocks.ingredientsAddTailMock,
  };
});

beforeEach(() => {
  resetUseIngredientsMocks();
});

describe('RecipeIngredientsField', () => {
  test('renders one IngredientRow per form ingredient', () => {
    const ingredients = [
      {
        id: 1,
        name: 'flour',
        quantity: '200',
        unit: 'g',
        type: ingredientType.cereal,
        season: [],
      },
    ];
    const { getByTestId, queryByTestId } = renderWithForm(
      RecipeIngredientsField,
      form => ({
        form,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeIngredients: ingredients }
    );
    expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
    expect(queryByTestId('RecipeIngredients::1::Row')).toBeNull();
    expect(getByTestId('RecipeIngredients::0::NameInput::Value').props.children).toBe('flour');
  });

  test('add button appends a new empty ingredient through useFieldArray', () => {
    const { getByTestId, form } = renderWithForm(RecipeIngredientsField, f => ({
      form: f,
      stackMode: recipeStateType.edit,
      openModalForField: jest.fn(),
      t,
    }));
    fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));
    expect(form.getValues('recipeIngredients')).toHaveLength(1);
  });

  test('row commit with same name writes via the field-array without invoking validation', () => {
    const ingredients = [
      {
        id: 1,
        name: 'flour',
        quantity: '200',
        unit: 'g',
        type: ingredientType.cereal,
        season: [],
      },
    ];
    const { getByTestId, form } = renderWithForm(
      RecipeIngredientsField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeIngredients: ingredients }
    );
    act(() => {
      fireEvent.press(getByTestId('RecipeIngredients::0::OnIngredientChange'), '300@@g--flour');
    });
    expect(mockFindSimilarIngredients).not.toHaveBeenCalled();
    expect(form.getValues('recipeIngredients.0.quantity')).toBe('300');
    expect(form.getValues('recipeIngredients.0.name')).toBe('flour');
  });

  test('row commit with a new name routes through the fuzzy-match validation pipeline', () => {
    const ingredients = [
      {
        id: 1,
        name: 'flour',
        quantity: '200',
        unit: 'g',
        type: ingredientType.cereal,
        season: [],
      },
    ];
    const { getByTestId } = renderWithForm(
      RecipeIngredientsField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeIngredients: ingredients }
    );
    act(() => {
      fireEvent.press(
        getByTestId('RecipeIngredients::0::OnIngredientChange'),
        '300@@g--almond flour'
      );
    });
    expect(mockFindSimilarIngredients).toHaveBeenCalledWith('almond flour');
  });

  test('surfaces row-level error once the user edits the row', async () => {
    const ingredients = [
      { name: 'flour', quantity: '200', type: ingredientType.cereal, season: [] },
    ];
    const { getByTestId, form } = renderWithForm(
      RecipeIngredientsField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeIngredients: ingredients }
    );
    await act(async () => {
      form.setValue('recipeIngredients.0.name', '', { shouldValidate: true });
    });
    await act(async () => {
      fireEvent.press(getByTestId('RecipeIngredients::0::OnIngredientChange'), '200@@g--');
    });
    expect(getByTestId('RecipeIngredients::0::Error').props.children).toBe(
      'alerts.inlineErrors.ingredientRow'
    );
  });

  test('surfaces row-level error after a quantity-only commit and blur without a name edit', async () => {
    const { getByTestId } = renderWithForm(
      RecipeIngredientsField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeIngredients: [{ name: '', quantity: '' }] }
    );
    await act(async () => {
      fireEvent.press(getByTestId('RecipeIngredients::0::OnIngredientChange'), '100@@--');
    });
    await act(async () => {
      fireEvent.press(getByTestId('RecipeIngredients::0::OnBlur'));
    });
    expect(getByTestId('RecipeIngredients::0::Error').props.children).toBe(
      'alerts.inlineErrors.ingredientRow'
    );
  });

  test('does not show row error when row is invalid but untouched', async () => {
    const ingredients = [{ name: '', quantity: '', type: undefined, season: [] }];
    const { queryByTestId, form } = renderWithForm(
      RecipeIngredientsField,
      f => ({
        form: f,
        stackMode: recipeStateType.edit,
        openModalForField: jest.fn(),
        t,
      }),
      { recipeIngredients: ingredients }
    );
    await act(async () => {
      await form.trigger('recipeIngredients');
    });
    expect(queryByTestId('RecipeIngredients::0::Error')).toBeNull();
  });

  test('surfaces row-level error inline after submit failure even without prior row edit', async () => {
    const ingredients = [{ name: '', quantity: '', type: undefined, season: [] }];
    const formRef: { form: Form | null } = { form: null };
    const { getByTestId } = renderWithForm(
      RecipeIngredientsField,
      f => {
        formRef.form = f;
        return {
          form: f,
          stackMode: recipeStateType.edit,
          editIngredients: jest.fn(),
          openModalForField: jest.fn(),
          t,
        };
      },
      { recipeIngredients: ingredients }
    );
    await act(async () => {
      await formRef.form!.handleSubmit(
        () => {},
        () => {}
      )();
    });
    expect(getByTestId('RecipeIngredients::0::Error').props.children).toBe(
      'alerts.inlineErrors.ingredientRow'
    );
  });

  describe('dropdown selection clears the row inline error', () => {
    const carrots = {
      id: 42,
      name: 'Carrots',
      quantity: '',
      unit: 'g',
      type: ingredientType.vegetable,
      season: ['6', '7', '8'],
    };

    test('selecting an existing ingredient from the dropdown populates DB metadata on a row that had no id', async () => {
      setMockIngredients([carrots]);
      mockFindSimilarIngredients.mockImplementation((name: string) =>
        name.toLowerCase() === 'carrots' ? [carrots] : []
      );
      const { getByTestId, form } = renderWithForm(
        RecipeIngredientsField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        { recipeIngredients: [{ name: '', quantity: '100' }] }
      );

      // The autocomplete dropdown fires the dedicated `onSelect` path.
      await act(async () => {
        fireEvent.press(getByTestId('RecipeIngredients::0::OnSelectName'), 'Carrots');
      });

      const row = form.getValues('recipeIngredients.0');
      expect(row.id).toBe(42);
      expect(row.type).toBe(ingredientType.vegetable);
      expect(row.season).toEqual(['6', '7', '8']);
      expect(row.quantity).toBe('100');
    });

    test('the row inline error clears after the dropdown selection resolves the ingredient', async () => {
      setMockIngredients([carrots]);
      mockFindSimilarIngredients.mockImplementation((name: string) =>
        name.toLowerCase() === 'carrots' ? [carrots] : []
      );
      const { getByTestId, queryByTestId, form } = renderWithForm(
        RecipeIngredientsField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        { recipeIngredients: [{ name: '', quantity: '100' }] }
      );

      // Dirty + validate the row so the inline error is visible (the row has a
      // quantity but no resolved name/type/season yet).
      await act(async () => {
        form.setValue('recipeIngredients.0.name', '', { shouldValidate: true });
      });
      await act(async () => {
        fireEvent.press(getByTestId('RecipeIngredients::0::OnIngredientChange'), '100@@g--');
      });
      expect(getByTestId('RecipeIngredients::0::Error').props.children).toBe(
        'alerts.inlineErrors.ingredientRow'
      );

      // Pick "Carrots" from the dropdown via the dedicated select path.
      await act(async () => {
        fireEvent.press(getByTestId('RecipeIngredients::0::OnSelectName'), 'Carrots');
      });

      await waitFor(() => {
        expect(queryByTestId('RecipeIngredients::0::Error')).toBeNull();
      });
    });
  });

  test('surfaces array-level error inline after submit failure on empty array', async () => {
    const formRef: { form: Form | null } = { form: null };
    const { getByTestId } = renderWithForm(
      RecipeIngredientsField,
      f => {
        formRef.form = f;
        return {
          form: f,
          stackMode: recipeStateType.edit,
          editIngredients: jest.fn(),
          openModalForField: jest.fn(),
          t,
        };
      },
      { recipeIngredients: [] }
    );
    await act(async () => {
      await formRef.form!.handleSubmit(
        () => {},
        () => {}
      )();
    });
    expect(getByTestId('RecipeIngredients::Error').props.children).toBe(
      'alerts.inlineErrors.titleIngredients'
    );
  });

  describe('ingredient seasonality (per-row month array)', () => {
    test('mounts a row whose seasonality came from the DB and exposes it via form state', () => {
      const ingredients = [
        {
          id: 1,
          name: 'Tomato',
          quantity: '2',
          unit: 'pcs',
          type: ingredientType.vegetable,
          season: ['3', '4', '5'],
        },
      ];
      const { getByTestId, form } = renderWithForm(
        RecipeIngredientsField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        { recipeIngredients: ingredients }
      );

      expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      expect(form.getValues('recipeIngredients.0.season')).toEqual(['3', '4', '5']);
    });

    test('writes the edited seasonality month array back via form.setValue', () => {
      const ingredients = [
        {
          id: 1,
          name: 'Tomato',
          quantity: '2',
          unit: 'pcs',
          type: ingredientType.vegetable,
          season: ['3', '4', '5'],
        },
      ];
      const { form } = renderWithForm(
        RecipeIngredientsField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        { recipeIngredients: ingredients }
      );

      act(() => {
        form.setValue('recipeIngredients.0.season', ['6', '7', '8'], { shouldDirty: true });
      });

      expect(form.getValues('recipeIngredients.0.season')).toEqual(['6', '7', '8']);
    });

    test('post-save snapshot carries the edited per-ingredient season', () => {
      const ingredients = [
        {
          id: 1,
          name: 'Tomato',
          quantity: '2',
          unit: 'pcs',
          type: ingredientType.vegetable,
          season: ['3', '4', '5'],
        },
        {
          id: 2,
          name: 'Salt',
          quantity: '5',
          unit: 'g',
          type: ingredientType.spice,
          season: [],
        },
      ];
      const { form } = renderWithForm(
        RecipeIngredientsField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        { recipeIngredients: ingredients }
      );

      act(() => {
        form.setValue('recipeIngredients.0.season', ['6', '7', '8', '9']);
      });

      const snapshot = createRecipeSnapshot(form, null);
      expect(snapshot.ingredients[0]!.season).toEqual(['6', '7', '8', '9']);
      expect(snapshot.ingredients[1]!.season).toEqual([]);
    });
  });

  test('surfaces the array-level error inline once the user removes the last row', async () => {
    const initial = [{ name: 'flour', quantity: '200', type: ingredientType.cereal, season: [] }];
    const removeIngredient = jest.fn((index: number) => {
      formRef.form?.setValue(
        'recipeIngredients',
        (formRef.form.getValues('recipeIngredients') ?? []).filter((_, i) => i !== index),
        { shouldValidate: true }
      );
    });
    const formRef: { form: Form | null } = { form: null };
    const { getByTestId } = renderWithForm(
      RecipeIngredientsField,
      f => {
        formRef.form = f;
        return {
          form: f,
          stackMode: recipeStateType.edit,
          editIngredients: jest.fn(),
          removeIngredient,
          openModalForField: jest.fn(),
          t,
        };
      },
      { recipeIngredients: initial }
    );
    await act(async () => {
      fireEvent.press(getByTestId('RecipeIngredients::0::OnRemoveIngredient'));
    });
    expect(getByTestId('RecipeIngredients::Error').props.children).toBe(
      'alerts.inlineErrors.titleIngredients'
    );
  });

  describe('read-only mode', () => {
    test('renders ingredients via the read-only organism without edit affordances', () => {
      const ingredients = [
        {
          id: 1,
          name: 'flour',
          quantity: '200',
          unit: 'g',
          type: ingredientType.cereal,
          season: [],
        },
      ];
      const { getByTestId, queryByTestId } = renderWithForm(
        RecipeIngredientsField,
        form => ({
          form,
          stackMode: recipeStateType.readOnly,
          openModalForField: jest.fn(),
          t,
        }),
        { recipeIngredients: ingredients }
      );
      expect(JSON.parse(getByTestId('RecipeIngredients::Ingredients').props.children)).toEqual(
        ingredients
      );
      expect(
        queryByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction')
      ).toBeNull();
    });

    test('falls back to an empty list when the form value is undefined', () => {
      const { getByTestId } = renderWithForm(
        RecipeIngredientsField,
        form => ({
          form,
          stackMode: recipeStateType.readOnly,
          openModalForField: jest.fn(),
          t,
        }),
        { recipeIngredients: undefined }
      );
      expect(JSON.parse(getByTestId('RecipeIngredients::Ingredients').props.children)).toEqual([]);
    });
  });

  describe('addOCR mode', () => {
    test('empty array renders the empty-state block and opens the names OCR modal', () => {
      const openModalForField = jest.fn();
      const { getByTestId } = renderWithForm(
        RecipeIngredientsField,
        f => ({
          form: f,
          stackMode: recipeStateType.addOCR,
          openModalForField,
          t,
        }),
        { recipeIngredients: [] }
      );
      expect(getByTestId('RecipeIngredients::PrefixText').props.children).toBe('ingredients: ');
      fireEvent.press(
        getByTestId('RecipeIngredients::OpenModalNames::RoundButton::OnPressFunction')
      );
      expect(openModalForField).toHaveBeenCalledWith('ingredientNames');
    });

    test('empty array manual-add button appends a row through the field array', () => {
      const { getByTestId, form } = renderWithForm(
        RecipeIngredientsField,
        f => ({
          form: f,
          stackMode: recipeStateType.addOCR,
          openModalForField: jest.fn(),
          t,
        }),
        { recipeIngredients: [] }
      );
      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));
      expect(form.getValues('recipeIngredients')).toHaveLength(1);
    });

    test('non-empty array hides the empty-state block and renders the add-tail OCR block', () => {
      const openModalForField = jest.fn();
      const ingredients = [
        {
          id: 1,
          name: 'flour',
          quantity: '200',
          unit: 'g',
          type: ingredientType.cereal,
          season: [],
        },
      ];
      const { getByTestId, queryByTestId, form } = renderWithForm(
        RecipeIngredientsField,
        f => ({
          form: f,
          stackMode: recipeStateType.addOCR,
          openModalForField,
          t,
        }),
        { recipeIngredients: ingredients }
      );
      expect(
        queryByTestId('RecipeIngredients::OpenModalNames::RoundButton::OnPressFunction')
      ).toBeNull();
      fireEvent.press(
        getByTestId('RecipeIngredients::OpenModalQuantities::RoundButton::OnPressFunction')
      );
      expect(openModalForField).toHaveBeenCalledWith('ingredientQuantities');
      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));
      expect(form.getValues('recipeIngredients')).toHaveLength(2);
    });
  });

  describe('ingredient note dialog', () => {
    const flourRow = {
      id: 1,
      name: 'flour',
      quantity: '200',
      unit: 'g',
      type: ingredientType.cereal,
      season: [],
    };

    test('opens for the pressed row prefilled with its name, and cancel closes without saving', async () => {
      const { getByTestId, queryByTestId, form } = renderWithForm(
        RecipeIngredientsField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        { recipeIngredients: [flourRow] }
      );
      fireEvent.press(getByTestId('RecipeIngredients::0::NoteButton'));
      expect(getByTestId('RecipeIngredients::NoteDialog::IngredientName').props.children).toBe(
        'flour'
      );
      await act(async () => {
        fireEvent.press(getByTestId('RecipeIngredients::NoteDialog::CancelButton'));
      });
      expect(queryByTestId('RecipeIngredients::NoteDialog::Title')).toBeNull();
      expect(form.getValues('recipeIngredients.0.note')).toBeUndefined();
    });

    test('saving writes the trimmed note back onto the focused row and closes the dialog', async () => {
      const { getByTestId, queryByTestId, form } = renderWithForm(
        RecipeIngredientsField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        { recipeIngredients: [flourRow] }
      );
      fireEvent.press(getByTestId('RecipeIngredients::0::NoteButton'));
      fireEvent.changeText(
        getByTestId('RecipeIngredients::NoteDialog::Input::CustomTextInput'),
        '  for the sauce  '
      );
      await act(async () => {
        fireEvent.press(getByTestId('RecipeIngredients::NoteDialog::SaveButton'));
      });
      expect(form.getValues('recipeIngredients.0.note')).toBe('for the sauce');
      expect(form.getValues('recipeIngredients.0.quantity')).toBe('200');
      expect(form.getValues('recipeIngredients.0.name')).toBe('flour');
      expect(queryByTestId('RecipeIngredients::NoteDialog::Title')).toBeNull();
    });

    test('saving an unnamed row with no unit falls back to blank unit, name and note', async () => {
      const { getByTestId, queryByTestId, form } = renderWithForm(
        RecipeIngredientsField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        { recipeIngredients: [{ quantity: '50' }] }
      );
      fireEvent.press(getByTestId('RecipeIngredients::0::NoteButton'));
      await act(async () => {
        fireEvent.press(getByTestId('RecipeIngredients::NoteDialog::SaveButton'));
      });
      expect(queryByTestId('RecipeIngredients::NoteDialog::Title')).toBeNull();
      expect(form.getValues('recipeIngredients.0.quantity')).toBe('50');
    });

    test('saving is a no-op once the focused row has been removed before the dialog closes', async () => {
      const { getByTestId, form } = renderWithForm(
        RecipeIngredientsField,
        f => ({
          form: f,
          stackMode: recipeStateType.edit,
          openModalForField: jest.fn(),
          t,
        }),
        { recipeIngredients: [flourRow] }
      );
      fireEvent.press(getByTestId('RecipeIngredients::0::NoteButton'));
      await act(async () => {
        fireEvent.press(getByTestId('RecipeIngredients::0::OnRemoveIngredient'));
      });
      await act(async () => {
        fireEvent.press(getByTestId('RecipeIngredients::NoteDialog::SaveButton'));
      });
      expect(form.getValues('recipeIngredients')).toHaveLength(0);
    });
  });
});
