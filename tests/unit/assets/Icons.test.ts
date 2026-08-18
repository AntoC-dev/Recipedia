import { iconsSize } from '@assets/Icons';
import { remValue } from '@styles/spacing';

describe('iconsSize', () => {
  const tokens = ['verySmall', 'small', 'medium', 'large', 'veryLarge'] as const;
  const baseValues = { verySmall: 12, small: 16, medium: 20, large: 28, veryLarge: 40 };

  it.each(tokens)('%s is a positive number derived from remValue', token => {
    const value = iconsSize[token];
    expect(value).toBeGreaterThan(0);
    expect(Number.isFinite(value)).toBe(true);
    expect(value / remValue).toBeCloseTo(baseValues[token]);
  });

  it('is monotonically increasing across the scale', () => {
    const values = tokens.map(token => iconsSize[token]);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]!);
    }
  });
});
