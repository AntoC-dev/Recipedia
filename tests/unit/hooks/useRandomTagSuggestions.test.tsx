import { renderHook } from '@testing-library/react-native';
import { mockSearchRandomlyTags, setMockTags, resetUseTagsMocks } from '@mocks/hooks/useTags-mock';
import { tagTableElement } from '@customTypes/DatabaseElementTypes';

import {
  useRandomTagSuggestions,
  RANDOM_TAG_SUGGESTIONS_TTL_MS,
  __resetRandomTagSuggestionsCache,
} from '@hooks/useRandomTagSuggestions';

jest.mock('@hooks/useTags', () => ({
  useTags: require('@mocks/hooks/useTags-mock').useTagsMock,
}));

function makeTag(id: number, name: string): tagTableElement {
  return { id, name };
}

describe('useRandomTagSuggestions', () => {
  beforeEach(() => {
    resetUseTagsMocks();
    __resetRandomTagSuggestionsCache();
    setMockTags([]);
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('reads from DB on first call and exposes the resolved names', () => {
    mockSearchRandomlyTags.mockReturnValueOnce([
      makeTag(1, 'Italian'),
      makeTag(2, 'Dessert'),
      makeTag(3, 'Quick'),
    ]);

    const { result } = renderHook(() => useRandomTagSuggestions());

    expect(mockSearchRandomlyTags).toHaveBeenCalledTimes(1);
    expect(mockSearchRandomlyTags).toHaveBeenCalledWith(3);
    expect(result.current).toEqual(['Italian', 'Dessert', 'Quick']);
  });

  test('reuses the cached names on the next call within the TTL window', () => {
    mockSearchRandomlyTags.mockReturnValueOnce([makeTag(1, 'Italian'), makeTag(2, 'Dessert')]);

    const first = renderHook(() => useRandomTagSuggestions());
    expect(first.result.current).toEqual(['Italian', 'Dessert']);
    expect(mockSearchRandomlyTags).toHaveBeenCalledTimes(1);

    (Date.now as jest.Mock).mockReturnValue(1_000_000 + RANDOM_TAG_SUGGESTIONS_TTL_MS - 1);
    mockSearchRandomlyTags.mockReturnValueOnce([makeTag(9, 'Different')]);

    const second = renderHook(() => useRandomTagSuggestions());
    expect(second.result.current).toEqual(['Italian', 'Dessert']);
    expect(mockSearchRandomlyTags).toHaveBeenCalledTimes(1);
  });

  test('refetches from DB after the TTL window elapses', () => {
    mockSearchRandomlyTags.mockReturnValueOnce([makeTag(1, 'Italian'), makeTag(2, 'Dessert')]);

    const first = renderHook(() => useRandomTagSuggestions());
    expect(first.result.current).toEqual(['Italian', 'Dessert']);
    expect(mockSearchRandomlyTags).toHaveBeenCalledTimes(1);

    (Date.now as jest.Mock).mockReturnValue(1_000_000 + RANDOM_TAG_SUGGESTIONS_TTL_MS + 1);
    mockSearchRandomlyTags.mockReturnValueOnce([makeTag(9, 'Fresh'), makeTag(10, 'Pick')]);

    const second = renderHook(() => useRandomTagSuggestions());
    expect(second.result.current).toEqual(['Fresh', 'Pick']);
    expect(mockSearchRandomlyTags).toHaveBeenCalledTimes(2);
  });

  test('refetches when elapsed time equals exactly the TTL boundary', () => {
    mockSearchRandomlyTags.mockReturnValueOnce([makeTag(1, 'Italian')]);

    renderHook(() => useRandomTagSuggestions());
    expect(mockSearchRandomlyTags).toHaveBeenCalledTimes(1);

    (Date.now as jest.Mock).mockReturnValue(1_000_000 + RANDOM_TAG_SUGGESTIONS_TTL_MS);
    mockSearchRandomlyTags.mockReturnValueOnce([makeTag(9, 'Boundary')]);

    const second = renderHook(() => useRandomTagSuggestions());
    expect(second.result.current).toEqual(['Boundary']);
    expect(mockSearchRandomlyTags).toHaveBeenCalledTimes(2);
  });

  test('returns empty array when DB yields no tags', () => {
    mockSearchRandomlyTags.mockReturnValueOnce([]);

    const { result } = renderHook(() => useRandomTagSuggestions());

    expect(mockSearchRandomlyTags).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual([]);
  });

  test('caches an empty result and reuses it within the TTL', () => {
    mockSearchRandomlyTags.mockReturnValueOnce([]);

    renderHook(() => useRandomTagSuggestions());
    expect(mockSearchRandomlyTags).toHaveBeenCalledTimes(1);

    (Date.now as jest.Mock).mockReturnValue(1_000_000 + RANDOM_TAG_SUGGESTIONS_TTL_MS - 1);
    mockSearchRandomlyTags.mockReturnValueOnce([makeTag(1, 'ShouldNotAppear')]);

    const second = renderHook(() => useRandomTagSuggestions());
    expect(second.result.current).toEqual([]);
    expect(mockSearchRandomlyTags).toHaveBeenCalledTimes(1);
  });
});
