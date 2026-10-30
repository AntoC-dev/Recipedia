import { renderHook } from '@testing-library/react-native';
import { useSafeCopilot } from '@hooks/useSafeCopilot';
import { resetMockCopilot } from '@mocks/deps/react-native-copilot-mock';

describe('useSafeCopilot Hook', () => {
  const { useCopilot } = require('react-native-copilot');

  const mockCopilotData = {
    currentStep: { order: 1, name: 'test-step', text: 'Test step' },
    isFirstStep: true,
    isLastStep: false,
    visible: true,
    start: jest.fn(),
    stop: jest.fn(),
    goToNext: jest.fn(),
    goToPrev: jest.fn(),
    copilotEvents: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  };

  const mockMiddleStepData = {
    currentStep: { order: 2, name: 'middle-step', text: 'Middle step' },
    isFirstStep: false,
    isLastStep: false,
    visible: true,
    start: jest.fn(),
    stop: jest.fn(),
    goToNext: jest.fn(),
    goToPrev: jest.fn(),
    copilotEvents: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  };

  const mockLastStepData = {
    currentStep: { order: 3, name: 'last-step', text: 'Last step' },
    isFirstStep: false,
    isLastStep: true,
    visible: true,
    start: jest.fn(),
    stop: jest.fn(),
    goToNext: jest.fn(),
    goToPrev: jest.fn(),
    copilotEvents: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  };

  const mockNoCurrentStepData = {
    currentStep: null,
    isFirstStep: true,
    isLastStep: false,
    visible: false,
    start: jest.fn(),
    stop: jest.fn(),
    goToNext: jest.fn(),
    goToPrev: jest.fn(),
    copilotEvents: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  };

  beforeEach(() => {
    resetMockCopilot();
  });

  test('returns copilot data when CopilotProvider is available', async () => {
    useCopilot.mockReturnValue(mockCopilotData);

    const { result } = await renderHook(() => useSafeCopilot());

    const copilotSafeResult = result.current!;
    expect(copilotSafeResult.currentStep).toEqual(mockCopilotData.currentStep);
    expect(copilotSafeResult.isFirstStep).toBe(mockCopilotData.isFirstStep);
    expect(copilotSafeResult.isLastStep).toBe(mockCopilotData.isLastStep);
    expect(copilotSafeResult.visible).toBe(mockCopilotData.visible);
    expect(typeof copilotSafeResult.start).toBe('function');
    expect(typeof copilotSafeResult.stop).toBe('function');
    expect(typeof copilotSafeResult.goToNext).toBe('function');
    expect(typeof copilotSafeResult.goToPrev).toBe('function');
  });

  test('returns null when CopilotProvider is not available', async () => {
    useCopilot.mockImplementation(() => {
      throw new Error('useCopilot must be used within CopilotProvider');
    });

    const { result } = await renderHook(() => useSafeCopilot());
    expect(result.current).toBeNull();
  });

  test('returns null when useCopilot throws an error', async () => {
    useCopilot.mockImplementation(() => {
      throw new Error('useCopilot must be used within CopilotProvider');
    });

    const { result } = await renderHook(() => useSafeCopilot());
    expect(result.current).toBeNull();
  });

  test('handles different copilot states correctly', async () => {
    // Test with tutorial in progress
    useCopilot.mockReturnValue(mockMiddleStepData);

    const { result: result1 } = await renderHook(() => useSafeCopilot());

    const copilotResult1 = result1.current!;
    expect(copilotResult1.isFirstStep).toBe(mockMiddleStepData.isFirstStep);
    expect(copilotResult1.isLastStep).toBe(mockMiddleStepData.isLastStep);
    expect(copilotResult1.currentStep!.order).toBe(mockMiddleStepData.currentStep.order);

    // Test with last step
    useCopilot.mockReturnValue(mockLastStepData);

    const { result: result2 } = await renderHook(() => useSafeCopilot());

    const copilotResult2 = result2.current!;
    expect(copilotResult2.isFirstStep).toBe(mockLastStepData.isFirstStep);
    expect(copilotResult2.isLastStep).toBe(mockLastStepData.isLastStep);
    expect(copilotResult2.currentStep!.order).toBe(mockLastStepData.currentStep.order);
  });

  test('provides access to copilot events when available', async () => {
    useCopilot.mockReturnValue(mockCopilotData);

    const { result } = await renderHook(() => useSafeCopilot());

    const copilotSafeResult = result.current!;
    expect(copilotSafeResult.copilotEvents).toBeTruthy();
    expect(typeof copilotSafeResult.copilotEvents!.on).toBe('function');
    expect(typeof copilotSafeResult.copilotEvents!.off).toBe('function');
    expect(typeof copilotSafeResult.copilotEvents!.emit).toBe('function');
  });

  test('maintains consistency across multiple calls when provider available', async () => {
    useCopilot.mockReturnValue(mockCopilotData);

    const { result: result1 } = await renderHook(() => useSafeCopilot());
    const { result: result2 } = await renderHook(() => useSafeCopilot());

    const copilotResult1 = result1.current!;
    const copilotResult2 = result2.current!;
    expect(copilotResult1).toEqual(copilotResult2);
  });

  test('maintains consistency across multiple calls when provider unavailable', async () => {
    useCopilot.mockImplementation(() => {
      throw new Error('useCopilot must be used within CopilotProvider');
    });

    const { result: result1 } = await renderHook(() => useSafeCopilot());
    const { result: result2 } = await renderHook(() => useSafeCopilot());

    expect(result1.current).toBe(null);
    expect(result2.current).toBe(null);
  });

  test('handles edge case with no current step', async () => {
    useCopilot.mockReturnValue(mockNoCurrentStepData);

    const { result } = await renderHook(() => useSafeCopilot());

    const copilotSafeResult = result.current!;
    expect(copilotSafeResult).toBeTruthy();
    expect(copilotSafeResult.currentStep).toBe(mockNoCurrentStepData.currentStep);
    expect(copilotSafeResult.visible).toBe(mockNoCurrentStepData.visible);
  });
});
