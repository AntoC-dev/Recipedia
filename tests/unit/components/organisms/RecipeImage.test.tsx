import { act, fireEvent } from '@testing-library/react-native';
import { ImageButtonConfig, RecipeImage } from '@components/organisms/RecipeImage';
import React from 'react';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import { IconName } from '@assets/Icons';
import {
  IMAGE_MODAL_TARGET_TEST_ID,
  renderWithRecipeDialogs,
} from '@mocks/context/RecipeDialogsHarness';

jest.mock('@components/atomic/RoundButton', () => ({
  RoundButton: require('@mocks/components/atomic/RoundButton-mock').roundButtonMock,
}));

describe('RecipeImage Component', () => {
  const sampleImageUri = 'https://example.com/recipe-image.jpg';
  const emptyImageUri = '';
  const sampleOverlayButton: ImageButtonConfig = {
    icon: 'camera',
    labelKey: 'recipe.roundButton.photo',
  };

  const renderRecipeImage = (overrideProps = {}) => {
    const defaultProps = {
      imgUri: sampleImageUri,
      overlayButton: sampleOverlayButton,
      ...overrideProps,
    };

    return renderWithRecipeDialogs(<RecipeImage {...defaultProps} />);
  };

  const assertContainerStructure = (
    getByTestId: any,
    queryByTestId: any,
    expectedImageSource: string = sampleImageUri,
    expectImage: boolean = true
  ) => {
    const image = getByTestId('RecipeImage::Image');
    if (expectImage && expectedImageSource.length > 0) {
      expect(image.props.source).toEqual([{ uri: expectedImageSource }]);
      expect(image.props.style.opacity).toBe(1);
      expect(queryByTestId('RecipeImage::Placeholder')).toBeNull();
    } else {
      expect(image.props.style.opacity).toBe(0);
      expect(queryByTestId('RecipeImage::Placeholder')).toBeTruthy();
    }
  };

  const assertButtonStructure = (
    getByTestId: any,
    queryByTestId: any,
    shouldExist: boolean = true,
    expectedIcon: IconName = sampleOverlayButton.icon
  ) => {
    if (shouldExist) {
      expect(getByTestId('RecipeImage::RoundButton::Icon').props.children).toEqual(expectedIcon);
    } else {
      expect(queryByTestId('RecipeImage::RoundButton')).toBeNull();
    }
  };

  const simulateImageLoadSuccess = (getByTestId: any) => {
    const onLoad = getByTestId('RecipeImage::Image').props.onLoad;
    if (onLoad) {
      act(() => {
        onLoad({ nativeEvent: {} });
      });
    }
  };

  const simulateImageLoadError = (getByTestId: any) => {
    const onError = getByTestId('RecipeImage::Image').props.onError;
    if (onError) {
      act(() => {
        onError({ nativeEvent: {} });
      });
    }
  };

  test('renders with valid image URI and button in top-right position initially', () => {
    const { getByTestId, queryByTestId } = renderRecipeImage();

    assertContainerStructure(getByTestId, queryByTestId);
    assertButtonStructure(getByTestId, queryByTestId);
  });

  test('handles image load success and positions button in top-right corner', () => {
    const { getByTestId, queryByTestId } = renderRecipeImage();

    assertContainerStructure(getByTestId, queryByTestId);
    assertButtonStructure(getByTestId, queryByTestId);

    simulateImageLoadSuccess(getByTestId);

    assertButtonStructure(getByTestId, queryByTestId);
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent('none');
  });

  test('handles image load error and positions button in center', () => {
    const { getByTestId, queryByTestId } = renderRecipeImage();

    assertContainerStructure(getByTestId, queryByTestId);
    assertButtonStructure(getByTestId, queryByTestId);

    simulateImageLoadError(getByTestId);

    assertContainerStructure(getByTestId, queryByTestId, sampleImageUri, false);
    assertButtonStructure(getByTestId, queryByTestId);
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent('none');
  });

  test('renders without button when overlayButton is not provided', () => {
    const { getByTestId, queryByTestId } = renderRecipeImage({ overlayButton: undefined });

    assertContainerStructure(getByTestId, queryByTestId);
    assertButtonStructure(getByTestId, queryByTestId, false);

    simulateImageLoadSuccess(getByTestId);
    assertButtonStructure(getByTestId, queryByTestId, false);

    simulateImageLoadError(getByTestId);
    assertContainerStructure(getByTestId, queryByTestId, sampleImageUri, false);
    assertButtonStructure(getByTestId, queryByTestId, false);
  });

  test('handles empty image URI correctly', () => {
    const { getByTestId, queryByTestId } = renderRecipeImage({ imgUri: emptyImageUri });

    assertContainerStructure(getByTestId, queryByTestId, emptyImageUri, false);
    assertButtonStructure(getByTestId, queryByTestId, true);

    fireEvent.press(getByTestId('RecipeImage::RoundButton::OnPressFunction'));
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(recipeColumnsNames.image);
  });

  test('handles multiple image load state changes correctly', () => {
    const { getByTestId, queryByTestId } = renderRecipeImage();

    assertContainerStructure(getByTestId, queryByTestId);
    assertButtonStructure(getByTestId, queryByTestId);

    simulateImageLoadSuccess(getByTestId);
    assertButtonStructure(getByTestId, queryByTestId);

    simulateImageLoadError(getByTestId);
    assertContainerStructure(getByTestId, queryByTestId, sampleImageUri, false);
    assertButtonStructure(getByTestId, queryByTestId);

    fireEvent.press(getByTestId('RecipeImage::RoundButton::OnPressFunction'));
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(recipeColumnsNames.image);
  });

  test('passes different button icons correctly', () => {
    const customOverlayButton: ImageButtonConfig = {
      icon: 'image-edit',
      labelKey: 'recipe.roundButton.photo',
    };
    const { getByTestId, queryByTestId } = renderRecipeImage({
      overlayButton: customOverlayButton,
    });

    assertContainerStructure(getByTestId, queryByTestId);
    assertButtonStructure(getByTestId, queryByTestId, true, customOverlayButton.icon);

    fireEvent.press(getByTestId('RecipeImage::RoundButton::OnPressFunction'));
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(recipeColumnsNames.image);
  });

  test('handles different image URIs and maintains state correctly', () => {
    const { getByTestId, queryByTestId, rerender } = renderRecipeImage();

    assertContainerStructure(getByTestId, queryByTestId);

    const newImageUri = 'https://example.com/new-recipe-image.jpg';
    rerender(<RecipeImage imgUri={newImageUri} overlayButton={sampleOverlayButton} />);

    assertContainerStructure(getByTestId, queryByTestId, newImageUri);
    assertButtonStructure(getByTestId, queryByTestId);

    rerender(<RecipeImage imgUri={emptyImageUri} overlayButton={sampleOverlayButton} />);

    assertContainerStructure(getByTestId, queryByTestId, emptyImageUri, false);
    assertButtonStructure(getByTestId, queryByTestId);
  });

  test('shows the translated button label before and after the image loads', () => {
    const { getByTestId } = renderRecipeImage({ imgUri: emptyImageUri });

    expect(getByTestId('RecipeImage::RoundButton::Label').props.children).toEqual(
      'recipe.roundButton.photo'
    );

    simulateImageLoadSuccess(getByTestId);

    expect(getByTestId('RecipeImage::RoundButton::Label').props.children).toEqual(
      'recipe.roundButton.photo'
    );
  });

  test('shows the translated button label when an image uri is provided', () => {
    const { getByTestId } = renderRecipeImage();

    expect(getByTestId('RecipeImage::RoundButton::Label').props.children).toEqual(
      'recipe.roundButton.photo'
    );
  });

  test('handles rapid image load state changes without errors', () => {
    const { getByTestId, queryByTestId } = renderRecipeImage();

    simulateImageLoadSuccess(getByTestId);
    simulateImageLoadError(getByTestId);

    assertContainerStructure(getByTestId, queryByTestId, sampleImageUri, false);
    assertButtonStructure(getByTestId, queryByTestId);

    fireEvent.press(getByTestId('RecipeImage::RoundButton::OnPressFunction'));
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(recipeColumnsNames.image);
  });

  test('shows placeholder after load error', () => {
    const { getByTestId, queryByTestId } = renderRecipeImage();

    assertContainerStructure(getByTestId, queryByTestId);

    simulateImageLoadSuccess(getByTestId);
    assertContainerStructure(getByTestId, queryByTestId);

    simulateImageLoadError(getByTestId);
    assertContainerStructure(getByTestId, queryByTestId, sampleImageUri, false);
  });

  test('handles edge cases with various image URI formats', () => {
    const edgeCaseUris = [
      { uri: 'file:///local/path/image.jpg', expectImage: true },
      { uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...', expectImage: true },
      { uri: 'content://media/external/images/media/1234', expectImage: true },
      {
        uri: 'https://example.com/image-with-special-chars%20and%20symbols.jpg',
        expectImage: true,
      },
      { uri: '', expectImage: false },
    ];

    edgeCaseUris.forEach(({ uri, expectImage }) => {
      const { getByTestId, queryByTestId, unmount } = renderRecipeImage({ imgUri: uri });

      assertContainerStructure(getByTestId, queryByTestId, uri, expectImage);
      assertButtonStructure(getByTestId, queryByTestId, true);
      fireEvent.press(getByTestId('RecipeImage::RoundButton::OnPressFunction'));
      expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(recipeColumnsNames.image);

      unmount();
    });
  });

  test('maintains component stability during prop changes', () => {
    const { getByTestId, queryByTestId, rerender } = renderRecipeImage();

    assertContainerStructure(getByTestId, queryByTestId);
    assertButtonStructure(getByTestId, queryByTestId);

    const newUri = 'https://example.com/different-image.jpg';
    const newOverlayButton: ImageButtonConfig = {
      icon: 'image-plus',
      labelKey: 'recipe.roundButton.photo',
    };

    rerender(<RecipeImage imgUri={newUri} overlayButton={newOverlayButton} />);

    assertContainerStructure(getByTestId, queryByTestId, newUri);
    assertButtonStructure(getByTestId, queryByTestId, true, newOverlayButton.icon);

    fireEvent.press(getByTestId('RecipeImage::RoundButton::OnPressFunction'));
    expect(getByTestId(IMAGE_MODAL_TARGET_TEST_ID)).toHaveTextContent(recipeColumnsNames.image);

    rerender(<RecipeImage imgUri={newUri} />);

    assertButtonStructure(getByTestId, queryByTestId, false);
    assertContainerStructure(getByTestId, queryByTestId, newUri);
  });
});
