/**
 * Search-field focus mode for the recipe form (see architecture/recipe-form.md).
 *
 * @module utils/autocompleteFocusMode
 */

import type { HostInstance } from 'react-native';
import { AUTOCOMPLETE_ANCHOR_ID } from '@components/molecules/TextInputWithDropDown';
import {
  AUTOCOMPLETE_ROW_HEIGHT,
  getAutocompleteBubbleHeight,
} from '@components/molecules/AutocompleteBubble';
import { padding } from '@styles/spacing';

/** Read-only DOM-like element of the native tree; the Strict TypeScript API does not export it */
export type ReadOnlyElement = NonNullable<HostInstance['parentElement']>;

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

/** Gap between the top of the scroll view and a pinned autocomplete field */
export const AUTOCOMPLETE_PIN_GAP = padding.small;

/**
 * Maximum height of the suggestion list so the bubble of a field pinned `AUTOCOMPLETE_PIN_GAP`
 * below the scroll view top ends above the keyboard toolbar: the room between the pinned input's
 * bottom and the keyboard, minus `baseOffset` (toolbar plus caret clearance) and the bubble's tail
 * and padding. Independent of the rows shown, so it stays stable while typing.
 *
 * @param baseOffset - The form's `bottomOffset` (toolbar plus caret clearance)
 * @param fieldHeight - Height of the focused autocomplete field, `null` for any other input
 * @param scrollViewTop - Window y of the scroll view's top edge, `null` until measured
 * @param windowHeight - Window height, as used by the keyboard-aware scroll view
 * @param keyboardHeight - Height the keyboard has (or is animating to); `0` when hidden
 * @returns List height in pixels, never below one suggestion row; `undefined` (no cap) when no
 *   autocomplete field is focused above an open keyboard or the scroll view is not measured yet
 */
export function getAutocompleteMaxListHeight(
  baseOffset: number,
  fieldHeight: number | null,
  scrollViewTop: number | null,
  windowHeight: number,
  keyboardHeight: number
): number | undefined {
  if (fieldHeight === null || scrollViewTop === null || keyboardHeight <= 0) {
    return undefined;
  }
  const roomBelowPinnedInput =
    windowHeight - keyboardHeight - scrollViewTop - AUTOCOMPLETE_PIN_GAP - fieldHeight;
  return Math.max(
    AUTOCOMPLETE_ROW_HEIGHT,
    roomBelowPinnedInput - baseOffset - getAutocompleteBubbleHeight(0)
  );
}

/**
 * Scroll position that pins an autocomplete field `AUTOCOMPLETE_PIN_GAP` below the top of the
 * scroll view.
 * `anchorTop` and `scrollViewTop` must be measured in the same coordinate space at the same time.
 *
 * @param currentScrollY - Current vertical scroll offset of the scroll view
 * @param anchorTop - Top edge of the focused autocomplete field
 * @param scrollViewTop - Top edge of the scroll view
 * @returns The vertical offset to scroll to, never below `0`
 */
export function getAutocompletePinScrollY(
  currentScrollY: number,
  anchorTop: number,
  scrollViewTop: number
): number {
  return Math.max(0, currentScrollY + anchorTop - scrollViewTop - AUTOCOMPLETE_PIN_GAP);
}
