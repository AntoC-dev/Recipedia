import { takeSharedImport } from '@utils/SharedContent';
import {
  clearSharedPayloads,
  createResolvedImagePayload,
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
        createResolvedImagePayload(localImageUri),
      ]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'image', uri: localImageUri });
    });

    test('imports a link shared as text, ignoring surrounding whitespace', async () => {
      getSharedPayloads.mockReturnValue([createSharePayload(` ${recipeUrl}\n`, 'text')]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'url', url: recipeUrl });
    });

    test.each([
      ['shared text without link', createSharePayload('Just some text', 'text')],
      ['a payload without value', { shareType: 'text' } as SharePayload],
      ['a sentence containing a link', createSharePayload(`Try this: ${recipeUrl}`, 'text')],
      ['a host without domain', createSharePayload('http://localhost/recipe', 'text')],
      ['a non-web protocol', createSharePayload('ftp://example.com/recipe', 'text')],
      ['a link without protocol', createSharePayload('www.example.com/recipe', 'text')],
    ])('reports %s as unsupported', async (_case, payload) => {
      getSharedPayloads.mockReturnValue([payload]);

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
      getResolvedSharedPayloadsAsync.mockResolvedValue([createResolvedImagePayload(localImageUri)]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'image', uri: localImageUri });
      expect(clearSharedPayloads).toHaveBeenCalledTimes(1);
    });

    test('prefers the shared photo over a link shared with it', async () => {
      getSharedPayloads.mockReturnValue([
        createSharePayload(recipeUrl, 'url'),
        createSharePayload(androidContentUri, 'image'),
      ]);
      getResolvedSharedPayloadsAsync.mockResolvedValue([
        createResolvedSharePayload({ value: recipeUrl, shareType: 'url' }),
        createResolvedImagePayload(localImageUri),
      ]);

      await expect(takeSharedImport()).resolves.toEqual({ kind: 'image', uri: localImageUri });
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
