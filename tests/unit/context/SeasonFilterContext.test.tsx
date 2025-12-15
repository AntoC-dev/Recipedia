import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import { SeasonFilterProvider, useSeasonFilter } from '@context/SeasonFilterContext';

const mockGetSeasonFilter = jest.fn();
const mockSetSeasonFilter = jest.fn();

jest.mock('@utils/settings', () => ({
  getSeasonFilter: () => mockGetSeasonFilter(),
  setSeasonFilter: (value: boolean) => mockSetSeasonFilter(value),
}));

describe('SeasonFilterContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeasonFilter.mockResolvedValue(true);
  });

  const TestComponent = () => {
    const { seasonFilter, setSeasonFilter } = useSeasonFilter();
    return (
      <>
        <Text testID='filter-value'>{String(seasonFilter)}</Text>
        <Pressable testID='toggle-button' onPress={setSeasonFilter}>
          <Text>Toggle</Text>
        </Pressable>
      </>
    );
  };

  test('provides default filter value of true', async () => {
    const { getByTestId } = render(
      <SeasonFilterProvider>
        <TestComponent />
      </SeasonFilterProvider>
    );

    await waitFor(() => {
      expect(getByTestId('filter-value').props.children).toBe('true');
    });
  });

  test('loads filter value from settings', async () => {
    mockGetSeasonFilter.mockResolvedValue(false);

    const { getByTestId } = render(
      <SeasonFilterProvider>
        <TestComponent />
      </SeasonFilterProvider>
    );

    await waitFor(() => {
      expect(getByTestId('filter-value').props.children).toBe('false');
    });
  });

  test('toggles filter value when setSeasonFilter called', async () => {
    mockGetSeasonFilter.mockResolvedValue(true);

    const { getByTestId } = render(
      <SeasonFilterProvider>
        <TestComponent />
      </SeasonFilterProvider>
    );

    await waitFor(() => {
      expect(getByTestId('filter-value').props.children).toBe('true');
    });

    fireEvent.press(getByTestId('toggle-button'));

    await waitFor(() => {
      expect(getByTestId('filter-value').props.children).toBe('false');
    });
    expect(mockSetSeasonFilter).toHaveBeenCalledWith(false);
  });

  test('throws error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useSeasonFilter must be used within SeasonFilterProvider'
    );

    consoleError.mockRestore();
  });

  test('defaults to true when getSeasonFilter fails', async () => {
    mockGetSeasonFilter.mockRejectedValue(new Error('Storage error'));

    const { getByTestId } = render(
      <SeasonFilterProvider>
        <TestComponent />
      </SeasonFilterProvider>
    );

    await waitFor(() => {
      expect(getByTestId('filter-value').props.children).toBe('true');
    });
  });
});
