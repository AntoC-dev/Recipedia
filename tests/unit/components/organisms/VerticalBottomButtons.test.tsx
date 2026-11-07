import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import VerticalBottomButtons from '@components/organisms/VerticalBottomButtons';
import { mockNavigate } from '@mocks/deps/react-navigation-mock';
import {
  getMockCopilotEvents,
  resetMockCopilot,
  setMockCopilotState,
  triggerStepChangeEvent,
} from '@mocks/deps/react-native-copilot-mock';
import { mockUseReducedMotion } from '@mocks/hooks/useReducedMotion-mock';
import { TUTORIAL_DEMO_INTERVAL } from '@utils/Constants';
import { pickImage } from '@utils/ImagePicker';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { padding } from '@styles/spacing';

jest.mock('@utils/ImagePicker', () => require('@mocks/utils/ImagePicker-mock').imagePickerMock());

jest.mock('@hooks/useReducedMotion', () =>
  require('@mocks/hooks/useReducedMotion-mock').useReducedMotionMock()
);

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

jest.mock('@components/organisms/UrlRecipeImport', () => ({
  UrlRecipeImport: require('@mocks/components/organisms/UrlRecipeImport-mock').urlRecipeImportMock,
}));

jest.mock('react-i18next', () => require('@mocks/utils/i18n-mock').i18nMock());

async function renderWithProvider(component: React.ReactElement, tabBarHeight?: number) {
  return render(
    <BottomTabBarHeightContext.Provider value={tabBarHeight}>
      {component}
    </BottomTabBarHeightContext.Provider>
  );
}

async function openUrlDialog(getByTestId: (id: string) => any) {
  await fireEvent.press(getByTestId('ExpandButton'));
  await fireEvent.press(getByTestId('UrlButton'));
}

