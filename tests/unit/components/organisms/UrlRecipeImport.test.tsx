import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StackActions } from '@react-navigation/native';
import { UrlRecipeImport, UrlRecipeImportProps } from '@components/organisms/UrlRecipeImport';
import { mockDispatch } from '@mocks/deps/react-navigation-mock';
import { DefaultPersonsProvider } from '@context/DefaultPersonsContext';
import {
  createEmptyScrapedRecipe,
  mockScrapeRecipeAuthenticated,
  mockScrapeRecipeAuthenticatedError,
  mockScrapeRecipeAuthenticatedSuccess,
  mockScrapeRecipeFromHtml,
  mockScrapeRecipeFromHtmlError,
  mockScrapeRecipeFromHtmlSuccess,
} from '@mocks/modules/recipe-scraper-mock';
import { mockFetchHtmlSuccess } from '@mocks/deps/fetch-mock';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

jest.mock(
  '@app/modules/recipe-scraper',
  () => require('@mocks/modules/recipe-scraper-mock').recipeScraperMock
);

jest.mock('react-i18next', () => require('@mocks/utils/i18n-mock').i18nMock());

const testId = 'UrlImport';
const urlDialogId = testId + '::UrlDialog';
const authDialogId = testId + '::AuthDialog';
const recipeUrl = 'https://example.com/recipe';
const protectedRecipeUrl = 'https://quitoque.fr/recipe';

const mockOnClose = jest.fn();

function buildProps(overrides: Partial<UrlRecipeImportProps> = {}): UrlRecipeImportProps {
  return { testId, isVisible: true, onClose: mockOnClose, ...overrides };
}

function renderWithProviders(overrides: Partial<UrlRecipeImportProps>) {
  return (
    <DefaultPersonsProvider>
      <UrlRecipeImport {...buildProps(overrides)} />
    </DefaultPersonsProvider>
  );
}

async function renderImport(overrides: Partial<UrlRecipeImportProps> = {}) {
  const screen = await render(renderWithProviders(overrides));

  async function rerenderImport(nextOverrides: Partial<UrlRecipeImportProps> = {}) {
    await screen.rerender(renderWithProviders(nextOverrides));
  }

  return { ...screen, rerenderImport };
}

type Queries = Awaited<ReturnType<typeof renderImport>>;

async function submitUrl({ getByTestId }: Queries, url: string) {
  await fireEvent.changeText(getByTestId(urlDialogId + '::Input::CustomTextInput'), url);
  await fireEvent.press(getByTestId(urlDialogId + '::SubmitButton'));
}

async function submitCredentials({ getByTestId }: Queries, username: string, password: string) {
  await fireEvent.changeText(getByTestId(authDialogId + '::UsernameInput'), username);
  await fireEvent.changeText(getByTestId(authDialogId + '::PasswordInput'), password);
  await fireEvent.press(getByTestId(authDialogId + '::SubmitButton'));
}

async function waitForUrlError({ getByTestId }: Queries, errorKey: string) {
  await waitFor(() =>
    expect(getByTestId(urlDialogId + '::HelperText')).toHaveTextContent(errorKey)
  );
}

async function waitForAuthDialog({ getByTestId }: Queries) {
  await waitFor(() =>
    expect(getByTestId(authDialogId + '::Title')).toHaveTextContent('authDialog.title')
  );
}

async function openAuthDialog(screen: Queries) {
  mockScrapeRecipeFromHtmlError('Login required', 'AuthenticationRequired', 'quitoque.fr');
  await submitUrl(screen, protectedRecipeUrl);
  await waitForAuthDialog(screen);
}

function expectPushedToScrapeScreen(sourceUrl: string, title: string) {
  expect(mockDispatch).toHaveBeenCalledWith(
    StackActions.push('RecipeAddScrape', {
      scrapedData: expect.objectContaining({ title }),
      sourceUrl,
    })
  );
}

function expectUrlDialogHidden({ queryByTestId }: Queries) {
  expect(queryByTestId(urlDialogId + '::Title')).toBeNull();
}

function expectAuthDialogHidden({ queryByTestId }: Queries) {
  expect(queryByTestId(authDialogId + '::Title')).toBeNull();
}

