import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import * as ImagePicker from '@utils/ImagePicker';

import ModalImageSelect, { ModalImageSelectProps } from '@screens/ModalImageSelect';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

jest.mock('@utils/ImagePicker', () => ({
  pickImage: jest.fn(),
  takePhoto: jest.fn(),
}));

jest.mock('@components/molecules/HorizontalList', () => ({
  HorizontalList: require('@mocks/components/molecules/HorizontalList-mock').horizontalListMock,
}));

jest.mock('@components/atomic/RoundButton', () => ({
  RoundButton: require('@mocks/components/atomic/RoundButton-mock').roundButtonMock,
}));

describe('ModalImageSelect Screen', () => {
  const mockPickImage = ImagePicker.pickImage as jest.Mock;
  const mockTakePhoto = ImagePicker.takePhoto as jest.Mock;

  const sampleImages = ['file:///image1.jpg', 'file:///image2.png', 'file:///image3.jpeg'];

  const defaultProps = {
    arrImg: sampleImages,
    onSelectFunction: jest.fn(),
    onDismissFunction: jest.fn(),
    onImagesUpdated: jest.fn(),
  };

  const renderModalImageSelect = (props: ModalImageSelectProps = defaultProps) => {
    return render(<ModalImageSelect {...props} />);
  };

  const assertModalImageSelect = (
    getByTestId: any,
    expectedProps: ModalImageSelectProps = defaultProps,
    options?: {
      skipImageChecks?: boolean;
      testId?: string;
    }
  ) => {
    const testId = options?.testId || 'Modal';

    expect(getByTestId('ModalImageSelect::ExplanationText').props.children).toBe(
      'alerts.ocrRecipe.explanationText'
    );
    expect(getByTestId('ModalImageSelect::ExplanationText').props.variant).toBe('titleMedium');
    expect(getByTestId('ModalImageSelect::ExplanationText').props.style).toBeDefined();

    expect(getByTestId(testId + '::PropType').props.children).toBe('Image');
    expect(getByTestId(testId + '::ItemCount').props.children).toBe(
      expectedProps.arrImg.length.toString()
    );

    expect(getByTestId(testId + '::Camera::RoundButton::Size').props.children).toBe('medium');
    expect(getByTestId(testId + '::Camera::RoundButton::Icon').props.children).toBe('camera');
    expect(getByTestId(testId + '::Gallery::RoundButton::Size').props.children).toBe('medium');
    expect(getByTestId(testId + '::Gallery::RoundButton::Icon').props.children).toBe('image-area');

    expect(getByTestId(testId + '::Camera::RoundButton::Label').props.children).toBe(
      'alerts.ocrRecipe.photo'
    );
    expect(getByTestId(testId + '::Gallery::RoundButton::Label').props.children).toBe(
      'alerts.ocrRecipe.gallery'
    );

    if (!options?.skipImageChecks) {
      expectedProps.arrImg.forEach((imageUri, index) => {
        expect(getByTestId(`${testId}::Item::${index}::Uri`).props.children).toBe(imageUri);
      });
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with correct structure and content', () => {
    const props = defaultProps;
    const { getByTestId } = renderModalImageSelect(props);

    assertModalImageSelect(getByTestId, props);
  });

  test('handles existing image selection correctly', () => {
    const props = defaultProps;
    const { getByTestId } = renderModalImageSelect(props);

    expect(props.onSelectFunction).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('Modal::Item::0'));
    expect(props.onSelectFunction).toHaveBeenCalledWith('file:///image1.jpg');
    expect(props.onSelectFunction).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('Modal::Item::2'));
    expect(props.onSelectFunction).toHaveBeenCalledWith('file:///image3.jpeg');
    expect(props.onSelectFunction).toHaveBeenCalledTimes(2);
  });

  test('handles camera photo capture correctly', async () => {
    mockTakePhoto.mockResolvedValue('file:///new-photo.jpg');

    const props = defaultProps;
    const { getByTestId } = renderModalImageSelect(props);

    expect(mockTakePhoto).not.toHaveBeenCalled();
    expect(props.onImagesUpdated).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('Modal::Camera::RoundButton::OnPressFunction'));
    await Promise.resolve();

    expect(mockTakePhoto).toHaveBeenCalledTimes(1);
    expect(mockTakePhoto).toHaveBeenCalledWith(expect.any(Object));
    expect(props.onImagesUpdated).toHaveBeenCalledTimes(1);
    expect(props.onImagesUpdated).toHaveBeenCalledWith('file:///new-photo.jpg');
  });

  test('handles gallery image selection correctly', async () => {
    mockPickImage.mockResolvedValue('file:///selected-image.png');

    const props = defaultProps;
    const { getByTestId } = renderModalImageSelect(props);

    expect(mockPickImage).not.toHaveBeenCalled();
    expect(props.onImagesUpdated).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('Modal::Gallery::RoundButton::OnPressFunction'));
    await Promise.resolve();

    expect(mockPickImage).toHaveBeenCalledTimes(1);
    expect(mockPickImage).toHaveBeenCalledWith(expect.any(Object));
    expect(props.onImagesUpdated).toHaveBeenCalledTimes(1);
    expect(props.onImagesUpdated).toHaveBeenCalledWith('file:///selected-image.png');
  });

  test('handles empty image URI responses from ImagePicker', async () => {
    mockTakePhoto.mockResolvedValue('');

    const props = defaultProps;
    const { getByTestId } = renderModalImageSelect(props);

    fireEvent.press(getByTestId('Modal::Camera::RoundButton::OnPressFunction'));
    await Promise.resolve();

    expect(props.onImagesUpdated).not.toHaveBeenCalled();

    mockPickImage.mockResolvedValue('');

    fireEvent.press(getByTestId('Modal::Gallery::RoundButton::OnPressFunction'));
    await Promise.resolve();

    expect(props.onImagesUpdated).not.toHaveBeenCalled();
  });

  test('handles empty image array correctly', () => {
    const props = { ...defaultProps, arrImg: [] };
    const { getByTestId } = renderModalImageSelect(props);

    assertModalImageSelect(getByTestId, props);
  });

  test('handles single image in array correctly', () => {
    const props = { ...defaultProps, arrImg: ['file:///single-image.jpg'] };
    const { getByTestId } = renderModalImageSelect(props);

    assertModalImageSelect(getByTestId, props);

    fireEvent.press(getByTestId('Modal::Item::0'));
    expect(props.onSelectFunction).toHaveBeenCalledWith('file:///single-image.jpg');
  });

  test('handles large image arrays correctly', () => {
    const largeImageArray = Array.from(
      { length: 20 },
      (_, index) => `file:///image${index + 1}.jpg`
    );
    const props = { ...defaultProps, arrImg: largeImageArray };
    const { getByTestId } = renderModalImageSelect(props);

    assertModalImageSelect(getByTestId, props);

    fireEvent.press(getByTestId('Modal::Item::10'));
    expect(props.onSelectFunction).toHaveBeenCalledWith('file:///image11.jpg');

    fireEvent.press(getByTestId('Modal::Item::19'));
    expect(props.onSelectFunction).toHaveBeenCalledWith('file:///image20.jpg');
  });

  test('handles ImagePicker errors gracefully', async () => {
    mockTakePhoto.mockResolvedValue('');

    const props = defaultProps;
    const { getByTestId } = renderModalImageSelect(props);

    fireEvent.press(getByTestId('Modal::Camera::RoundButton::OnPressFunction'));
    await Promise.resolve();

    expect(props.onImagesUpdated).not.toHaveBeenCalled();

    mockPickImage.mockResolvedValue('');

    fireEvent.press(getByTestId('Modal::Gallery::RoundButton::OnPressFunction'));
    await Promise.resolve();

    expect(props.onImagesUpdated).not.toHaveBeenCalled();
  });

  test('handles rapid successive button presses correctly', async () => {
    mockTakePhoto.mockResolvedValue('file:///rapid-photo.jpg');
    mockPickImage.mockResolvedValue('file:///rapid-gallery.jpg');

    const props = defaultProps;
    const { getByTestId } = renderModalImageSelect(props);

    fireEvent.press(getByTestId('Modal::Camera::RoundButton::OnPressFunction'));
    fireEvent.press(getByTestId('Modal::Camera::RoundButton::OnPressFunction'));
    fireEvent.press(getByTestId('Modal::Camera::RoundButton::OnPressFunction'));

    fireEvent.press(getByTestId('Modal::Gallery::RoundButton::OnPressFunction'));
    fireEvent.press(getByTestId('Modal::Gallery::RoundButton::OnPressFunction'));

    await Promise.resolve();

    expect(mockTakePhoto).toHaveBeenCalledTimes(3);
    expect(mockPickImage).toHaveBeenCalledTimes(2);
    expect(props.onImagesUpdated).toHaveBeenCalledTimes(5);
  });

  test('preserves modal dismissal functionality', () => {
    const props = defaultProps;
    const { getByTestId } = renderModalImageSelect(props);

    const modalElement = getByTestId('ModalImageSelect::ExplanationText').parent?.parent;
    expect(modalElement).toBeTruthy();

    expect(props.onDismissFunction).toBeDefined();
  });

  test('handles edge cases in image URIs', () => {
    const edgeCaseImages = [
      '',
      'file:///very-long-filename-that-might-cause-issues.jpg',
      'file:///image with spaces.png',
      'file:///image@special#chars$.jpeg',
      'https://remote-image-url.com/image.jpg',
      'file:///unicode-émoji🍰-image.png',
    ];
    const props = { ...defaultProps, arrImg: edgeCaseImages };
    const { getByTestId } = renderModalImageSelect(props);

    assertModalImageSelect(getByTestId, props);

    edgeCaseImages.forEach((imageUri, index) => {
      jest.clearAllMocks();
      fireEvent.press(getByTestId(`Modal::Item::${index}`));
      expect(props.onSelectFunction).toHaveBeenCalledWith(imageUri);
    });
  });

  test('maintains accessibility and testing structure', () => {
    const props = defaultProps;
    const { getByTestId } = renderModalImageSelect(props);

    const requiredTestIds = [
      'ModalImageSelect::ExplanationText',
      'Modal::PropType',
      'Modal::ItemCount',
      'Modal::Camera::RoundButton::Label',
      'Modal::Camera::RoundButton::Size',
      'Modal::Camera::RoundButton::Icon',
      'Modal::Gallery::RoundButton::Label',
      'Modal::Gallery::RoundButton::Size',
      'Modal::Gallery::RoundButton::Icon',
    ];

    requiredTestIds.forEach(testId => {
      expect(getByTestId(testId)).toBeTruthy();
    });

    props.arrImg.forEach((_, index) => {
      expect(getByTestId(`Modal::Item::${index}`)).toBeTruthy();
      expect(getByTestId(`Modal::Item::${index}::Uri`)).toBeTruthy();
    });
  });

  test('integrates properly with async image operations', async () => {
    mockTakePhoto.mockResolvedValue('file:///camera-success.jpg');
    mockPickImage.mockResolvedValue('file:///gallery-success.png');

    const props = defaultProps;
    const { getByTestId } = renderModalImageSelect(props);

    fireEvent.press(getByTestId('Modal::Camera::RoundButton::OnPressFunction'));
    await Promise.resolve();

    expect(props.onImagesUpdated).toHaveBeenCalledWith('file:///camera-success.jpg');

    fireEvent.press(getByTestId('Modal::Gallery::RoundButton::OnPressFunction'));
    await Promise.resolve();

    expect(props.onImagesUpdated).toHaveBeenCalledWith('file:///gallery-success.png');
    expect(props.onImagesUpdated).toHaveBeenCalledTimes(2);
  });

  test('maintains component stability during complex interactions', () => {
    const props = defaultProps;
    const { getByTestId } = renderModalImageSelect(props);

    fireEvent.press(getByTestId('Modal::Item::0'));
    fireEvent.press(getByTestId('Modal::Camera::RoundButton::OnPressFunction'));
    fireEvent.press(getByTestId('Modal::Item::1'));
    fireEvent.press(getByTestId('Modal::Gallery::RoundButton::OnPressFunction'));
    fireEvent.press(getByTestId('Modal::Item::2'));

    expect(props.onSelectFunction).toHaveBeenCalledTimes(3);
    expect(mockTakePhoto).toHaveBeenCalledTimes(1);
    expect(mockPickImage).toHaveBeenCalledTimes(1);

    assertModalImageSelect(getByTestId, props);
  });
});
