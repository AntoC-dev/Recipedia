import { fireEvent, render } from '@testing-library/react-native';
import { SearchBar, SearchBarProps } from '@components/organisms/SearchBar';
import React from 'react';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

describe('SearchBar Component', () => {
  const mockSetSearchBarClicked = jest.fn();
  const mockUpdateSearchString = jest.fn();

  const defaultTestId = 'test-search-bar';
  const defaultPlaceholder = 'searchRecipeTitle';

  const defaultProps: SearchBarProps = {
    testId: defaultTestId,
    searchPhrase: '',
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
    expectedProps: SearchBarProps = defaultProps
  ) => {
    expect(getByTestId(expectedProps.testId + '::Mode').props.children).toBe('bar');
    expect(getByTestId(expectedProps.testId + '::Placeholder').props.children).toBe(
      'searchRecipeTitle'
    );
    expect(getByTestId(expectedProps.testId + '::RightContainer')).toBeTruthy();

    const textInput = getByTestId(expectedProps.testId + '::TextInput');
    expect(textInput.props.value).toBe(expectedProps.searchPhrase);
    expect(textInput.props.placeholder).toBe(defaultPlaceholder);
    expect(textInput.props.onChangeText).toBeDefined();

    if (expectedProps.searchPhrase.length > 0 || expectedProps.searchBarClicked) {
      expect(getByTestId(expectedProps.testId + '::RightIcon')).toBeTruthy();
      expect(getByTestId(expectedProps.testId + '::RightIcon::Icon').props.children).toBe('close');
    } else {
      expect(queryByTestId(expectedProps.testId + '::RightIcon')).toBeNull();
    }
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders with correct initial state and configuration', () => {
    const { getByTestId, queryByTestId } = renderSearchBar();

    assertSearchBar(getByTestId, queryByTestId);
  });

  test('displays right icon when search phrase has content', () => {
    const prop: SearchBarProps = { ...defaultProps, searchPhrase: 'pasta' };
    const { getByTestId, queryByTestId } = renderSearchBar(prop);

    assertSearchBar(getByTestId, queryByTestId, prop);
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

  test('handles focus events correctly', () => {
    const { getByTestId } = renderSearchBar();

    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();

    const textInput = getByTestId(defaultTestId);
    fireEvent(textInput, 'onFocus');

    expect(mockSetSearchBarClicked).toHaveBeenCalledWith(true);
  });

  test('handles submit editing correctly', () => {
    const { getByTestId } = renderSearchBar();

    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();

    const textInput = getByTestId(defaultTestId);
    fireEvent(textInput, 'onSubmitEditing');

    expect(mockSetSearchBarClicked).toHaveBeenCalledWith(false);
  });

  test('renders clear button when search phrase has content', () => {
    const prop: SearchBarProps = { ...defaultProps, searchPhrase: 'test search' };
    const { getByTestId, queryByTestId } = renderSearchBar(prop);

    assertSearchBar(getByTestId, queryByTestId, prop);
  });

  test('toggles right icon visibility based on search phrase length', () => {
    const props: SearchBarProps = { ...defaultProps };
    const { getByTestId, queryByTestId, rerender } = renderSearchBar(props);

    expect(queryByTestId(defaultTestId + '::RightIcon')).toBeNull();

    props.searchPhrase = 'a';
    rerender(<SearchBar {...props} />);
    expect(getByTestId(defaultTestId + '::RightIcon')).toBeTruthy();

    props.searchPhrase = 'pasta recipe';
    rerender(<SearchBar {...props} />);
    expect(getByTestId(defaultTestId + '::RightIcon')).toBeTruthy();

    props.searchPhrase = '';
    rerender(<SearchBar {...props} />);
    expect(queryByTestId(defaultTestId + '::RightIcon')).toBeNull();
  });

  test('uses different testId correctly for multiple instances', () => {
    const prop: SearchBarProps = { ...defaultProps, testId: 'custom-search-bar' };
    const { getByTestId, queryByTestId } = renderSearchBar(prop);

    assertSearchBar(getByTestId, queryByTestId, prop);

    expect(queryByTestId(defaultTestId)).toBeNull();
  });

  test('maintains functionality across rapid interactions', () => {
    const prop: SearchBarProps = { ...defaultProps, searchPhrase: 'test' };
    const { getByTestId } = renderSearchBar(prop);

    const textInput = getByTestId(defaultTestId);

    fireEvent(textInput, 'onFocus');
    fireEvent.changeText(textInput, 'new text');
    fireEvent(textInput, 'onFocus');
    fireEvent(textInput, 'onSubmitEditing');

    expect(mockSetSearchBarClicked).toHaveBeenCalledTimes(3);
    expect(mockUpdateSearchString).toHaveBeenCalledTimes(1);
    expect(mockSetSearchBarClicked).toHaveBeenLastCalledWith(false);
    expect(mockUpdateSearchString).toHaveBeenCalledWith('new text');
  });

  test('handles edge cases with search phrase content', () => {
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

    edgeCases.forEach(searchPhrase => {
      const prop: SearchBarProps = { ...defaultProps, searchPhrase };
      const { getByTestId, queryByTestId, unmount } = renderSearchBar(prop);

      assertSearchBar(getByTestId, queryByTestId, prop);

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

    props.searchPhrase = 'test';
    props.setSearchBarClicked = newMockSetSearchBarClicked;
    props.updateSearchString = newMockUpdateSearchString;
    rerender(<SearchBar {...props} />);

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

    fireEvent(textInput, 'onSubmitEditing');
    expect(mockSetSearchBarClicked).toHaveBeenLastCalledWith(false);

    expect(mockSetSearchBarClicked).toHaveBeenCalledTimes(2);
    expect(mockUpdateSearchString).toHaveBeenCalledTimes(1);
  });

  test('maintains component stability during complex state changes', () => {
    const { getByTestId, queryByTestId, rerender } = renderSearchBar();

    assertSearchBar(getByTestId, queryByTestId);

    const textProgression = ['a', 'ap', 'app', 'apple', 'apple pie', ''];

    textProgression.forEach(text => {
      rerender(<SearchBar {...defaultProps} searchPhrase={text} />);

      const expectedProp: SearchBarProps = { ...defaultProps, searchPhrase: text };
      assertSearchBar(getByTestId, queryByTestId, expectedProp);

      const textInput = getByTestId(defaultTestId);
      fireEvent(textInput, 'onFocus');
      expect(mockSetSearchBarClicked).toHaveBeenCalledWith(true);

      jest.clearAllMocks();
    });
  });

  test('clears search and dismisses keyboard when clear button is pressed', () => {
    const { Keyboard } = require('react-native');
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});

    const prop: SearchBarProps = { ...defaultProps, searchPhrase: 'test search' };
    const { getByTestId } = renderSearchBar(prop);

    fireEvent.press(getByTestId(defaultTestId + '::RightIcon'));

    expect(Keyboard.dismiss).toHaveBeenCalled();
    expect(mockSetSearchBarClicked).toHaveBeenCalledWith(false);
    expect(mockUpdateSearchString).toHaveBeenCalledWith('');
  });

  describe('Right icon visibility with searchBarClicked state', () => {
    test('shows icon when searchBarClicked is true with empty searchPhrase', () => {
      const prop: SearchBarProps = {
        ...defaultProps,
        searchPhrase: '',
        searchBarClicked: true,
      };
      const { getByTestId } = renderSearchBar(prop);

      expect(getByTestId(defaultTestId + '::RightIcon')).toBeTruthy();
    });

    test('does not show icon when searchBarClicked is false with empty searchPhrase', () => {
      const prop: SearchBarProps = {
        ...defaultProps,
        searchPhrase: '',
        searchBarClicked: false,
      };
      const { queryByTestId } = renderSearchBar(prop);

      expect(queryByTestId(defaultTestId + '::RightIcon')).toBeNull();
    });

    test('shows icon when searchPhrase has text regardless of searchBarClicked', () => {
      const propWithClickedFalse: SearchBarProps = {
        ...defaultProps,
        searchPhrase: 'test',
        searchBarClicked: false,
      };
      const { getByTestId, rerender } = renderSearchBar(propWithClickedFalse);

      expect(getByTestId(defaultTestId + '::RightIcon')).toBeTruthy();

      const propWithClickedTrue: SearchBarProps = {
        ...defaultProps,
        searchPhrase: 'test',
        searchBarClicked: true,
      };
      rerender(<SearchBar {...propWithClickedTrue} />);

      expect(getByTestId(defaultTestId + '::RightIcon')).toBeTruthy();
    });

    test('toggles icon visibility based on searchBarClicked state changes', () => {
      const props: SearchBarProps = {
        ...defaultProps,
        searchPhrase: '',
        searchBarClicked: false,
      };
      const { queryByTestId, rerender } = renderSearchBar(props);

      expect(queryByTestId(defaultTestId + '::RightIcon')).toBeNull();

      props.searchBarClicked = true;
      rerender(<SearchBar {...props} />);
      expect(queryByTestId(defaultTestId + '::RightIcon')).toBeTruthy();

      props.searchBarClicked = false;
      rerender(<SearchBar {...props} />);
      expect(queryByTestId(defaultTestId + '::RightIcon')).toBeNull();
    });
  });
});
