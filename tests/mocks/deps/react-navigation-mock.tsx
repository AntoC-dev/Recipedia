export const mockNavigate = jest.fn();
export const mockAddListener = jest.fn((event, handler) => {
  if (event === 'state') {
    setTimeout(() => handler(), 0);
  }
  return jest.fn();
});

export const mockGoBack = jest.fn();
export const mockDispatch = jest.fn();

let mockRouteParams: Record<string, unknown> = {};

export function setMockRouteParams(params: Record<string, unknown>) {
  mockRouteParams = params;
}

export function resetMockRouteParams() {
  mockRouteParams = {};
}

type PreventRemoveCallback = (options: { data: { action: unknown } }) => void;

let preventRemoveRegistration: {
  preventRemove: boolean;
  callback: PreventRemoveCallback;
} | null = null;

export function triggerPreventRemove(action: unknown = { type: 'GO_BACK' }) {
  if (!preventRemoveRegistration?.preventRemove) {
    return false;
  }
  preventRemoveRegistration.callback({ data: { action } });
  return true;
}

export function isPreventRemoveArmed() {
  return preventRemoveRegistration?.preventRemove ?? false;
}

export function resetPreventRemove() {
  preventRemoveRegistration = null;
}

export function reactNavigationMock() {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      addListener: mockAddListener,
      goBack: mockGoBack,
      dispatch: mockDispatch,
    }),
    useRoute: () => ({
      params: mockRouteParams,
    }),
    useFocusEffect: jest.fn(() => {}),
    useIsFocused: () => true,
    usePreventRemove: (preventRemove: boolean, callback: PreventRemoveCallback) => {
      preventRemoveRegistration = { preventRemove, callback };
    },
    CommonActions: {
      ...actual.CommonActions,
      reset: jest.fn(config => actual.CommonActions.reset(config)),
    },
  };
}

export const mockNavigationFunctions = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => false),
  dispatch: jest.fn(),
  getState: jest.fn(),
  getParent: jest.fn(),
  setParams: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn((event, handler) => {
    if (event === 'focus') {
      setTimeout(() => handler(), 10);
    }
    return jest.fn();
  }),
  removeListener: jest.fn(),
  getId: jest.fn(() => 'mock-id'),
};
