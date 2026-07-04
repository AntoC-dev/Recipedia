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
    searchBarClicked: false,
    setSearchBarClicked: mockSetSearchBarClicked,
    updateSearchString: mockUpdateSearchString,
  };

  const renderSearchBar = (propForComponent: SearchBarProps = defaultProps) => {
    return render(<SearchBar {...propForComponent} />);
  };

  const assertSearchBar = (
    getByTestId: any,
    queryByTestId: any,
    expectedValue: string = '',
    searchBarClicked: boolean = false
  ) => {
    expect(getByTestId(defaultTestId + '::Mode').props.children).toBe('bar');
    expect(getByTestId(defaultTestId + '::Placeholder').props.children).toBe('searchRecipeTitle');
    expect(getByTestId(defaultTestId + '::RightContainer')).toBeTruthy();

    const textInput = getByTestId(defaultTestId + '::TextInput');
    expect(textInput.props.value).toBe(expectedValue);
    expect(textInput.props.placeholder).toBe(defaultPlaceholder);
    expect(textInput.props.onChangeText).toBeDefined();

    if (expectedValue.length > 0 || searchBarClicked) {
      expect(getByTestId(defaultTestId + '::RightIcon')).toBeTruthy();
      expect(getByTestId(defaultTestId + '::RightIcon::Icon').props.children).toBe('close');
    } else {
      expect(queryByTestId(defaultTestId + '::RightIcon')).toBeNull();
    }
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders with correct initial state and configuration', () => {
    const { getByTestId, queryByTestId } = renderSearchBar();

    assertSearchBar(getByTestId, queryByTestId);
  });

  test('displays right icon when text is typed', () => {
    const { getByTestId, queryByTestId } = renderSearchBar();

    fireEvent.changeText(getByTestId(defaultTestId), 'pasta');

    assertSearchBar(getByTestId, queryByTestId, 'pasta');
  });

  test('handles text input changes correctly', () => {
    const { getByTestId } = renderSearchBar();

    const textInput = getByTestId(defaultTestId);
    expect(mockUpdateSearchString).not.toHaveBeenCalled();

    fireEvent.changeText(textInput, 'spaghetti');
    expect(mockUpdateSearchString).toHaveBeenCalledWith('spaghetti');

    fireEvent.changeText(textInput, '');
    expect(mockUpdateSearchString).toHaveBeenCalledWith('');

    fireEvent.changeText(textInput, 'café & créme');
    expect(mockUpdateSearchString).toHaveBeenCalledWith('café & créme');
  });

  test('updates local value and calls parent callback on text change', () => {
    const { getByTestId } = renderSearchBar();

    const textInput = getByTestId(defaultTestId + '::TextInput');
    expect(textInput.props.value).toBe('');

    fireEvent.changeText(getByTestId(defaultTestId), 'risotto');

    expect(textInput.props.value).toBe('risotto');
    expect(mockUpdateSearchString).toHaveBeenCalledWith('risotto');
  });

  test('handles focus events correctly', () => {
    const { getByTestId } = renderSearchBar();

    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();

    const textInput = getByTestId(defaultTestId);
    fireEvent(textInput, 'onFocus');

    expect(mockSetSearchBarClicked).toHaveBeenCalledWith(true);
  });

  test('does not collapse on blur', () => {
    const { getByTestId } = renderSearchBar();

    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();

    const textInput = getByTestId(defaultTestId);
    fireEvent(textInput, 'onBlur');

    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();
  });

  test('collapses and dismisses keyboard on submit', () => {
    const { Keyboard } = require('react-native');
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});

    const { getByTestId } = renderSearchBar();

    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();

    const textInput = getByTestId(defaultTestId);
    fireEvent(textInput, 'submitEditing');

    expect(Keyboard.dismiss).toHaveBeenCalled();
    expect(mockSetSearchBarClicked).toHaveBeenCalledWith(false);
  });

  test('renders clear button when text has been typed', () => {
    const { getByTestId, queryByTestId } = renderSearchBar();

    fireEvent.changeText(getByTestId(defaultTestId), 'test search');

    assertSearchBar(getByTestId, queryByTestId, 'test search');
  });

  test('toggles right icon visibility based on typed text length', () => {
    const { getByTestId, queryByTestId } = renderSearchBar();
    const textInput = getByTestId(defaultTestId);

    expect(queryByTestId(defaultTestId + '::RightIcon')).toBeNull();

    fireEvent.changeText(textInput, 'a');
    expect(getByTestId(defaultTestId + '::RightIcon')).toBeTruthy();

    fireEvent.changeText(textInput, 'pasta recipe');
    expect(getByTestId(defaultTestId + '::RightIcon')).toBeTruthy();

    fireEvent.changeText(textInput, '');
    expect(queryByTestId(defaultTestId + '::RightIcon')).toBeNull();
  });

  test('uses different testId correctly for multiple instances', () => {
    const prop: SearchBarProps = { ...defaultProps, testId: 'custom-search-bar' };
    const { getByTestId, queryByTestId } = renderSearchBar(prop);

    expect(getByTestId('custom-search-bar::Mode').props.children).toBe('bar');
    expect(getByTestId('custom-search-bar::TextInput').props.value).toBe('');
    expect(queryByTestId(defaultTestId)).toBeNull();
  });

  test('maintains functionality across rapid interactions', () => {
    const { getByTestId } = renderSearchBar();

    const textInput = getByTestId(defaultTestId);

    fireEvent(textInput, 'onFocus');
    fireEvent.changeText(textInput, 'new text');
    fireEvent(textInput, 'onFocus');
    fireEvent(textInput, 'submitEditing');

    expect(mockSetSearchBarClicked).toHaveBeenCalledTimes(3);
    expect(mockUpdateSearchString).toHaveBeenCalledTimes(1);
    expect(mockSetSearchBarClicked).toHaveBeenLastCalledWith(false);
    expect(mockUpdateSearchString).toHaveBeenCalledWith('new text');
  });

  test('handles edge cases with typed text content', () => {
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

    edgeCases.forEach(text => {
      const { getByTestId, queryByTestId, unmount } = renderSearchBar();

      fireEvent.changeText(getByTestId(defaultTestId), text);

      assertSearchBar(getByTestId, queryByTestId, text);

      unmount();
      jest.clearAllMocks();
    });
  });

  test('preserves callback functionality across prop changes', () => {
    const props: SearchBarProps = { ...defaultProps };
    const { getByTestId, rerender } = renderSearchBar(props);

    const textInput = getByTestId(defaultTestId);
    fireEvent.changeText(textInput, 'initial');
    expect(mockUpdateSearchString).toHaveBeenCalledWith('initial');

    const newMockSetSearchBarClicked = jest.fn();
    const newMockUpdateSearchString = jest.fn();

    rerender(
      <SearchBar
        {...props}
        setSearchBarClicked={newMockSetSearchBarClicked}
        updateSearchString={newMockUpdateSearchString}
      />
    );

    fireEvent.changeText(textInput, 'updated');
    fireEvent(textInput, 'onFocus');

    expect(newMockUpdateSearchString).toHaveBeenCalledTimes(1);
    expect(newMockSetSearchBarClicked).toHaveBeenCalledTimes(1);
    expect(mockUpdateSearchString).toHaveBeenCalledTimes(1);
    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();
  });

  test('handles simultaneous focus and text changes correctly', () => {
    const { getByTestId } = renderSearchBar();
    const textInput = getByTestId(defaultTestId);

    fireEvent(textInput, 'onFocus');
    fireEvent.changeText(textInput, 'focused text');

    expect(mockSetSearchBarClicked).toHaveBeenCalledWith(true);
    expect(mockUpdateSearchString).toHaveBeenCalledWith('focused text');

    fireEvent(textInput, 'submitEditing');
    expect(mockSetSearchBarClicked).toHaveBeenLastCalledWith(false);

    expect(mockSetSearchBarClicked).toHaveBeenCalledTimes(2);
    expect(mockUpdateSearchString).toHaveBeenCalledTimes(1);
  });

  test('maintains component stability during progressive typing', () => {
    const { getByTestId, queryByTestId } = renderSearchBar();

    assertSearchBar(getByTestId, queryByTestId);

    const textProgression = ['a', 'ap', 'app', 'apple', 'apple pie', ''];
    const textInput = getByTestId(defaultTestId);

    textProgression.forEach(text => {
      fireEvent.changeText(textInput, text);

      assertSearchBar(getByTestId, queryByTestId, text);

      fireEvent(textInput, 'onFocus');
      expect(mockSetSearchBarClicked).toHaveBeenCalledWith(true);

      jest.clearAllMocks();
    });
  });

  test('clears search and dismisses keyboard when clear button is pressed', () => {
    const { Keyboard } = require('react-native');
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});

    const { getByTestId } = renderSearchBar();

    fireEvent.changeText(getByTestId(defaultTestId), 'test search');

    const textInput = getByTestId(defaultTestId + '::TextInput');
    expect(textInput.props.value).toBe('test search');

    fireEvent.press(getByTestId(defaultTestId + '::RightIcon'));

    expect(textInput.props.value).toBe('');
    expect(Keyboard.dismiss).toHaveBeenCalled();
    expect(mockSetSearchBarClicked).toHaveBeenCalledWith(false);
    expect(mockUpdateSearchString).toHaveBeenCalledWith('');
  });

  describe('Right icon visibility with searchBarClicked state', () => {
    test('shows icon when searchBarClicked is true with empty text', () => {
      const prop: SearchBarProps = {
        ...defaultProps,
        searchBarClicked: true,
      };
      const { getByTestId } = renderSearchBar(prop);

      expect(getByTestId(defaultTestId + '::RightIcon')).toBeTruthy();
    });

    test('does not show icon when searchBarClicked is false with empty text', () => {
      const prop: SearchBarProps = {
        ...defaultProps,
        searchBarClicked: false,
      };
      const { queryByTestId } = renderSearchBar(prop);

      expect(queryByTestId(defaultTestId + '::RightIcon')).toBeNull();
    });

    test('shows icon when text is typed regardless of searchBarClicked', () => {
      const { getByTestId, rerender } = renderSearchBar({
        ...defaultProps,
        searchBarClicked: false,
      });

      fireEvent.changeText(getByTestId(defaultTestId), 'test');

      expect(getByTestId(defaultTestId + '::RightIcon')).toBeTruthy();

      rerender(<SearchBar {...defaultProps} searchBarClicked={true} />);

      expect(getByTestId(defaultTestId + '::RightIcon')).toBeTruthy();
    });

    test('toggles icon visibility based on searchBarClicked state changes', () => {
      const props: SearchBarProps = {
        ...defaultProps,
        searchBarClicked: false,
      };
      const { queryByTestId, rerender } = renderSearchBar(props);

      expect(queryByTestId(defaultTestId + '::RightIcon')).toBeNull();

      rerender(<SearchBar {...props} searchBarClicked={true} />);
      expect(queryByTestId(defaultTestId + '::RightIcon')).toBeTruthy();

      rerender(<SearchBar {...props} searchBarClicked={false} />);
      expect(queryByTestId(defaultTestId + '::RightIcon')).toBeNull();
    });
  });

  describe('clearRef functionality', () => {
    test('clears text when clear() is called via ref', () => {
      const clearRef = createRef<SearchBarHandle>();
      const { getByTestId, queryByTestId } = renderSearchBar({
        ...defaultProps,
        clearRef,
      });

      fireEvent.changeText(getByTestId(defaultTestId), 'some text');

      const textInput = getByTestId(defaultTestId + '::TextInput');
      expect(textInput.props.value).toBe('some text');
      expect(getByTestId(defaultTestId + '::RightIcon')).toBeTruthy();

      act(() => {
        clearRef.current?.clear();
      });

      expect(textInput.props.value).toBe('');
      expect(queryByTestId(defaultTestId + '::RightIcon')).toBeNull();
    });

    test('works without clearRef provided', () => {
      const { getByTestId } = renderSearchBar();

      fireEvent.changeText(getByTestId(defaultTestId), 'no ref');

      expect(getByTestId(defaultTestId + '::TextInput').props.value).toBe('no ref');
    });
  });
});
