/**
 * AuthenticationDialog - Dialog for entering credentials to scrape protected recipes
 *
 * A specialized dialog component for authentication that handles:
 * - Username and password input
 * - Loading state during authentication
 * - Error display from failed authentication attempts
 * - Cancel and submit actions
 *
 * @example
 * ```typescript
 * <AuthenticationDialog
 *   testId="recipe-auth"
 *   isVisible={showAuthDialog}
 *   host="quitoque.fr"
 *   onClose={() => setShowAuthDialog(false)}
 *   onSubmit={(username, password) => handleAuth(username, password)}
 *   isLoading={isLoading}
 *   error={authError}
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  HelperText,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';

/**
 * Props for AuthenticationDialog component.
 */
export type AuthenticationDialogProps = {
  /** Unique identifier for testing and accessibility */
  testId: string;
  /** Whether the dialog is currently visible */
  isVisible: boolean;
  /** Host domain requiring authentication (e.g., "quitoque.fr") */
  host: string;
  /** Callback fired when dialog is closed */
  onClose: () => void;
  /** Callback fired when credentials are submitted */
  onSubmit: (username: string, password: string) => void;
  /** Whether an authentication operation is in progress */
  isLoading: boolean;
  /** Error message to display, if any */
  error?: string;
};

/**
 * AuthenticationDialog component for recipe site authentication.
 *
 * @param props - Component props
 * @returns JSX element representing an authentication dialog
 */
export function AuthenticationDialog({
  testId,
  isVisible,
  host,
  onClose,
  onSubmit,
  isLoading,
  error,
}: AuthenticationDialogProps) {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isVisible) {
      setUsername('');
      setPassword('');
    }
  }, [isVisible]);

  const handleDismiss = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!username.trim() || !password.trim()) {
      return;
    }
    onSubmit(username.trim(), password);
  };

  const isSubmitDisabled = !username.trim() || !password.trim() || isLoading;
  const modalTestId = testId + '::AuthDialog';

  return (
    <Portal>
      <Dialog visible={isVisible} onDismiss={handleDismiss} dismissable={!isLoading}>
        <Dialog.Title testID={modalTestId + '::Title'}>
          {t('authDialog.title', { host })}
        </Dialog.Title>
        <Dialog.Content>
          {isLoading ? (
            <View style={styles.loadingContainer} testID={modalTestId + '::Loading'}>
              <ActivityIndicator size='large' />
              <Text style={styles.loadingText} variant='bodyMedium'>
                {t('authDialog.loading')}
              </Text>
            </View>
          ) : (
            <View>
              <TextInput
                testID={modalTestId + '::UsernameInput'}
                label={t('authDialog.username')}
                value={username}
                onChangeText={setUsername}
                autoCapitalize='none'
                autoComplete='email'
                keyboardType='email-address'
                mode='outlined'
                error={!!error}
              />
              <TextInput
                testID={modalTestId + '::PasswordInput'}
                label={t('authDialog.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize='none'
                autoComplete='password'
                mode='outlined'
                style={styles.passwordInput}
                error={!!error}
              />
              <HelperText type='error' visible={!!error} testID={modalTestId + '::HelperText'}>
                {error}
              </HelperText>
              <Text style={styles.notice} variant='bodySmall'>
                {t('authDialog.notice')}
              </Text>
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
              {t('authDialog.submit')}
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
  passwordInput: {
    marginTop: padding.small,
  },
  dialogActions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  notice: {
    marginTop: padding.small,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});

export default AuthenticationDialog;
