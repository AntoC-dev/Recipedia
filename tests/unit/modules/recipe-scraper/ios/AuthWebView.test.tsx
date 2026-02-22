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
    it('renders a WebView with the loginUrl as source uri', () => {
        const {getByText} = render(<AuthWebView loginUrl={LOGIN_URL}/>);
        expect(getByText(JSON.stringify({uri: LOGIN_URL}))).toBeTruthy();
    });

    it('calls AuthBridge.setInjectHandler on mount', () => {
        render(<AuthWebView loginUrl={LOGIN_URL}/>);
        expect(AuthBridge.setInjectHandler).toHaveBeenCalledTimes(1);
        expect(AuthBridge.setInjectHandler).toHaveBeenCalledWith(expect.any(Function));
    });

    it('calls AuthBridge.destroy on unmount', () => {
        const {unmount} = render(<AuthWebView loginUrl={LOGIN_URL}/>);
        unmount();
        expect(AuthBridge.destroy).toHaveBeenCalledTimes(1);
    });

    it('calls AuthBridge.handleLoadEnd with the loginUrl on onLoadEnd', () => {
        const {getByTestId} = render(<AuthWebView loginUrl={LOGIN_URL}/>);
        fireEvent.press(getByTestId('mock-webview-onLoadEnd'));
        expect(AuthBridge.handleLoadEnd).toHaveBeenCalledWith(LOGIN_URL);
    });

    it('calls AuthBridge.handleMessage with data on onMessage', () => {
        const {getByTestId} = render(<AuthWebView loginUrl={LOGIN_URL}/>);
        fireEvent.press(getByTestId('mock-webview-onMessage'));
        expect(AuthBridge.handleMessage).toHaveBeenCalledWith('mock-message');
    });

    it('calls AuthBridge.handleWebViewError with description on onError', () => {
        const {getByTestId} = render(<AuthWebView loginUrl={LOGIN_URL}/>);
        fireEvent.press(getByTestId('mock-webview-onError'));
        expect(AuthBridge.handleWebViewError).toHaveBeenCalledWith('mock-error');
    });
});
