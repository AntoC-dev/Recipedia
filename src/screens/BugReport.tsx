/**
 * BugReport - Screen for submitting bug reports via email
 *
 * Allows users to describe issues they encountered, attach optional screenshots,
 * and send a pre-filled bug report email with device information and app logs.
 *
 * @example
 * ```typescript
 * navigation.navigate('BugReport');
 * ```
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { Button, HelperText, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AppBar } from '@components/organisms/AppBar';
import { ImageThumbnail } from '@components/molecules/ImageThumbnail';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';
import { StackScreenNavigation } from '@customTypes/ScreenTypes';
import { bugReportLogger } from '@utils/logger';
import { isMailAvailable, pickScreenshots, sendBugReport } from '@utils/BugReport';
import { MailComposerStatus } from 'expo-mail-composer';
import { smallCardWidth } from '@styles/buttons';
import { Icons } from '@assets/Icons';
import { CustomTextInput } from '@components/atomic/CustomTextInput';
import { getDatasetType } from '@utils/DatasetLoader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bugReportSchema, BugReportFormData, BugReportFormInput } from '@schemas/bugReportSchema';

const screenTestId = 'BugReport';

/**
 * BugReport screen component
 *
 * @returns JSX element representing the bug report form
 */
export function BugReport() {
  const { t } = useI18n();
  const { goBack } = useNavigation<StackScreenNavigation>();

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const {
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { isValid, errors },
  } = useForm<BugReportFormInput, unknown, BugReportFormData>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: { description: '', screenshots: [] },
    mode: 'onChange',
  });

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAddScreenshots = async () => {
    try {
      const uris = await pickScreenshots();
      setValue('screenshots', [...(getValues('screenshots') ?? []), ...uris]);
    } catch (error) {
      bugReportLogger.warn('Screenshot picker cancelled or failed', { error });
    }
  };

  const handleRemoveScreenshot = (uri: string) => {
    setValue(
      'screenshots',
      (getValues('screenshots') ?? []).filter(s => s !== uri)
    );
  };

  const onSubmit = async (data: BugReportFormData) => {
    bugReportLogger.info('User initiated bug report submission');
    const available = await isMailAvailable();
    if (!available) {
      bugReportLogger.warn('Mail unavailable on this device');
      showSnackbar(t('bugReport.mailUnavailable'));
      return;
    }

    try {
      const result = await sendBugReport(data.description, data.screenshots);
      if (result.status === MailComposerStatus.SENT) {
        bugReportLogger.info('Bug report sent successfully');
        goBack();
      } else if (result.status !== MailComposerStatus.CANCELLED) {
        bugReportLogger.warn('Unexpected mail composer status', { status: result.status });
        showSnackbar(t('bugReport.sendError'));
      }
    } catch (error) {
      bugReportLogger.error('Failed to open mail composer', { error });
      showSnackbar(t('bugReport.sendError'));
    }
  };

  const handleDismiss = () => {
    if (getDatasetType() !== 'test') {
      bugReportLogger.debug('Hiding snack bar');
      setSnackbarVisible(false);
    } else {
      bugReportLogger.debug('Keeping snackbar on screen for testing');
    }
  };

  const screenshots = watch('screenshots') ?? [];

  return (
    <ScreenWrapper>
      <AppBar title={t('bugReport.title')} onGoBack={goBack} testID={screenTestId + '::Bar'} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Controller
          control={control}
          name='description'
          render={({ field: { onChange, value } }) => (
            <CustomTextInput
              testID={screenTestId + '::Description::Input'}
              label={t('bugReport.descriptionLabel')}
              placeholder={t('bugReport.descriptionPlaceholder')}
              value={value}
              onChangeText={onChange}
              multiline
              error={!!errors.description}
            />
          )}
        />
        {errors.description && (
          <HelperText testID={screenTestId + '::Description::Error'} type='error'>
            {t(errors.description.message ?? '')}
          </HelperText>
        )}

        <View style={styles.screenshotsSection}>
          <View style={styles.screenshotsThumbnails}>
            {screenshots.map((uri, index) => (
              <View key={uri} style={{ margin: padding.small }}>
                <ImageThumbnail
                  uri={uri}
                  testID={screenTestId + `::${index}::Screenshots`}
                  size={smallCardWidth}
                  icon={Icons.crossIcon}
                  onIconPress={() => handleRemoveScreenshot(uri)}
                />
              </View>
            ))}
          </View>

          <Button
            testID={screenTestId + '::Screenshots::AddButton'}
            mode='outlined'
            onPress={handleAddScreenshots}
            style={styles.addButton}
          >
            {t('bugReport.addScreenshot')}
          </Button>
        </View>

        <Button
          testID={screenTestId + '::Send::Button'}
          mode='contained'
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid}
          style={styles.screenshotsSection}
        >
          {t('bugReport.send')}
        </Button>
      </ScrollView>

      <Snackbar
        testID={screenTestId + '::Snackbar'}
        visible={snackbarVisible}
        onDismiss={handleDismiss}
        duration={Snackbar.DURATION_LONG}
      >
        {snackbarMessage}
      </Snackbar>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: padding.medium,
  },
  screenshotsSection: {
    marginVertical: padding.veryLarge,
  },
  screenshotsThumbnails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: padding.small,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
});

export default BugReport;
