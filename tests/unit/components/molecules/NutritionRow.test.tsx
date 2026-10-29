import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NutritionRow } from '@components/molecules/NutritionRow';
import { defaultValueNumber } from '@utils/Constants';

import * as Localization from 'expo-localization';
import { useCommaDecimalRegion, useDotDecimalRegion } from '@mocks/deps/expo-localization-mock';

jest.mock('expo-localization', () =>
  require('@mocks/deps/expo-localization-mock').expoLocalizationMock()
);

const defaultTestId = 'test';
const defaultLabel = 'Energy';
const defaultValue = 250;
const defaultUnit = 'kcal';
const mockOnValueChange = jest.fn();

describe('NutritionRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders in read-only mode with label, value and unit', async () => {
    const { getByTestId, queryByTestId } = await render(
      <NutritionRow
        label={defaultLabel}
        value={defaultValue}
        unit={defaultUnit}
        testId={defaultTestId}
      />
    );

    expect(queryByTestId(defaultTestId + '::NumericTextInput')).toBeNull();
    expect(getByTestId(defaultTestId + '::Text').props.children).toBe(defaultLabel);
    expect(getByTestId(defaultTestId + '::Value').props.children).toEqual(['250', ' ', 'kcal']);
  });

  test('renders as sub-item with proper indentation', async () => {
    const subItemLabel = 'Saturated fat';
    const subItem = 8;
    const { getByTestId, queryByTestId } = await render(
      <NutritionRow
        label={subItemLabel}
        value={subItem}
        unit='g'
        isSubItem={true}
        testId={defaultTestId}
      />
    );

    expect(queryByTestId(defaultTestId + '::NumericTextInput')).toBeNull();
    expect(getByTestId(defaultTestId + '::Text').props.children).toBe(subItemLabel);
    expect(getByTestId(defaultTestId + '::Value').props.children).toEqual([
      subItem.toString(),
      ' ',
      'g',
    ]);
  });

  test('renders in editable mode with text input', async () => {
    const { getByTestId, queryByTestId } = await render(
      <NutritionRow
        label={defaultLabel}
        value={defaultValue}
        unit={defaultUnit}
        isEditable={true}
        field='energyKcal'
        onValueChange={mockOnValueChange}
        testId={defaultTestId}
      />
    );

    expect(queryByTestId(defaultTestId + '::Value')).toBeNull();
    expect(getByTestId(defaultTestId + '::Text').props.children).toBe(defaultLabel);
    expect(getByTestId(defaultTestId + '::NumericTextInput').props.value).toBe('250');
  });

  test('calls onValueChange when text input changes', async () => {
    const localMockOnValueChange = jest.fn();

    const { getByTestId } = await render(
      <NutritionRow
        label={defaultLabel}
        value={defaultValue}
        unit={defaultUnit}
        isEditable={true}
        field='energyKcal'
        onValueChange={localMockOnValueChange}
        testId={defaultTestId}
      />
    );

    const input = getByTestId(defaultTestId + '::NumericTextInput');
    await fireEvent.changeText(input, '300');
    await fireEvent(input, 'onBlur');
    expect(localMockOnValueChange).toHaveBeenCalledWith('energyKcal', 300);
  });

  test('handles invalid input in editable mode', async () => {
    const localMockOnValueChange = jest.fn();

    const { getByTestId } = await render(
      <NutritionRow
        label={defaultLabel}
        value={defaultValue}
        unit={defaultUnit}
        isEditable={true}
        field='energyKcal'
        onValueChange={localMockOnValueChange}
        testId={defaultTestId}
      />
    );

    const input = getByTestId(defaultTestId + '::NumericTextInput');
    await fireEvent.changeText(input, 'invalid');
    await fireEvent(input, 'onBlur');

    expect(localMockOnValueChange).toHaveBeenCalledWith('energyKcal', defaultValueNumber);
  });

  test('formats decimal values correctly', async () => {
    const decimalValue = 2.5;
    const { getByTestId, queryByTestId } = await render(
      <NutritionRow label='Fiber' value={decimalValue} unit='g' testId={defaultTestId} />
    );

    expect(queryByTestId(defaultTestId + '::NumericTextInput')).toBeNull();
    expect(getByTestId(defaultTestId + '::Text').props.children).toBe('Fiber');
    expect(getByTestId(defaultTestId + '::Value').props.children).toEqual(['2.5', ' ', 'g']);
  });

  test('rounds values with more than two decimals', async () => {
    const { getByTestId } = await render(
      <NutritionRow label='Salt' value={2.567} unit='g' testId={defaultTestId} />
    );

    expect(getByTestId(defaultTestId + '::Value').props.children).toEqual(['2.57', ' ', 'g']);
  });

  test('renders a comma decimal in a comma-separator region', async () => {
    useCommaDecimalRegion(Localization as unknown as { getLocales: jest.Mock });

    const { getByTestId } = await render(
      <NutritionRow label='Fiber' value={8.53} unit='g' testId={defaultTestId} />
    );

    expect(getByTestId(defaultTestId + '::Value').props.children).toEqual(['8,53', ' ', 'g']);
  });

  test('renders a dot decimal in a dot-separator region', async () => {
    useDotDecimalRegion(Localization as unknown as { getLocales: jest.Mock });

    const { getByTestId } = await render(
      <NutritionRow label='Fiber' value={8.53} unit='g' testId={defaultTestId} />
    );

    expect(getByTestId(defaultTestId + '::Value').props.children).toEqual(['8.53', ' ', 'g']);
  });

  test('formats integer values without decimals', async () => {
    const { getByTestId, queryByTestId } = await render(
      <NutritionRow
        label={defaultLabel}
        value={defaultValue}
        unit={defaultUnit}
        testId={defaultTestId}
      />
    );

    expect(queryByTestId(defaultTestId + '::NumericTextInput')).toBeNull();
    expect(getByTestId(defaultTestId + '::Text').props.children).toBe(defaultLabel);
    expect(getByTestId(defaultTestId + '::Value').props.children).toEqual([
      defaultValue.toString(),
      ' ',
      'kcal',
    ]);
  });

  test('does not render text input when not editable even with field provided', async () => {
    const { getByTestId, queryByTestId } = await render(
      <NutritionRow
        label={defaultLabel}
        value={defaultValue}
        unit={defaultUnit}
        isEditable={false}
        field='energyKcal'
        testId={defaultTestId}
      />
    );

    expect(getByTestId(defaultTestId + '::Text')).toBeTruthy();
    expect(getByTestId(defaultTestId + '::Value')).toBeTruthy();
    expect(queryByTestId(defaultTestId + '::NumericTextInput')).toBeNull();
  });

  test('does not render text input when editable but no field provided', async () => {
    const { getByTestId, queryByTestId } = await render(
      <NutritionRow
        label={defaultLabel}
        value={defaultValue}
        unit={defaultUnit}
        isEditable={true}
        testId={defaultTestId}
      />
    );

    expect(getByTestId(defaultTestId + '::Text')).toBeTruthy();
    expect(getByTestId(defaultTestId + '::Value')).toBeTruthy();
    expect(queryByTestId(defaultTestId + '::NumericTextInput')).toBeNull();
  });
});
