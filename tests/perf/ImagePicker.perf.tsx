import { measureAsyncFunction } from 'reassure';
import { mockImageGetSize } from '@mocks/deps/react-native-image-get-size-mock';
import { openCamera, openCropper } from 'react-native-image-crop-picker';
import { cropImage, takePhoto } from '@utils/ImagePicker';
import { lightTheme } from '@styles/theme';
import { MD3Colors } from 'react-native-paper/lib/typescript/types';

const RUNS = 20;
const colors = lightTheme.colors as MD3Colors;

describe('ImagePicker crop pipeline performance', () => {
  beforeEach(() => {
    mockImageGetSize();
    (openCamera as jest.Mock).mockResolvedValue({ path: 'file://camera.jpg' });
    (openCropper as jest.Mock).mockResolvedValue({
      path: 'file://cropped.jpg',
      cropRect: { x: 10, y: 20, width: 100, height: 100 },
    });
  });

  test('cropImage: cropper then manipulator resize', async () => {
    await measureAsyncFunction(
      async () => {
        await cropImage('file://source.jpg', colors);
      },
      { runs: RUNS }
    );
  });

  test('takePhoto: camera then cropper then manipulator resize', async () => {
    await measureAsyncFunction(
      async () => {
        await takePhoto(colors);
      },
      { runs: RUNS }
    );
  });
});
