/**
 * Keyboard-aware scroll view of the recipe form running its search-field focus mode
 * (see architecture/recipe-form.md).
 *
 * @module screens/recipe/AutocompleteFocusScrollView
 */

import React, { ReactNode, useRef, useState } from 'react';
import {
  findNodeHandle,
  FocusEvent,
  HostInstance,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewImperativeMethods,
  View,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
  KeyboardAwareScrollViewRef,
  KeyboardControllerNative,
  useKeyboardHandler,
  useKeyboardState,
  useWindowDimensions,
} from 'react-native-keyboard-controller';
import { scheduleOnRN } from 'react-native-worklets';
import { AutocompleteMaxListHeightContext } from '@context/AutocompleteMaxListHeightContext';
import {
  findAutocompleteAnchor,
  getAutocompleteMaxListHeight,
  getAutocompletePinScrollY,
  measureAutocompleteFieldHeight,
  ReadOnlyElement,
} from '@utils/autocompleteFocusMode';
import { layout } from '@styles/layout';
import { recipeLogger } from '@utils/logger';

type FormScrollView = KeyboardAwareScrollViewRef & ScrollViewImperativeMethods;

type FocusedAutocomplete = { anchor: ReadOnlyElement; scrollViewWrapper: ReadOnlyElement };

const minimumPinScroll = 1;

/** Props of `AutocompleteFocusScrollView`: every `KeyboardAwareScrollView` prop is forwarded */
export type AutocompleteFocusScrollViewProps = KeyboardAwareScrollViewProps & {
  /** Constant scroll view `bottomOffset` (keyboard toolbar plus caret clearance) */
  bottomOffset: number;
  /** Scroll view content; autocomplete inputs inside read the list cap from context */
  children: ReactNode;
};

/**
 * `KeyboardAwareScrollView` that pins a focused autocomplete field a small gap below its top once
 * the keyboard has settled (every keyboard `onEnd` with an open keyboard, and right away on focus
 * when the keyboard is already open), and provides the room left above the keyboard toolbar to
 * its autocomplete inputs through `AutocompleteMaxListHeightContext`. `bottomOffset` stays
 * constant: changing it while the keyboard resizes races with the scroll view's own keyboard
 * handling.
 *
 * Focus is detected on a wrapping view (`collapsable={false}`) whose window top is measured on
 * layout, with the native call the keyboard-aware scroll view itself uses, and again on
 * autocomplete focus while unknown: on iOS the layout measure can run before the native view is
 * attached to the key window and be rejected. Focus-mode state lives here, so only the context
 * consumers re-render on focus and keyboard changes, not the caller.
 *
 * @param props - Scroll view props (forwarded, `onScroll` included), `bottomOffset` and children
 * @returns The wrapped keyboard-aware scroll view
 */
export function AutocompleteFocusScrollView({
  bottomOffset,
  onScroll,
  children,
  ...scrollViewProps
}: AutocompleteFocusScrollViewProps) {
  const scrollViewRef = useRef<FormScrollView>(null);
  const scrollViewWrapperRef = useRef<HostInstance>(null);
  const focusedAutocompleteRef = useRef<FocusedAutocomplete | null>(null);
  const scrollYRef = useRef(0);
  const [scrollViewTop, setScrollViewTop] = useState<number | null>(null);
  const [fieldHeight, setFieldHeight] = useState<number | null>(null);
  const keyboardHeight = useKeyboardState(state => state.height);
  const { height: windowHeight } = useWindowDimensions();

  function measureScrollViewTop(logFailure: (message: string, error: unknown) => void) {
    const handle = findNodeHandle(scrollViewWrapperRef.current);
    if (handle == null) {
      return;
    }
    KeyboardControllerNative.viewPositionInWindow(handle)
      .then(({ y }) => setScrollViewTop(y))
      .catch(error => logFailure('Could not measure the form scroll view', error));
  }

  function pinFocusedAutocomplete() {
    const focused = focusedAutocompleteRef.current;
    const scrollView = scrollViewRef.current;
    if (focused === null || scrollView === null) {
      return;
    }
    if (!focused.anchor.isConnected) {
      focusedAutocompleteRef.current = null;
      return;
    }
    const currentScrollY = scrollYRef.current;
    const targetScrollY = getAutocompletePinScrollY(
      currentScrollY,
      focused.anchor.getBoundingClientRect().top,
      focused.scrollViewWrapper.getBoundingClientRect().top
    );
    if (Math.abs(targetScrollY - currentScrollY) < minimumPinScroll) {
      return;
    }
    scrollView.scrollTo({ y: targetScrollY, animated: true });
  }

  useKeyboardHandler(
    {
      onEnd: event => {
        'worklet';
        if (event.height > 0) {
          scheduleOnRN(pinFocusedAutocomplete);
        }
      },
    },
    []
  );

  function handleFocus(event: FocusEvent) {
    const { target: focusedInput, currentTarget: scrollViewWrapper } = event;
    const anchor = typeof focusedInput === 'object' ? findAutocompleteAnchor(focusedInput) : null;
    if (typeof focusedInput !== 'object' || anchor === null) {
      focusedAutocompleteRef.current = null;
      setFieldHeight(null);
      return;
    }
    focusedAutocompleteRef.current = {
      anchor,
      scrollViewWrapper: scrollViewWrapper as ReadOnlyElement,
    };
    setFieldHeight(measureAutocompleteFieldHeight(focusedInput, anchor));
    if (scrollViewTop === null) {
      measureScrollViewTop(recipeLogger.warn);
    }
    if (keyboardHeight > 0) {
      pinFocusedAutocomplete();
    }
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  }

  const maxListHeight = getAutocompleteMaxListHeight(
    bottomOffset,
    fieldHeight,
    scrollViewTop,
    windowHeight,
    keyboardHeight
  );

  return (
    <AutocompleteMaxListHeightContext.Provider value={maxListHeight}>
      <View
        ref={scrollViewWrapperRef}
        collapsable={false}
        style={layout.flexFill}
        onLayout={() => measureScrollViewTop(recipeLogger.debug)}
        onFocus={handleFocus}
      >
        <KeyboardAwareScrollView
          {...scrollViewProps}
          ref={scrollViewRef}
          bottomOffset={bottomOffset}
          onScroll={handleScroll}
        >
          {children}
        </KeyboardAwareScrollView>
      </View>
    </AutocompleteMaxListHeightContext.Provider>
  );
}
