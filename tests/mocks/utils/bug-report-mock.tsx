export const mockReportCrash = jest.fn().mockResolvedValue('sent');

export function bugReportMock() {
  return {
    reportCrash: mockReportCrash,
  };
}
