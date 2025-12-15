import { render } from '@testing-library/react-native';
import { DiscoveryHeader } from '@components/molecules/DiscoveryHeader';
import React from 'react';
import { DiscoveryProgress } from '@customTypes/BulkImportTypes';

describe('DiscoveryHeader', () => {
  const defaultProgress: DiscoveryProgress = {
    phase: 'discovering',
    recipesFound: 5,
    categoriesScanned: 2,
    totalCategories: 5,
    isComplete: false,
    recipes: [],
  };

  const defaultProps = {
    recipesCount: 10,
    selectedCount: 3,
    isDiscovering: false,
    discoveryProgress: null,
    testID: 'test-header',
  };

  test('displays recipe count', () => {
    const { getByTestId } = render(<DiscoveryHeader {...defaultProps} />);

    expect(getByTestId('test-header::RecipeCount')).toBeTruthy();
  });

  test('displays selected count text', () => {
    const { getByText } = render(<DiscoveryHeader {...defaultProps} />);

    expect(getByText('bulkImport.selection.selectedCount')).toBeTruthy();
  });

  test('does not show discovery progress when not discovering', () => {
    const { queryByText, queryByTestId } = render(<DiscoveryHeader {...defaultProps} />);

    expect(queryByText('bulkImport.discovery.scanningCategories')).toBeNull();
    expect(queryByTestId('test-header::DiscoveryProgress')).toBeNull();
  });

  test('shows discovery progress when discovering with progress', () => {
    const { getByText, getByTestId } = render(
      <DiscoveryHeader {...defaultProps} isDiscovering={true} discoveryProgress={defaultProgress} />
    );

    expect(getByText('bulkImport.discovery.scanningCategories')).toBeTruthy();
    expect(getByTestId('test-header::DiscoveryProgress')).toBeTruthy();
  });

  test('does not show discovery progress when discovering without progress data', () => {
    const { queryByText, queryByTestId } = render(
      <DiscoveryHeader {...defaultProps} isDiscovering={true} discoveryProgress={null} />
    );

    expect(queryByText('bulkImport.discovery.scanningCategories')).toBeNull();
    expect(queryByTestId('test-header::DiscoveryProgress')).toBeNull();
  });

  test('shows activity indicator when discovering', () => {
    const { UNSAFE_getByType } = render(
      <DiscoveryHeader {...defaultProps} isDiscovering={true} discoveryProgress={defaultProgress} />
    );

    const ActivityIndicator = require('react-native-paper').ActivityIndicator;
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});
