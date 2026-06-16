import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TutorialTooltip } from '@components/molecules/TutorialTooltip';
import { mockNavigate } from '@mocks/deps/react-navigation-mock';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

describe('TutorialTooltip Component', () => {
  const { useCopilot } = require('react-native-copilot');

  const mockHomeStep = { order: 1, name: 'Home', text: 'First step' };
  const mockSearchStep = { order: 2, name: 'Search', text: 'Middle step' };
  const mockShoppingStep = { order: 3, name: 'Shopping', text: 'Last step' };
  const mockLastStep = { order: 5, name: 'Parameters', text: 'Last step' };

  const defaultMockFirstStepData = {
    currentStep: mockHomeStep,
    isFirstStep: true,
    isLastStep: false,
    goToNext: jest.fn().mockResolvedValue(undefined),
    goToPrev: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
  };

  const defaultMockData = {
    currentStep: mockHomeStep,
    isFirstStep: false,
    isLastStep: false,
    goToNext: jest.fn().mockResolvedValue(undefined),
    goToPrev: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function assertTooltipContent(
    getByTestId: (testId: string) => React.ReactElement,
    queryByTestId: (testId: string) => React.ReactElement,
    currentStep: number,
    isLastStep: boolean = false
  ) {
    expect(getByTestId('TutorialTooltip')).toBeTruthy();

    let expectedString = '';
    switch (currentStep) {
      case 1:
        expectedString = 'First';
        break;
      case 2:
        expectedString = 'Middle';
        break;
      case 3:
        expectedString = 'Last';
        if (isLastStep) {
          expectedString += ' valid';
        }
        break;
    }
    expect(
      (
        getByTestId('TutorialTooltip::Text').props as {
          children: string;
        }
      ).children
    ).toEqual(`${expectedString} step`);

    if (currentStep === 1) {
      expect(queryByTestId('TutorialTooltip::Previous')).toBeNull();
    } else {
      expect(getByTestId('TutorialTooltip::Previous')).toBeTruthy();
    }

    expect(getByTestId('TutorialTooltip::Skip')).toBeTruthy();
    expect(getByTestId('TutorialTooltip::Next')).toBeTruthy();
  }

  test('returns null when copilot data is not available', () => {
    useCopilot.mockImplementation(() => {
      throw new Error('useCopilot must be used within CopilotProvider');
    });

    const { queryByTestId } = render(<TutorialTooltip />);
    expect(queryByTestId('tutorial-tooltip')).toBeNull();
  });

  test('returns null when no current step is available', () => {
    useCopilot.mockReturnValue({ ...defaultMockFirstStepData, currentStep: null });

    const { queryByTestId } = render(<TutorialTooltip />);
    expect(queryByTestId('tutorial-tooltip')).toBeNull();
  });

  test('shows only skip and next buttons on first step', () => {
    useCopilot.mockReturnValue(defaultMockFirstStepData);

    const { getByTestId, queryByTestId } = render(<TutorialTooltip />);

    assertTooltipContent(getByTestId, queryByTestId, mockHomeStep.order);
  });

  test('shows all buttons on middle step', () => {
    useCopilot.mockReturnValue({ ...defaultMockData, currentStep: mockSearchStep });

    const { getByTestId, queryByTestId } = render(<TutorialTooltip />);

    assertTooltipContent(getByTestId, queryByTestId, mockSearchStep.order);
  });

  test('shows finish button on last step', () => {
    useCopilot.mockReturnValue({ ...defaultMockData, currentStep: mockShoppingStep });

    const { getByTestId, queryByTestId } = render(<TutorialTooltip />);
    assertTooltipContent(getByTestId, queryByTestId, mockShoppingStep.order);
  });

  test('calls stop when skip button is pressed', () => {
    const mockStop = jest.fn();
    useCopilot.mockReturnValue({ ...defaultMockFirstStepData, stop: mockStop });

    const { getByTestId } = render(<TutorialTooltip />);

    fireEvent.press(getByTestId('TutorialTooltip::Skip'));
    expect(mockStop).toHaveBeenCalled();
  });

  test('calls stop when finish button is pressed', () => {
    const mockStop = jest.fn();
    useCopilot.mockReturnValue({
      ...defaultMockData,
      currentStep: mockLastStep,
      stop: mockStop,
    });

    const { getByTestId } = render(<TutorialTooltip />);

    fireEvent.press(getByTestId('TutorialTooltip::Next'));
    expect(mockStop).toHaveBeenCalled();
  });

  test('navigates to next screen when next is pressed', async () => {
    useCopilot.mockReturnValue(defaultMockData);

    const { getByTestId } = render(<TutorialTooltip />);

    fireEvent.press(getByTestId('TutorialTooltip::Next'));
    await Promise.resolve();
    expect(mockNavigate).toHaveBeenCalledWith('Search');
  });

  test('navigates to previous screen when previous is pressed', async () => {
    useCopilot.mockReturnValue({ ...defaultMockData, currentStep: mockSearchStep });

    const { getByTestId } = render(<TutorialTooltip />);

    fireEvent.press(getByTestId('TutorialTooltip::Previous'));
    await Promise.resolve();
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  test('advances the step when moving to a non-self-advancing screen', () => {
    const mockGoToNext = jest.fn().mockResolvedValue(undefined);
    useCopilot.mockReturnValue({
      ...defaultMockData,
      currentStep: mockSearchStep,
      goToNext: mockGoToNext,
    });

    const { getByTestId } = render(<TutorialTooltip />);

    fireEvent.press(getByTestId('TutorialTooltip::Next'));

    expect(mockNavigate).toHaveBeenCalledWith('Menu');
    expect(mockGoToNext).toHaveBeenCalled();
  });

  test('does not advance the step when navigating to the self-advancing Search screen', () => {
    const mockGoToNext = jest.fn().mockResolvedValue(undefined);
    useCopilot.mockReturnValue({
      ...defaultMockData,
      currentStep: mockHomeStep,
      goToNext: mockGoToNext,
    });

    const { getByTestId } = render(<TutorialTooltip />);

    fireEvent.press(getByTestId('TutorialTooltip::Next'));

    expect(mockNavigate).toHaveBeenCalledWith('Search');
    expect(mockGoToNext).not.toHaveBeenCalled();
  });

  test('renders correctly with valid step order', () => {
    useCopilot.mockReturnValue({
      currentStep: { ...mockShoppingStep, text: 'Last valid step' },
      isFirstStep: false,
      isLastStep: true,
      goToNext: jest.fn().mockResolvedValue(undefined),
      goToPrev: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn(),
    });

    const { getByTestId, queryByTestId } = render(<TutorialTooltip />);
    assertTooltipContent(getByTestId, queryByTestId, mockShoppingStep.order, true);
  });
});
