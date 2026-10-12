import {
  reachesBound,
  saveFormatForExtension,
  resizeImageToBound,
  MAX_IMAGE_DIMENSION,
  IMAGE_COMPRESSION_QUALITY,
} from '@utils/imageResize';
import {
  ImageManipulator,
  SaveFormat,
  mockImageRef,
  mockManipulatorContext,
  setMockImageDimensions,
} from '@mocks/deps/expo-image-manipulator-mock';
import { mockDecodedImageRef, mockLoadAsync } from '@mocks/deps/expo-image-mock';

jest.mock('expo-image', () => require('@mocks/deps/expo-image-mock'));

describe('reachesBound', () => {
  test('is false when the longest side is below the bound', () => {
    expect(reachesBound({ width: 800, height: 600 })).toBe(false);
  });

  test('is false one pixel below the bound', () => {
    expect(reachesBound({ width: 1279, height: 1000 })).toBe(false);
  });

  test('is true when a landscape width equals the bound', () => {
    expect(reachesBound({ width: 1280, height: 960 })).toBe(true);
  });

  test('is true when a portrait height equals the bound', () => {
    expect(reachesBound({ width: 960, height: 1280 })).toBe(true);
  });

  test('is true for an extreme panorama whose short side collapsed to one pixel', () => {
    expect(reachesBound({ width: 1280, height: 1 })).toBe(true);
  });

  test.each([
    [0, 1280],
    [1280, 0],
    [-1280, 100],
    [100, -1280],
    [Number.NaN, 1280],
    [1280, Number.POSITIVE_INFINITY],
  ])('is false for unusable dimensions %p x %p', (width, height) => {
    expect(reachesBound({ width, height })).toBe(false);
  });
});

describe('saveFormatForExtension', () => {
  test.each([
    ['jpg', SaveFormat.JPEG],
    ['jpeg', SaveFormat.JPEG],
    ['png', SaveFormat.PNG],
    ['webp', SaveFormat.WEBP],
  ])('maps %s to its own container format', (extension, expected) => {
    expect(saveFormatForExtension(extension)).toBe(expected);
  });

  test('is case insensitive', () => {
    expect(saveFormatForExtension('JPEG')).toBe(SaveFormat.JPEG);
    expect(saveFormatForExtension('WebP')).toBe(SaveFormat.WEBP);
  });

  test.each(['gif', 'heic', 'bmp', '', 'jpg.'])('returns null for %p', extension => {
    expect(saveFormatForExtension(extension)).toBeNull();
  });
});

