import { byName } from '@utils/sorting';

describe('sorting', () => {
  const names = ['banana', 'Apple', 'cherry', 'apple', 'Banana', 'Date', 'ábaco'];

  describe('byName', () => {
    test('orders objects by name matching localeCompare', () => {
      const items = names.map((name, id) => ({ id, name }));

      const viaHelper = [...items].sort(byName).map(item => item.name);
      const viaLocaleCompare = [...items]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(i => i.name);

      expect(viaHelper).toEqual(viaLocaleCompare);
    });
  });
});
