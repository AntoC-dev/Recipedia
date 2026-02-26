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
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { bugReportLogger } from '@utils/logger';

/** Developer contact email for bug reports */
const DEVELOPER_EMAIL = 'antonin.coupanec.dev@outlook.com';

/**
 * Returns the path to the app's log file in the document directory.
 *
 * @returns Absolute path to the log file
 */
export function getLogFilePath(): string {
  return FileSystem.documentDirectory + 'recipedia-logs.txt';
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
 * Sends a bug report email with optional log file and screenshot attachments.
 *
 * Checks if the log file exists before attaching it; skips silently if not found.
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

  const logPath = getLogFilePath();
  const logInfo = await FileSystem.getInfoAsync(logPath);
  if (logInfo.exists) {
    attachments.push(logPath);
  } else {
    bugReportLogger.warn('Log file not found, skipping attachment', { logPath });
  }

  attachments.push(...screenshotUris);

  bugReportLogger.info('Composing bug report email', {
    screenshotCount: screenshotUris.length,
    logAttached: logInfo.exists,
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
