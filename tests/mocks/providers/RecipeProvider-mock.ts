import { RecipeProvider } from '@customTypes/BulkImportTypes';

export function createMockRecipeProvider(
  extractImageFromHtml: (html: string) => string | null = () => null
): RecipeProvider {
  return {
    id: 'test-provider',
    name: 'Test Provider',
    extractImageFromHtml: jest.fn(extractImageFromHtml),
  } as unknown as RecipeProvider;
}
