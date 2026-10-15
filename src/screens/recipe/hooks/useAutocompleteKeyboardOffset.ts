/**
 * Wires the recipe form's search-field focus mode (see ARCHITECTURE.md).
 *
 * @module screens/recipe/hooks/useAutocompleteKeyboardOffset
 */

import { useRef, useState } from 'react';
import { findNodeHandle, FocusEvent, View } from 'react-native';
import {
  KeyboardControllerNative,
  useKeyboardState,
  useWindowDimensions,
} from 'react-native-keyboard-controller';
import {
  findAutocompleteAnchor,
  getAutocompleteBottomOffset,
  measureAutocompleteFieldHeight,
} from '@screens/recipe/helpers/autocompleteKeyboardOffset';
import { recipeLogger } from '@utils/logger';

/**
 * `bottomOffset` for the form's keyboard-aware scroll view, lifting a focused autocomplete input
 * high enough for its suggestion bubble, plus the ref and handlers for the view wrapping the
 * scroll view (it needs `collapsable={false}`). The scroll view's top is measured in window
 * coordinates on layout, with the native call the keyboard-aware scroll view itself uses, and
 * again on autocomplete focus while unknown: on iOS the layout measure can run before the native
 * view is attached to the key window and be rejected.
 *
 * @param baseOffset - `bottomOffset` for non-autocomplete inputs
 * @returns The offset, the wrapper ref, and its layout and focus handlers
 */
export function useAutocompleteKeyboardOffset(baseOffset: number) {
  const scrollViewWrapperRef = useRef<View>(null);
  const [scrollViewTop, setScrollViewTop] = useState<number | null>(null);
  const [fieldHeight, setFieldHeight] = useState<number | null>(null);
  const keyboardHeight = useKeyboardState(state => state.height);
  const { height: windowHeight } = useWindowDimensions();

  function measureScrollViewTop(logFailure: (message: string, error: unknown) => void) {
    const handle = findNodeHandle(scrollViewWrapperRef.current);
    if (handle === null) {
      return;
    }
    KeyboardControllerNative.viewPositionInWindow(handle)
      .then(({ y }) => setScrollViewTop(y))
      .catch(error => logFailure('Could not measure the form scroll view', error));
  }

  function onScrollViewLayout() {
    measureScrollViewTop(recipeLogger.debug);
  }

  function onScrollViewFocus(event: FocusEvent) {
    const focusedInput = event.target;
    const anchor = findAutocompleteAnchor(focusedInput);
    if (anchor === null) {
      setFieldHeight(null);
      return;
    }
    setFieldHeight(measureAutocompleteFieldHeight(focusedInput, anchor));
    if (scrollViewTop === null) {
      measureScrollViewTop(recipeLogger.warn);
    }
  }

  return {
    bottomOffset: getAutocompleteBottomOffset(
      baseOffset,
      fieldHeight,
      scrollViewTop,
      windowHeight,
      keyboardHeight
    ),
    scrollViewWrapperRef,
    onScrollViewLayout,
    onScrollViewFocus,
  };
}
