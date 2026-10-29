import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';
import {AuthWebView} from '@app/modules/recipe-scraper/src/ios/AuthWebView.ios';
import {AuthBridge} from '@app/modules/recipe-scraper/src/ios/AuthBridge';

jest.mock('@app/modules/recipe-scraper/src/ios/AuthBridge', () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@mocks/modules/auth-bridge-mock').authBridgeMock()
);

const LOGIN_URL = 'https://www.quitoque.fr/login';

describe('AuthWebView', () => {
    it('renders a WebView with the loginUrl as source uri', async () => {
        const {getByText} = await render(<AuthWebView loginUrl={LOGIN_URL}/>);
        expect(getByText(JSON.stringify({uri: LOGIN_URL}))).toBeTruthy();
    });

    it('calls AuthBridge.setInjectHandler on mount', async () => {
        await render(<AuthWebView loginUrl={LOGIN_URL}/>);
        expect(AuthBridge.setInjectHandler).toHaveBeenCalledTimes(1);
        expect(AuthBridge.setInjectHandler).toHaveBeenCalledWith(expect.any(Function));
    });

    it('calls AuthBridge.destroy on unmount', async () => {
        const {unmount} = await render(<AuthWebView loginUrl={LOGIN_URL}/>);
        await unmount();
        expect(AuthBridge.destroy).toHaveBeenCalledTimes(1);
    });

    it('calls AuthBridge.handleLoadEnd with the loginUrl on onLoadEnd', async () => {
        const {getByTestId} = await render(<AuthWebView loginUrl={LOGIN_URL}/>);
        await fireEvent.press(getByTestId('mock-webview-onLoadEnd'));
        expect(AuthBridge.handleLoadEnd).toHaveBeenCalledWith(LOGIN_URL);
    });

    it('calls AuthBridge.handleMessage with data on onMessage', async () => {
        const {getByTestId} = await render(<AuthWebView loginUrl={LOGIN_URL}/>);
        await fireEvent.press(getByTestId('mock-webview-onMessage'));
        expect(AuthBridge.handleMessage).toHaveBeenCalledWith('mock-message');
    });

    it('calls AuthBridge.handleWebViewError with description on onError', async () => {
        const {getByTestId} = await render(<AuthWebView loginUrl={LOGIN_URL}/>);
        await fireEvent.press(getByTestId('mock-webview-onError'));
        expect(AuthBridge.handleWebViewError).toHaveBeenCalledWith('mock-error');
    });
});
