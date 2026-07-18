/**
 * ErrorFallback - Recovery UI shown when an {@link ErrorBoundary} catches a render error.
 *
 * Presentational component with two variants:
 * - recoverable (default): icon, title, message and a single "report & retry" action.
 *   Pressing it sends an automatic crash report and then lets the boundary re-mount
 *   the children, so the one button both reports and recovers.
 * - persistent (`persistent`): shown after a retry already failed once - icon, title and
 *   a "please restart" message, with no action, since retrying is proven futile.
 *
 * Text is start-aligned (not centred) for readability, and the insets are consumed
 * directly so it lays out correctly even when the root boundary catches a crash that
 * happens above the app's own SafeAreaProvider.
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';
import { Icons } from '@assets/Icons';

export type ErrorFallbackProps = {
  onReport?: () => Promise<void>;
  persistent?: boolean;
  testID?: string;
};

const ICON_SIZE = 40;

export function ErrorFallback({
  onReport,
  persistent = false,
  testID = 'ErrorFallback',
}: ErrorFallbackProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [reporting, setReporting] = useState(false);

  const handleReport = onReport
    ? async () => {
        setReporting(true);
        try {
          await onReport();
        } finally {
          setReporting(false);
        }
      }
    : undefined;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + padding.veryLarge,
          paddingBottom: insets.bottom + padding.veryLarge,
        },
      ]}
      testID={testID}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Icon source={Icons.alertWithCircle} size={ICON_SIZE} color={colors.error} />
          <Text
            variant='headlineSmall'
            accessibilityRole='header'
            style={[styles.title, { color: colors.onSurface }]}
            testID={`${testID}::Title`}
          >
            {t('errorBoundary.title')}
          </Text>
        </View>
        <Text
          variant='bodyMedium'
          style={{ color: colors.onSurfaceVariant }}
          testID={`${testID}::Message`}
        >
          {t(persistent ? 'errorBoundary.persistentMessage' : 'errorBoundary.message')}
        </Text>
      </View>
      {handleReport && (
        <Button
          mode='contained'
          buttonColor={colors.errorContainer}
          textColor={colors.onErrorContainer}
          onPress={() => void handleReport?.()}
          loading={reporting}
          disabled={reporting}
          style={styles.action}
          testID={`${testID}::Report`}
        >
          {t('errorBoundary.report')}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: padding.veryLarge,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding.medium,
    marginBottom: padding.extraLarge,
  },
  title: {
    flex: 1,
  },
  action: {
    width: '100%',
    maxWidth: 440,
  },
});
