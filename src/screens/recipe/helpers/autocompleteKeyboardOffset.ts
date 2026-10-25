/**
 * Search-field focus mode for the recipe form (see ARCHITECTURE.md).
 *
 * @module screens/recipe/helpers/autocompleteKeyboardOffset
 */

import type { HostInstance } from 'react-native';
import { AUTOCOMPLETE_ANCHOR_ID } from '@components/molecules/TextInputWithDropDown';
import {
  AUTOCOMPLETE_MAX_VISIBLE_ROWS,
  getAutocompleteBubbleHeight,
} from '@components/molecules/AutocompleteBubble';
import { padding } from '@styles/spacing';

/** Read-only DOM-like element of the native tree; the Strict TypeScript API does not export it */
export type ReadOnlyElement = NonNullable<HostInstance['parentElement']>;

/** Height of a suggestion bubble showing the maximum number of visible rows */
export const AUTOCOMPLETE_BUBBLE_MAX_HEIGHT = getAutocompleteBubbleHeight(
  AUTOCOMPLETE_MAX_VISIBLE_ROWS
);

/**
 * Finds the autocomplete wrapper enclosing a focused element.
 *
 * @param element - The element that received focus
 * @returns The closest element (itself included) whose id is `AUTOCOMPLETE_ANCHOR_ID`, or `null`
 *   when the element is not part of an autocomplete input
 */
export function findAutocompleteAnchor(element: ReadOnlyElement): ReadOnlyElement | null {
  let current: ReadOnlyElement | null = element;
  while (current !== null) {
    if (current.id === AUTOCOMPLETE_ANCHOR_ID) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * Measures how tall a focused autocomplete field is above the bottom of its text input.
 *
 * @param focusedInput - The `TextInput` element that received focus
 * @param anchor - Its autocomplete wrapper, as found by `findAutocompleteAnchor`
 * @returns Distance from the top of the field to the bottom of the input
 */
export function measureAutocompleteFieldHeight(
  focusedInput: ReadOnlyElement,
  anchor: ReadOnlyElement
): number {
  return focusedInput.getBoundingClientRect().bottom - anchor.getBoundingClientRect().top;
}

/**
 * `bottomOffset` for the keyboard-aware scroll view. With an autocomplete field focused and the
 * keyboard open, adds room for a full suggestion bubble, capped so the field stays a small gap
 * below the top of the scroll view (the scroll view puts the input's bottom `bottomOffset` above
 * the keyboard).
 *
 * @param baseOffset - Offset used for every other input
 * @param fieldHeight - Height of the focused autocomplete field, `null` for any other input
 * @param scrollViewTop - Window y of the scroll view's top edge, `null` until measured
 * @param windowHeight - Window height, as used by the keyboard-aware scroll view
 * @param keyboardHeight - Height the keyboard has (or is animating to); `0` when hidden
 * @returns The offset, never below `baseOffset`
 */
export function getAutocompleteBottomOffset(
  baseOffset: number,
  fieldHeight: number | null,
  scrollViewTop: number | null,
  windowHeight: number,
  keyboardHeight: number
): number {
  if (fieldHeight === null || scrollViewTop === null || keyboardHeight <= 0) {
    return baseOffset;
  }
  const room = windowHeight - keyboardHeight - scrollViewTop - fieldHeight - padding.small;
  return Math.max(baseOffset, Math.min(baseOffset + AUTOCOMPLETE_BUBBLE_MAX_HEIGHT, room));
}
