import { bugReportSchema } from '@schemas/bugReportSchema';

describe('bugReportSchema', () => {
  test('fails when description is empty', () => {
    const result = bugReportSchema.safeParse({ description: '' });
    expect(result.success).toBe(false);
  });

  test('fails when description is whitespace only', () => {
    const result = bugReportSchema.safeParse({ description: '   ' });
    expect(result.success).toBe(false);
  });

  test('passes with valid description', () => {
    const result = bugReportSchema.safeParse({ description: 'App crashed on launch' });
    expect(result.success).toBe(true);
  });

  test('trims description before validation', () => {
    const result = bugReportSchema.safeParse({ description: '  valid  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('valid');
    }
  });

  test('defaults screenshots to empty array when not provided', () => {
    const result = bugReportSchema.safeParse({ description: 'bug' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.screenshots).toEqual([]);
    }
  });

  test('passes with valid screenshots array', () => {
    const result = bugReportSchema.safeParse({
      description: 'bug',
      screenshots: ['file:///screenshot1.jpg', 'file:///screenshot2.jpg'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.screenshots).toHaveLength(2);
    }
  });

  test('fails when screenshots contains non-string values', () => {
    const result = bugReportSchema.safeParse({
      description: 'bug',
      screenshots: [123, 456],
    });
    expect(result.success).toBe(false);
  });

  test('error message key matches i18n key for empty description', () => {
    const result = bugReportSchema.safeParse({ description: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('bugReport.descriptionRequired');
    }
  });
});
