import { DiscoveredRecipe, DiscoveryProgress, ParsingProgress } from '@customTypes/BulkImportTypes';

export const mockFreshRecipes: DiscoveredRecipe[] = [
  {
    url: 'https://example.com/recipe-1',
    title: 'Recipe 1',
    imageUrl: 'https://example.com/img1.jpg',
    memoryStatus: 'fresh',
  },
  {
    url: 'https://example.com/recipe-2',
    title: 'Recipe 2',
    imageUrl: 'https://example.com/img2.jpg',
    memoryStatus: 'fresh',
  },
];

export const mockSeenRecipes: DiscoveredRecipe[] = [];

export const mockDiscoveredRecipes: DiscoveredRecipe[] = [...mockFreshRecipes, ...mockSeenRecipes];

export const mockDiscoveryProgress: DiscoveryProgress = {
  phase: 'discovering',
  recipesFound: 2,
  categoriesScanned: 1,
  totalCategories: 3,
  isComplete: false,
  recipes: mockDiscoveredRecipes,
};

export const mockParsingProgress: ParsingProgress = {
  phase: 'parsing',
  current: 1,
  total: 2,
  currentRecipeTitle: 'Recipe 1',
  parsedRecipes: [],
  failedRecipes: [],
};

export let mockPhase = 'selecting';
export let mockRecipes = mockDiscoveredRecipes;
export let mockFreshRecipesState = mockFreshRecipes;
export let mockSeenRecipesState = mockSeenRecipes;
export let mockSelectedCount = 0;
export let mockAllSelected = false;
export let mockIsDiscovering = false;
export let mockShowSelectionUI = true;
export let mockDiscoveryProgressState: DiscoveryProgress | null = null;
export let mockParsingProgressState: ParsingProgress | null = null;
export let mockError: string | null = null;

export const mockIsSelected = jest.fn().mockReturnValue(false);
export const mockSelectRecipe = jest.fn();
export const mockUnselectRecipe = jest.fn();
export const mockToggleSelectAll = jest.fn();
export const mockParseSelectedRecipes = jest.fn().mockResolvedValue([]);
export const mockAbort = jest.fn();

export function setMockDiscoveryState(state: {
  phase?: string;
  recipes?: DiscoveredRecipe[];
  freshRecipes?: DiscoveredRecipe[];
  seenRecipes?: DiscoveredRecipe[];
  selectedCount?: number;
  allSelected?: boolean;
  isDiscovering?: boolean;
  showSelectionUI?: boolean;
  discoveryProgress?: DiscoveryProgress | null;
  parsingProgress?: ParsingProgress | null;
  error?: string | null;
}) {
  if (state.phase !== undefined) mockPhase = state.phase;
  if (state.recipes !== undefined) mockRecipes = state.recipes;
  if (state.freshRecipes !== undefined) mockFreshRecipesState = state.freshRecipes;
  if (state.seenRecipes !== undefined) mockSeenRecipesState = state.seenRecipes;
  if (state.selectedCount !== undefined) mockSelectedCount = state.selectedCount;
  if (state.allSelected !== undefined) mockAllSelected = state.allSelected;
  if (state.isDiscovering !== undefined) mockIsDiscovering = state.isDiscovering;
  if (state.showSelectionUI !== undefined) mockShowSelectionUI = state.showSelectionUI;
  if (state.discoveryProgress !== undefined) mockDiscoveryProgressState = state.discoveryProgress;
  if (state.parsingProgress !== undefined) mockParsingProgressState = state.parsingProgress;
  if (state.error !== undefined) mockError = state.error;
}

export function resetMockDiscoveryState() {
  mockPhase = 'selecting';
  mockRecipes = mockDiscoveredRecipes;
  mockFreshRecipesState = mockFreshRecipes;
  mockSeenRecipesState = mockSeenRecipes;
  mockSelectedCount = 0;
  mockAllSelected = false;
  mockIsDiscovering = false;
  mockShowSelectionUI = true;
  mockDiscoveryProgressState = null;
  mockParsingProgressState = null;
  mockError = null;
  mockIsSelected.mockReturnValue(false);
  mockSelectRecipe.mockClear();
  mockUnselectRecipe.mockClear();
  mockToggleSelectAll.mockClear();
  mockParseSelectedRecipes.mockClear().mockResolvedValue([]);
  mockAbort.mockClear();
}

export const mockMarkUrlsAsSeen = jest.fn();

export function useDiscoveryWorkflowMock() {
  return {
    phase: mockPhase,
    recipes: mockRecipes,
    recipesWithImages: mockRecipes,
    freshRecipes: mockFreshRecipesState,
    seenRecipes: mockSeenRecipesState,
    selectedCount: mockSelectedCount,
    allSelected: mockAllSelected,
    isDiscovering: mockIsDiscovering,
    showSelectionUI: mockShowSelectionUI,
    discoveryProgress: mockDiscoveryProgressState,
    parsingProgress: mockParsingProgressState,
    error: mockError,
    isSelected: mockIsSelected,
    selectRecipe: mockSelectRecipe,
    unselectRecipe: mockUnselectRecipe,
    toggleSelectAll: mockToggleSelectAll,
    parseSelectedRecipes: mockParseSelectedRecipes,
    abort: mockAbort,
    markUrlsAsSeen: mockMarkUrlsAsSeen,
  };
}