describe('resizeImageToBound', () => {
  const sourceUri = 'file:///cache/photo.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
    setMockImageDimensions(1280, 960);
    mockLoadAsync.mockResolvedValue(mockDecodedImageRef);
    mockManipulatorContext.renderAsync.mockResolvedValue(mockImageRef);
    mockImageRef.saveAsync.mockResolvedValue({
      uri: 'file:///cache/manipulated.jpg',
      width: 1280,
      height: 960,
    });
  });

  test('decodes the source once, directly at the bounded size', async () => {
    await resizeImageToBound(sourceUri, 'jpg');

    expect(mockLoadAsync).toHaveBeenCalledTimes(1);
    expect(mockLoadAsync).toHaveBeenCalledWith(sourceUri, {
      maxWidth: MAX_IMAGE_DIMENSION,
      maxHeight: MAX_IMAGE_DIMENSION,
    });
  });

  test('re-encodes the bounded bitmap without decoding the source again', async () => {
    await resizeImageToBound(sourceUri, 'jpg');

    expect(ImageManipulator.manipulate).toHaveBeenCalledTimes(1);
    expect(ImageManipulator.manipulate).toHaveBeenCalledWith(mockDecodedImageRef);
    expect(ImageManipulator.manipulate).not.toHaveBeenCalledWith(sourceUri);
    expect(mockManipulatorContext.renderAsync).toHaveBeenCalledTimes(1);
  });

  test('never asks the manipulator for a resize pass', async () => {
    await resizeImageToBound(sourceUri, 'jpg');

    expect(mockManipulatorContext.resize).not.toHaveBeenCalled();
  });

  test.each([
    [1280, 960],
    [960, 1280],
  ])('writes a bounded copy when the decoder downscaled the source to %p x %p', async (w, h) => {
    setMockImageDimensions(w, h);

    const result = await resizeImageToBound(sourceUri, 'jpg');

    expect(mockImageRef.saveAsync).toHaveBeenCalledWith({
      format: SaveFormat.JPEG,
      compress: IMAGE_COMPRESSION_QUALITY,
    });
    expect(result).toEqual({ uri: 'file:///cache/manipulated.jpg', resized: true });
  });

  test('keeps the original without re-encoding when the image is smaller than the bound', async () => {
    setMockImageDimensions(800, 600);

    const result = await resizeImageToBound(sourceUri, 'jpg');

    expect(result).toEqual({ uri: sourceUri, resized: false });
    expect(mockImageRef.saveAsync).not.toHaveBeenCalled();
  });

  test('keeps the original without decoding when the format cannot be preserved', async () => {
    const result = await resizeImageToBound(sourceUri, 'gif');

    expect(result).toEqual({ uri: sourceUri, resized: false });
    expect(mockLoadAsync).not.toHaveBeenCalled();
    expect(ImageManipulator.manipulate).not.toHaveBeenCalled();
  });

  test.each([
    ['webp', SaveFormat.WEBP],
    ['png', SaveFormat.PNG],
    ['JPEG', SaveFormat.JPEG],
  ])('saves a %s source in its own container format', async (extension, expected) => {
    await resizeImageToBound(sourceUri, extension);

    expect(mockImageRef.saveAsync).toHaveBeenCalledWith({
      format: expected,
      compress: IMAGE_COMPRESSION_QUALITY,
    });
  });

  test.each([
    [0, 0],
    [0, 1280],
    [Number.NaN, Number.NaN],
  ])('keeps the original when the decoder reports unusable dimensions %p x %p', async (w, h) => {
    setMockImageDimensions(w, h);

    const result = await resizeImageToBound(sourceUri, 'jpg');

    expect(result).toEqual({ uri: sourceUri, resized: false });
    expect(mockImageRef.saveAsync).not.toHaveBeenCalled();
  });

  test('keeps the original when decoding the source throws', async () => {
    mockLoadAsync.mockRejectedValue(new Error('decode failed'));

    const result = await resizeImageToBound(sourceUri, 'jpg');

    expect(result).toEqual({ uri: sourceUri, resized: false });
    expect(ImageManipulator.manipulate).not.toHaveBeenCalled();
  });

  test('keeps the original when rendering the bounded bitmap throws', async () => {
    mockManipulatorContext.renderAsync.mockRejectedValue(new Error('render failed'));

    const result = await resizeImageToBound(sourceUri, 'jpg');

    expect(result).toEqual({ uri: sourceUri, resized: false });
  });

  test('keeps the original when saving the bounded copy throws', async () => {
    mockImageRef.saveAsync.mockRejectedValue(new Error('out of space'));

    const result = await resizeImageToBound(sourceUri, 'jpg');

    expect(result).toEqual({ uri: sourceUri, resized: false });
  });

  test('releases both native bitmaps after writing the bounded copy', async () => {
    await resizeImageToBound(sourceUri, 'jpg');

    expect(mockImageRef.release).toHaveBeenCalledTimes(1);
    expect(mockDecodedImageRef.release).toHaveBeenCalledTimes(1);
  });

  test('releases both native bitmaps when the image is smaller than the bound', async () => {
    setMockImageDimensions(800, 600);

    await resizeImageToBound(sourceUri, 'jpg');

    expect(mockImageRef.release).toHaveBeenCalledTimes(1);
    expect(mockDecodedImageRef.release).toHaveBeenCalledTimes(1);
  });

  test('releases both native bitmaps when saving throws', async () => {
    mockImageRef.saveAsync.mockRejectedValue(new Error('out of space'));

    await resizeImageToBound(sourceUri, 'jpg');

    expect(mockImageRef.release).toHaveBeenCalledTimes(1);
    expect(mockDecodedImageRef.release).toHaveBeenCalledTimes(1);
  });

  test('releases the decoded bitmap when rendering throws', async () => {
    mockManipulatorContext.renderAsync.mockRejectedValue(new Error('render failed'));

    await resizeImageToBound(sourceUri, 'jpg');

    expect(mockDecodedImageRef.release).toHaveBeenCalledTimes(1);
    expect(mockImageRef.release).not.toHaveBeenCalled();
  });
});
