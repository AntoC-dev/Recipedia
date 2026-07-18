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
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';

jest.mock('@context/DefaultPersonsContext', () =>
  require('@mocks/context/DefaultPersonsContext-mock')
);

const mockOrchestratorParseSelectedRecipes = jest.fn();
const mockOrchestratorFetchRecipeImageUrl = jest.fn();

jest.mock('@utils/RecipeImportOrchestrator', () => ({
  parseSelectedRecipes: (...args: unknown[]) => mockOrchestratorParseSelectedRecipes(...args),
  fetchRecipeImageUrl: (...args: unknown[]) => mockOrchestratorFetchRecipeImageUrl(...args),
}));

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
  recipes?: DiscoveredRecipe[];
}): RecipeProvider => ({
  id: 'mock',
  name: 'Mock Provider',
  logoUrl: 'https://example.com/logo.png',
  getBaseUrl: jest.fn().mockResolvedValue('https://example.com'),
  discoverRecipeUrls: jest.fn(async function* ({ signal }) {
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
  extractImageFromHtml: jest.fn().mockReturnValue(null),
  canHandleUrl: jest.fn().mockReturnValue(false),
});

function setupDefaultParsingMock(options?: {
  parsingError?: Error;
  parsedRecipes?: ReturnType<typeof createMockParsedRecipe>[];
}) {
  mockOrchestratorParseSelectedRecipes.mockImplementation(async function* (
    _provider: RecipeProvider,
    selectedRecipes: DiscoveredRecipe[],
    opts?: { signal?: AbortSignal }
  ) {
    if (options?.parsingError) {
      throw options.parsingError;
    }

    const parsedRecipes =
      options?.parsedRecipes ??
      selectedRecipes.map((_: DiscoveredRecipe, i: number) => createMockParsedRecipe(i + 1));

    yield {
      phase: 'parsing',
      current: 0,
      total: selectedRecipes.length,
      parsedRecipes: [],
      failedRecipes: [],
    } as ParsingProgress;

    if (opts?.signal?.aborted) {
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
  });
}

describe('useDiscoveryWorkflow', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    jest.clearAllMocks();
    database = RecipeDatabase.getInstance();
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    setupDefaultParsingMock();
    mockOrchestratorFetchRecipeImageUrl.mockResolvedValue(null);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  describe('initialization', () => {
    it('starts in discovering phase with provider', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      expect(result.current.phase).toBe('discovering');
      expect(result.current.isDiscovering).toBe(true);
    });

    it('sets error and selecting phase when provider is undefined', async () => {
      const { result } = renderHook(() => useDiscoveryWorkflow(undefined, 'mock'));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      expect(result.current.error).toBeTruthy();
    });

    it('transitions to selecting phase after discovery completes', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });
    });

    it('populates recipes after discovery', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });

      expect(result.current.recipes).toHaveLength(2);
    });
  });

  describe('selection', () => {
    it('selectRecipe adds URL to selection', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

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
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

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
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

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
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

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
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

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
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

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
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

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
      expect(parseResult![0]!.title).toBe('Recipe 1');
      expect(result.current.phase).toBe('parsing');
    });

    it('updates parsingProgress during parsing', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

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
      const { unmount } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      unmount();
    });
  });

  describe('error handling', () => {
    it('sets error on discovery failure', async () => {
      const provider = createMockProvider({
        discoveryError: new Error('Discovery failed'),
      });

      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      expect(result.current.error).toBe('Discovery failed');
    });
  });

  describe('recipesWithImages', () => {
    it('merges image map with recipes', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipesWithImages.length).toBeGreaterThan(0);
      });

      expect(result.current.recipesWithImages[0]!.imageUrl).toBeDefined();
    });
  });

  describe('showSelectionUI', () => {
    it('is true during discovering phase', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      expect(result.current.showSelectionUI).toBe(true);
    });

    it('is true during selecting phase', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      expect(result.current.showSelectionUI).toBe(true);
    });

    it('is false during parsing phase', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.selectRecipe('https://example.com/recipe-1');
      });

      await act(async () => {
        await result.current.parseSelectedRecipes();
      });

      expect(result.current.phase).toBe('parsing');
      expect(result.current.showSelectionUI).toBe(false);
    });
  });

  describe('image loading', () => {
    it('uses imageMap parameter to populate recipesWithImages', async () => {
      const provider = createMockProvider();
      const imageMap = new Map<string, string>();
      imageMap.set('https://example.com/recipe-1', 'https://cdn.example.com/new-image.jpg');

      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock', imageMap));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      const recipe = result.current.recipesWithImages.find(
        r => r.url === 'https://example.com/recipe-1'
      );
      expect(recipe?.imageUrl).toBe('https://cdn.example.com/new-image.jpg');
    });
  });

  describe('continue during discovery', () => {
    it('does not revert phase to selecting when parseSelectedRecipes is called immediately after abort during discovery', async () => {
      let resumeDiscovery!: () => void;
      const discoveryPause = new Promise<void>(resolve => {
        resumeDiscovery = resolve;
      });

      mockOrchestratorParseSelectedRecipes.mockImplementation(async function* (
        _provider: RecipeProvider,
        selectedRecipes: DiscoveredRecipe[]
      ) {
        yield {
          phase: 'complete',
          current: selectedRecipes.length,
          total: selectedRecipes.length,
          parsedRecipes: selectedRecipes.map((_: DiscoveredRecipe, i: number) =>
            createMockParsedRecipe(i + 1)
          ),
          failedRecipes: [],
        } as ParsingProgress;
      });

      const provider: RecipeProvider = {
        id: 'mock',
        name: 'Mock Provider',
        logoUrl: 'https://example.com/logo.png',
        getBaseUrl: jest.fn().mockResolvedValue('https://example.com'),
        discoverRecipeUrls: jest.fn(async function* () {
          yield {
            phase: 'discovering',
            recipesFound: 1,
            categoriesScanned: 0,
            totalCategories: 1,
            isComplete: false,
            recipes: [createMockDiscoveredRecipe(1)],
          } as DiscoveryProgress;

          await discoveryPause;

          yield {
            phase: 'complete',
            recipesFound: 1,
            categoriesScanned: 1,
            totalCategories: 1,
            isComplete: true,
            recipes: [createMockDiscoveredRecipe(1)],
          } as DiscoveryProgress;
        }),
        extractImageFromHtml: jest.fn().mockReturnValue(null),
        canHandleUrl: jest.fn().mockReturnValue(false),
      };

      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.isDiscovering).toBe(true);
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.selectRecipe('https://example.com/recipe-1');
      });

      let parseResult: ConvertedImportRecipe[] | null = null;

      await act(async () => {
        result.current.abort();
        const parsePromise = result.current.parseSelectedRecipes();
        resumeDiscovery();
        parseResult = await parsePromise;
      });

      expect(parseResult).not.toBeNull();
      expect(result.current.phase).toBe('parsing');
    });

    it('does not nullify parsing abort controller when discovery finally block runs after parseSelectedRecipes starts', async () => {
      let resumeDiscovery!: () => void;
      const discoveryPause = new Promise<void>(resolve => {
        resumeDiscovery = resolve;
      });

      let resumeParsing!: () => void;
      const parsingPause = new Promise<void>(resolve => {
        resumeParsing = resolve;
      });

      mockOrchestratorParseSelectedRecipes.mockImplementation(async function* (
        _provider: RecipeProvider,
        selectedRecipes: DiscoveredRecipe[],
        opts?: { signal?: AbortSignal }
      ) {
        yield {
          phase: 'parsing',
          current: 0,
          total: selectedRecipes.length,
          parsedRecipes: [],
          failedRecipes: [],
        } as ParsingProgress;

        await parsingPause;

        if (opts?.signal?.aborted) {
          return;
        }

        yield {
          phase: 'complete',
          current: selectedRecipes.length,
          total: selectedRecipes.length,
          parsedRecipes: selectedRecipes.map((_: DiscoveredRecipe, i: number) =>
            createMockParsedRecipe(i + 1)
          ),
          failedRecipes: [],
        } as ParsingProgress;
      });

      const provider: RecipeProvider = {
        id: 'mock',
        name: 'Mock Provider',
        logoUrl: 'https://example.com/logo.png',
        getBaseUrl: jest.fn().mockResolvedValue('https://example.com'),
        discoverRecipeUrls: jest.fn(async function* () {
          yield {
            phase: 'discovering',
            recipesFound: 1,
            categoriesScanned: 0,
            totalCategories: 1,
            isComplete: false,
            recipes: [createMockDiscoveredRecipe(1)],
          } as DiscoveryProgress;

          await discoveryPause;

          yield {
            phase: 'complete',
            recipesFound: 1,
            categoriesScanned: 1,
            totalCategories: 1,
            isComplete: true,
            recipes: [createMockDiscoveredRecipe(1)],
          } as DiscoveryProgress;
        }),
        extractImageFromHtml: jest.fn().mockReturnValue(null),
        canHandleUrl: jest.fn().mockReturnValue(false),
      };

      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.isDiscovering).toBe(true);
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.selectRecipe('https://example.com/recipe-1');
      });

      let parsePromise!: Promise<ConvertedImportRecipe[] | null>;

      act(() => {
        result.current.abort();
        parsePromise = result.current.parseSelectedRecipes();
      });

      await act(async () => {
        resumeDiscovery();
      });

      act(() => {
        result.current.abort();
      });

      let parseResult: ConvertedImportRecipe[] | null = null;
      await act(async () => {
        resumeParsing();
        parseResult = await parsePromise;
      });

      expect(parseResult).toBeNull();
    });
  });

  describe('abort functionality', () => {
    it('aborts when abort function is called', async () => {
      let abortSignal: AbortSignal | null = null;

      const provider: RecipeProvider = {
        id: 'mock',
        name: 'Mock Provider',
        logoUrl: 'https://example.com/logo.png',
        getBaseUrl: jest.fn().mockResolvedValue('https://example.com'),
        discoverRecipeUrls: jest.fn(async function* ({ signal }) {
          abortSignal = signal ?? null;
          yield {
            phase: 'discovering',
            recipesFound: 0,
            categoriesScanned: 0,
            totalCategories: 1,
            isComplete: false,
            recipes: [],
          } as DiscoveryProgress;

          await new Promise(resolve => setTimeout(resolve, 100));

          yield {
            phase: 'complete',
            recipesFound: 0,
            categoriesScanned: 1,
            totalCategories: 1,
            isComplete: true,
            recipes: [],
          } as DiscoveryProgress;
        }),
        extractImageFromHtml: jest.fn().mockReturnValue(null),
        canHandleUrl: jest.fn().mockReturnValue(false),
      };

      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(abortSignal).not.toBeNull();
      });

      act(() => {
        result.current.abort();
      });

      expect(abortSignal!.aborted).toBe(true);
    });

    it('abort called during parsing actually aborts the parsing operation', async () => {
      let resumeParsing!: () => void;
      const parsingPause = new Promise<void>(resolve => {
        resumeParsing = resolve;
      });

      mockOrchestratorParseSelectedRecipes.mockImplementation(async function* (
        _provider: RecipeProvider,
        selectedRecipes: DiscoveredRecipe[],
        opts?: { signal?: AbortSignal }
      ) {
        yield {
          phase: 'parsing',
          current: 0,
          total: selectedRecipes.length,
          parsedRecipes: [],
          failedRecipes: [],
        } as ParsingProgress;

        await parsingPause;

        if (opts?.signal?.aborted) {
          return;
        }

        yield {
          phase: 'complete',
          current: selectedRecipes.length,
          total: selectedRecipes.length,
          parsedRecipes: selectedRecipes.map((_: DiscoveredRecipe, i: number) =>
            createMockParsedRecipe(i + 1)
          ),
          failedRecipes: [],
        } as ParsingProgress;
      });

      const provider: RecipeProvider = {
        id: 'mock',
        name: 'Mock Provider',
        logoUrl: 'https://example.com/logo.png',
        getBaseUrl: jest.fn().mockResolvedValue('https://example.com'),
        discoverRecipeUrls: jest.fn(async function* () {
          yield {
            phase: 'complete',
            recipesFound: 1,
            categoriesScanned: 1,
            totalCategories: 1,
            isComplete: true,
            recipes: [createMockDiscoveredRecipe(1)],
          } as DiscoveryProgress;
        }),
        extractImageFromHtml: jest.fn().mockReturnValue(null),
        canHandleUrl: jest.fn().mockReturnValue(false),
      };

      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.selectRecipe('https://example.com/recipe-1');
      });

      let parsePromise!: Promise<ConvertedImportRecipe[] | null>;
      act(() => {
        parsePromise = result.current.parseSelectedRecipes();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('parsing');
      });

      act(() => {
        result.current.abort();
      });

      let parseResult: ConvertedImportRecipe[] | null = null;
      await act(async () => {
        resumeParsing();
        parseResult = await parsePromise;
      });

      expect(parseResult).toBeNull();
    });

    it('handles AbortError during discovery gracefully', async () => {
      const provider: RecipeProvider = {
        id: 'mock',
        name: 'Mock Provider',
        logoUrl: 'https://example.com/logo.png',
        getBaseUrl: jest.fn().mockResolvedValue('https://example.com'),
        // eslint-disable-next-line require-yield
        discoverRecipeUrls: jest.fn(async function* () {
          const abortError = new Error('Aborted');
          abortError.name = 'AbortError';
          throw abortError;
        }),
        extractImageFromHtml: jest.fn().mockReturnValue(null),
        canHandleUrl: jest.fn().mockReturnValue(false),
      };

      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('markUrlsAsSeen', () => {
    it('persists URLs to database as seen', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.markUrlsAsSeen();
      });

      const seenUrls = database.getSeenUrls('mock');
      expect(seenUrls.has('https://example.com/recipe-1')).toBe(true);
      expect(seenUrls.has('https://example.com/recipe-2')).toBe(true);
    });
  });

  describe('parsing edge cases', () => {
    it('returns null and sets error when no recipes are parsed', async () => {
      mockOrchestratorParseSelectedRecipes.mockImplementation(async function* () {
        yield {
          phase: 'complete' as const,
          current: 1,
          total: 1,
          parsedRecipes: [],
          failedRecipes: [
            {
              url: 'https://example.com/recipe-1',
              title: 'Recipe 1',
              error: 'Parse failed',
            },
          ],
        };
      });

      const provider: RecipeProvider = {
        id: 'mock',
        name: 'Mock Provider',
        logoUrl: 'https://example.com/logo.png',
        getBaseUrl: jest.fn().mockResolvedValue('https://example.com'),
        discoverRecipeUrls: jest.fn(async function* () {
          yield {
            phase: 'complete',
            recipesFound: 1,
            categoriesScanned: 1,
            totalCategories: 1,
            isComplete: true,
            recipes: [createMockDiscoveredRecipe(1)],
          } as DiscoveryProgress;
        }),
        extractImageFromHtml: jest.fn().mockReturnValue(null),
        canHandleUrl: jest.fn().mockReturnValue(false),
      };

      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      act(() => {
        result.current.selectRecipe('https://example.com/recipe-1');
      });

      let parseResult: ConvertedImportRecipe[] | null = null;

      await act(async () => {
        parseResult = await result.current.parseSelectedRecipes();
      });

      expect(parseResult).toBeNull();
      expect(result.current.error).toBeTruthy();
      expect(result.current.phase).toBe('selecting');
    });

    it('sets error on parsing failure', async () => {
      setupDefaultParsingMock({ parsingError: new Error('Parsing failed') });

      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

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

      expect(parseResult).toBeNull();
      expect(result.current.error).toBe('Parsing failed');
      expect(result.current.phase).toBe('selecting');
    });

    it('handles AbortError during parsing gracefully', async () => {
      mockOrchestratorParseSelectedRecipes.mockImplementation(
        // eslint-disable-next-line require-yield
        async function* () {
          const abortError = new Error('Aborted');
          abortError.name = 'AbortError';
          throw abortError;
        }
      );

      const provider: RecipeProvider = {
        id: 'mock',
        name: 'Mock Provider',
        logoUrl: 'https://example.com/logo.png',
        getBaseUrl: jest.fn().mockResolvedValue('https://example.com'),
        discoverRecipeUrls: jest.fn(async function* () {
          yield {
            phase: 'complete',
            recipesFound: 1,
            categoriesScanned: 1,
            totalCategories: 1,
            isComplete: true,
            recipes: [createMockDiscoveredRecipe(1)],
          } as DiscoveryProgress;
        }),
        extractImageFromHtml: jest.fn().mockReturnValue(null),
        canHandleUrl: jest.fn().mockReturnValue(false),
      };

      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      act(() => {
        result.current.selectRecipe('https://example.com/recipe-1');
      });

      let parseResult: ConvertedImportRecipe[] | null = null;

      await act(async () => {
        parseResult = await result.current.parseSelectedRecipes();
      });

      expect(parseResult).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.phase).toBe('selecting');
    });

    it('returns null when provider is undefined during parsing', async () => {
      const { result } = renderHook(() => useDiscoveryWorkflow(undefined, 'mock'));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      let parseResult: ConvertedImportRecipe[] | null = null;

      await act(async () => {
        parseResult = await result.current.parseSelectedRecipes();
      });

      expect(parseResult).toBeNull();
    });

    it('correctly converts parsed recipe fields', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

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

      expect(parseResult).not.toBeNull();
      expect(parseResult![0]).toMatchObject({
        title: 'Recipe 1',
        description: 'Description 1',
        imageUrl: '/local/image-1.jpg',
        persons: 4,
        time: 30,
        sourceUrl: 'https://example.com/recipe-1',
        sourceProvider: 'mock',
      });
    });
  });

  describe('fresh and seen recipe separation', () => {
    it('returns empty arrays when no recipes', async () => {
      const provider = createMockProvider({ recipes: [] });
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      expect(result.current.freshRecipes).toEqual([]);
      expect(result.current.seenRecipes).toEqual([]);
    });

    it('allSelected is false when no visible recipes', async () => {
      const provider = createMockProvider({ recipes: [] });
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.phase).toBe('selecting');
      });

      expect(result.current.allSelected).toBe(false);
    });
  });

  describe('dismiss recipe', () => {
    it('dismissRecipe keeps the recipe visible and flags it', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(2);
      });

      const target = result.current.recipes[0]!;
      act(() => {
        result.current.dismissRecipe(target);
      });

      expect(result.current.recipes).toHaveLength(2);
      expect(result.current.isDismissed(target.url)).toBe(true);
    });

    it('dismissRecipe does not persist until committed', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(2);
      });

      act(() => {
        result.current.dismissRecipe(result.current.recipes[0]!);
      });

      expect(database.getDismissedUrls('mock').has('https://example.com/recipe-1')).toBe(false);
    });

    it('dismissRecipe clears the recipe from the selection', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(2);
      });

      act(() => {
        result.current.selectRecipe('https://example.com/recipe-1');
      });
      expect(result.current.selectedCount).toBe(1);

      act(() => {
        result.current.dismissRecipe(result.current.recipes[0]!);
      });

      expect(result.current.selectedCount).toBe(0);
    });

    it('restoreRecipe clears the pending dismissal flag', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(2);
      });

      const target = result.current.recipes[0]!;
      act(() => {
        result.current.dismissRecipe(target);
      });
      expect(result.current.isDismissed(target.url)).toBe(true);

      act(() => {
        result.current.restoreRecipe(target);
      });

      expect(result.current.isDismissed(target.url)).toBe(false);
    });

    it('commitDismissals persists every pending dismissal', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(2);
      });

      act(() => {
        result.current.dismissRecipe(result.current.recipes[0]!);
      });

      await act(async () => {
        await result.current.commitDismissals();
      });

      expect(database.getDismissedUrls('mock').has('https://example.com/recipe-1')).toBe(true);
    });

    it('commitDismissals persists the imageUrl of the recipe passed to dismissRecipe', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(2);
      });

      const enrichedRecipe = {
        ...result.current.recipes[0]!,
        imageUrl: 'https://example.com/lazily-loaded.jpg',
      };
      act(() => {
        result.current.dismissRecipe(enrichedRecipe);
      });

      await act(async () => {
        await result.current.commitDismissals();
      });

      const dismissed = database.getDismissedRecipes('mock');
      expect(dismissed[0]!.recipeUrl).toBe('https://example.com/recipe-1');
      expect(dismissed[0]!.imageUrl).toBe('https://example.com/lazily-loaded.jpg');
    });

    it('commitDismissals is a no-op when nothing is pending', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(2);
      });

      await act(async () => {
        await result.current.commitDismissals();
      });

      expect(database.getDismissedRecipes('mock')).toHaveLength(0);
    });

    it('toggleSelectAll ignores pending-dismissed recipes', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(2);
      });

      act(() => {
        result.current.dismissRecipe(result.current.recipes[0]!);
      });

      act(() => {
        result.current.toggleSelectAll();
      });

      expect(result.current.selectedCount).toBe(1);
      expect(result.current.isSelected('https://example.com/recipe-1')).toBe(false);
      expect(result.current.isSelected('https://example.com/recipe-2')).toBe(true);
    });

    it('allSelected is true when every selectable recipe is selected and one is dismissed', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(2);
      });

      act(() => {
        result.current.dismissRecipe(result.current.recipes[0]!);
      });

      act(() => {
        result.current.toggleSelectAll();
      });

      expect(result.current.allSelected).toBe(true);
    });

    it('toggleSelectAll selects nothing and allSelected stays false when every recipe is dismissed', async () => {
      const provider = createMockProvider();
      const { result } = renderHook(() => useDiscoveryWorkflow(provider, 'mock'));

      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(2);
      });

      act(() => {
        result.current.dismissRecipe(result.current.recipes[0]!);
        result.current.dismissRecipe(result.current.recipes[1]!);
      });

      act(() => {
        result.current.toggleSelectAll();
      });

      expect(result.current.selectedCount).toBe(0);
      expect(result.current.allSelected).toBe(false);
    });
  });
});
