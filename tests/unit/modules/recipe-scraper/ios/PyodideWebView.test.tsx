import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { PyodideWebView } from '@app/modules/recipe-scraper/src/ios/PyodideWebView.ios';

jest.mock('expo-asset', () => ({
    Asset: {
        fromModule: jest.fn(() => ({
            downloadAsync: jest.fn().mockResolvedValue(undefined),
            localUri: 'file:///mock/pyodide-bundle.html',
        })),
    },
}));

jest.mock('expo-file-system', () => ({
    File: jest.fn().mockImplementation(() => ({
        text: jest.fn(),
    })),
}));

jest.mock('@app/modules/recipe-scraper/src/ios/PyodideBridge', () => ({
    PyodideBridge: {
        attach: jest.fn(),
        detach: jest.fn(),
        handleMessage: jest.fn(),
    },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const expoFileSystem = require('expo-file-system');

describe('PyodideWebView (iOS)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('passes the bundled asset URI to the WebView source (no JS-side file read)', async () => {
        const { findByText } = render(<PyodideWebView />);
        const sourceText = await findByText(/pyodide-bundle\.html/);
        const source = JSON.parse(sourceText.props.children);
        expect(source.uri).toBe('file:///mock/pyodide-bundle.html');
        expect(source.html).toBeUndefined();
    });

    it('does not instantiate File(...) — that path triggers SDK 55 permission errors on iOS', async () => {
        render(<PyodideWebView />);
        await waitFor(() => expect(expoFileSystem.File).not.toHaveBeenCalled());
    });
});
