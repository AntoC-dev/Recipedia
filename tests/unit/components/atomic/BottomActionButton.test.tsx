import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { BottomActionButton } from '@components/atomic/BottomActionButton';
import { padding } from '@styles/spacing';

describe('BottomActionButton', () => {
  const testID = 'RecipeView';
  const buttonId = testID + '::BottomActionButton';

  test('renders the label', () => {
    const { getByTestId } = render(
      <BottomActionButton testID={testID} label='Save' onPress={jest.fn()} />
    );

    expect(getByTestId(buttonId + '::Children')).toHaveTextContent('Save');
  });

  test('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <BottomActionButton testID={testID} label='Save' onPress={onPress} />
    );

    fireEvent.press(getByTestId(buttonId));

    expect(onPress).toHaveBeenCalled();
  });

  test('awaits a promise-returning onPress without throwing', async () => {
    const onPress = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <BottomActionButton testID={testID} label='Save' onPress={onPress} />
    );

    fireEvent.press(getByTestId(buttonId));

    await waitFor(() => expect(onPress).toHaveBeenCalled());
  });

  test('is enabled by default', () => {
    const { getByTestId } = render(
      <BottomActionButton testID={testID} label='Save' onPress={jest.fn()} />
    );

    expect(getByTestId(buttonId)).toBeEnabled();
  });

  test('is disabled when the disabled prop is set', () => {
    const { getByTestId } = render(
      <BottomActionButton testID={testID} label='Save' onPress={jest.fn()} disabled={true} />
    );

    expect(getByTestId(buttonId)).toBeDisabled();
  });

  test('reserves only the standard padding when there is no bottom inset', () => {
    const { getByTestId } = render(
      <BottomActionButton testID={testID} label='Save' onPress={jest.fn()} />
    );

    expect(getByTestId(buttonId + '::Container')).toHaveStyle({ paddingBottom: padding.small });
  });

  test('adds the safe-area bottom inset on top of the standard padding', () => {
    const insets = { top: 0, right: 0, bottom: 34, left: 0 };
    const { getByTestId } = render(
      <SafeAreaInsetsContext.Provider value={insets}>
        <BottomActionButton testID={testID} label='Save' onPress={jest.fn()} />
      </SafeAreaInsetsContext.Provider>
    );

    expect(getByTestId(buttonId + '::Container')).toHaveStyle({
      paddingBottom: 34 + padding.small,
    });
  });

  test('pins itself to the bottom of the screen', () => {
    const { getByTestId } = render(
      <BottomActionButton testID={testID} label='Save' onPress={jest.fn()} />
    );

    expect(getByTestId(buttonId + '::Container')).toHaveStyle({
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    });
  });
});
