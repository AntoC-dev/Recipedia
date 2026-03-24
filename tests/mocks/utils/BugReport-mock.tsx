export const mockSendBugReport = jest.fn();
export const mockIsMailAvailable = jest.fn();
export const mockPickScreenshots = jest.fn();
export const mockBuildEmailSubject = jest.fn();
export const mockBuildEmailBody = jest.fn();

export const sendBugReport = mockSendBugReport;
export const isMailAvailable = mockIsMailAvailable;
export const pickScreenshots = mockPickScreenshots;
export const buildEmailSubject = mockBuildEmailSubject;
export const buildEmailBody = mockBuildEmailBody;
export const LOG_FILE = { uri: '/mock/recipedia-logs.txt', exists: false };
