export const mockFetch = jest.fn();

global.fetch = mockFetch;

export function mockFetchHtmlSuccess(html = '<html></html>', url = 'https://example.com') {
  mockFetch.mockResolvedValue({
    ok: true,
    url,
    text: () => Promise.resolve(html),
  });
}

export function mockFetchHtmlError(status: number, statusText = 'Error') {
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    statusText,
  });
}

export function mockFetchHtmlNetworkError(message = 'Network error') {
  mockFetch.mockRejectedValue(new Error(message));
}

export function mockFetchHtmlAborted() {
  mockFetch.mockRejectedValue(new DOMException('Aborted', 'AbortError'));
}

export function resetFetchMock() {
  mockFetch.mockReset();
}
