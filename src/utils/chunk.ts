/**
 * chunk - Cooperative chunked iteration helpers
 *
 * Utilities to split large arrays into fixed-size chunks and yield control back
 * to the JavaScript event loop between chunks. Used to spread CPU/FS heavy work
 * (e.g. first-launch dataset seeding) across multiple ticks so the JS thread and
 * native bridge are not monopolised by a single long, un-yielded burst.
 *
 * @module chunk
 */

/**
 * Default number of elements processed per chunk. Tuned so cooperative
 * chunk-and-yield loops (dataset seeding, bulk image copy) spread work across
 * enough ticks to keep the JS thread responsive without excessive overhead.
 */
export const DEFAULT_CHUNK_SIZE = 100;

/**
 * Yields control back to the event loop for one tick.
 *
 * Resolves on the next `setImmediate` callback, giving the JS thread and the
 * native bridge a chance to process queued work (UI, gestures, timers) before
 * the caller continues.
 *
 * @returns Promise that resolves on the next event-loop tick
 */
export function yieldToEventLoop(): Promise<void> {
  return new Promise<void>(resolve => {
    setImmediate(resolve);
  });
}

/**
 * Splits `items` into consecutive chunks of at most `chunkSize` elements.
 *
 * @typeParam T - Element type
 * @param items - Source array (not mutated)
 * @param chunkSize - Maximum chunk length; must be a positive integer. Defaults to {@link DEFAULT_CHUNK_SIZE}
 * @returns Array of chunks preserving original order
 * @throws RangeError if `chunkSize` is not a positive integer
 */
export function chunkArray<T>(items: readonly T[], chunkSize: number = DEFAULT_CHUNK_SIZE): T[][] {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new RangeError(`chunkSize must be a positive integer, received ${chunkSize}`);
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Runs `handler` over `items` one chunk at a time, yielding to the event loop
 * between chunks so long runs do not block the main thread.
 *
 * The handler is awaited for each chunk before moving on. No yield is emitted
 * after the final chunk.
 *
 * @typeParam T - Element type
 * @param items - Source array
 * @param handler - Called with each chunk and its zero-based index
 * @param chunkSize - Maximum chunk length; must be a positive integer. Defaults to {@link DEFAULT_CHUNK_SIZE}
 * @throws RangeError if `chunkSize` is not a positive integer
 */
export async function forEachChunk<T>(
  items: readonly T[],
  handler: (chunk: T[], chunkIndex: number) => void | Promise<void>,
  chunkSize: number = DEFAULT_CHUNK_SIZE
): Promise<void> {
  const chunks = chunkArray(items, chunkSize);
  for (const [i, chunk] of chunks.entries()) {
    await handler(chunk, i);
    if (i < chunks.length - 1) {
      await yieldToEventLoop();
    }
  }
}

/**
 * Maps `items` to results one chunk at a time, yielding to the event loop
 * between chunks. Results are concatenated in original order.
 *
 * The mapper receives a whole chunk and returns its mapped results, allowing
 * per-chunk batch work. Use this for CPU-heavy transforms that would otherwise
 * run as a single un-yielded `.map` over a large array.
 *
 * @typeParam T - Input element type
 * @typeParam R - Output element type
 * @param items - Source array
 * @param mapper - Maps a chunk to its results
 * @param chunkSize - Maximum chunk length; must be a positive integer. Defaults to {@link DEFAULT_CHUNK_SIZE}
 * @returns Promise resolving to all mapped results in original order
 * @throws RangeError if `chunkSize` is not a positive integer
 */
export async function mapInChunks<T, R>(
  items: readonly T[],
  mapper: (chunk: T[], chunkIndex: number) => R[] | Promise<R[]>,
  chunkSize: number = DEFAULT_CHUNK_SIZE
): Promise<R[]> {
  const results: R[] = [];
  await forEachChunk(
    items,
    async (chunk, index) => {
      const mapped = await mapper(chunk, index);
      results.push(...mapped);
    },
    chunkSize
  );
  return results;
}
