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
import { DefaultPersonsProvider } from '@context/DefaultPersonsContext';
import {
  createEmptyScrapedRecipe,
  mockScrapeRecipeAuthenticated,
  mockScrapeRecipeAuthenticatedError,
  mockScrapeRecipeAuthenticatedSuccess,
  mockScrapeRecipeFromHtmlError,
  mockScrapeRecipeFromHtmlSuccess,
} from '@mocks/modules/recipe-scraper-mock';
import { mockFetchHtmlSuccess } from '@mocks/deps/fetch-mock';
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

jest.mock(
  '@app/modules/recipe-scraper',
  () => require('@mocks/modules/recipe-scraper-mock').recipeScraperMock
);

jest.mock('react-i18next', () => require('@mocks/utils/i18n-mock').i18nMock());

function renderWithProvider(component: React.ReactElement, tabBarHeight?: number) {
  return render(
    <BottomTabBarHeightContext.Provider value={tabBarHeight}>
      <DefaultPersonsProvider>{component}</DefaultPersonsProvider>
    </BottomTabBarHeightContext.Provider>
  );
}

function openUrlDialog(getByTestId: (id: string) => any) {
  fireEvent.press(getByTestId('ExpandButton'));
  fireEvent.press(getByTestId('UrlButton'));
}

