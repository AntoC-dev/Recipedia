import React from 'react';
import { act, render } from '@testing-library/react-native';
import { TutorialProvider } from '@components/organisms/TutorialController';
import {
  getMockCopilotEvents,
  getMockCopilotMethods,
  resetMockCopilot,
  setMockCopilotState,
  triggerStepChangeEvent,
  triggerStopEvent,
} from '@mocks/deps/react-native-copilot-mock';
import { mockNavigate } from '@mocks/deps/react-navigation-mock';
import { TUTORIAL_VERTICAL_OFFSET } from '@utils/Constants';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

describe('TutorialController Component', () => {
  const mockOnComplete = jest.fn();

  const renderTutorialProvider = async () => {
    const { View, Text } = require('react-native');
    jest.useFakeTimers();
    const result = render(
      <TutorialProvider onComplete={mockOnComplete}>
        <View testID='test-child'>
          <Text testID='test-child-text'>Test Child</Text>
        </View>
      </TutorialProvider>
    );
    act(() => jest.advanceTimersByTime(300));
    jest.useRealTimers();
    return result;
  };

  beforeEach(() => {
    resetMockCopilot();
    jest.clearAllMocks();
    mockOnComplete.mockClear();
  });

  test('renders CopilotProvider with children', async () => {
    setMockCopilotState({ isActive: true });

    const { getByTestId } = await renderTutorialProvider();

    expect(getByTestId('CopilotProvider')).toBeTruthy();
    expect(getByTestId('test-child')).toBeTruthy();
    expect(getByTestId('test-child-text').props.children).toBe('Test Child');
  });

  test('auto-starts tutorial when copilot is ready', async () => {
    const mockMethods = getMockCopilotMethods();
    setMockCopilotState({
      isActive: true,
      visible: false,
    });

    await renderTutorialProvider();

    expect(mockMethods.start).toHaveBeenCalled();
  });

  test('does not auto-start before 300ms delay to allow iOS layout to complete', async () => {
    const mockMethods = getMockCopilotMethods();
    setMockCopilotState({ isActive: true, visible: false });
    const { View, Text } = require('react-native');

    jest.useFakeTimers();
    render(
      <TutorialProvider onComplete={mockOnComplete}>
        <View testID='test-child'>
          <Text testID='test-child-text'>Test Child</Text>
        </View>
      </TutorialProvider>
    );

    act(() => jest.advanceTimersByTime(299));
    expect(mockMethods.start).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(1));
    expect(mockMethods.start).toHaveBeenCalled();

    jest.useRealTimers();
  });

  test('does not auto-start when tutorial is already visible', async () => {
    const mockMethods = getMockCopilotMethods();
    setMockCopilotState({
      isActive: true,
      visible: true,
    });

    await renderTutorialProvider();

    expect(mockMethods.start).not.toHaveBeenCalled();
  });

  test('sets up event listeners for copilot events', async () => {
    const mockEvents = getMockCopilotEvents();
    setMockCopilotState({ isActive: true });

    await renderTutorialProvider();

    expect(mockEvents.on).toHaveBeenCalledWith('stepChange', expect.any(Function));
    expect(mockEvents.on).toHaveBeenCalledWith('stop', expect.any(Function));
    expect(mockEvents.on).toHaveBeenCalledWith('start', expect.any(Function));
  });

  test('handles stop event with completion and navigation', async () => {
    setMockCopilotState({ isActive: true });

    await renderTutorialProvider();

    triggerStopEvent();

    expect(mockOnComplete).toHaveBeenCalled();

    // Wait for the async navigation to complete
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  test('handles stepChange event with logging', async () => {
    setMockCopilotState({ isActive: true });

    await renderTutorialProvider();

    const mockStep = { name: 'test-step', order: 1, text: 'Test step text' };
    triggerStepChangeEvent(mockStep);
  });

  test('cleans up event listeners on unmount', async () => {
    const mockEvents = getMockCopilotEvents();
    setMockCopilotState({ isActive: true });

    const { unmount } = await renderTutorialProvider();

    unmount();

    expect(mockEvents.off).toHaveBeenCalledWith('stepChange', expect.any(Function));
    expect(mockEvents.off).toHaveBeenCalledWith('stop', expect.any(Function));
    expect(mockEvents.off).toHaveBeenCalledWith('start', expect.any(Function));
  });

  test('does not set up listeners when copilot events unavailable', async () => {
    const mockEvents = getMockCopilotEvents();
    setMockCopilotState({
      isActive: true,
      copilotEvents: null,
    });

    await renderTutorialProvider();

    expect(mockEvents.on).not.toHaveBeenCalled();
  });

  test('applies correct tooltip styling and configuration', async () => {
    setMockCopilotState({ isActive: true });

    const { getByTestId } = await renderTutorialProvider();

    const copilotProvider = getByTestId('CopilotProvider');
    expect(copilotProvider.props.overlay).toBe('view');
    expect(copilotProvider.props.animated).toBe(true);
    expect(copilotProvider.props.verticalOffset).toBe(TUTORIAL_VERTICAL_OFFSET);
    expect(copilotProvider.props.tooltipStyle).toEqual({
      margin: 0,
      padding: 0,
    });
  });
});
