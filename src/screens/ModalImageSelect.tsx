/**
 * ModalImageSelect - Image selection modal for recipe photos
 *
 * This modal screen provides users with multiple ways to select images for recipes.
 * It combines gallery selection from existing images with camera/gallery capture
 * options, making it easy to add photos to recipes through various methods.
 *
 * Key Features:
 * - Image gallery selection from provided array
 * - Camera photo capture with OCR-ready formatting
 * - Gallery image picker integration
 * - Responsive modal layout with themed styling
 * - Internationalized text and accessibility support
 * - Portal-based modal rendering for proper stacking
 * - Theme-aware color scheme adaptation
 *
 * Workflow:
 * 1. **Gallery Selection**: Users can pick from pre-existing images
 * 2. **Camera Capture**: Take new photos using device camera
 * 3. **Gallery Import**: Select images from device photo library
 * 4. **Image Processing**: New images are processed and added to available options
 *
 * Integration:
 * - Uses ImagePicker utility for camera and gallery operations
 * - Integrates with OCR workflow for recipe text extraction
 * - Follows Material Design modal patterns
 * - Supports dynamic image array updates
 *
 * @example
 * ```typescript
 * import { ModalImageSelect } from '@screens/ModalImageSelect';
 *
 * const [isModalVisible, setIsModalVisible] = useState(false);
 * const [availableImages, setAvailableImages] = useState([]);
 *
 * // Using the modal
 * {isModalVisible && (
 *   <ModalImageSelect
 *     arrImg={availableImages}
 *     onSelectFunction={(imageUri) => {
 *       setSelectedImage(imageUri);
 *       setIsModalVisible(false);
 *     }}
 *     onDismissFunction={() => setIsModalVisible(false)}
 *     onImagesUpdated={(newImageUri) => {
 *       setAvailableImages([...availableImages, newImageUri]);
 *     }}
 *   />
 * )}
 *
 * // Triggering OCR after image selection
 * const handleImageSelect = async (imageUri: string) => {
 *   const ocrResults = await performOCR(imageUri);
 *   // Process OCR results...
 * };
 * ```
 */

import { pickImage, takePhoto } from '@utils/ImagePicker';
import React from 'react';
import { View } from 'react-native';
import { HorizontalList } from '@components/molecules/HorizontalList';
import { RoundButton } from '@components/atomic/RoundButton';
import { Icons } from '@assets/Icons';
import { Modal, Portal, Text, useTheme } from 'react-native-paper';
import { padding } from '@styles/spacing';
import { useI18n } from '@utils/i18n';

/**
 * Props interface for ModalImageSelect component
 * Defines the callback functions and data needed for image selection workflow
 */
export type ModalImageSelectProps = {
  /** Array of available image URIs to display in the selection gallery */
  arrImg: string[];
  /** Callback function called when user selects an existing image */
  onSelectFunction: (img: string) => void;
  /** Callback function called when user dismisses the modal */
  onDismissFunction: () => void;
  /** Callback function called when a new image is captured/selected and should be added to the array */
  onImagesUpdated: (imageUri: string) => void;
};

/**
 * ModalImageSelect component - Main image selection modal
 *
 * Renders a modal interface that allows users to select images from multiple sources.
 * Provides a horizontal gallery of existing images and buttons for camera/gallery access.
 *
 * @param props - The modal image select properties
 * @param props.arrImg - Array of available image URIs for selection
 * @param props.onSelectFunction - Callback when user selects an existing image
 * @param props.onDismissFunction - Callback when modal is dismissed
 * @param props.onImagesUpdated - Callback when new image is captured/imported
 * @returns JSX.Element - Modal component with image selection interface
 */
export function ModalImageSelect({
  arrImg,
  onSelectFunction,
  onDismissFunction,
  onImagesUpdated,
}: ModalImageSelectProps) {
  const { t } = useI18n();

  const { colors } = useTheme();

  /**
   * Handles camera photo capture within the modal
   * Uses the ImagePicker utility to take a photo and processes the result
   */
  async function takePhotoInModal() {
    callSetSelectedImageWithUri(await takePhoto(colors));
  }

  /**
   * Handles image selection from device gallery
   * Uses the ImagePicker utility to select an image and processes the result
   */
  async function pickImageInModal() {
    callSetSelectedImageWithUri(await pickImage(colors));
  }

  /**
   * Processes the selected/captured image URI
   * Calls the parent callback if a valid URI is provided
   *
   * @param uri - The image URI from camera or gallery
   */
  function callSetSelectedImageWithUri(uri: string) {
    if (uri.length > 0) {
      onImagesUpdated(uri);
    }
  }

  const ocrTranslationsPrefix = 'alerts.ocrRecipe.';

  const modalTestID = 'Modal';
  const testID = 'ModalImageSelect';

  return (
    <Portal>
      <Modal
        visible={true}
        contentContainerStyle={{
          backgroundColor: colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
          marginHorizontal: padding.veryLarge,
        }}
        onDismiss={onDismissFunction}
      >
        <Text
          testID={testID + '::ExplanationText'}
          variant={'titleMedium'}
          style={{ marginVertical: padding.medium }}
        >
          {t(ocrTranslationsPrefix + 'explanationText')}
        </Text>
        <HorizontalList
          testID={modalTestID}
          propType={'Image'}
          item={arrImg}
          onPress={imgPressed => {
            onSelectFunction(imgPressed);
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            marginVertical: padding.veryLarge,
          }}
        >
          <RoundButton
            testID={modalTestID + '::Camera'}
            onPressFunction={takePhotoInModal}
            size={'medium'}
            icon={Icons.cameraIcon}
            label={t(ocrTranslationsPrefix + 'photo')}
            style={{
              width: '50%',
            }}
          />
          <RoundButton
            testID={modalTestID + '::Gallery'}
            onPressFunction={pickImageInModal}
            size={'medium'}
            icon={Icons.galleryIcon}
            label={t(ocrTranslationsPrefix + 'gallery')}
            style={{
              width: '50%',
            }}
          />
        </View>
      </Modal>
    </Portal>
  );
}

export default ModalImageSelect;
