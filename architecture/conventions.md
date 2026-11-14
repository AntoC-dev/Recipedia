# File naming

| Type              | Convention                           | Example                                           |
| ----------------- | ------------------------------------ | ------------------------------------------------- |
| React components  | PascalCase `.tsx`                    | `RecipeCard.tsx`                                  |
| Hooks             | camelCase, `use` prefix, `.ts`       | `useRecipeIngredients.ts`                         |
| Utilities         | PascalCase `.tsx` or `.ts`           | `RecipeDatabase.tsx`, `Quantity.ts`               |
| Context files     | PascalCase, `Context` suffix, `.tsx` | `RecipeDialogsContext.tsx`                        |
| Type files        | PascalCase, `Types` suffix, `.tsx`   | `DatabaseElementTypes.tsx`, `BulkImportTypes.tsx` |
| Schemas           | camelCase, `Schema` suffix, `.ts`    | `itemDialogSchema.ts`                             |
| Providers         | PascalCase, `Provider` suffix, `.ts` | `HelloFreshProvider.ts`                           |
| Test files        | Mirror source path, `.test.ts(x)`    | `tests/unit/utils/Quantity.test.ts`               |
| Translation files | Feature-scoped, camelCase, `.ts`     | `recipe.ts`, `bulkImport.ts`                      |

Screens: PascalCase `.tsx` in `src/screens/`, no subdirectories except recipe
screen components.
