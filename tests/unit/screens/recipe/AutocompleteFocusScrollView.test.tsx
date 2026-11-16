import React, { useContext } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
} from 'react-native';
import { act, fireEvent, render, RenderResult } from '@testing-library/react-native';
import {
  KeyboardControllerNative,
  useKeyboardHandler,
  useKeyboardState,
} from 'react-native-keyboard-controller';
import { AUTOCOMPLETE_ANCHOR_ID } from '@components/molecules/TextInputWithDropDown';
import { AutocompleteMaxListHeightContext } from '@context/AutocompleteMaxListHeightContext';
import { AutocompleteFocusScrollView } from '@screens/recipe/AutocompleteFocusScrollView';
import { getAutocompleteMaxListHeight, ReadOnlyElement } from '@utils/autocompleteFocusMode';
import { mockFindNodeHandle } from '@mocks/deps/react-native-find-node-handle-mock';
import { fakeReadOnlyElement } from '@test-helpers/fakeReadOnlyElement';
import { scrollViewScrollTo } from '@test-helpers/scrollViewScrollTo';
import { padding } from '@styles/spacing';

type KeyboardEndHandler = (event: { height: number; duration: number }) => void;
type ScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

const scrollViewNativeHandle = 42;
const baseOffset = 80;
const numericKeyboardHeight = 255;
const textKeyboardHeight = 299;
const scrollViewWindowTop = 88;
const autocompleteFieldHeight = 55;
const scrollViewTestID = 'ScrollView';
const contentContainerStyle = { paddingBottom: 12 };

const mockedUseKeyboardState = useKeyboardState as jest.Mock;
const mockedUseKeyboardHandler = useKeyboardHandler as jest.Mock;
const viewPositionInWindow = KeyboardControllerNative.viewPositionInWindow as jest.Mock;

let scrollViewRect = { top: scrollViewWindowTop, bottom: 2000 };
let anchorRect = { top: 900, bottom: 960 };
let scrollViewElement = fakeReadOnlyElement('ScrollViewWrapper', scrollViewRect);
let autocompleteAnchor = fakeReadOnlyElement(AUTOCOMPLETE_ANCHOR_ID, anchorRect);
let autocompleteInput = fakeReadOnlyElement('', { top: 905, bottom: 955 }, autocompleteAnchor);
let plainInput = fakeReadOnlyElement('', { top: 200, bottom: 250 });

let keyboardEndHandler: KeyboardEndHandler | null = null;
let renderResult: RenderResult | null = null;

function setKeyboardHeight(height: number) {
  mockedUseKeyboardState.mockImplementation(selector => selector({ height }));
}

function placeScrollViewAt(y: number) {
  viewPositionInWindow.mockResolvedValue({ x: 0, y, width: 0, height: 0 });
}

function expectedMaxListHeight(keyboardHeight: number, scrollViewTop = scrollViewWindowTop) {
  return getAutocompleteMaxListHeight(
    baseOffset,
    autocompleteFieldHeight,
    scrollViewTop,
    Dimensions.get('window').height,
    keyboardHeight
  );
}

function MaxListHeightProbe() {
  return <Text testID='MaxListHeight'>{useContext(AutocompleteMaxListHeightContext)}</Text>;
}

function FocusScrollView({ onScroll }: { onScroll?: ScrollHandler }) {
  return (
    <AutocompleteFocusScrollView
      testID={scrollViewTestID}
      bottomOffset={baseOffset}
      contentContainerStyle={contentContainerStyle}
      onScroll={onScroll}
    >
      <MaxListHeightProbe />
    </AutocompleteFocusScrollView>
  );
}

function scrollView() {
  return renderResult!.getByTestId(scrollViewTestID);
}

function scrollTo() {
  return scrollViewScrollTo();
}

function scrolledToYs() {
  return scrollTo().mock.calls.map(([options]) => options.y);
}

async function layOut() {
  await fireEvent(scrollView(), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 0, height: 0 } },
  });
}

async function focus(
  target: ReadOnlyElement | number | undefined,
  currentTarget: ReadOnlyElement | number = scrollViewElement
) {
  await fireEvent(scrollView(), 'focus', { target, currentTarget });
}

