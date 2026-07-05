import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { expectKeyboardDismissesOnDrag } from '@test-helpers/expectKeyboardDismissesOnDrag';
import { BugReport } from '@screens/BugReport';
import { mockGoBack } from '@mocks/deps/react-navigation-mock';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

jest.mock('@utils/BugReport', () => require('@mocks/utils/BugReport-mock'));

jest.mock('expo-constants', () => require('@mocks/deps/expo-constants-mock').expoConstantsMock());

jest.mock('@utils/DatasetLoader', () => require('@mocks/utils/DatasetLoader-mock'));
const { setMockDatasetType } = require('@mocks/utils/DatasetLoader-mock');

const {
  mockSendBugReport,
  mockIsMailAvailable,
  mockPickScreenshots,
} = require('@mocks/utils/BugReport-mock');

const descriptionInputTestID = 'BugReport::Description::Input::CustomTextInput';
const descriptionErrorTestID = 'BugReport::Description::Error';
const thumbnailTestID = 'BugReport::0::Screenshots';
const removeButtonTestID = 'BugReport::0::Screenshots::Thumbnail::IconButton';

async function typeDescription(
  getByTestId: ReturnType<typeof render>['getByTestId'],
  text: string
) {
  await act(async () => {
    fireEvent.changeText(getByTestId(descriptionInputTestID), text);
  });
}

