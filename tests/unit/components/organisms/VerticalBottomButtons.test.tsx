import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import VerticalBottomButtons from '@components/organisms/VerticalBottomButtons';
import { mockNavigate } from '@mocks/deps/react-navigation-mock';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import {
  getMockCopilotEvents,
  resetMockCopilot,
  setMockCopilotState,
} from '@mocks/deps/react-native-copilot-mock';

jest.mock('expo-sqlite', () => require('@mocks/deps/expo-sqlite-mock').expoSqliteMock());
jest.mock('@utils/FileGestion', () =>
  require('@mocks/utils/FileGestion-mock.tsx').fileGestionMock()
);
jest.mock('@utils/ImagePicker', () => require('@mocks/utils/ImagePicker-mock').imagePickerMock());

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

describe('VerticalBottomButtons Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders expand button in collapsed state', () => {
    const { getByTestId, queryByTestId } = render(<VerticalBottomButtons />);

    expect(getByTestId('ExpandButton')).toBeTruthy();

    expect(queryByTestId('ReduceButton')).toBeNull();
    expect(queryByTestId('RecipeEdit')).toBeNull();
    expect(queryByTestId('GalleryButton')).toBeNull();
    expect(queryByTestId('CameraButton')).toBeNull();
  });
  test('renders all action buttons in expanded state', () => {
    const { queryByTestId, getByTestId } = render(<VerticalBottomButtons />);

    fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('ReduceButton')).toBeTruthy();
    expect(getByTestId('RecipeEdit')).toBeTruthy();
    expect(getByTestId('GalleryButton')).toBeTruthy();
    expect(getByTestId('CameraButton')).toBeTruthy();

    expect(queryByTestId('ExpandButton')).toBeNull();
  });

  test('collapses menu when reduce button is pressed', () => {
    const { queryByTestId, getByTestId } = render(<VerticalBottomButtons />);

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
    const { getByTestId } = render(<VerticalBottomButtons />);

    fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('RecipeEdit')).toBeTruthy();

    fireEvent.press(getByTestId('RecipeEdit'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

    expect(mockNavigate).toHaveBeenCalledWith('Recipe', {
      mode: 'addManually',
    } as RecipePropType);
  });

  test('picks image and navigates to recipe creation when gallery button is pressed', async () => {
    const { getByTestId } = render(<VerticalBottomButtons />);

    fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('GalleryButton')).toBeTruthy();

    fireEvent.press(getByTestId('GalleryButton'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

    expect(mockNavigate).toHaveBeenCalledWith('Recipe', {
      mode: 'addFromPic',
      imgUri: '/path/to/picked/img',
    } as RecipePropType);
  });

  test('takes photo and navigates to recipe creation when camera button is pressed', async () => {
    const { getByTestId } = render(<VerticalBottomButtons />);

    fireEvent.press(getByTestId('ExpandButton'));

    expect(getByTestId('CameraButton')).toBeTruthy();

    fireEvent.press(getByTestId('CameraButton'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

    expect(mockNavigate).toHaveBeenCalledWith('Recipe', {
      mode: 'addFromPic',
      imgUri: '/path/to/photo',
    } as RecipePropType);
  });

  test('handles state transitions correctly', () => {
    const { getByTestId, queryByTestId } = render(<VerticalBottomButtons />);

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
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test('renders with tutorial wrapper when copilot is available', () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Test step' },
      });

      const { getByTestId } = render(<VerticalBottomButtons />);

      expect(getByTestId('CopilotStep::Home')).toBeTruthy();
      expect(getByTestId('HomeTutorial')).toBeTruthy();
      expect(getByTestId('ExpandButton')).toBeTruthy();
    });

    test('renders without tutorial wrapper when copilot is not available', () => {
      setMockCopilotState({ isActive: false });

      const { queryByTestId, getByTestId } = render(<VerticalBottomButtons />);

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

      const { getByTestId, queryByTestId } = render(<VerticalBottomButtons />);

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

      const { unmount, getByTestId } = render(<VerticalBottomButtons />);

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
