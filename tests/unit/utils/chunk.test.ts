import {
  chunkArray,
  DEFAULT_CHUNK_SIZE,
  forEachChunk,
  mapInChunks,
  yieldToEventLoop,
} from '@utils/chunk';

describe('chunkArray', () => {
  test('splits into consecutive chunks preserving order', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('returns single chunk when chunkSize exceeds length', () => {
    expect(chunkArray([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  test('returns empty array for empty input', () => {
    expect(chunkArray([], 3)).toEqual([]);
  });

  test('does not mutate the source array', () => {
    const source = [1, 2, 3];
    chunkArray(source, 2);
    expect(source).toEqual([1, 2, 3]);
  });

  test.each([0, -1, 1.5, NaN])('throws for invalid chunkSize %p', size => {
    expect(() => chunkArray([1, 2, 3], size)).toThrow(RangeError);
  });

  test('defaults to DEFAULT_CHUNK_SIZE when chunkSize omitted', () => {
    const items = Array.from({ length: DEFAULT_CHUNK_SIZE + 1 }, (_, i) => i);
    const chunks = chunkArray(items);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(DEFAULT_CHUNK_SIZE);
    expect(chunks[1]).toHaveLength(1);
  });
});

describe('yieldToEventLoop', () => {
  test('resolves on a later event-loop tick', async () => {
    const order: string[] = [];
    const pending = yieldToEventLoop().then(() => order.push('after-yield'));
    order.push('sync');
    await pending;
    expect(order).toEqual(['sync', 'after-yield']);
  });
});

describe('forEachChunk', () => {
  test('invokes handler once per chunk with index', async () => {
    const seen: { chunk: number[]; index: number }[] = [];
    await forEachChunk(
      [1, 2, 3, 4, 5],
      (chunk, index) => {
        seen.push({ chunk, index });
      },
      2
    );
    expect(seen).toEqual([
      { chunk: [1, 2], index: 0 },
      { chunk: [3, 4], index: 1 },
      { chunk: [5], index: 2 },
    ]);
  });

  test('awaits async handlers before advancing', async () => {
    const order: number[] = [];
    await forEachChunk(
      [1, 2, 3, 4],
      async chunk => {
        await Promise.resolve();
        order.push(chunk[0]!);
      },
      2
    );
    expect(order).toEqual([1, 3]);
  });

  test('yields between chunks but not after the last one', async () => {
    const spy = jest.spyOn(global, 'setImmediate');
    await forEachChunk([1, 2, 3, 4, 5], () => {}, 2);
    const yields = spy.mock.calls.length;
    spy.mockRestore();
    expect(yields).toBe(2);
  });

  test('defaults to DEFAULT_CHUNK_SIZE when chunkSize omitted', async () => {
    const items = Array.from({ length: DEFAULT_CHUNK_SIZE + 1 }, (_, i) => i);
    const chunkLengths: number[] = [];
    await forEachChunk(items, chunk => {
      chunkLengths.push(chunk.length);
    });
    expect(chunkLengths).toEqual([DEFAULT_CHUNK_SIZE, 1]);
  });

  test('does nothing for empty input', async () => {
    const handler = jest.fn();
    await forEachChunk([], handler, 2);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('mapInChunks', () => {
  test('concatenates chunk results in original order', async () => {
    const result = await mapInChunks([1, 2, 3, 4, 5], chunk => chunk.map(n => n * 10), 2);
    expect(result).toEqual([10, 20, 30, 40, 50]);
  });

  test('supports async mappers', async () => {
    const result = await mapInChunks(
      [1, 2, 3],
      async chunk => {
        await Promise.resolve();
        return chunk.map(n => n + 1);
      },
      2
    );
    expect(result).toEqual([2, 3, 4]);
  });

  test('defaults to DEFAULT_CHUNK_SIZE when chunkSize omitted', async () => {
    const items = Array.from({ length: DEFAULT_CHUNK_SIZE + 1 }, (_, i) => i);
    const result = await mapInChunks(items, chunk => chunk.map(n => n * 2));
    expect(result).toEqual(items.map(n => n * 2));
  });

  test('returns empty array for empty input', async () => {
    expect(await mapInChunks([], chunk => chunk, 2)).toEqual([]);
  });
});
