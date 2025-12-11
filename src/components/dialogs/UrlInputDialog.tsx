/**
 * UrlInputDialog - Dialog for entering recipe URLs to scrape
 *
 * A specialized dialog component for URL input that handles:
 * - URL text input with validation
 * - Loading state during scraping
 * - Error display with retry capability
 * - Cancel and submit actions
 *
 * @example
 * ```typescript
 * <UrlInputDialog
 *   testId="url-import"
 *   isVisible={showUrlDialog}
 *   onClose={() => setShowUrlDialog(false)}
 *   onSubmit={(url) => handleScrape(url)}
 *   isLoading={isLoading}
 *   error={scrapeError}
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, HelperText, Portal, Text } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { isValidUrl, normalizeUrl } from '@utils/UrlHelpers';
import { CustomTextInput } from '@components/atomic/CustomTextInput';
import { padding } from '@styles/spacing';

/**
 * Props for UrlInputDialog component.
 */
export type UrlInputDialogProps = {
  /** Unique identifier for testing and accessibility */
  testId: string;
  /** Whether the dialog is currently visible */
  isVisible: boolean;
  /** Callback fired when dialog is closed */
  onClose: () => void;
  /** Callback fired when URL is submitted */
  onSubmit: (url: string) => void;
  /** Whether a scraping operation is in progress */
  isLoading: boolean;
  /** Error message to display, if any */
  error?: string;
};

/**
 * UrlInputDialog component for recipe URL input.
 *
 * @param props - Component props
 * @returns JSX element representing a URL input dialog
 */
export function UrlInputDialog({
  testId,
  isVisible,
  onClose,
  onSubmit,
  isLoading,
  error,
}: UrlInputDialogProps) {
  const { t } = useI18n();
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();

  useEffect(() => {
    if (isVisible) {
      setUrl('');
      setValidationError(undefined);
    }
  }, [isVisible]);

  useEffect(() => {
    if (url.trim() && !isValidUrl(url)) {
      setValidationError(t('urlDialog.errorInvalidUrl'));
    } else {
      setValidationError(undefined);
    }
  }, [url, t]);

  const handleDismiss = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!url.trim() || !isValidUrl(url)) {
      setValidationError(t('urlDialog.errorInvalidUrl'));
      return;
    }
    onSubmit(normalizeUrl(url));
  };

  const isSubmitDisabled = !url.trim() || !!validationError || isLoading;
  const displayError = error || validationError;
  const modalTestId = testId + '::UrlDialog';

  return (
    <Portal>
      <Dialog visible={isVisible} onDismiss={handleDismiss} dismissable={!isLoading}>
        <Dialog.Title testID={modalTestId + '::Title'}>{t('urlDialog.title')}</Dialog.Title>
        <Dialog.Content>
          {isLoading ? (
            <View style={styles.loadingContainer} testID={modalTestId + '::Loading'}>
              <ActivityIndicator size='large' />
              <Text style={styles.loadingText} variant='bodyMedium'>
                {t('urlDialog.loading')}
              </Text>
            </View>
          ) : (
            <View>
              <CustomTextInput
                testID={modalTestId + '::Input'}
                label={t('urlDialog.placeholder')}
                value={url}
                onChangeText={setUrl}
                error={!!displayError}
              />
              <HelperText
                type='error'
                visible={!!displayError}
                testID={modalTestId + '::HelperText'}
              >
                {displayError}
              </HelperText>
            </View>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <View style={styles.dialogActions}>
            <Button
              testID={modalTestId + '::CancelButton'}
              mode='outlined'
              onPress={handleDismiss}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button
              testID={modalTestId + '::SubmitButton'}
              mode='contained'
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
              loading={isLoading}
            >
              {t('urlDialog.submit')}
            </Button>
          </View>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: padding.large,
  },
  loadingText: {
    marginTop: padding.medium,
  },
  dialogActions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default UrlInputDialog;
