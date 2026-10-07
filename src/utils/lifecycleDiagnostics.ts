import { AppState, Keyboard, KeyboardEventName } from 'react-native';
import { appLogger } from '@utils/logger';

const KEYBOARD_EVENTS: KeyboardEventName[] = [
  'keyboardWillShow',
  'keyboardDidShow',
  'keyboardWillHide',
  'keyboardDidHide',
];

/**
 * Logs app foreground/background transitions and keyboard show/hide events at debug level.
 *
 * Temporary E2E triage aid: it separates "JS never saw the keyboard hide" from "the native
 * keyboard stayed up", and shows when the app was backgrounded before the OS killed it.
 * No-op in production builds, where the debug level is dropped anyway.
 *
 * @returns Cleanup function removing every listener
 */
export const startLifecycleDiagnostics = (): (() => void) => {
  if (process.env.EXPO_PUBLIC_DATASET_TYPE === 'production') {
    return () => undefined;
  }

  const subscriptions = [
    AppState.addEventListener('change', state => {
      appLogger.debug('AppState changed', { state });
    }),
    ...KEYBOARD_EVENTS.map(eventName =>
      Keyboard.addListener(eventName, () => {
        appLogger.debug('Keyboard event', { eventName });
      })
    ),
  ];

  return () => subscriptions.forEach(subscription => subscription.remove());
};
