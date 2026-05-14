import { tagTableElement } from '@customTypes/DatabaseElementTypes';
import {
  buildItemIndex,
  DetailedSearchResult,
  searchItems,
  searchItemsDetailed,
} from '@utils/FuzzyIndex';

const buildTagIndex = () => buildItemIndex(mockTags, { fuzzy: 0.2, getName: t => t.name });

export const mockFindSimilarTags = jest.fn<tagTableElement[], [string]>((name: string) =>
  searchItems(buildTagIndex(), name)
);
export const mockFindSimilarTagsDetailed = jest.fn<DetailedSearchResult<tagTableElement>, [string]>(
  (name: string) => searchItemsDetailed(buildTagIndex(), name)
);
export const mockAddTag = jest.fn(async (tag: unknown) => tag);
export const mockEditTag = jest.fn(async () => true);
export const mockDeleteTag = jest.fn(async () => true);
export const mockSearchRandomlyTags = jest.fn<tagTableElement[], [number]>(() => []);
export const mockGetRandomTags = jest.fn<tagTableElement[], [number]>(() => []);
export const mockAddMultipleTags = jest.fn(async () => {});

export let mockTags: tagTableElement[] = [];

export function setMockTags(tags: tagTableElement[]) {
  mockTags = tags;
}

export function resetUseTagsMocks() {
  mockTags = [];
  mockFindSimilarTags
    .mockReset()
    .mockImplementation((name: string) => searchItems(buildTagIndex(), name));
  mockFindSimilarTagsDetailed
    .mockReset()
    .mockImplementation((name: string) => searchItemsDetailed(buildTagIndex(), name));
  mockAddTag.mockReset().mockImplementation(async (tag: unknown) => tag);
  mockEditTag.mockReset().mockResolvedValue(true);
  mockDeleteTag.mockReset().mockResolvedValue(true);
  mockSearchRandomlyTags.mockReset().mockReturnValue([]);
  mockGetRandomTags.mockReset().mockReturnValue([]);
  mockAddMultipleTags.mockReset().mockResolvedValue(undefined);
}

export function useTagsMock() {
  return {
    tags: mockTags,
    findSimilarTags: mockFindSimilarTags,
    findSimilarTagsDetailed: mockFindSimilarTagsDetailed,
    addTag: mockAddTag,
    editTag: mockEditTag,
    deleteTag: mockDeleteTag,
    searchRandomlyTags: mockSearchRandomlyTags,
    getRandomTags: mockGetRandomTags,
    addMultipleTags: mockAddMultipleTags,
  };
}
