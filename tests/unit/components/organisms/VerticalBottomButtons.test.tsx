import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import VerticalBottomButtons from '@components/organisms/VerticalBottomButtons';
import { mockNavigate } from '@mocks/deps/react-navigation-mock';
import {
  getMockCopilotEvents,
  resetMockCopilot,
  setMockCopilotState,
} from '@mocks/deps/react-native-copilot-mock';
import { mockUseReducedMotion } from '@mocks/hooks/useReducedMotion-mock';
import { TUTORIAL_DEMO_INTERVAL } from '@utils/Constants';
import { DefaultPersonsProvider } from '@context/DefaultPersonsContext';

jest.mock('@utils/ImagePicker', () => require('@mocks/utils/ImagePicker-mock').imagePickerMock());

jest.mock('@hooks/useReducedMotion', () =>
  require('@mocks/hooks/useReducedMotion-mock').useReducedMotionMock()
);

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

jest.mock(
  '@app/modules/recipe-scraper',
  () => require('@mocks/modules/recipe-scraper-mock').recipeScraperMock
);

function renderWithProvider(component: React.ReactElement) {
  return render(<DefaultPersonsProvider>{component}</DefaultPersonsProvider>);
}

describe('VerticalBottomButtons Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders expand button in collapsed state', () => {
    const { getByTestId, queryByTestId } = renderWithProvider(<VerticalBottomButtons />);

    expect(getByTestId('ExpandButton')).toBeTruthy();

    expect(queryByTestId('ReduceButton')).toBeNull();
    expect(queryByTestId('RecipeEdit')).toBeNull();
    expect(queryByTestId('GalleryButton')).toBeNull();
    expect(queryByTestId('CameraButton')).toBeNull();
  });
  test('renders all action buttons in expanded state', () => {
    const { queryByTestId, getByTestId } = renderWithProvider(<VerticalBottomButtons />);

    fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('ReduceButton')).toBeTruthy();
    expect(getByTestId('RecipeEdit')).toBeTruthy();
    expect(getByTestId('GalleryButton')).toBeTruthy();
    expect(getByTestId('CameraButton')).toBeTruthy();

    expect(queryByTestId('ExpandButton')).toBeNull();
  });

  test('collapses menu when reduce button is pressed', () => {
    const { queryByTestId, getByTestId } = renderWithProvider(<VerticalBottomButtons />);

    fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('ReduceButton')).toBeTruthy();

    fireEvent.press(getByTestId('ReduceButton'));

    expect(getByTestId('ExpandButton')).toBeTruthy();

    expect(queryByTestId('ReduceButton')).toBeNull();
    expect(queryByTestId('RecipeEdit')).toBeNull();
    expect(queryByTestId('GalleryButton')).toBeNull();
    expect(queryByTestId('CameraButton')).toBeNull();
  });

  test('navigates to manual recipe creation when edit button is pressed', async () => {
    const { getByTestId } = renderWithProvider(<VerticalBottomButtons />);

    fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('RecipeEdit')).toBeTruthy();

    fireEvent.press(getByTestId('RecipeEdit'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

    expect(mockNavigate).toHaveBeenCalledWith('RecipeAddManual');
  });

  test('picks image and navigates to recipe creation when gallery button is pressed', async () => {
    const { getByTestId } = renderWithProvider(<VerticalBottomButtons />);

    fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('GalleryButton')).toBeTruthy();

    fireEvent.press(getByTestId('GalleryButton'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

    expect(mockNavigate).toHaveBeenCalledWith('RecipeAddOcr', {
      imgUri: '/path/to/picked/img',
    });
  });

  test('takes photo and navigates to recipe creation when camera button is pressed', async () => {
    const { getByTestId } = renderWithProvider(<VerticalBottomButtons />);

    fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('CameraButton')).toBeTruthy();

    fireEvent.press(getByTestId('CameraButton'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

    expect(mockNavigate).toHaveBeenCalledWith('RecipeAddOcr', {
      imgUri: '/path/to/photo',
    });
  });

  test('handles state transitions correctly', () => {
    const { getByTestId, queryByTestId } = renderWithProvider(<VerticalBottomButtons />);

    expect(getByTestId('ExpandButton')).toBeTruthy();
    expect(queryByTestId('ReduceButton')).toBeNull();

    fireEvent.press(getByTestId('ExpandButton'));
    expect(queryByTestId('ExpandButton')).toBeNull();
    expect(getByTestId('ReduceButton')).toBeTruthy();
    expect(getByTestId('RecipeEdit')).toBeTruthy();
    expect(getByTestId('GalleryButton')).toBeTruthy();
    expect(getByTestId('CameraButton')).toBeTruthy();

    fireEvent.press(getByTestId('ReduceButton'));
    expect(getByTestId('ExpandButton')).toBeTruthy();
    expect(queryByTestId('ReduceButton')).toBeNull();
    expect(queryByTestId('RecipeEdit')).toBeNull();
    expect(queryByTestId('GalleryButton')).toBeNull();
    expect(queryByTestId('CameraButton')).toBeNull();
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

    test('auto-opens the FAB during the demo', () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
      });

      const { getByTestId } = renderWithProvider(<VerticalBottomButtons />);

      act(() => {
        jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);
      });

      expect(getByTestId('ReduceButton')).toBeTruthy();
    });

    test('does not auto-run the demo when reduced motion is enabled', () => {
      mockUseReducedMotion.mockReturnValue(true);
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
      });

      const { getByTestId, queryByTestId } = renderWithProvider(<VerticalBottomButtons />);

      act(() => {
        jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL * 2);
      });

      expect(getByTestId('ExpandButton')).toBeTruthy();
      expect(queryByTestId('ReduceButton')).toBeNull();
    });

    test('renders with tutorial wrapper when copilot is available', () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Test step' },
      });

      const { getByTestId } = renderWithProvider(<VerticalBottomButtons />);

      expect(getByTestId('CopilotStep::Home')).toBeTruthy();
      expect(getByTestId('HomeTutorial')).toBeTruthy();
      expect(getByTestId('ExpandButton')).toBeTruthy();
    });

    test('renders without tutorial wrapper when copilot is not available', () => {
      setMockCopilotState({ isActive: false });

      const { queryByTestId, getByTestId } = renderWithProvider(<VerticalBottomButtons />);

      expect(queryByTestId('CopilotStep::Home')).toBeNull();
      expect(queryByTestId('HomeTutorial')).toBeNull();
      expect(getByTestId('ExpandButton')).toBeTruthy();
    });

    test('handles tutorial demo when on Home step', async () => {
      const mockEvents = getMockCopilotEvents();
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
      });

      const { getByTestId, queryByTestId } = renderWithProvider(<VerticalBottomButtons />);

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stepChange', expect.any(Function));
        expect(mockEvents.on).toHaveBeenCalledWith('stop', expect.any(Function));
      });

      expect(getByTestId('ExpandButton')).toBeTruthy();
      expect(queryByTestId('ReduceButton')).toBeNull();

      expect(mockEvents.on).toHaveBeenCalledWith('stepChange', expect.any(Function));
      expect(mockEvents.on).toHaveBeenCalledWith('stop', expect.any(Function));
    });

    test('cleans up listeners and demo on unmount', async () => {
      const mockEvents = getMockCopilotEvents();
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
      });

      const { unmount, getByTestId } = renderWithProvider(<VerticalBottomButtons />);

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalled();
        expect(getByTestId('CopilotStep::Home')).toBeTruthy();
        expect(getByTestId('HomeTutorial')).toBeTruthy();
      });

      unmount();

      expect(mockEvents.off).toHaveBeenCalledWith('stepChange', expect.any(Function));
      expect(mockEvents.off).toHaveBeenCalledWith('stop', expect.any(Function));
    });
  });
});
