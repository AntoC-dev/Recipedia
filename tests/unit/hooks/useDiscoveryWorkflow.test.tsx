import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useDiscoveryWorkflow } from '@hooks/useDiscoveryWorkflow';
import {
  ConvertedImportRecipe,
  DiscoveredRecipe,
  DiscoveryProgress,
  ParsingProgress,
  RecipeProvider,
} from '@customTypes/BulkImportTypes';
import { ingredientType } from '@customTypes/DatabaseElementTypes';

const createMockDiscoveredRecipe = (id: number): DiscoveredRecipe => ({
  url: `https://example.com/recipe-${id}`,
  title: `Recipe ${id}`,
  imageUrl: `https://example.com/image-${id}.jpg`,
});

const createMockParsedRecipe = (id: number) => ({
  url: `https://example.com/recipe-${id}`,
  title: `Recipe ${id}`,
  description: `Description ${id}`,
  localImageUri: `/local/image-${id}.jpg`,
  persons: 4,
  time: 30,
  ingredients: [
    {
      id: 1,
      name: 'Ingredient',
      unit: 'g',
      quantity: '100',
      type: ingredientType.vegetable,
      season: [],
    },
  ],
  tags: [{ id: 1, name: 'Tag' }],
  preparation: [{ title: '', description: 'Step 1' }],
});

const createMockProvider = (options?: {
  discoveryError?: Error;
  parsingError?: Error;
  recipes?: DiscoveredRecipe[];
  parsedRecipes?: ReturnType<typeof createMockParsedRecipe>[];
}): RecipeProvider => ({
  id: 'mock',
  name: 'Mock Provider',
  logoUrl: 'https://example.com/logo.png',
  getBaseUrl: jest.fn().mockResolvedValue('https://example.com'),
  discoverRecipeUrls: jest.fn(async function* ({ signal, onImageLoaded }) {
    if (options?.discoveryError) {
      throw options.discoveryError;
    }
    const recipes = options?.recipes ?? [
      createMockDiscoveredRecipe(1),
      createMockDiscoveredRecipe(2),
    ];

    yield {
      phase: 'discovering',
      recipesFound: 0,
      categoriesScanned: 0,
      totalCategories: 1,
      isComplete: false,
      recipes: [],
    } as DiscoveryProgress;

    if (signal?.aborted) {
      yield {
        phase: 'complete',
        recipesFound: 0,
        categoriesScanned: 1,
        totalCategories: 1,
        isComplete: true,
        recipes: [],
      } as DiscoveryProgress;
      return;
    }

    yield {
      phase: 'complete',
      recipesFound: recipes.length,
      categoriesScanned: 1,
      totalCategories: 1,
      isComplete: true,
      recipes,
    } as DiscoveryProgress;
  }),
  parseSelectedRecipes: jest.fn(async function* (selectedRecipes, { signal }) {
    if (options?.parsingError) {
      throw options.parsingError;
    }

    const parsedRecipes =
      options?.parsedRecipes ?? selectedRecipes.map((_, i) => createMockParsedRecipe(i + 1));

    yield {
      phase: 'parsing',
      current: 0,
      total: selectedRecipes.length,
      parsedRecipes: [],
      failedRecipes: [],
    } as ParsingProgress;

    if (signal?.aborted) {
      yield {
        phase: 'complete',
        current: selectedRecipes.length,
        total: selectedRecipes.length,
        parsedRecipes: [],
        failedRecipes: [],
      } as ParsingProgress;
      return;
    }

    yield {
      phase: 'complete',
      current: selectedRecipes.length,
      total: selectedRecipes.length,
      parsedRecipes,
      failedRecipes: [],
    } as ParsingProgress;
  }),
  fetchRecipe: jest.fn().mockResolvedValue({
    url: 'https://example.com/recipe',
    converted: {} as ConvertedImportRecipe,
  }),
});

