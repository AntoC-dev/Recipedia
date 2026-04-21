import { tagTableElement } from '@customTypes/DatabaseElementTypes';

export const mockFindSimilarTags = jest.fn<tagTableElement[], [string]>(() => []);
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
  mockFindSimilarTags.mockReset().mockReturnValue([]);
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
    addTag: mockAddTag,
    editTag: mockEditTag,
    deleteTag: mockDeleteTag,
    searchRandomlyTags: mockSearchRandomlyTags,
    getRandomTags: mockGetRandomTags,
    addMultipleTags: mockAddMultipleTags,
  };
}
