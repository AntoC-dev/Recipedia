import {
  buildEmailBody,
  buildEmailSubject,
  getLogFilePath,
  isMailAvailable,
  pickScreenshots,
  sendBugReport,
} from '@utils/BugReport';
import * as FileSystem from 'expo-file-system/legacy';
import ImageCropPicker from 'react-native-image-crop-picker';
import { mockComposeAsync, mockIsAvailableAsync } from '@mocks/deps/expo-mail-composer-mock';
import Constants from 'expo-constants';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///app/',
  getInfoAsync: jest.fn(),
}));
jest.mock('expo-constants', () => require('@mocks/deps/expo-constants-mock').expoConstantsMock());

describe('BugReport utils', () => {
  const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;
  const mockOpenPicker = ImageCropPicker.openPicker as jest.Mock;

  describe('getLogFilePath', () => {
    it('returns a path ending with recipedia-logs.txt', () => {
      const path = getLogFilePath();
      expect(path).toMatch(/recipedia-logs\.txt$/);
    });
  });

  describe('buildEmailSubject', () => {
    it('includes the version string in the subject', () => {
      const subject = buildEmailSubject('2.5.0');
      expect(subject).toContain('2.5.0');
    });
  });

  describe('buildEmailBody', () => {
    it('includes the description in the body', () => {
      const userDescription = 'App crashed when saving recipe';
      const body = buildEmailBody(userDescription);
      expect(body).toContain(userDescription);
    });
  });

  describe('buildEmailBody with null expoConfig', () => {
    it('falls back to N/A version when expoConfig is null', () => {
      const mockExpoConstants = jest.requireMock('expo-constants');
      const originalExpoConfig = mockExpoConstants.expoConfig;
      mockExpoConstants.expoConfig = null;

      const body = buildEmailBody('some description');

      mockExpoConstants.expoConfig = originalExpoConfig;
      expect(body).toContain('N/A');
    });
  });

  describe('sendBugReport', () => {
    beforeEach(() => {
      mockComposeAsync.mockResolvedValue({ status: 'sent' });
    });

    it('calls MailComposer.composeAsync with to, subject and body', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: false });
      await sendBugReport('Test description', []);

      expect(mockComposeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: expect.arrayContaining([expect.any(String)]),
          subject: expect.any(String),
          body: expect.any(String),
        })
      );
    });

    it('includes log file in attachments when the log file exists', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: true });

      await sendBugReport('Test description', []);

      const callArgs = mockComposeAsync.mock.calls[0][0];
      const logPath = getLogFilePath();
      expect(callArgs.attachments).toContain(logPath);
    });

    it('excludes log file from attachments when the log file does not exist', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: false });

      await sendBugReport('Test description', []);

      const callArgs = mockComposeAsync.mock.calls[0][0];
      const logPath = getLogFilePath();
      expect(callArgs.attachments).not.toContain(logPath);
    });

    it('includes screenshot URIs in attachments', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: false });
      const screenshotUris = ['file:///screenshot1.jpg', 'file:///screenshot2.jpg'];

      await sendBugReport('Test description', screenshotUris);

      const callArgs = mockComposeAsync.mock.calls[0][0];
      expect(callArgs.attachments).toContain('file:///screenshot1.jpg');
      expect(callArgs.attachments).toContain('file:///screenshot2.jpg');
    });

    it('falls back to N/A version in subject when expoConfig is null', async () => {
      const mockExpoConstants = jest.requireMock('expo-constants');
      const originalExpoConfig = mockExpoConstants.expoConfig;
      mockExpoConstants.expoConfig = null;
      mockGetInfoAsync.mockResolvedValue({ exists: false });

      await sendBugReport('Test description', []);

      mockExpoConstants.expoConfig = originalExpoConfig;
      const callArgs = mockComposeAsync.mock.calls[0][0];
      expect(callArgs.subject).toContain('N/A');
    });
  });

  describe('isMailAvailable', () => {
    it('calls MailComposer.isAvailableAsync', async () => {
      mockIsAvailableAsync.mockResolvedValue(true);
      await isMailAvailable();
      expect(mockIsAvailableAsync).toHaveBeenCalled();
    });
  });

  describe('pickScreenshots', () => {
    it('calls ImageCropPicker.openPicker with multiple: true', async () => {
      mockOpenPicker.mockResolvedValue([
        { path: 'file:///mock/image1.jpg' },
        { path: 'file:///mock/image2.jpg' },
      ]);

      const results = await pickScreenshots();

      expect(mockOpenPicker).toHaveBeenCalledWith(expect.objectContaining({ multiple: true }));
      expect(results).toEqual(['file:///mock/image1.jpg', 'file:///mock/image2.jpg']);
    });
  });
});
