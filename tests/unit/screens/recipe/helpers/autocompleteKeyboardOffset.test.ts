import type { ReadOnlyElement } from 'react-native';
import { AUTOCOMPLETE_ANCHOR_ID } from '@components/molecules/TextInputWithDropDown';
import {
  AUTOCOMPLETE_BUBBLE_MAX_HEIGHT,
  findAutocompleteAnchor,
  getAutocompleteBottomOffset,
  measureAutocompleteFieldHeight,
} from '@screens/recipe/helpers/autocompleteKeyboardOffset';
import { padding } from '@styles/spacing';

function element(
  id: string,
  parentElement: ReadOnlyElement | null = null,
  rect = { top: 0, bottom: 0 }
): ReadOnlyElement {
  return { id, parentElement, getBoundingClientRect: () => rect } as unknown as ReadOnlyElement;
}

describe('findAutocompleteAnchor', () => {
  test('returns the closest ancestor tagged as autocomplete anchor', () => {
    const anchor = element(AUTOCOMPLETE_ANCHOR_ID, element('Form'));
    const focusedInput = element('', element('InputContainer', anchor));

    expect(findAutocompleteAnchor(focusedInput)).toBe(anchor);
  });

  test('returns the element itself when it is the anchor', () => {
    const anchor = element(AUTOCOMPLETE_ANCHOR_ID);

    expect(findAutocompleteAnchor(anchor)).toBe(anchor);
  });

  test('returns null when no ancestor is an anchor', () => {
    const focusedInput = element('', element('InputContainer', element('Form')));

    expect(findAutocompleteAnchor(focusedInput)).toBeNull();
  });
});

describe('measureAutocompleteFieldHeight', () => {
  test('measures from the anchor top to the focused input bottom', () => {
    const anchor = element(AUTOCOMPLETE_ANCHOR_ID, null, { top: 900, bottom: 1100 });
    const focusedInput = element('', anchor, { top: 910, bottom: 960 });

    expect(measureAutocompleteFieldHeight(focusedInput, anchor)).toBe(60);
  });
});

describe('getAutocompleteBottomOffset', () => {
  const baseOffset = 100;
  const windowHeight = 2400;
  const keyboardHeight = 900;
  const scrollViewTop = 264;
  const fieldHeight = 60;

  test('keeps the base offset for any other input', () => {
    expect(
      getAutocompleteBottomOffset(baseOffset, null, scrollViewTop, windowHeight, keyboardHeight)
    ).toBe(baseOffset);
  });

  test('keeps the base offset until the scroll view is measured', () => {
    expect(
      getAutocompleteBottomOffset(baseOffset, fieldHeight, null, windowHeight, keyboardHeight)
    ).toBe(baseOffset);
  });

  test('keeps the base offset while the keyboard is hidden', () => {
    expect(
      getAutocompleteBottomOffset(baseOffset, fieldHeight, scrollViewTop, windowHeight, 0)
    ).toBe(baseOffset);
  });

  test('adds a full bubble when it fits between the scroll view top and the keyboard', () => {
    expect(
      getAutocompleteBottomOffset(
        baseOffset,
        fieldHeight,
        scrollViewTop,
        windowHeight,
        keyboardHeight
      )
    ).toBe(baseOffset + AUTOCOMPLETE_BUBBLE_MAX_HEIGHT);
  });

  test('caps the offset so the field stays a small gap below the scroll view top', () => {
    const tallKeyboard = 1900;
    const room = windowHeight - tallKeyboard - scrollViewTop - fieldHeight;

    expect(
      getAutocompleteBottomOffset(
        baseOffset,
        fieldHeight,
        scrollViewTop,
        windowHeight,
        tallKeyboard
      )
    ).toBe(room - padding.small);
  });

  test('never goes below the base offset when there is no room at all', () => {
    expect(
      getAutocompleteBottomOffset(baseOffset, fieldHeight, scrollViewTop, windowHeight, 2200)
    ).toBe(baseOffset);
  });
});
