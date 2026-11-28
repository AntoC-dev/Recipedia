import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';

import { IngredientRowField } from '@screens/recipe/fields/IngredientRow';
import { RecipeFormInput } from '@schemas/recipeFormSchema';
import { defaultValueNumber } from '@utils/Constants';
import { ingredientType } from '@customTypes/DatabaseElementTypes';

jest.mock('@components/organisms/RecipeIngredients', () => {
  const mocks = require('@mocks/components/organisms/RecipeIngredients-mock');
  return {
    RecipeIngredients: mocks.recipeIngredientsMock,
    IngredientsTable: mocks.ingredientsTableMock,
    IngredientRow: mocks.ingredientRowMock,
    IngredientsAddEmpty: mocks.ingredientsAddEmptyMock,
    IngredientsOcrButtons: mocks.ingredientsOcrButtonsMock,
  };
});

const testID = 'RecipeIngredients';

function Harness({
  countRef,
  row = { name: 'Flour', quantity: '100', unit: 'g' },
  editIngredients = jest.fn(),
  removeIngredient = jest.fn(),
  onMoveUp,
  onMoveDown,
}: {
  countRef: React.MutableRefObject<number>;
  row?: RecipeFormInput['recipeIngredients'][number];
  editIngredients?: (index: number, formatted: string) => void;
  removeIngredient?: (index: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const form = useForm<RecipeFormInput>({
    defaultValues: {
      recipeImage: '',
      recipeTitle: '',
      recipeDescription: '',
      recipeTags: [],
      recipePersons: defaultValueNumber,
      recipeIngredients: [row],
      recipePreparation: [],
      recipeTime: defaultValueNumber,
      recipeNutrition: undefined,
    } as RecipeFormInput,
  });
  return (
    <IngredientRowField
      form={form}
      index={0}
      testID={testID}
      availableIngredients={[]}
      editIngredients={editIngredients}
      removeIngredient={removeIngredient}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      openNoteDialog={jest.fn()}
      editingIngredientCountRef={countRef}
    />
  );
}

describe('IngredientRowField focus counter', () => {
  test('increments on focus and decrements on blur', async () => {
    const countRef = { current: 0 };
    const { getByTestId } = await render(<Harness countRef={countRef} />);

    await fireEvent.press(getByTestId(`${testID}::0::OnFocus`));
    expect(countRef.current).toBe(1);

    await fireEvent.press(getByTestId(`${testID}::0::OnBlur`));
    expect(countRef.current).toBe(0);
  });

  test('decrements when a focused row unmounts without blurring', async () => {
    const countRef = { current: 0 };
    const { getByTestId, unmount } = await render(<Harness countRef={countRef} />);

    await fireEvent.press(getByTestId(`${testID}::0::OnFocus`));
    expect(countRef.current).toBe(1);

    await unmount();
    expect(countRef.current).toBe(0);
  });

  test('leaves the counter untouched when an unfocused row unmounts', async () => {
    const countRef = { current: 2 };
    const { unmount } = await render(<Harness countRef={countRef} />);

    await unmount();
    expect(countRef.current).toBe(2);
  });
});

describe('IngredientRowField commit resolution', () => {
  test('routes an unchanged-name commit through editIngredients when the row is not DB-resolved', async () => {
    const countRef = { current: 0 };
    const editIngredients = jest.fn();
    const { getByTestId } = await render(
      <Harness
        countRef={countRef}
        row={{ name: 'Flour', quantity: '100', unit: 'g' }}
        editIngredients={editIngredients}
      />
    );

    await fireEvent(getByTestId(`${testID}::0::OnLiveNameChange`), 'press', 'Flour');
    await fireEvent(getByTestId(`${testID}::0::OnIngredientChange`), 'press', '100@@g--Flour');

    expect(editIngredients).toHaveBeenCalledWith(0, '100@@g--Flour');
  });

  test('does not route an unchanged-name commit through editIngredients when the row is DB-resolved', async () => {
    const countRef = { current: 0 };
    const editIngredients = jest.fn();
    const { getByTestId } = await render(
      <Harness
        countRef={countRef}
        row={{
          name: 'Flour',
          quantity: '100',
          unit: 'g',
          type: ingredientType.baking,
          season: [],
        }}
        editIngredients={editIngredients}
      />
    );

    await fireEvent(getByTestId(`${testID}::0::OnLiveNameChange`), 'press', 'Flour');
    await fireEvent(getByTestId(`${testID}::0::OnIngredientChange`), 'press', '100@@g--Flour');

    expect(editIngredients).not.toHaveBeenCalled();
  });
});

describe('IngredientRowField row actions', () => {
  test('forwards move handlers to the row', async () => {
    const onMoveUp = jest.fn();
    const onMoveDown = jest.fn();
    const { getByTestId } = await render(
      <Harness countRef={{ current: 0 }} onMoveUp={onMoveUp} onMoveDown={onMoveDown} />
    );

    await fireEvent.press(getByTestId(`${testID}::0::OnMoveUp`));
    await fireEvent.press(getByTestId(`${testID}::0::OnMoveDown`));

    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  test('leaves both move actions disabled without handlers', async () => {
    const { getByTestId } = await render(<Harness countRef={{ current: 0 }} />);

    expect(getByTestId(`${testID}::0::OnMoveUp`)).toBeDisabled();
    expect(getByTestId(`${testID}::0::OnMoveDown`)).toBeDisabled();
  });

  test('removes the row at its own index', async () => {
    const removeIngredient = jest.fn();
    const { getByTestId } = await render(
      <Harness countRef={{ current: 0 }} removeIngredient={removeIngredient} />
    );

    await fireEvent.press(getByTestId(`${testID}::0::OnRemoveIngredient`));

    expect(removeIngredient).toHaveBeenCalledWith(0);
  });
});
