import { buildShoppingSections } from '@utils/shoppingSections';
import { ComputedShoppingItem, ingredientType } from '@customTypes/DatabaseElementTypes';

const categories = [ingredientType.vegetable, ingredientType.dairy, ingredientType.cereal];

function item(
  name: string,
  type: ComputedShoppingItem['type'],
  purchased: boolean
): ComputedShoppingItem {
  return {
    name,
    type,
    unit: 'g',
    quantity: '100',
    purchased,
    recipeTitles: ['Recipe'],
  };
}

describe('buildShoppingSections', () => {
  test('returns no sections and no purchased items for an empty list', () => {
    expect(buildShoppingSections(categories, [])).toEqual({ sections: [], purchased: [] });
  });

  test('groups items still to buy into their category', () => {
    const items = [
      item('Carrot', ingredientType.vegetable, false),
      item('Milk', ingredientType.dairy, false),
    ];

    const { sections } = buildShoppingSections(categories, items);

    expect(sections).toEqual([
      { title: ingredientType.vegetable, data: [items[0]] },
      { title: ingredientType.dairy, data: [items[1]] },
    ]);
  });

  test('keeps categories in the supplied display order', () => {
    const items = [
      item('Rice', ingredientType.cereal, false),
      item('Milk', ingredientType.dairy, false),
      item('Carrot', ingredientType.vegetable, false),
    ];

    const { sections } = buildShoppingSections(categories, items);

    expect(sections.map(section => section.title)).toEqual([
      ingredientType.vegetable,
      ingredientType.dairy,
      ingredientType.cereal,
    ]);
  });

  test('drops categories that have no item left to buy', () => {
    const items = [
      item('Carrot', ingredientType.vegetable, false),
      item('Milk', ingredientType.dairy, true),
    ];

    const { sections } = buildShoppingSections(categories, items);

    expect(sections.map(section => section.title)).toEqual([ingredientType.vegetable]);
  });

  test('keeps purchased items out of the category sections', () => {
    const items = [
      item('Carrot', ingredientType.vegetable, false),
      item('Leek', ingredientType.vegetable, true),
    ];

    const { sections } = buildShoppingSections(categories, items);

    expect(sections[0]!.data.map(section => section.name)).toEqual(['Carrot']);
  });

  test('collects purchased items in list order', () => {
    const items = [
      item('Leek', ingredientType.vegetable, true),
      item('Carrot', ingredientType.vegetable, false),
      item('Milk', ingredientType.dairy, true),
    ];

    const { purchased } = buildShoppingSections(categories, items);

    expect(purchased.map(entry => entry.name)).toEqual(['Leek', 'Milk']);
  });

  test('returns every item as purchased and no section when the list is fully bought', () => {
    const items = [
      item('Carrot', ingredientType.vegetable, true),
      item('Milk', ingredientType.dairy, true),
    ];

    const { sections, purchased } = buildShoppingSections(categories, items);

    expect(sections).toEqual([]);
    expect(purchased).toHaveLength(2);
  });

  test('keeps the incoming item order inside a category', () => {
    const items = [
      item('Leek', ingredientType.vegetable, false),
      item('Carrot', ingredientType.vegetable, false),
      item('Onion', ingredientType.vegetable, false),
    ];

    const { sections } = buildShoppingSections(categories, items);

    expect(sections[0]!.data.map(entry => entry.name)).toEqual(['Leek', 'Carrot', 'Onion']);
  });

  test('returns no sections when no category is displayed', () => {
    const items = [item('Carrot', ingredientType.vegetable, false)];

    expect(buildShoppingSections([], items)).toEqual({ sections: [], purchased: [] });
  });

  test('returns purchased items whatever the displayed categories', () => {
    const items = [item('Salmon', ingredientType.fish, true)];

    const { sections, purchased } = buildShoppingSections(categories, items);

    expect(sections).toEqual([]);
    expect(purchased.map(entry => entry.name)).toEqual(['Salmon']);
  });

  test('ignores items whose category is not in the display list', () => {
    const items = [item('Salmon', ingredientType.fish, false)];

    const { sections, purchased } = buildShoppingSections(categories, items);

    expect(sections).toEqual([]);
    expect(purchased).toEqual([]);
  });
});