describe('VerticalBottomButtons Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders expand button in collapsed state', async () => {
    const { getByTestId, queryByTestId } = await renderWithProvider(<VerticalBottomButtons />);

    expect(getByTestId('ExpandButton')).toBeTruthy();

    expect(queryByTestId('ReduceButton')).toBeNull();
    expect(queryByTestId('RecipeEdit')).toBeNull();
    expect(queryByTestId('GalleryButton')).toBeNull();
    expect(queryByTestId('CameraButton')).toBeNull();
  });
  test('renders all action buttons in expanded state', async () => {
    const { queryByTestId, getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

    await fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('ReduceButton')).toBeTruthy();
    expect(getByTestId('RecipeEdit')).toBeTruthy();
    expect(getByTestId('GalleryButton')).toBeTruthy();
    expect(getByTestId('CameraButton')).toBeTruthy();

    expect(queryByTestId('ExpandButton')).toBeNull();
  });

  test('collapses menu when reduce button is pressed', async () => {
    const { queryByTestId, getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

    await fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('ReduceButton')).toBeTruthy();

    await fireEvent.press(getByTestId('ReduceButton'));

    expect(getByTestId('ExpandButton')).toBeTruthy();

    expect(queryByTestId('ReduceButton')).toBeNull();
    expect(queryByTestId('RecipeEdit')).toBeNull();
    expect(queryByTestId('GalleryButton')).toBeNull();
    expect(queryByTestId('CameraButton')).toBeNull();
  });

  test('navigates to manual recipe creation when edit button is pressed', async () => {
    const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

    await fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('RecipeEdit')).toBeTruthy();

    await fireEvent.press(getByTestId('RecipeEdit'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

    expect(mockNavigate).toHaveBeenCalledWith('RecipeAddManual');
  });

  test('picks image and navigates to recipe creation when gallery button is pressed', async () => {
    const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

    await fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('GalleryButton')).toBeTruthy();

    await fireEvent.press(getByTestId('GalleryButton'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

    expect(mockNavigate).toHaveBeenCalledWith('RecipeAddOcr', {
      imgUri: '/path/to/picked/img',
    });
  });

  test('takes photo and navigates to recipe creation when camera button is pressed', async () => {
    const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

    await fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('CameraButton')).toBeTruthy();

    await fireEvent.press(getByTestId('CameraButton'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

    expect(mockNavigate).toHaveBeenCalledWith('RecipeAddOcr', {
      imgUri: '/path/to/photo',
    });
  });

  test('does not navigate when the gallery selection is cancelled', async () => {
    (pickImage as jest.Mock).mockResolvedValueOnce('');
    const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

    await fireEvent.press(getByTestId('ExpandButton'));
    await fireEvent.press(getByTestId('GalleryButton'));

    await waitFor(() => expect(pickImage).toHaveBeenCalled());

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('handles state transitions correctly', async () => {
    const { getByTestId, queryByTestId } = await renderWithProvider(<VerticalBottomButtons />);

    expect(getByTestId('ExpandButton')).toBeTruthy();
    expect(queryByTestId('ReduceButton')).toBeNull();

    await fireEvent.press(getByTestId('ExpandButton'));
    expect(queryByTestId('ExpandButton')).toBeNull();
    expect(getByTestId('ReduceButton')).toBeTruthy();
    expect(getByTestId('RecipeEdit')).toBeTruthy();
    expect(getByTestId('GalleryButton')).toBeTruthy();
    expect(getByTestId('CameraButton')).toBeTruthy();

    await fireEvent.press(getByTestId('ReduceButton'));
    expect(getByTestId('ExpandButton')).toBeTruthy();
    expect(queryByTestId('ReduceButton')).toBeNull();
    expect(queryByTestId('RecipeEdit')).toBeNull();
    expect(queryByTestId('GalleryButton')).toBeNull();
    expect(queryByTestId('CameraButton')).toBeNull();
  });

  describe('URL import', () => {
    const urlImportId = 'VerticalBottomButtons::UrlRecipeImport';

    test('keeps the URL import closed without an initial URL by default', async () => {
      const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

      expect(getByTestId(urlImportId + '::IsVisible')).toHaveTextContent('false');
      expect(getByTestId(urlImportId + '::InitialUrl')).toHaveTextContent('');
    });

    test('opens the URL import and collapses the menu when the URL button is pressed', async () => {
      const { getByTestId, queryByTestId } = await renderWithProvider(<VerticalBottomButtons />);

      await openUrlDialog(getByTestId);

      expect(getByTestId(urlImportId + '::IsVisible')).toHaveTextContent('true');
      expect(queryByTestId('ReduceButton')).toBeNull();
    });

    test('closes the URL import when it ends', async () => {
      const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

      await openUrlDialog(getByTestId);
      await fireEvent.press(getByTestId(urlImportId + '::OnClose'));

      expect(getByTestId(urlImportId + '::IsVisible')).toHaveTextContent('false');
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

    test('auto-opens the FAB during the demo', async () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
      });

      const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

      await act(() => {
        jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);
      });

      expect(getByTestId('ReduceButton')).toBeTruthy();
    });

    test('does not start the demo on mount when the current step does not match Home', async () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 2, name: 'Search', text: 'Search step' },
      });

      const { getByTestId, queryByTestId } = await renderWithProvider(<VerticalBottomButtons />);

      await act(() => {
        jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);
      });

      expect(getByTestId('ExpandButton')).toBeTruthy();
      expect(queryByTestId('ReduceButton')).toBeNull();
    });

    test('restarts the demo interval when a duplicate stepChange arrives on the same step', async () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
      });

      const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

      triggerStepChangeEvent({ order: 1, name: 'Home', text: 'Home step' });

      await act(() => {
        jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);
      });

      expect(getByTestId('ReduceButton')).toBeTruthy();
    });

    test('stops the demo and collapses the FAB when stepChange moves to a different step', async () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
      });

      const { getByTestId, queryByTestId } = await renderWithProvider(<VerticalBottomButtons />);

      await act(() => {
        jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);
      });
      expect(getByTestId('ReduceButton')).toBeTruthy();

      await act(() => {
        triggerStepChangeEvent({ order: 2, name: 'Search', text: 'Search step' });
      });

      expect(getByTestId('ExpandButton')).toBeTruthy();
      expect(queryByTestId('ReduceButton')).toBeNull();
    });

    test('does not auto-run the demo when reduced motion is enabled', async () => {
      mockUseReducedMotion.mockReturnValue(true);
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
      });

      const { getByTestId, queryByTestId } = await renderWithProvider(<VerticalBottomButtons />);

      await act(() => {
        jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL * 2);
      });

      expect(getByTestId('ExpandButton')).toBeTruthy();
      expect(queryByTestId('ReduceButton')).toBeNull();
    });

    test('renders with tutorial wrapper when copilot is available', async () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Test step' },
      });

      const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

      expect(getByTestId('CopilotStep::Home')).toBeTruthy();
      expect(getByTestId('HomeTutorial')).toBeTruthy();
      expect(getByTestId('ExpandButton')).toBeTruthy();
    });

    test('renders without tutorial wrapper when copilot is not available', async () => {
      setMockCopilotState({ isActive: false });

      const { queryByTestId, getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

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

      const { getByTestId, queryByTestId } = await renderWithProvider(<VerticalBottomButtons />);

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

      const { unmount, getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalled();
        expect(getByTestId('CopilotStep::Home')).toBeTruthy();
        expect(getByTestId('HomeTutorial')).toBeTruthy();
      });

      await unmount();

      expect(mockEvents.off).toHaveBeenCalledWith('stepChange', expect.any(Function));
      expect(mockEvents.off).toHaveBeenCalledWith('stop', expect.any(Function));
    });
  });

  describe('Tab bar clearance', () => {
    test('clears the measured tab bar height', async () => {
      const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />, 128);

      expect(getByTestId('FAB.Group').props.style).toEqual({ paddingBottom: 128 });
    });

    test('adds no clearance when no tab bar is mounted', async () => {
      const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />);

      expect(getByTestId('FAB.Group').props.style).toEqual({ paddingBottom: 0 });
    });

    test('spaces the FAB off the tab bar without restating the safe-area inset', async () => {
      const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />, 128);

      expect(getByTestId('ExpandButton')).toHaveStyle({
        marginBottom: padding.small,
        marginRight: padding.small,
      });
    });

    test('anchors the tutorial highlight to the FAB, not to the tab bar', async () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
      });

      const { getByTestId } = await renderWithProvider(<VerticalBottomButtons />, 128);

      await waitFor(() => {
        expect(getByTestId('HomeTutorial').props.style.bottom).toBe(padding.small);
      });
    });
  });
});
