import React from 'react';
import { act, render } from '@testing-library/react-native';
import CustomImage from '@components/atomic/CustomImage';
import { ImageErrorEventData, ImageLoadEventData } from 'expo-image';

describe('CustomImage component behavior', () => {
  const dummyUri = 'dummy://test-uri';
  const ID = 'Test';

  it('calls onLoadSuccess when expo image onLoad is triggered', () => {
    const onLoadMock = jest.fn();
    const dummyEvent: ImageLoadEventData = {
      cacheType: 'none',
      source: {
        url: 'dummyEventUrl',
        width: 100,
        height: 100,
        mediaType: 'unitTest',
        isAnimated: true,
      },
    };
    const { getByTestId } = render(
      <CustomImage uri={dummyUri} onLoadSuccess={onLoadMock} testID={ID} />
    );

    const expoImage = getByTestId('Test::Image');
    act(() => {
      expoImage.props.onLoad({ nativeEvent: dummyEvent });
    });
    expect(onLoadMock).toHaveBeenCalledWith(dummyEvent);
  });

  it('calls onError when expo image onError is triggered and shows placeholder', () => {
    const onErrorMock = jest.fn();
    const dummyError: ImageErrorEventData = { error: 'error string for the test' };

    const { getByTestId, queryByTestId } = render(
      <CustomImage uri={dummyUri} onLoadError={onErrorMock} testID={ID} />
    );

    const expoImage = getByTestId('Test::Image');
    act(() => {
      expoImage.props.onError({ nativeEvent: dummyError });
    });

    expect(onErrorMock).toHaveBeenCalled();
    expect(queryByTestId('Test::Placeholder')).toBeTruthy();
  });

  it('applies custom background color when provided', () => {
    const customColor = '#FF0000';
    const { getByTestId } = render(
      <CustomImage uri={dummyUri} backgroundColor={customColor} testID={ID} />
    );

    const expoImage = getByTestId('Test::Image');
    expect(expoImage.props.style.backgroundColor).toBe(customColor);
  });

  it('applies size dimensions to wrapper when provided', () => {
    const size = 100;
    const { getByTestId } = render(<CustomImage uri={dummyUri} size={size} testID={ID} />);

    const wrapper = getByTestId('Test');
    const wrapperStyle = wrapper.props.style;
    const flatStyle = Array.isArray(wrapperStyle)
      ? Object.assign({}, ...wrapperStyle)
      : wrapperStyle;
    expect(flatStyle.width).toBe(size);
    expect(flatStyle.height).toBe(size);
  });

  it('applies circular border radius to wrapper when circular and size are provided', () => {
    const size = 100;
    const { getByTestId } = render(<CustomImage uri={dummyUri} size={size} circular testID={ID} />);

    const wrapper = getByTestId('Test');
    const wrapperStyle = wrapper.props.style;
    const flatStyle = Array.isArray(wrapperStyle)
      ? Object.assign({}, ...wrapperStyle)
      : wrapperStyle;
    expect(flatStyle.borderRadius).toBe(size / 2);
  });

  it('does not apply border radius when circular but no size provided', () => {
    const { getByTestId } = render(<CustomImage uri={dummyUri} circular testID={ID} />);

    const wrapper = getByTestId('Test');
    const wrapperStyle = wrapper.props.style;
    const flatStyle = Array.isArray(wrapperStyle)
      ? Object.assign({}, ...wrapperStyle)
      : wrapperStyle;
    expect(flatStyle.borderRadius).toBe(0);
  });

  it('applies custom borderRadius to wrapper when provided', () => {
    const { getByTestId } = render(<CustomImage uri={dummyUri} borderRadius={8} testID={ID} />);

    const wrapper = getByTestId('Test');
    const wrapperStyle = wrapper.props.style;
    const flatStyle = Array.isArray(wrapperStyle)
      ? Object.assign({}, ...wrapperStyle)
      : wrapperStyle;
    expect(flatStyle.borderRadius).toBe(8);
  });

  it('custom borderRadius overrides circular', () => {
    const size = 100;
    const { getByTestId } = render(
      <CustomImage uri={dummyUri} size={size} circular borderRadius={16} testID={ID} />
    );

    const wrapper = getByTestId('Test');
    const wrapperStyle = wrapper.props.style;
    const flatStyle = Array.isArray(wrapperStyle)
      ? Object.assign({}, ...wrapperStyle)
      : wrapperStyle;
    expect(flatStyle.borderRadius).toBe(16);
  });

  it('uses default contentFit when not specified', () => {
    const { getByTestId } = render(<CustomImage uri={dummyUri} testID={ID} />);
    expect(getByTestId('Test::Image').props.contentFit).toBe('cover');
  });

  it('applies custom contentFit when provided', () => {
    const { getByTestId } = render(<CustomImage uri={dummyUri} contentFit='contain' testID={ID} />);

    expect(getByTestId('Test::Image').props.contentFit).toBe('contain');
  });

  it('uses theme colors as default background when no backgroundColor provided', () => {
    const { getByTestId } = render(<CustomImage uri={dummyUri} testID={ID} />);

    const expoImage = getByTestId('Test::Image');
    const style = expoImage.props.style;
    expect(style.backgroundColor).toBe('#7c5800');
  });

  it('shows placeholder when no uri is provided', () => {
    const { queryByTestId, getByTestId } = render(<CustomImage testID={ID} />);

    expect(queryByTestId('Test::Placeholder')).toBeTruthy();
    const image = getByTestId('Test::Image');
    expect(image.props.style.opacity).toBe(0);
  });

  it('shows placeholder icon from Icons', () => {
    const { getByTestId } = render(<CustomImage testID={ID} />);

    const placeholder = getByTestId('Test::Placeholder::Source');
    expect(placeholder.props.children).toBe('image-off-outline');
  });
});
