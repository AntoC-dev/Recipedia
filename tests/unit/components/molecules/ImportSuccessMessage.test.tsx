import { fireEvent, render } from '@testing-library/react-native';
import { ImportSuccessMessage } from '@components/molecules/ImportSuccessMessage';
import React from 'react';

describe('ImportSuccessMessage', () => {
  const defaultProps = {
    importedCount: 5,
    onFinish: jest.fn(),
    testID: 'test-success',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays import complete title', () => {
    const { getByText } = render(<ImportSuccessMessage {...defaultProps} />);

    expect(getByText('bulkImport.validation.importComplete')).toBeTruthy();
  });

  test('displays imported count message', () => {
    const { getByText } = render(<ImportSuccessMessage {...defaultProps} />);

    expect(getByText('bulkImport.validation.recipesImported')).toBeTruthy();
  });

  test('renders finish button with testID', () => {
    const { getByTestId } = render(<ImportSuccessMessage {...defaultProps} />);

    expect(getByTestId('test-success::FinishButton')).toBeTruthy();
  });

  test('calls onFinish when button pressed', () => {
    const onFinish = jest.fn();
    const { getByTestId } = render(<ImportSuccessMessage {...defaultProps} onFinish={onFinish} />);

    fireEvent.press(getByTestId('test-success::FinishButton'));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  test('displays finish button label', () => {
    const { getByText } = render(<ImportSuccessMessage {...defaultProps} />);

    expect(getByText('bulkImport.validation.finish')).toBeTruthy();
  });
});
