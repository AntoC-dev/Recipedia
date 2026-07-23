import { fireEvent, render } from '@testing-library/react-native';
import { SearchBarResults, SearchBarResultsProps } from '@components/organisms/SearchBarResults';
import React from 'react';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

describe('SearchBarResults Component', () => {
  const mockSetSearchBarClicked = jest.fn();
  const mockUpdateSearchString = jest.fn();

  const defaultTestId = 'test-search-results';
  const defaultTitles = [
    'Chocolate Chip Cookies',
    'Vanilla Cupcakes',
    'Strawberry Cake',
    'Blueberry Muffins',
    'Banana Bread',
  ];

  const defaultProps: SearchBarResultsProps = {
    testId: defaultTestId,
    filteredTitles: defaultTitles,
    setSearchBarClicked: mockSetSearchBarClicked,
    updateSearchString: mockUpdateSearchString,
  };

  const renderSearchBarResults = (propForComponent: SearchBarResultsProps = defaultProps) => {
    const props = { ...defaultProps, ...propForComponent };
    return render(<SearchBarResults {...props} />);
  };

  const assertSearchBarResults = (
    getByTestId: any,
    expectedProps: SearchBarResultsProps = defaultProps
  ) => {
    const flatList = getByTestId(expectedProps.testId);
    expect(flatList.props.data).toHaveLength(expectedProps.filteredTitles.length);
    expect(flatList.props.data).toEqual(expectedProps.filteredTitles);
    expect(flatList.props.scrollEnabled).toBe(false);
    expect(flatList.props.keyboardShouldPersistTaps).toBe('handled');
    expect(flatList.props.renderItem).toBeDefined();

    expectedProps.filteredTitles.forEach((title, index) => {
      const itemTestId = `${expectedProps.testId}::Item::${index}`;
      expect(getByTestId(itemTestId)).toBeTruthy();
      expect(getByTestId(itemTestId + '::Title').props.children).toBe(title);
    });
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders with correct structure and list items', () => {
    const { getByTestId } = renderSearchBarResults();

    assertSearchBarResults(getByTestId);
  });

  test('handles empty filtered titles correctly', () => {
    const props: SearchBarResultsProps = { ...defaultProps, filteredTitles: [] };
    const { getByTestId } = renderSearchBarResults(props);

    assertSearchBarResults(getByTestId, props);
  });

  test('shows an empty message when no titles match', () => {
    const props: SearchBarResultsProps = { ...defaultProps, filteredTitles: [] };
    const { getByTestId } = renderSearchBarResults(props);

    expect(getByTestId(`${defaultTestId}::Empty::Title`).props.children).toBe('noRecipesFound');
  });

  test('hides the empty message when titles are present', () => {
    const { queryByTestId } = renderSearchBarResults();

    expect(queryByTestId(`${defaultTestId}::Empty`)).toBeNull();
  });

  test('handles single item correctly', () => {
    const props: SearchBarResultsProps = { ...defaultProps, filteredTitles: ['Single Recipe'] };
    const { getByTestId } = renderSearchBarResults(props);

    assertSearchBarResults(getByTestId, props);

    expect(mockSetSearchBarClicked).not.toHaveBeenCalled();
    expect(mockUpdateSearchString).not.toHaveBeenCalled();

    fireEvent.press(getByTestId(`${props.testId}::Item::0`));

    expect(mockSetSearchBarClicked).toHaveBeenCalledWith(false);
    expect(mockUpdateSearchString).toHaveBeenCalledWith('Single Recipe');
  });

  test('handles multiple item selection correctly', () => {
    const { getByTestId } = renderSearchBarResults();

    const testCases = [
      { index: 0, title: 'Chocolate Chip Cookies' },
      { index: 2, title: 'Strawberry Cake' },
      { index: 4, title: 'Banana Bread' },
    ];

    testCases.forEach(({ index, title }) => {
      jest.clearAllMocks();

      expect(mockSetSearchBarClicked).not.toHaveBeenCalled();
      expect(mockUpdateSearchString).not.toHaveBeenCalled();

      fireEvent.press(getByTestId(`${defaultTestId}::Item::${index}`));

      expect(mockSetSearchBarClicked).toHaveBeenCalledWith(false);
      expect(mockUpdateSearchString).toHaveBeenCalledWith(title);
    });
  });

  test('handles rapid successive item selections', () => {
    const { getByTestId } = renderSearchBarResults();

    fireEvent.press(getByTestId(defaultTestId + '::Item::0'));
    fireEvent.press(getByTestId(defaultTestId + '::Item::1'));
    fireEvent.press(getByTestId(defaultTestId + '::Item::2'));

    expect(mockSetSearchBarClicked).toHaveBeenCalledTimes(3);
    expect(mockUpdateSearchString).toHaveBeenCalledTimes(3);

    expect(mockUpdateSearchString).toHaveBeenNthCalledWith(1, 'Chocolate Chip Cookies');
    expect(mockUpdateSearchString).toHaveBeenNthCalledWith(2, 'Vanilla Cupcakes');
    expect(mockUpdateSearchString).toHaveBeenNthCalledWith(3, 'Strawberry Cake');

    expect(mockSetSearchBarClicked).toHaveBeenNthCalledWith(1, false);
    expect(mockSetSearchBarClicked).toHaveBeenNthCalledWith(2, false);
    expect(mockSetSearchBarClicked).toHaveBeenNthCalledWith(3, false);
  });

  test('uses custom testId correctly throughout component', () => {
    const props = { ...defaultProps, testId: 'custom-search-results' };
    const { getByTestId, queryByTestId } = renderSearchBarResults(props);

    assertSearchBarResults(getByTestId, props);

    expect(queryByTestId(defaultTestId)).toBeNull();
    expect(queryByTestId(defaultTestId + '::Item::0')).toBeNull();
  });

  test('handles edge cases in title content', () => {
    const edgeCaseTitles = [
      '',
      '   ',
      'Very Long Recipe Title That Might Cause Layout Issues And Should Be Handled Gracefully',
      'Title with\nnewlines\nand\ttabs',
      'Special characters: @#$%^&*(){}[]|\\:";\'<>?,./`~',
      'Unicode and emojis: 🍰🧁🍪 café crème naïve résumé',
      'Numbers and symbols: 123-456 (7/8) 90%',
      'Mixed case: CamelCase snake_case kebab-case',
    ];

    const props = { ...defaultProps, filteredTitles: edgeCaseTitles };
    const { getByTestId } = renderSearchBarResults(props);

    assertSearchBarResults(getByTestId, props);

    edgeCaseTitles.forEach((title, index) => {
      jest.clearAllMocks();
      fireEvent.press(getByTestId(`${defaultTestId}::Item::${index}`));
      expect(mockUpdateSearchString).toHaveBeenCalledWith(title);
    });
  });

  test('maintains functionality across prop changes', () => {
    const { getByTestId, rerender } = renderSearchBarResults();

    assertSearchBarResults(getByTestId);

    fireEvent.press(getByTestId(defaultTestId + '::Item::0'));
    expect(mockUpdateSearchString).toHaveBeenCalledWith('Chocolate Chip Cookies');

    const newMockSetSearchBarClicked = jest.fn();
    const newMockUpdateSearchString = jest.fn();
    const newProps: SearchBarResultsProps = {
      testId: defaultTestId,
      filteredTitles: ['New Recipe 1', 'New Recipe 2'],
      setSearchBarClicked: newMockSetSearchBarClicked,
      updateSearchString: newMockUpdateSearchString,
    };

    rerender(<SearchBarResults {...newProps} />);

    assertSearchBarResults(getByTestId, newProps);

    fireEvent.press(getByTestId(defaultTestId + '::Item::0'));
    expect(newMockUpdateSearchString).toHaveBeenCalledWith('New Recipe 1');
    expect(newMockSetSearchBarClicked).toHaveBeenCalledWith(false);

    expect(mockUpdateSearchString).toHaveBeenCalledTimes(1);
    expect(mockSetSearchBarClicked).toHaveBeenCalledTimes(1);
  });

  test('handles dynamic filtering scenarios', () => {
    const { getByTestId, rerender } = renderSearchBarResults();

    assertSearchBarResults(getByTestId);

    {
      const filteredProps: SearchBarResultsProps = {
        ...defaultProps,
        filteredTitles: ['Chocolate Chip Cookies', 'Banana Bread'],
      };
      rerender(<SearchBarResults {...filteredProps} />);
      assertSearchBarResults(getByTestId, filteredProps);
    }
    {
      const emptyProps: SearchBarResultsProps = { ...defaultProps, filteredTitles: [] };
      rerender(<SearchBarResults {...emptyProps} />);
      assertSearchBarResults(getByTestId, emptyProps);
    }
    {
      const singleProps: SearchBarResultsProps = {
        ...defaultProps,
        filteredTitles: ['Strawberry Cake'],
      };
      rerender(<SearchBarResults {...singleProps} />);
      assertSearchBarResults(getByTestId, singleProps);

      fireEvent.press(getByTestId(defaultTestId + '::Item::0'));
      expect(mockUpdateSearchString).toHaveBeenCalledWith('Strawberry Cake');
    }
  });

  test('maintains component stability during stress testing', () => {
    const { getByTestId } = renderSearchBarResults();

    for (let i = 0; i < 10; i++) {
      const itemIndex = i % defaultTitles.length;
      fireEvent.press(getByTestId(`${defaultTestId}::Item::${itemIndex}`));
    }

    expect(mockSetSearchBarClicked).toHaveBeenCalledTimes(10);
    expect(mockUpdateSearchString).toHaveBeenCalledTimes(10);

    assertSearchBarResults(getByTestId);

    const lastCallIndex = 9 % defaultTitles.length;
    expect(mockUpdateSearchString).toHaveBeenLastCalledWith(defaultTitles[lastCallIndex]);
  });

  test('handles component unmounting gracefully', () => {
    const { getByTestId, unmount } = renderSearchBarResults();

    assertSearchBarResults(getByTestId);

    fireEvent.press(getByTestId(defaultTestId + '::Item::0'));
    expect(mockUpdateSearchString).toHaveBeenCalledWith('Chocolate Chip Cookies');

    unmount();

    expect(mockSetSearchBarClicked).toHaveBeenCalledTimes(1);
    expect(mockUpdateSearchString).toHaveBeenCalledTimes(1);
  });
});
