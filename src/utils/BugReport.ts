/**
 * BugReport - Utility functions for sending bug reports via email
 *
 * Provides functions to compose and send bug report emails with optional
 * log file and screenshot attachments. Uses expo-mail-composer for email
 * composition and expo-file-system for log file access.
 *
 * @example
 * ```typescript
 * const available = await isMailAvailable();
 * if (available) {
 *   const result = await sendBugReport('App crashed on login', []);
 * }
 * ```
 */

import { composeAsync, isAvailableAsync, MailComposerResult } from 'expo-mail-composer';
import { File, Paths } from 'expo-file-system';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { bugReportLogger } from '@utils/logger';

/** Developer contact email for bug reports */
const DEVELOPER_EMAIL = 'antonin.coupanec.dev@outlook.com';

const LOG_FILE_PREFIX = 'recipedia-logs-';
const LOG_FILE_SUFFIX = '.txt';
export const LOG_ATTACH_COUNT = 2;
export const LOG_RETENTION_DAYS = 30;

/**
 * Returns File references for the most recent log files.
 *
 * Constructs file paths for the last {@link LOG_ATTACH_COUNT} days using the same
 * ISO date format as the logger's fileAsyncTransport. Files are returned regardless
 * of whether they exist; callers should check `.exists` before attaching.
 *
 * @returns Array of File references ordered from newest to oldest
 */
export function getRecentLogFiles(): File[] {
  const today = new Date();
  return Array.from({ length: LOG_ATTACH_COUNT }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return new File(Paths.document, `${LOG_FILE_PREFIX}${y}-${m}-${d}${LOG_FILE_SUFFIX}`);
  });
}

/**
 * Deletes log files older than {@link LOG_RETENTION_DAYS} days from the documents directory.
 *
 * Scans the documents directory for files matching the `recipedia-logs-*.txt` pattern,
 * parses their date suffix, and removes those past the retention threshold.
 */
export function deleteOldLogFiles(): void {
  try {
    const cutoff = Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    Paths.document.list().forEach(item => {
      const filename = item.uri.split('/').pop() ?? '';
      if (!filename.startsWith(LOG_FILE_PREFIX) || !filename.endsWith(LOG_FILE_SUFFIX)) return;
      const datePart = filename.slice(LOG_FILE_PREFIX.length, -LOG_FILE_SUFFIX.length);
      const [y, m, d] = datePart.split('-').map(Number);
      if (!y || !m || !d) return;
      if (new Date(y, m - 1, d).getTime() < cutoff) {
        item.delete();
        bugReportLogger.debug('Deleted old log file', { filename });
      }
    });
  } catch (error) {
    bugReportLogger.warn('Failed to clean up old log files', { error });
  }
}

/**
 * Builds the email subject line for a bug report.
 *
 * @param version - The app version string (e.g. "1.2.3")
 * @returns Formatted email subject
 */
export function buildEmailSubject(version: string): string {
  return `Bug Report – Recipedia v${version}`;
}

/**
 * Builds the email body for a bug report including platform information.
 *
 * @param description - User-provided description of the issue
 * @returns Formatted email body with description and device info
 */
export function buildEmailBody(description: string): string {
  const version = Constants.expoConfig?.version ?? 'N/A';
  const platform = Platform.OS;
  const osVersion = Platform.Version;

  return [
    description,
    '',
    '---',
    `App version: ${version}`,
    `Platform: ${platform}`,
    `OS version: ${osVersion}`,
  ].join('\n');
}

/**
 * Sends a bug report email with optional log files and screenshot attachments.
 *
 * Attaches the most recent log files (up to {@link LOG_ATTACH_COUNT} days) if they exist.
 * Opens the system email composer with pre-filled fields.
 *
 * @param description - User-provided description of the issue
 * @param screenshotUris - Array of local URIs for screenshot attachments
 * @returns Promise resolving to the MailComposerResult
 */
export async function sendBugReport(
  description: string,
  screenshotUris: string[]
): Promise<MailComposerResult> {
  const version = Constants.expoConfig?.version ?? 'N/A';
  const subject = buildEmailSubject(version);
  const body = buildEmailBody(description);

  const attachments: string[] = [];
  const logFiles = getRecentLogFiles().filter(f => f.exists);
  attachments.push(...logFiles.map(f => f.uri));

  if (logFiles.length === 0) {
    bugReportLogger.warn('No log files found, skipping attachment');
  }

  attachments.push(...screenshotUris);

  bugReportLogger.info('Composing bug report email', {
    screenshotCount: screenshotUris.length,
    logFilesAttached: logFiles.length,
  });

  const result = await composeAsync({
    recipients: [DEVELOPER_EMAIL],
    subject,
    body,
    attachments,
  });

  bugReportLogger.info('Mail composer closed', { status: result.status });

  return result;
}

/**
 * Checks whether the device has a mail app available to compose emails.
 *
 * @returns Promise resolving to true if mail is available, false otherwise
 */
export async function isMailAvailable(): Promise<boolean> {
  return isAvailableAsync();
}

/**
 * Opens the image picker for selecting multiple screenshots.
 *
 * @returns Promise resolving to an array of selected image file paths
 */
export async function pickScreenshots(): Promise<string[]> {
  const results = await ImageCropPicker.openPicker({
    multiple: true,
    cropping: false,
    mediaType: 'photo',
  });
  const paths = results.map(image => image.path);
  bugReportLogger.info('Screenshots picked', { count: paths.length });
  return paths;
}
