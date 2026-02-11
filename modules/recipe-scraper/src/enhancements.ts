/**
 * Recipe Scraper Enhancements Module
 *
 * This module contains custom enhancement functions that are applied after
 * base recipe parsing. These functions extract additional data from HTML
 * that the base parsers don't handle, and clean up the extracted data.
 *
 * Single source of truth for all platforms (Android, iOS, Web).
 * Ported from Python scraper.py for consistency across platforms.
 */

import {decode} from 'html-entities';

import type {
    ParsedIngredient,
    ParsedInstruction,
    ScrapedNutrients,
    ScrapedRecipe,
} from './types';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = {[key: string]: JsonValue};
type JsonArray = JsonValue[];

export interface EnhancementContext {
    html: string;
    baseResult: ScrapedRecipe;
}

/**
 * Decode HTML entities in a string, returning null if input is null.
 */
function decodeString(value: string | null): string | null {
    return value ? decode(value) : null;
}

/**
 * Decode HTML entities in each string of an array.
 */
function decodeStringArray(values: string[]): string[] {
    return values.map(v => decode(v));
}

/**
 * Apply all enhancements to a base recipe result.
 * This is the main entry point for post-processing scraped recipes.
 */
export function applyEnhancements(context: EnhancementContext): ScrapedRecipe {
    const {html, baseResult} = context;

    const decodedIngredients = decodeStringArray(baseResult.ingredients);
    const decodedTitle = decodeString(baseResult.title);
    const decodedDescription = decodeString(baseResult.description);
    const decodedInstructions = decodeString(baseResult.instructions);
    const decodedInstructionsList = baseResult.instructionsList
        ? decodeStringArray(baseResult.instructionsList)
        : null;

    const cleanedTitle = cleanTitle(decodedTitle);
    const cleanedDescription = cleanDescription(decodedDescription, decodedIngredients);

    const extractedKeywords = extractKeywordsFromNextData(html);
    const cleanedKeywords = cleanKeywords(
        extractedKeywords ?? baseResult.keywords,
        decodedIngredients,
        cleanedTitle
    );

    return {
        ...baseResult,
        title: cleanedTitle,
        description: cleanedDescription,
        ingredients: decodedIngredients,
        instructions: decodedInstructions,
        instructionsList: decodedInstructionsList,
        keywords: cleanedKeywords,
        parsedIngredients:
            baseResult.parsedIngredients ?? extractStructuredIngredients(html),
        parsedInstructions:
            baseResult.parsedInstructions ?? extractStructuredInstructions(html),
        nutrients: inferServingSizeFromHtml(html, baseResult.nutrients),
        image: baseResult.image ?? extractImageFromJsonLd(html),
    };
}

// ============================================================================
// Tag/Keyword Extraction Functions
// ============================================================================

/**
 * Extract keywords/tags from __NEXT_DATA__ script if available.
 * Many Next.js sites store recipe tags in this embedded JSON.
 */
export function extractKeywordsFromNextData(html: string): string[] | null {
    const regex =
        /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i;
    const match = regex.exec(html);
    if (!match || !match[1]) return null;

    try {
        const data = JSON.parse(match[1]);
        return findTagsInDict(data);
    } catch {
        return null;
    }
}

/**
 * Recursively search for tags/labels arrays in nested dict.
 * Looks for common field names: 'tags', 'labels'.
 * Handles both string arrays and objects with 'name' field.
 */
export function findTagsInDict(
    data: JsonValue,
    depth = 0
): string[] | null {
    if (depth > 10) return null;

    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        const obj = data as JsonObject;

        for (const key of ['tags', 'labels']) {
            if (Array.isArray(obj[key])) {
                const tags = obj[key] as JsonArray;
                const result: string[] = [];

                for (const tag of tags) {
                    if (!isUserFacingTag(tag)) continue;

                    if (typeof tag === 'string' && tag) {
                        result.push(tag);
                    } else if (
                        typeof tag === 'object' &&
                        tag !== null &&
                        !Array.isArray(tag)
                    ) {
                        const tagObj = tag as JsonObject;
                        if (typeof tagObj['name'] === 'string' && tagObj['name']) {
                            result.push(tagObj['name']);
                        }
                    }
                }

                if (result.length > 0) return result;
            }
        }

        for (const value of Object.values(obj)) {
            const found = findTagsInDict(value, depth + 1);
            if (found) return found;
        }
    }

    if (Array.isArray(data)) {
        for (const item of data) {
            const found = findTagsInDict(item, depth + 1);
            if (found) return found;
        }
    }

    return null;
}

/**
 * Determine if a tag should be shown to users.
 * Only includes tags explicitly marked for display or plain strings.
 */
