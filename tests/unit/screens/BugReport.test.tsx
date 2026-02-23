import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { BugReport } from '@screens/BugReport';
import { mockNavigate, mockGoBack } from '@mocks/deps/react-navigation-mock';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

jest.mock('@utils/BugReport', () => require('@mocks/utils/BugReport-mock'));

jest.mock('expo-constants', () => require('@mocks/deps/expo-constants-mock').expoConstantsMock());

const {
  mockSendBugReport,
  mockIsMailAvailable,
  mockPickScreenshots,
} = require('@mocks/utils/BugReport-mock');

const descriptionInputTestID = 'BugReport::Description::Input::CustomTextInput';
const thumbnailTestID = 'BugReport::Screenshots';
const removeButtonTestID = 'BugReport::Screenshots::Thumbnail::IconButton';

describe('BugReport Screen', () => {
  const renderBugReport = () => render(<BugReport />);

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsMailAvailable.mockResolvedValue(true);
    mockSendBugReport.mockResolvedValue({ status: 'sent' });
    mockPickScreenshots.mockResolvedValue([]);
  });

  test('renders AppBar, description input, and send button', () => {
    const { getByTestId } = renderBugReport();

    expect(getByTestId('BugReport::Bar::AppBar')).toBeTruthy();
    expect(getByTestId('BugReport::Bar::AppBar::Title::Title').props.children).toBe(
      'bugReport.title'
    );
    expect(getByTestId(descriptionInputTestID)).toBeTruthy();
    expect(getByTestId('BugReport::Send::Button')).toBeTruthy();
  });

  test('description input renders placeholder', () => {
    const { getByTestId } = renderBugReport();

    expect(getByTestId(descriptionInputTestID).props.placeholder).toBe(
      'bugReport.descriptionPlaceholder'
    );
  });

  test('send button is disabled when description is empty', () => {
    const { getByTestId } = renderBugReport();

    const sendButton = getByTestId('BugReport::Send::Button');
    expect(sendButton.props.accessibilityState.disabled).toBe(true);
  });

  test('send button is enabled when description has text', () => {
    const { getByTestId } = renderBugReport();

    fireEvent.changeText(getByTestId(descriptionInputTestID), 'App crashed on launch');

    const sendButton = getByTestId('BugReport::Send::Button');
    expect(sendButton.props.accessibilityState.disabled).toBe(false);
  });

  test('pressing send calls sendBugReport when mail is available', async () => {
    mockSendBugReport.mockResolvedValue({ status: 'sent' });
    const { getByTestId } = renderBugReport();

    fireEvent.changeText(getByTestId(descriptionInputTestID), 'Test bug description');
    fireEvent.press(getByTestId('BugReport::Send::Button'));

    await waitFor(() => {
      expect(mockSendBugReport).toHaveBeenCalledWith('Test bug description', []);
    });
  });

  test('navigates back after successful send', async () => {
    mockSendBugReport.mockResolvedValue({ status: 'sent' });
    const { getByTestId } = renderBugReport();

    fireEvent.changeText(getByTestId(descriptionInputTestID), 'Test bug');
    fireEvent.press(getByTestId('BugReport::Send::Button'));

    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  test('shows snackbar when isMailAvailable returns false', async () => {
    mockIsMailAvailable.mockResolvedValue(false);
    const { getByTestId } = renderBugReport();

    fireEvent.changeText(getByTestId(descriptionInputTestID), 'Test bug');
    fireEvent.press(getByTestId('BugReport::Send::Button'));

    await waitFor(() => {
      expect(getByTestId('BugReport::Snackbar')).toBeTruthy();
    });

    expect(mockSendBugReport).not.toHaveBeenCalled();
  });

  test('pressing add screenshot button calls pickScreenshots', async () => {
    mockPickScreenshots.mockResolvedValue([]);
    const { getByTestId } = renderBugReport();

    fireEvent.press(getByTestId('BugReport::Screenshots::AddButton'));

    await waitFor(() => {
      expect(mockPickScreenshots).toHaveBeenCalled();
    });
  });

  test('screenshot thumbnail appears after picking', async () => {
    const screenshotUri = 'file:///mock/screenshot.jpg';
    mockPickScreenshots.mockResolvedValue([screenshotUri]);
    const { getByTestId } = renderBugReport();

    fireEvent.press(getByTestId('BugReport::Screenshots::AddButton'));

    await waitFor(() => {
      expect(getByTestId(thumbnailTestID)).toBeTruthy();
    });
  });

  test('remove button removes a screenshot from the list', async () => {
    const screenshotUri = 'file:///mock/screenshot.jpg';
    mockPickScreenshots.mockResolvedValue([screenshotUri]);
    const { getByTestId, queryByTestId } = renderBugReport();

    fireEvent.press(getByTestId('BugReport::Screenshots::AddButton'));

    await waitFor(() => {
      expect(getByTestId(thumbnailTestID)).toBeTruthy();
    });

    fireEvent.press(getByTestId(removeButtonTestID));

    await waitFor(() => {
      expect(queryByTestId(thumbnailTestID)).toBeNull();
    });
  });
});
