/**
 * useVisibleImageLoader - Hook for visibility-based image URL loading
 *
 * Fetches image URLs only for recipes that are visible or near-visible in the viewport,
 * dramatically reducing network requests for large recipe lists. Uses debouncing to
 * prevent fetch spam during fast scrolling and supports fetch cancellation.
 *
 * Key Features:
 * - Only fetches image URLs for visible/near-visible items
 * - Debounces visibility changes to avoid fetch spam
 * - Cancels in-flight fetches for items that leave viewport
 * - Limits concurrent fetches to prevent memory exhaustion
 * - Tracks fetched URLs to avoid duplicate requests
 *
 * @module hooks/useVisibleImageLoader
 */

import { useEffect, useRef, useState } from 'react';
import { DiscoveredRecipe } from '@customTypes/BulkImportTypes';
import {
  buildFetchQueue,
  cancelOutOfBoundsFetches,
  computeBufferBounds,
  computeVisibleBounds,
  getBufferRecipesNeedingFetch,
} from '@utils/BulkImportUtils';

/** Default number of items to fetch beyond visible viewport */
const DEFAULT_BUFFER_SIZE = 10;

/** Default debounce delay for visibility changes in milliseconds */
const DEFAULT_DEBOUNCE_MS = 150;

/** Default maximum concurrent image fetch requests */
const DEFAULT_MAX_CONCURRENT = 5;

/**
 * Options for configuring the visibility-based image loader
 */
export interface UseVisibleImageLoaderOptions {
  /** All discovered recipes that may need image URLs */
  recipes: DiscoveredRecipe[];

  /** Set of recipe URLs currently visible in the viewport */
  visibleUrls: Set<string>;

  /** Function to fetch the image URL for a given recipe URL */
  fetchImageUrl: (url: string, signal: AbortSignal) => Promise<string | null>;

  /** Number of items beyond viewport to pre-fetch (default: 10) */
  bufferSize?: number;

  /** Debounce delay for visibility changes in ms (default: 150) */
  debounceMs?: number;

  /** Maximum concurrent fetch requests (default: 5) */
  maxConcurrent?: number;
}

/**
 * Return value of the useVisibleImageLoader hook
 */
export interface UseVisibleImageLoaderReturn {
  /** Map of recipe URLs to their fetched image URLs */
  imageMap: Map<string, string>;

  /** Number of image fetches currently pending */
  pendingCount: number;
}

/**
 * Hook for loading image URLs based on viewport visibility
 *
 * Optimizes network usage by only fetching image URLs for recipes that are
 * visible or about to become visible in the viewport. Includes debouncing,
 * cancellation, and concurrency limiting.
 *
 * @param options - Configuration options for the loader
 * @returns Object containing the imageMap and pending count
 *
 * @example
 * ```tsx
 * const { imageMap, pendingCount } = useVisibleImageLoader({
 *   recipes: discoveredRecipes,
 *   visibleUrls: currentlyVisibleUrls,
 *   fetchImageUrl: (url, signal) => provider.fetchImageUrlForRecipe(url, signal),
 * });
 * ```
 */
export function useVisibleImageLoader({
  recipes,
  visibleUrls,
  fetchImageUrl,
  bufferSize = DEFAULT_BUFFER_SIZE,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  maxConcurrent = DEFAULT_MAX_CONCURRENT,
}: UseVisibleImageLoaderOptions): UseVisibleImageLoaderReturn {
  const [imageMap, setImageMap] = useState<Map<string, string>>(new Map());
  const [pendingCount, setPendingCount] = useState(0);

  const fetchedUrlsRef = useRef<Set<string>>(new Set());
  const pendingUrlsRef = useRef<Set<string>>(new Set());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const activeCountRef = useRef(0);
  const queueRef = useRef<string[]>([]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      processVisibilityChange();
    }, debounceMs);

    return () => clearTimeout(debounceTimer);

    /**
     * Processes visibility changes by computing which recipes need fetching
     * and updating the fetch queue accordingly.
     */
    function processVisibilityChange() {
      const visibleBounds = computeVisibleBounds(recipes, visibleUrls);
      const bufferBounds = computeBufferBounds(visibleBounds, bufferSize, recipes.length);

      const recipesNeedingImages = recipes.filter(r => !r.imageUrl);
      const visibleRecipesNeedingImages = recipesNeedingImages.filter(r => visibleUrls.has(r.url));

      const bufferRecipes = getBufferRecipesNeedingFetch(
        recipes,
        bufferBounds,
        visibleUrls,
        fetchedUrlsRef.current,
        pendingUrlsRef.current
      );

      const urlsToFetch = buildFetchQueue(
        visibleRecipesNeedingImages,
        bufferRecipes,
        fetchedUrlsRef.current,
        pendingUrlsRef.current
      );

      cancelOutOfBoundsFetches(
        recipes,
        visibleUrls,
        bufferBounds,
        abortControllersRef.current,
        pendingUrlsRef.current
      );

      queueRef.current = urlsToFetch;
      processQueue();
    }

    /**
     * Processes the image fetch queue with concurrency limiting.
     * Dequeues URLs and fetches their image URLs up to maxConcurrent at a time.
     * Recursively calls itself when a fetch completes to maintain throughput.
     */
    function processQueue() {
      while (activeCountRef.current < maxConcurrent && queueRef.current.length > 0) {
        const url = queueRef.current.shift();
        if (!url) break;

        if (fetchedUrlsRef.current.has(url) || pendingUrlsRef.current.has(url)) {
          continue;
        }

        pendingUrlsRef.current.add(url);
        activeCountRef.current++;
        setPendingCount(prev => prev + 1);

        const controller = new AbortController();
        abortControllersRef.current.set(url, controller);

        fetchImageUrl(url, controller.signal)
          .then(imageUrl => {
            if (imageUrl && !controller.signal.aborted) {
              fetchedUrlsRef.current.add(url);
              setImageMap(prev => new Map(prev).set(url, imageUrl));
            }
          })
          .catch(() => {
            // Silently ignore fetch errors
          })
          .finally(() => {
            pendingUrlsRef.current.delete(url);
            abortControllersRef.current.delete(url);
            activeCountRef.current--;
            setPendingCount(prev => Math.max(0, prev - 1));
            processQueue();
          });
      }
    }
  }, [recipes, visibleUrls, fetchImageUrl, bufferSize, debounceMs, maxConcurrent]);

  useEffect(() => {
    return () => {
      for (const controller of abortControllersRef.current.values()) {
        controller.abort();
      }
      abortControllersRef.current.clear();
    };
  }, []);

  return { imageMap, pendingCount };
}
