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
import { listFilter, prepTimeValues } from '@customTypes/RecipeFiltersTypes';

const MockNativeMethodsModule = require('@react-native/jest-preset/jest/MockNativeMethods');
const MockNativeMethods = MockNativeMethodsModule.default || MockNativeMethodsModule;

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

jest.mock('@hooks/useReducedMotion', () =>
  require('@mocks/hooks/useReducedMotion-mock').useReducedMotionMock()
);

describe('FiltersSelection Component', () => {
  const mockSetAddingAFilter = jest.fn((updater: boolean | ((prev: boolean) => boolean)) => {
    if (typeof updater === 'function') {
      updater(false);
    }
  });
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

  test('translates preparation time filter values for display', () => {
    const props = { ...defaultProps, filters: [prepTimeValues[0]!] };
    const { getByTestId } = render(<FiltersSelection {...props} />);

    expect(getByTestId('FiltersSelection::FiltersSelection::0::Chip::Children')).toHaveTextContent(
      '0-10 min'
    );
  });

  test('translates the in-season filter value for display', () => {
    const props = { ...defaultProps, filters: [listFilter.inSeason] };
    const { getByTestId } = render(<FiltersSelection {...props} />);

    expect(getByTestId('FiltersSelection::FiltersSelection::0::Chip::Children')).toHaveTextContent(
      listFilter.inSeason
    );
  });

  describe('Toggle button position measurement', () => {
    afterEach(() => {
      MockNativeMethods.measureInWindow.mockReset();
    });

    test('reports the settled window top once two consecutive measurements match', async () => {
      MockNativeMethods.measureInWindow.mockImplementation(
        (cb: (x: number, y: number, width: number, height: number) => void) => {
          cb(0, 42, 100, 50);
        }
      );
      setMockCopilotState({ isActive: true, currentStep: null });
      const onToggleButtonTop = jest.fn();

      render(
        <FiltersSelection
          {...defaultProps}
          screenFocused={true}
          onToggleButtonTop={onToggleButtonTop}
        />
      );

      await waitFor(() => expect(onToggleButtonTop).toHaveBeenCalledWith(42));
    });

    test('caps measurement attempts and reports the last value when layout never stabilizes', async () => {
      let measurement = 0;
      MockNativeMethods.measureInWindow.mockImplementation(
        (cb: (x: number, y: number, width: number, height: number) => void) => {
          measurement += 1;
          cb(0, measurement, 100, 50);
        }
      );
      setMockCopilotState({ isActive: true, currentStep: null });
      const onToggleButtonTop = jest.fn();

      render(
        <FiltersSelection
          {...defaultProps}
          screenFocused={true}
          onToggleButtonTop={onToggleButtonTop}
        />
      );

      await waitFor(() => expect(onToggleButtonTop).toHaveBeenCalledWith(31), { timeout: 5000 });
    });

    test('does not measure when the screen is not focused', () => {
      const measureInWindow = jest.fn();
      MockNativeMethods.measureInWindow.mockImplementation(measureInWindow);
      setMockCopilotState({ isActive: true, currentStep: null });
      const onToggleButtonTop = jest.fn();

      render(
        <FiltersSelection
          {...defaultProps}
          screenFocused={false}
          onToggleButtonTop={onToggleButtonTop}
        />
      );

      expect(measureInWindow).not.toHaveBeenCalled();
      expect(onToggleButtonTop).not.toHaveBeenCalled();
    });

    test('does not measure when copilot is not available', () => {
      const measureInWindow = jest.fn();
      MockNativeMethods.measureInWindow.mockImplementation(measureInWindow);
      setMockCopilotState({ isActive: false });
      const onToggleButtonTop = jest.fn();

      render(
        <FiltersSelection
          {...defaultProps}
          screenFocused={true}
          onToggleButtonTop={onToggleButtonTop}
        />
      );

      expect(measureInWindow).not.toHaveBeenCalled();
      expect(onToggleButtonTop).not.toHaveBeenCalled();
    });

    test('ignores a measurement callback that resolves after the effect is cleaned up', () => {
      const frames: FrameRequestCallback[] = [];
      const rafSpy = jest
        .spyOn(global, 'requestAnimationFrame')
        .mockImplementation((cb: FrameRequestCallback) => {
          frames.push(cb);
          return frames.length;
        });
      const cafSpy = jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
      MockNativeMethods.measureInWindow.mockImplementation(
        (cb: (x: number, y: number, width: number, height: number) => void) => {
          cb(0, 42, 100, 50);
        }
      );
      setMockCopilotState({ isActive: true, currentStep: null });
      const onToggleButtonTop = jest.fn();

      const { rerender } = render(
        <FiltersSelection
          {...defaultProps}
          screenFocused={true}
          onToggleButtonTop={onToggleButtonTop}
        />
      );

      const staleFrame = frames[0]!;

      rerender(
        <FiltersSelection {...defaultProps} screenFocused={true} onToggleButtonTop={() => {}} />
      );

      staleFrame(0);

      expect(onToggleButtonTop).not.toHaveBeenCalled();

      rafSpy.mockRestore();
      cafSpy.mockRestore();
    });
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

      jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);
      expect(mockSetAddingAFilter).toHaveBeenCalled();
    });

    test('restarts the demo interval when a duplicate stepChange arrives on the same step', async () => {
      const mockEvents = getMockCopilotEvents();
      setMockCopilotState({
        isActive: true,
        currentStep: { order: TUTORIAL_STEPS.Search.order, name: 'Search', text: 'Search step' },
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
