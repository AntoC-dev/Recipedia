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
    (openCamera as jest.Mock).mockResolvedValue({
      path: 'file://camera.jpg',
      width: 3000,
      height: 4000,
    });
    (openCropper as jest.Mock).mockResolvedValue({ path: 'file://cropped.jpg' });
  });

  test('cropImage: cropper output returned directly', async () => {
    await measureAsyncFunction(
      async () => {
        await cropImage('file://source.jpg', colors);
      },
      { runs: RUNS }
    );
  });

  test('takePhoto: camera then cropper output returned directly', async () => {
    await measureAsyncFunction(
      async () => {
        await takePhoto(colors);
      },
      { runs: RUNS }
    );
  });
});
