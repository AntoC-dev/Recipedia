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

export function reactNavigationMock() {
  return {
    ...jest.requireActual('@react-navigation/native'),
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
    CommonActions: {
      reset: jest.fn(config => ({ type: 'reset', ...config })),
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
