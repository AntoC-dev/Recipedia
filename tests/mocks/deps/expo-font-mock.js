export const useFonts = jest.fn(() => [true, null]);

export const loadAsync = jest.fn(() => Promise.resolve());

export default {
  useFonts,
  loadAsync,
};
