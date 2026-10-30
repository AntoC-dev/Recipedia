import { act, fireEvent, render } from '@testing-library/react-native';
import { SearchBar, SearchBarHandle, SearchBarProps } from '@components/organisms/SearchBar';
import React, { createRef } from 'react';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

describe('SearchBar Component', () => {
  const mockSetSearchBarClicked = jest.fn();
  const mockUpdateSearchString = jest.fn();

  const defaultTestId = 'test-search-bar';
  const defaultPlaceholder = 'searchRecipeTitle';

  const defaultProps: SearchBarProps = {
    testId: defaultTestId,
    setSearchBarClicked: mockSetSearchBarClicked,
    updateSearchString: mockUpdateSearchString,
  };

  const renderSearchBar = async (propForComponent: SearchBarProps = defaultProps) => {
    return render(<SearchBar {...propForComponent} />);
  };

  const expectClearIconEnabled = (
    getByTestId: any,
    enabled: boolean,
    testId: string = defaultTestId
  ) => {
    expect(getByTestId(testId + '-clear-icon').props.accessibilityState.disabled).toBe(!enabled);
  };

  const assertSearchBar = (getByTestId: any, queryByTestId: any, expectedValue: string = '') => {
    expect(getByTestId(defaultTestId + '::Mode').props.children).toBe('bar');
    expect(getByTestId(defaultTestId + '::Placeholder').props.children).toBe('searchRecipeTitle');
    expect(getByTestId(defaultTestId + '::HasRight').props.children).toBe('false');
    expect(queryByTestId(defaultTestId + '::Right')).toBeNull();
    expect(getByTestId(defaultTestId + '::ClearIcon').props.children).toBe('close');

    const textInput = getByTestId(defaultTestId + '::TextInput');
    expect(textInput.props.value).toBe(expectedValue);
    expect(textInput.props.placeholder).toBe(defaultPlaceholder);
    expect(textInput.props.onChangeText).toBeDefined();

    expectClearIconEnabled(getByTestId, expectedValue.length > 0);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders with correct initial state and configuration', async () => {
    const { getByTestId, queryByTestId } = await renderSearchBar();

    assertSearchBar(getByTestId, queryByTestId);
  });

  test('never supplies a right prop, which would make Paper hide its clear icon with display none', async () => {
    const { getByTestId } = await renderSearchBar();

    expect(getByTestId(defaultTestId + '::HasRight').props.children).toBe('false');
  });

  test('clears the search and leaves search mode through the built-in clear icon', async () => {
    const { getByTestId } = await renderSearchBar();

    await fireEvent.changeText(getByTestId(defaultTestId + '::TextInput'), 'pasta');
    await fireEvent.press(getByTestId(defaultTestId + '-clear-icon'));

    expect(getByTestId(defaultTestId + '::TextInput').props.value).toBe('');
    expect(mockUpdateSearchString).toHaveBeenLastCalledWith('');
    expect(mockSetSearchBarClicked).toHaveBeenLastCalledWith(false);
  });

  test('propagates a single empty search when the clear icon is pressed', async () => {
    const { getByTestId } = await renderSearchBar();

    await fireEvent.changeText(getByTestId(defaultTestId + '::TextInput'), 'pasta');
    mockUpdateSearchString.mockClear();
    await fireEvent.press(getByTestId(defaultTestId + '-clear-icon'));

    expect(mockUpdateSearchString).toHaveBeenCalledTimes(1);
    expect(mockUpdateSearchString).toHaveBeenCalledWith('');
  });

  test('requests a search-labelled keyboard return key', async () => {
    const { getByTestId } = await renderSearchBar();

    expect(getByTestId(defaultTestId + '::TextInput').props.returnKeyType).toBe('search');
  });

  test('displays right icon when text is typed', async () => {
    const { getByTestId, queryByTestId } = await renderSearchBar();

    await fireEvent.changeText(getByTestId(defaultTestId), 'pasta');

    assertSearchBar(getByTestId, queryByTestId, 'pasta');
  });

  test('handles text input changes correctly', async () => {
    const { getByTestId } = await renderSearchBar();

    const textInput = getByTestId(defaultTestId);
    expect(mockUpdateSearchString).not.toHaveBeenCalled();

    await fireEvent.changeText(textInput, 'spaghetti');
    expect(mockUpdateSearchString).toHaveBeenCalledWith('spaghetti');

    await fireEvent.changeText(textInput, '');
    expect(mockUpdateSearchString).toHaveBeenCalledWith('');

    await fireEvent.changeText(textInput, 'café & créme');
    expect(mockUpdateSearchString).toHaveBeenCalledWith('café & créme');
  });

  test('updates local value and calls parent callback on text change', async () => {
    const { getByTestId } = await renderSearchBar();

    const textInput = getByTestId(defaultTestId + '::TextInput');
    expect(textInput.props.value).toBe('');

    await fireEvent.changeText(getByTestId(defaultTestId), 'risotto');

    expect(textInput.props.value).toBe('risotto');
    expect(mockUpdateSearchString).toHaveBeenCalledWith('risotto');
  });

  test('opens the suggestions when the input is touched', async () => {
    const { getByTestId } = await renderSearchBar();

    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();

    const textInput = getByTestId(defaultTestId);
    await fireEvent(textInput, 'onPressIn');

    expect(mockSetSearchBarClicked).toHaveBeenCalledWith(true);
  });

  test('does not open the suggestions on a bare focus such as the one Android restores after back', async () => {
    const { getByTestId } = await renderSearchBar();

    await fireEvent(getByTestId(defaultTestId), 'onFocus');

    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();
  });

  test('does not collapse on blur', async () => {
    const { getByTestId } = await renderSearchBar();

    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();

    const textInput = getByTestId(defaultTestId);
    await fireEvent(textInput, 'onBlur');

    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();
  });

  test('collapses and dismisses keyboard on submit', async () => {
    const { Keyboard } = require('react-native');
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});

    const { getByTestId } = await renderSearchBar();

    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();

    const textInput = getByTestId(defaultTestId);
    await fireEvent(textInput, 'submitEditing');

    expect(Keyboard.dismiss).toHaveBeenCalled();
    expect(mockSetSearchBarClicked).toHaveBeenCalledWith(false);
  });

  test('renders clear button when text has been typed', async () => {
    const { getByTestId, queryByTestId } = await renderSearchBar();

    await fireEvent.changeText(getByTestId(defaultTestId), 'test search');

    assertSearchBar(getByTestId, queryByTestId, 'test search');
  });

  test('toggles clear icon availability based on typed text length', async () => {
    const { getByTestId } = await renderSearchBar();
    const textInput = getByTestId(defaultTestId);

    expectClearIconEnabled(getByTestId, false);

    await fireEvent.changeText(textInput, 'a');
    expectClearIconEnabled(getByTestId, true);

    await fireEvent.changeText(textInput, 'pasta recipe');
    expectClearIconEnabled(getByTestId, true);

    await fireEvent.changeText(textInput, '');
    expectClearIconEnabled(getByTestId, false);
  });

  test('uses different testId correctly for multiple instances', async () => {
    const prop: SearchBarProps = { ...defaultProps, testId: 'custom-search-bar' };
    const { getByTestId, queryByTestId } = await renderSearchBar(prop);

    expect(getByTestId('custom-search-bar::Mode').props.children).toBe('bar');
    expect(getByTestId('custom-search-bar::TextInput').props.value).toBe('');
    expect(queryByTestId(defaultTestId)).toBeNull();
  });

  test('maintains functionality across rapid interactions', async () => {
    const { getByTestId } = await renderSearchBar();

    const textInput = getByTestId(defaultTestId);

    await fireEvent(textInput, 'onPressIn');
    await fireEvent.changeText(textInput, 'new text');
    await fireEvent(textInput, 'onPressIn');
    await fireEvent(textInput, 'submitEditing');

    expect(mockSetSearchBarClicked).toHaveBeenCalledTimes(3);
    expect(mockUpdateSearchString).toHaveBeenCalledTimes(1);
    expect(mockSetSearchBarClicked).toHaveBeenLastCalledWith(false);
    expect(mockUpdateSearchString).toHaveBeenCalledWith('new text');
  });

  test('handles edge cases with typed text content', async () => {
    const edgeCases = [
      ' ',
      '   ',
      '\n',
      '\t',
      '🍕',
      'very long search phrase that might cause layout issues',
      '12345',
      '@#$%^&*()',
    ];

    for (const text of edgeCases) {
      const { getByTestId, queryByTestId, unmount } = await renderSearchBar();

      await fireEvent.changeText(getByTestId(defaultTestId), text);

      assertSearchBar(getByTestId, queryByTestId, text);

      await unmount();
      jest.clearAllMocks();
    }
  });

  test('preserves callback functionality across prop changes', async () => {
    const props: SearchBarProps = { ...defaultProps };
    const { getByTestId, rerender } = await renderSearchBar(props);

    const textInput = getByTestId(defaultTestId);
    await fireEvent.changeText(textInput, 'initial');
    expect(mockUpdateSearchString).toHaveBeenCalledWith('initial');

    const newMockSetSearchBarClicked = jest.fn();
    const newMockUpdateSearchString = jest.fn();

    await rerender(
      <SearchBar
        {...props}
        setSearchBarClicked={newMockSetSearchBarClicked}
        updateSearchString={newMockUpdateSearchString}
      />
    );

    await fireEvent.changeText(textInput, 'updated');
    await fireEvent(textInput, 'onPressIn');

    expect(newMockUpdateSearchString).toHaveBeenCalledTimes(1);
    expect(newMockSetSearchBarClicked).toHaveBeenCalledTimes(1);
    expect(mockUpdateSearchString).toHaveBeenCalledTimes(1);
    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();
  });

  test('handles simultaneous touch and text changes correctly', async () => {
    const { getByTestId } = await renderSearchBar();
    const textInput = getByTestId(defaultTestId);

    await fireEvent(textInput, 'onPressIn');
    await fireEvent.changeText(textInput, 'focused text');

    expect(mockSetSearchBarClicked).toHaveBeenCalledWith(true);
    expect(mockUpdateSearchString).toHaveBeenCalledWith('focused text');

    await fireEvent(textInput, 'submitEditing');
    expect(mockSetSearchBarClicked).toHaveBeenLastCalledWith(false);

    expect(mockSetSearchBarClicked).toHaveBeenCalledTimes(2);
    expect(mockUpdateSearchString).toHaveBeenCalledTimes(1);
  });

  test('maintains component stability during progressive typing', async () => {
    const { getByTestId, queryByTestId } = await renderSearchBar();

    assertSearchBar(getByTestId, queryByTestId);

    const textProgression = ['a', 'ap', 'app', 'apple', 'apple pie', ''];
    const textInput = getByTestId(defaultTestId);

    for (const text of textProgression) {
      await fireEvent.changeText(textInput, text);

      assertSearchBar(getByTestId, queryByTestId, text);

      await fireEvent(textInput, 'onPressIn');
      expect(mockSetSearchBarClicked).toHaveBeenCalledWith(true);

      jest.clearAllMocks();
    }
  });

  test('clears search, dismisses keyboard and exits search mode when clear button is pressed', async () => {
    const { Keyboard } = require('react-native');
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});

    const { getByTestId } = await renderSearchBar();

    await fireEvent.changeText(getByTestId(defaultTestId), 'test search');

    const textInput = getByTestId(defaultTestId + '::TextInput');
    expect(textInput.props.value).toBe('test search');

    jest.clearAllMocks();
    await fireEvent.press(getByTestId(defaultTestId + '-clear-icon'));

    expect(textInput.props.value).toBe('');
    expect(Keyboard.dismiss).toHaveBeenCalled();
    expect(mockSetSearchBarClicked).toHaveBeenCalledWith(false);
    expect(mockUpdateSearchString).toHaveBeenCalledWith('');
  });

  describe('Clear icon availability', () => {
    test('stays unavailable while the field is empty', async () => {
      const { getByTestId } = await renderSearchBar();

      expectClearIconEnabled(getByTestId, false);
    });

    test('becomes available once text is typed and unavailable again when emptied', async () => {
      const { getByTestId } = await renderSearchBar();

      await fireEvent.changeText(getByTestId(defaultTestId), 'test');
      expectClearIconEnabled(getByTestId, true);

      await fireEvent.changeText(getByTestId(defaultTestId), '');
      expectClearIconEnabled(getByTestId, false);
    });
  });

  describe('clearRef functionality', () => {
    test('clears text when clear() is called via ref', async () => {
      const clearRef = createRef<SearchBarHandle>();
      const { getByTestId, queryByTestId } = await renderSearchBar({
        ...defaultProps,
        clearRef,
      });

      await fireEvent.changeText(getByTestId(defaultTestId), 'some text');

      const textInput = getByTestId(defaultTestId + '::TextInput');
      expect(textInput.props.value).toBe('some text');
      expectClearIconEnabled(getByTestId, true);

      await act(() => {
        clearRef.current?.clear();
      });

      expect(textInput.props.value).toBe('');
      expectClearIconEnabled(getByTestId, false);
    });

    test('sets text when setText() is called via ref', async () => {
      const clearRef = createRef<SearchBarHandle>();
      const { getByTestId } = await renderSearchBar({
        ...defaultProps,
        clearRef,
      });

      const textInput = getByTestId(defaultTestId + '::TextInput');
      expect(textInput.props.value).toBe('');

      await act(() => {
        clearRef.current?.setText('Margherita Pizza');
      });

      expect(textInput.props.value).toBe('Margherita Pizza');
      expectClearIconEnabled(getByTestId, true);
      expect(mockUpdateSearchString).not.toHaveBeenCalled();
    });

    test('works without clearRef provided', async () => {
      const { getByTestId } = await renderSearchBar();

      await fireEvent.changeText(getByTestId(defaultTestId), 'no ref');

      expect(getByTestId(defaultTestId + '::TextInput').props.value).toBe('no ref');
    });
  });
});
