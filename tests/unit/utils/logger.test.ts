import { serializeError } from '@utils/logger';

describe('serializeError', () => {
  test('copies the name, message and stack of an Error into a JSON-serializable object', () => {
    const error = new TypeError('Network request failed');

    const serialized = JSON.parse(JSON.stringify(serializeError(error)));

    expect(serialized).toEqual({
      name: 'TypeError',
      message: 'Network request failed',
      stack: error.stack,
    });
  });

  test('stringifies non-Error values', () => {
    expect(serializeError('boom')).toEqual({ value: 'boom' });
    expect(serializeError(undefined)).toEqual({ value: 'undefined' });
  });
});
