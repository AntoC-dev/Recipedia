import { AUTOCOMPLETE_ANCHOR_ID } from '@components/molecules/TextInputWithDropDown';
import {
  AUTOCOMPLETE_MAX_VISIBLE_ROWS,
  AUTOCOMPLETE_ROW_HEIGHT,
  getAutocompleteBubbleHeight,
  getAutocompleteListHeight,
} from '@components/molecules/AutocompleteBubble';
import {
  AUTOCOMPLETE_PIN_GAP,
  findAutocompleteAnchor,
  getAutocompletePinScrollY,
  getAutocompleteMaxListHeight,
  measureAutocompleteFieldHeight,
} from '@utils/autocompleteFocusMode';
import { fakeReadOnlyElement } from '@test-helpers/fakeReadOnlyElement';

describe('findAutocompleteAnchor', () => {
  test('returns the closest ancestor tagged as autocomplete anchor', () => {
    const anchor = fakeReadOnlyElement(
      AUTOCOMPLETE_ANCHOR_ID,
      undefined,
      fakeReadOnlyElement('Form')
    );
    const focusedInput = fakeReadOnlyElement(
      '',
      undefined,
      fakeReadOnlyElement('InputContainer', undefined, anchor)
    );

    expect(findAutocompleteAnchor(focusedInput)).toBe(anchor);
  });

  test('returns the element itself when it is the anchor', () => {
    const anchor = fakeReadOnlyElement(AUTOCOMPLETE_ANCHOR_ID);

    expect(findAutocompleteAnchor(anchor)).toBe(anchor);
  });

  test('returns null when no ancestor is an anchor', () => {
    const focusedInput = fakeReadOnlyElement(
      '',
      undefined,
      fakeReadOnlyElement('InputContainer', undefined, fakeReadOnlyElement('Form'))
    );

    expect(findAutocompleteAnchor(focusedInput)).toBeNull();
  });
});

describe('measureAutocompleteFieldHeight', () => {
  test('measures from the anchor top to the focused input bottom', () => {
    const anchor = fakeReadOnlyElement(AUTOCOMPLETE_ANCHOR_ID, { top: 900, bottom: 1100 });
    const focusedInput = fakeReadOnlyElement('', { top: 910, bottom: 960 }, anchor);

    expect(measureAutocompleteFieldHeight(focusedInput, anchor)).toBe(60);
  });
});

describe('getAutocompleteMaxListHeight', () => {
  const baseOffset = 100;
  const windowHeight = 2400;
  const keyboardHeight = 900;
  const scrollViewTop = 264;
  const fieldHeight = 60;
  const bubbleChrome = getAutocompleteBubbleHeight(0);
  const keyboardTop = windowHeight - keyboardHeight;

  function keyboardHeightLeavingListRoom(listRoom: number) {
    const pinnedInputBottom = scrollViewTop + AUTOCOMPLETE_PIN_GAP + fieldHeight;
    return windowHeight - (pinnedInputBottom + baseOffset + bubbleChrome + listRoom);
  }

  test('limits the list to the room between the pinned input and the toolbar', () => {
    expect(
      getAutocompleteMaxListHeight(
        baseOffset,
        fieldHeight,
        scrollViewTop,
        windowHeight,
        keyboardHeight
      )
    ).toBe(
      keyboardTop - scrollViewTop - AUTOCOMPLETE_PIN_GAP - fieldHeight - baseOffset - bubbleChrome
    );
  });

  test('limits the list to a short room', () => {
    expect(
      getAutocompleteMaxListHeight(
        baseOffset,
        fieldHeight,
        scrollViewTop,
        windowHeight,
        keyboardHeightLeavingListRoom(70)
      )
    ).toBe(70);
  });

  test('leaves a full list uncut when the room holds it', () => {
    const fullListHeight = getAutocompleteListHeight(AUTOCOMPLETE_MAX_VISIBLE_ROWS);

    expect(
      getAutocompleteMaxListHeight(
        baseOffset,
        fieldHeight,
        scrollViewTop,
        windowHeight,
        keyboardHeightLeavingListRoom(fullListHeight)
      )
    ).toBe(fullListHeight);
  });

  test('keeps at least one suggestion row when there is no room left', () => {
    expect(
      getAutocompleteMaxListHeight(
        baseOffset,
        fieldHeight,
        scrollViewTop,
        windowHeight,
        keyboardHeightLeavingListRoom(-500)
      )
    ).toBe(AUTOCOMPLETE_ROW_HEIGHT);
  });

  test('does not cap the list for any other input', () => {
    expect(
      getAutocompleteMaxListHeight(baseOffset, null, scrollViewTop, windowHeight, keyboardHeight)
    ).toBeUndefined();
  });

  test('does not cap the list until the scroll view is measured', () => {
    expect(
      getAutocompleteMaxListHeight(baseOffset, fieldHeight, null, windowHeight, keyboardHeight)
    ).toBeUndefined();
  });

  test('does not cap the list while the keyboard is hidden', () => {
    expect(
      getAutocompleteMaxListHeight(baseOffset, fieldHeight, scrollViewTop, windowHeight, 0)
    ).toBeUndefined();
  });
});

describe('getAutocompletePinScrollY', () => {
  const scrollViewTop = 264;

  test('scrolls down when the field sits below the pinned spot', () => {
    expect(getAutocompletePinScrollY(400, 900, scrollViewTop)).toBe(
      400 + 900 - scrollViewTop - AUTOCOMPLETE_PIN_GAP
    );
  });

  test('scrolls up when the field sits above the pinned spot', () => {
    expect(getAutocompletePinScrollY(1200, 150, scrollViewTop)).toBe(
      1200 + 150 - scrollViewTop - AUTOCOMPLETE_PIN_GAP
    );
  });

  test('keeps the scroll position when the field is already pinned', () => {
    expect(
      getAutocompletePinScrollY(700, scrollViewTop + AUTOCOMPLETE_PIN_GAP, scrollViewTop)
    ).toBe(700);
  });

  test('stops at the top of the content for a field near the top', () => {
    expect(getAutocompletePinScrollY(0, scrollViewTop, scrollViewTop)).toBe(0);
  });

  test('never scrolls above the content when the field is far above the scroll view', () => {
    expect(getAutocompletePinScrollY(30, 100, scrollViewTop)).toBe(0);
  });

  test('keeps fractional positions', () => {
    expect(getAutocompletePinScrollY(100.25, 500.5, 264.25)).toBe(
      100.25 + 500.5 - 264.25 - AUTOCOMPLETE_PIN_GAP
    );
  });
});
