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

  test('renders in read-only mode with label, value and unit', () => {
    const { getByTestId, queryByTestId } = render(
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

  test('renders as sub-item with proper indentation', () => {
    const subItemLabel = 'Saturated fat';
    const subItem = 8;
    const { getByTestId, queryByTestId } = render(
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

  test('renders in editable mode with text input', () => {
    const { getByTestId, queryByTestId } = render(
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

  test('calls onValueChange when text input changes', () => {
    const localMockOnValueChange = jest.fn();

    const { getByTestId } = render(
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
    fireEvent.changeText(input, '300');
    fireEvent(input, 'onBlur');
    expect(localMockOnValueChange).toHaveBeenCalledWith('energyKcal', 300);
  });

  test('handles invalid input in editable mode', () => {
    const localMockOnValueChange = jest.fn();

    const { getByTestId } = render(
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
    fireEvent.changeText(input, 'invalid');
    fireEvent(input, 'onBlur');

    expect(localMockOnValueChange).toHaveBeenCalledWith('energyKcal', defaultValueNumber);
  });

  test('formats decimal values correctly', () => {
    const decimalValue = 2.5;
    const { getByTestId, queryByTestId } = render(
      <NutritionRow label='Fiber' value={decimalValue} unit='g' testId={defaultTestId} />
    );

    expect(queryByTestId(defaultTestId + '::NumericTextInput')).toBeNull();
    expect(getByTestId(defaultTestId + '::Text').props.children).toBe('Fiber');
    expect(getByTestId(defaultTestId + '::Value').props.children).toEqual(['2.5', ' ', 'g']);
  });

  test('rounds values with more than two decimals', () => {
    const { getByTestId } = render(
      <NutritionRow label='Salt' value={2.567} unit='g' testId={defaultTestId} />
    );

    expect(getByTestId(defaultTestId + '::Value').props.children).toEqual(['2.57', ' ', 'g']);
  });

  test('renders a comma decimal in a comma-separator region', () => {
    useCommaDecimalRegion(Localization as unknown as { getLocales: jest.Mock });

    const { getByTestId } = render(
      <NutritionRow label='Fiber' value={8.53} unit='g' testId={defaultTestId} />
    );

    expect(getByTestId(defaultTestId + '::Value').props.children).toEqual(['8,53', ' ', 'g']);
  });

  test('renders a dot decimal in a dot-separator region', () => {
    useDotDecimalRegion(Localization as unknown as { getLocales: jest.Mock });

    const { getByTestId } = render(
      <NutritionRow label='Fiber' value={8.53} unit='g' testId={defaultTestId} />
    );

    expect(getByTestId(defaultTestId + '::Value').props.children).toEqual(['8.53', ' ', 'g']);
  });

  test('formats integer values without decimals', () => {
    const { getByTestId, queryByTestId } = render(
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

  test('does not render text input when not editable even with field provided', () => {
    const { getByTestId, queryByTestId } = render(
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

  test('does not render text input when editable but no field provided', () => {
    const { getByTestId, queryByTestId } = render(
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