describe('BugReport Screen', () => {
  const renderBugReport = () => render(<BugReport />);

  beforeEach(() => {
    jest.clearAllMocks();
    setMockDatasetType('test');
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

  test('send button is enabled when description has text', async () => {
    const { getByTestId } = renderBugReport();

    await typeDescription(getByTestId, 'App crashed on launch');

    const sendButton = getByTestId('BugReport::Send::Button');
    expect(sendButton.props.accessibilityState.disabled).toBe(false);
  });

  test('pressing send calls sendBugReport when mail is available', async () => {
    mockSendBugReport.mockResolvedValue({ status: 'sent' });
    const { getByTestId } = renderBugReport();

    await typeDescription(getByTestId, 'Test bug description');
    fireEvent.press(getByTestId('BugReport::Send::Button'));

    await waitFor(() => {
      expect(mockSendBugReport).toHaveBeenCalledWith('Test bug description', []);
    });
  });

  test('navigates back after successful send', async () => {
    mockSendBugReport.mockResolvedValue({ status: 'sent' });
    const { getByTestId } = renderBugReport();

    await typeDescription(getByTestId, 'Test bug');
    fireEvent.press(getByTestId('BugReport::Send::Button'));

    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  test('shows snackbar when isMailAvailable returns false', async () => {
    mockIsMailAvailable.mockResolvedValue(false);
    const { getByTestId } = renderBugReport();

    await typeDescription(getByTestId, 'Test bug');
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

  test('handles pickScreenshots error silently without crashing', async () => {
    mockPickScreenshots.mockRejectedValue(new Error('Picker cancelled'));
    const { getByTestId, queryByTestId } = renderBugReport();

    fireEvent.press(getByTestId('BugReport::Screenshots::AddButton'));

    await waitFor(() => {
      expect(queryByTestId('BugReport::0::Screenshots')).toBeNull();
    });
  });

  test('does nothing when sendBugReport returns cancelled status', async () => {
    mockSendBugReport.mockResolvedValue({ status: 'cancelled' });
    const { getByTestId, queryByTestId } = renderBugReport();

    await typeDescription(getByTestId, 'Test bug');
    fireEvent.press(getByTestId('BugReport::Send::Button'));

    await waitFor(() => {
      expect(mockSendBugReport).toHaveBeenCalled();
    });
    expect(mockGoBack).not.toHaveBeenCalled();
    expect(queryByTestId('BugReport::Snackbar')).toBeNull();
  });

  test('shows snackbar when sendBugReport returns an unexpected status', async () => {
    mockSendBugReport.mockResolvedValue({ status: 'saved' });
    const { getByTestId } = renderBugReport();

    await typeDescription(getByTestId, 'Test bug');
    fireEvent.press(getByTestId('BugReport::Send::Button'));

    await waitFor(() => {
      expect(getByTestId('BugReport::Snackbar')).toBeTruthy();
    });
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  test('shows snackbar when sendBugReport throws', async () => {
    mockSendBugReport.mockRejectedValue(new Error('Mail composer failed'));
    const { getByTestId } = renderBugReport();

    await typeDescription(getByTestId, 'Test bug');
    fireEvent.press(getByTestId('BugReport::Send::Button'));

    await waitFor(() => {
      expect(getByTestId('BugReport::Snackbar')).toBeTruthy();
    });
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  test('snackbar stays visible on dismiss in test mode', async () => {
    mockIsMailAvailable.mockResolvedValue(false);
    const { getByTestId } = renderBugReport();

    await typeDescription(getByTestId, 'Test bug');
    fireEvent.press(getByTestId('BugReport::Send::Button'));

    await waitFor(() => {
      expect(getByTestId('BugReport::Snackbar')).toBeTruthy();
    });

    fireEvent.press(getByTestId('BugReport::Snackbar::Dismiss'));

    expect(getByTestId('BugReport::Snackbar')).toBeTruthy();
  });

  test('snackbar is hidden on dismiss in production mode', async () => {
    setMockDatasetType('production');
    mockIsMailAvailable.mockResolvedValue(false);
    const { getByTestId, queryByTestId } = renderBugReport();

    await typeDescription(getByTestId, 'Test bug');
    fireEvent.press(getByTestId('BugReport::Send::Button'));

    await waitFor(() => {
      expect(getByTestId('BugReport::Snackbar')).toBeTruthy();
    });

    fireEvent.press(getByTestId('BugReport::Snackbar::Dismiss'));

    expect(queryByTestId('BugReport::Snackbar')).toBeNull();
  });

  test('description error message is not shown initially', () => {
    const { queryByTestId } = renderBugReport();

    expect(queryByTestId(descriptionErrorTestID)).toBeNull();
  });

  test('description error message appears after typing then clearing description', async () => {
    const { getByTestId, queryByTestId } = renderBugReport();

    await typeDescription(getByTestId, 'Something');
    await typeDescription(getByTestId, '');

    expect(queryByTestId(descriptionErrorTestID)).toBeTruthy();
    expect(getByTestId(descriptionErrorTestID).props.children).toBe(
      'bugReport.descriptionRequired'
    );
  });

  test('description error message disappears after re-entering valid text', async () => {
    const { getByTestId, queryByTestId } = renderBugReport();

    await typeDescription(getByTestId, 'Something');
    await typeDescription(getByTestId, '');

    expect(queryByTestId(descriptionErrorTestID)).toBeTruthy();

    await typeDescription(getByTestId, 'Fixed');

    expect(queryByTestId(descriptionErrorTestID)).toBeNull();
  });

  test('send button stays disabled for whitespace-only description', async () => {
    const { getByTestId } = renderBugReport();

    await typeDescription(getByTestId, '   ');

    expect(getByTestId('BugReport::Send::Button').props.accessibilityState.disabled).toBe(true);
  });

  test('sendBugReport receives trimmed description', async () => {
    mockSendBugReport.mockResolvedValue({ status: 'sent' });
    const { getByTestId } = renderBugReport();

    await typeDescription(getByTestId, '  trimmed description  ');
    fireEvent.press(getByTestId('BugReport::Send::Button'));

    await waitFor(() => {
      expect(mockSendBugReport).toHaveBeenCalledWith('trimmed description', []);
    });
  });

  test('multiple screenshot picks accumulate thumbnails', async () => {
    mockPickScreenshots
      .mockResolvedValueOnce(['file:///first.jpg'])
      .mockResolvedValueOnce(['file:///second.jpg']);
    const { getByTestId } = renderBugReport();

    fireEvent.press(getByTestId('BugReport::Screenshots::AddButton'));
    await waitFor(() => {
      expect(getByTestId('BugReport::0::Screenshots')).toBeTruthy();
    });

    fireEvent.press(getByTestId('BugReport::Screenshots::AddButton'));
    await waitFor(() => {
      expect(getByTestId('BugReport::1::Screenshots')).toBeTruthy();
    });
  });

  test('sendBugReport receives all accumulated screenshots', async () => {
    mockSendBugReport.mockResolvedValue({ status: 'sent' });
    mockPickScreenshots
      .mockResolvedValueOnce(['file:///first.jpg'])
      .mockResolvedValueOnce(['file:///second.jpg']);
    const { getByTestId } = renderBugReport();

    fireEvent.press(getByTestId('BugReport::Screenshots::AddButton'));
    await waitFor(() => {
      expect(getByTestId('BugReport::0::Screenshots')).toBeTruthy();
    });
    fireEvent.press(getByTestId('BugReport::Screenshots::AddButton'));
    await waitFor(() => {
      expect(getByTestId('BugReport::1::Screenshots')).toBeTruthy();
    });

    await typeDescription(getByTestId, 'Bug with screenshots');
    fireEvent.press(getByTestId('BugReport::Send::Button'));

    await waitFor(() => {
      expect(mockSendBugReport).toHaveBeenCalledWith('Bug with screenshots', [
        'file:///first.jpg',
        'file:///second.jpg',
      ]);
    });
  });

  test('form dismisses the keyboard on drag', () => {
    const { UNSAFE_getAllByType } = renderBugReport();
    const { ScrollView } = require('react-native');
    expectKeyboardDismissesOnDrag(UNSAFE_getAllByType, ScrollView);
  });
});
