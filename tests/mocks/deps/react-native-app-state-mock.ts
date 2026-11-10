import { AppState, AppStateStatus } from 'react-native';

type AppStateChangeListener = (appState: AppStateStatus) => void;

export function mockAppStateChanges() {
  const listeners: AppStateChangeListener[] = [];
  const removeListener = jest.fn();
  const addEventListener = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type, listener) => {
      listeners.push(listener as AppStateChangeListener);
      return { remove: removeListener };
    });

  function changeAppState(appState: AppStateStatus) {
    listeners.forEach(listener => listener(appState));
  }

  return { addEventListener, removeListener, changeAppState };
}
