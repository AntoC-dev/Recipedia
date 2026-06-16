import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FilterToggleButton } from '@components/atomic/FilterToggleButton';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

describe('FilterToggleButton', () => {
  const testID = 'FilterToggleButton';

  test('shows the add-filter label when not adding a filter', () => {
    const { getByTestId } = render(
      <FilterToggleButton testID={testID} addingFilterMode={false} onToggle={jest.fn()} />
    );

    expect(getByTestId(testID)).toHaveTextContent('addFilter');
  });

  test('shows the see-results label when adding a filter', () => {
    const { getByTestId } = render(
      <FilterToggleButton testID={testID} addingFilterMode={true} onToggle={jest.fn()} />
    );

    expect(getByTestId(testID)).toHaveTextContent('seeFilterResult');
  });

  test('calls onToggle when pressed', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <FilterToggleButton testID={testID} addingFilterMode={false} onToggle={onToggle} />
    );

    fireEvent.press(getByTestId(testID));

    expect(onToggle).toHaveBeenCalled();
  });
});
