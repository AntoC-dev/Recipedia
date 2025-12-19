import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { BulkImportDiscovery } from '@screens/BulkImportDiscovery';
import React from 'react';
import {
  mockGoBack,
  mockNavigate,
  resetMockRouteParams,
  setMockRouteParams,
} from '@mocks/deps/react-navigation-mock';
import {
  mockAbort,
  mockDiscoveryProgress,
  mockFreshRecipes,
  mockIsSelected,
  mockParseSelectedRecipes,
  mockParsingProgress,
  mockSelectRecipe,
  mockToggleSelectAll,
  mockUnselectRecipe,
  resetMockDiscoveryState,
  setMockDiscoveryState,
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

    expect(getByTestId('BulkImportDiscovery::fresh-0')).toBeTruthy();
    expect(getByTestId('BulkImportDiscovery::fresh-1')).toBeTruthy();
  });

  test('shows empty state when no recipes and selecting', () => {
    setMockDiscoveryState({ freshRecipes: [], seenRecipes: [] });
    const { getByText } = render(<BulkImportDiscovery />);

    expect(getByText('bulkImport.selection.noRecipesFound')).toBeTruthy();
  });

  test('shows loading indicator when discovering with no recipes', () => {
    setMockDiscoveryState({ phase: 'discovering', freshRecipes: [], seenRecipes: [] });
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

  test('calls selectRecipe when unselected recipe card pressed', () => {
    const { getByTestId } = render(<BulkImportDiscovery />);

    fireEvent.press(getByTestId('BulkImportDiscovery::fresh-0'));

    expect(mockSelectRecipe).toHaveBeenCalledWith('https://example.com/recipe-1');
  });

  test('calls unselectRecipe when selected recipe card pressed', () => {
    mockIsSelected.mockReturnValue(true);
    const { getByTestId } = render(<BulkImportDiscovery />);

    fireEvent.press(getByTestId('BulkImportDiscovery::fresh-0'));

    expect(mockUnselectRecipe).toHaveBeenCalledWith('https://example.com/recipe-1');
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

  describe('section headers', () => {
    test('shows fresh section header when fresh recipes exist', () => {
      const { getByTestId } = render(<BulkImportDiscovery />);

      expect(getByTestId('BulkImportDiscovery::fresh-header')).toBeTruthy();
    });

    test('shows seen section header when seen recipes exist', () => {
      setMockDiscoveryState({
        seenRecipes: [
          {
            url: 'https://example.com/seen-recipe',
            title: 'Seen Recipe',
            memoryStatus: 'seen',
          },
        ],
      });
      const { getByTestId } = render(<BulkImportDiscovery />);

      expect(getByTestId('BulkImportDiscovery::seen-header')).toBeTruthy();
    });

    test('does not show fresh header when no fresh recipes', () => {
      setMockDiscoveryState({
        freshRecipes: [],
        seenRecipes: [
          {
            url: 'https://example.com/seen-recipe',
            title: 'Seen Recipe',
            memoryStatus: 'seen',
          },
        ],
      });
      const { queryByTestId } = render(<BulkImportDiscovery />);

      expect(queryByTestId('BulkImportDiscovery::fresh-header')).toBeNull();
    });

    test('does not show seen header when no seen recipes', () => {
      const { queryByTestId } = render(<BulkImportDiscovery />);

      expect(queryByTestId('BulkImportDiscovery::seen-header')).toBeNull();
    });

    test('shows both sections when both fresh and seen recipes exist', () => {
      setMockDiscoveryState({
        freshRecipes: mockFreshRecipes,
        seenRecipes: [
          {
            url: 'https://example.com/seen-recipe',
            title: 'Seen Recipe',
            memoryStatus: 'seen',
          },
        ],
      });
      const { getByTestId } = render(<BulkImportDiscovery />);

      expect(getByTestId('BulkImportDiscovery::fresh-header')).toBeTruthy();
      expect(getByTestId('BulkImportDiscovery::seen-header')).toBeTruthy();
      expect(getByTestId('BulkImportDiscovery::fresh-0')).toBeTruthy();
      expect(getByTestId('BulkImportDiscovery::seen-0')).toBeTruthy();
    });
  });
});
