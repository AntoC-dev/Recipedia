import type {ScrapedNutrients, ScrapedRecipe, ScraperResult} from '../types';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

export class SchemaRecipeParser {
    parse(html: string, url: string): ScraperResult {
        try {
            const jsonLdScripts = this.extractJsonLdScripts(html);

            for (const jsonText of jsonLdScripts) {
                try {
                    const json = JSON.parse(jsonText);
                    const recipe = this.findRecipe(json);
                    if (recipe) {
                        return {success: true, data: this.mapToScrapedRecipe(recipe, url, html)};
                    }
                } catch {

                }
            }

            return this.errorResult('NoRecipeFoundError', 'No schema.org Recipe found in HTML');
        } catch (error) {
            return this.errorResult(
                'ParseError',
                error instanceof Error ? error.message : 'Unknown parse error'
            );
        }
    }

    private extractJsonLdScripts(html: string): string[] {
        const scripts: string[] = [];
        const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        let match;

        while ((match = regex.exec(html)) !== null) {
            if (match[1]) {
                scripts.push(match[1].trim());
            }
        }

        return scripts;
    }

    private findRecipe(json: JsonValue): JsonObject | null {
        if (typeof json !== 'object' || json === null) {
            return null;
        }

        if (Array.isArray(json)) {
            for (const item of json) {
                const found = this.findRecipe(item);
                if (found) return found;
            }
            return null;
        }

        const obj = json as JsonObject;

        if (obj['@type'] && this.isRecipeType(obj['@type'])) {
            return obj;
        }

        if (Array.isArray(obj['@graph'])) {
            for (const item of obj['@graph'] as JsonArray) {
                if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    const graphItem = item as JsonObject;
                    if (graphItem['@type'] && this.isRecipeType(graphItem['@type'])) {
                        return graphItem;
                    }
                }
            }
        }

        for (const value of Object.values(obj)) {
            const found = this.findRecipe(value);
            if (found) return found;
        }

