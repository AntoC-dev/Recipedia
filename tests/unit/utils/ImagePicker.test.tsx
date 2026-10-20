import { cropImage, pickImage, takePhoto } from '@utils/ImagePicker';
import { openCamera, openCropper, openPicker } from 'react-native-image-crop-picker';
import { lightTheme } from '@styles/theme';
import { Platform } from 'react-native';
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
  let getSizeSpy: jest.SpyInstance;

  const originalOS = Platform.OS;
  const setPlatform = (os: typeof Platform.OS) =>
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true });

  beforeEach(() => {
    jest.clearAllMocks();
    setPlatform('ios');
    getSizeSpy = mockImageGetSize();
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

      test('returns the full-resolution cropper output', async () => {
        (openCropper as jest.Mock).mockResolvedValue(mockResponseCropOK);

        const result = await cropImage(cropUri, colors);

        expect(result).toEqual(mockResponseCropOK.path);
        expect(getSizeSpy).not.toHaveBeenCalled();
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
      test('asks the cropper for a box equal to the source size with rotation enabled', async () => {
        (openCropper as jest.Mock).mockResolvedValue(mockResponseCropOK);

        await cropImage(cropUri, colors);

        expect(getSizeSpy).toHaveBeenCalledWith(cropUri);
        expect(openCropper).toHaveBeenCalledWith(
          expect.objectContaining({
            path: cropUri,
            width: 3000,
            height: 4000,
            enableRotationGesture: true,
            cropperRotateButtonsHidden: false,
          })
        );
      });

      test('keeps the landscape source size', async () => {
        mockImageGetSize(5000, 2000);
        (openCropper as jest.Mock).mockResolvedValue(mockResponseCropOK);

        await cropImage(cropUri, colors);

        expect(openCropper).toHaveBeenCalledWith(
          expect.objectContaining({ width: 5000, height: 2000 })
        );
      });

      test('returns the cropper output when cropRect is null', async () => {
        (openCropper as jest.Mock).mockResolvedValue({ ...mockResponseCropOK, cropRect: null });

        const result = await cropImage(cropUri, colors);

        expect(result).toEqual(mockResponseCropOK.path);
      });

      test('uses the provided size and does not read it from the file', async () => {
        (openCropper as jest.Mock).mockResolvedValue(mockResponseCropOK);

        await cropImage(cropUri, colors, { width: 640, height: 480 });

        expect(getSizeSpy).not.toHaveBeenCalled();
        expect(openCropper).toHaveBeenCalledWith(
          expect.objectContaining({ width: 640, height: 480 })
        );
      });

      test('opens the cropper without a box when the source size cannot be read', async () => {
        getSizeSpy.mockRejectedValue(new Error('unreadable'));
        (openCropper as jest.Mock).mockResolvedValue(mockResponseCropOK);

        const result = await cropImage(cropUri, colors);

        expect(result).toEqual(mockResponseCropOK.path);
        const options = (openCropper as jest.Mock).mock.calls[0][0];
        expect(options.width).toBeUndefined();
        expect(options.height).toBeUndefined();
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
      expect(openCropper).toHaveBeenCalledWith(
        expect.objectContaining({ width: 100, height: 100 })
      );
      expect(getSizeSpy).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponseCropOK.path);
    });

    test(' returns empty string when user cancels the crop after capture', async () => {
      (openCamera as jest.Mock).mockResolvedValue(mockResponseCameraOK);
      (openCropper as jest.Mock).mockRejectedValue(cancelError);

      const result = await takePhoto(colors);

      expect(result).toEqual('');
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
