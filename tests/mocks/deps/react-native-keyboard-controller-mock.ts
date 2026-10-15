const libraryMock = jest.requireActual('react-native-keyboard-controller/jest');

module.exports = {
  ...libraryMock,
  KeyboardControllerNative: {
    viewPositionInWindow: jest.fn(async () => ({ x: 0, y: 0, width: 0, height: 0 })),
  },
};
