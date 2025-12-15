import { render } from '@testing-library/react-native';
import { ImportErrorMessage } from '@components/molecules/ImportErrorMessage';
import React from 'react';

describe('ImportErrorMessage', () => {
  test('displays error title', () => {
    const { getByText } = render(<ImportErrorMessage errorMessage='Test error' />);

    expect(getByText('bulkImport.validation.importError')).toBeTruthy();
  });

  test('displays error message when provided', () => {
    const { getByText } = render(
      <ImportErrorMessage errorMessage='Something went wrong during import' />
    );

    expect(getByText('Something went wrong during import')).toBeTruthy();
  });

  test('renders null error message gracefully', () => {
    const { getByText } = render(<ImportErrorMessage errorMessage={null} />);

    expect(getByText('bulkImport.validation.importError')).toBeTruthy();
  });
});