export function isUserFacingTag(tag: JsonValue): boolean {
    if (typeof tag !== 'object' || tag === null || Array.isArray(tag)) {
        return true; // Plain strings pass through
    }

    const tagObj = tag as JsonObject;

    // Only include tags explicitly marked for display (both naming conventions)
    if (tagObj['displayLabel'] === true || tagObj['display_label'] === true) {
        return true;
    }

    return false;
}

// ============================================================================
// Post-Processing / Cleaning Functions
// ============================================================================

/**
 * Clean up recipe title.
 * Capitalizes first letter if entire title is lowercase.
 */
export function cleanTitle(title: string | null): string | null {
    if (!title) return null;
    if (title === title.toLowerCase()) {
        return title.charAt(0).toUpperCase() + title.slice(1);
    }
    return title;
}

/**
 * Validate description is not actually ingredients list.
 * Some sites (e.g., Marmiton) put ingredients in the description field.
 * Returns null if description is mostly ingredients.
 */
export function cleanDescription(
    description: string | null,
    ingredients: string[]
): string | null {
    if (!description) return null;
    if (!ingredients || ingredients.length === 0) return description;

    let cleaned = description.toLowerCase();
    for (const ing of ingredients) {
        const name = ing.toLowerCase().split('(')[0].trim();
        if (name) {
            cleaned = cleaned.replace(name, '');
        }
    }

    // Keep only alphanumeric characters
    cleaned = cleaned.replace(/[^a-z0-9]/g, '');

    // If less than 20 chars remain, it was mostly ingredients
    if (cleaned.length < 20) {
        return null;
    }

    return description;
}

/**
 * Filter keywords to remove ingredients and title.
 * Some sites include ingredients and recipe title in keywords.
 */
export function cleanKeywords(
    keywords: string[] | null,
    ingredients: string[],
    title: string | null
): string[] | null {
    if (!keywords || keywords.length === 0) return null;

    const ingredientNames = new Set<string>();
    for (const ing of ingredients) {
        const name = ing.toLowerCase().split('(')[0].trim();
        if (name) {
            ingredientNames.add(name);
        }
    }

    const titleLower = title?.toLowerCase() ?? '';

    const cleaned: string[] = [];
    for (const kw of keywords) {
        const kwLower = kw.toLowerCase();
        if (kwLower === titleLower) continue;
        if (ingredientNames.has(kwLower)) continue;
        cleaned.push(kw);
    }

    return cleaned.length > 0 ? cleaned : null;
}

// ============================================================================
// Structured Ingredient Extraction
// ============================================================================

/**
 * Try to extract structured ingredients from well-formatted HTML.
 * Includes both main ingredients and kitchen staples (Dans votre cuisine).
 * Returns list of {quantity, unit, name} dicts if structure detected.
 */
export function extractStructuredIngredients(
    html: string
): ParsedIngredient[] | null {
    // Look for ingredient-list class
    const ingListMatch = html.match(
        /<ul[^>]*class=["'][^"']*ingredient-list[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i
    );
    if (!ingListMatch) return null;

    const results: ParsedIngredient[] = [];
    const ingListHtml = ingListMatch[1];

    // Extract main ingredients from list items with spans
    const liMatches = ingListHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    for (const liMatch of liMatches) {
        const liContent = liMatch[1];
        const spans = [...liContent.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)];

        if (spans.length >= 2) {
            const qtyUnit = stripHtml(spans[0][1]).trim();
            const name = stripHtml(spans[1][1]).trim();

            const [quantity, unit] = splitQuantityUnit(qtyUnit);
            results.push({
                quantity,
                unit,
                name: cleanIngredientName(name),
            });
        } else {
            // Structure not as expected, bail out
            return null;
        }
    }

    // Extract kitchen staples (Dans votre cuisine)
    const kitchenListMatch = html.match(
        /<ul[^>]*class=["'][^"']*kitchen-list[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i
    );
    if (kitchenListMatch) {
        const kitchenHtml = kitchenListMatch[1];
        const kitchenLiMatches = kitchenHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);

        for (const liMatch of kitchenLiMatches) {
            const text = stripHtml(liMatch[1]).trim();
            if (text) {
                const [quantity, unit, name] = parseKitchenItem(text);
                results.push({quantity, unit, name});
            }
        }
    }

    return results.length > 0 ? results : null;
}

/**
 * Parse kitchen staple items like "2 càs huile d'olive" or "sel".
 * Returns [quantity, unit, name] tuple.
 */
export function parseKitchenItem(text: string): [string, string, string] {
    text = text.trim();

    // Try to extract quantity and unit from start
    const match = text.match(/^([\d.,/]+)\s*(\S+)\s+(.+)$/);
    if (match) {
        const quantity = match[1].replace(',', '.');
        const unit = match[2];
        const name = cleanIngredientName(match[3]);
        return [quantity, unit, name];
    }

    // No quantity - just a name like "sel" or "poivre"
    return ['', '', cleanIngredientName(text)];
}