describe('VerticalBottomButtons Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchHtmlSuccess();
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

  test('does not navigate when the gallery selection is cancelled', async () => {
    (pickImage as jest.Mock).mockResolvedValueOnce('');
    const { getByTestId } = renderWithProvider(<VerticalBottomButtons />);

    fireEvent.press(getByTestId('ExpandButton'));
    fireEvent.press(getByTestId('GalleryButton'));

    await waitFor(() => expect(pickImage).toHaveBeenCalled());

    expect(mockNavigate).not.toHaveBeenCalled();
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

  describe('URL import flow', () => {
    test('opens the URL dialog when the URL button is pressed', () => {
      const { getByTestId } = renderWithProvider(<VerticalBottomButtons />);

      openUrlDialog(getByTestId);

      expect(getByTestId('VerticalBottomButtons::UrlDialog::Title')).toBeTruthy();
    });

    test('closes the URL dialog and clears the error when cancel is pressed', () => {
      const { getByTestId, queryByTestId } = renderWithProvider(<VerticalBottomButtons />);

      openUrlDialog(getByTestId);
      fireEvent.press(getByTestId('VerticalBottomButtons::UrlDialog::CancelButton'));

      expect(queryByTestId('VerticalBottomButtons::UrlDialog::Title')).toBeNull();
    });

    test('navigates to scrape results and closes the dialog on successful submit', async () => {
      mockScrapeRecipeFromHtmlSuccess(createEmptyScrapedRecipe({ title: 'Pasta' }));
      const { getByTestId, queryByTestId } = renderWithProvider(<VerticalBottomButtons />);

      openUrlDialog(getByTestId);
      fireEvent.changeText(
        getByTestId('VerticalBottomButtons::UrlDialog::Input::CustomTextInput'),
        'https://example.com/recipe'
      );
      fireEvent.press(getByTestId('VerticalBottomButtons::UrlDialog::SubmitButton'));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          'RecipeAddScrape',
          expect.objectContaining({ sourceUrl: 'https://example.com/recipe' })
        )
      );
      expect(queryByTestId('VerticalBottomButtons::UrlDialog::Title')).toBeNull();
    });

    test('keeps the URL dialog open and shows an error when scraping fails', async () => {
      mockScrapeRecipeFromHtmlError('No recipe found', 'NoRecipeFoundError');
      const { getByTestId } = renderWithProvider(<VerticalBottomButtons />);

      openUrlDialog(getByTestId);
      fireEvent.changeText(
        getByTestId('VerticalBottomButtons::UrlDialog::Input::CustomTextInput'),
        'https://example.com/recipe'
      );
      fireEvent.press(getByTestId('VerticalBottomButtons::UrlDialog::SubmitButton'));

      await waitFor(() =>
        expect(getByTestId('VerticalBottomButtons::UrlDialog::HelperText')).toHaveTextContent(
          'urlDialog.errorNoRecipeFound'
        )
      );
      expect(getByTestId('VerticalBottomButtons::UrlDialog::Title')).toBeTruthy();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('opens the authentication dialog and hides the URL dialog when scraping requires auth', async () => {
      mockScrapeRecipeFromHtmlError('Login required', 'AuthenticationRequired', 'quitoque.fr');
      const { getByTestId, queryByTestId } = renderWithProvider(<VerticalBottomButtons />);

      openUrlDialog(getByTestId);
      fireEvent.changeText(
        getByTestId('VerticalBottomButtons::UrlDialog::Input::CustomTextInput'),
        'https://quitoque.fr/recipe'
      );
      fireEvent.press(getByTestId('VerticalBottomButtons::UrlDialog::SubmitButton'));

      await waitFor(() =>
        expect(getByTestId('VerticalBottomButtons::AuthDialog::Title')).toBeTruthy()
      );
      expect(queryByTestId('VerticalBottomButtons::UrlDialog::Title')).toBeNull();
    });
  });

  describe('Authentication flow', () => {
    function triggerAuthRequired(getByTestId: (id: string) => any) {
      mockScrapeRecipeFromHtmlError('Login required', 'AuthenticationRequired', 'quitoque.fr');
      openUrlDialog(getByTestId);
      fireEvent.changeText(
        getByTestId('VerticalBottomButtons::UrlDialog::Input::CustomTextInput'),
        'https://quitoque.fr/recipe'
      );
      fireEvent.press(getByTestId('VerticalBottomButtons::UrlDialog::SubmitButton'));
    }

    test('navigates to scrape results and closes the dialog on successful credentials', async () => {
      const { getByTestId, queryByTestId } = renderWithProvider(<VerticalBottomButtons />);

      triggerAuthRequired(getByTestId);
      await waitFor(() =>
        expect(getByTestId('VerticalBottomButtons::AuthDialog::Title')).toBeTruthy()
      );

      mockScrapeRecipeAuthenticatedSuccess(createEmptyScrapedRecipe({ title: 'Secured Recipe' }));
      fireEvent.changeText(getByTestId('VerticalBottomButtons::AuthDialog::UsernameInput'), 'chef');
      fireEvent.changeText(
        getByTestId('VerticalBottomButtons::AuthDialog::PasswordInput'),
        'secret'
      );
      fireEvent.press(getByTestId('VerticalBottomButtons::AuthDialog::SubmitButton'));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          'RecipeAddScrape',
          expect.objectContaining({ sourceUrl: 'https://quitoque.fr/recipe' })
        )
      );
      expect(queryByTestId('VerticalBottomButtons::AuthDialog::Title')).toBeNull();
    });

    test('keeps the auth dialog open and shows an error on failed credentials', async () => {
      const { getByTestId } = renderWithProvider(<VerticalBottomButtons />);

      triggerAuthRequired(getByTestId);
      await waitFor(() =>
        expect(getByTestId('VerticalBottomButtons::AuthDialog::Title')).toBeTruthy()
      );

      mockScrapeRecipeAuthenticatedError('Invalid credentials', 'AuthenticationFailed');
      fireEvent.changeText(getByTestId('VerticalBottomButtons::AuthDialog::UsernameInput'), 'chef');
      fireEvent.changeText(
        getByTestId('VerticalBottomButtons::AuthDialog::PasswordInput'),
        'wrong'
      );
      fireEvent.press(getByTestId('VerticalBottomButtons::AuthDialog::SubmitButton'));

      await waitFor(() =>
        expect(getByTestId('VerticalBottomButtons::AuthDialog::HelperText')).toHaveTextContent(
          'urlDialog.errorAuthFailed'
        )
      );
      expect(getByTestId('VerticalBottomButtons::AuthDialog::Title')).toBeTruthy();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('closes the auth dialog and clears auth state when cancel is pressed', async () => {
      const { getByTestId, queryByTestId } = renderWithProvider(<VerticalBottomButtons />);

      triggerAuthRequired(getByTestId);
      await waitFor(() =>
        expect(getByTestId('VerticalBottomButtons::AuthDialog::Title')).toBeTruthy()
      );

      fireEvent.press(getByTestId('VerticalBottomButtons::AuthDialog::CancelButton'));

      expect(queryByTestId('VerticalBottomButtons::AuthDialog::Title')).toBeNull();
    });

    test('ignores auth submit once authRequired has already been cleared', async () => {
      const { getByTestId } = renderWithProvider(<VerticalBottomButtons />);

      triggerAuthRequired(getByTestId);
      await waitFor(() =>
        expect(getByTestId('VerticalBottomButtons::AuthDialog::Title')).toBeTruthy()
      );

      mockScrapeRecipeFromHtmlSuccess(createEmptyScrapedRecipe({ title: 'Pasta' }));
      fireEvent.press(getByTestId('ExpandButton'));
      fireEvent.press(getByTestId('UrlButton'));
      fireEvent.changeText(
        getByTestId('VerticalBottomButtons::UrlDialog::Input::CustomTextInput'),
        'https://example.com/recipe'
      );
      fireEvent.press(getByTestId('VerticalBottomButtons::UrlDialog::SubmitButton'));

      await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
      mockNavigate.mockClear();

      fireEvent.changeText(getByTestId('VerticalBottomButtons::AuthDialog::UsernameInput'), 'chef');
      fireEvent.changeText(
        getByTestId('VerticalBottomButtons::AuthDialog::PasswordInput'),
        'secret'
      );
      fireEvent.press(getByTestId('VerticalBottomButtons::AuthDialog::SubmitButton'));

      expect(mockScrapeRecipeAuthenticated).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
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

    test('does not start the demo on mount when the current step does not match Home', () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 2, name: 'Search', text: 'Search step' },
      });

      const { getByTestId, queryByTestId } = renderWithProvider(<VerticalBottomButtons />);

      act(() => {
        jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);
      });

      expect(getByTestId('ExpandButton')).toBeTruthy();
      expect(queryByTestId('ReduceButton')).toBeNull();
    });

    test('restarts the demo interval when a duplicate stepChange arrives on the same step', () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
      });

      const { getByTestId } = renderWithProvider(<VerticalBottomButtons />);

      triggerStepChangeEvent({ order: 1, name: 'Home', text: 'Home step' });

      act(() => {
        jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);
      });

      expect(getByTestId('ReduceButton')).toBeTruthy();
    });

    test('stops the demo and collapses the FAB when stepChange moves to a different step', () => {
      setMockCopilotState({
        isActive: true,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
      });

      const { getByTestId, queryByTestId } = renderWithProvider(<VerticalBottomButtons />);

      act(() => {
        jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);
      });
      expect(getByTestId('ReduceButton')).toBeTruthy();

      act(() => {
        triggerStepChangeEvent({ order: 2, name: 'Search', text: 'Search step' });
      });

      expect(getByTestId('ExpandButton')).toBeTruthy();
      expect(queryByTestId('ReduceButton')).toBeNull();
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

  describe('Tab bar clearance', () => {
    test('clears the measured tab bar height', () => {
      const { getByTestId } = renderWithProvider(<VerticalBottomButtons />, 128);

      expect(getByTestId('FAB.Group').props.style).toEqual({ paddingBottom: 128 });
    });

    test('adds no clearance when no tab bar is mounted', () => {
      const { getByTestId } = renderWithProvider(<VerticalBottomButtons />);

      expect(getByTestId('FAB.Group').props.style).toEqual({ paddingBottom: 0 });
    });

    test('spaces the FAB off the tab bar without restating the safe-area inset', () => {
      const { getByTestId } = renderWithProvider(<VerticalBottomButtons />, 128);

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

      const { getByTestId } = renderWithProvider(<VerticalBottomButtons />, 128);

      await waitFor(() => {
        expect(getByTestId('HomeTutorial').props.style.bottom).toBe(padding.small);
      });
    });
  });
});
