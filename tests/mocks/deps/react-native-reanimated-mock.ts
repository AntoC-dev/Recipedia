// TypeScript mock for react-native-reanimated
interface ReanimatedMock {
  call: () => void;
  Value: jest.MockedFunction<() => any>;
  event: jest.MockedFunction<() => any>;
  add: jest.MockedFunction<() => any>;
  eq: jest.MockedFunction<() => any>;
  set: jest.MockedFunction<() => any>;
  cond: jest.MockedFunction<() => any>;
  interpolate: jest.MockedFunction<() => any>;
  View: jest.MockedFunction<() => string>;
  Extrapolate: {
    CLAMP: jest.MockedFunction<() => any>;
  };
  Transition: {
    Together: string;
    Out: string;
    In: string;
  };
}

const Reanimated: ReanimatedMock = {
  call: () => {},
  Value: jest.fn(),
  event: jest.fn(),
  add: jest.fn(),
  eq: jest.fn(),
  set: jest.fn(),
  cond: jest.fn(),
  interpolate: jest.fn(),
  View: jest.fn(() => 'Reanimated.View'),
  Extrapolate: {
    CLAMP: jest.fn(),
  },
  Transition: {
    Together: 'Together',
    Out: 'Out',
    In: 'In',
  },
};

export default Reanimated;
