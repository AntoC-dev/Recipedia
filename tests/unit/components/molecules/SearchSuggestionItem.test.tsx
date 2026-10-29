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

  const renderItem = async (props: SearchSuggestionItemProps = defaultProps) =>
    render(<SearchSuggestionItem {...props} />);

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the suggestion title', async () => {
    const { getByTestId } = await renderItem();

    expect(getByTestId('Suggestion::Item::0')).toBeTruthy();
    expect(getByTestId('Suggestion::Item::0::Title').props.children).toBe('Lentil Curry');
  });

  test('calls onSelect when pressed', async () => {
    const { getByTestId } = await renderItem();

    expect(onSelect).not.toHaveBeenCalled();

    await fireEvent.press(getByTestId('Suggestion::Item::0'));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('renders an empty title without crashing', async () => {
    const { getByTestId } = await renderItem({ ...defaultProps, title: '' });

    expect(getByTestId('Suggestion::Item::0::Title').props.children).toBe('');
  });
});