describe('UrlRecipeImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchHtmlSuccess();
  });

  describe('URL dialog', () => {
    test('renders nothing when not visible', async () => {
      const screen = await renderImport({ isVisible: false });

      expectUrlDialogHidden(screen);
      expectAuthDialogHidden(screen);
    });

    test('shows an empty URL dialog when opened without an initial URL', async () => {
      const { getByTestId } = await renderImport();

      expect(getByTestId(urlDialogId + '::Title')).toHaveTextContent('urlDialog.title');
      expect(getByTestId(urlDialogId + '::Input::CustomTextInput').props.value).toBe('');
      expect(mockScrapeRecipeFromHtml).not.toHaveBeenCalled();
    });

    test('calls onClose when cancel is pressed', async () => {
      const { getByTestId } = await renderImport();

      await fireEvent.press(getByTestId(urlDialogId + '::CancelButton'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('clears the scrape error when the dialog is cancelled', async () => {
      mockScrapeRecipeFromHtmlError('No recipe found', 'NoRecipeFoundError');
      const screen = await renderImport();

      await submitUrl(screen, recipeUrl);
      await waitForUrlError(screen, 'urlDialog.errorNoRecipeFound');
      await fireEvent.press(screen.getByTestId(urlDialogId + '::CancelButton'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId(urlDialogId + '::HelperText')).toBeNull();
    });

    test('pushes the scrape screen and closes on successful submit', async () => {
      mockScrapeRecipeFromHtmlSuccess(createEmptyScrapedRecipe({ title: 'Pasta' }));
      const screen = await renderImport();

      await submitUrl(screen, recipeUrl);

      await waitFor(() => expectPushedToScrapeScreen(recipeUrl, 'Pasta'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('keeps the dialog open and shows an error when scraping fails', async () => {
      mockScrapeRecipeFromHtmlError('No recipe found', 'NoRecipeFoundError');
      const screen = await renderImport();

      await submitUrl(screen, recipeUrl);

      await waitForUrlError(screen, 'urlDialog.errorNoRecipeFound');
      expect(screen.getByTestId(urlDialogId + '::Title')).toHaveTextContent('urlDialog.title');
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('initial URL', () => {
    test('pre-fills the dialog and imports the initial URL right away', async () => {
      mockScrapeRecipeFromHtmlSuccess(createEmptyScrapedRecipe({ title: 'Shared Pasta' }));
      await renderImport({ initialUrl: recipeUrl });

      await waitFor(() => expectPushedToScrapeScreen(recipeUrl, 'Shared Pasta'));
      expect(mockScrapeRecipeFromHtml).toHaveBeenCalledWith(expect.any(String), recipeUrl);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('does not import the initial URL while hidden', async () => {
      await renderImport({ isVisible: false, initialUrl: recipeUrl });

      expect(mockScrapeRecipeFromHtml).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    test('imports the initial URL once the flow becomes visible', async () => {
      mockScrapeRecipeFromHtmlSuccess(createEmptyScrapedRecipe({ title: 'Shared Pasta' }));
      const screen = await renderImport({ isVisible: false, initialUrl: recipeUrl });

      await screen.rerenderImport({ initialUrl: recipeUrl });

      await waitFor(() => expectPushedToScrapeScreen(recipeUrl, 'Shared Pasta'));
    });

    test('keeps the initial URL editable with the error when its import fails', async () => {
      mockScrapeRecipeFromHtmlError('No recipe found', 'NoRecipeFoundError');
      const screen = await renderImport({ initialUrl: recipeUrl });

      await waitForUrlError(screen, 'urlDialog.errorNoRecipeFound');
      expect(screen.getByTestId(urlDialogId + '::Input::CustomTextInput').props.value).toBe(
        recipeUrl
      );
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    test('opens the authentication dialog when the initial URL requires a login', async () => {
      mockScrapeRecipeFromHtmlError('Login required', 'AuthenticationRequired', 'quitoque.fr');
      const screen = await renderImport({ initialUrl: protectedRecipeUrl });

      await waitForAuthDialog(screen);
      expectUrlDialogHidden(screen);
    });
  });

  describe('authentication dialog', () => {
    test('replaces the URL dialog when scraping requires a login', async () => {
      const screen = await renderImport();

      await openAuthDialog(screen);

      expectUrlDialogHidden(screen);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('pushes the scrape screen and closes on successful credentials', async () => {
      const screen = await renderImport();
      await openAuthDialog(screen);

      mockScrapeRecipeAuthenticatedSuccess(createEmptyScrapedRecipe({ title: 'Secured Recipe' }));
      await submitCredentials(screen, 'chef', 'secret');

      await waitFor(() => expectPushedToScrapeScreen(protectedRecipeUrl, 'Secured Recipe'));
      expect(mockScrapeRecipeAuthenticated).toHaveBeenCalledWith(
        protectedRecipeUrl,
        'chef',
        'secret'
      );
      expectAuthDialogHidden(screen);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('keeps the dialog open and shows an error on failed credentials', async () => {
      const screen = await renderImport();
      await openAuthDialog(screen);

      mockScrapeRecipeAuthenticatedError('Invalid credentials', 'AuthenticationFailed');
      await submitCredentials(screen, 'chef', 'wrong');

      await waitFor(() =>
        expect(screen.getByTestId(authDialogId + '::HelperText')).toHaveTextContent(
          'urlDialog.errorAuthFailed'
        )
      );
      expect(screen.getByTestId(authDialogId + '::Title')).toHaveTextContent('authDialog.title');
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('hides both dialogs when the flow is hidden while a login is pending', async () => {
      const screen = await renderImport();
      await openAuthDialog(screen);

      await screen.rerenderImport({ isVisible: false });

      expectAuthDialogHidden(screen);
      expectUrlDialogHidden(screen);
    });

    test('closes the dialog and calls onClose when cancel is pressed', async () => {
      const screen = await renderImport();
      await openAuthDialog(screen);

      await fireEvent.press(screen.getByTestId(authDialogId + '::CancelButton'));

      expectAuthDialogHidden(screen);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