/**
 * Split quantity and unit from combined string.
 * Examples: "375 g" → ["375", "g"], "3x" → ["3", "x"]
 */
export function splitQuantityUnit(text: string): [string, string] {
    text = text.trim();
    if (!text) return ['', ''];

    const match = text.match(/^([\d.,/]+)\s*(.*)$/);
    if (match) {
        const quantity = match[1].replace(',', '.');
        const unit = match[2].trim();
        return [quantity, unit];
    }

    return ['', text];
}

/**
 * Clean ingredient name by removing extra whitespace and normalizing.
 */
export function cleanIngredientName(name: string): string {
    // Replace non-breaking spaces with regular spaces
    name = name.replace(/\u00a0/g, ' ');
    // Collapse multiple spaces
    name = name.replace(/\s+/g, ' ');
    return name.trim();
}

// ============================================================================
// Structured Instructions Extraction
// ============================================================================

/**
 * Extract structured instructions with step titles from HTML.
 * Looks for common patterns where recipe steps are grouped with titles.
 */
export function extractStructuredInstructions(
    html: string
): ParsedInstruction[] | null {
    // Common container IDs for recipe instructions
    const containerIds = [
        'preparation-steps',
        'recipe-steps',
        'instructions',
        'method',
        'directions',
    ];

    let containerStart = -1;

    // Find container by ID
    for (const containerId of containerIds) {
        const idMatch = html.match(
            new RegExp(`id=["']${containerId}["']`, 'i')
        );
        if (idMatch && idMatch.index !== undefined) {
            containerStart = idMatch.index;
            break;
        }
    }

    if (containerStart === -1) return null;

    // Extract a large chunk from container (enough for all steps)
    const containerChunk = html.slice(containerStart, containerStart + 5000);

    // Find step divs by class - use position-based extraction
    const stepClasses = ['step', 'toggle', 'instruction', 'etape', 'step-instructions'];
    const stepStartPattern = new RegExp(
        `<div[^>]*class=["'][^"']*(${stepClasses.join('|')})[^"']*["'][^>]*>`,
        'gi'
    );

    // First, collect all step start positions
    const stepStarts: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = stepStartPattern.exec(containerChunk)) !== null) {
        stepStarts.push(match.index + match[0].length);
    }

    if (stepStarts.length === 0) return null;

    const results: ParsedInstruction[] = [];

    for (let i = 0; i < stepStarts.length; i++) {
        const stepStart = stepStarts[i];
        // Extract content from this step to the next step (or 1000 chars if last)
        const nextStepStart = stepStarts[i + 1];
        const stepEnd = nextStepStart !== undefined
            ? nextStepStart - 50  // Back up to not include next step's opening tag
            : stepStart + 1000;
        const stepChunk = containerChunk.slice(stepStart, stepEnd);

        const title = extractStepTitle(stepChunk);
        const instructions = extractStepInstructions(stepChunk);

        if (instructions.length > 0) {
            results.push({title, instructions});
        }
    }

    return results.length > 0 ? results : null;
}

/**
 * Extract step title from a step container HTML.
 */
function extractStepTitle(stepHtml: string): string | null {
    // Try common title patterns: bold paragraphs, headings, strong
    const patterns = [
        /<p[^>]*class=["'][^"']*bold[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,
        /<strong[^>]*>([\s\S]*?)<\/strong>/i,
        /<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/i,
    ];

    for (const pattern of patterns) {
        const match = stepHtml.match(pattern);
        if (match) {
            let title = stripHtml(match[1]).trim();
            // Remove leading patterns like "1. ", "Étape 1:", "Step 2 -"
            title = title.replace(
                /^(\d+[\.\:\-\s]+|[Éé]tape\s*\d*[\.\:\-\s]*|Step\s*\d*[\.\:\-\s]*)/i,
                ''
            );
            title = title.trim();
            return title || null;
        }
    }

    return null;
}

/**
 * Extract instruction texts from list items within a step container.
 */
function extractStepInstructions(stepHtml: string): string[] {
    const instructions: string[] = [];
    const liMatches = stepHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);

    for (const match of liMatches) {
        const text = stripHtml(match[1]).trim();
        if (text) {
            instructions.push(text);
        }
    }

    return instructions;
}

// ============================================================================
// Serving Size Inference
// ============================================================================

/**
 * Infer serving size when missing by finding per-100g nutrition in HTML.
 * Some sites display both per-portion and per-100g nutrition values.
 */
