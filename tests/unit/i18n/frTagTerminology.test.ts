import fr from '@translations/fr';

function flattenValues(obj: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      const next = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(out, flattenValues(v, next));
      } else if (Array.isArray(v)) {
        v.forEach((item, index) => {
          if (typeof item === 'string') {
            out[`${next}.${index}`] = item;
          }
        });
      } else if (typeof v === 'string') {
        out[next] = v;
      }
    });
  }
  return out;
}

const stripPlaceholders = (value: string) => value.replace(/\{\{[^}]*\}\}/g, '');

describe('French tag terminology', () => {
  const values = flattenValues(fr);

  test('no user-facing French value uses the anglicism "tag"', () => {
    const offenders = Object.entries(values)
      .filter(([, value]) => /\btags?\b/i.test(stripPlaceholders(value)))
      .map(([key, value]) => ({ key, value }));

    expect(offenders).toEqual([]);
  });

  test('tag-related labels use "étiquette"', () => {
    expect(values['edit_tag']).toBe("Modifier l'étiquette");
    expect(values['add_tag']).toBe('Ajouter une étiquette');
    expect(values['alerts.tagSimilarity.newTagTitle']).toBe('Étiquette introuvable');
    expect(values['alerts.tagSimilarity.pickerTitle']).toBe('Choisir une étiquette');
  });
});
