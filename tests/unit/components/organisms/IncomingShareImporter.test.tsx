import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StackActions } from '@react-navigation/native';
import { IncomingShareImporter } from '@components/organisms/IncomingShareImporter';
import { mockDispatch } from '@mocks/deps/react-navigation-mock';
import {
  createResolvedSharePayload,
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

function expectUrlImport({ getByTestId, queryByTestId }: Screen, isOpen: boolean, initialUrl = '') {
  if (!isOpen) {
    expect(queryByTestId(urlImportId)).toBeNull();
    return;
  }
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
    getResolvedSharedPayloadsAsync.mockResolvedValue([
      createResolvedSharePayload({
        value: 'content://media/1',
        shareType: 'image',
        contentType: 'image',
        contentUri: localImageUri,
      }),
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('stays idle when nothing was shared', async () => {
    const screen = await renderImporter();

    expectUrlImport(screen, false);
    expectUnsupportedSnackbarHidden(screen);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test.each(['background', 'inactive'] as const)(
    'does not check for a share when the app becomes %s',
    async nextAppState => {
      const screen = await renderImporter();

      await screen.receiveShareWhileInBackground(sharedUrlPayloads, nextAppState);

      expectUrlImport(screen, false);
    }
  );

  test('checks again on the next activation after reading a share failed', async () => {
    getSharedPayloads.mockImplementationOnce(() => {
      throw new Error('native failure');
    });
    const screen = await renderImporter();

    await screen.receiveShareWhileInBackground(sharedUrlPayloads);

    expectUrlImport(screen, true, recipeUrl);
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
      expectUrlImport(screen, false);
      expectUnsupportedSnackbarHidden(screen);
    });

    test('pushes the OCR import screen for an image shared while in background', async () => {
      const screen = await renderImporter();

      await screen.receiveShareWhileInBackground(sharedImagePayloads);

      expect(mockDispatch).toHaveBeenCalledWith(
        StackActions.push('RecipeAddOcr', { imgUri: localImageUri })
      );
    });
  });

  describe('shared URL', () => {
    test('opens the URL import with the shared URL', async () => {
      const screen = await renderImporter(sharedUrlPayloads);

      expectUrlImport(screen, true, recipeUrl);
      expectUnsupportedSnackbarHidden(screen);
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    test('opens the URL import for a URL shared while in background', async () => {
      const screen = await renderImporter();

      await screen.receiveShareWhileInBackground([createSharePayload(otherRecipeUrl, 'url')]);

      expectUrlImport(screen, true, otherRecipeUrl);
    });

    test('closes the URL import when it ends', async () => {
      const screen = await renderImporter(sharedUrlPayloads);

      await fireEvent.press(screen.getByTestId(urlImportId + '::OnClose'));

      expectUrlImport(screen, false);
    });
  });

  describe('unsupported content', () => {
    test('shows the unsupported snackbar', async () => {
      const screen = await renderImporter(sharedTextPayloads);

      expectUnsupportedSnackbarShown(screen);
      expectUrlImport(screen, false);
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    test('hides the unsupported snackbar when dismissed', async () => {
      const screen = await renderImporter(sharedTextPayloads);

      await fireEvent.press(screen.getByTestId(snackbarId + '::Dismiss'));

      expectUnsupportedSnackbarHidden(screen);
    });
  });
});