async function scrollContentTo(y: number) {
  await fireEvent.scroll(scrollView(), {
    nativeEvent: { contentOffset: { x: 0, y } },
  });
}

async function keyboardSettles(height: number, duration = 250) {
  await act(async () => keyboardEndHandler!({ height, duration }));
}

async function keyboardResizesTo(height: number) {
  setKeyboardHeight(height);
  await renderResult!.rerender(<FocusScrollView />);
  await keyboardSettles(height);
}

function moveAnchorTo(top: number) {
  anchorRect.top = top;
  anchorRect.bottom = top + 60;
}

function shownMaxListHeight() {
  return renderResult!.getByTestId('MaxListHeight').props.children;
}

function pinnedScrollY(scrollY: number) {
  return scrollY + anchorRect.top - scrollViewWindowTop - padding.small;
}

describe('AutocompleteFocusScrollView', () => {
  let findNodeHandleSpy: ReturnType<typeof mockFindNodeHandle>;

  beforeEach(async () => {
    scrollViewRect = { top: scrollViewWindowTop, bottom: 2000 };
    anchorRect = { top: 900, bottom: 960 };
    scrollViewElement = fakeReadOnlyElement('ScrollViewWrapper', scrollViewRect);
    autocompleteAnchor = fakeReadOnlyElement(AUTOCOMPLETE_ANCHOR_ID, anchorRect);
    autocompleteInput = fakeReadOnlyElement('', { top: 905, bottom: 955 }, autocompleteAnchor);
    plainInput = fakeReadOnlyElement('', { top: 200, bottom: 250 });
    mockedUseKeyboardHandler.mockImplementation(handler => {
      keyboardEndHandler = handler.onEnd;
    });
    findNodeHandleSpy = mockFindNodeHandle(scrollViewNativeHandle);
    setKeyboardHeight(0);
    placeScrollViewAt(scrollViewWindowTop);
    renderResult = await render(<FocusScrollView />);
    scrollTo().mockClear();
  });

  afterEach(() => {
    findNodeHandleSpy.mockRestore();
    setKeyboardHeight(0);
    viewPositionInWindow.mockClear();
    mockedUseKeyboardHandler.mockReset();
    keyboardEndHandler = null;
  });

  describe('scroll view props', () => {
    test('forwards the caller props to the keyboard-aware scroll view', () => {
      expect(StyleSheet.flatten(scrollView().props.contentContainerStyle)).toEqual(
        contentContainerStyle
      );
    });

    test('keeps a constant bottom offset through autocomplete focus and keyboard events', async () => {
      await layOut();
      await focus(autocompleteInput);
      await keyboardResizesTo(numericKeyboardHeight);
      await keyboardResizesTo(textKeyboardHeight);
      await focus(plainInput);
      await keyboardResizesTo(0);

      expect(scrollView().props.bottomOffset).toBe(baseOffset);
    });

    test('forwards scroll events to the caller', async () => {
      const onScroll = jest.fn();
      await renderResult!.rerender(<FocusScrollView onScroll={onScroll} />);

      await scrollContentTo(300);

      expect(onScroll).toHaveBeenCalledTimes(1);
      expect(onScroll.mock.calls[0][0].nativeEvent.contentOffset.y).toBe(300);
    });

    test('tracks the scroll position while forwarding scroll events', async () => {
      await renderResult!.rerender(<FocusScrollView onScroll={jest.fn()} />);
      await scrollContentTo(300);

      await focus(autocompleteInput);
      await keyboardSettles(textKeyboardHeight);

      expect(scrolledToYs()).toEqual([pinnedScrollY(300)]);
    });
  });

  describe('list height', () => {
    test('does not cap the list before any focus', () => {
      expect(shownMaxListHeight()).toBeUndefined();
    });

    test('measures the scroll view by its native handle', async () => {
      await layOut();

      expect(viewPositionInWindow).toHaveBeenCalledWith(scrollViewNativeHandle);
    });

    test('does not cap the list while the keyboard is closed', async () => {
      await layOut();
      await focus(autocompleteInput);

      expect(shownMaxListHeight()).toBeUndefined();
    });

    test('caps the list to the room below the pinned field once the keyboard opens', async () => {
      await layOut();
      await focus(autocompleteInput);
      await keyboardResizesTo(textKeyboardHeight);

      expect(shownMaxListHeight()).toBe(expectedMaxListHeight(textKeyboardHeight));
    });

    test('keeps the same cap across keyboard events of the same height', async () => {
      await layOut();
      await focus(autocompleteInput);
      await keyboardResizesTo(textKeyboardHeight);
      const firstCap = shownMaxListHeight();
      await keyboardSettles(textKeyboardHeight, 0);
      await keyboardResizesTo(textKeyboardHeight);

      expect(shownMaxListHeight()).toBe(firstCap);
    });

    test('follows the keyboard when it grows from numeric to text', async () => {
      await layOut();
      await focus(autocompleteInput);
      await keyboardResizesTo(numericKeyboardHeight);
      const numericCap = shownMaxListHeight();
      await keyboardResizesTo(textKeyboardHeight);

      expect(shownMaxListHeight()).toBe(expectedMaxListHeight(textKeyboardHeight));
      expect(shownMaxListHeight()).toBeLessThan(numericCap);
    });

    test('follows the scroll view when its layout changes', async () => {
      await layOut();
      placeScrollViewAt(150);
      await layOut();
      await focus(autocompleteInput);
      await keyboardResizesTo(textKeyboardHeight);

      expect(shownMaxListHeight()).toBe(expectedMaxListHeight(textKeyboardHeight, 150));
    });

    test.each([null, undefined])(
      'skips the measure when the scroll view has no native handle (%s)',
      async missingHandle => {
        mockFindNodeHandle(missingHandle);

        await layOut();
        await focus(autocompleteInput);
        await keyboardResizesTo(textKeyboardHeight);

        expect(viewPositionInWindow).not.toHaveBeenCalled();
        expect(shownMaxListHeight()).toBeUndefined();
      }
    );

    test('does not cap the list when the measure fails', async () => {
      viewPositionInWindow.mockRejectedValue(new Error('detached'));

      await layOut();
      await focus(autocompleteInput);
      await keyboardResizesTo(textKeyboardHeight);

      expect(shownMaxListHeight()).toBeUndefined();
    });

    test('measures the scroll view on autocomplete focus when the layout measure failed', async () => {
      viewPositionInWindow.mockRejectedValueOnce(new Error('Could not find view for tag'));

      await layOut();
      await focus(autocompleteInput);
      await keyboardResizesTo(textKeyboardHeight);

      expect(shownMaxListHeight()).toBe(expectedMaxListHeight(textKeyboardHeight));
    });

    test('measures the scroll view only on layout once it is known', async () => {
      await layOut();
      await focus(autocompleteInput);
      await focus(plainInput);
      await focus(autocompleteInput);

      expect(viewPositionInWindow).toHaveBeenCalledTimes(1);
    });

    test('does not measure the scroll view on plain input focus', async () => {
      await focus(plainInput);

      expect(viewPositionInWindow).not.toHaveBeenCalled();
    });

    test('drops the cap when another input gets focus', async () => {
      await layOut();
      await focus(autocompleteInput);
      await keyboardResizesTo(textKeyboardHeight);
      await focus(plainInput);

      expect(shownMaxListHeight()).toBeUndefined();
    });

    test.each([7, undefined])(
      'treats a focus target that is not an element (%s) as a plain input',
      async nonElementTarget => {
        await layOut();
        await focus(autocompleteInput);
        await keyboardResizesTo(textKeyboardHeight);
        await focus(nonElementTarget);

        expect(shownMaxListHeight()).toBeUndefined();
      }
    );

    test('drops the cap once the keyboard hides', async () => {
      await layOut();
      await focus(autocompleteInput);
      await keyboardResizesTo(textKeyboardHeight);
      await keyboardResizesTo(0);

      expect(shownMaxListHeight()).toBeUndefined();
    });
  });

  describe('pinning', () => {
    test('registers a keyboard handler with an end callback', () => {
      expect(mockedUseKeyboardHandler).toHaveBeenCalled();
      expect(keyboardEndHandler).toEqual(expect.any(Function));
    });

    test('does not scroll before any focus', async () => {
      await keyboardSettles(textKeyboardHeight);

      expect(scrollTo()).not.toHaveBeenCalled();
    });

    test('pins the field below the scroll view top once the keyboard has opened', async () => {
      await focus(autocompleteInput);
      await keyboardSettles(textKeyboardHeight);

      expect(scrollTo()).toHaveBeenCalledTimes(1);
      expect(scrollTo()).toHaveBeenCalledWith({ y: pinnedScrollY(0), animated: true });
    });

    test('does not pin on focus while the keyboard is closed', async () => {
      await focus(autocompleteInput);

      expect(scrollTo()).not.toHaveBeenCalled();
    });

    test('pins right away when the keyboard is already open on focus', async () => {
      setKeyboardHeight(textKeyboardHeight);
      await renderResult!.rerender(<FocusScrollView />);

      await focus(autocompleteInput);

      expect(scrollTo()).toHaveBeenCalledWith({ y: pinnedScrollY(0), animated: true });
    });

    test('adds the tracked scroll offset to the target', async () => {
      await scrollContentTo(400);
      await focus(autocompleteInput);
      await keyboardSettles(textKeyboardHeight);

      expect(scrollTo()).toHaveBeenCalledWith({ y: pinnedScrollY(400), animated: true });
    });

    test('scrolls up when the field sits above the pinned spot', async () => {
      await scrollContentTo(1200);
      moveAnchorTo(40);
      await focus(autocompleteInput);
      await keyboardSettles(textKeyboardHeight);

      expect(scrolledToYs()).toEqual([1200 + 40 - scrollViewWindowTop - padding.small]);
    });

    test('never scrolls above the content top', async () => {
      await scrollContentTo(4);
      moveAnchorTo(scrollViewWindowTop);
      await focus(autocompleteInput);
      await keyboardSettles(textKeyboardHeight);

      expect(scrolledToYs()).toEqual([0]);
    });

    test('measures the field and the scroll view fresh at pin time', async () => {
      await focus(autocompleteInput);
      moveAnchorTo(600);
      scrollViewRect.top = 120;
      await keyboardSettles(textKeyboardHeight);

      expect(scrolledToYs()).toEqual([600 - 120 - padding.small]);
    });

    test('does not scroll when the field is already pinned', async () => {
      await scrollContentTo(500);
      moveAnchorTo(scrollViewWindowTop + padding.small);
      await focus(autocompleteInput);
      await keyboardSettles(textKeyboardHeight);

      expect(scrollTo()).not.toHaveBeenCalled();
    });

    test('does not scroll for a sub-pixel gap', async () => {
      await scrollContentTo(500);
      moveAnchorTo(scrollViewWindowTop + padding.small + 0.5);
      await focus(autocompleteInput);
      await keyboardSettles(textKeyboardHeight);

      expect(scrollTo()).not.toHaveBeenCalled();
    });

    test('scrolls for a one-pixel gap', async () => {
      await scrollContentTo(500);
      moveAnchorTo(scrollViewWindowTop + padding.small + 1);
      await focus(autocompleteInput);
      await keyboardSettles(textKeyboardHeight);

      expect(scrolledToYs()).toEqual([501]);
    });

    test('re-pins on every keyboard end while the field stays focused', async () => {
      await focus(autocompleteInput);
      await keyboardSettles(textKeyboardHeight);
      await keyboardSettles(textKeyboardHeight, 0);

      expect(scrollTo()).toHaveBeenCalledTimes(2);
    });

    test('keeps the field pinned through the numeric to text keyboard switch', async () => {
      setKeyboardHeight(numericKeyboardHeight);
      await renderResult!.rerender(<FocusScrollView />);
      await scrollContentTo(300);
      await focus(autocompleteInput);
      const pinnedOnFocus = pinnedScrollY(300);

      await keyboardSettles(numericKeyboardHeight, 0);
      const pinnedOnStaleEnd = pinnedScrollY(300);

      await scrollContentTo(pinnedOnFocus);
      moveAnchorTo(scrollViewWindowTop - 44);
      await keyboardResizesTo(textKeyboardHeight);
      const pinnedAfterResize = pinnedScrollY(pinnedOnFocus);

      expect(scrolledToYs()).toEqual([pinnedOnFocus, pinnedOnStaleEnd, pinnedAfterResize]);
      expect(pinnedAfterResize).toBe(pinnedOnFocus - 44 - padding.small);
    });

    test('ends with the field pinned when the resize event lands it under the app bar', async () => {
      await focus(autocompleteInput);
      await keyboardSettles(numericKeyboardHeight, 0);
      await scrollContentTo(scrolledToYs().at(-1)!);
      moveAnchorTo(scrollViewWindowTop + padding.small);
      await keyboardSettles(numericKeyboardHeight, 0);
      scrollTo().mockClear();

      await scrollContentTo(980);
      moveAnchorTo(scrollViewWindowTop - 44);
      await keyboardResizesTo(textKeyboardHeight);
      await scrollContentTo(scrolledToYs().at(-1)!);
      moveAnchorTo(scrollViewWindowTop + padding.small);
      await keyboardSettles(textKeyboardHeight, 0);

      expect(scrolledToYs()).toEqual([980 - 44 - padding.small]);
    });

    test('does not pin a plain input', async () => {
      await focus(plainInput);
      await keyboardSettles(textKeyboardHeight);

      expect(scrollTo()).not.toHaveBeenCalled();
    });

    test('does not pin when the keyboard hides', async () => {
      await focus(autocompleteInput);
      await keyboardSettles(0);

      expect(scrollTo()).not.toHaveBeenCalled();
    });

    test('pins the still-focused field again when the keyboard reopens without a new focus', async () => {
      await focus(autocompleteInput);
      await keyboardSettles(0);
      await keyboardSettles(textKeyboardHeight);

      expect(scrollTo()).toHaveBeenCalledTimes(1);
    });

    test('does not pin a focused field removed from the form when the keyboard reopens', async () => {
      const removedAnchor = fakeReadOnlyElement(AUTOCOMPLETE_ANCHOR_ID, anchorRect, null, false);
      const removedInput = fakeReadOnlyElement('', { top: 905, bottom: 955 }, removedAnchor);
      await focus(removedInput);
      await keyboardSettles(0);
      await keyboardSettles(textKeyboardHeight);

      expect(scrollTo()).not.toHaveBeenCalled();
    });

    test('forgets the field once focus moves to a plain input', async () => {
      await focus(autocompleteInput);
      await keyboardSettles(textKeyboardHeight);
      scrollTo().mockClear();
      await focus(plainInput);
      await keyboardSettles(textKeyboardHeight, 0);
      await keyboardSettles(numericKeyboardHeight);

      expect(scrollTo()).not.toHaveBeenCalled();
    });

    test('pins the newly focused field when focus moves between autocomplete fields', async () => {
      const secondAnchor = fakeReadOnlyElement(AUTOCOMPLETE_ANCHOR_ID, { top: 1500, bottom: 1560 });
      const secondInput = fakeReadOnlyElement('', { top: 1505, bottom: 1555 }, secondAnchor);
      await focus(autocompleteInput);
      await focus(secondInput);
      await keyboardSettles(textKeyboardHeight);

      expect(scrolledToYs()).toEqual([1500 - scrollViewWindowTop - padding.small]);
    });

    test.each([7, undefined])(
      'does not pin when the focus target is not an element (%s)',
      async nonElementTarget => {
        await focus(nonElementTarget);
        await keyboardSettles(textKeyboardHeight);

        expect(scrollTo()).not.toHaveBeenCalled();
      }
    );

    test('does nothing once the scroll view is unmounted', async () => {
      await focus(autocompleteInput);
      await renderResult!.unmount();

      await expect(keyboardSettles(textKeyboardHeight)).resolves.toBeUndefined();
      expect(scrollTo()).not.toHaveBeenCalled();
    });
  });
});
