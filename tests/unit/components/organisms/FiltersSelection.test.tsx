import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { FiltersSelection, FiltersSelectionProps } from '@components/organisms/FiltersSelection';
import {
  getMockCopilotEvents,
  resetMockCopilot,
  setMockCopilotState,
  triggerStepChangeEvent,
  triggerStopEvent,
} from '@mocks/deps/react-native-copilot-mock';
import { mockUseReducedMotion } from '@mocks/hooks/useReducedMotion-mock';
import { TUTORIAL_DEMO_INTERVAL, TUTORIAL_STEPS } from '@utils/Constants';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

jest.mock('@hooks/useReducedMotion', () =>
  require('@mocks/hooks/useReducedMotion-mock').useReducedMotionMock()
);

describe('FiltersSelection Component', () => {
  const mockSetAddingAFilter = jest.fn();
  const mockOnRemoveFilter = jest.fn();

  const defaultProps: FiltersSelectionProps = {
    testId: 'FiltersSelection',
    filters: ['Italian', 'Vegetarian'],
    addingFilterMode: false,
    setAddingAFilter: mockSetAddingAFilter,
    onRemoveFilter: mockOnRemoveFilter,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with filters', () => {
    const { getByTestId } = render(<FiltersSelection {...defaultProps} />);

    // Check that filter chips are rendered with correct text
    expect(getByTestId('FiltersSelection::FiltersSelection::0::Chip')).toBeTruthy();
    expect(getByTestId('FiltersSelection::FiltersSelection::0::Chip::Children')).toHaveTextContent(
      'Italian'
    );
    expect(getByTestId('FiltersSelection::FiltersSelection::1::Chip')).toBeTruthy();
    expect(getByTestId('FiltersSelection::FiltersSelection::1::Chip::Children')).toHaveTextContent(
      'Vegetarian'
    );

    // Check toggle button exists and shows correct text for adding filters
    expect(getByTestId('FiltersSelection::FiltersToggleButtons')).toBeTruthy();
    expect(getByTestId('FiltersSelection::FiltersToggleButtons')).toHaveTextContent('addFilter');
  });

  test('toggles filter mode on button press', () => {
    const { getByTestId } = render(<FiltersSelection {...defaultProps} />);

    // Should show "Add Filter" button when not in adding mode
    expect(getByTestId('FiltersSelection::FiltersToggleButtons')).toHaveTextContent('addFilter');

    fireEvent.press(getByTestId('FiltersSelection::FiltersToggleButtons'));
    expect(mockSetAddingAFilter).toHaveBeenCalledWith(expect.any(Function));
  });

  test('shows show results button when in adding filter mode', () => {
    const props = { ...defaultProps, addingFilterMode: true };
    const { getByTestId } = render(<FiltersSelection {...props} />);

    // Should show "See Filter Result" button when in adding mode
    expect(getByTestId('FiltersSelection::FiltersToggleButtons')).toHaveTextContent(
      'seeFilterResult'
    );

    fireEvent.press(getByTestId('FiltersSelection::FiltersToggleButtons'));
    expect(mockSetAddingAFilter).toHaveBeenCalledWith(expect.any(Function));
  });

  test('calls onRemoveFilter when filter is removed', () => {
    const { getByTestId } = render(<FiltersSelection {...defaultProps} />);

    // Check that filter chips exist and have correct text
    expect(getByTestId('FiltersSelection::FiltersSelection::0::Chip::Children')).toHaveTextContent(
      'Italian'
    );
    expect(getByTestId('FiltersSelection::FiltersSelection::1::Chip::Children')).toHaveTextContent(
      'Vegetarian'
    );

    // Click on the remove button of the first filter
    fireEvent.press(getByTestId('FiltersSelection::FiltersSelection::0::Chip'));
    expect(mockOnRemoveFilter).toHaveBeenCalledWith('Italian');

    // Click on the remove button of the second filter
    fireEvent.press(getByTestId('FiltersSelection::FiltersSelection::1::Chip'));
    expect(mockOnRemoveFilter).toHaveBeenCalledWith('Vegetarian');
  });

  test('renders correctly with empty filters', () => {
    const props = { ...defaultProps, filters: [] };
    const { getByTestId, queryByTestId } = render(<FiltersSelection {...props} />);

    // Should not render any filter chips
    expect(queryByTestId('FiltersSelection::FiltersSelection::0::Chip')).toBeNull();

    // But should still render the toggle button
    expect(getByTestId('FiltersSelection::FiltersToggleButtons')).toBeTruthy();
    expect(getByTestId('FiltersSelection::FiltersToggleButtons')).toHaveTextContent('addFilter');
  });

  describe('In Tutorial Mode', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      resetMockCopilot();
      mockUseReducedMotion.mockReturnValue(false);
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test('does not run the demo when reduced motion is enabled', () => {
      mockUseReducedMotion.mockReturnValue(true);
      setMockCopilotState({
        isActive: true,
        currentStep: { order: TUTORIAL_STEPS.Search.order, name: 'Search', text: 'Search step' },
      });

      render(<FiltersSelection {...defaultProps} />);

      jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL * 2);

      expect(mockSetAddingAFilter).not.toHaveBeenCalled();
    });

    test('renders the toggle button without owning a copilot step when copilot is available', () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: TUTORIAL_STEPS.Search.order, name: 'Search', text: 'Search step' },
      });
      const { getByTestId, queryByTestId } = render(<FiltersSelection {...defaultProps} />);

      expect(queryByTestId('CopilotStep::Search')).toBeNull();
      expect(getByTestId('FiltersSelection::FiltersToggleButtons')).toBeTruthy();
      expect(getByTestId('FiltersSelection::FiltersToggleButtons')).toHaveTextContent('addFilter');
    });
    test('renders the toggle button when copilot is not available', () => {
      setMockCopilotState({ isActive: false });

      const { getByTestId } = render(<FiltersSelection {...defaultProps} />);

      expect(getByTestId('FiltersSelection::FiltersToggleButtons')).toBeTruthy();
      expect(getByTestId('FiltersSelection::FiltersToggleButtons')).toHaveTextContent('addFilter');
    });

    test('starts demo when current step matches Search step', async () => {
      const mockEvents = getMockCopilotEvents();
      setMockCopilotState({
        isActive: true,
        currentStep: { order: TUTORIAL_STEPS.Search.order, name: 'Search', text: 'Search step' },
      });

      render(<FiltersSelection {...defaultProps} />);

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stepChange', expect.any(Function));
        expect(mockEvents.on).toHaveBeenCalledWith('stop', expect.any(Function));
      });

      // Simulate timer to check demo behavior
      jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);
      expect(mockSetAddingAFilter).toHaveBeenCalled();
    });

    test('handles stepChange event correctly', async () => {
      const mockEvents = getMockCopilotEvents();
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
      });

      render(<FiltersSelection {...defaultProps} />);

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stepChange', expect.any(Function));
      });

      triggerStepChangeEvent({
        order: TUTORIAL_STEPS.Search.order,
        name: 'Search',
        text: 'Search step',
      });

      jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);
      expect(mockSetAddingAFilter).toHaveBeenCalled();

      triggerStepChangeEvent({ order: 3, name: 'Other', text: 'Other step' });

      expect(mockSetAddingAFilter).toHaveBeenCalledWith(false);
    });

    test('stops demo when tutorial stops', async () => {
      const mockEvents = getMockCopilotEvents();
      setMockCopilotState({
        isActive: true,
        currentStep: { order: TUTORIAL_STEPS.Search.order, name: 'Search', text: 'Search step' },
      });

      render(<FiltersSelection {...defaultProps} />);

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stop', expect.any(Function));
      });

      triggerStopEvent();

      expect(mockSetAddingAFilter).toHaveBeenCalledWith(false);
    });

    test('cleans up event listeners and demo on unmount', async () => {
      const mockEvents = getMockCopilotEvents();
      setMockCopilotState({
        isActive: true,
        currentStep: { order: TUTORIAL_STEPS.Search.order, name: 'Search', text: 'Search step' },
      });

      const { unmount } = render(<FiltersSelection {...defaultProps} />);

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalled();
      });

      unmount();

      expect(mockEvents.off).toHaveBeenCalledWith('stepChange', expect.any(Function));
      expect(mockEvents.off).toHaveBeenCalledWith('stop', expect.any(Function));
      expect(mockSetAddingAFilter).toHaveBeenCalledWith(false);
    });

    test('does not set up listeners when copilot events unavailable', () => {
      const mockEvents = getMockCopilotEvents();
      setMockCopilotState({
        isActive: true,
        copilotEvents: null,
      });

      render(<FiltersSelection {...defaultProps} />);

      expect(mockEvents.on).not.toHaveBeenCalled();
    });
  });
});
