import { Keyboard } from 'react-native';

type BlurrableInput = { props: { onBlur?: () => void } };

/**
 * Models the native side effect of `Keyboard.dismiss()`: the focused TextInput loses focus.
 * The jest TextInput is a mocked host component that never registers with TextInputState,
 * so the real `dismiss` cannot blur anything on its own.
 */
export function blurFocusedInputOnKeyboardDismiss(getFocusedInput: () => BlurrableInput) {
  return jest
    .spyOn(Keyboard, 'dismiss')
    .mockImplementation(() => getFocusedInput().props.onBlur?.());
}
