import { testProps } from '@utils/testProps';

describe('testProps', () => {
  it('returns object with testID and accessibilityLabel set to the same value', () => {
    const result = testProps('MyButton');

    expect(result).toEqual({
      testID: 'MyButton',
      accessibilityLabel: 'MyButton',
    });
  });

  it('handles nested testID patterns', () => {
    const result = testProps('BottomTabs::Home');

    expect(result).toEqual({
      testID: 'BottomTabs::Home',
      accessibilityLabel: 'BottomTabs::Home',
    });
  });

  it('handles dynamic testID with template literal', () => {
    const prefix = 'SearchScreen';
    const index = 0;
    const result = testProps(`${prefix}::RecipeCards::${index}`);

    expect(result).toEqual({
      testID: 'SearchScreen::RecipeCards::0',
      accessibilityLabel: 'SearchScreen::RecipeCards::0',
    });
  });

  it('handles empty string', () => {
    const result = testProps('');

    expect(result).toEqual({
      testID: '',
      accessibilityLabel: '',
    });
  });

  it('handles special characters in testID', () => {
    const result = testProps('Recipe::Title::Chicken & Waffles');

    expect(result).toEqual({
      testID: 'Recipe::Title::Chicken & Waffles',
      accessibilityLabel: 'Recipe::Title::Chicken & Waffles',
    });
  });
});
