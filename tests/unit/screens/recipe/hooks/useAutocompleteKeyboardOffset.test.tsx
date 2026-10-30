import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import { fireEvent, render, RenderResult } from '@testing-library/react-native';
import { KeyboardControllerNative, useKeyboardState } from 'react-native-keyboard-controller';
import { AUTOCOMPLETE_ANCHOR_ID } from '@components/molecules/TextInputWithDropDown';
import { useAutocompleteKeyboardOffset } from '@screens/recipe/hooks/useAutocompleteKeyboardOffset';
import {
  AUTOCOMPLETE_BUBBLE_MAX_HEIGHT,
  getAutocompleteBottomOffset,
} from '@screens/recipe/helpers/autocompleteKeyboardOffset';
import { mockFindNodeHandle } from '@mocks/deps/react-native-find-node-handle-mock';

const scrollViewNativeHandle = 42;

type FakeElement = {
  id: string;
  parentElement: FakeElement | null;
  getBoundingClientRect: () => { top: number; bottom: number };
};

function fakeElement(
  id: string,
  top: number,
  bottom: number,
  parentElement: FakeElement | null
): FakeElement {
  return { id, parentElement, getBoundingClientRect: () => ({ top, bottom }) };
}

const baseOffset = 80;
const openKeyboardHeight = 300;
const autocompleteAnchor = fakeElement(AUTOCOMPLETE_ANCHOR_ID, 500, 560, null);
const autocompleteInput = fakeElement('', 505, 555, autocompleteAnchor);
const plainInput = fakeElement('', 200, 250, null);
const autocompleteFieldHeight = 55;

const mockedUseKeyboardState = useKeyboardState as jest.Mock;
const viewPositionInWindow = KeyboardControllerNative.viewPositionInWindow as jest.Mock;

function setKeyboardHeight(height: number) {
  mockedUseKeyboardState.mockImplementation(selector => selector({ height }));
}

function placeScrollViewAt(y: number) {
  viewPositionInWindow.mockResolvedValue({ x: 0, y, width: 0, height: 0 });
}

function expectedOffset(scrollViewTop: number) {
  return getAutocompleteBottomOffset(
    baseOffset,
    autocompleteFieldHeight,
    scrollViewTop,
    Dimensions.get('window').height,
    openKeyboardHeight
  );
}

function OffsetHarness() {
  const { bottomOffset, scrollViewWrapperRef, onScrollViewLayout, onScrollViewFocus } =
    useAutocompleteKeyboardOffset(baseOffset);
  return (
    <View
      testID='ScrollViewWrapper'
      ref={scrollViewWrapperRef}
      collapsable={false}
      onLayout={onScrollViewLayout}
      onFocus={onScrollViewFocus}
    >
      <Text testID='BottomOffset'>{bottomOffset}</Text>
    </View>
  );
}

let renderResult: RenderResult | null = null;

function wrapper() {
  return renderResult!.getByTestId('ScrollViewWrapper');
}

async function layOut() {
  await fireEvent(wrapper(), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 0, height: 0 } },
  });
}

async function focus(target: FakeElement | number | undefined) {
  await fireEvent(wrapper(), 'focus', { target });
}

function shownOffset() {
  return Number(renderResult!.getByTestId('BottomOffset').props.children);
}

describe('useAutocompleteKeyboardOffset', () => {
  let findNodeHandleSpy: ReturnType<typeof mockFindNodeHandle>;

  beforeEach(async () => {
    findNodeHandleSpy = mockFindNodeHandle(scrollViewNativeHandle);
    setKeyboardHeight(openKeyboardHeight);
    placeScrollViewAt(88);
    renderResult = await render(<OffsetHarness />);
  });

  afterEach(() => {
    findNodeHandleSpy.mockRestore();
    setKeyboardHeight(0);
    viewPositionInWindow.mockClear();
  });

  test('measures the scroll view by its native handle', async () => {
    await layOut();

    expect(viewPositionInWindow).toHaveBeenCalledWith(scrollViewNativeHandle);
  });

  test.each([null, undefined])(
    'skips the measure when the scroll view has no native handle (%s)',
    async missingHandle => {
      mockFindNodeHandle(missingHandle);

      await layOut();
      await focus(autocompleteInput);

      expect(viewPositionInWindow).not.toHaveBeenCalled();
      expect(shownOffset()).toBe(baseOffset);
    }
  );

  test('uses the base offset before any focus', () => {
    expect(shownOffset()).toBe(baseOffset);
  });

  test('makes room for the bubble once the scroll view is measured', async () => {
    await layOut();
    await focus(autocompleteInput);

    expect(shownOffset()).toBe(expectedOffset(88));
    expect(shownOffset()).toBeGreaterThan(baseOffset);
    expect(shownOffset()).toBeLessThanOrEqual(baseOffset + AUTOCOMPLETE_BUBBLE_MAX_HEIGHT);
  });

  test('measures the scroll view only on layout', async () => {
    await layOut();
    await focus(autocompleteInput);
    await focus(plainInput);
    await focus(autocompleteInput);

    expect(viewPositionInWindow).toHaveBeenCalledTimes(1);
  });

  test('follows the scroll view when its layout changes', async () => {
    await layOut();
    placeScrollViewAt(150);
    await layOut();
    await focus(autocompleteInput);

    expect(shownOffset()).toBe(expectedOffset(150));
  });

  test('keeps the base offset when the measure fails', async () => {
    viewPositionInWindow.mockRejectedValue(new Error('detached'));

    await layOut();
    await focus(autocompleteInput);

    expect(shownOffset()).toBe(baseOffset);
  });

  test('measures the scroll view on autocomplete focus when the layout measure failed', async () => {
    viewPositionInWindow.mockRejectedValueOnce(new Error('Could not find view for tag'));

    await layOut();
    await focus(autocompleteInput);

    expect(shownOffset()).toBe(expectedOffset(88));
  });

  test('does not measure the scroll view on plain input focus', async () => {
    await focus(plainInput);

    expect(viewPositionInWindow).not.toHaveBeenCalled();
  });

  test.each([7, undefined])(
    'treats a focus target that is not an element (%s) as a plain input',
    async nonElementTarget => {
      await layOut();
      await focus(autocompleteInput);
      await focus(nonElementTarget);

      expect(shownOffset()).toBe(baseOffset);
    }
  );

  test('returns to the base offset when another input gets focus', async () => {
    await layOut();
    await focus(autocompleteInput);
    await focus(plainInput);

    expect(shownOffset()).toBe(baseOffset);
  });

  test('returns to the base offset once the keyboard hides', async () => {
    await layOut();
    await focus(autocompleteInput);
    setKeyboardHeight(0);
    await renderResult!.rerender(<OffsetHarness />);

    expect(shownOffset()).toBe(baseOffset);
  });
});
