import { epochMillis } from '@utils/time';

describe('epochMillis', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the current epoch milliseconds from the platform clock', () => {
    const fixed = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(fixed);

    expect(epochMillis()).toBe(fixed);
  });

  it('returns an integer value', () => {
    const result = epochMillis();

    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
  });
});
