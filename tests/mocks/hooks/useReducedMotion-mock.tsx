export const mockUseReducedMotion = jest.fn(() => false);

export const useReducedMotionMock = () => ({
  useReducedMotion: mockUseReducedMotion,
});
