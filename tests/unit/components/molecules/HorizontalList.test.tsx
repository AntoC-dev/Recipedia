import { fireEvent, render } from '@testing-library/react-native';
import { HorizontalList } from '@components/molecules/HorizontalList';
import React from 'react';

describe('HorizontalList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tag mode', () => {
    const tagProps = {
      propType: 'Tag' as const,
      item: ['Tag1', 'Tag2', 'Tag3'],
      testID: 'test-list',
    };

    test('renders all tag items', () => {
      const { getByTestId } = render(<HorizontalList {...tagProps} />);

      expect(getByTestId('test-list::0::Chip')).toBeTruthy();
      expect(getByTestId('test-list::1::Chip')).toBeTruthy();
      expect(getByTestId('test-list::2::Chip')).toBeTruthy();
    });

    test('renders tag text content', () => {
      const { getByTestId } = render(<HorizontalList {...tagProps} />);

      expect(getByTestId('test-list::0::Chip::Children').props.children).toBe('Tag1');
      expect(getByTestId('test-list::1::Chip::Children').props.children).toBe('Tag2');
    });

    test('calls onPress with tag when pressed', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(<HorizontalList {...tagProps} onPress={onPress} />);

      fireEvent.press(getByTestId('test-list::1::Chip'));

      expect(onPress).toHaveBeenCalledWith('Tag2');
    });

    test('handles empty array', () => {
      const { queryByTestId } = render(
        <HorizontalList propType='Tag' item={[]} testID='test-list' />
      );

      expect(queryByTestId('test-list::0::Chip')).toBeNull();
    });
  });

  describe('Image mode', () => {
    const imageProps = {
      propType: 'Image' as const,
      item: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      testID: 'test-list',
    };

    test('renders all image items', () => {
      const { getByTestId } = render(<HorizontalList {...imageProps} />);

      expect(getByTestId('test-list::List#0::SquareButton')).toBeTruthy();
      expect(getByTestId('test-list::List#1::SquareButton')).toBeTruthy();
    });

    test('calls onPress with image path when pressed', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(<HorizontalList {...imageProps} onPress={onPress} />);

      fireEvent.press(getByTestId('test-list::List#0::SquareButton').parent!);

      expect(onPress).toHaveBeenCalledWith('https://example.com/img1.jpg');
    });

    test('handles empty array', () => {
      const { queryByTestId } = render(
        <HorizontalList propType='Image' item={[]} testID='test-list' />
      );

      expect(queryByTestId('test-list::List#0::SquareButton')).toBeNull();
    });
  });
});
