export const mockSendBugReport = jest.fn();
export const mockIsMailAvailable = jest.fn();
export const mockPickScreenshots = jest.fn();
export const mockGetLogFilePath = jest.fn();
export const mockBuildEmailSubject = jest.fn();
export const mockBuildEmailBody = jest.fn();

export const sendBugReport = mockSendBugReport;
export const isMailAvailable = mockIsMailAvailable;
export const pickScreenshots = mockPickScreenshots;
export const getLogFilePath = mockGetLogFilePath;
export const buildEmailSubject = mockBuildEmailSubject;
export const buildEmailBody = mockBuildEmailBody;
