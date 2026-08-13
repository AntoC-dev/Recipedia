import {
  computeBoundedSize,
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
} from '@mocks/deps/expo-image-manipulator-mock';

describe('computeBoundedSize', () => {
  test('returns null when the longest side already fits the bound', () => {
    expect(computeBoundedSize(800, 600, 1280)).toBeNull();
  });

  test('returns null when the longest side exactly equals the bound', () => {
    expect(computeBoundedSize(1280, 720, 1280)).toBeNull();
  });

  test('scales a landscape image so its width becomes the bound', () => {
    expect(computeBoundedSize(4032, 3024, 1280)).toEqual({ width: 1280, height: 960 });
  });

  test('scales a portrait image so its height becomes the bound', () => {
    expect(computeBoundedSize(3024, 4032, 1280)).toEqual({ width: 960, height: 1280 });
  });

  test('preserves aspect ratio for extreme panoramas without collapsing a side to zero', () => {
    expect(computeBoundedSize(10000, 20, 1280)).toEqual({ width: 1280, height: 3 });
  });

  test('never returns a side below one pixel', () => {
    expect(computeBoundedSize(100000, 1, 1280)).toEqual({ width: 1280, height: 1 });
  });

  test('uses the module bound when no maximum is supplied', () => {
    expect(computeBoundedSize(MAX_IMAGE_DIMENSION * 2, MAX_IMAGE_DIMENSION * 2)).toEqual({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
    });
  });

  test.each([
    [0, 100],
    [100, 0],
    [-100, 100],
    [100, -100],
    [Number.NaN, 100],
    [100, Number.POSITIVE_INFINITY],
  ])('returns null for unusable dimensions %p x %p', (width, height) => {
    expect(computeBoundedSize(width, height, 1280)).toBeNull();
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

  const setSourceDimensions = (width: number, height: number) => {
    mockImageRef.width = width;
    mockImageRef.height = height;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setSourceDimensions(200, 200);
    mockManipulatorContext.resize.mockReturnThis();
    mockManipulatorContext.renderAsync.mockResolvedValue(mockImageRef);
    mockImageRef.saveAsync.mockResolvedValue({
      uri: 'file:///cache/manipulated.jpg',
      width: 1280,
      height: 960,
    });
  });

  test('keeps the original when the image already fits the bound', async () => {
    setSourceDimensions(800, 600);

    const result = await resizeImageToBound(sourceUri, 'jpg');

    expect(result).toEqual({ uri: sourceUri, resized: false });
    expect(mockManipulatorContext.resize).not.toHaveBeenCalled();
    expect(mockImageRef.saveAsync).not.toHaveBeenCalled();
  });

  test('keeps the original without decoding when the format cannot be preserved', async () => {
    setSourceDimensions(4032, 3024);

    const result = await resizeImageToBound(sourceUri, 'gif');

    expect(result).toEqual({ uri: sourceUri, resized: false });
    expect(ImageManipulator.manipulate).not.toHaveBeenCalled();
  });

  test('writes a bounded copy when the image exceeds the bound', async () => {
    setSourceDimensions(4032, 3024);

    const result = await resizeImageToBound(sourceUri, 'jpg');

    expect(mockManipulatorContext.resize).toHaveBeenCalledWith({ width: 1280, height: 960 });
    expect(mockImageRef.saveAsync).toHaveBeenCalledWith({
      format: SaveFormat.JPEG,
      compress: IMAGE_COMPRESSION_QUALITY,
    });
    expect(result).toEqual({ uri: 'file:///cache/manipulated.jpg', resized: true });
  });

  test('saves in the source container format', async () => {
    setSourceDimensions(4032, 3024);

    await resizeImageToBound(sourceUri, 'webp');

    expect(mockImageRef.saveAsync).toHaveBeenCalledWith(
      expect.objectContaining({ format: SaveFormat.WEBP })
    );
  });

  test('bounds the longest side to the module maximum', async () => {
    setSourceDimensions(MAX_IMAGE_DIMENSION * 2, MAX_IMAGE_DIMENSION);

    await resizeImageToBound(sourceUri, 'jpg');

    expect(mockManipulatorContext.resize).toHaveBeenCalledWith({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION / 2,
    });
  });

  test.each([
    [0, 0],
    [0, 3024],
    [Number.NaN, Number.NaN],
  ])('keeps the original when the decoder reports unusable dimensions %p x %p', async (w, h) => {
    setSourceDimensions(w, h);

    const result = await resizeImageToBound(sourceUri, 'jpg');

    expect(result).toEqual({ uri: sourceUri, resized: false });
    expect(mockManipulatorContext.resize).not.toHaveBeenCalled();
    expect(mockImageRef.saveAsync).not.toHaveBeenCalled();
  });

  test('resizes once, leaving the probing pass untouched', async () => {
    setSourceDimensions(4032, 3024);

    await resizeImageToBound(sourceUri, 'jpg');

    expect(mockManipulatorContext.resize).toHaveBeenCalledTimes(1);
    expect(mockManipulatorContext.renderAsync).toHaveBeenCalledTimes(2);
  });

  test('keeps the original when probing the source throws', async () => {
    mockManipulatorContext.renderAsync.mockRejectedValue(new Error('decode failed'));

    const result = await resizeImageToBound(sourceUri, 'jpg');

    expect(result).toEqual({ uri: sourceUri, resized: false });
  });

  test('keeps the original when saving the resized copy throws', async () => {
    setSourceDimensions(4032, 3024);
    mockImageRef.saveAsync.mockRejectedValue(new Error('out of space'));

    const result = await resizeImageToBound(sourceUri, 'jpg');

    expect(result).toEqual({ uri: sourceUri, resized: false });
  });

  test('decodes the source once by feeding the probed bitmap into the resize', async () => {
    setSourceDimensions(4032, 3024);

    await resizeImageToBound(sourceUri, 'jpg');

    expect(ImageManipulator.manipulate).toHaveBeenCalledTimes(2);
    expect(ImageManipulator.manipulate).toHaveBeenNthCalledWith(1, sourceUri);
    expect(ImageManipulator.manipulate).toHaveBeenNthCalledWith(2, mockImageRef);
  });

  test('releases the native bitmaps after writing the bounded copy', async () => {
    setSourceDimensions(4032, 3024);

    await resizeImageToBound(sourceUri, 'jpg');

    expect(mockImageRef.release).toHaveBeenCalled();
  });

  test('releases the probed bitmap when the image already fits the bound', async () => {
    setSourceDimensions(800, 600);

    await resizeImageToBound(sourceUri, 'jpg');

    expect(mockImageRef.release).toHaveBeenCalled();
  });

  test('releases the probed bitmap when saving throws', async () => {
    setSourceDimensions(4032, 3024);
    mockImageRef.saveAsync.mockRejectedValue(new Error('out of space'));

    await resizeImageToBound(sourceUri, 'jpg');

    expect(mockImageRef.release).toHaveBeenCalled();
  });
});
