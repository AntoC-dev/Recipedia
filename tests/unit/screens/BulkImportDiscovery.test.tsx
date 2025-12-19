import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { BulkImportDiscovery } from '@screens/BulkImportDiscovery';
import React from 'react';
import {
  mockNavigate,
  mockGoBack,
  setMockRouteParams,
  resetMockRouteParams,
} from '@mocks/deps/react-navigation-mock';
import {
  setMockDiscoveryState,
  resetMockDiscoveryState,
  mockDiscoveryProgress,
  mockParsingProgress,
  mockSelectRecipe,
  mockToggleSelectAll,
  mockParseSelectedRecipes,
  mockAbort,
} from '@mocks/hooks/useDiscoveryWorkflow-mock';

jest.mock('@react-navigation/native', () => {
  const { reactNavigationMock } = require('@mocks/deps/react-navigation-mock');
  return reactNavigationMock();
});

jest.mock('@context/DefaultPersonsContext', () =>
  require('@mocks/context/DefaultPersonsContext-mock')
);

jest.mock('@shopify/flash-list', () => require('@mocks/deps/flash-list-mock'));

jest.mock('@hooks/useDiscoveryWorkflow', () => {
  const { useDiscoveryWorkflowMock } = require('@mocks/hooks/useDiscoveryWorkflow-mock');
  return { useDiscoveryWorkflow: useDiscoveryWorkflowMock };
});

describe('BulkImportDiscovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMockDiscoveryState();
    resetMockRouteParams();
    setMockRouteParams({ providerId: 'hellofresh' });
  });

  test('renders app bar with title', () => {
    const { getByTestId } = render(<BulkImportDiscovery />);

    expect(getByTestId('BulkImportDiscovery::AppBar')).toBeTruthy();
  });

  test('shows selection UI when showSelectionUI is true', () => {
    const { getByTestId } = render(<BulkImportDiscovery />);

    expect(getByTestId('BulkImportDiscovery::RecipeCount')).toBeTruthy();
  });

  test('shows recipe list when recipes exist', () => {
    const { getByTestId } = render(<BulkImportDiscovery />);

    expect(getByTestId('BulkImportDiscovery::Recipe::0')).toBeTruthy();
    expect(getByTestId('BulkImportDiscovery::Recipe::1')).toBeTruthy();
  });

  test('shows empty state when no recipes and selecting', () => {
    setMockDiscoveryState({ recipes: [] });
    const { getByText } = render(<BulkImportDiscovery />);

    expect(getByText('bulkImport.selection.noRecipesFound')).toBeTruthy();
  });

  test('shows loading indicator when discovering with no recipes', () => {
    setMockDiscoveryState({ phase: 'discovering', recipes: [] });
    const { UNSAFE_getByType } = render(<BulkImportDiscovery />);

    const ActivityIndicator = require('react-native-paper').ActivityIndicator;
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  test('shows select all row when recipes exist', () => {
    const { getByTestId } = render(<BulkImportDiscovery />);

    expect(getByTestId('BulkImportDiscovery::SelectAllCheckbox')).toBeTruthy();
  });

  test('calls toggleSelectAll when select all pressed', () => {
    const { getByTestId } = render(<BulkImportDiscovery />);

    fireEvent.press(getByTestId('BulkImportDiscovery::SelectAllCheckbox'));

    expect(mockToggleSelectAll).toHaveBeenCalledTimes(1);
  });

  test('calls selectRecipe when recipe card pressed', () => {
    const { getByTestId } = render(<BulkImportDiscovery />);

    fireEvent.press(getByTestId('BulkImportDiscovery::Recipe::0'));

    expect(mockSelectRecipe).toHaveBeenCalledWith('https://example.com/recipe-1');
  });

  test('shows discovery progress when discovering', () => {
    setMockDiscoveryState({ isDiscovering: true, discoveryProgress: mockDiscoveryProgress });
    const { getByText } = render(<BulkImportDiscovery />);

    expect(getByText('bulkImport.discovery.scanningCategories')).toBeTruthy();
  });

  test('shows parsing progress when parsing', () => {
    setMockDiscoveryState({
      phase: 'parsing',
      showSelectionUI: false,
      parsingProgress: mockParsingProgress,
    });
    const { getByTestId } = render(<BulkImportDiscovery />);

    expect(getByTestId('BulkImportDiscovery::ParsingProgressBar')).toBeTruthy();
  });

  test('aborts and goes back when cancel pressed', () => {
    const { getByTestId } = render(<BulkImportDiscovery />);

    fireEvent.press(getByTestId('BulkImportDiscovery::AppBar::BackButton'));

    expect(mockAbort).toHaveBeenCalledTimes(1);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  test('navigates to validation on continue', async () => {
    setMockDiscoveryState({ selectedCount: 2 });
    const convertedRecipes = [{ title: 'Recipe 1' }];
    mockParseSelectedRecipes.mockResolvedValue(convertedRecipes);

    const { getByTestId } = render(<BulkImportDiscovery />);

    fireEvent.press(getByTestId('BulkImportDiscovery::ContinueButton'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('BulkImportValidation', {
        providerId: 'hellofresh',
        selectedRecipes: convertedRecipes,
      });
    });
  });

  test('does not navigate when parseSelectedRecipes returns null', async () => {
    setMockDiscoveryState({ selectedCount: 2 });
    mockParseSelectedRecipes.mockResolvedValue(null);

    const { getByTestId } = render(<BulkImportDiscovery />);

    fireEvent.press(getByTestId('BulkImportDiscovery::ContinueButton'));

    await waitFor(() => {
      expect(mockParseSelectedRecipes).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('shows error message when error exists', () => {
    setMockDiscoveryState({ error: 'Network error' });
    const { getByText } = render(<BulkImportDiscovery />);

    expect(getByText('Network error')).toBeTruthy();
  });
});
