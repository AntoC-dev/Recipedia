import { takeSharedImport } from '@utils/SharedContent';
import {
  clearSharedPayloads,
  createResolvedSharePayload,
  createSharePayload,
  getResolvedSharedPayloadsAsync,
  getSharedPayloads,
  type SharePayload,
} from '@mocks/deps/expo-sharing-mock';

const recipeUrl = 'https://example.com/recipe';
const localImageUri = 'file:///cache/shared/photo.jpg';
const androidContentUri = 'content://media/external/images/1';

describe('SharedContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSharedPayloads.mockReturnValue([]);
    getResolvedSharedPayloadsAsync.mockResolvedValue([]);
  });

  describe('takeSharedImport', () => {
    test('returns undefined and clears nothing when nothing was shared', async () => {
      await expect(takeSharedImport()).resolves.toBeUndefined();
      expect(clearSharedPayloads).not.toHaveBeenCalled();
    });

    test('imports a shared link without resolving it', async () => {
      getSharedPayloads.mockReturnValue([createSharePayload(recipeUrl, 'url')]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'url', url: recipeUrl });
      expect(getResolvedSharedPayloadsAsync).not.toHaveBeenCalled();
      expect(clearSharedPayloads).toHaveBeenCalledTimes(1);
    });

    test('imports the link shared along with the page title', async () => {
      getSharedPayloads.mockReturnValue([
        createSharePayload('Hamburger maison', 'text'),
        createSharePayload(recipeUrl, 'url'),
      ]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'url', url: recipeUrl });
    });

    test('imports the photo shared along with a caption', async () => {
      getSharedPayloads.mockReturnValue([
        createSharePayload('My dinner', 'text'),
        createSharePayload(androidContentUri, 'image'),
      ]);
      getResolvedSharedPayloadsAsync.mockResolvedValue([
        createResolvedSharePayload({ value: 'My dinner' }),
        createResolvedSharePayload({
          value: androidContentUri,
          shareType: 'image',
          contentType: 'image',
          contentUri: localImageUri,
        }),
      ]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'image', uri: localImageUri });
    });

    test('imports a link shared as text, ignoring surrounding whitespace', async () => {
      getSharedPayloads.mockReturnValue([createSharePayload(` ${recipeUrl}\n`, 'text')]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'url', url: recipeUrl });
    });

    test.each([
      ['a sentence containing a link', `Try this: ${recipeUrl}`],
      ['a host without domain', 'http://localhost/recipe'],
      ['a non-web protocol', 'ftp://example.com/recipe'],
      ['a link without protocol', 'www.example.com/recipe'],
    ])('reports %s as unsupported', async (_case, text) => {
      getSharedPayloads.mockReturnValue([createSharePayload(text, 'text')]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'unsupported' });
    });

    test('reports shared text without link as unsupported', async () => {
      getSharedPayloads.mockReturnValue([createSharePayload('Just some text', 'text')]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'unsupported' });
      expect(clearSharedPayloads).toHaveBeenCalledTimes(1);
    });

    test('reports a payload without value as unsupported', async () => {
      getSharedPayloads.mockReturnValue([{ shareType: 'text' } as SharePayload]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'unsupported' });
    });

    test.each(['video', 'file', 'audio'] as const)(
      'reports a shared %s as unsupported',
      async shareType => {
        getSharedPayloads.mockReturnValue([createSharePayload('file:///cache/item', shareType)]);

        await expect(takeSharedImport()).resolves.toEqual({ kind: 'unsupported' });
      }
    );

    test('imports a shared photo through its resolved local file', async () => {
      getSharedPayloads.mockReturnValue([createSharePayload(androidContentUri, 'image')]);
      getResolvedSharedPayloadsAsync.mockResolvedValue([
        createResolvedSharePayload({
          value: androidContentUri,
          shareType: 'image',
          contentType: 'image',
          contentUri: localImageUri,
        }),
      ]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'image', uri: localImageUri });
      expect(clearSharedPayloads).toHaveBeenCalledTimes(1);
    });

    test('reports a photo that could not be resolved as unsupported', async () => {
      getSharedPayloads.mockReturnValue([createSharePayload(androidContentUri, 'image')]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'unsupported' });
    });

    test('clears the share even when resolving the photo fails', async () => {
      getSharedPayloads.mockReturnValue([createSharePayload(androidContentUri, 'image')]);
      getResolvedSharedPayloadsAsync.mockRejectedValue(new Error('copy failed'));

      await expect(takeSharedImport()).rejects.toThrow('copy failed');
      expect(clearSharedPayloads).toHaveBeenCalledTimes(1);
    });
  });
});