export function inferServingSizeFromHtml(
    html: string,
    nutrients: ScrapedNutrients | null
): ScrapedNutrients | null {
    if (!nutrients) return nutrients;
    if (nutrients.servingSize) return nutrients;

    const perPortionStr = nutrients.calories ?? '';
    const perPortion = extractNumericValue(perPortionStr);
    if (!perPortion) return nutrients;

    const per100gKcal = findPer100gCalories(html);
    if (!per100gKcal || per100gKcal <= 0) return nutrients;

    const servingSize = Math.round((perPortion / per100gKcal) * 100);
    if (servingSize > 0) {
        return {
            ...nutrients,
            servingSize: `${servingSize}g`,
        };
    }

    return nutrients;
}

/**
 * Search HTML for per-100g calorie value.
 */
export function findPer100gCalories(html: string): number {
    // Look for common patterns: tabs/sections with "100g" in id or text
    const tabIds = ['quantity', '100g', 'per100g'];

    for (const tabId of tabIds) {
        const idMatch = html.match(new RegExp(`id=["']${tabId}["']`, 'i'));
        if (idMatch && idMatch.index !== undefined) {
            // Extract a chunk of content after the id (enough to contain nested elements)
            const chunk = html.slice(idMatch.index, idMatch.index + 500);
            const kcal = extractKcalFromSection(chunk);
            if (kcal) return kcal;
        }
    }

    // Look for "100g" markers in text
    const marker100gMatch = html.match(/100g[\s\S]{0,500}?(\d+[\d.,]*)\s*k?cal/i);
    if (marker100gMatch) {
        return extractNumericValue(marker100gMatch[1]);
    }

    return 0;
}

/**
 * Extract kcal value from a nutrition section.
 */
export function extractKcalFromSection(sectionHtml: string): number {
    const labelPatterns = [
        'Énergie (kCal)',
        'Énergie (kcal)',
        'Calories',
        'kcal',
        'kCal',
    ];

    for (const label of labelPatterns) {
        const labelIndex = sectionHtml.indexOf(label);
        if (labelIndex !== -1) {
            // Look for a number after the label
            const afterLabel = sectionHtml.slice(labelIndex + label.length, labelIndex + label.length + 100);
            const numMatch = afterLabel.match(/(\d+[\d.,]*)/);
            if (numMatch) {
                return extractNumericValue(numMatch[1]);
            }
        }
    }

    return 0;
}

/**
 * Extract first number from string like "876kCal" → 876
 */
export function extractNumericValue(text: string): number {
    if (!text) return 0;
    text = text.replace(',', '.').replace(/\s/g, '');
    const match = text.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
}

// ============================================================================
// Image Extraction
// ============================================================================

/**
 * Extract recipe image URL from JSON-LD schema data.
 * Falls back to JSON-LD when standard HTML extraction fails.
 */
export function extractImageFromJsonLd(html: string): string | null {
    const scriptMatch = html.match(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (!scriptMatch) return null;

    try {
        const data = JSON.parse(scriptMatch[1]);
        const recipe = findRecipeInJsonLd(data);

        if (!recipe || !('image' in recipe)) return null;

        const image = recipe.image;

        // Handle string format
        if (typeof image === 'string') {
            return image.toLowerCase().includes('placeholder') ? null : image;
        }

        // Handle array format
        if (Array.isArray(image) && image.length > 0) {
            const first = image[0];
            if (typeof first === 'string') {
                return first.toLowerCase().includes('placeholder') ? null : first;
            }
            if (typeof first === 'object' && first !== null && 'url' in first) {
                const url = (first as JsonObject)['url'] as string;
                return url.toLowerCase().includes('placeholder') ? null : url;
            }
        }

        // Handle object format
        if (typeof image === 'object' && image !== null && 'url' in image) {
            const url = (image as JsonObject)['url'] as string;
            return url.toLowerCase().includes('placeholder') ? null : url;
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Find Recipe object in JSON-LD data (handles @graph, arrays, direct).
 */
function findRecipeInJsonLd(data: JsonValue): JsonObject | null {
    if (typeof data !== 'object' || data === null) return null;

    if (!Array.isArray(data)) {
        const obj = data as JsonObject;
        if (obj['@type'] === 'Recipe') return obj;

        if (Array.isArray(obj['@graph'])) {
            for (const item of obj['@graph'] as JsonArray) {
                if (
                    typeof item === 'object' &&
                    item !== null &&
                    !Array.isArray(item)
                ) {
                    const graphItem = item as JsonObject;
                    if (graphItem['@type'] === 'Recipe') return graphItem;
                }
            }
        }
    }

    if (Array.isArray(data)) {
        for (const item of data) {
            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                const obj = item as JsonObject;
                if (obj['@type'] === 'Recipe') return obj;
            }
        }
    }

    return null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}
