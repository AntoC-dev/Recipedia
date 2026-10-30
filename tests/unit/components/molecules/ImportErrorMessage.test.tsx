import { render } from '@testing-library/react-native';
import { ImportErrorMessage } from '@components/molecules/ImportErrorMessage';
import React from 'react';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

describe('ImportErrorMessage', () => {
  test('displays error title', async () => {
    const { getByText } = await render(
      <ImportErrorMessage errorMessage='Test error' testID='ErrorMsg' />
    );

    expect(getByText('bulkImport.validation.importError')).toBeTruthy();
  });

  test('displays error message when provided', async () => {
    const { getByText } = await render(
      <ImportErrorMessage errorMessage='Something went wrong during import' testID='ErrorMsg' />
    );

    expect(getByText('Something went wrong during import')).toBeTruthy();
  });

  test('renders null error message gracefully', async () => {
    const { getByText } = await render(
      <ImportErrorMessage errorMessage={null} testID='ErrorMsg' />
    );

    expect(getByText('bulkImport.validation.importError')).toBeTruthy();
  });

  test('renders root with testID', async () => {
    const { getByTestId } = await render(
      <ImportErrorMessage errorMessage='err' testID='ErrorMsg' />
    );

    expect(getByTestId('ErrorMsg')).toBeTruthy();
  });

  test('renders title with testID', async () => {
    const { getByTestId } = await render(
      <ImportErrorMessage errorMessage='err' testID='ErrorMsg' />
    );

    expect(getByTestId('ErrorMsg::Title')).toBeTruthy();
  });

  test('renders message with testID', async () => {
    const { getByTestId } = await render(
      <ImportErrorMessage errorMessage='err' testID='ErrorMsg' />
    );

    expect(getByTestId('ErrorMsg::Message')).toBeTruthy();
  });
});
