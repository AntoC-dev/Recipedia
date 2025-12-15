import { render } from '@testing-library/react-native';
import { TutorialStepNumber } from '@components/molecules/TutorialStepNumber';
import React from 'react';
import { setMockCopilotState, resetMockCopilot } from '@mocks/deps/react-native-copilot-mock';

describe('TutorialStepNumber', () => {
  beforeEach(() => {
    resetMockCopilot();
    setMockCopilotState({ isActive: true, currentStep: { order: 3, name: 'test', text: 'test' } });
  });

  test('renders step number from currentStep.order', () => {
    const { getByText } = render(<TutorialStepNumber />);

    expect(getByText('3')).toBeTruthy();
  });

  test('returns null when currentStep is null', () => {
    setMockCopilotState({ isActive: true, currentStep: null });
    const { toJSON } = render(<TutorialStepNumber />);

    expect(toJSON()).toBeNull();
  });

  test('renders different step numbers', () => {
    setMockCopilotState({ isActive: true, currentStep: { order: 7, name: 'test', text: 'test' } });
    const { getByText } = render(<TutorialStepNumber />);

    expect(getByText('7')).toBeTruthy();
  });
});
