import type {
  BaseResolvedSharePayload,
  ResolvedSharePayload,
  SharePayload,
  ShareType,
} from 'expo-sharing';

export type { ResolvedSharePayload, SharePayload, ShareType };

export const getSharedPayloads = jest.fn<SharePayload[], []>(() => []);
export const getResolvedSharedPayloadsAsync = jest.fn<Promise<ResolvedSharePayload[]>, []>(() =>
  Promise.resolve([])
);
export const clearSharedPayloads = jest.fn<void, []>();

export function createSharePayload(value: string, shareType: ShareType = 'text'): SharePayload {
  return { value, shareType };
}

export function createResolvedSharePayload(
  overrides: Partial<BaseResolvedSharePayload> = {}
): ResolvedSharePayload {
  return {
    value: '',
    shareType: 'text',
    contentUri: null,
    contentType: 'text',
    contentMimeType: null,
    originalName: null,
    contentSize: null,
    ...overrides,
  } as ResolvedSharePayload;
}