describe('useDiscoveryWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('starts in discovering phase with provider', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      expect(result.current.phase).toBe('discovering');
      expect(result.current.isDiscovering).toBe(true);
    });

    it('sets error and selecting phase when provider is undefined', async () => {
      const { result } = renderHook(() => useDiscoveryWorkflow(undefined, 4));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      expect(result.current.error).toBeTruthy();
    });

    it('transitions to selecting phase after discovery completes', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });
    });

    it('populates recipes after discovery', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });

      expect(result.current.recipes).toHaveLength(2);
    });
  });

  describe('selection', () => {
    it('selectRecipe adds URL to selection', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      act(() => {
        result.current.selectRecipe('https://example.com/recipe-1');
      });

      expect(result.current.isSelected('https://example.com/recipe-1')).toBe(true);
      expect(result.current.selectedCount).toBe(1);
    });

    it('unselectRecipe removes URL from selection', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      act(() => {
        result.current.selectRecipe('https://example.com/recipe-1');
      });

      act(() => {
        result.current.unselectRecipe('https://example.com/recipe-1');
      });

      expect(result.current.isSelected('https://example.com/recipe-1')).toBe(false);
      expect(result.current.selectedCount).toBe(0);
    });

    it('toggleSelectAll selects all when none selected', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleSelectAll();
      });

      expect(result.current.selectedCount).toBe(2);
      expect(result.current.allSelected).toBe(true);
    });

    it('toggleSelectAll deselects all when all selected', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleSelectAll();
      });

      act(() => {
        result.current.toggleSelectAll();
      });

      expect(result.current.selectedCount).toBe(0);
      expect(result.current.allSelected).toBe(false);
    });

    it('isSelected returns correct state', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      expect(result.current.isSelected('https://example.com/recipe-1')).toBe(false);

      act(() => {
        result.current.selectRecipe('https://example.com/recipe-1');
      });

      expect(result.current.isSelected('https://example.com/recipe-1')).toBe(true);
    });
  });

  describe('parseSelectedRecipes', () => {
    it('returns null when no recipes selected', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      let parseResult: ConvertedImportRecipe[] | null = null;

      await act(async () => {
        parseResult = await result.current.parseSelectedRecipes();
      });

      expect(parseResult).toBeNull();
    });

    it('returns converted recipes after successful parsing', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.selectRecipe('https://example.com/recipe-1');
      });

      let parseResult: ConvertedImportRecipe[] | null = null;

      await act(async () => {
        parseResult = await result.current.parseSelectedRecipes();
      });

      expect(parseResult).toBeTruthy();
      expect(parseResult!.length).toBe(1);
      expect(parseResult![0].title).toBe('Recipe 1');
    });

    it('updates parsingProgress during parsing', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.selectRecipe('https://example.com/recipe-1');
      });

      await act(async () => {
        await result.current.parseSelectedRecipes();
      });

      expect(result.current.parsingProgress).toBeTruthy();
      expect(result.current.parsingProgress?.phase).toBe('complete');
    });
  });

  describe('abort', () => {
    it('aborts cleanup on unmount', async () => {
      const provider = createMockProvider();
      const { unmount } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      unmount();
    });
  });

  describe('error handling', () => {
    it('sets error on discovery failure', async () => {
      const provider = createMockProvider({
        discoveryError: new Error('Discovery failed'),
      });

      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      expect(result.current.error).toBe('Discovery failed');
    });
  });

  describe('recipesWithImages', () => {
    it('merges image map with recipes', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.recipesWithImages.length).toBeGreaterThan(0);
      });

      expect(result.current.recipesWithImages[0].imageUrl).toBeDefined();
    });
  });

  describe('showSelectionUI', () => {
    it('is true during discovering phase', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      expect(result.current.showSelectionUI).toBe(true);
    });

    it('is true during selecting phase', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 4));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      expect(result.current.showSelectionUI).toBe(true);
    });
  });
});
