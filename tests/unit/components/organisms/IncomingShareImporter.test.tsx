import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StackActions } from '@react-navigation/native';
import { IncomingShareImporter } from '@components/organisms/IncomingShareImporter';
import { mockDispatch } from '@mocks/deps/react-navigation-mock';
import {
  createResolvedImagePayload,
  createSharePayload,
  getResolvedSharedPayloadsAsync,
  getSharedPayloads,
  type SharePayload,
} from '@mocks/deps/expo-sharing-mock';
import { mockAppStateChanges } from '@mocks/deps/react-native-app-state-mock';
import { AppStateStatus } from 'react-native';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

jest.mock('@components/organisms/UrlRecipeImport', () => ({
  UrlRecipeImport: require('@mocks/components/organisms/UrlRecipeImport-mock').urlRecipeImportMock,
}));

jest.mock('react-i18next', () => require('@mocks/utils/i18n-mock').i18nMock());

const urlImportId = 'IncomingShare::UrlRecipeImport';
const snackbarId = 'IncomingShare::UnsupportedSnackbar';
const recipeUrl = 'https://example.com/recipe';
const otherRecipeUrl = 'https://other.com/recipe';
const localImageUri = 'file:///cache/shared/photo.jpg';
const sharedUrlPayloads = [createSharePayload(recipeUrl, 'url')];
const sharedTextPayloads = [createSharePayload('Just some words')];
const sharedImagePayloads = [createSharePayload('content://media/1', 'image')];

function share(payloads: SharePayload[]) {
  getSharedPayloads.mockReturnValue(payloads);
}

async function renderImporter(initialPayloads: SharePayload[] = []) {
  const appState = mockAppStateChanges();
  share(initialPayloads);
  const screen = await render(<IncomingShareImporter />);

  async function receiveShareWhileInBackground(
    payloads: SharePayload[],
    nextAppState: AppStateStatus = 'active'
  ) {
    share(payloads);
    await act(async () => appState.changeAppState(nextAppState));
  }

  return { ...screen, ...appState, receiveShareWhileInBackground };
}

type Screen = Awaited<ReturnType<typeof renderImporter>>;

function expectUrlImportClosed({ queryByTestId }: Screen) {
  expect(queryByTestId(urlImportId)).toBeNull();
}

function expectUrlImportOpen({ getByTestId }: Screen, initialUrl: string) {
  expect(getByTestId(urlImportId + '::IsVisible')).toHaveTextContent('true');
  expect(getByTestId(urlImportId + '::InitialUrl')).toHaveTextContent(initialUrl);
}

function expectUnsupportedSnackbarHidden({ queryByTestId }: Screen) {
  expect(queryByTestId(snackbarId)).toBeNull();
}

function expectUnsupportedSnackbarShown({ getByTestId }: Screen) {
  expect(getByTestId(snackbarId + '::Text')).toHaveTextContent('shareImport.unsupported');
}

describe('IncomingShareImporter', () => {
  beforeEach(() => {
    getResolvedSharedPayloadsAsync.mockResolvedValue([createResolvedImagePayload(localImageUri)]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('stays idle when nothing was shared', async () => {
    const screen = await renderImporter();

    expectUrlImportClosed(screen);
    expectUnsupportedSnackbarHidden(screen);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test.each(['background', 'inactive'] as const)(
    'does not check for a share when the app becomes %s',
    async nextAppState => {
      const screen = await renderImporter();

      await screen.receiveShareWhileInBackground(sharedUrlPayloads, nextAppState);

      expectUrlImportClosed(screen);
    }
  );

  test('checks again on the next activation after reading a share failed', async () => {
    getSharedPayloads.mockImplementationOnce(() => {
      throw new Error('native failure');
    });
    const screen = await renderImporter();

    await screen.receiveShareWhileInBackground(sharedUrlPayloads);

    expectUrlImportOpen(screen, recipeUrl);
  });

  test('stops listening to app state changes on unmount', async () => {
    const { removeListener, unmount } = await renderImporter();

    await unmount();

    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  describe('shared image', () => {
    test('pushes the OCR import screen with the resolved image', async () => {
      const screen = await renderImporter(sharedImagePayloads);

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(
        StackActions.push('RecipeAddOcr', { imgUri: localImageUri })
      );
      expectUrlImportClosed(screen);
      expectUnsupportedSnackbarHidden(screen);
    });

    test('pushes the OCR import screen for an image shared while in background', async () => {
      const screen = await renderImporter();

      await screen.receiveShareWhileInBackground(sharedImagePayloads);

      expect(mockDispatch).toHaveBeenCalledWith(
        StackActions.push('RecipeAddOcr', { imgUri: localImageUri })
      );
    });

    test('closes an open URL import when an image is shared', async () => {
      const screen = await renderImporter(sharedUrlPayloads);

      await screen.receiveShareWhileInBackground(sharedImagePayloads);

      expectUrlImportClosed(screen);
      expect(mockDispatch).toHaveBeenCalledWith(
        StackActions.push('RecipeAddOcr', { imgUri: localImageUri })
      );
    });
  });

  describe('shared URL', () => {
    test('opens the URL import with the shared URL', async () => {
      const screen = await renderImporter(sharedUrlPayloads);

      expectUrlImportOpen(screen, recipeUrl);
      expectUnsupportedSnackbarHidden(screen);
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    test('opens the URL import for a URL shared while in background', async () => {
      const screen = await renderImporter();

      await screen.receiveShareWhileInBackground([createSharePayload(otherRecipeUrl, 'url')]);

      expectUrlImportOpen(screen, otherRecipeUrl);
    });

    test('re-opens the URL import with a new URL shared while the first import is open', async () => {
      const screen = await renderImporter(sharedUrlPayloads);

      await screen.receiveShareWhileInBackground([createSharePayload(otherRecipeUrl, 'url')]);

      expectUrlImportOpen(screen, otherRecipeUrl);
    });

    test('closes the URL import when it ends', async () => {
      const screen = await renderImporter(sharedUrlPayloads);

      await fireEvent.press(screen.getByTestId(urlImportId + '::OnClose'));

      expectUrlImportClosed(screen);
    });
  });

  describe('unsupported content', () => {
    test('shows the unsupported snackbar', async () => {
      const screen = await renderImporter(sharedTextPayloads);

      expectUnsupportedSnackbarShown(screen);
      expectUrlImportClosed(screen);
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    test('hides the unsupported snackbar when dismissed', async () => {
      const screen = await renderImporter(sharedTextPayloads);

      await fireEvent.press(screen.getByTestId(snackbarId + '::Dismiss'));

      expectUnsupportedSnackbarHidden(screen);
    });
  });
});
