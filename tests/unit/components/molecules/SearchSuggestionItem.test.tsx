import { fireEvent, render } from '@testing-library/react-native';
import {
  SearchSuggestionItem,
  SearchSuggestionItemProps,
} from '@components/molecules/SearchSuggestionItem';
import React from 'react';

describe('SearchSuggestionItem Component', () => {
  const onSelect = jest.fn();

  const defaultProps: SearchSuggestionItemProps = {
    testId: 'Suggestion::Item::0',
    title: 'Lentil Curry',
    onSelect,
  };

  const renderItem = (props: SearchSuggestionItemProps = defaultProps) =>
    render(<SearchSuggestionItem {...props} />);

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the suggestion title', () => {
    const { getByTestId } = renderItem();

    expect(getByTestId('Suggestion::Item::0')).toBeTruthy();
    expect(getByTestId('Suggestion::Item::0::Title').props.children).toBe('Lentil Curry');
  });

  test('calls onSelect when pressed', () => {
    const { getByTestId } = renderItem();

    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('Suggestion::Item::0'));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('renders an empty title without crashing', () => {
    const { getByTestId } = renderItem({ ...defaultProps, title: '' });

    expect(getByTestId('Suggestion::Item::0::Title').props.children).toBe('');
  });
});
