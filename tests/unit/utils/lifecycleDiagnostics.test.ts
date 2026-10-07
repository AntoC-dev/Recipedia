import { AppState, Keyboard } from 'react-native';
import { startLifecycleDiagnostics } from '@utils/lifecycleDiagnostics';
import { appLogger } from '@utils/logger';

describe('startLifecycleDiagnostics', () => {
  const originalDatasetType = process.env.EXPO_PUBLIC_DATASET_TYPE;
  let appStateRemove: jest.Mock;
  let keyboardRemove: jest.Mock;
  let appStateListen: jest.SpyInstance;
  let keyboardListen: jest.SpyInstance;
  let debugLog: jest.SpyInstance;

  beforeEach(() => {
    appStateRemove = jest.fn();
    keyboardRemove = jest.fn();
    appStateListen = jest
      .spyOn(AppState, 'addEventListener')
      .mockReturnValue({ remove: appStateRemove });
    keyboardListen = jest
      .spyOn(Keyboard, 'addListener')
      .mockReturnValue({ remove: keyboardRemove } as never);
    debugLog = jest.spyOn(appLogger, 'debug').mockImplementation(() => undefined);
    process.env.EXPO_PUBLIC_DATASET_TYPE = 'test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.EXPO_PUBLIC_DATASET_TYPE = originalDatasetType;
  });

  test('registers an AppState listener and the four keyboard listeners', () => {
    startLifecycleDiagnostics();

    expect(appStateListen).toHaveBeenCalledWith('change', expect.any(Function));
    expect(keyboardListen.mock.calls.map(([eventName]) => eventName)).toEqual([
      'keyboardWillShow',
      'keyboardDidShow',
      'keyboardWillHide',
      'keyboardDidHide',
    ]);
  });

  test('logs the new app state on change', () => {
    startLifecycleDiagnostics();

    appStateListen.mock.calls[0][1]('background');

    expect(debugLog).toHaveBeenCalledWith('AppState changed', { state: 'background' });
  });

  test('logs the event name on a keyboard event', () => {
    startLifecycleDiagnostics();

    keyboardListen.mock.calls[3][1]();

    expect(debugLog).toHaveBeenCalledWith('Keyboard event', { eventName: 'keyboardDidHide' });
  });

  test('cleanup removes every listener', () => {
    const stop = startLifecycleDiagnostics();

    stop();

    expect(appStateRemove).toHaveBeenCalledTimes(1);
    expect(keyboardRemove).toHaveBeenCalledTimes(4);
  });

  test('registers nothing in production', () => {
    process.env.EXPO_PUBLIC_DATASET_TYPE = 'production';

    const stop = startLifecycleDiagnostics();
    stop();

    expect(appStateListen).not.toHaveBeenCalled();
    expect(keyboardListen).not.toHaveBeenCalled();
  });
});
