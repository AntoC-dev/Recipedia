describe('Constants scroll deceleration', () => {
  const loadConstants = (disableAnimations: string | undefined) => {
    jest.resetModules();
    if (disableAnimations === undefined) {
      delete process.env.EXPO_PUBLIC_DISABLE_ANIMATIONS;
    } else {
      process.env.EXPO_PUBLIC_DISABLE_ANIMATIONS = disableAnimations;
    }
    return require('@utils/Constants');
  };

  it('stops scrolling with the gesture when animations are disabled', () => {
    const { animationsDisabled, scrollDecelerationRate } = loadConstants('true');

    expect(animationsDisabled).toBe(true);
    expect(scrollDecelerationRate).toBe(0);
  });

  it('keeps native momentum when the variable is unset', () => {
    const { animationsDisabled, scrollDecelerationRate } = loadConstants(undefined);

    expect(animationsDisabled).toBe(false);
    expect(scrollDecelerationRate).toBe('normal');
  });
});
