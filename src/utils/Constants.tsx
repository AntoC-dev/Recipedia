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
 * const recipeImage = testRecipesImages[0]; // spaghetti_bolognese.webp
 *
 * // Accessing production recipe images
 * const prodImage = productionRecipesImages[0]; // spaghetti_bolognaise.webp
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

/** Delay before auto-starting the tutorial, letting screens lay out first (ms) */
export const TUTORIAL_AUTO_START_DELAY = 300;

/**
 * Tutorial spotlight padding in pixels around each highlighted target
 * Applied by the SVG overlay to keep a consistent breathing space between
 * the spotlight edge and the highlighted element
 */
export const TUTORIAL_SPOTLIGHT_MARGIN = 8;

/**
 * Array of test recipe images used in development and testing
 * Contains require() statements for bundled image assets representing
 * a diverse collection of popular international recipes
 */
export const testRecipesImages = [
  require('../assets/images/spaghetti_bolognese.webp'),
  require('../assets/images/taco_shell.webp'),
  require('../assets/images/classic_pancakes.webp'),
  require('../assets/images/caesar_salad.webp'),
  require('../assets/images/margherita_pizza.webp'),
  require('../assets/images/vegetable_soup.webp'),
  require('../assets/images/chocolate_cake.webp'),
  require('../assets/images/pesto_pasta.webp'),
  require('../assets/images/sushi_rolls.webp'),
  require('../assets/images/lentil_curry.webp'),
];

/**
 * Array of production recipe images for the production dataset
 * Contains require() statements for bundled image assets representing
 * the curated production recipe collection
 */
export const productionRecipesImages = [
  require('../assets/images/spaghetti_bolognaise.webp'),
  require('../assets/images/soupe_legumes_hiver.webp'),
  require('../assets/images/curry_lentilles_corail.webp'),
  require('../assets/images/salade_cesar_poulet.webp'),
  require('../assets/images/risotto_champignons.webp'),
  require('../assets/images/tacos_poulet.webp'),
  require('../assets/images/quiche_lorraine.webp'),
  require('../assets/images/poelee_legumes_mediterraneens.webp'),
  require('../assets/images/saumon_grille_brocoli.webp'),
  require('../assets/images/butternut_rotie.webp'),
];
