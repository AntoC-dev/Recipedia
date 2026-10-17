import { cropImage, pickImage, takePhoto } from '@utils/ImagePicker';
import { openCamera, openCropper, openPicker } from 'react-native-image-crop-picker';
import { ImageManipulator } from 'expo-image-manipulator';
import { mockManipulatorContext } from '@mocks/deps/expo-image-manipulator-mock';
import { lightTheme } from '@styles/theme';
import { Image, Platform } from 'react-native';
import { mockImageGetSize } from '@mocks/deps/react-native-image-get-size-mock';
import { MD3Colors } from 'react-native-paper/lib/typescript/types';

jest.mock('react-native-image-crop-picker', () =>
  require('@mocks/deps/image-crop-picker-mock').imageCropPickerMock()
);

const colors = lightTheme.colors as MD3Colors;

describe('ImagePicker Utility Functions', () => {
  const cancelError = new Error('User cancelled image selection');
  const permissionError = new Error('User did not grant camera permission.');

  const mockResponsePickOK = {
    path: 'file://mock-library-image.jpg',
    height: 100,
    width: 100,
  };
  const mockResponseCameraOK = {
    path: 'file://mock-camera-image.jpg',
    height: 100,
    width: 100,
  };
  const mockResponseCropOK = {
    path: 'file://mock-library-image-cropped.jpg',
    height: 50,
    width: 50,
    cropRect: { x: 10, y: 20, width: 100, height: 100 },
  };

  const cropUri = 'dummy-uri';

  const originalOS = Platform.OS;
  const setPlatform = (os: typeof Platform.OS) =>
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true });

  beforeEach(() => {
    jest.clearAllMocks();
    setPlatform('ios');
    mockImageGetSize();
  });

  afterEach(() => setPlatform(originalOS));

  describe('pickImage', () => {
    test(' when permission is granted and user select an image', async () => {
      (openPicker as jest.Mock).mockResolvedValue(mockResponsePickOK);

      const result = await pickImage(colors);

      expect(openPicker).toHaveBeenCalled();
      expect(openCropper).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponsePickOK.path);
    });

    test(' when permission is not granted', async () => {
      (openPicker as jest.Mock).mockRejectedValue(permissionError);

      const result = await pickImage(colors);

      expect(openPicker).toHaveBeenCalled();
      expect(result).toEqual('');
    });

    test('imagePickerCall returns null for "library" when user cancels image selection', async () => {
      (openPicker as jest.Mock).mockRejectedValue(cancelError);

      const result = await pickImage(colors);

      expect(openPicker).toHaveBeenCalled();
      expect(result).toEqual('');
    });
  });

  describe('cropImage', () => {
    describe('on android', () => {
      beforeEach(() => setPlatform('android'));

      test('returns the full-resolution cropper output without the manipulator', async () => {
        (openCropper as jest.Mock).mockResolvedValue(mockResponseCropOK);

        const result = await cropImage(cropUri, colors);

        expect(result).toEqual(mockResponseCropOK.path);
        expect(ImageManipulator.manipulate).not.toHaveBeenCalled();
        expect(Image.getSize).not.toHaveBeenCalled();
      });

      test('keeps rotation enabled and does not force an output size', async () => {
        (openCropper as jest.Mock).mockResolvedValue(mockResponseCropOK);

        await cropImage(cropUri, colors);

        const options = (openCropper as jest.Mock).mock.calls[0][0];
        expect(options.enableRotationGesture).toBe(true);
        expect(options.cropperRotateButtonsHidden).toBe(false);
        expect(options.width).toBeUndefined();
        expect(options.height).toBeUndefined();
      });
    });

    describe('on ios', () => {
      beforeEach(() => {
        setPlatform('ios');
      });

      test('asks the cropper for a square box as large as the longest side with rotation enabled', async () => {
        (openCropper as jest.Mock).mockResolvedValue(mockResponseCropOK);

        await cropImage(cropUri, colors);

        expect(Image.getSize).toHaveBeenCalledWith(cropUri);
        expect(openCropper).toHaveBeenCalledWith(
          expect.objectContaining({
            path: cropUri,
            width: 4000,
            height: 4000,
            enableRotationGesture: true,
            cropperRotateButtonsHidden: false,
          })
        );
      });

      test('resizes the cropper output back to the native crop size', async () => {
        (openCropper as jest.Mock).mockResolvedValue(mockResponseCropOK);

        const result = await cropImage(cropUri, colors);

        expect(ImageManipulator.manipulate).toHaveBeenCalledWith(mockResponseCropOK.path);
        expect(mockManipulatorContext.resize).toHaveBeenCalledWith({ width: 100, height: 100 });
        expect(mockManipulatorContext.crop).not.toHaveBeenCalled();
        expect(result).toEqual('file://mock-manipulated-image.jpg');
      });

      test('rounds fractional crop sizes', async () => {
        (openCropper as jest.Mock).mockResolvedValue({
          ...mockResponseCropOK,
          cropRect: { x: 0, y: 0, width: 99.6, height: 150.2 },
        });

        await cropImage(cropUri, colors);

        expect(mockManipulatorContext.resize).toHaveBeenCalledWith({ width: 100, height: 150 });
      });

      test('returns empty string when the source size cannot be read', async () => {
        (Image.getSize as jest.Mock).mockRejectedValue(new Error('unreadable'));

        const result = await cropImage(cropUri, colors);

        expect(result).toEqual('');
        expect(openCropper).not.toHaveBeenCalled();
      });

      test('falls back to cropResult.path when cropRect is null', async () => {
        (openCropper as jest.Mock).mockResolvedValue({ ...mockResponseCropOK, cropRect: null });

        const result = await cropImage(cropUri, colors);

        expect(result).toEqual(mockResponseCropOK.path);
        expect(ImageManipulator.manipulate).not.toHaveBeenCalled();
      });
    });

    test('returns empty string when permission is not granted', async () => {
      (openCropper as jest.Mock).mockRejectedValue(permissionError);

      const result = await cropImage(cropUri, colors);

      expect(openCropper).toHaveBeenCalled();
      expect(result).toEqual('');
    });

    test('returns empty string when user cancels the crop', async () => {
      (openCropper as jest.Mock).mockRejectedValue(cancelError);

      const result = await cropImage(cropUri, colors);

      expect(openCropper).toHaveBeenCalled();
      expect(result).toEqual('');
    });
  });

  describe('takePhoto', () => {
    test(' captures uncropped then crops the photo through the full-resolution cropper path', async () => {
      (openCamera as jest.Mock).mockResolvedValue(mockResponseCameraOK);
      (openCropper as jest.Mock).mockResolvedValue(mockResponseCropOK);

      const result = await takePhoto(colors);

      expect(openCamera).toHaveBeenCalledWith(expect.objectContaining({ cropping: false }));
      expect(openCropper).toHaveBeenCalledWith(
        expect.objectContaining({ path: mockResponseCameraOK.path })
      );
      expect(mockManipulatorContext.resize).toHaveBeenCalledWith({ width: 100, height: 100 });
      expect(result).toEqual('file://mock-manipulated-image.jpg');
    });

    test(' returns empty string when user cancels the crop after capture', async () => {
      (openCamera as jest.Mock).mockResolvedValue(mockResponseCameraOK);
      (openCropper as jest.Mock).mockRejectedValue(cancelError);

      const result = await takePhoto(colors);

      expect(result).toEqual('');
      expect(ImageManipulator.manipulate).not.toHaveBeenCalled();
    });

    test(' when permission is granted and user select an image', async () => {
      (openCamera as jest.Mock).mockResolvedValue(mockResponseCameraOK);
      (openCropper as jest.Mock).mockResolvedValue({ ...mockResponseCropOK, cropRect: null });

      const result = await takePhoto(colors);

      expect(openCamera).toHaveBeenCalled();
      expect(result).toEqual(mockResponseCropOK.path);
    });

    test(' when permission is not granted', async () => {
      (openCamera as jest.Mock).mockRejectedValue(permissionError);

      const result = await takePhoto(colors);

      expect(openCamera).toHaveBeenCalled();
      expect(result).toEqual('');
    });

    test(' when permission is granted and user cancel', async () => {
      (openCamera as jest.Mock).mockRejectedValue(cancelError);

      const result = await takePhoto(colors);

      expect(openCamera).toHaveBeenCalled();
      expect(result).toEqual('');
    });
  });
});
