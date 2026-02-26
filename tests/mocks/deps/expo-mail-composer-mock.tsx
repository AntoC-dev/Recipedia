export const mockComposeAsync = jest.fn();
export const mockIsAvailableAsync = jest.fn();

export const composeAsync = mockComposeAsync;
export const isAvailableAsync = mockIsAvailableAsync;

export const MailComposerStatus = {
  SENT: 'sent',
  CANCELLED: 'cancelled',
  SAVED: 'saved',
  UNDETERMINED: 'undetermined',
};

const ExpoMailComposerMock = {
  composeAsync: mockComposeAsync,
  isAvailableAsync: mockIsAvailableAsync,
  MailComposerStatus,
};

export default ExpoMailComposerMock;
