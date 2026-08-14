import RecipeDatabase from '@utils/RecipeDatabase';

/** Type string no `ingredientType` member holds, so decoding must reject it. */
export const CORRUPT_INGREDIENT_TYPE = 'not-a-real-type';

/**
 * Writes an unknown `TYPE` straight into an ingredient row, bypassing the
 * application layer, then reloads the ingredient cache so decoding sees it.
 *
 * Reaches through the database's private table handles on purpose: no public
 * API can produce a row this broken, which is the point of the decode guard.
 *
 * @param db - Database instance to corrupt
 * @param ingredientId - Row to give an unknown type
 */
export async function corruptIngredientType(
  db: RecipeDatabase,
  ingredientId: number
): Promise<void> {
  await db['_ingredientsTable'].editElementById(
    ingredientId,
    new Map([['TYPE', CORRUPT_INGREDIENT_TYPE]]),
    db['_dbConnection']
  );
  await db['getAllIngredients']();
}
