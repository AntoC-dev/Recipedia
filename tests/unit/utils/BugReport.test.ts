import {
  buildCrashDescription,
  buildEmailBody,
  buildEmailSubject,
  deleteOldLogFiles,
  getRecentLogFiles,
  isMailAvailable,
  pickScreenshots,
  reportCrash,
  sendBugReport,
} from '@utils/BugReport';
import { mockDirectoryList, mockFileExists } from '@mocks/deps/expo-file-system-mock';
import ImageCropPicker from 'react-native-image-crop-picker';
import { mockComposeAsync, mockIsAvailableAsync } from '@mocks/deps/expo-mail-composer-mock';

jest.mock('expo-file-system', () =>
  require('@mocks/deps/expo-file-system-mock').expoFileSystemMock()
);
jest.mock('expo-constants', () => require('@mocks/deps/expo-constants-mock').expoConstantsMock());

describe('BugReport utils', () => {
  const mockOpenPicker = ImageCropPicker.openPicker as jest.Mock;

  beforeEach(() => {
    mockFileExists.mockReset().mockReturnValue(false);
    mockDirectoryList.mockReset().mockReturnValue([]);
  });

  describe('getRecentLogFiles', () => {
    it('returns files with URIs matching recipedia-logs-<date>.txt pattern', () => {
      getRecentLogFiles().forEach(f => {
        expect(f.uri).toMatch(/recipedia-logs-\d{4}-\d{1,2}-\d{1,2}\.txt$/);
      });
    });

    it('returns files with no double slashes in URIs', () => {
      getRecentLogFiles().forEach(f => {
        expect(f.uri).not.toMatch(/\/\//);
      });
    });

    it('returns today and yesterday files', () => {
      const files = getRecentLogFiles();
      expect(files).toHaveLength(2);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
      expect(files[0]!.uri).toContain(todayStr);
      expect(files[1]!.uri).toContain(yesterdayStr);
    });
  });

  describe('deleteOldLogFiles', () => {
    it('deletes log files older than 30 days', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      const oldFilename = `recipedia-logs-${oldDate.getFullYear()}-${oldDate.getMonth() + 1}-${oldDate.getDate()}.txt`;
      const mockDelete = jest.fn();
      mockDirectoryList.mockReturnValue([{ uri: `/documents/${oldFilename}`, delete: mockDelete }]);

      deleteOldLogFiles();

      expect(mockDelete).toHaveBeenCalled();
    });

    it('keeps log files within 30 days', () => {
      const today = new Date();
      const recentFilename = `recipedia-logs-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.txt`;
      const mockDelete = jest.fn();
      mockDirectoryList.mockReturnValue([
        { uri: `/documents/${recentFilename}`, delete: mockDelete },
      ]);

      deleteOldLogFiles();

      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('ignores files not matching the log file pattern', () => {
      const mockDelete = jest.fn();
      mockDirectoryList.mockReturnValue([
        { uri: '/documents/some-other-file.txt', delete: mockDelete },
      ]);

      deleteOldLogFiles();

      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('keeps log files 29 days old', () => {
      const twentyNineDaysAgo = new Date();
      twentyNineDaysAgo.setDate(twentyNineDaysAgo.getDate() - 29);
      const filename = `recipedia-logs-${twentyNineDaysAgo.getFullYear()}-${twentyNineDaysAgo.getMonth() + 1}-${twentyNineDaysAgo.getDate()}.txt`;
      const mockDelete = jest.fn();
      mockDirectoryList.mockReturnValue([{ uri: `/documents/${filename}`, delete: mockDelete }]);

      deleteOldLogFiles();

      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('deletes only old files when directory contains mixed ages', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      const oldFilename = `recipedia-logs-${oldDate.getFullYear()}-${oldDate.getMonth() + 1}-${oldDate.getDate()}.txt`;
      const today = new Date();
      const recentFilename = `recipedia-logs-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.txt`;
      const mockDeleteOld = jest.fn();
      const mockDeleteRecent = jest.fn();
      mockDirectoryList.mockReturnValue([
        { uri: `/documents/${oldFilename}`, delete: mockDeleteOld },
        { uri: `/documents/${recentFilename}`, delete: mockDeleteRecent },
      ]);

      deleteOldLogFiles();

      expect(mockDeleteOld).toHaveBeenCalled();
      expect(mockDeleteRecent).not.toHaveBeenCalled();
    });

    it('ignores files with malformed date suffix', () => {
      const mockDelete = jest.fn();
      mockDirectoryList.mockReturnValue([
        { uri: '/documents/recipedia-logs-notadate.txt', delete: mockDelete },
      ]);

      deleteOldLogFiles();

      expect(mockDelete).not.toHaveBeenCalled();
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
      mockFileExists.mockReturnValue(false);
      await sendBugReport('Test description', []);

      expect(mockComposeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: expect.arrayContaining([expect.any(String)]),
          subject: expect.any(String),
          body: expect.any(String),
        })
      );
    });

    it('includes existing log files in attachments', async () => {
      mockFileExists.mockReturnValue(true);

      await sendBugReport('Test description', []);

      const callArgs = mockComposeAsync.mock.calls[0][0];
      getRecentLogFiles().forEach(f => {
        expect(callArgs.attachments).toContain(f.uri);
      });
    });

    it('attaches only existing log files when some are missing', async () => {
      const logFiles = getRecentLogFiles();
      mockFileExists.mockImplementation((uri: string) => uri === logFiles[0]!.uri);

      await sendBugReport('Test description', []);

      const callArgs = mockComposeAsync.mock.calls[0][0];
      expect(callArgs.attachments).toContain(logFiles[0]!.uri);
      expect(callArgs.attachments).not.toContain(logFiles[1]!.uri);
    });

    it('excludes log files from attachments when none exist', async () => {
      mockFileExists.mockReturnValue(false);

      await sendBugReport('Test description', []);

      const callArgs = mockComposeAsync.mock.calls[0][0];
      getRecentLogFiles().forEach(f => {
        expect(callArgs.attachments).not.toContain(f.uri);
      });
    });

    it('includes screenshot URIs in attachments', async () => {
      mockFileExists.mockReturnValue(false);
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
      mockFileExists.mockReturnValue(false);

      await sendBugReport('Test description', []);

      mockExpoConstants.expoConfig = originalExpoConfig;
      const callArgs = mockComposeAsync.mock.calls[0][0];
      expect(callArgs.subject).toContain('N/A');
    });
  });

  describe('buildCrashDescription', () => {
    it('includes the error message', () => {
      const description = buildCrashDescription(new Error('boom while rendering'), null);
      expect(description).toContain('boom while rendering');
    });

    it('includes the component stack when provided', () => {
      const description = buildCrashDescription(
        new Error('boom'),
        '\n    in RecipeCard\n    in Screen'
      );
      expect(description).toContain('in RecipeCard');
    });

    it('remains a non-empty string when the component stack is null', () => {
      const description = buildCrashDescription(new Error('boom'), null);
      expect(description.length).toBeGreaterThan(0);
    });

    it('falls back to a generic message when the error message is empty', () => {
      const description = buildCrashDescription(new Error(''), null);
      expect(description).toContain('Unknown error');
    });
  });

  describe('reportCrash', () => {
    beforeEach(() => {
      mockComposeAsync.mockResolvedValue({ status: 'sent' });
      mockFileExists.mockReturnValue(false);
    });

    it('returns mail_unavailable and skips the composer when mail is unavailable', async () => {
      mockIsAvailableAsync.mockResolvedValue(false);

      const outcome = await reportCrash(new Error('boom'), null);

      expect(outcome).toBe('mail_unavailable');
      expect(mockComposeAsync).not.toHaveBeenCalled();
    });

    it('sends a report containing the crash details when mail is available', async () => {
      mockIsAvailableAsync.mockResolvedValue(true);

      const outcome = await reportCrash(new Error('render exploded'), '\n    in RecipeCard');

      expect(outcome).toBe('sent');
      const body = mockComposeAsync.mock.calls[0][0].body;
      expect(body).toContain('render exploded');
      expect(body).toContain('in RecipeCard');
    });

    it('returns cancelled when the user dismisses the composer', async () => {
      mockIsAvailableAsync.mockResolvedValue(true);
      mockComposeAsync.mockResolvedValue({ status: 'cancelled' });

      const outcome = await reportCrash(new Error('boom'), null);

      expect(outcome).toBe('cancelled');
    });

    it('returns error when the composer neither sends nor is cancelled', async () => {
      mockIsAvailableAsync.mockResolvedValue(true);
      mockComposeAsync.mockResolvedValue({ status: 'saved' });

      const outcome = await reportCrash(new Error('boom'), null);

      expect(outcome).toBe('error');
    });

    it('returns error when the composer throws', async () => {
      mockIsAvailableAsync.mockResolvedValue(true);
      mockComposeAsync.mockRejectedValue(new Error('mail failed'));

      const outcome = await reportCrash(new Error('boom'), null);

      expect(outcome).toBe('error');
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
