import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ImageThumbnail } from '@components/molecules/ImageThumbnail';

jest.mock('@components/atomic/CustomImage', () =>
  require('@mocks/components/atomic/CustomImage-mock').customImageMock()
);

describe('ImageThumbnail', () => {
  const testID = 'Screenshot';
  const thumbnailId = testID + '::Thumbnail';

  test('forwards uri and size to the underlying image', () => {
    const { getByTestId } = render(
      <ImageThumbnail uri='file:///photo.jpg' size={80} testID={testID} />
    );

    expect(getByTestId(testID + '::Uri')).toHaveTextContent('file:///photo.jpg');
    expect(getByTestId(testID + '::Size')).toHaveTextContent('80');
  });

  test('defaults the border radius to zero when not provided', () => {
    const { getByTestId } = render(<ImageThumbnail size={80} testID={testID} />);

    expect(getByTestId(testID + '::BorderRadius')).toHaveTextContent('0');
  });

  test('forwards an explicit border radius to the underlying image', () => {
    const { getByTestId } = render(<ImageThumbnail size={60} borderRadius={8} testID={testID} />);

    expect(getByTestId(testID + '::BorderRadius')).toHaveTextContent('8');
  });

  test('renders no icon overlay when no icon is given', () => {
    const { queryByTestId } = render(<ImageThumbnail size={80} testID={testID} />);

    expect(queryByTestId(thumbnailId + '::IconButton')).toBeNull();
    expect(queryByTestId(thumbnailId + '::Icon')).toBeNull();
  });

  test('renders a pressable icon button when onIconPress is given', () => {
    const { getByTestId, queryByTestId } = render(
      <ImageThumbnail size={80} testID={testID} icon='close' onIconPress={jest.fn()} />
    );

    expect(getByTestId(thumbnailId + '::IconButton')).toBeTruthy();
    expect(queryByTestId(thumbnailId + '::Icon')).toBeNull();
  });

  test('calls onIconPress when the icon button is pressed', () => {
    const onIconPress = jest.fn();
    const { getByTestId } = render(
      <ImageThumbnail size={80} testID={testID} icon='close' onIconPress={onIconPress} />
    );

    fireEvent.press(getByTestId(thumbnailId + '::IconButton'));

    expect(onIconPress).toHaveBeenCalled();
  });

  test('renders a display-only icon when onIconPress is omitted', () => {
    const { getByTestId, queryByTestId } = render(
      <ImageThumbnail size={60} testID={testID} icon='history' />
    );

    expect(getByTestId(thumbnailId + '::Icon')).toBeTruthy();
    expect(getByTestId(thumbnailId + '::Icon::Source')).toHaveTextContent('history');
    expect(queryByTestId(thumbnailId + '::IconButton')).toBeNull();
  });

  test('scales the display-only icon to a fifth of the thumbnail size', () => {
    const { getByTestId } = render(<ImageThumbnail size={60} testID={testID} icon='history' />);

    expect(getByTestId(thumbnailId + '::Icon').props.size).toBe(12);
  });

  test('rounds the icon size to a whole number', () => {
    const { getByTestId } = render(<ImageThumbnail size={57} testID={testID} icon='history' />);

    expect(getByTestId(thumbnailId + '::Icon').props.size).toBe(11);
  });

  test('sizes the icon button touch target from the thumbnail size', () => {
    const { getByTestId } = render(
      <ImageThumbnail size={80} testID={testID} icon='close' onIconPress={jest.fn()} />
    );

    expect(getByTestId(thumbnailId + '::IconButton')).toHaveStyle({ width: 16, height: 16 });
  });
});
