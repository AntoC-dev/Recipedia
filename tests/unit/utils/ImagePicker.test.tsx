import { pickImage, takePhoto } from '@utils/ImagePicker';
import { openCamera, openPicker } from 'react-native-image-crop-picker';
import { lightTheme } from '@styles/theme';
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pickImage', () => {
    test(' when permission is granted and user select an image', async () => {
      (openPicker as jest.Mock).mockResolvedValue(mockResponsePickOK);

      const result = await pickImage(colors);

      expect(openPicker).toHaveBeenCalled();
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
  describe('takePhoto', () => {
    test(' when permission is granted and user select an image', async () => {
      (openCamera as jest.Mock).mockResolvedValue(mockResponseCameraOK);

      const result = await takePhoto(colors);

      expect(openCamera).toHaveBeenCalled();
      expect(result).toEqual(mockResponseCameraOK.path);
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
