import { fireEvent, render } from '@testing-library/react-native';
import { SelectAllRow } from '@components/molecules/SelectAllRow';
import React from 'react';

describe('SelectAllRow', () => {
  const defaultProps = {
    allSelected: false,
    selectedCount: 0,
    onToggle: jest.fn(),
    testID: 'test-select-all',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders checkbox with testID', () => {
    const { getByTestId } = render(<SelectAllRow {...defaultProps} />);

    expect(getByTestId('test-select-all::SelectAllCheckbox')).toBeTruthy();
  });

  test('renders select all text', () => {
    const { getByText } = render(<SelectAllRow {...defaultProps} />);

    expect(getByText('bulkImport.selection.selectAllExplanation')).toBeTruthy();
  });

  test('shows unchecked status when nothing selected', () => {
    const { getByTestId } = render(<SelectAllRow {...defaultProps} />);

    expect(getByTestId('test-select-all::SelectAllCheckbox::Status').props.children).toBe(
      'unchecked'
    );
  });

  test('shows indeterminate status when some selected', () => {
    const { getByTestId } = render(<SelectAllRow {...defaultProps} selectedCount={3} />);

    expect(getByTestId('test-select-all::SelectAllCheckbox::Status').props.children).toBe(
      'indeterminate'
    );
  });

  test('shows checked status when all selected', () => {
    const { getByTestId } = render(
      <SelectAllRow {...defaultProps} allSelected={true} selectedCount={5} />
    );

    expect(getByTestId('test-select-all::SelectAllCheckbox::Status').props.children).toBe(
      'checked'
    );
  });

  test('calls onToggle when checkbox pressed', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(<SelectAllRow {...defaultProps} onToggle={onToggle} />);

    fireEvent.press(getByTestId('test-select-all::SelectAllCheckbox'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('calls onToggle when text pressed', () => {
    const onToggle = jest.fn();
    const { getByText } = render(<SelectAllRow {...defaultProps} onToggle={onToggle} />);

    fireEvent.press(getByText('bulkImport.selection.selectAllExplanation'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
