/**
 * ProviderRegistry - Registry for recipe import providers
 *
 * Manages the available recipe providers and provides lookup functions.
 *
 * @module providers/ProviderRegistry
 */

import { RecipeProvider } from '@customTypes/BulkImportTypes';
import { HelloFreshProvider } from './HelloFreshProvider';

/** Internal registry mapping provider IDs to their instances */
const providerRegistry: Map<string, RecipeProvider> = new Map();

/** Register all available providers */
providerRegistry.set('hellofresh', new HelloFreshProvider());

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
 * Gets all available recipe providers
 *
 * @returns Array of all registered provider instances
 */
export function getAvailableProviders(): RecipeProvider[] {
  return Array.from(providerRegistry.values());
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
