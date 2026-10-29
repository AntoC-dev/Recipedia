import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NutritionEditForm } from '@components/molecules/NutritionEditForm';
import { defaultValueNumber } from '@utils/Constants';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/atomic/WrappableButton', () =>
  require('@mocks/components/atomic/WrappableButton-mock')
);

const defaultTestId = 'test';
const defaultPortionWeight = 150;
const mockOnPortionWeightChange = jest.fn();
const mockOnRemoveNutrition = jest.fn();

describe('NutritionEditForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with portion weight input', async () => {
    const { getByTestId } = await render(
      <NutritionEditForm
        portionWeight={defaultPortionWeight}
        onPortionWeightChange={mockOnPortionWeightChange}
        testId={defaultTestId}
      />
    );

    expect(getByTestId(defaultTestId)).toBeTruthy();
    expect(getByTestId(defaultTestId + '::PortionWeightText').props.children).toEqual(
      'recipe.nutrition.portionWeight'
    );
    expect(getByTestId(defaultTestId + '::PortionWeightNumericTextInput').props.value).toEqual(
      defaultPortionWeight.toString()
    );
  });

  test('calls onPortionWeightChange when weight input changes', async () => {
    const localMockOnChange = jest.fn();

    const { getByTestId } = await render(
      <NutritionEditForm
        portionWeight={100}
        onPortionWeightChange={localMockOnChange}
        testId={defaultTestId}
      />
    );

    const newWeight = 200;
    const input = getByTestId(defaultTestId + '::PortionWeightNumericTextInput');
    await fireEvent.changeText(input, newWeight.toString());
    await fireEvent(input, 'onBlur');
    expect(localMockOnChange).toHaveBeenCalledWith(newWeight);
  });

  test('handles invalid input gracefully', async () => {
    const localMockOnChange = jest.fn();

    const { getByTestId } = await render(
      <NutritionEditForm
        portionWeight={100}
        onPortionWeightChange={localMockOnChange}
        testId={defaultTestId}
      />
    );

    const input = getByTestId(defaultTestId + '::PortionWeightNumericTextInput');
    await fireEvent.changeText(input, 'invalid');
    await fireEvent(input, 'onBlur');

    expect(localMockOnChange).toHaveBeenCalledWith(defaultValueNumber);
  });

  test('shows remove button when showRemoveButton is true', async () => {
    const { getByTestId } = await render(
      <NutritionEditForm
        portionWeight={defaultPortionWeight}
        onPortionWeightChange={mockOnPortionWeightChange}
        onRemoveNutrition={mockOnRemoveNutrition}
        showRemoveButton={true}
        testId={defaultTestId}
      />
    );

    expect(getByTestId(defaultTestId)).toBeTruthy();
    expect(getByTestId(defaultTestId + '::PortionWeightText').props.children).toEqual(
      'recipe.nutrition.portionWeight'
    );
    expect(getByTestId(defaultTestId + '::PortionWeightNumericTextInput').props.value).toEqual(
      defaultPortionWeight.toString()
    );
    expect(getByTestId(defaultTestId + '::RemoveButton')).toBeTruthy();
  });

  test('does not show remove button when showRemoveButton is false', async () => {
    const { queryByTestId } = await render(
      <NutritionEditForm
        portionWeight={defaultPortionWeight}
        onPortionWeightChange={mockOnPortionWeightChange}
        showRemoveButton={false}
        testId={defaultTestId}
      />
    );

    expect(queryByTestId(defaultTestId + '::RemoveButton')).toBeNull();
  });

  test('calls onRemoveNutrition when remove button pressed', async () => {
    const localMockOnRemove = jest.fn();

    const { getByTestId } = await render(
      <NutritionEditForm
        portionWeight={defaultPortionWeight}
        onPortionWeightChange={mockOnPortionWeightChange}
        onRemoveNutrition={localMockOnRemove}
        showRemoveButton={true}
        testId={defaultTestId}
      />
    );

    await fireEvent.press(getByTestId(defaultTestId + '::RemoveButton'));
    expect(localMockOnRemove).toHaveBeenCalled();
  });

  test('renders with custom testId', async () => {
    const customTestId = 'CustomTest';
    const { getByTestId } = await render(
      <NutritionEditForm
        portionWeight={defaultPortionWeight}
        onPortionWeightChange={mockOnPortionWeightChange}
        testId={customTestId}
      />
    );

    expect(getByTestId(customTestId)).toBeTruthy();
    expect(getByTestId(customTestId + '::PortionWeightText').props.children).toEqual(
      'recipe.nutrition.portionWeight'
    );
    expect(getByTestId(customTestId + '::PortionWeightNumericTextInput').props.value).toEqual(
      defaultPortionWeight.toString()
    );
  });
});
