/**
 * ProviderRegistry - Registry for recipe import providers
 *
 * Manages the available recipe providers and provides lookup functions.
 *
 * @module providers/ProviderRegistry
 */

import { RecipeProvider } from '@customTypes/BulkImportTypes';
import { HelloFreshProvider } from './HelloFreshProvider';
import { QuitoqueProvider } from './QuitoqueProvider';

/** Internal registry mapping provider IDs to their instances */
const providerRegistry: Map<string, RecipeProvider> = new Map();

/** Register all available providers */
providerRegistry.set('hellofresh', new HelloFreshProvider());
providerRegistry.set('quitoque', new QuitoqueProvider());

/**
 * Gets a provider by its unique identifier
 *
 * @param id - The provider's unique ID (e.g., 'hellofresh')
 * @returns The provider instance, or undefined if not found
 */
export function getProvider(id: string): RecipeProvider | undefined {
  return providerRegistry.get(id);
}

/**
 * Gets all available recipe providers for the given language
 *
 * @param language - The user's current language code (e.g., 'en', 'fr')
 * @returns Array of provider instances available for that language
 */
export function getAvailableProviders(language: string): RecipeProvider[] {
  return Array.from(providerRegistry.values()).filter(provider => {
    if (!provider.supportedLanguages) {
      return true;
    }
    return provider.supportedLanguages.includes(language);
  });
}

/**
 * Checks if a provider exists in the registry
 *
 * @param id - The provider's unique ID
 * @returns True if the provider is registered
 */
export function hasProvider(id: string): boolean {
  return providerRegistry.has(id);
}
