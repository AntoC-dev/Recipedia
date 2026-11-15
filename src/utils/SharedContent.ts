/**
 * SharedContent - Turns what another app shared with Recipedia into a recipe import.
 *
 * The user shares one photo (→ OCR import) or one web page link, as shared by browsers
 * (→ URL scrape import). Some apps send the link along with extra items such as the
 * page title, so the photo or link is picked among them. Anything else is unsupported.
 */

import { z } from 'zod';
import {
  clearSharedPayloads,
  getResolvedSharedPayloadsAsync,
  getSharedPayloads,
  type SharePayload,
} from 'expo-sharing';
import { moveFileToCache } from '@utils/FileGestion';

/**
 * Import action derived from shared content.
 */
export type SharedImport =
  { kind: 'url'; url: string } | { kind: 'image'; uri: string } | { kind: 'unsupported' };

const webUrlSchema = z.httpUrl();

async function toSharedImport(payloads: SharePayload[]): Promise<SharedImport> {
  if (payloads.some(payload => payload.shareType === 'image')) {
    const resolved = await getResolvedSharedPayloadsAsync();
    const imageUri = resolved.find(payload => payload.contentType === 'image')?.contentUri;
    const cachedUri = imageUri ? await moveFileToCache(imageUri) : '';
    return cachedUri ? { kind: 'image', uri: cachedUri } : { kind: 'unsupported' };
  }
  const url = payloads
    .map(payload => payload.value?.trim())
    .find(value => webUrlSchema.safeParse(value).success);
  return url ? { kind: 'url', url } : { kind: 'unsupported' };
}

/**
 * Reads what was shared with the app, maps it to an import action and clears it, so
 * each share is handled once.
 *
 * Only a photo is resolved and moved to the app cache, since clearing the share deletes
 * the file expo-sharing resolved; a link is handed to the scraper as is.
 *
 * @returns The import action, or `undefined` when nothing was shared
 *
 * @example
 * ```typescript
 * const sharedImport = await takeSharedImport();
 * ```
 */
export async function takeSharedImport(): Promise<SharedImport | undefined> {
  const payloads = getSharedPayloads();
  if (payloads.length === 0) {
    return undefined;
  }
  try {
    return await toSharedImport(payloads);
  } finally {
    clearSharedPayloads();
  }
}
