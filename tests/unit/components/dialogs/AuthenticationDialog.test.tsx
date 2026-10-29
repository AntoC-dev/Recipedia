import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { AuthenticationDialog } from '@components/dialogs/AuthenticationDialog';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const defaultProps = {
  testId: 'Auth',
  isVisible: true,
  host: 'quitoque.fr',
  onClose: jest.fn(),
  onSubmit: jest.fn(),
  isLoading: false,
};

const modalTestId = defaultProps.testId + '::AuthDialog';

describe('AuthenticationDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    test('renders when isVisible is true', async () => {
      const { getByTestId } = await render(<AuthenticationDialog {...defaultProps} />);

      expect(getByTestId(modalTestId + '::Title')).toBeTruthy();
    });

    test('does not render when isVisible is false', async () => {
      const { queryByTestId } = await render(
        <AuthenticationDialog {...defaultProps} isVisible={false} />
      );

      expect(queryByTestId(modalTestId + '::Title')).toBeNull();
    });
  });

  describe('Title', () => {
    test('renders title with host name', async () => {
      const { getByTestId } = await render(<AuthenticationDialog {...defaultProps} />);

      const title = getByTestId(modalTestId + '::Title');
      expect(title.props.children).toBe('authDialog.title');
    });
  });

  describe('Input fields', () => {
    test('shows username input when not loading', async () => {
      const { getByTestId } = await render(<AuthenticationDialog {...defaultProps} />);

      expect(getByTestId(modalTestId + '::UsernameInput')).toBeTruthy();
    });

    test('shows password input when not loading', async () => {
      const { getByTestId } = await render(<AuthenticationDialog {...defaultProps} />);

      expect(getByTestId(modalTestId + '::PasswordInput')).toBeTruthy();
    });

    test('updates username on change', async () => {
      const { getByTestId } = await render(<AuthenticationDialog {...defaultProps} />);

      const usernameInput = getByTestId(modalTestId + '::UsernameInput');
      await fireEvent.changeText(usernameInput, 'user@test.com');

      expect(usernameInput.props.value).toBe('user@test.com');
    });

    test('updates password on change', async () => {
      const { getByTestId } = await render(<AuthenticationDialog {...defaultProps} />);

      const passwordInput = getByTestId(modalTestId + '::PasswordInput');
      await fireEvent.changeText(passwordInput, 'password123');

      expect(passwordInput.props.value).toBe('password123');
    });
  });

  describe('Loading state', () => {
    test('shows loading indicator when isLoading is true', async () => {
      const { getByTestId, queryByTestId } = await render(
        <AuthenticationDialog {...defaultProps} isLoading={true} />
      );

      expect(getByTestId(modalTestId + '::Loading')).toBeTruthy();
      expect(queryByTestId(modalTestId + '::UsernameInput')).toBeNull();
      expect(queryByTestId(modalTestId + '::PasswordInput')).toBeNull();
    });

    test('hides input fields when loading', async () => {
      const { queryByTestId } = await render(
        <AuthenticationDialog {...defaultProps} isLoading={true} />
      );

      expect(queryByTestId(modalTestId + '::UsernameInput')).toBeNull();
      expect(queryByTestId(modalTestId + '::PasswordInput')).toBeNull();
    });
  });

  describe('Submit button', () => {
    test('does not call onSubmit when username is empty', async () => {
      const onSubmit = jest.fn();
      const { getByTestId } = await render(
        <AuthenticationDialog {...defaultProps} onSubmit={onSubmit} />
      );

      const passwordInput = getByTestId(modalTestId + '::PasswordInput');
      await fireEvent.changeText(passwordInput, 'password123');

      const submitButton = getByTestId(modalTestId + '::SubmitButton');
      await fireEvent.press(submitButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('does not call onSubmit when password is empty', async () => {
      const onSubmit = jest.fn();
      const { getByTestId } = await render(
        <AuthenticationDialog {...defaultProps} onSubmit={onSubmit} />
      );

      const usernameInput = getByTestId(modalTestId + '::UsernameInput');
      await fireEvent.changeText(usernameInput, 'user@test.com');

      const submitButton = getByTestId(modalTestId + '::SubmitButton');
      await fireEvent.press(submitButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('calls onSubmit when both fields have values', async () => {
      const onSubmit = jest.fn();
      const { getByTestId } = await render(
        <AuthenticationDialog {...defaultProps} onSubmit={onSubmit} />
      );

      const usernameInput = getByTestId(modalTestId + '::UsernameInput');
      const passwordInput = getByTestId(modalTestId + '::PasswordInput');
      await fireEvent.changeText(usernameInput, 'user@test.com');
      await fireEvent.changeText(passwordInput, 'password123');

      const submitButton = getByTestId(modalTestId + '::SubmitButton');
      await fireEvent.press(submitButton);

      expect(onSubmit).toHaveBeenCalled();
    });

    test('calls onSubmit with trimmed credentials', async () => {
      const onSubmit = jest.fn();
      const { getByTestId } = await render(
        <AuthenticationDialog {...defaultProps} onSubmit={onSubmit} />
      );

      const usernameInput = getByTestId(modalTestId + '::UsernameInput');
      const passwordInput = getByTestId(modalTestId + '::PasswordInput');
      await fireEvent.changeText(usernameInput, '  user@test.com  ');
      await fireEvent.changeText(passwordInput, 'password123');

      const submitButton = getByTestId(modalTestId + '::SubmitButton');
      await fireEvent.press(submitButton);

      expect(onSubmit).toHaveBeenCalledWith('user@test.com', 'password123');
    });

    test('does not call onSubmit when fields are whitespace only', async () => {
      const onSubmit = jest.fn();
      const { getByTestId } = await render(
        <AuthenticationDialog {...defaultProps} onSubmit={onSubmit} />
      );

      const usernameInput = getByTestId(modalTestId + '::UsernameInput');
      const passwordInput = getByTestId(modalTestId + '::PasswordInput');
      await fireEvent.changeText(usernameInput, '   ');
      await fireEvent.changeText(passwordInput, '   ');

      const submitButton = getByTestId(modalTestId + '::SubmitButton');
      await fireEvent.press(submitButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Cancel button', () => {
    test('calls onClose when pressed', async () => {
      const onClose = jest.fn();
      const { getByTestId } = await render(
        <AuthenticationDialog {...defaultProps} onClose={onClose} />
      );

      const cancelButton = getByTestId(modalTestId + '::CancelButton');
      await fireEvent.press(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    test('does not call onClose when loading', async () => {
      const onClose = jest.fn();
      const { getByTestId } = await render(
        <AuthenticationDialog {...defaultProps} onClose={onClose} isLoading={true} />
      );

      const cancelButton = getByTestId(modalTestId + '::CancelButton');
      await fireEvent.press(cancelButton);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    test('shows error message when error prop is set', async () => {
      const { getByTestId } = await render(
        <AuthenticationDialog {...defaultProps} error='Invalid credentials' />
      );

      const helperText = getByTestId(modalTestId + '::HelperText');
      expect(helperText.props.children).toBe('Invalid credentials');
    });

    test('does not show error message when error is undefined', async () => {
      const { queryByTestId } = await render(<AuthenticationDialog {...defaultProps} />);

      expect(queryByTestId(modalTestId + '::HelperText')).toBeNull();
    });
  });

  describe('Input reset', () => {
    test('clears inputs when dialog becomes visible', async () => {
      const { getByTestId, rerender } = await render(
        <AuthenticationDialog {...defaultProps} isVisible={false} />
      );

      await rerender(<AuthenticationDialog {...defaultProps} isVisible={true} />);

      const usernameInput = getByTestId(modalTestId + '::UsernameInput');
      const passwordInput = getByTestId(modalTestId + '::PasswordInput');

      expect(usernameInput.props.value).toBe('');
      expect(passwordInput.props.value).toBe('');
    });
  });

  describe('Password toggle', () => {
    test('renders password toggle button', async () => {
      const { getByTestId } = await render(<AuthenticationDialog {...defaultProps} />);

      expect(getByTestId(modalTestId + '::PasswordToggle')).toBeTruthy();
    });

    test('password is hidden by default', async () => {
      const { getByTestId } = await render(<AuthenticationDialog {...defaultProps} />);

      const passwordInput = getByTestId(modalTestId + '::PasswordInput');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    test('toggles password visibility when pressed', async () => {
      const { getByTestId } = await render(<AuthenticationDialog {...defaultProps} />);

      const toggleButton = getByTestId(modalTestId + '::PasswordToggle');
      const passwordInput = getByTestId(modalTestId + '::PasswordInput');

      expect(passwordInput.props.secureTextEntry).toBe(true);

      await fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);

      await fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    test('resets password visibility when dialog becomes visible', async () => {
      const { getByTestId, rerender } = await render(<AuthenticationDialog {...defaultProps} />);

      const toggleButton = getByTestId(modalTestId + '::PasswordToggle');
      await fireEvent.press(toggleButton);

      const passwordInputBefore = getByTestId(modalTestId + '::PasswordInput');
      expect(passwordInputBefore.props.secureTextEntry).toBe(false);

      await rerender(<AuthenticationDialog {...defaultProps} isVisible={false} />);
      await rerender(<AuthenticationDialog {...defaultProps} isVisible={true} />);

      const passwordInputAfter = getByTestId(modalTestId + '::PasswordInput');
      expect(passwordInputAfter.props.secureTextEntry).toBe(true);
    });
  });
});
