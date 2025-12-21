/**
 * Constants - Application-wide constants and default values
 *
 * This module defines constant values used throughout the Recipedia app.
 * Includes default values for data initialization and asset references
 * for the initial recipe collection.
 *
 * Key Features:
 * - Default numeric values for form inputs and data initialization
 * - Initial recipe image assets for app demonstration
 * - Centralized constant management for easy maintenance
 * - Type-safe constant definitions
 *
 * Initial Recipe Collection:
 * - Curated set of popular international recipes
 * - High-quality recipe images for demonstration
 * - Diverse cuisine representation for user onboarding
 * - Pre-loaded content for immediate app functionality
 *
 * @example
 * ```typescript
 * import { defaultValueNumber, testRecipesImages, productionRecipesImages } from '@utils/Constants';
 *
 * // Using default values in forms
 * const [servings, setServings] = useState(defaultValueNumber);
 *
 * // Accessing test recipe images
 * const recipeImage = testRecipesImages[0]; // spaghetti_bolognese.png
 *
 * // Accessing production recipe images
 * const prodImage = productionRecipesImages[0]; // spaghetti_bolognaise.png
 * ```
 */

/** Default numeric value used for form inputs and data initialization */
export const defaultValueNumber = -1;

/** Interval between demo actions during tutorial (in milliseconds) */
export const TUTORIAL_DEMO_INTERVAL = 1500;

/** Tutorial step configuration by screen name */
export const TUTORIAL_STEPS = {
  Home: { order: 1, name: 'Home' },
  Search: { order: 2, name: 'Search' },
  Menu: { order: 3, name: 'Menu' },
  Shopping: { order: 4, name: 'Shopping' },
  Parameters: { order: 5, name: 'Parameters' },
} as const;

/**
 * Tutorial spotlight vertical offset in pixels
 * Applied to all tutorial steps for consistent positioning
 */
export const TUTORIAL_VERTICAL_OFFSET = 20;

/**
 * Array of test recipe images used in development and testing
 * Contains require() statements for bundled image assets representing
 * a diverse collection of popular international recipes
 */
export const testRecipesImages = [
  require('../assets/images/spaghetti_bolognese.png'),
  require('../assets/images/taco_shell.png'),
  require('../assets/images/classic_pancakes.png'),
  require('../assets/images/caesar_salad.png'),
  require('../assets/images/margherita_pizza.png'),
  require('../assets/images/vegetable_soup.png'),
  require('../assets/images/chocolate_cake.png'),
  require('../assets/images/pesto_pasta.png'),
  require('../assets/images/sushi_rolls.png'),
  require('../assets/images/lentil_curry.png'),
];

/**
 * Array of production recipe images for the production dataset
 * Contains require() statements for bundled image assets representing
 * the curated production recipe collection
 */
export const productionRecipesImages = [
  require('../assets/images/spaghetti_bolognaise.png'),
  require('../assets/images/soupe_legumes_hiver.png'),
  require('../assets/images/curry_lentilles_corail.png'),
  require('../assets/images/salade_cesar_poulet.png'),
  require('../assets/images/risotto_champignons.png'),
  require('../assets/images/tacos_poulet.png'),
  require('../assets/images/quiche_lorraine.png'),
  require('../assets/images/poelee_legumes_mediterraneens.png'),
  require('../assets/images/saumon_grille_brocoli.png'),
  require('../assets/images/butternut_rotie.png'),
];