        return null;
    }

    private isRecipeType(type: JsonValue): boolean {
        if (typeof type === 'string') {
            return type === 'Recipe' || type.endsWith('/Recipe');
        }
        if (Array.isArray(type)) {
            return type.some(
                t => typeof t === 'string' && (t === 'Recipe' || t.endsWith('/Recipe'))
            );
        }
        return false;
    }

    private mapToScrapedRecipe(recipe: JsonObject, url: string, html: string): ScrapedRecipe {
        return {
            title: this.asString(recipe['name']),
            description: this.asString(recipe['description']),
            ingredients: this.extractIngredients(recipe),
            parsedIngredients: null,
            ingredientGroups: null,
            instructions: this.extractInstructionsString(recipe),
            instructionsList: this.extractInstructionsList(recipe),
            totalTime: this.parseISO8601Duration(recipe['totalTime']),
            prepTime: this.parseISO8601Duration(recipe['prepTime']),
            cookTime: this.parseISO8601Duration(recipe['cookTime']),
            yields: this.extractYields(recipe),
            image: this.extractImage(recipe),
            host: this.extractHost(url),
            canonicalUrl: this.asString(recipe['url']) ?? url,
            siteName: null,
            author: this.extractAuthor(recipe),
            language: this.asString(recipe['inLanguage']),
            category: this.extractStringOrFirst(recipe['recipeCategory']),
            cuisine: this.extractStringOrFirst(recipe['recipeCuisine']),
            cookingMethod: this.extractStringOrFirst(recipe['cookingMethod']),
            keywords: this.extractKeywords(recipe, html),
            dietaryRestrictions: this.extractDietaryRestrictions(recipe),
            ratings: this.extractRating(recipe),
            ratingsCount: this.extractRatingsCount(recipe),
            nutrients: this.extractNutrients(recipe),
            equipment: null,
            links: null,
        };
    }

    private asString(value: JsonValue): string | null {
        return typeof value === 'string' ? value : null;
    }

    private extractHost(urlString: string): string | null {
        try {
            const url = new URL(urlString);
            return url.hostname;
        } catch {
            return null;
        }
    }

    private extractIngredients(recipe: JsonObject): string[] {
        const ingredients = recipe['recipeIngredient'];
        if (Array.isArray(ingredients)) {
            return ingredients.filter((i): i is string => typeof i === 'string');
        }
        if (typeof ingredients === 'string') {
            return [ingredients];
        }
        return [];
    }

    private extractInstructionsString(recipe: JsonObject): string | null {
        const instructions = recipe['recipeInstructions'];
        if (typeof instructions === 'string') {
            return instructions;
        }

        const list = this.extractInstructionsList(recipe);
        if (list && list.length > 0) {
            return list.join('\n');
        }

        return null;
    }

    private extractInstructionsList(recipe: JsonObject): string[] | null {
        const instructions = recipe['recipeInstructions'];
        if (!instructions) return null;

        if (typeof instructions === 'string') {
            const lines = instructions.split('\n').filter(line => line.trim().length > 0);
            return lines.length > 0 ? lines : null;
        }

        if (Array.isArray(instructions)) {
            const result: string[] = [];

            for (const item of instructions) {
                if (typeof item === 'string') {
                    result.push(item);
                } else if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    const step = item as JsonObject;

                    if (typeof step['text'] === 'string') {
                        result.push(step['text']);
                    } else if (typeof step['name'] === 'string') {
                        result.push(step['name']);
                    }

                    if (Array.isArray(step['itemListElement'])) {
                        for (const element of step['itemListElement']) {
                            if (
                                typeof element === 'object' &&
                                element !== null &&
                                !Array.isArray(element)
                            ) {
                                const el = element as JsonObject;
                                if (typeof el['text'] === 'string') {
                                    result.push(el['text']);
                                }
                            }
                        }
                    }
                }
            }

            return result.length > 0 ? result : null;
        }

        return null;
    }

    private parseISO8601Duration(value: JsonValue): number | null {
        if (typeof value !== 'string') return null;

        const match = value.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
        if (!match) return null;

        const days = parseInt(match[1] || '0', 10);
        const hours = parseInt(match[2] || '0', 10);
        const minutes = parseInt(match[3] || '0', 10);

        const totalMinutes = days * 24 * 60 + hours * 60 + minutes;
        return totalMinutes > 0 ? totalMinutes : null;
    }

    private extractYields(recipe: JsonObject): string | null {
        const yields = recipe['recipeYield'];

        if (typeof yields === 'string') {
            return yields;
        }
        if (typeof yields === 'number') {
            return `${yields} servings`;
        }
        if (Array.isArray(yields) && yields.length > 0) {
            const first = yields[0];
            if (typeof first === 'string') {
                return first;
            }
            if (typeof first === 'number') {
                return `${first} servings`;
            }
        }
        return null;
    }

    private extractImage(recipe: JsonObject): string | null {
        const image = recipe['image'];

        if (typeof image === 'string') {
            return image;
        }
        if (typeof image === 'object' && image !== null && !Array.isArray(image)) {
            const imgObj = image as JsonObject;
            if (typeof imgObj['url'] === 'string') {
                return imgObj['url'];
            }
        }
        if (Array.isArray(image) && image.length > 0) {
            const first = image[0];
            if (typeof first === 'string') {
                return first;
            }
            if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
                const imgObj = first as JsonObject;
                if (typeof imgObj['url'] === 'string') {
                    return imgObj['url'];
                }
            }
        }
        return null;
    }

    private extractAuthor(recipe: JsonObject): string | null {
        const author = recipe['author'];

        if (typeof author === 'string') {
            return author;
        }
        if (typeof author === 'object' && author !== null && !Array.isArray(author)) {
            const authorObj = author as JsonObject;
            if (typeof authorObj['name'] === 'string') {
                return authorObj['name'];
            }
        }
        if (Array.isArray(author) && author.length > 0) {
            const first = author[0];
            if (typeof first === 'string') {
                return first;
            }
            if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
                const authorObj = first as JsonObject;
                if (typeof authorObj['name'] === 'string') {
                    return authorObj['name'];
                }
            }
        }
        return null;
    }

    private extractStringOrFirst(value: JsonValue): string | null {
        if (typeof value === 'string') {
            return value;
        }
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
            return value[0];
        }
        return null;
    }

    private extractKeywords(recipe: JsonObject, html?: string): string[] | null {
        const keywords = recipe['keywords'];

        if (typeof keywords === 'string') {
            return keywords.split(',').map(k => k.trim());
        }
        if (Array.isArray(keywords)) {
            const result = keywords.filter((k): k is string => typeof k === 'string');
            if (result.length > 0) return result;
        }

        // Fallback: extract from __NEXT_DATA__ if available
        if (html) {
            const nextDataKeywords = this.extractKeywordsFromNextData(html);
            if (nextDataKeywords && nextDataKeywords.length > 0) {
                return nextDataKeywords;
            }
        }

        return null;
    }

    private extractKeywordsFromNextData(html: string): string[] | null {
        const regex = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i;
        const match = regex.exec(html);
        if (!match || !match[1]) return null;

        try {
            const data = JSON.parse(match[1]);
            return this.findTagsInDict(data);
        } catch {
            return null;
        }
    }

    private findTagsInDict(data: JsonValue, depth = 0): string[] | null {
        if (depth > 10) return null;

        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            const obj = data as JsonObject;

            for (const key of ['tags', 'labels']) {
                if (Array.isArray(obj[key])) {
                    const tags = obj[key] as JsonArray;
                    const result: string[] = [];

                    for (const tag of tags) {
                        if (!this.isUserFacingTag(tag)) continue;

                        if (typeof tag === 'string' && tag) {
                            result.push(tag);
                        } else if (typeof tag === 'object' && tag !== null && !Array.isArray(tag)) {
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
                const found = this.findTagsInDict(value, depth + 1);
                if (found) return found;
            }
        }

        if (Array.isArray(data)) {
            for (const item of data) {
                const found = this.findTagsInDict(item, depth + 1);
                if (found) return found;
            }
        }

        return null;
    }

    private isUserFacingTag(tag: JsonValue): boolean {
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

    private extractDietaryRestrictions(recipe: JsonObject): string[] | null {
        const suitable = recipe['suitableForDiet'];
        if (!suitable) return null;

        if (typeof suitable === 'string') {
            return [this.cleanDietName(suitable)];
        }
        if (Array.isArray(suitable)) {
            const result = suitable
                .filter((d): d is string => typeof d === 'string')
                .map(d => this.cleanDietName(d));
            return result.length > 0 ? result : null;
        }
        return null;
    }

    private cleanDietName(diet: string): string {
        return diet
            .replace('https://schema.org/', '')
            .replace('http://schema.org/', '');
    }

    private extractRating(recipe: JsonObject): number | null {
        const rating = recipe['aggregateRating'];
        if (typeof rating !== 'object' || rating === null || Array.isArray(rating)) {
            return null;
        }

        const ratingObj = rating as JsonObject;
        const value = ratingObj['ratingValue'];

        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? null : parsed;
        }
        return null;
    }

    private extractRatingsCount(recipe: JsonObject): number | null {
        const rating = recipe['aggregateRating'];
        if (typeof rating !== 'object' || rating === null || Array.isArray(rating)) {
            return null;
        }

        const ratingObj = rating as JsonObject;

        for (const key of ['ratingCount', 'reviewCount']) {
            const value = ratingObj[key];
            if (typeof value === 'number') {
                return value;
            }
            if (typeof value === 'string') {
                const parsed = parseInt(value, 10);
                if (!isNaN(parsed)) return parsed;
            }
        }
        return null;
    }

    private extractNutrients(recipe: JsonObject): ScrapedNutrients | null {
        const nutrition = recipe['nutrition'];
        if (typeof nutrition !== 'object' || nutrition === null || Array.isArray(nutrition)) {
            return null;
        }

        const nutritionObj = nutrition as JsonObject;
        const result: ScrapedNutrients = {};

        const mapping = [
            'calories',
            'carbohydrateContent',
            'proteinContent',
            'fatContent',
            'fiberContent',
            'sodiumContent',
            'sugarContent',
            'saturatedFatContent',
            'cholesterolContent',
            'servingSize',
        ];

        for (const key of mapping) {
            const value = nutritionObj[key];
            if (typeof value === 'string') {
                result[key] = value;
            } else if (typeof value === 'number') {
                result[key] = String(value);
            }
        }

        return Object.keys(result).length > 0 ? result : null;
    }

    private errorResult(type: string, message: string): ScraperResult {
        return {
            success: false,
            error: {type, message},
        };
    }
}
