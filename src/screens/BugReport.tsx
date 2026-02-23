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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Snackbar, useTheme } from 'react-native-paper';
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

const screenTestId = 'BugReport';

/**
 * BugReport screen component
 *
 * @returns JSX element representing the bug report form
 */
export function BugReport() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { goBack } = useNavigation<StackScreenNavigation>();

  const [description, setDescription] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAddScreenshots = async () => {
    try {
      const uris = await pickScreenshots();
      setScreenshots(prev => [...prev, ...uris]);
    } catch (error) {
      bugReportLogger.warn('Screenshot picker cancelled or failed', { error });
    }
  };

  const handleRemoveScreenshot = (uri: string) => {
    setScreenshots(prev => prev.filter(s => s !== uri));
  };

  const handleSend = async () => {
    bugReportLogger.info('User initiated bug report submission');
    const available = await isMailAvailable();
    if (!available) {
      bugReportLogger.warn('Mail unavailable on this device');
      showSnackbar(t('bugReport.mailUnavailable'));
      return;
    }

    try {
      const result = await sendBugReport(description, screenshots);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppBar title={t('bugReport.title')} onGoBack={goBack} testID={screenTestId + '::Bar'} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <CustomTextInput
          testID={screenTestId + '::Description::Input'}
          label={t('bugReport.descriptionLabel')}
          placeholder={t('bugReport.descriptionPlaceholder')}
          value={description}
          onChangeText={setDescription}
          multiline
        />

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
          onPress={handleSend}
          disabled={description.trim().length === 0}
          style={styles.screenshotsSection}
        >
          {t('bugReport.send')}
        </Button>
      </ScrollView>

      <Snackbar
        testID={screenTestId + '::Snackbar'}
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_LONG}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
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
